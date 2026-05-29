import { useState } from 'react'
import './Formulario.css'
import { enviarFormulario } from '../../services/api'

function Formulario() {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    gmail: '',
    data: '',
    vencimento: '',
    descricao: '',
    valor: ''
  })

  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [historico, setHistorico] = useState([])
  const [linkPlanilha, setLinkPlanilha] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleValor = (e) => {
    let valor = e.target.value.replace(/\D/g, '')
    valor = (Number(valor) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
    setFormData({ ...formData, valor })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const resultado = await enviarFormulario(formData)
      setLinkPlanilha(resultado.link)
      setHistorico([...historico, { ...formData, link: resultado.link }])
      setSucesso(true)
      setFormData({
        nome: '',
        sobrenome: '',
        gmail: '',
        data: '',
        vencimento: '',
        descricao: '',
        valor: ''
      })
      setTimeout(() => setSucesso(false), 20000)
    } catch (error) {
      alert('Erro ao enviar! Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="formulario-container">
      <h1>IA TECK</h1>
      <p>Preencha os campos abaixo</p>

      {sucesso && (
        <div className="mensagem-sucesso">
          ✅ Enviado com sucesso!
          <a
            href={linkPlanilha}
            target="_blank"
            rel="noreferrer"
          >
            Clique aqui para ver sua planilha
          </a>
          <span className="aviso-email">📧 Você também receberá o link por e-mail!</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="linha">
          <div className="campo">
            <label>Nome</label>
            <input name="nome" placeholder="Digite seu nome" value={formData.nome} onChange={handleChange} required />
          </div>
          <div className="campo">
            <label>Sobrenome</label>
            <input name="sobrenome" placeholder="Digite seu sobrenome" value={formData.sobrenome} onChange={handleChange} required />
          </div>
        </div>

        <div className="campo">
          <label>Gmail</label>
          <input
            name="gmail"
            placeholder="exemplo@gmail.com"
            type="email"
            value={formData.gmail}
            onChange={handleChange}
            pattern="^[a-zA-Z0-9._%+\-]+@gmail\.com$"
            title="Digite um email @gmail.com válido"
            required
          />
        </div>

        <div className="linha">
          <div className="campo">
            <label>Data</label>
            <input name="data" type="date" value={formData.data} onChange={handleChange} required />
          </div>
          <div className="campo">
            <label>Vencimento</label>
            <input name="vencimento" type="date" value={formData.vencimento} onChange={handleChange} required />
          </div>
        </div>

        <div className="campo">
          <label>Contas</label>
          <input name="descricao" placeholder="Descreva a conta" value={formData.descricao} onChange={handleChange} required />
        </div>

        <div className="campo">
          <label>Valor</label>
          <input name="valor" placeholder="R$ 0,00" value={formData.valor} onChange={handleValor} required />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? (
            <span className="spinner"></span>
          ) : 'Enviar'}
        </button>
      </form>

      {historico.length > 0 && (
        <div className="historico">
          <h2>Histórico de Envios</h2>
          {historico.map((item, index) => (
            <div key={index} className="historico-item">
              <p><strong>{item.nome} {item.sobrenome}</strong> — {item.gmail}</p>
              <p>{item.descricao} | {item.valor}</p>
              <p>Data: {item.data} | Vencimento: {item.vencimento}</p>
              {item.link && (
                <a href={item.link} target="_blank" rel="noreferrer">Ver planilha</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Formulario