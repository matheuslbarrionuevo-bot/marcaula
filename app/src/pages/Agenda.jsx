import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarAulas, listarAlunos, salvarAula, excluirAula } from '../lib/api.js'
import { hoje, addDias, inicioSemana, toISOLocal, mesmaData, deISO, horaDe, formatarData, formatarMoeda, DIAS_SEMANA } from '../lib/datas.js'

const STATUS_BADGE = {
  agendada: null,
  dada: { classe: 'badge-pago', texto: 'dada ✓' },
  falta: { classe: 'badge-falta', texto: 'falta' },
  cancelada: { classe: 'badge-neutro', texto: 'cancelada' },
}

export default function Agenda() {
  const nav = useNavigate()
  const [semanaBase, setSemanaBase] = useState(() => inicioSemana(hoje()))
  const [aulas, setAulas] = useState([])
  const [alunos, setAlunos] = useState({})
  const [expandida, setExpandida] = useState(null)

  async function carregar() {
    const fim = addDias(semanaBase, 7)
    const [lista, als] = await Promise.all([
      listarAulas({ deISO: toISOLocal(semanaBase), ateISO: toISOLocal(fim) }),
      listarAlunos({ incluirInativos: true }),
    ])
    setAulas(lista.filter((a) => a.status !== 'cancelada'))
    setAlunos(Object.fromEntries(als.map((a) => [a.id, a])))
  }

  useEffect(() => {
    carregar()
  }, [semanaBase])

  async function mudarStatus(aula, status) {
    if (status === 'falta') {
      const aluno = alunos[aula.alunoId]
      const cobrar = window.confirm(
        `Cobrar esta falta de ${aluno?.nome?.split(' ')[0] || 'aluno'}?\n\nOK = cobrar (política atual)\nCancelar = não cobrar`
      )
      await salvarAula({ id: aula.id, status, cobrarFalta: cobrar })
    } else {
      await salvarAula({ id: aula.id, status })
    }
    setExpandida(null)
    carregar()
  }

  async function cancelar(aula) {
    if (aula.origem === 'recorrente') {
      // mantém o registro com status cancelada para não ser recriada
      await salvarAula({ id: aula.id, status: 'cancelada' })
    } else {
      await excluirAula(aula.id)
    }
    setExpandida(null)
    carregar()
  }

  const dias = Array.from({ length: 7 }, (_, i) => addDias(semanaBase, i))
  const fimSemana = addDias(semanaBase, 6)
  const ehSemanaAtual = mesmaData(semanaBase, inicioSemana(hoje()))

  return (
    <div className="tela">
      <div className="topo">
        <div>
          <h1>Agenda</h1>
          <div className="sub">Sua semana de aulas</div>
        </div>
        {!ehSemanaAtual && (
          <button className="btn btn-claro btn-mini" onClick={() => setSemanaBase(inicioSemana(hoje()))}>
            Hoje
          </button>
        )}
      </div>

      <div className="semana-nav">
        <button onClick={() => setSemanaBase(addDias(semanaBase, -7))} aria-label="Semana anterior">‹</button>
        <span className="titulo">
          {formatarData(semanaBase)} – {formatarData(fimSemana)}
        </span>
        <button onClick={() => setSemanaBase(addDias(semanaBase, 7))} aria-label="Próxima semana">›</button>
      </div>

      {aulas.length === 0 && (
        <div className="vazio">
          <div className="emoji">🗓️</div>
          <p>Nenhuma aula nesta semana.</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Toque no + para marcar uma aula.</p>
        </div>
      )}

      {dias.map((dia) => {
        const doDia = aulas.filter((a) => mesmaData(deISO(a.dataHora), dia))
        if (!doDia.length) return null
        const ehHoje = mesmaData(dia, hoje())
        return (
          <div className="dia-grupo" key={dia.toISOString()}>
            <div className={`dia-titulo ${ehHoje ? 'hoje' : ''}`}>
              {DIAS_SEMANA[dia.getDay()]} {formatarData(dia)} {ehHoje && '· hoje'}
            </div>
            {doDia.map((aula) => {
              const aluno = alunos[aula.alunoId]
              const badge = STATUS_BADGE[aula.status]
              const aberta = expandida === aula.id
              return (
                <div className="card toque" key={aula.id} onClick={() => setExpandida(aberta ? null : aula.id)}>
                  <div className="aula-card">
                    <div className="aula-hora">{horaDe(aula.dataHora)}</div>
                    <div className="aula-info">
                      <div className="nome">{aluno?.nome || 'Aluno removido'}</div>
                      <div className="detalhe">
                        {aula.duracaoMin} min
                        {aula.valor > 0 && ` · ${formatarMoeda(aula.valor)}`}
                        {aula.extra && ' · extra'}
                      </div>
                    </div>
                    {badge && <span className={`badge ${badge.classe}`}>{badge.texto}</span>}
                  </div>

                  {aberta && (
                    <div className="aula-acoes" onClick={(e) => e.stopPropagation()}>
                      {aula.status !== 'dada' && (
                        <button className="btn btn-mini" style={{ background: 'var(--pago-bg)', color: 'var(--pago)' }} onClick={() => mudarStatus(aula, 'dada')}>
                          ✅ Dada
                        </button>
                      )}
                      {aula.status !== 'falta' && (
                        <button className="btn btn-mini btn-perigo" onClick={() => mudarStatus(aula, 'falta')}>
                          ❌ Falta
                        </button>
                      )}
                      {aula.status !== 'agendada' && (
                        <button className="btn btn-mini btn-cinza" onClick={() => mudarStatus(aula, 'agendada')}>
                          ↩ Desfazer
                        </button>
                      )}
                      <button className="btn btn-mini btn-cinza" onClick={() => nav(`/aula/${aula.id}/editar`)}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn-mini btn-cinza" onClick={() => cancelar(aula)}>
                        🗑 Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      <button className="fab" onClick={() => nav('/nova-aula')} aria-label="Nova aula">＋</button>
    </div>
  )
}
