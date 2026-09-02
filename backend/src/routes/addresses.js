const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth(), async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
    res.json(addresses);
  } catch (e) { next(e); }
});

router.post('/', auth(), async (req, res, next) => {
  try {
    const { label, street, number, district, city, state, zip, isDefault } = req.body;
    const address = await prisma.address.create({ data: { userId: req.user.id, label, street, number, district, city, state, zip, isDefault: !!isDefault } });
    res.status(201).json(address);
  } catch (e) { next(e); }
});

router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const addr = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!addr || addr.userId !== req.user.id) return res.status(404).json({ error: 'Endereço não encontrado' });
    await prisma.address.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
