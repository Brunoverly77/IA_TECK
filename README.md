# 🚀 Projeto IA TECK — Automação Financeira com React + Vercel Functions + Google Workspace

Desenvolvi do zero uma aplicação web completa de gestão financeira automatizada, integrando frontend moderno com um backend serverless próprio.

## 🖥️ Frontend (React + Vite)

Interface responsiva construída com React.js, utilizando hooks (`useState`), componentização e consumo de API via Fetch. O formulário coleta dados financeiros como nome, datas, contas e valores formatados em BRL, com validação de email `@gmail.com` e feedback visual em tempo real.

## ⚙️ Backend (Vercel Serverless Functions)

Backend próprio em Node.js, rodando como função serverless na Vercel, com lógica condicional inteligente:

- Recebe os dados do formulário via `POST /api/formulario`
- Verifica se o usuário já existe na planilha índice
- **Usuário novo**: copia uma planilha-modelo via Google Drive API, adiciona os dados, compartilha automaticamente e registra o usuário na planilha índice
- **Usuário existente**: adiciona uma nova linha na planilha já existente e reenvia o link por e-mail

## ☁️ Google Workspace Integration

- **Google Sheets API** para leitura/escrita nas planilhas individuais de cada usuário
- **Google Drive API** para cópia do template e compartilhamento automático (autenticação via OAuth2 com conta pessoal)
- **Gmail (via Nodemailer)** para envio automático de e-mails com o link personalizado

## 📌 Experiência do Usuário

Após preencher o formulário, o usuário recebe o link da sua planilha personalizada pelo site e por e-mail. A planilha já é criada diretamente na conta do proprietário do projeto, com acesso de leitura compartilhado.

## 🛠️ Tecnologias utilizadas

React.js • Vite • JavaScript • Node.js • Vercel Functions • Google Sheets API • Google Drive API • Nodemailer • REST API • Git • GitHub • Vercel • Claude

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

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# URL do backend (relativa, já que front e backend estão no mesmo domínio)
VITE_WEBHOOK_URL=/api/formulario

# IDs das planilhas/arquivos do Google Drive
SPREADSHEET_INDICE_ID=id_da_planilha_indice
TEMPLATE_FILE_ID=id_da_planilha_modelo

# Credenciais OAuth2 do Google (para acesso ao Drive/Sheets em nome da conta pessoal)
GOOGLE_OAUTH_CLIENT_ID=seu_client_id
GOOGLE_OAUTH_CLIENT_SECRET=seu_client_secret
GOOGLE_OAUTH_REFRESH_TOKEN=seu_refresh_token

# Envio de e-mail via Gmail
GMAIL_USER=seu_email@gmail.com
GMAIL_APP_PASSWORD=sua_senha_de_app
```

> As credenciais nunca devem ser commitadas no repositório — o `.env` já está listado no `.gitignore`. Em produção, essas variáveis são cadastradas diretamente no painel da Vercel (**Settings → Environment Variables**).
