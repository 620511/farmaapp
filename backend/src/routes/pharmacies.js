const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { geocodeAddress } = require('../utils/geo');
const router = express.Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.get('/', async (req, res, next) => {
  try {
    const pharmacies = await prisma.pharmacy.findMany({ where: { isActive: true } });
    res.json(pharmacies);
  } catch (e) { next(e); }
});

router.get('/me', auth(['PHARMACY']), async (req, res, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { ownerId: req.user.id } });
    if (!pharmacy) return res.status(404).json({ error: 'Farmácia não encontrada' });
    res.json(pharmacy);
  } catch (e) { next(e); }
});

router.put('/me', auth(['PHARMACY']), async (req, res, next) => {
  try {
    const { name, description, logoUrl, city, address } = req.body;
    const data = { name, description, logoUrl, city };
    if (address) {
      const coords = await geocodeAddress(address);
      if (coords) { data.latitude = coords.latitude; data.longitude = coords.longitude; }
    }
    const pharmacy = await prisma.pharmacy.update({ where: { ownerId: req.user.id }, data });
    res.json(pharmacy);
  } catch (e) { next(e); }
});

// Insights com IA para a farmácia: produtos mais vendidos, estoque baixo e
// tendência de faturamento (repasse já descontada a taxa da plataforma).
router.get('/me/insights', auth(['PHARMACY']), async (req, res, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { ownerId: req.user.id } });
    if (!pharmacy) return res.status(404).json({ error: 'Farmácia não encontrada' });

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [orders, products, lowStock] = await Promise.all([
      prisma.order.findMany({ where: { pharmacyId: pharmacy.id, createdAt: { gte: since } }, include: { items: { include: { product: true } } } }),
      prisma.product.count({ where: { pharmacyId: pharmacy.id, isActive: true } }),
      prisma.product.findMany({ where: { pharmacyId: pharmacy.id, isActive: true, stock: { lt: 10 } }, select: { name: true, stock: true } })
    ]);

    const productSales = {};
    for (const order of orders) {
      for (const item of order.items) {
        productSales[item.product.name] = (productSales[item.product.name] || 0) + item.quantity;
      }
    }
    const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));

    const summary = {
      pedidosUltimos30dias: orders.length,
      faturamentoLiquido: Math.round(orders.reduce((s, o) => s + o.pharmacyPayout, 0) * 100) / 100,
      produtosAtivos: products,
      produtosMaisVendidos: topProducts,
      produtosComEstoqueBaixo: lowStock
    };

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'coloque_sua_chave_aqui') {
      return res.json({ summary, insights: ['Configure a ANTHROPIC_API_KEY no servidor para ver os insights gerados por IA.'] });
    }

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      system: 'Você é um consultor de negócios ajudando o dono de uma farmácia parceira de um app de delivery (Farma.APP). Receba números já agregados sobre a loja dele e devolva de 3 a 5 observações curtas e acionáveis em português, em formato de lista JSON de strings, sem markdown. Foque em estoque, produtos parados/vendendo bem e oportunidades — nunca invente números que não foram dados, e nunca dê conselho médico.',
      messages: [{ role: 'user', content: `Dados da loja no último período:\n${JSON.stringify(summary, null, 2)}\n\nResponda apenas com um array JSON de strings.` }]
    });
    const rawText = aiResponse.content.find((b) => b.type === 'text')?.text || '[]';
    let insights;
    try {
      insights = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch {
      insights = [rawText];
    }

    res.json({ summary, insights });
  } catch (e) { next(e); }
});

module.exports = router;
