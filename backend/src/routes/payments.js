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

  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
  });
}

/**
 * Valida a assinatura enviada pelo Mercado Pago.
 *
 * O Mercado Pago envia:
 * x-signature: ts=...,v1=...
 * x-request-id: ...
 *
 * O manifest usado para calcular o HMAC é:
 * id:{data.id};request-id:{x-request-id};ts:{ts};
 */
function validateWebhookSignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;

  // Em desenvolvimento podemos permitir sem segredo.
  // Em produção, o segredo deve obrigatoriamente existir.
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('MP_WEBHOOK_SECRET não configurado em produção.');
      return false;
    }

    return true;
  }

  const signature = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];

  if (!signature || !requestId || !dataId) {
    return false;
  }

  const parts = {};

  for (const part of String(signature).split(',')) {
    const [key, value] = part.split('=');

    if (key && value) {
      parts[key.trim()] = value.trim();
    }
  }

  const ts = parts.ts;
  const receivedHash = parts.v1;

  if (!ts || !receivedHash) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'utf8'),
      Buffer.from(receivedHash, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Cria preferência de pagamento para um pedido.
 */
router.post('/preference', auth(['CUSTOMER']), async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        error: 'orderId é obrigatório'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Pedido não encontrado'
      });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({
        error: 'Não é possível pagar um pedido cancelado'
      });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({
        error: 'Pedido já está pago'
      });
    }

    if (!order.items.length) {
      return res.status(400).json({
        error: 'Pedido sem itens'
      });
    }

    const client = getClient();

    if (!client) {
      return res.status(500).json({
        error: 'MP_ACCESS_TOKEN não configurado no servidor'
      });
    }

    const preference = new Preference(client);

    const items = order.items.map((item) => ({
      id: item.productId,
      title: item.product.name,
      quantity: item.quantity,
      unit_price: Number(item.price),
      currency_id: 'BRL'
    }));

    if (Number(order.deliveryFee) > 0) {
      items.push({
        id: 'frete',
        title: 'Taxa de entrega',
        quantity: 1,
        unit_price: Number(order.deliveryFee),
        currency_id: 'BRL'
      });
    }

    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173';

    const preferenceData = {
      items,

      external_reference: order.id,

      back_urls: {
        success: `${frontendUrl}/app/pedidos`,
        failure: `${frontendUrl}/app/checkout`,
        pending: `${frontendUrl}/app/pedidos`
      },

      auto_return: 'approved',

      notification_url:
        process.env.MP_WEBHOOK_URL || undefined
    };

    const result = await preference.create({
      body: preferenceData
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPreferenceId: result.id,
        paymentMethod: 'mercado_pago'
      }
    });

    res.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Webhook do Mercado Pago.
 *
 * IMPORTANTE:
 * Esta rota recebe o corpo bruto porque o app.js
 * usa express.raw() antes do express.json().
 */
