const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

let io = null;

// Inicializa o Socket.io em cima do servidor HTTP já existente (mesmo processo/porta da API).
// Cada usuário entra automaticamente numa "sala" com o próprio id, e farmácias
// também entram numa sala com o id da farmácia — assim dá pra mandar eventos
// só pra quem interessa (o cliente do pedido, ou a farmácia responsável).
function initSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length === 0 ? true : allowedOrigins,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // conexão anônima é permitida (modo convidado só não recebe eventos privados)
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch {
      next(); // token inválido não derruba a conexão, só não autentica
    }
  });

  io.on('connection', (socket) => {
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }
    socket.on('join-pharmacy', (pharmacyId) => {
      if (socket.user?.role === 'PHARMACY' || socket.user?.role === 'ADMIN') socket.join(`pharmacy:${pharmacyId}`);
    });
  });

  return io;
}

function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}

function emitToPharmacy(pharmacyId, event, payload) {
  if (io) io.to(`pharmacy:${pharmacyId}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser, emitToPharmacy };
