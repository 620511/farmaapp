const express = require('express');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { notifyPrescriptionReview } = require('../utils/mailer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Prompt de sistema: o assistente só transcreve o que está escrito na receita e dá
// orientações gerais e seguras. Nunca prescreve, nunca sugere dose diferente da
// receitada, nunca substitui a avaliação de um farmacêutico ou médico.
const SYSTEM_PROMPT = `Você é um assistente de farmácia que ajuda a organizar receitas médicas enviadas por clientes de um app de delivery de medicamentos (Farma.APP).

Sua função é SOMENTE:
1. Transcrever o que está escrito na receita (medicamentos, dosagem, posologia, duração do tratamento, nome do paciente e do médico, data, se é receita de controle especial).
2. Dar orientações GERAIS e seguras de uso (ex.: tomar exatamente como o médico indicou, não interromper por conta própria, guardar em local seco e ao abrigo de luz, não compartilhar o medicamento, procurar o médico ou farmacêutico em caso de reação adversa).
3. Sinalizar claramente quando a receita estiver ilegível, incompleta, vencida, rasurada ou quando não for possível confirmar algum dado com segurança.

Você NUNCA deve:
- Diagnosticar, sugerir doses diferentes das escritas na receita, recomendar substituição de medicamento, ou dar conselho médico além do que está escrito.
- Confirmar a autenticidade da receita — isso é sempre responsabilidade do farmacêutico humano.
- Tratar sua leitura como aprovação final: toda receita passa por revisão obrigatória de um farmacêutico antes da entrega.

Responda ESTRITAMENTE em JSON válido, sem markdown, no formato:
{
  "legivel": true|false,
  "resumo": "resumo curto e objetivo do que está na receita",
  "medicamentos": [{ "nome": "", "dosagem": "", "posologia": "", "duracao": "" }],
  "paciente": "nome do paciente se visível, senão null",
  "medico": "nome/CRM do médico se visível, senão null",
  "data_receita": "data se visível, senão null",
  "controle_especial": true|false,
  "orientacoes_gerais": ["lista curta de orientações gerais e seguras"],
  "alertas": ["itens ilegíveis, incompletos, vencidos ou que precisam de atenção do farmacêutico"]
}`;

router.post('/', auth(['CUSTOMER']), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Envie a imagem da receita' });
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'coloque_sua_chave_aqui') {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor' });
    }

    const base64 = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype || 'image/jpeg';

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Leia esta receita médica e responda no formato JSON definido nas instruções.' }
          ]
        }
      ]
    });

    const rawText = aiResponse.content.find((b) => b.type === 'text')?.text || '{}';
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { legivel: false, resumo: 'Não foi possível interpretar a receita automaticamente.', medicamentos: [], orientacoes_gerais: [], alertas: ['Falha ao processar a leitura — revisão manual necessária.'] };
    }

    const prescription = await prisma.prescription.create({
      data: {
        userId: req.user.id,
        orderId: req.body.orderId || null,
        imageBase64: base64,
        aiSummary: parsed.resumo || null,
        aiMedications: JSON.stringify(parsed.medicamentos || []),
        aiOrientation: JSON.stringify(parsed.orientacoes_gerais || []),
        aiWarnings: JSON.stringify(parsed.alertas || []),
        aiConfidence: parsed.legivel ? 'legivel' : 'ilegivel',
        status: 'PENDING_REVIEW'
      }
    });

    res.status(201).json({
      id: prescription.id,
      status: prescription.status,
      leitura: parsed
    });
  } catch (e) { next(e); }
});

router.get('/', auth(), async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'CUSTOMER') where.userId = req.user.id;
    const prescriptions = await prisma.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, userId: true, orderId: true, aiSummary: true, aiMedications: true,
        aiOrientation: true, aiWarnings: true, aiConfidence: true, status: true,
        pharmacistNote: true, createdAt: true,
        user: req.user.role !== 'CUSTOMER' ? { select: { name: true, email: true } } : false
      }
    });
    res.json(prescriptions);
  } catch (e) { next(e); }
});

router.get('/:id/image', auth(), async (req, res, next) => {
  try {
    const p = await prisma.prescription.findUnique({ where: { id: req.params.id } });
    if (!p) return res.status(404).json({ error: 'Receita não encontrada' });
    if (req.user.role === 'CUSTOMER' && p.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });
    res.json({ imageBase64: p.imageBase64 });
  } catch (e) { next(e); }
});

router.put('/:id/review', auth(['PHARMACY', 'ADMIN']), async (req, res, next) => {
  try {
    const { status, pharmacistNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Status inválido' });
    const updated = await prisma.prescription.update({
      where: { id: req.params.id },
      data: { status, pharmacistNote, reviewedById: req.user.id },
      include: { user: true }
    });
    notifyPrescriptionReview(updated, updated.user).catch(() => {});
    res.json(updated);
  } catch (e) { next(e); }
});

module.exports = router;
