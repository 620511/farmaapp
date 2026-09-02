const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/authSchemas');

const router = express.Router();

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, phone, passwordHash, role: 'CUSTOMER' } });
    res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
    res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

router.get('/me', auth(), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  } catch (e) { next(e); }
});

// Exclusão de conta (LGPD, direito de eliminação). Remove dados pessoais e
// sensíveis (endereços, favoritos, carrinho, receitas médicas com a imagem).
// Os pedidos são mantidos anonimizados, pois há obrigação legal/contábil de
// guardar histórico de transações — o vínculo com dados pessoais é removido.
router.delete('/me', auth(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    await prisma.$transaction([
      prisma.prescription.deleteMany({ where: { userId } }),
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.cartItem.deleteMany({ where: { userId } }),
      prisma.address.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          name: 'Usuário removido',
          email: `removido-${userId}@farmaapp.local`,
          phone: null,
          passwordHash: crypto.randomBytes(32).toString('hex')
        }
      })
    ]);
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
