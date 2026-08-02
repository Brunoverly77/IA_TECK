import { useState } from 'react'
import { supabase } from '../../services/supabase'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/painel'
      }
    })

    setLoading(false)

    if (error) {
      setErro('Não deu pra enviar o link. Tente novamente.')
      return
    }

    setEnviado(true)
  }

  return (
    <div className="login-container">
      <h1>IA TECK</h1>
      <p>Entre com seu e-mail pra ver suas contas</p>

      {enviado ? (
        <div className="mensagem-sucesso">
          Link enviado! Confira sua caixa de entrada em {email}.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="campo">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="exemplo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {erro && <p className="erro">{erro}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link mágico'}
          </button>
        </form>
      )}
    </div>
  )
}

export default Login