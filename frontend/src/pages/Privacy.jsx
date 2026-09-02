import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white font-body">
      <header className="bg-brand-gradient text-white px-6 py-5">
        <Link to="/"><Logo size={30} textClass="text-white text-lg" /></Link>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-10 text-navy-900/80 text-sm leading-relaxed">
        <h1 className="font-display font-bold text-2xl text-navy-900 mb-2">Política de Privacidade</h1>
        <p className="text-navy-900/40 text-xs mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <p className="mb-4">
          Este documento é um modelo inicial de política de privacidade do Farma.APP, elaborado para orientar o
          desenvolvimento do produto. <strong>Ele não substitui uma revisão jurídica</strong> — recomendamos que um
          advogado especializado em LGPD revise e ajuste este texto antes do lançamento com usuários reais,
          especialmente por lidarmos com dados de saúde (receitas médicas).
        </p>

        <h2 className="font-display font-semibold text-navy-900 mt-6 mb-2">Quais dados coletamos</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Dados de cadastro: nome, e-mail, telefone e senha (armazenada de forma criptografada).</li>
          <li>Endereços de entrega, incluindo localização aproximada para cálculo do frete.</li>
          <li>Histórico de pedidos e itens comprados.</li>
          <li>Imagens de receitas médicas enviadas voluntariamente, e a leitura gerada por inteligência artificial a partir delas.</li>
        </ul>

        <h2 className="font-display font-semibold text-navy-900 mt-6 mb-2">Como usamos seus dados</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Processar e entregar seus pedidos, incluindo cálculo de frete e pagamento.</li>
          <li>Permitir que o farmacêutico responsável avalie receitas médicas antes da entrega de medicamentos controlados.</li>
          <li>Enviar notificações sobre o status do seu pedido.</li>
        </ul>

        <h2 className="font-display font-semibold text-navy-900 mt-6 mb-2">Receitas médicas e dados de saúde</h2>
        <p className="mb-4">
          A leitura da receita por inteligência artificial é apenas um apoio — a aprovação final é sempre feita por um
          farmacêutico humano. As imagens de receita são tratadas como dado sensível de saúde e não são compartilhadas
          com terceiros fora do necessário para o atendimento do seu pedido.
        </p>

        <h2 className="font-display font-semibold text-navy-900 mt-6 mb-2">Seus direitos</h2>
        <p className="mb-4">
          Você pode solicitar a exclusão da sua conta e dos seus dados pessoais a qualquer momento, na seção "Minha
          conta" do aplicativo. Pedidos já realizados podem ser mantidos de forma anonimizada por obrigação legal
          (fiscal/contábil), sem vínculo com seus dados pessoais.
        </p>

        <h2 className="font-display font-semibold text-navy-900 mt-6 mb-2">Contato</h2>
        <p>
          Dúvidas sobre esta política podem ser enviadas para o e-mail de suporte configurado pela farmácia responsável
          pela operação do aplicativo.
        </p>
      </div>
    </div>
  );
}
