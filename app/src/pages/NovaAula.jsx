import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listarAlunos, obterAula, salvarAula, getProfessor } from '../lib/api.js'
import { toISOLocal } from '../lib/datas.js'

// Criar aula avulsa ou editar uma existente.
export default function NovaAula() {
  const nav = useNavigate()
  const { id } = useParams()
  const [alunos, setAlunos] = useState([])
  const [alunoId, setAlunoId] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [duracaoMin, setDuracaoMin] = useState(60)
  const [valor, setValor] = useState('')
  const [extra, setExtra] = useState(false)
  const [obs, setObs] = useState('')
  const [origem, setOrigem] = useState('avulsa')

  useEffect(() => {
    async function carregar() {
      const als = await listarAlunos()
      setAlunos(als)
      if (id) {
        const aula = await obterAula(id)
        if (aula) {
          setAlunoId(aula.alunoId)
          setData(aula.dataHora.slice(0, 10))
          setHora(aula.dataHora.slice(11, 16))
          setDuracaoMin(aula.duracaoMin)
          setValor(String(aula.valor || ''))
          setExtra(!!aula.extra)
          setObs(aula.obs || '')
          setOrigem(aula.origem)
        }
      } else {
        const agora = new Date()
        setData(toISOLocal(agora).slice(0, 10))
        const prof = await getProfessor()
        setDuracaoMin(prof?.duracaoPadraoMin || 60)
      }
    }
    carregar()
  }, [id])

  // Ao escolher o aluno numa aula nova, pré-preenche o valor conforme a modalidade.
  function aoEscolherAluno(novoId) {
    setAlunoId(novoId)
    if (!id) {
      const aluno = alunos.find((a) => a.id === novoId)
      if (aluno) {
        if (aluno.modalidade === 'avulso') {
          setValor(String(aluno.valorAula || ''))
          setExtra(false)
        } else {
          // mensalista: aula normal não tem valor próprio; extra tem
          setValor('0')
          setExtra(false)
        }
      }
    }
  }

  const alunoSel = alunos.find((a) => a.id === alunoId)
  const ehMensalista = alunoSel?.modalidade === 'mensalista'

  function aoMarcarExtra(marcado) {
    setExtra(marcado)
    if (marcado && alunoSel) setValor(String(alunoSel.valorAula || ''))
    if (!marcado && ehMensalista) setValor('0')
  }

  const valido = alunoId && data && hora && duracaoMin > 0

  async function gravar() {
    await salvarAula({
      ...(id ? { id } : {}),
      alunoId,
      dataHora: `${data}T${hora}`,
      duracaoMin: Number(duracaoMin),
      valor: Number(valor) || 0,
      extra,
      obs,
      ...(id ? {} : { origem: 'avulsa', status: 'agendada' }),
    })
    nav(-1)
  }

  return (
    <div className="tela">
      <div className="topo">
        <h1>{id ? 'Editar aula' : 'Nova aula'}</h1>
        <button className="btn btn-cinza btn-mini" onClick={() => nav(-1)}>Fechar</button>
      </div>

      <div className="campo">
        <label>Aluno</label>
        <select value={alunoId} onChange={(e) => aoEscolherAluno(e.target.value)} disabled={!!id}>
          <option value="">Escolha o aluno…</option>
          {alunos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome} ({a.modalidade === 'mensalista' ? 'mensalista' : 'avulso'})
            </option>
          ))}
        </select>
      </div>

      {alunos.length === 0 && (
        <div className="card" style={{ background: 'var(--indigo-claro)', border: 'none' }}>
          Você ainda não tem alunos.{' '}
          <a href="/alunos/novo" style={{ color: 'var(--indigo)', fontWeight: 700 }}>Cadastre o primeiro →</a>
        </div>
      )}

      <div className="linha-2">
        <div className="campo">
          <label>Data</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="campo">
          <label>Hora</label>
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>

      <div className="linha-2">
        <div className="campo">
          <label>Duração (min)</label>
          <input type="number" inputMode="numeric" value={duracaoMin} onChange={(e) => setDuracaoMin(e.target.value)} />
        </div>
        <div className="campo">
          <label>Valor (R$)</label>
          <input
            type="number"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            disabled={ehMensalista && !extra}
            placeholder={ehMensalista && !extra ? 'na mensalidade' : ''}
          />
        </div>
      </div>

      {ehMensalista && (
        <div className="switch-linha">
          <span className="rotulo">Aula extra (cobrada fora da mensalidade)</span>
          <input type="checkbox" checked={extra} onChange={(e) => aoMarcarExtra(e.target.checked)} />
        </div>
      )}

      <div className="campo">
        <label>Observações (opcional)</label>
        <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: revisão para prova" />
      </div>

      {origem === 'recorrente' && (
        <p style={{ fontSize: '0.8rem', color: 'var(--cinza)', marginBottom: 12 }}>
          Esta aula veio da recorrência do aluno. A edição vale só para esta data.
        </p>
      )}

      <button className="btn btn-primario" disabled={!valido} style={{ opacity: valido ? 1 : 0.5 }} onClick={gravar}>
        {id ? 'Salvar alterações' : 'Marcar aula'}
      </button>
    </div>
  )
}
