import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resumoMes } from '../lib/api.js'
import { formatarMoeda, periodoDe, labelPeriodo, deISO } from '../lib/datas.js'

// Central do dinheiro: responde "quanto ganhei, quem me deve".
export default function Cobrancas() {
  const nav = useNavigate()
  const [periodo, setPeriodo] = useState(() => periodoDe(new Date()))
  const [resumo, setResumo] = useState(null)

  useEffect(() => {
    resumoMes(periodo).then(setResumo)
  }, [periodo])

  function mudarMes(delta) {
    const [ano, mes] = periodo.split('-').map(Number)
    const d = new Date(ano, mes - 1 + delta, 1)
    setPeriodo(periodoDe(d))
  }

  if (!resumo) return null

  return (
    <div className="tela">
      <div className="topo">
        <div>
          <h1>Cobranças</h1>
          <div className="sub">Seu mês em dinheiro</div>
        </div>
      </div>

      <div className="semana-nav">
        <button onClick={() => mudarMes(-1)} aria-label="Mês anterior">‹</button>
        <span className="titulo">{labelPeriodo(periodo)}</span>
        <button onClick={() => mudarMes(1)} aria-label="Próximo mês">›</button>
      </div>

      <div className="resumo-grid">
        <div className="resumo-item destaque-pago">
          <div className="valor">{formatarMoeda(resumo.recebido)}</div>
          <div className="rotulo">recebido no mês</div>
        </div>
        <div className="resumo-item destaque-pendente">
          <div className="valor">{formatarMoeda(resumo.pendente)}</div>
          <div className="rotulo">em aberto (total)</div>
        </div>
        <div className="resumo-item">
          <div className="valor">{formatarMoeda(resumo.previsto)}</div>
          <div className="rotulo">previsto</div>
        </div>
      </div>

      {resumo.pendencias.length > 0 && (
        <>
          <div className="dia-titulo" style={{ marginTop: 4 }}>Quem está devendo</div>
          {resumo.pendencias.map(({ aluno, total, aulas, mensalidades }) => (
            <div className="card" key={aluno.id}>
              <div className="aluno-linha">
                <div className="avatar">{aluno.nome.charAt(0).toUpperCase()}</div>
                <div className="info" onClick={() => nav(`/aluno/${aluno.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="nome">{aluno.nome}</div>
                  <div className="detalhe">
                    {aulas.length > 0 && `${aulas.length} ${aulas.length === 1 ? 'aula' : 'aulas'}`}
                    {aulas.length > 0 && mensalidades.length > 0 && ' + '}
                    {mensalidades.length > 0 && mensalidades.map((m) => labelPeriodo(m.periodo)).join(', ')}
                    {' · '}
                    <b style={{ color: 'var(--pendente)' }}>{formatarMoeda(total)}</b>
                  </div>
                </div>
                <button className="btn btn-mini btn-whats" onClick={() => nav(`/cobrar/${aluno.id}`)}>
                  💬 Cobrar
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {resumo.pendencias.length === 0 && (
        <div className="tudo-pago">🎉 Ninguém devendo. Tudo em dia!</div>
      )}

      <div className="dia-titulo" style={{ marginTop: 18 }}>Pagamentos de {labelPeriodo(periodo)}</div>
      {resumo.pagamentos.length === 0 && (
        <div className="vazio" style={{ padding: '18px' }}>
          <p>Nenhum pagamento registrado neste mês.</p>
        </div>
      )}
      {resumo.pagamentos.map((p) => (
        <div className="card" key={p.id}>
          <div className="aula-card">
            <div className="aula-info">
              <div className="nome" style={{ fontSize: '0.95rem' }}>{formatarMoeda(p.valor)}</div>
              <div className="detalhe">
                {deISO(p.data).toLocaleDateString('pt-BR')} · {p.forma}
                {p.tipo === 'mensalidade' && p.periodo && ` · mensalidade ${labelPeriodo(p.periodo)}`}
              </div>
            </div>
            <span className="badge badge-pago">recebido</span>
          </div>
        </div>
      ))}
    </div>
  )
}
