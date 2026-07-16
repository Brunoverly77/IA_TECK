import { google } from 'googleapis'
import nodemailer from 'nodemailer'

const SPREADSHEET_INDICE_ID = process.env.SPREADSHEET_INDICE_ID
const TEMPLATE_FILE_ID = process.env.TEMPLATE_FILE_ID

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  })
  return oauth2Client
}

async function buscarPlanilhaPorEmail(sheets, gmail) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_INDICE_ID,
    range: 'Principal!A:B'
  })
  const rows = res.data.values || []
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === gmail) {
      return rows[i][1]
    }
  }
  return null
}

async function appendRow(sheets, spreadsheetId, sheetName, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:G`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] }
  })
}

async function enviarEmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  })

  await transporter.sendMail({
    from: `"IA TECK" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { nome, sobrenome, gmail, data, vencimento, descricao, valor } = req.body

    if (!nome || !sobrenome || !gmail || !data || !vencimento || !descricao || !valor) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    }

    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const drive = google.drive({ version: 'v3', auth })

    const planilhaId = await buscarPlanilhaPorEmail(sheets, gmail)

    if (planilhaId) {
      await appendRow(sheets, planilhaId, 'Teack', [
        nome, sobrenome, descricao, valor, data, vencimento, gmail
      ])

      const link = `https://docs.google.com/spreadsheets/d/${planilhaId}`

      await enviarEmail({
        to: gmail,
        subject: 'Sua planilha IA TECK foi atualizada!',
        html: `Olá ${nome}! Sua planilha foi atualizada com novos dados. Acesse todas suas informações aqui: <a href="${link}">${link}</a>`
      })

      return res.status(200).json({ link })
    } else {
      const copia = await drive.files.copy({
        fileId: TEMPLATE_FILE_ID,
        requestBody: { name: `${nome} ${sobrenome}` }
      })
      const novoId = copia.data.id

      await appendRow(sheets, novoId, 'Teack', [
        nome, sobrenome, descricao, valor, data, vencimento, gmail
      ])

      await drive.permissions.create({
        fileId: novoId,
        requestBody: { role: 'reader', type: 'anyone' }
      })

      await appendRow(sheets, SPREADSHEET_INDICE_ID, 'Principal', [gmail, novoId])

      const link = `https://docs.google.com/spreadsheets/d/${novoId}`

      await enviarEmail({
        to: gmail,
        subject: 'Sua planilha IA TECK está pronta!',
        html: `Olá ${nome}! Sua planilha está pronta. Acesse aqui: <a href="${link}">${link}</a>`
      })

      return res.status(200).json({ link })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao processar formulário' })
  }
}