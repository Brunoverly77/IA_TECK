🚀 Projeto IA TECK —
 Automação Financeira com React + N8N + Google Workspace
Desenvolvi do zero uma aplicação web completa de gestão financeira automatizada, integrando frontend moderno com um fluxo de automação inteligente.

🖥️ Frontend (React + Vite)
Interface responsiva construída com React.js, utilizando hooks (useState), componentização e consumo de API via Fetch. O formulário coleta dados financeiros como nome, datas, contas e valores formatados em BRL, com validação de email @gmail.com e feedback visual em tempo real.

⚙️ Automação (N8N Cloud)
Fluxo de trabalho no N8N com lógica condicional inteligente:
Webhook para receber os dados do formulário
Verificação se o usuário já existe na base de dados
Caminho False (novo usuário): cria planilha personalizada via Google Drive API, compartilha automaticamente e registra no banco de dados
Caminho True (usuário existente): adiciona nova linha na planilha já existente e reenvia o link por email

☁️ Google Workspace Integration
Google Sheets API para criação e gerenciamento de planilhas individuais por usuário
Google Drive API para cópia de template e compartilhamento automático
Gmail API para envio automático de emails com link personalizado

📌 Experiência do Usuário
Após preencher o formulário, o usuário recebe o link da sua planilha personalizada pelo site e por email. Para salvar permanentemente no próprio Google Drive, basta abrir o link e clicar em "Adicionar ao Meu Drive" — a planilha passa a ser totalmente do usuário!

🛠️ Tecnologias utilizadas
React.js • Vite • JavaScript • N8N • Google Sheets API • Google Drive API • Gmail API • REST API • Webhooks • Git • GitHub • Vercel • Render • Claude


```bash
# Clone o repositório
git clone https://github.com/Brunoverly77/IA_TECK.git

# Entre na pasta
cd IA_TECK

# Instale as dependências
npm install

# Crie o arquivo .env
VITE_WEBHOOK_URL=sua_url_do_webhook

# Rode o projeto
npm run dev
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```
VITE_WEBHOOK_URL=sua_url_do_webhook
```
