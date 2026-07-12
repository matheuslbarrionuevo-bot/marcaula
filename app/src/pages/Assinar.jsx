import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { statusPlano, iniciarAssinatura, LIMITE_ALUNOS_FREE } from '../lib/api.js'

// Página de upgrade: grátis (5 alunos) → Pro R$ 14,90/mês.
export default function Assinar() {
  const nav = useNavigate()
  const [status, setStatus] = useState(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    statusPlano().then(setStatus)
  }, [])

  async function assinar() {
    setErro('')
    setOcupado(true)
    try {
      const url = await iniciarAssinatura()
      window.location.href = url // checkout do Mercado Pago
    } catch (e) {
      const msg = String(e?.message || e)
      if (msg.includes('nao configurado')) {
        setErro('O pagamento está em configuração. Tente novamente em breve!')
      } else {
        setErro(msg)
      }
      setOcupado(false)
    }
  }

  if (status?.plano === 'pro') {
    return (
      <div className="tela">
        <div className="topo">
          <h1>Marcaula Pro</h1>
          <button className="btn btn-cinza btn-mini" onClick={() => nav(-1)}>Fechar</button>
        </div>
        <div className="tudo-pago">⭐ Você já é Pro. Alunos ilimitados, obrigado por apoiar!</div>
      </div>
    )
  }

  return (
    <div className="tela">
      <div className="topo">
        <div>
          <h1>Marcaula Pro</h1>
          <div className="sub">Para quem vive de dar aulas</div>
        </div>
        <button className="btn btn-cinza btn-mini" onClick={() => nav(-1)}>Fechar</button>
      </div>

      {status && status.totalAtivos >= LIMITE_ALUNOS_FREE && (
        <div className="pendencia-destaque">
          <div className="rotulo">
            Você chegou aos {LIMITE_ALUNOS_FREE} alunos do plano gratuito 🎉
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            R$ 14,90<span style={{ fontSize: '0.95rem', color: 'var(--cinza)' }}>/mês</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--cinza)' }}>menos que meia aula por mês</div>
        </div>
        <div style={{ marginTop: 12, display: 'grid', gap: 8, fontSize: '0.95rem' }}>
          <div>✅ <b>Alunos ilimitados</b> — cresça sem trava</div>
          <div>✅ Agenda, cobranças e pagamentos na nuvem</div>
          <div>✅ Mensagem de cobrança pronta pro WhatsApp</div>
          <div>✅ Acesse do celular e do computador</div>
          <div>✅ Cancele quando quiser, sem multa</div>
        </div>
      </div>

      {erro && <p style={{ color: 'var(--falta)', fontSize: '0.88rem', marginBottom: 10 }}>{erro}</p>}

      <button className="btn btn-primario" onClick={assinar} disabled={ocupado} style={{ opacity: ocupado ? 0.6 : 1 }}>
        {ocupado ? 'Abrindo pagamento…' : '⭐ Assinar com Mercado Pago'}
      </button>

      <p style={{ fontSize: '0.78rem', color: 'var(--cinza)', textAlign: 'center', marginTop: 12 }}>
        Pagamento seguro pelo Mercado Pago (PIX ou cartão). A ativação é automática após a confirmação.
      </p>
    </div>
  )
}
