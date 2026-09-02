const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

const server = http.createServer(app);
initSocket(server, allowedOrigins);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Farma.APP API rodando na porta ${PORT}`));
