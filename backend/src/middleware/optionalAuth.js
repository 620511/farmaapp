const jwt = require('jsonwebtoken');

// Igual ao middleware de auth, mas nunca bloqueia a requisição — usado nas
// rotas que funcionam tanto logado quanto no modo convidado (chat, recomendações).
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();
  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // token inválido/expirado — segue como visitante, sem derrubar a requisição
  }
  next();
}

module.exports = optionalAuth;
