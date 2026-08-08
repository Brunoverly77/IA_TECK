import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useTema } from '../../hooks/useTema'
import './Login.css'

function Login() {
  const [escuro, setEscuro] = useTema()
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [etapa, setEtapa] = useState('email')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const handleEnviarCodigo = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithOtp({ email })

    setLoading(false)

    if (error) {
      setErro('Não deu pra enviar o código. Tente novamente.')
      return
    }

    setEtapa('codigo')
  }

  const handleConfirmarCodigo = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: codigo,
      type: 'email'
    })

    setLoading(false)

    if (error) {
      setErro('Código incorreto ou expirado. Tente novamente.')
      return
    }

    navigate('/painel')
  }

  return (
    <div className="login-container">
      <div className="login-topo">
        <button
          className="btn-tema"
          onClick={() => setEscuro(v => !v)}
          title={escuro ? 'Modo claro' : 'Modo escuro'}
          type="button"
        >
          {escuro ? '☀️' : '🌙'}
        </button>
      </div>
      <h1>IA TECK</h1>
      <p>Entre com seu e-mail pra ver suas contas</p>

      {etapa === 'email' && (
        <form onSubmit={handleEnviarCodigo}>
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
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      )}

      {etapa === 'codigo' && (
        <form onSubmit={handleConfirmarCodigo}>
          <p className="aviso-codigo">Enviamos um código de 6 dígitos para {email}</p>
          <div className="campo">
            <label>Código</label>
            <input
              type="text"
              placeholder="123456"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          {erro && <p className="erro">{erro}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Confirmando...' : 'Confirmar código'}
          </button>
          <button
            type="button"
            className="btn-voltar"
            onClick={() => { setEtapa('email'); setCodigo(''); setErro('') }}
          >
            Usar outro e-mail
          </button>
        </form>
      )}
    </div>
  )
}

export default Login