import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProfessor, obterAluno, pendenciaAluno, listarAulas, marcarCobradas } from '../lib/api.js'
import { mensagemAulas, mensagemMensalidade, linkWhatsApp } from '../lib/cobranca.js'
import { formatarMoeda, periodoDe } from '../lib/datas.js'

// A feature matadora: preview editável da mensagem de cobrança → WhatsApp.
export default function Cobrar() {
  const nav = useNavigate()
  const { alunoId } = useParams()
  const [aluno, setAluno] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [total, setTotal] = useState(0)
  const [aulasIds, setAulasIds] = useState([])
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    async function montar() {
      const [prof, a] = await Promise.all([getProfessor(), obterAluno(alunoId)])
      if (!a) return nav('/cobrancas', { replace: true })
      setAluno(a)
      const pend = await pendenciaAluno(a)
      setTotal(pend.total)

      const chavePix = prof?.chavePix || '(cadastre sua chave PIX no Perfil)'

      if (a.modalidade === 'mensalista' && pend.mensalidades.length > 0) {
        // cobra a mensalidade mais antiga pendente + lista as aulas do mês
        const alvo = pend.mensalidades[0]
        const aulasDoMes = (await listarAulas({ alunoId: a.id })).filter((x) =>
          x.dataHora.startsWith(alvo.periodo)
        )
        let msg = mensagemMensalidade({ aluno: a, periodo: alvo.periodo, aulasDoMes, chavePix })
        // se também houver aulas extras pendentes, insere só a lista delas
        // antes do PIX (sem repetir saudação, chave nem despedida)
        if (pend.aulas.length > 0) {
          const linhasExtras = mensagemAulas({ aluno: a, aulas: pend.aulas, chavePix }).split('\n').slice(4)
          const corte = linhasExtras.findIndex((l) => l.startsWith('Pode fazer o Pix'))
          const bloco = linhasExtras.slice(0, corte === -1 ? undefined : corte).join('\n').trimEnd()
          const linhasMsg = msg.split('\n')
          const idxPix = linhasMsg.findIndex((l) => l.startsWith('Pix:'))
          linhasMsg.splice(idxPix, 0, `— Além disso, ${pend.aulas.length === 1 ? 'aula extra' : 'aulas extras'}:`, '', bloco, '')
          msg = linhasMsg.join('\n')
        }
        setMensagem(msg)
        setAulasIds(pend.aulas.map((x) => x.id))
      } else {
        setMensagem(mensagemAulas({ aluno: a, aulas: pend.aulas, chavePix }))
        setAulasIds(pend.aulas.map((x) => x.id))
      }
    }
    montar()
  }, [alunoId])

  if (!aluno) return null

  async function abrirWhatsApp() {
    await marcarCobradas(aulasIds)
    window.open(linkWhatsApp(aluno.telefone, mensagem), '_blank')
  }

  async function copiar() {
    await navigator.clipboard.writeText(mensagem)
    await marcarCobradas(aulasIds)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const semTelefone = !aluno.telefone

  return (
    <div className="tela">
      <div className="topo">
        <div>
          <h1>Cobrar {aluno.nome.split(' ')[0]}</h1>
          <div className="sub">Revise a mensagem antes de enviar — ela é sua.</div>
        </div>
        <button className="btn btn-cinza btn-mini" onClick={() => nav(-1)}>Fechar</button>
      </div>

      <div className="pendencia-destaque" style={{ marginBottom: 14 }}>
        <div className="valor">{formatarMoeda(total)}</div>
        <div className="rotulo">total desta cobrança</div>
      </div>

      <textarea className="preview-msg" value={mensagem} onChange={(e) => setMensagem(e.target.value)} />

      <div style={{ marginTop: 12 }}>
        <button className="btn btn-whats" onClick={abrirWhatsApp} disabled={semTelefone} style={{ opacity: semTelefone ? 0.5 : 1 }}>
          💬 Abrir no WhatsApp
        </button>
        {semTelefone && (
          <p style={{ fontSize: '0.8rem', color: 'var(--falta)', marginTop: 6, textAlign: 'center' }}>
            Este aluno não tem WhatsApp cadastrado — use “Copiar mensagem” ou edite o aluno.
          </p>
        )}
        <button className="btn btn-claro" style={{ marginTop: 8 }} onClick={copiar}>
          {copiado ? '✓ Copiada!' : '📋 Copiar mensagem'}
        </button>
        <button className="btn btn-cinza" style={{ marginTop: 8 }} onClick={() => nav(`/pagar/${aluno.id}`)}>
          Já recebeu? Registrar pagamento
        </button>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--cinza)', marginTop: 14, textAlign: 'center' }}>
        O Marcaula nunca envia mensagens sozinho. Você revisa e envia pelo seu WhatsApp.
      </p>
    </div>
  )
}
