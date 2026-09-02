const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma');
const optionalAuth = require('../middleware/optionalAuth');
const { chatLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é a Bia, assistente virtual do Farma.APP (app de delivery de medicamentos). Seu tom é simpático, direto e curto — respostas de no máximo 3-4 frases.

Você pode ajudar com:
- Dúvidas sobre como o app funciona (categorias, frete, pagamento, como enviar receita).
- Status e histórico de pedidos do cliente (o resumo dos pedidos recentes vem no contexto, quando disponível).
- Indicar em qual categoria buscar um produto.

Você NUNCA deve:
- Dar conselho médico, sugerir dose, indicar substituição de medicamento ou dizer se um remédio é seguro para alguém.
- Confirmar o conteúdo de uma receita — isso é sempre função da leitura por IA + revisão do farmacêutico, no fluxo de "Enviar receita".
- Inventar informações sobre pedidos que não estão no contexto fornecido.

Para qualquer dúvida médica ou sobre um medicamento específico, oriente a pessoa a usar a função "Enviar receita" no app ou falar direto com o farmacêutico responsável pelo pedido.`;

router.post('/', chatLimiter, optionalAuth, async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Envie ao menos uma mensagem' });
    if (messages.length > 20) return res.status(400).json({ error: 'Conversa muito longa, comece um novo chat' });

    let contextNote = 'Usuário não está logado (visitante/modo convidado) — não há pedidos para consultar.';
    if (req.user) {
      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, status: true, total: true, createdAt: true, pharmacy: { select: { name: true } } }
      });
      contextNote = `Usuário logado: ${req.user.name}. Pedidos recentes: ${JSON.stringify(orders.map((o) => ({ id: o.id.slice(0, 8), status: o.status, total: o.total, farmacia: o.pharmacy.name, data: o.createdAt })))}`;
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'coloque_sua_chave_aqui') {
      return res.status(500).json({ error: 'Assistente indisponível no momento (chave de IA não configurada).' });
    }

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      system: `${SYSTEM_PROMPT}\n\nContexto: ${contextNote}`,
      messages: messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1000) }))
    });

    const reply = aiResponse.content.find((b) => b.type === 'text')?.text || 'Desculpa, não consegui responder agora.';
    res.json({ reply });
  } catch (e) { next(e); }
});

module.exports = router;
