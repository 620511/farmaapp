import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Upload, ShieldAlert, CheckCircle2, Loader2, FileText } from 'lucide-react';
import api from '../../api/client.js';

const statusLabel = { PENDING_REVIEW: 'Aguardando farmacêutico', APPROVED: 'Aprovada', REJECTED: 'Reprovada' };
const statusColor = { PENDING_REVIEW: 'bg-amber-50 text-amber-600', APPROVED: 'bg-green-50 text-green-600', REJECTED: 'bg-red-50 text-coral-500' };

export default function Prescription() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/prescriptions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível analisar a receita agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 py-4 pb-10">
      <h1 className="font-display font-bold text-lg text-navy-900 mb-1">Enviar receita médica</h1>
      <p className="text-sm text-navy-900/50 mb-4">
        Nosso assistente lê a receita e te dá um resumo, mas <strong>todo pedido com receita passa pela conferência de um farmacêutico</strong> antes de ser entregue.
      </p>

      {!result && (
        <>
          <div className="border-2 border-dashed border-teal-200 rounded-2xl p-6 text-center bg-teal-50/30">
            {preview ? (
              <img src={preview} alt="Prévia da receita" className="mx-auto max-h-64 rounded-lg shadow-sm" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-navy-900/40">
                <FileText className="w-10 h-10" />
                <p className="text-sm">Envie uma foto legível da receita</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            <button onClick={() => inputRef.current.click()} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold">
              <Camera className="w-4 h-4" /> {preview ? 'Trocar foto' : 'Tirar foto / escolher arquivo'}
            </button>
          </div>

          {error && <p className="bg-red-50 text-coral-500 text-sm rounded-lg px-3 py-2 mt-4">{error}</p>}

          <button disabled={!file || loading} onClick={handleSubmit}
            className="mt-5 w-full py-3.5 rounded-xl bg-brand-gradient text-white font-display font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Analisando receita...</>) : (<><Upload className="w-4 h-4" /> Analisar receita</>)}
          </button>
        </>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <p className="text-sm font-semibold text-navy-900">Receita enviada!</p>
            <span className={`ml-auto text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor.PENDING_REVIEW}`}>{statusLabel.PENDING_REVIEW}</span>
          </div>

          {!result.leitura.legivel && (
            <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-xs px-3 py-2.5 rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              A imagem ficou difícil de ler em algumas partes. O farmacêutico vai conferir tudo antes de liberar o pedido.
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-navy-900 mb-1">Resumo</p>
            <p className="text-sm text-navy-900/70">{result.leitura.resumo}</p>
          </div>

          {result.leitura.medicamentos?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-navy-900 mb-2">Medicamentos identificados</p>
              <div className="space-y-2">
                {result.leitura.medicamentos.map((m, i) => (
                  <div key={i} className="text-sm text-navy-900/70 border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                    <p className="font-medium text-navy-900">{m.nome}</p>
                    {m.dosagem && <p className="text-xs">Dosagem: {m.dosagem}</p>}
                    {m.posologia && <p className="text-xs">Posologia: {m.posologia}</p>}
                    {m.duracao && <p className="text-xs">Duração: {m.duracao}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.leitura.orientacoes_gerais?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-navy-900 mb-2">Orientações gerais</p>
              <ul className="text-sm text-navy-900/70 list-disc pl-4 space-y-1">
                {result.leitura.orientacoes_gerais.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
              <p className="text-xs text-navy-900/40 mt-2">Siga sempre exatamente o que o seu médico prescreveu. Estas são orientações gerais, não substituem orientação médica ou farmacêutica.</p>
            </div>
          )}

          {result.leitura.alertas?.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-700 mb-2">Pontos de atenção</p>
              <ul className="text-sm text-amber-700 list-disc pl-4 space-y-1">
                {result.leitura.alertas.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setResult(null); setFile(null); setPreview(null); }} className="flex-1 py-3 rounded-xl border-2 border-navy-900 text-navy-900 font-display font-semibold text-sm">
              Enviar outra receita
            </button>
            <Link to="/app/categorias" className="flex-1 py-3 rounded-xl bg-brand-gradient text-white font-display font-semibold text-sm text-center">
              Ver produtos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
