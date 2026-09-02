const rateLimit = require('express-rate-limit');

// Limite geral pra API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

// Limite mais rígido pra login/registro (evita força bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' }
});

// Limite pra rotas que chamam a IA (custo por chamada)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de análises de receita atingido. Tente novamente em 1 hora.' }
});

// Limite pro chat com a Bia — mais generoso, é uma conversa curta
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas mensagens no chat. Tente novamente em alguns minutos.' }
});

module.exports = { apiLimiter, authLimiter, aiLimiter, chatLimiter };
