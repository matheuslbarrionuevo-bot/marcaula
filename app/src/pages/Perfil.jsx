import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfessor, salvarProfessor, exportarDados, statusPlano, LIMITE_ALUNOS_FREE } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ehTWA } from '../lib/plataforma.js'

export default function Perfil() {
  const { usuario, sair } = useAuth()
  const nav = useNavigate()
  const [plano, setPlano] = useState(null)
  const [nome, setNome] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [valorAulaPadrao, setValorAulaPadrao] = useState('')
  const [duracaoPadraoMin, setDuracaoPadraoMin] = useState(60)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    getProfessor().then((p) => {
      if (!p) return
      setNome(p.nome || '')
      setChavePix(p.chavePix || '')
      setValorAulaPadrao(String(p.valorAulaPadrao || ''))
      setDuracaoPadraoMin(p.duracaoPadraoMin || 60)
    })
    statusPlano().then(setPlano)
  }, [])

  async function gravar() {
    await salvarProfessor({
      nome: nome.trim(),
      chavePix: chavePix.trim(),
      valorAulaPadrao: Number(valorAulaPadrao) || 0,
      duracaoPadraoMin: Number(duracaoPadraoMin) || 60,
    })
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  async function exportar() {
    const json = await exportarDados()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marcaula-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="tela">
      <div className="topo">
        <div>
          <h1>Perfil</h1>
          <div className="sub">Seus dados e padrões</div>
        </div>
      </div>

      <div className="campo">
        <label>Seu nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div className="campo">
        <label>Chave PIX (vai nas mensagens de cobrança)</label>
        <input value={chavePix} onChange={(e) => setChavePix(e.target.value)} />
      </div>

      <div className="linha-2">
        <div className="campo">
          <label>Valor padrão da aula (R$)</label>
          <input type="number" inputMode="decimal" value={valorAulaPadrao} onChange={(e) => setValorAulaPadrao(e.target.value)} />
        </div>
        <div className="campo">
          <label>Duração padrão (min)</label>
          <input type="number" inputMode="numeric" value={duracaoPadraoMin} onChange={(e) => setDuracaoPadraoMin(e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primario" onClick={gravar}>
        {salvo ? '✓ Salvo!' : 'Salvar'}
      </button>

      <div className="card" style={{ marginTop: 20 }}>
        {plano?.plano === 'pro' ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⭐ Marcaula Pro</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--cinza)' }}>
              Alunos ilimitados. Obrigado por apoiar o Marcaula!
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Plano gratuito</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--cinza)', marginBottom: 10 }}>
              {plano ? `${plano.totalAtivos} de ${LIMITE_ALUNOS_FREE} alunos ativos.` : `Até ${LIMITE_ALUNOS_FREE} alunos ativos.`}{' '}
              No Pro, alunos ilimitados.
            </div>
            {ehTWA() ? (
              // política de faturamento da Play: sem venda dentro do app Android
              <div style={{ fontSize: '0.85rem', color: 'var(--cinza)' }}>
                O plano Pro pode ser gerenciado pelo site do Marcaula.
              </div>
            ) : (
              <button className="btn btn-claro" onClick={() => nav('/assinar')}>
                ⭐ Conhecer o Marcaula Pro
              </button>
            )}
          </>
        )}
      </div>

      <button className="btn btn-claro" style={{ marginTop: 8 }} onClick={exportar}>
        ⬇️ Exportar meus dados (backup)
      </button>

      <button className="btn btn-cinza" style={{ marginTop: 8 }} onClick={sair}>
        Sair da conta
      </button>

      <p style={{ fontSize: '0.75rem', color: 'var(--cinza)', textAlign: 'center', marginTop: 20 }}>
        Marcaula v0.2 · conectado como {usuario?.email} · dados sincronizados na nuvem
      </p>
      <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: 6 }}>
        <a href="/privacidade" style={{ color: 'var(--cinza)' }}>Privacidade</a>
        {' · '}
        <a href="/excluir-conta" style={{ color: 'var(--cinza)' }}>Excluir conta</a>
      </p>
    </div>
  )
}
