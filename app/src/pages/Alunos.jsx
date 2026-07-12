import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarAlunos, pendenciaAluno } from '../lib/api.js'
import { formatarMoeda } from '../lib/datas.js'

export default function Alunos() {
  const nav = useNavigate()
  const [lista, setLista] = useState([])

  useEffect(() => {
    async function carregar() {
      const alunos = await listarAlunos()
      const comPendencia = await Promise.all(
        alunos.map(async (a) => ({ ...a, pendencia: (await pendenciaAluno(a)).total }))
      )
      setLista(comPendencia)
    }
    carregar()
  }, [])

  return (
    <div className="tela">
      <div className="topo">
        <div>
          <h1>Alunos</h1>
          <div className="sub">{lista.length} {lista.length === 1 ? 'aluno ativo' : 'alunos ativos'}</div>
        </div>
      </div>

      {lista.length === 0 && (
        <div className="vazio">
          <div className="emoji">👋</div>
          <p>Cadastre seu primeiro aluno para começar.</p>
        </div>
      )}

      {lista.map((a) => (
        <div className="card toque" key={a.id} onClick={() => nav(`/aluno/${a.id}`)}>
          <div className="aluno-linha">
            <div className="avatar">{a.nome.charAt(0).toUpperCase()}</div>
            <div className="info">
              <div className="nome">{a.nome}</div>
              <div className="detalhe">
                {a.modalidade === 'mensalista'
                  ? `Mensalista · ${formatarMoeda(a.valorMensal)}/mês`
                  : `Avulso · ${formatarMoeda(a.valorAula)}/aula`}
              </div>
            </div>
            {a.pendencia > 0 ? (
              <span className="badge badge-pendente">{formatarMoeda(a.pendencia)}</span>
            ) : (
              <span className="badge badge-pago">em dia</span>
            )}
          </div>
        </div>
      ))}

      <button className="fab" onClick={() => nav('/alunos/novo')} aria-label="Novo aluno">＋</button>
    </div>
  )
}
