import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import api from '../api/client.js';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Oi! Eu sou a Bia, assistente do Farma.APP 💊 Posso ajudar com dúvidas sobre o app, categorias ou o status dos seus pedidos. Pra questões médicas, use a opção "Enviar receita" ou fale com o farmacêutico.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chat', { messages: nextMessages });
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: err.response?.data?.error || 'Deu ruim aqui, tenta de novo em instantes.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-brand-gradient text-white shadow-xl flex items-center justify-center">
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-40 sm:inset-auto sm:bottom-20 sm:right-4 sm:w-96 h-[70vh] sm:h-[520px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="bg-brand-gradient text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <p className="font-display font-semibold text-sm">Bia — assistente Farma.APP</p>
            </div>
            <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-navy-900 text-white' : 'bg-white border border-gray-100 text-navy-900'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2 text-sm text-navy-900/40 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> digitando...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex items-center gap-2 shrink-0">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escreva sua dúvida..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button disabled={loading || !input.trim()} className="w-10 h-10 rounded-full bg-brand-gradient text-white flex items-center justify-center shrink-0 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
