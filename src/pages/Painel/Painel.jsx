import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useTema } from '../../hooks/useTema'
import './Painel.css'

// 'YYYY-MM-DD' precisa ser lido no fuso local: new Date('2026-09-01') seria
// meia-noite em UTC, ou seja 31/08 às 21h no Brasil — um dia a menos.
const dataLocal = (iso) => {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

const formatarDataISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const inicioDoDia = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// dias inteiros entre hoje e o vencimento, sem depender da hora atual
const diasAte = (vencimento) =>
  Math.round((dataLocal(vencimento) - inicioDoDia()) / (1000 * 60 * 60 * 24))

function Painel() {
  const navigate = useNavigate()
  const [escuro, setEscuro] = useTema()
  const [aba, setAba] = useState('dashboard')
  const [filtroTabela, setFiltroTabela] = useState('recentes')
  const [cardAtivo, setCardAtivo] = useState(null)
  const [processandoId, setProcessandoId] = useState(null)
  const [mostrarTodasPagas, setMostrarTodasPagas] = useState(false)
  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoje = new Date()
    hoje.setDate(1)
    return hoje
  })
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [contaEditando, setContaEditando] = useState(null)
  const [form, setForm] = useState({ descricao: '', valor: '', data: '', vencimento: '', recorrente: false })

  // silencioso: recarrega sem mostrar a tela de "Carregando...", pra nao piscar
  // o painel inteiro a cada evento do Realtime ou a cada acao do usuario
  const carregarContas = async ({ silencioso = false } = {}) => {
    if (!silencioso) setCarregando(true)

    const { data, error } = await supabase
      .from('contas')
      .select('*')
      .order('vencimento', { ascending: true })

    if (!error) setContas(data)
    if (!silencioso) setCarregando(false)
  }

  useEffect(() => {
    let canal

    const iniciar = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        navigate('/')
        return
      }

      await carregarContas()

      canal = supabase
        .channel('contas-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'contas',
          filter: `user_id=eq.${session.user.id}`
        }, () => {
          carregarContas({ silencioso: true })
        })
        .subscribe()
    }

    iniciar()

    return () => {
      if (canal) supabase.removeChannel(canal)
    }
  }, [navigate])

  // recalcula os status de vencimento (ex: "Vence em X dias") mesmo sem nenhuma ação do usuário
  const [, forcarAtualizacao] = useState(0)
  useEffect(() => {
    const intervalo = setInterval(() => forcarAtualizacao(t => t + 1), 60000)
    return () => clearInterval(intervalo)
  }, [])

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
    await carregarContas({ silencioso: true })
  }

  const handleExcluir = async (id) => {
    const confirmar = window.confirm('Excluir essa conta?')
    if (!confirmar) return

    const { error } = await supabase.from('contas').delete().eq('id', id)

    if (error) {
      alert('Não foi possível excluir essa conta. Tente novamente.')
      return
    }

    await carregarContas({ silencioso: true })
  }

  const handleMarcarPaga = async (conta) => {
    if (processandoId) return
    setProcessandoId(conta.id)

    try {
      const { error: erroUpdate } = await supabase
        .from('contas')
        .update({ pago: true })
        .eq('id', conta.id)

      if (erroUpdate) {
        alert('Não foi possível marcar essa conta como paga. Tente novamente.')
        return
      }

      if (conta.recorrente) {
        const [ano, mes, dia] = conta.vencimento.split('-').map(Number)
        const proximoVencimento = formatarDataISO(new Date(ano, mes, dia))

        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase.from('contas').insert({
          descricao: conta.descricao,
          valor: conta.valor,
          data: formatarDataISO(new Date()),
          vencimento: proximoVencimento,
          recorrente: true,
          pago: false,
          ultimo_aviso_enviado: null,
          user_id: user.id,
          nome: '',
          sobrenome: ''
        })

        if (error) {
          alert('A conta foi marcada como paga, mas não consegui criar a próxima conta recorrente automaticamente. Crie ela manualmente pra não perder o controle.')
        }
      }

      await carregarContas({ silencioso: true })
    } finally {
      setProcessandoId(null)
    }
  }

  const statusConta = (vencimento) => {
    const dias = diasAte(vencimento)

    if (dias < 0) return { texto: 'Vencida', classe: 'status-vencida' }
    if (dias === 0) return { texto: 'Vence hoje', classe: 'status-proxima' }
    if (dias === 1) return { texto: 'Vence amanhã', classe: 'status-proxima' }
    if (dias <= 5) return { texto: `Vence em ${dias} dias`, classe: 'status-proxima' }
    return { texto: 'Em dia', classe: 'status-ok' }
  }

  const formatarValor = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const montarResumo = () => {
    const hoje = inicioDoDia()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    const pendentes = contas.filter(c => !c.pago)
    const pagas = contas.filter(c => c.pago)
    const vencidas = pendentes.filter(c => diasAte(c.vencimento) < 0)
    const aVencer = pendentes.filter(c => diasAte(c.vencimento) >= 0)
    const vencendoEm7 = pendentes.filter(c => {
      const dias = diasAte(c.vencimento)
      return dias >= 0 && dias <= 7
    })

    const totalPendente = pendentes.reduce((soma, c) => soma + Number(c.valor), 0)
    const totalPago = pagas.reduce((soma, c) => soma + Number(c.valor), 0)

    const pagasEsteMes = pagas.filter(c => {
      const data = dataLocal(c.vencimento)
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual
    })
    const totalPagoMes = pagasEsteMes.reduce((soma, c) => soma + Number(c.valor), 0)

    // o grafico mostra os ultimos 6 meses e tudo que ainda esta por vir, senao
    // ele ganharia uma barra nova todo mes pra sempre por causa das recorrentes
    const ordemAtual = anoAtual * 12 + mesAtual
    const porMes = {}
    contas.forEach(c => {
      const data = dataLocal(c.vencimento)
      const ordem = data.getFullYear() * 12 + data.getMonth()
      if (ordem < ordemAtual - 5) return

      if (!porMes[ordem]) {
        porMes[ordem] = { label: data.toLocaleDateString('pt-BR', { month: 'short' }), total: 0, ordem }
      }
      porMes[ordem].total += Number(c.valor)
    })
    const grafico = Object.values(porMes).sort((a, b) => a.ordem - b.ordem)
    const maiorValor = Math.max(1, ...grafico.map(m => m.total))

    return { pendentes, pagas, pagasEsteMes, vencidas, aVencer, vencendoEm7, totalPendente, totalPago, totalPagoMes, grafico, maiorValor }
  }

  const rotulosFiltro = {
    recentes: 'Recentes',
    avencer: 'A vencer',
    vencidas: 'Vencidas',
    pagas: 'Pagas',
    pendentes: 'Pendentes',
    vencendo7: 'Vencendo em 7 dias',
    'pagas-mes': 'Pagas este mês'
  }

  // o card e a aba da tabela sao controles distintos: varios cards levam ao mesmo
  // filtro, entao guardar qual card foi clicado evita acender dois de uma vez
  const selecionarCard = (id, filtro) => {
    setCardAtivo(id)
    setFiltroTabela(filtro)
  }

  const selecionarAba = (filtro) => {
    setCardAtivo(null)
    setFiltroTabela(filtro)
  }

  const maisProximo = (a, b) => dataLocal(a.vencimento) - dataLocal(b.vencimento)
  const maisRecente = (a, b) => dataLocal(b.vencimento) - dataLocal(a.vencimento)

  const contasDaTabela = (resumo) => {
    switch (filtroTabela) {
      case 'avencer':
        return [...resumo.aVencer].sort(maisProximo)
      case 'vencidas':
        return [...resumo.vencidas].sort(maisProximo)
      case 'pagas':
        return [...resumo.pagas].sort(maisRecente)
      case 'pagas-mes':
        return [...resumo.pagasEsteMes].sort(maisRecente)
      case 'pendentes':
        return [...resumo.pendentes].sort(maisProximo)
      case 'vencendo7':
        return [...resumo.vencendoEm7].sort(maisProximo)
      default:
        return [...contas].sort((a, b) => dataLocal(b.data) - dataLocal(a.data))
    }
  }

  const statusBadge = (conta) => {
    if (conta.pago) return { texto: 'Paga', classe: 'status-paga' }
    return statusConta(conta.vencimento)
  }

  const mudarMes = (delta) => {
    setMesCalendario(atual => {
      const novo = new Date(atual)
      novo.setMonth(novo.getMonth() + delta)
      return novo
    })
    setDiaSelecionado(null)
  }

  const montarDiasCalendario = () => {
    const ano = mesCalendario.getFullYear()
    const mesIndex = mesCalendario.getMonth()
    const diasNoMes = new Date(ano, mesIndex + 1, 0).getDate()
    const diaSemanaInicio = new Date(ano, mesIndex, 1).getDay()

    const dias = []
    for (let i = 0; i < diaSemanaInicio; i++) dias.push(null)
    for (let d = 1; d <= diasNoMes; d++) {
      dias.push(formatarDataISO(new Date(ano, mesIndex, d)))
    }
    return dias
  }

  if (carregando) return <div className="painel-container">Carregando...</div>

  const resumo = montarResumo()
  const totalStatus = resumo.pagas.length + resumo.vencidas.length + resumo.aVencer.length || 1
  const linhasTabela = contasDaTabela(resumo)

  const contasPorDia = {}
  contas.forEach(c => {
    if (!contasPorDia[c.vencimento]) contasPorDia[c.vencimento] = []
    contasPorDia[c.vencimento].push(c)
  })

  const hojeChave = formatarDataISO(new Date())
  const diasCalendario = montarDiasCalendario()
  const historicoPagas = [...resumo.pagas].sort(maisRecente)

  return (
    <div className="painel-container">
      <div className="painel-header">
        <h1>Minhas contas</h1>
        <div className="painel-header-acoes">
          <button
            className="btn-tema"
            onClick={() => setEscuro(v => !v)}
            title={escuro ? 'Modo claro' : 'Modo escuro'}
            type="button"
          >
            {escuro ? '☀️' : '🌙'}
          </button>
          <button className="btn-nova" onClick={abrirModalNova}>+ Nova conta</button>
        </div>
      </div>

      <div className="painel-tabs">
        <button
          type="button"
          className={`tab-btn ${aba === 'dashboard' ? 'tab-ativa' : ''}`}
          onClick={() => setAba('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`tab-btn ${aba === 'contas' ? 'tab-ativa' : ''}`}
          onClick={() => setAba('contas')}
        >
          Contas
        </button>
      </div>

      {aba === 'dashboard' && (
        <>
          <div className="resumo-cards">
            {[
              { id: 'total-pendente', filtro: 'pendentes', icone: '💰', label: 'Total pendente', valor: formatarValor(resumo.totalPendente) },
              { id: 'pagamento-total', filtro: 'pagas', icone: '✅', label: 'Pagamento total', valor: formatarValor(resumo.totalPago), cor: 'resumo-verde' },
              { id: 'pago-mes', filtro: 'pagas-mes', icone: '📆', label: 'Pago este mês', valor: formatarValor(resumo.totalPagoMes), cor: 'resumo-verde' },
              { id: 'contas-pagas-mes', filtro: 'pagas-mes', icone: '🧾', label: 'Contas pagas este mês', valor: resumo.pagasEsteMes.length, cor: 'resumo-verde' },
              { id: 'vencidas', filtro: 'vencidas', icone: '⚠️', label: 'Contas vencidas', valor: resumo.vencidas.length },
              { id: 'vencendo7', filtro: 'vencendo7', icone: '⏰', label: 'Vencendo em 7 dias', valor: resumo.vencendoEm7.length, cor: 'resumo-laranja' },
              { id: 'em-aberto', filtro: 'pendentes', icone: '📋', label: 'Contas em aberto', valor: resumo.pendentes.length }
            ].map(card => (
              <button
                key={card.id}
                type="button"
                className={`resumo-card ${cardAtivo === card.id ? 'resumo-card-ativo' : ''}`}
                onClick={() => selecionarCard(card.id, card.filtro)}
              >
                <span className="resumo-icone">{card.icone}</span>
                <span className="resumo-label">{card.label}</span>
                <span className={`resumo-valor ${card.cor || ''}`}>{card.valor}</span>
              </button>
            ))}
          </div>

          <div className="resumo-painel">
            <div className="resumo-grafico">
              <h3>Valor total por mês (vencimento)</h3>
              <div className="grafico-barras">
                {resumo.grafico.length === 0 && <p className="vazio">Sem dados.</p>}
                {resumo.grafico.map((mes, i) => {
                  const altura = (mes.total / resumo.maiorValor) * 100
                  return (
                    <div key={i} className="grafico-coluna">
                      <div className="grafico-track">
                        <span className="grafico-valor" style={{ bottom: `calc(${altura}% + 6px)` }}>
                          {formatarValor(mes.total)}
                        </span>
                        <div
                          className="grafico-barra"
                          style={{ height: `${altura}%` }}
                          title={formatarValor(mes.total)}
                        />
                      </div>
                      <span className="grafico-label">{mes.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="resumo-status">
              <h3>Contas por status</h3>
              <div className="status-barra">
                <div className="status-segmento status-segmento-paga" style={{ width: `${(resumo.pagas.length / totalStatus) * 100}%` }} />
                <div className="status-segmento status-segmento-vencida" style={{ width: `${(resumo.vencidas.length / totalStatus) * 100}%` }} />
                <div className="status-segmento status-segmento-avencer" style={{ width: `${(resumo.aVencer.length / totalStatus) * 100}%` }} />
              </div>
              <ul className="status-lista">
                <li><span className="bolinha bolinha-paga" /> Pagas <strong>{resumo.pagas.length}</strong></li>
                <li><span className="bolinha bolinha-vencida" /> Vencidas <strong>{resumo.vencidas.length}</strong></li>
                <li><span className="bolinha bolinha-avencer" /> A vencer <strong>{resumo.aVencer.length}</strong></li>
              </ul>
            </div>
          </div>

          <div className="resumo-calendario">
            <div className="calendario-header">
              <h3>Calendário de vencimentos</h3>
              <div className="calendario-nav">
                <button type="button" onClick={() => mudarMes(-1)}>‹</button>
                <span className="calendario-mes-label">
                  {mesCalendario.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button type="button" onClick={() => mudarMes(1)}>›</button>
              </div>
            </div>

            <div className="calendario-grid calendario-dias-semana">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>

            <div className="calendario-grid">
              {diasCalendario.map((chave, i) => {
                if (!chave) return <div key={i} className="calendario-dia calendario-dia-vazio" />

                const contasDoDia = contasPorDia[chave] || []
                return (
                  <button
                    key={i}
                    type="button"
                    className={`calendario-dia ${chave === hojeChave ? 'calendario-dia-hoje' : ''} ${diaSelecionado === chave ? 'calendario-dia-selecionado' : ''}`}
                    onClick={() => setDiaSelecionado(diaSelecionado === chave ? null : chave)}
                  >
                    <span className="calendario-dia-numero">{Number(chave.slice(-2))}</span>
                    {contasDoDia.length > 0 && (
                      <span className="calendario-pontos">
                        {contasDoDia.slice(0, 3).map((c, j) => (
                          <span
                            key={j}
                            className={`ponto ${c.pago ? 'ponto-paga' : (chave < hojeChave ? 'ponto-vencida' : 'ponto-avencer')}`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {diaSelecionado && (
              <div className="calendario-selecionado-lista">
                <h4>{dataLocal(diaSelecionado).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</h4>
                {(contasPorDia[diaSelecionado] || []).length === 0 ? (
                  <p className="vazio">Nenhuma conta nesse dia.</p>
                ) : (
                  (contasPorDia[diaSelecionado] || []).map(c => {
                    const badge = statusBadge(c)
                    return (
                      <div key={c.id} className="calendario-item" onClick={() => abrirModalEditar(c)}>
                        <span>{c.descricao}</span>
                        <span>{formatarValor(Number(c.valor))}</span>
                        <span className={`status ${badge.classe}`}>{badge.texto}</span>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          <div className="resumo-tabela">
            <div className="resumo-tabela-header">
              <h3>Contas</h3>
              <div className="resumo-tabela-tabs">
                {['recentes', 'avencer', 'vencidas', 'pagas'].map(valor => (
                  <button
                    key={valor}
                    type="button"
                    className={`tabela-tab ${filtroTabela === valor ? 'tabela-tab-ativa' : ''}`}
                    onClick={() => selecionarAba(valor)}
                  >
                    {rotulosFiltro[valor]}
                  </button>
                ))}
              </div>
            </div>

            {['pendentes', 'vencendo7', 'pagas-mes'].includes(filtroTabela) && (
              <div className="filtro-chip">
                Mostrando: {rotulosFiltro[filtroTabela]}
                <button type="button" onClick={() => selecionarAba('recentes')}>×</button>
              </div>
            )}

            {linhasTabela.length === 0 ? (
              <p className="vazio">Nenhuma conta aqui.</p>
            ) : (
              <div className="tabela-scroll">
                <table className="tabela-contas">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th>Vencimento</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasTabela.map(conta => {
                      const badge = statusBadge(conta)
                      return (
                        <tr key={conta.id} onClick={() => abrirModalEditar(conta)}>
                          <td>{conta.descricao}</td>
                          <td>{formatarValor(Number(conta.valor))}</td>
                          <td>{dataLocal(conta.vencimento).toLocaleDateString('pt-BR')}</td>
                          <td><span className={`status ${badge.classe}`}>{badge.texto}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {aba === 'contas' && (
        <>
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
                    <button
                      onClick={() => handleMarcarPaga(conta)}
                      disabled={processandoId === conta.id}
                    >
                      {processandoId === conta.id ? 'Salvando...' : 'Marcar como paga'}
                    </button>
                    <button onClick={() => abrirModalEditar(conta)}>Editar</button>
                    <button onClick={() => handleExcluir(conta.id)}>Excluir</button>
                  </div>
                </div>
              )
            })}
          </div>

          {historicoPagas.length > 0 && (
            <div className="historico-pagas">
              <h3>Contas pagas</h3>
              {(mostrarTodasPagas ? historicoPagas : historicoPagas.slice(0, 10)).map((conta) => (
                <div key={conta.id} className="conta-paga">
                  <span>{conta.descricao} · R$ {conta.valor}</span>
                  <button onClick={() => handleExcluir(conta.id)}>Excluir</button>
                </div>
              ))}

              {historicoPagas.length > 10 && (
                <button
                  type="button"
                  className="btn-ver-mais"
                  onClick={() => setMostrarTodasPagas(v => !v)}
                >
                  {mostrarTodasPagas
                    ? 'Mostrar menos'
                    : `Ver todas as ${historicoPagas.length} contas pagas`}
                </button>
              )}
            </div>
          )}
        </>
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