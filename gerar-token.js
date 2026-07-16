import { google } from 'googleapis'
import http from 'http'
import { exec } from 'child_process'
import 'dotenv/config'

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:3333/callback'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Faltam GOOGLE_OAUTH_CLIENT_ID e/ou GOOGLE_OAUTH_CLIENT_SECRET no .env')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive']
})

console.log('\nAbrindo o navegador para você autorizar o acesso...')
console.log('Se não abrir sozinho, copie e cole esse link no navegador:\n')
console.log(authUrl + '\n')

const abrirComando =
  process.platform === 'darwin' ? 'open' :
  process.platform === 'win32' ? 'start' : 'xdg-open'

exec(`${abrirComando} "${authUrl}"`)

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/callback')) {
    const url = new URL(req.url, REDIRECT_URI)
    const code = url.searchParams.get('code')

    if (!code) {
      res.end('Erro: nenhum código recebido.')
      return
    }

    try {
      const { tokens } = await oauth2Client.getToken(code)
      res.end('<h2>Pronto! Pode fechar esta aba e voltar pro terminal.</h2>')

      console.log('\n✅ Sucesso! Copie a linha abaixo e cole no seu .env:\n')
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`)
    } catch (err) {
      console.error('Erro ao trocar o código pelo token:', err.message)
      res.end('Erro ao gerar o token. Veja o terminal.')
    }

    server.close()
    process.exit(0)
  }
})

server.listen(3333, () => {
  console.log('Aguardando autorização no navegador...')
})