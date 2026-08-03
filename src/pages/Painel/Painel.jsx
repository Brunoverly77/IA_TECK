import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import './Painel.css'

function Painel() {
  const navigate = useNavigate()
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [contaEditando, setContaEditando] = useState(null)
  const [form, setForm] = useState({ descricao: '', valor: '', data: '', vencimento: '', recorrente: false })

  useEffect(() => {
    verificarSessaoECarregar()
  }, [])

  const verificarSessaoECarregar = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      navigate('/')
      return
    }

    await carregarContas()
  }

  const carregarContas = async () => {
    setCarregando(true)
    const { data, error } = await supabase
      .from('contas')
      .select('*')
      .order('vencimento', { ascending: true })

    if (!error) setContas(data)
    setCarregando(false)
  }

    const abrirModalNova = () => {
    setContaEditando(null)
    setForm({ descricao: '', valor: '', data: '', vencimento: '', recorrente: false })
    setModalAberto(true)
  }

    const abrirModalEditar = (conta) => {
    setContaEditando(conta)
    setForm({
      descricao: conta.descricao,
      valor: conta.valor,
      data: conta.data,
      vencimento: conta.vencimento,
      recorrente: conta.recorrente || false
    })
    setModalAberto(true)
  }

  const [erroSalvar, setErroSalvar] = useState('')

  const handleSalvar = async (e) => {
    e.preventDefault()
    setErroSalvar('')
    const { data: { user } } = await supabase.auth.getUser()

    let resultado
    if (contaEditando) {
      resultado = await supabase
        .from('contas')
        .update({ ...form })
        .eq('id', contaEditando.id)
    } else {
      resultado = await supabase
        .from('contas')
        .insert({ ...form, user_id: user.id, nome: '', sobrenome: '' })
    }

    if (resultado.error) {
      setErroSalvar('Não foi possível salvar. Tente novamente.')
      return
    }

    setModalAberto(false)
    await carregarContas()
  }

  const handleExcluir = async (id) => {
    const confirmar = window.confirm('Excluir essa conta?')
    if (!confirmar) return

    await supabase.from('contas').delete().eq('id', id)
    await carregarContas()
  }

  const handleMarcarPaga = async (conta) => {
  await supabase
    .from('contas')
    .update({ pago: true })
    .eq('id', conta.id)

  if (conta.recorrente) {
    const proximoVencimento = new Date(conta.vencimento)
    proximoVencimento.setMonth(proximoVencimento.getMonth() + 1)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('contas').insert({
      descricao: conta.descricao,
      valor: conta.valor,
      data: new Date().toISOString().split('T')[0],
      vencimento: proximoVencimento.toISOString().split('T')[0],
      recorrente: true,
      pago: false,
      aviso_enviado: false,
      user_id: user.id,
      nome: '',
      sobrenome: ''
    })
  }

  await carregarContas()
}

  const statusConta = (vencimento) => {
    const hoje = new Date()
    const dataVenc = new Date(vencimento)
    const diffDias = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24))

    if (diffDias < 0) return { texto: 'Vencida', classe: 'status-vencida' }
    if (diffDias <= 5) return { texto: `Vence em ${diffDias} dias`, classe: 'status-proxima' }
    return { texto: 'Em dia', classe: 'status-ok' }
  }

  if (carregando) return <div className="painel-container">Carregando...</div>

  return (
    <div className="painel-container">
      <div className="painel-header">
        <h1>Minhas contas</h1>
        <button className="btn-nova" onClick={abrirModalNova}>+ Nova conta</button>
      </div>

      <div className="lista-contas">
        {contas.filter(c => !c.pago).length === 0 && <p className="vazio">Nenhuma conta pendente.</p>}

        {contas.filter(c => !c.pago).map((conta) => {
          const status = statusConta(conta.vencimento)
          return (
            <div key={conta.id} className="conta-card">
              <div>
                <p className="conta-descricao">{conta.descricao}</p>
                <p className="conta-info">Vencimento: {conta.vencimento} · R$ {conta.valor}</p>
              </div>
              <div className="conta-acoes">
                <span className={`status ${status.classe}`}>{status.texto}</span>
                <button onClick={() => handleMarcarPaga(conta)}>Marcar como paga</button>
                <button onClick={() => abrirModalEditar(conta)}>Editar</button>
                <button onClick={() => handleExcluir(conta.id)}>Excluir</button>
              </div>
            </div>
          )
        })}
      </div>

      {contas.filter(c => c.pago).length > 0 && (
        <div className="historico-pagas">
          <h3>Contas pagas</h3>
          {contas.filter(c => c.pago).map((conta) => (
            <div key={conta.id} className="conta-paga">
              <span>{conta.descricao} · R$ {conta.valor}</span>
              <button onClick={() => handleExcluir(conta.id)}>Excluir</button>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="modal-fundo" onClick={() => setModalAberto(false)}>
          <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
            <h2>{contaEditando ? 'Editar conta' : 'Nova conta'}</h2>
            <form onSubmit={handleSalvar}>
              <div className="campo">
                <label>Descrição</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  required
                />
              </div>
              <div className="campo">
                <label>Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  required
                />
              </div>
              <div className="linha">
                <div className="campo">
                  <label>Data</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    required
                  />
                </div>
                <div className="campo">
                  <label>Vencimento</label>
                  <input
                    type="date"
                    value={form.vencimento}
                    onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="campo campo-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={form.recorrente}
                    onChange={(e) => setForm({ ...form, recorrente: e.target.checked })}
                  />
                  {' '}Essa conta se repete todo mês
                </label>
              </div>
              {erroSalvar && <p className="erro">{erroSalvar}</p>}
              <button type="submit">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Painel