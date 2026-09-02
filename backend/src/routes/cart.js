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
    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { quantity: { increment: quantity || 1 } },
      create: { userId: req.user.id, productId, quantity: quantity || 1 }
    });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.put('/:id', auth(), async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.userId !== req.user.id) return res.status(404).json({ error: 'Item não encontrado' });
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: req.params.id } });
      return res.status(204).end();
    }
    const updated = await prisma.cartItem.update({ where: { id: req.params.id }, data: { quantity } });
    res.json(updated);
  } catch (e) { next(e); }
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
