const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth(), async (req, res, next) => {
  try {
    const items = await prisma.cartItem.findMany({ where: { userId: req.user.id }, include: { product: { include: { pharmacy: true } } } });
    res.json(items);
  } catch (e) { next(e); }
});

router.post('/', auth(), async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const requestedQuantity = Number(quantity);

    if (!productId) {
      return res.status(400).json({ error: 'Produto é obrigatório' });
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser um número inteiro maior que zero' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (!product.isActive) {
      return res.status(400).json({ error: 'Produto não está disponível' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ error: 'Produto sem estoque' });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId
        }
      }
    });

    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantity + requestedQuantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        error: 'Quantidade solicitada maior que o estoque disponível',
        stock: product.stock,
        currentQuantity,
        requestedQuantity,
        availableToAdd: Math.max(product.stock - currentQuantity, 0)
      });
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId
        }
      },
      update: {
        quantity: newQuantity
      },
      create: {
        userId: req.user.id,
        productId,
        quantity: requestedQuantity
      }
    });

    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', auth(), async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const requestedQuantity = Number(quantity);

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: { product: true }
    });

    if (!item || item.userId !== req.user.id) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    if (!Number.isInteger(requestedQuantity)) {
      return res.status(400).json({
        error: 'Quantidade deve ser um número inteiro'
      });
    }

    if (requestedQuantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: req.params.id }
      });

      return res.status(204).end();
    }

    if (!item.product.isActive) {
      return res.status(400).json({
        error: 'Produto não está disponível'
      });
    }

    if (requestedQuantity > item.product.stock) {
      return res.status(400).json({
        error: 'Quantidade solicitada maior que o estoque disponível',
        stock: item.product.stock,
        requestedQuantity
      });
    }

    const updated = await prisma.cartItem.update({
      where: { id: req.params.id },
      data: { quantity: requestedQuantity }
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const item = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.userId !== req.user.id) return res.status(404).json({ error: 'Item não encontrado' });
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

router.delete('/', auth(), async (req, res, next) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
