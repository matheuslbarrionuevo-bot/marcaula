import { useState } from 'react'
import { salvarProfessor } from '../lib/api.js'

// Onboarding em 3 passos rápidos: nome → PIX → valor padrão.
// Meta: professor operacional em menos de 5 minutos.
export default function Onboarding() {
  const [passo, setPasso] = useState(0)
  const [nome, setNome] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [valorAulaPadrao, setValorAulaPadrao] = useState('')

  async function concluir() {
    await salvarProfessor({
      nome: nome.trim(),
      chavePix: chavePix.trim(),
      valorAulaPadrao: Number(valorAulaPadrao) || 0,
      duracaoPadraoMin: 60,
      assinatura: 'free',
    })
    // navegação com reload: o App remonta e relê o professor
    // (evita o guard redirecionar de volta antes do estado atualizar)
    window.location.href = '/alunos/novo'
  }

  const passos = [
    {
      titulo: 'Como você quer ser chamado(a)?',
      campo: (
        <div className="campo">
          <label>Seu nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana Souza" autoFocus />
        </div>
      ),
      valido: nome.trim().length >= 2,
    },
    {
      titulo: 'Qual é a sua chave PIX?',
      campo: (
        <div className="campo">
          <label>Chave PIX (vai nas mensagens de cobrança)</label>
          <input value={chavePix} onChange={(e) => setChavePix(e.target.value)} placeholder="CPF, celular, e-mail ou aleatória" autoFocus />
        </div>
      ),
      valido: chavePix.trim().length >= 5,
    },
    {
      titulo: 'Quanto custa a sua aula?',
      campo: (
        <div className="campo">
          <label>Valor padrão por aula (dá pra mudar por aluno)</label>
          <input
            type="number"
            inputMode="decimal"
            value={valorAulaPadrao}
            onChange={(e) => setValorAulaPadrao(e.target.value)}
            placeholder="Ex.: 60"
            autoFocus
          />
        </div>
      ),
      valido: Number(valorAulaPadrao) > 0,
    },
  ]

  const atual = passos[passo]

  return (
    <div className="onboarding">
      <div className="logo">Marcaula</div>
      <div className="slogan">Marque, dê e cobre suas aulas. Sem esquecer ninguém.</div>

      <div className="passo-dots">
        {passos.map((_, i) => (
          <span key={i} className={i <= passo ? 'ativo' : ''} />
        ))}
      </div>

      <h2 style={{ marginBottom: 16, fontSize: '1.15rem' }}>{atual.titulo}</h2>
      {atual.campo}

      <button
        className="btn btn-primario"
        disabled={!atual.valido}
        style={{ opacity: atual.valido ? 1 : 0.5, marginTop: 8 }}
        onClick={() => (passo < passos.length - 1 ? setPasso(passo + 1) : concluir())}
      >
        {passo < passos.length - 1 ? 'Continuar' : 'Cadastrar meu primeiro aluno →'}
      </button>

      {passo > 0 && (
        <button className="btn btn-cinza" style={{ marginTop: 10 }} onClick={() => setPasso(passo - 1)}>
          Voltar
        </button>
      )}
    </div>
  )
}
