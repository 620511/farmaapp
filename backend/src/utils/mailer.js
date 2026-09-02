const nodemailer = require('nodemailer');

const enabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (enabled) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

// Envia e-mail se o SMTP estiver configurado; se não, apenas ignora (sem quebrar o fluxo principal).
async function sendMail({ to, subject, html }) {
  if (!enabled || !to) return;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Farma.APP <no-reply@farma.app>',
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Falha ao enviar e-mail:', err.message);
  }
}

const orderStatusLabel = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparação',
  OUT_FOR_DELIVERY: 'A caminho',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado'
};

async function notifyOrderStatus(order, user) {
  await sendMail({
    to: user.email,
    subject: `Seu pedido Farma.APP está: ${orderStatusLabel[order.status] || order.status}`,
    html: `<p>Olá, ${user.name}!</p><p>O status do seu pedido #${order.id.slice(0, 8)} foi atualizado para <strong>${orderStatusLabel[order.status] || order.status}</strong>.</p><p>Total: R$ ${order.total.toFixed(2).replace('.', ',')}</p>`
  });
}

async function notifyPrescriptionReview(prescription, user) {
  const label = prescription.status === 'APPROVED' ? 'aprovada' : 'reprovada';
  await sendMail({
    to: user.email,
    subject: `Sua receita foi ${label}`,
    html: `<p>Olá, ${user.name}!</p><p>Sua receita foi <strong>${label}</strong> pelo farmacêutico.</p>${prescription.pharmacistNote ? `<p>Observação: ${prescription.pharmacistNote}</p>` : ''}`
  });
}

module.exports = { sendMail, notifyOrderStatus, notifyPrescriptionReview, mailEnabled: enabled };