router.post('/webhook', async (req, res, next) => {
  try {
    let body = {};

    try {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : JSON.stringify(req.body || {});

      body = JSON.parse(rawBody || '{}');
    } catch {
      return res.status(400).json({
        error: 'Payload inválido'
      });
    }

    /*
     * O Mercado Pago pode enviar o ID no body:
     *
     * {
     *   "data": {
     *     "id": "123456789"
     *   }
     * }
     *
     * ou através da query:
     *
     * ?data.id=123456789
     */
    const paymentId =
      body?.data?.id ||
      req.query['data.id'] ||
      req.query.id;

    if (!paymentId) {
      // Notificação que não é de pagamento.
      return res.status(200).end();
    }

    /*
     * Validação criptográfica da assinatura.
     */
    const validSignature = validateWebhookSignature(
      req,
      String(paymentId)
    );

    if (!validSignature) {
      console.error('Webhook Mercado Pago: assinatura inválida.');
      return res.status(401).json({
        error: 'Assinatura inválida'
      });
    }

    const client = getClient();

    if (!client) {
      console.error(
        'Webhook Mercado Pago: MP_ACCESS_TOKEN não configurado.'
      );

      return res.status(503).end();
    }

    /*
     * Consulta o pagamento diretamente no Mercado Pago.
     * Nunca confiamos somente no conteúdo enviado pelo webhook.
     */
    const payment = new Payment(client);

    const paymentInfo = await payment.get({
      id: paymentId
    });

    if (!paymentInfo) {
      return res.status(200).end();
    }

    const orderId = paymentInfo.external_reference;

    if (!orderId) {
      console.error(
        `Pagamento ${paymentId} sem external_reference.`
      );

      return res.status(200).end();
    }

    const order = await prisma.order.findUnique({
      where: {
        id: String(orderId)
      }
    });

    if (!order) {
      console.error(
        `Pedido ${orderId} não encontrado para pagamento ${paymentId}.`
      );

      return res.status(200).end();
    }

    /*
     * Confere moeda.
     */
    if (
      paymentInfo.currency_id &&
      paymentInfo.currency_id !== 'BRL'
    ) {
      console.error(
        `Pagamento ${paymentId} possui moeda inválida: ${paymentInfo.currency_id}`
      );

      return res.status(400).end();
    }

    /*
     * Confere o valor pago.
     *
     * Isso impede que um pagamento de R$ 1,00,
     * por exemplo, seja utilizado para quitar
     * um pedido de R$ 100,00.
     */
    if (paymentInfo.transaction_amount !== undefined) {
      const paidAmount =
        Math.round(Number(paymentInfo.transaction_amount) * 100) / 100;

      const orderAmount =
        Math.round(Number(order.total) * 100) / 100;

      if (
        !Number.isFinite(paidAmount) ||
        paidAmount !== orderAmount
      ) {
        console.error(
          `Valor divergente no pagamento ${paymentId}. Pedido=${orderAmount}, Pago=${paidAmount}`
        );

        return res.status(400).json({
          error: 'Valor do pagamento não corresponde ao pedido'
        });
      }
    }

    /*
     * Confere se a referência realmente corresponde
     * ao pedido.
     */
    if (String(paymentInfo.external_reference) !== String(order.id)) {
      console.error(
        `external_reference inválido no pagamento ${paymentId}.`
      );

      return res.status(400).end();
    }

    /*
     * Determina o status interno.
     */
    let paymentStatus = 'PENDING';

    switch (paymentInfo.status) {
      case 'approved':
        paymentStatus = 'PAID';
        break;

      case 'rejected':
      case 'cancelled':
        paymentStatus = 'FAILED';
        break;

      case 'refunded':
        paymentStatus = 'REFUNDED';
        break;

      case 'pending':
      case 'in_process':
      case 'in_mediation':
      default:
        paymentStatus = 'PENDING';
        break;
    }

    /*
     * Não permitimos que um webhook de pagamento
     * ressuscite um pedido CANCELLED.
     *
     * Também não alteramos o status operacional
     * de um pedido já DELIVERED.
     */
    let newOrderStatus = order.status;

    if (
      paymentStatus === 'PAID' &&
      ['PENDING', 'CONFIRMED'].includes(order.status)
    ) {
      newOrderStatus = 'CONFIRMED';
    }

    /*
     * Atualização idempotente:
     * receber o mesmo webhook novamente não cria outro pedido
     * nem altera estoque.
     */
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id
      },
      data: {
        paymentStatus,
        mpPaymentId: String(paymentId),
        status: newOrderStatus
      },
      include: {
        user: true
      }
    });

    /*
     * Notificações somente quando o pagamento foi aprovado.
     */
    if (
      paymentStatus === 'PAID' &&
      order.paymentStatus !== 'PAID'
    ) {
      notifyOrderStatus(
        updatedOrder,
        updatedOrder.user
      ).catch(() => {});
    }

    emitToUser(
      updatedOrder.userId,
      'order-status',
      {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus
      }
    );

    emitToPharmacy(
      updatedOrder.pharmacyId,
      'order-status',
      {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus
      }
    );

    return res.status(200).end();
  } catch (e) {
    next(e);
  }
});

/**
 * Consulta o status do pagamento de um pedido.
 */
router.get(
  '/status/:orderId',
  auth(),
  async (req, res, next) => {
    try {
      const order = await prisma.order.findUnique({
        where: {
          id: req.params.orderId
        }
      });

      if (!order) {
        return res.status(404).json({
          error: 'Pedido não encontrado'
        });
      }

      /*
       * Cliente somente pode consultar seus próprios pedidos.
       */
      if (
        req.user.role === 'CUSTOMER' &&
        order.userId !== req.user.id
      ) {
        return res.status(403).json({
          error: 'Acesso negado'
        });
      }

      /*
       * Farmácia somente pode consultar pedidos
       * pertencentes à própria farmácia.
       */
      if (req.user.role === 'PHARMACY') {
        const pharmacy = await prisma.pharmacy.findUnique({
          where: {
            ownerId: req.user.id
          }
        });

        if (
          !pharmacy ||
          pharmacy.id !== order.pharmacyId
        ) {
          return res.status(403).json({
            error: 'Acesso negado'
          });
        }
      }

      res.json({
        paymentStatus: order.paymentStatus,
        status: order.status
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;