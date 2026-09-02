# Farma.APP

Plataforma completa de delivery de medicamentos, no mesmo estilo do PetDelivery: painéis separados para **Cliente**, **Farmácia** e **Administrador**, pronta para produção.

## Estrutura

```
farmaapp/
  backend/    → API REST (Express + Prisma + PostgreSQL + JWT)
  frontend/   → App React (Vite + Tailwind + React Router), PWA instalável
```

Banco de dados e storage de imagens rodam no **Supabase**, no mesmo padrão usado no PetDelivery-CE.

## Como rodar localmente

### 0) Banco de dados e Storage (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com) (ou reaproveite um existente).
2. Em **Project Settings → Database → Connection string**, copie:
   - a conexão via **pooler** (porta `6543`, com `?pgbouncer=true`) → vai em `DATABASE_URL`
   - a conexão **direta** (porta `5432`) → vai em `DIRECT_URL`
3. Em **Storage**, crie um bucket público chamado `uploads` (mesmo nome usado no PetDelivery-CE). Em **Project Settings → Storage → S3 Connection**, gere as chaves de acesso e copie o endpoint S3.
4. Preencha essas informações no `.env` do backend (veja `.env.example` — já vem com o formato certo, só trocar `<ref-do-projeto>`, `<regiao>` e `<sua-senha>`).

### 1) Backend

```bash
cd backend
cp .env.example .env     # edite com as credenciais do seu projeto Supabase (veja "Variáveis de ambiente" abaixo)
npm install
npx prisma migrate dev --name init
npm run seed              # cria admin, farmácia demo (com localização), cliente demo e produtos
npm run dev                # roda em http://localhost:4000
```

Logins criados pelo seed:
- **Admin:** admin@farma.app / admin123
- **Farmácia:** farmacia@farma.app / farmacia123
- **Cliente:** cliente@farma.app / cliente123

### 2) Frontend

```bash
cd frontend
npm install
npm run dev          # roda em http://localhost:5173
```

Se o backend estiver em outro endereço, crie um `.env` no frontend com:
```
VITE_API_URL=https://sua-api.exemplo.com/api
```

