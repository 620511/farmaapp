const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const router = express.Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.get('/', async (req, res, next) => {
  try {
    const { categoryId, search, pharmacyId, onOffer } = req.query;
    const where = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (pharmacyId) where.pharmacyId = pharmacyId;
    if (search) where.name = { contains: search };
    if (onOffer === 'true') where.originalPrice = { not: null };
    const products = await prisma.product.findMany({ where, include: { category: true, pharmacy: true }, orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch (e) { next(e); }
});

// Recomendações personalizadas com IA — olha o carrinho atual e/ou o histórico
// de compras (se logado) e sugere produtos do catálogo que fazem sentido junto.
// Precisa vir antes de "/:id" na definição das rotas.
router.get('/recommendations', optionalAuth, async (req, res, next) => {
  try {
    const catalog = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, categoryId: true, category: { select: { name: true } }, price: true },
      take: 60
    });
    if (catalog.length === 0) return res.json([]);

    let context = 'Cliente sem histórico (visitante ou primeira compra).';
    if (req.user) {
      const recentItems = await prisma.orderItem.findMany({
        where: { order: { userId: req.user.id } },
        select: { product: { select: { name: true, category: { select: { name: true } } } } },
        orderBy: { id: 'desc' },
        take: 10
      });
      if (recentItems.length > 0) {
        context = `Últimos produtos comprados pelo cliente: ${recentItems.map((i) => `${i.product.name} (${i.product.category.name})`).join(', ')}`;
      }
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'coloque_sua_chave_aqui') {
      return res.json(catalog.slice(0, 4).map((p) => ({ id: p.id, name: p.name, price: p.price })));
    }

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 200,
      system: 'Você recomenda produtos de uma farmácia online. Receba um catálogo com id/nome/categoria/preço e o contexto do cliente, e devolva SOMENTE um array JSON com até 4 ids de produtos do catálogo fornecido que fazem sentido recomendar (produtos complementares ou populares na mesma categoria). Nunca invente um id que não está no catálogo. Nunca recomende com base em suposição de condição de saúde.',
      messages: [{ role: 'user', content: `Catálogo: ${JSON.stringify(catalog.map((p) => ({ id: p.id, nome: p.name, categoria: p.category.name, preco: p.price })))}\n\nContexto do cliente: ${context}\n\nResponda só com o array JSON de ids.` }]
    });
    const rawText = aiResponse.content.find((b) => b.type === 'text')?.text || '[]';
    let ids = [];
    try { ids = JSON.parse(rawText.replace(/```json|```/g, '').trim()); } catch { ids = []; }

    const recommended = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include: { category: true, pharmacy: true } });
    res.json(recommended.length > 0 ? recommended : catalog.slice(0, 4));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: true, pharmacy: true } });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch (e) { next(e); }
});

async function getOwnPharmacy(userId) {
  return prisma.pharmacy.findUnique({ where: { ownerId: userId } });
}

router.post('/', auth(['PHARMACY', 'ADMIN']), async (req, res, next) => {
  try {
    let pharmacyId = req.body.pharmacyId;
    if (req.user.role === 'PHARMACY') {
      const pharmacy = await getOwnPharmacy(req.user.id);
      if (!pharmacy) return res.status(400).json({ error: 'Farmácia não encontrada para este usuário' });
      pharmacyId = pharmacy.id;
    }
    const { name, description, imageUrl, price, originalPrice, stock, requiresRx, categoryId } = req.body;
    const product = await prisma.product.create({
      data: { name, description, imageUrl, price: parseFloat(price), originalPrice: originalPrice ? parseFloat(originalPrice) : null, stock: stock ? parseInt(stock) : 100, requiresRx: !!requiresRx, categoryId, pharmacyId }
    });
    res.status(201).json(product);
  } catch (e) { next(e); }
});

router.put('/:id', auth(['PHARMACY', 'ADMIN']), async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Produto não encontrado' });
    if (req.user.role === 'PHARMACY') {
      const pharmacy = await getOwnPharmacy(req.user.id);
      if (!pharmacy || pharmacy.id !== existing.pharmacyId) return res.status(403).json({ error: 'Acesso negado' });
    }
    const { name, description, imageUrl, price, originalPrice, stock, requiresRx, categoryId, isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name, description, imageUrl,
        price: price !== undefined ? parseFloat(price) : undefined,
        originalPrice: originalPrice !== undefined ? (originalPrice ? parseFloat(originalPrice) : null) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        requiresRx, categoryId, isActive
      }
    });
    res.json(product);
  } catch (e) { next(e); }
});

router.delete('/:id', auth(['PHARMACY', 'ADMIN']), async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Produto não encontrado' });
    if (req.user.role === 'PHARMACY') {
      const pharmacy = await getOwnPharmacy(req.user.id);
      if (!pharmacy || pharmacy.id !== existing.pharmacyId) return res.status(403).json({ error: 'Acesso negado' });
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
