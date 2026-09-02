const express = require('express');
const bcrypt = require('bcryptjs');
const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { geocodeAddress } = require('../utils/geo');
const { getSettings } = require('../utils/settings');
const router = express.Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.get('/stats', auth(['ADMIN']), async (req, res, next) => {
  try {
    const [pharmacies, products, orders, users] = await Promise.all([
      prisma.pharmacy.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } })
    ]);
    const revenueAgg = await prisma.order.aggregate({ _sum: { total: true, platformFeeAmount: true } });
    res.json({
      pharmacies,
      products,
      orders,
      customers: users,
      revenue: revenueAgg._sum.total || 0,
      platformRevenue: revenueAgg._sum.platformFeeAmount || 0
    });
  } catch (e) { next(e); }
});

router.get('/settings', auth(['ADMIN']), async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (e) { next(e); }
});

router.put('/settings', auth(['ADMIN']), async (req, res, next) => {
  try {
    const { platformFeePercent } = req.body;
    const value = parseFloat(platformFeePercent);
    if (Number.isNaN(value) || value < 0 || value > 50) return res.status(400).json({ error: 'Taxa inválida (use um valor entre 0 e 50)' });
    const settings = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: { platformFeePercent: value },
      create: { id: 'singleton', platformFeePercent: value }
    });
    res.json(settings);
  } catch (e) { next(e); }
});

router.get('/pharmacies', auth(['ADMIN']), async (req, res, next) => {
  try {
    const pharmacies = await prisma.pharmacy.findMany({ include: { owner: true, products: true } });
    res.json(pharmacies);
  } catch (e) { next(e); }
});

router.post('/pharmacies', auth(['ADMIN']), async (req, res, next) => {
  try {
    const { name, description, city, address, ownerName, ownerEmail, ownerPassword } = req.body;
    const passwordHash = await bcrypt.hash(ownerPassword, 10);
    const owner = await prisma.user.create({ data: { name: ownerName, email: ownerEmail, passwordHash, role: 'PHARMACY' } });
    const data = { name, description, city, ownerId: owner.id };
    if (address || city) {
      const coords = await geocodeAddress(address || city);
      if (coords) { data.latitude = coords.latitude; data.longitude = coords.longitude; }
    }
    const pharmacy = await prisma.pharmacy.create({ data });
    res.status(201).json(pharmacy);
  } catch (e) { next(e); }
});

router.put('/pharmacies/:id/toggle', auth(['ADMIN']), async (req, res, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: req.params.id } });
    const updated = await prisma.pharmacy.update({ where: { id: req.params.id }, data: { isActive: !pharmacy.isActive } });
    res.json(updated);
  } catch (e) { next(e); }
});

router.get('/users', auth(['ADMIN']), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
    res.json(users);
  } catch (e) { next(e); }
});

// Painel de insights com IA: pega números já agregados (não dado bruto de
// usuário) e pede pra Claude resumir em texto simples, com foco no que o
// administrador da plataforma deveria olhar primeiro.
router.get('/insights', auth(['ADMIN']), async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [pharmacies, ordersLast30d, topPharmacies, revenueAgg] = await Promise.all([
      prisma.pharmacy.findMany({ select: { id: true, name: true, isActive: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: since } }, select: { total: true, platformFeeAmount: true, pharmacyId: true, status: true, createdAt: true } }),
      prisma.order.groupBy({ by: ['pharmacyId'], _sum: { total: true }, orderBy: { _sum: { total: 'desc' } }, take: 5 }),
      prisma.order.aggregate({ _sum: { total: true, platformFeeAmount: true } })
    ]);

    const pharmacyNameById = Object.fromEntries(pharmacies.map((p) => [p.id, p.name]));
    const topPharmaciesNamed = topPharmacies.map((t) => ({ name: pharmacyNameById[t.pharmacyId] || 'Farmácia', total: t._sum.total }));

    const summary = {
      totalFarmacias: pharmacies.length,
      farmaciasAtivas: pharmacies.filter((p) => p.isActive).length,
      pedidosUltimos30dias: ordersLast30d.length,
      faturamentoTotal: revenueAgg._sum.total || 0,
      receitaPlataforma: revenueAgg._sum.platformFeeAmount || 0,
      farmaciasComMaisVendas: topPharmaciesNamed,
      pedidosCancelados30d: ordersLast30d.filter((o) => o.status === 'CANCELLED').length
    };

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'coloque_sua_chave_aqui') {
      return res.json({ summary, insights: ['Configure a ANTHROPIC_API_KEY no servidor para ver os insights gerados por IA.'] });
    }

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      system: 'Você é um analista de negócios ajudando o administrador de um marketplace de delivery de medicamentos (Farma.APP). Receba números já agregados e devolva de 3 a 5 observações curtas e acionáveis em português, em formato de lista JSON de strings, sem markdown, sem explicações extras. Foque em tendências, riscos e oportunidades — nunca invente números que não foram dados.',
      messages: [{ role: 'user', content: `Dados do último período:\n${JSON.stringify(summary, null, 2)}\n\nResponda apenas com um array JSON de strings.` }]
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
