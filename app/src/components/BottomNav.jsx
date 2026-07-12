import { NavLink } from 'react-router-dom'

const abas = [
  { para: '/', icone: '📅', rotulo: 'Agenda' },
  { para: '/alunos', icone: '👥', rotulo: 'Alunos' },
  { para: '/cobrancas', icone: '💰', rotulo: 'Cobranças' },
  { para: '/perfil', icone: '⚙️', rotulo: 'Perfil' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {abas.map((a) => (
        <NavLink key={a.para} to={a.para} end={a.para === '/'} className={({ isActive }) => (isActive ? 'ativo' : '')}>
          <span className="icone">{a.icone}</span>
          {a.rotulo}
        </NavLink>
      ))}
    </nav>
  )
}
