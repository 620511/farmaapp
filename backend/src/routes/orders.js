const createdOrders = [];

await prisma.$transaction(
  async (tx) => {
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

      // Reserva/baixa o estoque de forma segura
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

          total:
            Math.round(
              (subtotal + deliveryFee) * 100
            ) / 100,

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
    }

    // Só limpa o carrinho depois que todos os pedidos
    // e a baixa do estoque forem concluídos.
    await tx.cartItem.deleteMany({
      where: {
        userId: req.user.id
      }
    });
  },
  {
    timeout: 15000
  }
);

// Só avisa as farmácias depois que a transação terminou
for (const order of createdOrders) {
  emitToPharmacy(
    order.pharmacyId,
    'new-order',
    {
      orderId: order.id
    }
  );
}

res.status(201).json(createdOrders);