import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obterAluno, pendenciaAluno, registrarPagamento } from '../lib/api.js'
import { formatarMoeda, formatarDataHora, labelPeriodo } from '../lib/datas.js'

// Registrar pagamento — 2 toques no caminho feliz.
// Avulso: escolhe quais aulas quita (casamento pagamento ↔ aula).
// Mensalista: escolhe o mês de referência.
export default function Pagar() {
  const nav = useNavigate()
  const { alunoId } = useParams()
  const [aluno, setAluno] = useState(null)
  const [pend, setPend] = useState({ total: 0, aulas: [], mensalidades: [] })
  const [selecionadas, setSelecionadas] = useState(new Set())
  const [mesesSel, setMesesSel] = useState(new Set())
  const [forma, setForma] = useState('pix')
  const [valorManual, setValorManual] = useState(null) // null = automático

  useEffect(() => {
    async function carregar() {
      const a = await obterAluno(alunoId)
      if (!a) return nav('/cobrancas', { replace: true })
      setAluno(a)
      const p = await pendenciaAluno(a)
      setPend(p)
      // pré-seleciona tudo (caminho feliz: recebeu tudo)
      setSelecionadas(new Set(p.aulas.map((x) => x.id)))
      setMesesSel(new Set(p.mensalidades.map((m) => m.periodo)))
    }
    carregar()
  }, [alunoId])

  if (!aluno) return null

  const valorAulas = pend.aulas.filter((a) => selecionadas.has(a.id)).reduce((s, a) => s + a.valor, 0)
  const valorMeses = pend.mensalidades.filter((m) => mesesSel.has(m.periodo)).reduce((s, m) => s + m.valor, 0)
  const valorAuto = valorAulas + valorMeses
  const valor = valorManual !== null ? Number(valorManual) : valorAuto

  function alternarAula(id) {
    const nova = new Set(selecionadas)
    nova.has(id) ? nova.delete(id) : nova.add(id)
    setSelecionadas(nova)
    setValorManual(null)
  }

  function alternarMes(periodo) {
    const nova = new Set(mesesSel)
    nova.has(periodo) ? nova.delete(periodo) : nova.add(periodo)
    setMesesSel(nova)
    setValorManual(null)
  }

  async function confirmar() {
    // um registro por mensalidade (mantém 1 pagamento = 1 período)
    for (const periodo of mesesSel) {
      const m = pend.mensalidades.find((x) => x.periodo === periodo)
      await registrarPagamento({
        alunoId,
        valor: m.valor,
        forma,
        tipo: 'mensalidade',
        periodo,
      })
    }
    if (selecionadas.size > 0) {
      // valor editado à mão só vale quando o pagamento é apenas de aulas
      // (mensalidades têm valor fixo próprio)
      const valorAulasFinal =
        valorManual !== null && mesesSel.size === 0 ? Number(valorManual) : valorAulas
      await registrarPagamento({
        alunoId,
        valor: valorAulasFinal,
        forma,
        tipo: 'aulas',
        aulasIds: [...selecionadas],
      })
    }
    nav(`/aluno/${alunoId}`, { replace: true })
  }

  const podeConfirmar = valor > 0 && (selecionadas.size > 0 || mesesSel.size > 0)

  return (
    <div className="tela">
      <div className="topo">
        <div>
          <h1>Registrar pagamento</h1>
          <div className="sub">{aluno.nome}</div>
        </div>
        <button className="btn btn-cinza btn-mini" onClick={() => nav(-1)}>Fechar</button>
      </div>

      {pend.mensalidades.length > 0 && (
        <>
          <div className="dia-titulo">Mensalidades</div>
          <div className="card lista-check">
            {pend.mensalidades.map((m) => (
              <label key={m.periodo}>
                <input type="checkbox" checked={mesesSel.has(m.periodo)} onChange={() => alternarMes(m.periodo)} />
                <span style={{ flex: 1 }}>{labelPeriodo(m.periodo)}</span>
                <b>{formatarMoeda(m.valor)}</b>
              </label>
            ))}
          </div>
        </>
      )}

      {pend.aulas.length > 0 && (
        <>
          <div className="dia-titulo">Aulas em aberto</div>
          <div className="card lista-check">
            {pend.aulas.map((a) => (
              <label key={a.id}>
                <input type="checkbox" checked={selecionadas.has(a.id)} onChange={() => alternarAula(a.id)} />
                <span style={{ flex: 1 }}>
                  {formatarDataHora(a.dataHora)}
                  {a.status === 'falta' && ' (falta)'}
                  {a.extra && ' (extra)'}
                </span>
                <b>{formatarMoeda(a.valor)}</b>
              </label>
            ))}
          </div>
        </>
      )}

      {pend.total === 0 && <div className="tudo-pago">Este aluno não tem pendências. 🎉</div>}

      <div className="linha-2" style={{ marginTop: 8 }}>
        <div className="campo">
          <label>Forma</label>
          <select value={forma} onChange={(e) => setForma(e.target.value)}>
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="campo">
          <label>Valor recebido (R$)</label>
          <input
            type="number"
            inputMode="decimal"
            value={valorManual !== null ? valorManual : valorAuto}
            onChange={(e) => setValorManual(e.target.value)}
            disabled={mesesSel.size > 0}
            title={mesesSel.size > 0 ? 'Mensalidades têm valor fixo' : ''}
          />
        </div>
      </div>

      <button className="btn btn-primario" disabled={!podeConfirmar} style={{ opacity: podeConfirmar ? 1 : 0.5 }} onClick={confirmar}>
        ✓ Confirmar {formatarMoeda(valor)}
      </button>
    </div>
  )
}
