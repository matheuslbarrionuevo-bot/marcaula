import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obterAluno, pendenciaAluno, listarAulas, listarPagamentos, arquivarAluno, excluirPagamento } from '../lib/api.js'
import { formatarMoeda, formatarDataHora, labelPeriodo, DIAS_SEMANA, deISO } from '../lib/datas.js'

const STATUS_TXT = { agendada: 'agendada', dada: 'dada ✓', falta: 'falta', cancelada: 'cancelada' }
const STATUS_CLASSE = { agendada: 'badge-indigo', dada: 'badge-pago', falta: 'badge-falta', cancelada: 'badge-neutro' }

export default function Aluno() {
  const nav = useNavigate()
  const { id } = useParams()
  const [aluno, setAluno] = useState(null)
  const [pendencia, setPendencia] = useState({ total: 0, aulas: [], mensalidades: [] })
  const [aulas, setAulas] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [aba, setAba] = useState('aulas')

  async function carregar() {
    const a = await obterAluno(id)
    if (!a) return nav('/alunos', { replace: true })
    setAluno(a)
    setPendencia(await pendenciaAluno(a))
    const todas = await listarAulas({ alunoId: id })
    setAulas(todas.filter((x) => x.status !== 'cancelada').reverse())
    setPagamentos(await listarPagamentos({ alunoId: id }))
  }

  useEffect(() => {
    carregar()
  }, [id])

  if (!aluno) return null

  async function arquivar() {
    if (window.confirm(`Arquivar ${aluno.nome}? As aulas e pagamentos ficam guardados.`)) {
      await arquivarAluno(id)
      nav('/alunos', { replace: true })
    }
  }

  async function desfazerPagamento(pagId) {
    if (window.confirm('Excluir este pagamento? As aulas voltam a ficar pendentes.')) {
      await excluirPagamento(pagId)
      carregar()
    }
  }

  return (
    <div className="tela">
      <div className="topo">
        <div className="aluno-linha" style={{ flex: 1 }}>
          <div className="avatar">{aluno.nome.charAt(0).toUpperCase()}</div>
          <div className="info">
            <h1 style={{ fontSize: '1.2rem' }}>{aluno.nome}</h1>
            <div className="sub">
              {aluno.modalidade === 'mensalista'
                ? `Mensalista · ${formatarMoeda(aluno.valorMensal)}/mês`
                : `Avulso · ${formatarMoeda(aluno.valorAula)}/aula`}
            </div>
          </div>
        </div>
        <button className="btn btn-cinza btn-mini" onClick={() => nav(`/aluno/${id}/editar`)}>✏️</button>
      </div>

      {pendencia.total > 0 ? (
        <>
          <div className="pendencia-destaque">
            <div className="valor">{formatarMoeda(pendencia.total)}</div>
            <div className="rotulo">
              em aberto
              {pendencia.aulas.length > 0 && ` · ${pendencia.aulas.length} ${pendencia.aulas.length === 1 ? 'aula' : 'aulas'}`}
              {pendencia.mensalidades.length > 0 &&
                ` · ${pendencia.mensalidades.map((m) => labelPeriodo(m.periodo)).join(', ')}`}
            </div>
          </div>
          <button className="btn btn-whats" onClick={() => nav(`/cobrar/${id}`)}>
            💬 Cobrar no WhatsApp
          </button>
          <button className="btn btn-claro" style={{ marginTop: 8 }} onClick={() => nav(`/pagar/${id}`)}>
            ✓ Registrar pagamento
          </button>
        </>
      ) : (
        <div className="tudo-pago">✅ Tudo em dia com este aluno</div>
      )}

      <div className="abas" style={{ marginTop: 16 }}>
        <button className={aba === 'aulas' ? 'ativa' : ''} onClick={() => setAba('aulas')}>Aulas</button>
        <button className={aba === 'pagamentos' ? 'ativa' : ''} onClick={() => setAba('pagamentos')}>Pagamentos</button>
        <button className={aba === 'dados' ? 'ativa' : ''} onClick={() => setAba('dados')}>Dados</button>
      </div>

      {aba === 'aulas' && (
        <>
          {aulas.length === 0 && <div className="vazio"><p>Nenhuma aula registrada ainda.</p></div>}
          {aulas.map((a) => (
            <div className="card" key={a.id}>
              <div className="aula-card">
                <div className="aula-info">
                  <div className="nome" style={{ fontSize: '0.92rem' }}>{formatarDataHora(a.dataHora)}</div>
                  <div className="detalhe">
                    {a.valor > 0 && `${formatarMoeda(a.valor)} · `}
                    {a.pagamentoId ? 'paga ✓' : a.valor > 0 && (a.status === 'dada' || (a.status === 'falta' && a.cobrarFalta)) ? 'pendente' : '—'}
                    {a.extra && ' · extra'}
                  </div>
                </div>
                <span className={`badge ${STATUS_CLASSE[a.status]}`}>{STATUS_TXT[a.status]}</span>
              </div>
            </div>
          ))}
        </>
      )}

      {aba === 'pagamentos' && (
        <>
          {pagamentos.length === 0 && <div className="vazio"><p>Nenhum pagamento registrado.</p></div>}
          {pagamentos.map((p) => (
            <div className="card" key={p.id}>
              <div className="aula-card">
                <div className="aula-info">
                  <div className="nome" style={{ fontSize: '0.95rem' }}>{formatarMoeda(p.valor)}</div>
                  <div className="detalhe">
                    {deISO(p.data).toLocaleDateString('pt-BR')} · {p.forma}
                    {p.tipo === 'mensalidade' && p.periodo && ` · ${labelPeriodo(p.periodo)}`}
                    {p.tipo === 'aulas' && ` · ${p.aulasIds.length} ${p.aulasIds.length === 1 ? 'aula' : 'aulas'}`}
                  </div>
                </div>
                <button className="btn btn-mini btn-cinza" onClick={() => desfazerPagamento(p.id)}>🗑</button>
              </div>
            </div>
          ))}
        </>
      )}

      {aba === 'dados' && (
        <>
          <div className="card">
            <div className="detalhe" style={{ fontSize: '0.85rem', color: 'var(--cinza)', marginBottom: 4 }}>WhatsApp</div>
            <div style={{ fontWeight: 700 }}>{aluno.telefone || 'não informado'}</div>
          </div>
          <div className="card">
            <div className="detalhe" style={{ fontSize: '0.85rem', color: 'var(--cinza)', marginBottom: 4 }}>Horários fixos</div>
            {aluno.recorrencia?.length ? (
              aluno.recorrencia.map((r, i) => (
                <div key={i} style={{ fontWeight: 700 }}>
                  {DIAS_SEMANA[r.diaSemana]} às {r.hora} ({r.duracaoMin} min)
                </div>
              ))
            ) : (
              <div style={{ fontWeight: 700 }}>sem horário fixo</div>
            )}
          </div>
          <div className="card">
            <div className="detalhe" style={{ fontSize: '0.85rem', color: 'var(--cinza)', marginBottom: 4 }}>Falta sem aviso</div>
            <div style={{ fontWeight: 700 }}>{aluno.cobrarFalta ? 'cobra a aula' : 'não cobra'}</div>
          </div>
          {aluno.observacoes && (
            <div className="card">
              <div className="detalhe" style={{ fontSize: '0.85rem', color: 'var(--cinza)', marginBottom: 4 }}>Observações</div>
              <div>{aluno.observacoes}</div>
            </div>
          )}
          <button className="btn btn-perigo" style={{ marginTop: 8 }} onClick={arquivar}>
            Arquivar aluno
          </button>
        </>
      )}
    </div>
  )
}
