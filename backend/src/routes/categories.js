const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (e) { next(e); }
});

router.post('/', auth(['ADMIN']), async (req, res, next) => {
  try {
    const { name, icon } = req.body;
    const category = await prisma.category.create({ data: { name, icon } });
    res.status(201).json(category);
  } catch (e) { next(e); }
});

router.delete('/:id', auth(['ADMIN']), async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
