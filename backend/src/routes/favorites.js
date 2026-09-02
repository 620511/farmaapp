const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth(), async (req, res, next) => {
  try {
    const favs = await prisma.favorite.findMany({ where: { userId: req.user.id }, include: { product: true } });
    res.json(favs);
  } catch (e) { next(e); }
});

router.post('/', auth(), async (req, res, next) => {
  try {
    const { productId } = req.body;
    const fav = await prisma.favorite.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId }
    });
    res.status(201).json(fav);
  } catch (e) { next(e); }
});

router.delete('/:productId', auth(), async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({ where: { userId: req.user.id, productId: req.params.productId } });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
