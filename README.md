# 🚀 Projeto IA TECK — Gestão Financeira Automatizada

Aplicação web completa para controle de contas a pagar, com login sem senha, lembretes automáticos por e-mail e recorrência mensal. Construída do zero com frontend React e um backend serverless próprio, usando Supabase como banco de dados e autenticação, e Resend para envio de e-mails transacionais.

🔗 **[iateck.com.br](https://iateck.com.br)**

## 🖥️ Frontend (React + Vite)

Interface responsiva construída com React.js, utilizando hooks (`useState`, `useEffect`) e React Router para navegação entre login e painel. O painel permite criar, editar, excluir e marcar contas como pagas, com suporte a contas recorrentes (que se recriam automaticamente no mês seguinte ao serem pagas).

## 📊 Dashboard pessoal

Cada usuário tem seu próprio painel, dividido em duas abas:

- **Dashboard** — cartões clicáveis (total pendente, total pago, contas vencidas, vencendo em 7 dias, total de contas) que filtram uma tabela de contas por status (Recentes, A vencer, Vencidas, Pagas); gráfico de valores por mês de vencimento; barra de status; e um calendário mensal com os vencimentos marcados por dia.
- **Contas** — lista completa para criar, editar, marcar como paga e excluir.

Os dados são carregados uma vez e depois atualizados automaticamente: toda ação do usuário atualiza o painel na hora, e uma inscrição no Supabase Realtime reflete mudanças feitas em outro dispositivo/aba sem precisar recarregar a página.

## 🌗 Modo escuro

Alternância de tema claro/escuro (ícone no cabeçalho), com a preferência salva em `localStorage` e aplicada em todo o site.

## 🔐 Autenticação (Supabase Auth)

Login sem senha, via código de verificação de 6 dígitos enviado por e-mail (OTP). Funciona em qualquer dispositivo, sem depender de abrir um link no mesmo aparelho onde o login foi solicitado.

## 🗄️ Banco de dados (Supabase / Postgres)

Tabela `contas` com Row Level Security (RLS) ativado — cada usuário só acessa suas próprias contas, garantido no nível do banco de dados, não apenas na aplicação. Replicação (Realtime) habilitada para que o dashboard reaja a mudanças na tabela em tempo real.

## ⚙️ Backend (Vercel Serverless Functions + Cron)

- `POST /api/formulario` — recebe e salva novas contas
- `GET /api/verificar-vencimentos` — executado automaticamente todo dia via Vercel Cron Jobs; verifica contas com vencimento nos próximos 5 dias e envia lembretes por e-mail, decrescendo a contagem diariamente até a conta ser paga ou vencer

## 📧 E-mail transacional (Resend)

Domínio próprio verificado (`iateck.com.br`), com SPF e DKIM configurados, usado tanto para os e-mails de autenticação (via SMTP customizado no Supabase) quanto para os lembretes de vencimento.

## 📌 Experiência do usuário

1. Usuário informa o e-mail e recebe um código de 6 dígitos
2. Confirma o código e acessa seu painel pessoal, com dashboard, calendário e lista de contas
3. Cadastra contas com data de vencimento e, opcionalmente, recorrência mensal
4. Recebe lembretes automáticos por e-mail conforme o vencimento se aproxima
5. Marca como paga quando quitar — se for recorrente, a próxima conta é criada automaticamente
6. Acompanha tudo em tempo real, no tema claro ou escuro, em qualquer tamanho de tela

## 🛠️ Tecnologias utilizadas

React.js • Vite • React Router • JavaScript • Node.js • Vercel Functions • Vercel Cron Jobs • Supabase (Postgres, Auth, RLS, Realtime) • Resend • REST API • Git • GitHub • Vercel • Claude

---

## Instalação local

Clone o repositório:
```bash
git clone https://github.com/Brunoverly77/IA_TECK.git
```
Entre na pasta:
```bash
cd IA_TECK
```
Instale as dependências:
```bash
npm install
```
Rode o projeto (frontend):
```bash
npm run dev
```
Para testar o backend localmente também, use o Vercel CLI:
```bash
npm install -g vercel
vercel dev
```
