import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProfessor, obterAluno, salvarAluno } from '../lib/api.js'
import { DIAS_SEMANA } from '../lib/datas.js'

// Cadastro/edição de aluno — inclui modalidade, recorrência e política de falta.
export default function AlunoForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [modalidade, setModalidade] = useState('avulso')
  const [valorAula, setValorAula] = useState('')
  const [valorMensal, setValorMensal] = useState('')
  const [diaVencimento, setDiaVencimento] = useState(5)
  const [cobrarFalta, setCobrarFalta] = useState(true)
  const [recorrencia, setRecorrencia] = useState([])
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    async function carregar() {
      if (id) {
        const a = await obterAluno(id)
        if (a) {
          setNome(a.nome)
          setTelefone(a.telefone)
          setModalidade(a.modalidade)
          setValorAula(String(a.valorAula || ''))
          setValorMensal(String(a.valorMensal || ''))
          setDiaVencimento(a.diaVencimento || 5)
          setCobrarFalta(a.cobrarFalta !== false)
          setRecorrencia(a.recorrencia || [])
          setObservacoes(a.observacoes || '')
        }
      } else {
        const prof = await getProfessor()
        if (prof?.valorAulaPadrao) setValorAula(String(prof.valorAulaPadrao))
      }
    }
    carregar()
  }, [id])

  function addHorario() {
    setRecorrencia([...recorrencia, { diaSemana: 1, hora: '18:00', duracaoMin: 60 }])
  }

  function mudarHorario(i, campo, valor) {
    const nova = [...recorrencia]
    nova[i] = { ...nova[i], [campo]: valor }
    setRecorrencia(nova)
  }

  function removerHorario(i) {
    setRecorrencia(recorrencia.filter((_, j) => j !== i))
  }

  const valido =
    nome.trim().length >= 2 &&
    (modalidade === 'avulso' ? Number(valorAula) > 0 : Number(valorMensal) > 0)

  async function gravar() {
    const salvo = await salvarAluno({
      ...(id ? { id } : {}),
      nome: nome.trim(),
      telefone: telefone.replace(/\D/g, ''),
      modalidade,
      valorAula: Number(valorAula) || 0,
      valorMensal: Number(valorMensal) || 0,
      diaVencimento: Number(diaVencimento) || 5,
      cobrarFalta,
      recorrencia,
      observacoes,
    })
    nav(`/aluno/${salvo.id}`, { replace: true })
  }

  return (
    <div className="tela">
      <div className="topo">
        <h1>{id ? 'Editar aluno' : 'Novo aluno'}</h1>
        <button className="btn btn-cinza btn-mini" onClick={() => nav(-1)}>Fechar</button>
      </div>

      <div className="campo">
        <label>Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do aluno" autoFocus={!id} />
      </div>

      <div className="campo">
        <label>WhatsApp (com DDD)</label>
        <input
          type="tel"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="Ex.: 49 99999-8888"
        />
      </div>

      <div className="campo">
        <label>Como esse aluno paga?</label>
        <div className="abas">
          <button type="button" className={modalidade === 'avulso' ? 'ativa' : ''} onClick={() => setModalidade('avulso')}>
            Por aula
          </button>
          <button type="button" className={modalidade === 'mensalista' ? 'ativa' : ''} onClick={() => setModalidade('mensalista')}>
            Mensalidade
          </button>
        </div>
      </div>

      {modalidade === 'avulso' ? (
        <div className="campo">
          <label>Valor por aula (R$)</label>
          <input type="number" inputMode="decimal" value={valorAula} onChange={(e) => setValorAula(e.target.value)} />
        </div>
      ) : (
        <>
          <div className="linha-2">
            <div className="campo">
              <label>Mensalidade (R$)</label>
              <input type="number" inputMode="decimal" value={valorMensal} onChange={(e) => setValorMensal(e.target.value)} />
            </div>
            <div className="campo">
              <label>Dia de cobrança</label>
              <input type="number" inputMode="numeric" min="1" max="28" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} />
            </div>
          </div>
          <div className="campo">
            <label>Valor da aula extra (R$)</label>
            <input type="number" inputMode="decimal" value={valorAula} onChange={(e) => setValorAula(e.target.value)} placeholder="Fora da mensalidade" />
          </div>
        </>
      )}

      <div className="switch-linha">
        <span className="rotulo">Cobrar aula quando o aluno faltar sem avisar</span>
        <input type="checkbox" checked={cobrarFalta} onChange={(e) => setCobrarFalta(e.target.checked)} />
      </div>

      <div className="campo" style={{ marginTop: 8 }}>
        <label>Horário fixo semanal (recorrência)</label>
        {recorrencia.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <select value={r.diaSemana} onChange={(e) => mudarHorario(i, 'diaSemana', Number(e.target.value))} style={{ flex: 2, padding: 10, borderRadius: 10, border: '1.5px solid var(--borda)' }}>
              {DIAS_SEMANA.map((d, di) => (
                <option key={di} value={di}>{d}</option>
              ))}
            </select>
            <input type="time" value={r.hora} onChange={(e) => mudarHorario(i, 'hora', e.target.value)} style={{ flex: 1.4, padding: 9, borderRadius: 10, border: '1.5px solid var(--borda)' }} />
            <input type="number" inputMode="numeric" title="Duração (min)" value={r.duracaoMin} onChange={(e) => mudarHorario(i, 'duracaoMin', Number(e.target.value))} style={{ width: 62, padding: 9, borderRadius: 10, border: '1.5px solid var(--borda)' }} />
            <button type="button" className="btn btn-mini btn-perigo" onClick={() => removerHorario(i)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-claro" onClick={addHorario}>
          + Adicionar horário
        </button>
      </div>

      <div className="campo">
        <label>Observações (opcional)</label>
        <textarea rows="2" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Ex.: prova em agosto, prefere aulas online…" />
      </div>

      <button className="btn btn-primario" disabled={!valido} style={{ opacity: valido ? 1 : 0.5 }} onClick={gravar}>
        {id ? 'Salvar alterações' : 'Cadastrar aluno'}
      </button>
    </div>
  )
}
