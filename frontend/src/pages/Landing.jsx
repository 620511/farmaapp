import { Link } from 'react-router-dom';
import { Bike, ShieldCheck, Tag, Lock, MapPin, Smartphone, Percent, Headphones, Search, ShoppingCart, Home as HomeIcon, ClipboardList, Heart, User, Pill, Droplet, Beaker, FlaskConical, HeartPulse, Plus } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import HeroPhoto from '../components/HeroPhoto.jsx';

const benefits = [
  { icon: Bike, title: 'Entrega rápida', text: 'Na sua casa, com segurança.' },
  { icon: ShieldCheck, title: 'Produtos de qualidade', text: 'Farmácias confiáveis e certificadas.' },
  { icon: Tag, title: 'Ofertas exclusivas', text: 'Descontos e promoções todos os dias.' },
  { icon: Lock, title: 'Compra segura', text: 'Seus dados protegidos do início ao fim.' }
];

const footerItems = [
  { icon: MapPin, title: 'Entrega rápida', text: 'Chegamos até você com agilidade.' },
  { icon: Smartphone, title: 'Peça pelo app', text: 'Fácil, prático e seguro.' },
  { icon: Percent, title: 'Promoções', text: 'Descontos exclusivos no app.' },
  { icon: Headphones, title: 'Atendimento', text: 'Suporte dedicado para você.' }
];

const categories = [
  { icon: Pill, label: 'Medicamentos' },
  { icon: Droplet, label: 'Higiene' },
  { icon: Beaker, label: 'Beleza' },
  { icon: FlaskConical, label: 'Vitaminas' },
  { icon: HeartPulse, label: 'Cuidados' }
];

