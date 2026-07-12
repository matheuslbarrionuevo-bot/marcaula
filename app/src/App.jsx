import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getProfessor, materializarRecorrentes } from './lib/api.js'
import BottomNav from './components/BottomNav.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Agenda from './pages/Agenda.jsx'
import NovaAula from './pages/NovaAula.jsx'
import Alunos from './pages/Alunos.jsx'
import AlunoForm from './pages/AlunoForm.jsx'
import Aluno from './pages/Aluno.jsx'
import Cobrancas from './pages/Cobrancas.jsx'
import Cobrar from './pages/Cobrar.jsx'
import Pagar from './pages/Pagar.jsx'
import Perfil from './pages/Perfil.jsx'

export default function App() {
  const [pronto, setPronto] = useState(false)
  const [temProfessor, setTemProfessor] = useState(false)
  const location = useLocation()

  useEffect(() => {
    async function iniciar() {
      const prof = await getProfessor()
      setTemProfessor(!!prof?.nome)
      await materializarRecorrentes()
      setPronto(true)
    }
    iniciar()
  }, [location.pathname])

  if (!pronto) return null

  const noOnboarding = location.pathname === '/onboarding'
  if (!temProfessor && !noOnboarding) return <Navigate to="/onboarding" replace />

  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Agenda />} />
        <Route path="/nova-aula" element={<NovaAula />} />
        <Route path="/aula/:id/editar" element={<NovaAula />} />
        <Route path="/alunos" element={<Alunos />} />
        <Route path="/alunos/novo" element={<AlunoForm />} />
        <Route path="/aluno/:id" element={<Aluno />} />
        <Route path="/aluno/:id/editar" element={<AlunoForm />} />
        <Route path="/cobrancas" element={<Cobrancas />} />
        <Route path="/cobrar/:alunoId" element={<Cobrar />} />
        <Route path="/pagar/:alunoId" element={<Pagar />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!noOnboarding && <BottomNav />}
    </>
  )
}
