import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

const formatarDataBrasil = (data) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(data)
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const hojeBrasil = formatarDataBrasil(new Date())
  const [ano, mes, dia] = hojeBrasil.split('-').map(Number)
  const limite = new Date(ano, mes - 1, dia + 5)
  const dataLimite = formatarDataBrasil(limite)

  const { data: contas, error } = await supabaseAdmin
    .from('contas')
    .select('*')
    .eq('pago', false)
    .gte('vencimento', hojeBrasil)
    .lte('vencimento', dataLimite)

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar contas' })
  }

  let enviados = 0

  for (const conta of contas) {
    if (conta.ultimo_aviso_enviado === hojeBrasil) continue

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(conta.user_id)
    const email = userData?.user?.email
    if (!email) continue

    const dataVenc = new Date(conta.vencimento + 'T00:00:00')
    const hoje = new Date(hojeBrasil + 'T00:00:00')
    const diasRestantes = Math.round((dataVenc - hoje) / (1000 * 60 * 60 * 24))

    const assunto = diasRestantes === 0
      ? 'Sua conta vence hoje!'
      : `Sua conta vence em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}!`

    const textoDias = diasRestantes === 0
      ? 'vence <strong>hoje</strong>'
      : `vence em <strong>${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}</strong>`

    await resend.emails.send({
      from: 'IA TECK <avisos@iateck.com.br>',
      to: email,
      subject: assunto,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6c63ff;">IA TECK</h2>
          <p>Sua conta <strong>"${conta.descricao}"</strong> ${textoDias}.</p>
          <p style="font-size: 18px;"><strong>Valor:</strong> R$ ${conta.valor}</p>
          <p><strong>Data de vencimento:</strong> ${conta.vencimento}</p>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">Não esqueça de marcar como paga no painel assim que quitar essa conta.</p>
        </div>
      `
    })

    await supabaseAdmin
      .from('contas')
      .update({ ultimo_aviso_enviado: hojeBrasil })
      .eq('id', conta.id)

    enviados++
  }

  return res.status(200).json({ processadas: enviados })
}