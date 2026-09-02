const express = require('express');
const crypto = require('crypto');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { notifyOrderStatus } = require('../utils/mailer');
const { emitToUser, emitToPharmacy } = require('../socket');

const router = express.Router();

function getClient() {
  if (!process.env.MP_ACCESS_TOKEN) return null;
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
}

// Cria uma preferência de pagamento (checkout) para um pedido já criado
router.post('/preference', auth(['CUSTOMER']), async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } });
    if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Pedido não encontrado' });

    const client = getClient();
    if (!client) return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no servidor' });

    const preference = new Preference(client);
    const items = order.items.map((i) => ({
      id: i.productId,
      title: i.product.name,
      quantity: i.quantity,
      unit_price: i.price,
      currency_id: 'BRL'
    }));
    if (order.deliveryFee > 0) {
      items.push({ id: 'frete', title: 'Taxa de entrega', quantity: 1, unit_price: order.deliveryFee, currency_id: 'BRL' });
    }

    const result = await preference.create({
      body: {
        items,
        external_reference: order.id,
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/pedidos`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/checkout`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/pedidos`
        },
        auto_return: 'approved',
        notification_url: process.env.MP_WEBHOOK_URL || undefined
      }
    });

    await prisma.order.update({ where: { id: order.id }, data: { mpPreferenceId: result.id, paymentMethod: 'mercado_pago' } });

    res.json({ preferenceId: result.id, initPoint: result.init_point, sandboxInitPoint: result.sandbox_init_point });
  } catch (e) { next(e); }
});

// Webhook do Mercado Pago (notificações de pagamento). Configure a notification_url
// apontando pra <sua_api>/api/payments/webhook no painel de integrações do Mercado Pago.
router.post('/webhook', async (req, res, next) => {
  try {
    // Valida a assinatura quando o segredo estiver configurado (recomendado em produção)
    if (process.env.MP_WEBHOOK_SECRET) {
      const signature = req.headers['x-signature'];
      const requestId = req.headers['x-request-id'];
      if (!signature || !requestId) return res.status(401).end();
      // Validação simplificada — para produção, siga o guia oficial de assinatura do Mercado Pago.
    }

    const body = JSON.parse(req.body.toString('utf8') || '{}');
    const paymentId = body?.data?.id;
    if (!paymentId) return res.status(200).end();

    const client = getClient();
    if (!client) return res.status(200).end();

    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });
    const orderId = paymentInfo.external_reference;
    if (!orderId) return res.status(200).end();

    let paymentStatus = 'PENDING';
    if (paymentInfo.status === 'approved') paymentStatus = 'PAID';
    else if (['rejected', 'cancelled'].includes(paymentInfo.status)) paymentStatus = 'FAILED';
    else if (paymentInfo.status === 'refunded') paymentStatus = 'REFUNDED';

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        mpPaymentId: String(paymentId),
        status: paymentStatus === 'PAID' ? 'CONFIRMED' : undefined
      },
      include: { user: true }
    });
    if (paymentStatus === 'PAID') notifyOrderStatus(updatedOrder, updatedOrder.user).catch(() => {});
    emitToUser(updatedOrder.userId, 'order-status', { orderId: updatedOrder.id, status: updatedOrder.status, paymentStatus: updatedOrder.paymentStatus });
    emitToPharmacy(updatedOrder.pharmacyId, 'order-status', { orderId: updatedOrder.id, status: updatedOrder.status, paymentStatus: updatedOrder.paymentStatus });

    res.status(200).end();
  } catch (e) { next(e); }
});

// Status do pagamento de um pedido (o frontend pode fazer polling após voltar do checkout)
router.get('/status/:orderId', auth(), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });
    res.json({ paymentStatus: order.paymentStatus, status: order.status });
  } catch (e) { next(e); }
});

module.exports = router;
