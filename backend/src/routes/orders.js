const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { haversineDistanceKm, geocodeAddress, calculateDeliveryFee } = require('../utils/geo');
const { notifyOrderStatus } = require('../utils/mailer');
const { getSettings } = require('../utils/settings');
const { emitToUser, emitToPharmacy } = require('../socket');
const router = express.Router();

router.post('/', auth(), async (req, res, next) => {
  try {
    const {
      deliveryStreet,
      deliveryCity,
      deliveryLat,
      deliveryLng
    } = req.body;

    if (!deliveryStreet || !deliveryCity) {
      return res.status(400).json({
        error: 'Informe o endereço de entrega'
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        product: true
      }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: 'Carrinho vazio'
      });
    }

    // Verifica produtos antes de criar qualquer pedido
    for (const item of cartItems) {
      if (!item.product) {
        return res.status(400).json({
          error: 'Produto do carrinho não encontrado'
        });
      }

      if (!item.product.isActive) {
        return res.status(400).json({
          error: `Produto "${item.product.name}" não está disponível`
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          error: 'Quantidade inválida no carrinho'
        });
      }

      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          error: `Estoque insuficiente para "${item.product.name}"`,
          stock: item.product.stock,
          requestedQuantity: item.quantity
        });
      }
    }

    const byPharmacy = {};

    for (const item of cartItems) {
      const pharmacyId = item.product.pharmacyId;

      if (!byPharmacy[pharmacyId]) {
        byPharmacy[pharmacyId] = [];
      }

      byPharmacy[pharmacyId].push(item);
    }

    let coords =
      deliveryLat !== undefined &&
      deliveryLng !== undefined &&
      deliveryLat !== null &&
      deliveryLng !== null
        ? {
            latitude: Number(deliveryLat),
            longitude: Number(deliveryLng)
          }
        : null;

    if (!coords) {
      coords = await geocodeAddress(
        `${deliveryStreet}, ${deliveryCity}`
      );
    }

    const settings = await getSettings();

    const createdOrders = [];

    await prisma.$transaction(async (tx) => {
      for (const pharmacyId of Object.keys(byPharmacy)) {
        const items = byPharmacy[pharmacyId];

        const pharmacy = await tx.pharmacy.findUnique({
          where: {
            id: pharmacyId
          }
        });

        if (!pharmacy || !pharmacy.isActive) {
          throw new Error('Farmácia não está disponível');
        }

        let distanceKm = null;

        if (
          coords &&
          pharmacy.latitude &&
          pharmacy.longitude
        ) {
          distanceKm = haversineDistanceKm(
            pharmacy.latitude,
            pharmacy.longitude,
            coords.latitude,
            coords.longitude
          );
        }

        const subtotal = Math.round(
  items.reduce(
    (sum, item) =>
      sum + Number(item.product.price) * item.quantity,
    0
  ) * 100
) / 100;

        const deliveryFee = Math.round(
  Number(
    calculateDeliveryFee(
      distanceKm,
      subtotal
    )
  ) * 100
) / 100;

        const platformFeePercent =
          Number(settings.platformFeePercent);

        const platformFeeAmount =
          Math.round(
            subtotal *
              (platformFeePercent / 100) *
              100
          ) / 100;

        const pharmacyPayout =
          Math.round(
            (
              subtotal -
              platformFeeAmount +
              deliveryFee
            ) * 100
          ) / 100;

        // Reserva/baixa o estoque de forma segura.
        for (const item of items) {
          const stockUpdate = await tx.product.updateMany({
            where: {
              id: item.productId,
              isActive: true,
              stock: {
                gte: item.quantity
              }
            },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });

          if (stockUpdate.count !== 1) {
            throw new Error(
              `Estoque insuficiente para "${item.product.name}"`
            );
          }
        }

        const order = await tx.order.create({
          data: {
            userId: req.user.id,
            pharmacyId,

            subtotal,
            deliveryFee,
            distanceKm,

            platformFeePercent,
            platformFeeAmount,
            pharmacyPayout,

            total: Math.round((subtotal + deliveryFee) * 100) / 100,

            deliveryStreet,
            deliveryCity,
            deliveryLat: coords?.latitude,
            deliveryLng: coords?.longitude,

            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price
              }))
            }
          },

          include: {
            items: {
              include: {
                product: true
              }
            },
            pharmacy: true
          }
        });

        createdOrders.push(order);

        emitToPharmacy(
          pharmacyId,
          'new-order',
          {
            orderId: order.id
          }
        );
      }

      // Só limpa o carrinho depois que os pedidos
      // e a baixa do estoque forem concluídos.
      await tx.cartItem.deleteMany({
        where: {
          userId: req.user.id
        }
      });
    });

    res.status(201).json(createdOrders);

      } catch (e) {
    if (
      e.message?.includes('Estoque insuficiente') ||
      e.message?.includes('Farmácia não está disponível')
    ) {
      return res.status(400).json({
        error: e.message
      });
    }

    next(e);
  }
});

router.get('/', auth(), async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'CUSTOMER') where.userId = req.user.id;
    if (req.user.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacy.findUnique({ where: { ownerId: req.user.id } });
      where.pharmacyId = pharmacy ? pharmacy.id : '__none__';
    }
    const orders = await prisma.order.findMany({ where, include: { items: { include: { product: true } }, pharmacy: true }, orderBy: { createdAt: 'desc' } });
    res.json(orders);
  } catch (e) { next(e); }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: { include: { product: true } }, pharmacy: true } });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (req.user.role === 'CUSTOMER') {
  if (order.userId !== req.user.id) {
    return res.status(403).json({
      error: 'Acesso negado'
    });
  }
}

if (req.user.role === 'PHARMACY') {
  const pharmacy = await prisma.pharmacy.findUnique({
    where: {
      ownerId: req.user.id
    }
  });

  if (!pharmacy || order.pharmacyId !== pharmacy.id) {
    return res.status(403).json({
      error: 'Acesso negado'
    });
  }
}

res.json(order);
  } catch (e) { next(e); }
});

router.put('/:id/status', auth(['PHARMACY', 'ADMIN']), async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        allowedStatuses
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado'
      });
    }

    // =========================
    // SEGURANÇA DA FARMÁCIA
    // =========================
    if (req.user.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: {
          ownerId: req.user.id
        }
      });

      if (!pharmacy || pharmacy.id !== order.pharmacyId) {
        return res.status(403).json({
          error: 'Acesso negado'
        });
      }
    }

    // =========================
    // TRANSIÇÕES PERMITIDAS
    // =========================
    const transitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: []
    };

    if (!transitions[order.status].includes(status)) {
      return res.status(400).json({
        error: 'Transição de status não permitida',
        currentStatus: order.status,
        requestedStatus: status,
        allowedNextStatuses: transitions[order.status]
      });
    }

    const updated = await prisma.order.update({
      where: {
        id: req.params.id
      },
      data: {
        status
      },
      include: {
        user: true
      }
    });

    notifyOrderStatus(updated, updated.user).catch(() => {});

    emitToUser(
      updated.userId,
      'order-status',
      {
        orderId: updated.id,
        status: updated.status
      }
    );

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
