import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const daqui5dias = new Date()
  daqui5dias.setDate(daqui5dias.getDate() + 5)
  const dataAlvo = daqui5dias.toISOString().split('T')[0]

  const { data: contas, error } = await supabaseAdmin
    .from('contas')
    .select('*')
    .eq('vencimento', dataAlvo)
    .eq('aviso_enviado', false)

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar contas' })
  }

  for (const conta of contas) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(conta.user_id)
    const email = userData?.user?.email

    if (!email) continue

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Sua conta vence em 5 dias!',
      html: `Sua conta "${conta.descricao}" no valor de R$ ${conta.valor} vence em ${conta.vencimento}. Não esqueça de pagar!`
    })

    await supabaseAdmin
      .from('contas')
      .update({ aviso_enviado: true })
      .eq('id', conta.id)
  }

  return res.status(200).json({ processadas: contas.length })
}