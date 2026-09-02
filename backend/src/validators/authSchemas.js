const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(6, 'Senha precisa ter pelo menos 6 caracteres').max(72),
  phone: z.string().trim().max(20).optional().nullable()
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha')
});

module.exports = { registerSchema, loginSchema };