## Variáveis de ambiente (backend)

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | conexão com o Supabase via pooler (porta 6543, `pgbouncer=true`) — usada em runtime |
| `DIRECT_URL` | conexão direta com o Supabase (porta 5432) — usada só pelo Prisma para migrations |
| `JWT_SECRET` | assinatura dos tokens — gere com `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | URLs do frontend liberadas no CORS (separadas por vírgula) |
| `BACKEND_PUBLIC_URL` | URL pública da API (usada nos links de imagem quando o storage é local) |
| `FRONTEND_URL` | usada nos links de retorno do checkout do Mercado Pago |
| `ANTHROPIC_API_KEY` | leitura de receitas com IA — [console.anthropic.com](https://console.anthropic.com) |
| `MP_ACCESS_TOKEN` | pagamento — [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) |
| `MP_WEBHOOK_URL` | URL pública que você cadastra no painel do Mercado Pago |
| `MP_WEBHOOK_SECRET` | opcional — valida a assinatura do webhook |
| `S3_BUCKET` / `S3_*` | Supabase Storage (bucket `uploads`) — sem isso, cai em disco local |
| `SMTP_HOST` / `SMTP_*` | opcional — ativa e-mail de notificação de pedido e de receita |
| `SENTRY_DSN` | opcional — monitoramento de erros em produção ([sentry.io](https://sentry.io)) |

Em produção (`NODE_ENV=production`), o servidor recusa subir se `JWT_SECRET` ou `DATABASE_URL` não estiverem configurados corretamente.

## O que está implementado

**Landing page** — fiel à imagem de referência: logo, headline, benefícios, mockup do app e faixa de rodapé. Foto do entregador é opcional (veja seção própria abaixo).

**App do cliente** (`/app`) — navegável em **modo convidado** (sem login), busca, categorias, ofertas, **recomendações personalizadas com IA**, carrinho (sincroniza com a conta ao logar), checkout com **frete calculado pela distância real** até a farmácia, **pagamento via Mercado Pago**, histórico de pedidos **atualizado em tempo real**, favoritos, conta com endereços, envio de receita médica com leitura por IA, e um **chat de atendimento com IA (a Bia)**.

**Painel da farmácia** (`/farmacia`) — visão geral com repasse líquido (já descontada a taxa da plataforma) e **insights gerados por IA**, CRUD de produtos com upload real de foto, gestão de status dos pedidos **em tempo real**, revisão obrigatória de receitas médicas.

**Painel do administrador** (`/admin`) — estatísticas gerais (incluindo receita da plataforma), **insights gerados por IA**, cadastro de farmácias parceiras (com geocodificação automática do endereço), gestão de categorias, listagem de usuários, e **configuração da taxa da plataforma**.

**Taxa da plataforma** — cada pedido calcula automaticamente quanto fica com a farmácia (repasse) e quanto é receita do Farma.APP, com base num percentual configurável pelo admin (`/admin/configuracoes`, padrão 5% sobre o valor dos produtos, mesmo percentual do PetDelivery-CE — o frete fica inteiro com a farmácia).

**Tempo real** — Socket.io: farmácia recebe pedido novo instantaneamente, cliente vê o status do pedido mudar sem precisar atualizar a página.

**Chat com IA (Bia)** — assistente de atendimento para dúvidas sobre o app e status de pedido; nunca dá conselho médico, sempre redireciona pra "Enviar receita" ou pro farmacêutico.

**Segurança** — Helmet (cabeçalhos HTTP), CORS restrito por origem, rate limiting (login/registro, IA, chat, geral), validação de entrada com Zod nas rotas de autenticação, checagem de variáveis críticas no boot em produção.

**Frete dinâmico** — fórmula de Haversine entre a farmácia e o endereço de entrega, geocodificado via Nominatim/OpenStreetMap; frete grátis acima de R$ 80.

**Pagamento** — criação de preferência no Mercado Pago por pedido, checkout hospedado, webhook que confirma o pagamento e atualiza o status do pedido automaticamente.

**Upload de imagem** — produtos podem ter foto real enviada pela farmácia. Usa S3 ou Supabase Storage automaticamente se as variáveis `S3_*` forem configuradas; sem elas, cai em disco local (bom para dev).

**Notificações por e-mail** — cliente recebe e-mail quando o status do pedido muda e quando uma receita é aprovada/reprovada (opcional, requer `SMTP_*`).

**Exclusão de conta (LGPD)** — o cliente pode apagar sua conta em "Minha conta"; dados pessoais, endereços, favoritos e receitas (incluindo a imagem) são removidos. Pedidos ficam anonimizados, por obrigação legal de guarda de histórico de transação. Página de política de privacidade em `/privacidade` (modelo inicial — revisar com jurídico antes do lançamento).

**Monitoramento** — captura de erros do backend no Sentry, se `SENTRY_DSN` estiver configurado.

**Testes automatizados** — Jest + Supertest em `backend/tests` (frete/distância, validação de entrada, health check). Rode com `npm test` dentro de `backend/` (precisa de `npx prisma generate` já feito).

**Agente de IA para receitas** — leitura por Claude com orientações gerais e seguras; toda receita exige aprovação humana do farmacêutico antes de liberar o pedido.

**PWA** — instalável, ícones, service worker com cache offline, meta tags para iOS.

## Deploy

- **Frontend:** Vercel (build: `npm run build`, saída: `dist`)
- **Backend:** Railway (ou similar) — configure todas as variáveis da tabela acima
- **Banco:** Supabase (PostgreSQL) — rode `npx prisma migrate deploy` no primeiro deploy
- **Banco e Storage:** já configurados via Supabase (veja "Como rodar localmente" acima) — as mesmas credenciais funcionam em produção.
- **Storage de imagens:** usa o bucket `uploads` do Supabase Storage automaticamente quando as variáveis `S3_*` estão preenchidas — não depende de disco do servidor, então funciona igual em Railway/Vercel.
- **Mercado Pago:** cadastre a `notification_url` (webhook) no painel de integrações apontando para `<sua_api>/api/payments/webhook`.
- **E-mail:** configure `SMTP_*` com seu provedor (ex.: Resend, SendGrid, Amazon SES) para ativar as notificações de pedido/receita.
- **Erros em produção:** configure `SENTRY_DSN` para acompanhar exceções do backend em tempo real.

## Foto do entregador na landing page

Por padrão a landing usa uma ilustração vetorial (sem uso de foto de terceiros sem licença). Para usar uma foto real, basta colocar o arquivo em:

```
frontend/public/images/delivery-hero.jpg
```

O site detecta o arquivo automaticamente e passa a exibi-lo no lugar da ilustração.

## Ainda vale considerar antes do lançamento

- **Revisão jurídica da LGPD** — o modelo de política de privacidade em `/privacidade` e o fluxo de exclusão de conta são um ponto de partida, não substituem um advogado revisando o tratamento de dado de saúde (receita médica).
- **Testes de integração mais completos** — a suíte atual cobre o essencial (frete, validação, health check); vale ampliar para os fluxos de pedido, pagamento e chat à medida que o produto crescer.
- **Moderação do chat** — a Bia tem instruções fortes pra nunca dar conselho médico, mas vale acompanhar as conversas reais nas primeiras semanas pra confirmar que o comportamento está sempre dentro do esperado.
