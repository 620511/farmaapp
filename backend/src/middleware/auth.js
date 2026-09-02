const jwt = require('jsonwebtoken');

function auth(requiredRoles) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Token não enviado' });
    const token = header.replace('Bearer ', '');
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      if (requiredRoles && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ error: 'Acesso negado para este perfil' });
      }
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  };
}

module.exports = auth;
