import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Eye } from 'lucide-react';
import api from '../../api/client.js';

const statusLabel = { PENDING_REVIEW: 'Aguardando revisão', APPROVED: 'Aprovada', REJECTED: 'Reprovada' };
const statusColor = { PENDING_REVIEW: 'bg-amber-50 text-amber-600', APPROVED: 'bg-green-50 text-green-600', REJECTED: 'bg-red-50 text-coral-500' };

export default function PharmacyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [image, setImage] = useState(null);
  const [note, setNote] = useState('');

  function load() { api.get('/prescriptions').then((r) => setPrescriptions(r.data)); }
  useEffect(load, []);

  async function openDetail(p) {
    setSelected(p);
    setNote(p.pharmacistNote || '');
    const res = await api.get(`/prescriptions/${p.id}/image`);
    setImage(res.data.imageBase64);
  }

  async function review(status) {
    await api.put(`/prescriptions/${selected.id}/review`, { status, pharmacistNote: note });
    setSelected(null);
    setImage(null);
    load();
  }

  const meds = selected ? JSON.parse(selected.aiMedications || '[]') : [];
  const orientations = selected ? JSON.parse(selected.aiOrientation || '[]') : [];
  const warnings = selected ? JSON.parse(selected.aiWarnings || '[]') : [];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Receitas médicas</h1>
      <p className="text-navy-900/50 mb-6 text-sm">Leitura feita por IA — a aprovação final é sempre do farmacêutico.</p>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="space-y-3">
          {prescriptions.map((p) => (
            <button key={p.id} onClick={() => openDetail(p)} className={`w-full text-left bg-white rounded-xl border p-4 hover:border-teal-300 transition ${selected?.id === p.id ? 'border-teal-400' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{p.user?.name || 'Cliente'}</p>
                  <p className="text-xs text-navy-900/40">{new Date(p.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor[p.status]}`}>{statusLabel[p.status]}</span>
              </div>
              <p className="text-xs text-navy-900/60 mt-2 line-clamp-2">{p.aiSummary}</p>
              {p.aiConfidence === 'ilegivel' && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1"><ShieldAlert className="w-3 h-3" /> IA sinalizou trechos difíceis de ler</p>
              )}
            </button>
          ))}
          {prescriptions.length === 0 && <p className="text-sm text-navy-900/40">Nenhuma receita recebida ainda.</p>}
        </div>

        {selected && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-semibold text-navy-900">Revisão da receita</p>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor[selected.status]}`}>{statusLabel[selected.status]}</span>
            </div>

            {image && <img src={`data:image/jpeg;base64,${image}`} alt="Receita" className="w-full rounded-lg border border-gray-100 mb-4 max-h-72 object-contain bg-gray-50" />}

            <p className="text-sm font-semibold text-navy-900 mb-1">Leitura da IA</p>
            <p className="text-sm text-navy-900/70 mb-3">{selected.aiSummary}</p>

            {meds.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-navy-900/60 mb-1">Medicamentos</p>
                {meds.map((m, i) => (
                  <p key={i} className="text-xs text-navy-900/70">• {m.nome} — {m.dosagem} — {m.posologia}</p>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">Alertas da IA</p>
                {warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">• {w}</p>)}
              </div>
            )}

            <p className="text-xs font-semibold text-navy-900/60 mb-1">Observação do farmacêutico</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" placeholder="Ex.: confirmado, receita válida e legível." />

            <div className="flex gap-3">
              <button onClick={() => review('REJECTED')} className="flex-1 py-2.5 rounded-lg border-2 border-coral-500 text-coral-500 font-semibold text-sm flex items-center justify-center gap-1">
                <XCircle className="w-4 h-4" /> Reprovar
              </button>
              <button onClick={() => review('APPROVED')} className="flex-1 py-2.5 rounded-lg bg-brand-gradient text-white font-semibold text-sm flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Aprovar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