const offers = [
  { name: 'Dipirona 1g', desc: '10 comprimidos', off: '-20%', old: 'R$ 9,90', price: 'R$ 7,90' },
  { name: 'Vitamina C 1g', desc: '10 comprimidos', off: '-15%', old: 'R$ 19,90', price: 'R$ 16,90' },
  { name: 'Protetor Solar', desc: 'FPS 50 – 120ml', off: '-10%', old: 'R$ 49,90', price: 'R$ 44,90' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EAF3FB] to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 items-start relative z-10">
          <div>
            <Logo size={72} textClass="text-4xl lg:text-5xl" />
            <p className="mt-2 text-navy-900/70 font-medium text-lg">Sua farmácia, mais perto de você!</p>

            <h1 className="mt-8 font-display font-bold text-3xl lg:text-4xl text-navy-900 leading-snug">
              Medicamentos e cuidados<br />com a saúde, <span className="text-teal-500">onde você estiver.</span>
            </h1>

            <div className="mt-8 space-y-5">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${i % 2 === 0 ? 'bg-teal-500' : 'bg-navy-900'}`}>
                    <b.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-navy-900">{b.title}</p>
                    <p className="text-sm text-navy-900/60">{b.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Illustration + trust badge, mirroring the reference layout */}
            <div className="mt-8 relative">
              <HeroPhoto />
              <div className="absolute -top-5 right-2 sm:right-6 flex items-center gap-3 bg-white border border-teal-100 shadow-lg rounded-2xl px-4 py-3 max-w-[220px]">
                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                </div>
                <p className="text-xs font-semibold text-navy-900 leading-snug">
                  Cuidado que você confia,<br /><span className="text-teal-500">agora a um clique!</span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="px-7 py-3.5 rounded-xl bg-brand-gradient text-white font-display font-semibold shadow-lg hover:opacity-90 transition">
                Criar minha conta
              </Link>
              <Link to="/login" className="px-7 py-3.5 rounded-xl border-2 border-navy-900 text-navy-900 font-display font-semibold hover:bg-navy-900 hover:text-white transition">
                Já tenho conta
              </Link>
            </div>
            <Link to="/app" className="inline-block mt-4 text-sm text-navy-900/50 underline hover:text-navy-900">
              Ou continue sem cadastro
            </Link>
          </div>

          {/* Phone mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-[300px] rounded-[2.5rem] border-[10px] border-navy-950 bg-navy-950 shadow-2xl overflow-hidden sticky top-8">
              <div className="bg-white rounded-[2rem] overflow-hidden">
                <div className="bg-brand-gradient text-white px-5 pt-4 pb-6">
                  <div className="flex justify-between items-center text-xs mb-4 opacity-80">
                    <span>9:41</span>
                    <span>●●● 🔋</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-display font-semibold text-sm">Bem-vindo(a)!</p>
                      <p className="font-display font-bold text-lg leading-snug">O que você<br />precisa hoje?</p>
                    </div>
                    <div className="relative bg-white/15 rounded-full p-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 bg-coral-500 text-[9px] w-4 h-4 rounded-full flex items-center justify-center">2</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-white rounded-xl flex items-center gap-2 px-3 py-2.5">
                    <Search className="w-4 h-4 text-navy-900/40" />
                    <span className="text-xs text-navy-900/40">Buscar medicamentos, produtos...</span>
                  </div>
                </div>

                <div className="px-5 -mt-2">
                  <div className="bg-gradient-to-br from-navy-800 to-teal-500 rounded-2xl p-4 text-white text-xs mt-3">
                    <p className="font-display font-semibold">Saúde e bem-estar para você e sua família!</p>
                    <p className="mt-1 opacity-80">Entrega rápida na sua região.</p>
                  </div>
                  <div className="flex justify-center gap-1 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-navy-900" />
                    <span className="w-1.5 h-1.5 rounded-full bg-navy-900/25" />
                    <span className="w-1.5 h-1.5 rounded-full bg-navy-900/25" />
                  </div>
                </div>

                <div className="px-5 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-display font-semibold text-navy-900">Categorias</p>
                    <span className="text-[10px] text-teal-600 font-semibold">Ver todas</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {categories.map((c, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${i === 4 ? 'bg-coral-500/10 text-coral-500' : 'bg-teal-500/10 text-teal-600'}`}>
                          <c.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[8px] text-navy-900/60 text-center leading-tight">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 mt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-display font-semibold text-navy-900">Ofertas especiais</p>
                    <span className="text-[10px] text-teal-600 font-semibold">Ver todas</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {offers.map((o, i) => (
                      <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden relative">
                        <span className="absolute top-1 left-1 bg-coral-500 text-white text-[7px] font-bold px-1 py-0.5 rounded z-10">{o.off}</span>
                        <div className="h-10 bg-gray-50 flex items-center justify-center">
                          <Pill className="w-4 h-4 text-navy-900/20" />
                        </div>
                        <div className="p-1.5">
                          <p className="text-[7px] font-semibold text-navy-900 leading-tight">{o.name}</p>
                          <p className="text-[6px] text-navy-900/40">{o.desc}</p>
                          <div className="flex items-end justify-between mt-1">
                            <div>
                              <p className="text-[6px] text-navy-900/30 line-through leading-none">{o.old}</p>
                              <p className="text-[8px] font-bold text-teal-600 leading-none mt-0.5">{o.price}</p>
                            </div>
                            <div className="w-3.5 h-3.5 rounded-full bg-navy-900 flex items-center justify-center shrink-0">
                              <Plus className="w-2 h-2 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-around border-t border-gray-100 py-2.5 text-navy-900/40">
                  <div className="flex flex-col items-center gap-0.5 text-teal-500"><HomeIcon className="w-4 h-4" /><span className="text-[7px]">Início</span></div>
                  <div className="flex flex-col items-center gap-0.5"><ClipboardList className="w-4 h-4" /><span className="text-[7px]">Pedidos</span></div>
                  <div className="flex flex-col items-center gap-0.5"><Heart className="w-4 h-4" /><span className="text-[7px]">Favoritos</span></div>
                  <div className="flex flex-col items-center gap-0.5"><User className="w-4 h-4" /><span className="text-[7px]">Conta</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer benefits strip */}
      <section className="bg-navy-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {footerItems.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <f.icon className="w-6 h-6 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-display font-semibold text-sm">{f.title}</p>
                <p className="text-white/50 text-xs mt-0.5">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 py-5 text-center text-white/40 text-xs">
          © {new Date().getFullYear()} Farma.APP. Todos os direitos reservados. · <Link to="/privacidade" className="underline hover:text-white">Política de Privacidade</Link>
        </div>
      </section>
    </div>
  );
}
