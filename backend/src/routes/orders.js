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
    const { deliveryStreet, deliveryCity, deliveryLat, deliveryLng } = req.body;
    if (!deliveryStreet || !deliveryCity) return res.status(400).json({ error: 'Informe o endereço de entrega' });

    const cartItems = await prisma.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true } });
    if (cartItems.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });

    const byPharmacy = {};
    for (const item of cartItems) {
      const pid = item.product.pharmacyId;
      if (!byPharmacy[pid]) byPharmacy[pid] = [];
      byPharmacy[pid].push(item);
    }

    let coords = deliveryLat && deliveryLng ? { latitude: deliveryLat, longitude: deliveryLng } : null;
    if (!coords) coords = await geocodeAddress(`${deliveryStreet}, ${deliveryCity}`);

    const settings = await getSettings();

    const createdOrders = [];
    for (const pharmacyId of Object.keys(byPharmacy)) {
      const items = byPharmacy[pharmacyId];
      const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

      const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
      let distanceKm = null;
      if (coords && pharmacy?.latitude && pharmacy?.longitude) {
        distanceKm = haversineDistanceKm(pharmacy.latitude, pharmacy.longitude, coords.latitude, coords.longitude);
      }
      const deliveryFee = calculateDeliveryFee(distanceKm, subtotal);

      // Taxa da plataforma incide sobre o subtotal dos produtos (não sobre o frete,
      // que fica inteiro com a farmácia para cobrir o custo da entrega).
      const platformFeePercent = settings.platformFeePercent;
      const platformFeeAmount = Math.round(subtotal * (platformFeePercent / 100) * 100) / 100;
      const pharmacyPayout = Math.round((subtotal - platformFeeAmount + deliveryFee) * 100) / 100;

      const order = await prisma.order.create({
        data: {
          userId: req.user.id,
          pharmacyId,
          subtotal,
          deliveryFee,
          distanceKm,
          platformFeePercent,
          platformFeeAmount,
          pharmacyPayout,
          total: subtotal + deliveryFee,
          deliveryStreet,
          deliveryCity,
          deliveryLat: coords?.latitude,
          deliveryLng: coords?.longitude,
          items: { create: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.product.price })) }
        },
        include: { items: { include: { product: true } }, pharmacy: true }
      });
      createdOrders.push(order);
      emitToPharmacy(pharmacyId, 'new-order', { orderId: order.id });
    }
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.status(201).json(createdOrders);
  } catch (e) { next(e); }
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
    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });
    res.json(order);
  } catch (e) { next(e); }
});

router.put('/:id/status', auth(['PHARMACY', 'ADMIN']), async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (req.user.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacy.findUnique({ where: { ownerId: req.user.id } });
      if (!pharmacy || pharmacy.id !== order.pharmacyId) return res.status(403).json({ error: 'Acesso negado' });
    }
    const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status }, include: { user: true } });
    notifyOrderStatus(updated, updated.user).catch(() => {});
    emitToUser(updated.userId, 'order-status', { orderId: updated.id, status: updated.status });
    res.json(updated);
  } catch (e) { next(e); }
});

module.exports = router;
