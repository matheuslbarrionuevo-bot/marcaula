import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// Login e cadastro na mesma tela — fricção mínima.
export default function Login() {
  const { entrar, cadastrar } = useAuth()
  const [modo, setModo] = useState('entrar') // 'entrar' | 'cadastrar'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const valido =
    email.includes('@') && senha.length >= 6 && (modo === 'entrar' || nome.trim().length >= 2)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setOcupado(true)
    try {
      if (modo === 'entrar') await entrar(email.trim(), senha)
      else await cadastrar(nome.trim(), email.trim(), senha)
      // o App troca de tela sozinho quando a sessão muda
    } catch (err) {
      const msg = String(err?.message || err)
      if (msg.includes('Invalid login credentials')) setErro('E-mail ou senha incorretos.')
      else if (msg.includes('already registered')) setErro('Este e-mail já tem conta — use "Entrar".')
      else if (msg.includes('at least 6')) setErro('A senha precisa de pelo menos 6 caracteres.')
      else setErro('Não deu certo: ' + msg)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="onboarding">
      <div className="logo">Marcaula</div>
      <div className="slogan">Marque, dê e cobre suas aulas. Sem esquecer ninguém.</div>

      <div className="abas" style={{ marginBottom: 18 }}>
        <button className={modo === 'entrar' ? 'ativa' : ''} onClick={() => setModo('entrar')} type="button">
          Entrar
        </button>
        <button className={modo === 'cadastrar' ? 'ativa' : ''} onClick={() => setModo('cadastrar')} type="button">
          Criar conta
        </button>
      </div>

      <form onSubmit={enviar}>
        {modo === 'cadastrar' && (
          <div className="campo">
            <label>Seu nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana Souza" autoFocus />
          </div>
        )}
        <div className="campo">
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoFocus={modo === 'entrar'}
          />
        </div>
        <div className="campo">
          <label>Senha {modo === 'cadastrar' && '(mínimo 6 caracteres)'}</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" />
        </div>

        {erro && (
          <p style={{ color: 'var(--falta)', fontSize: '0.88rem', marginBottom: 12 }}>{erro}</p>
        )}

        <button
          className="btn btn-primario"
          type="submit"
          disabled={!valido || ocupado}
          style={{ opacity: valido && !ocupado ? 1 : 0.5 }}
        >
          {ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta grátis'}
        </button>
      </form>

      <p style={{ fontSize: '0.78rem', color: 'var(--cinza)', textAlign: 'center', marginTop: 16 }}>
        Grátis até 5 alunos. Seus dados ficam seguros na nuvem.
      </p>
    </div>
  )
}
