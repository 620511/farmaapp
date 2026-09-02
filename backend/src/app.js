require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { authLimiter, aiLimiter, apiLimiter } = require('./middleware/rateLimit');

// Monitoramento de erros (opcional) — defina SENTRY_DSN no .env para habilitar.
// Sem a variável, o app funciona normalmente sem enviar nada a lugar nenhum.
let Sentry = null;
if (process.env.SENTRY_DSN) {
  Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'development', tracesSampleRate: 0.2 });
}

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const pharmacyRoutes = require('./routes/pharmacies');
const favoriteRoutes = require('./routes/favorites');
const addressRoutes = require('./routes/addresses');
const adminRoutes = require('./routes/admin');
const prescriptionRoutes = require('./routes/prescriptions');
const paymentRoutes = require('./routes/payments');
const uploadRoutes = require('./routes/uploads');
const chatRoutes = require('./routes/chat');

const app = express();
app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'production') {
  const weakSecret = !process.env.JWT_SECRET || process.env.JWT_SECRET === 'farmaapp_super_secret_change_me' || process.env.JWT_SECRET.length < 24;
  if (weakSecret) {
    console.error('JWT_SECRET ausente ou fraco. Defina uma string aleatória forte (ex.: openssl rand -hex 32) antes de subir em produção.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não definida.');
    process.exit(1);
  }
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Em produção, defina ALLOWED_ORIGINS com a(s) URL(s) do frontend, separadas por vírgula.
// Ex.: ALLOWED_ORIGINS="https://farma.app,https://www.farma.app"
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // apps mobile / curl / same-origin
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true
}));

// O webhook do Mercado Pago precisa do corpo bruto — cadastrado antes do express.json()
app.use('/api/payments/webhook', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/', apiLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Farma.APP API' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prescriptions', aiLimiter, prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/chat', chatRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

app.use((err, req, res, next) => {
  console.error(err);
  if (Sentry) Sentry.captureException(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

module.exports = app;
