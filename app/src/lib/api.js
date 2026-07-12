// Camada de dados do Marcaula — Fase 1: localStorage.
// Todas as funções são assíncronas de propósito: na Fase 2 esta camada
// vira Supabase sem mexer em nenhuma tela (mesmo padrão do Parcere).

import { toISOLocal, deISO, hoje, addDias, inicioSemana, periodoDe } from './datas.js'

const K = {
  professor: 'mc_professor',
  alunos: 'mc_alunos',
  aulas: 'mc_aulas',
  pagamentos: 'mc_pagamentos',
}

function ler(chave, padrao) {
  try {
    const raw = localStorage.getItem(chave)
    return raw ? JSON.parse(raw) : padrao
  } catch {
    return padrao
  }
}

function gravar(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/* ---------------- professor (config) ---------------- */

export async function getProfessor() {
  return ler(K.professor, null)
}

export async function salvarProfessor(dados) {
  const atual = ler(K.professor, {})
  const novo = { ...atual, ...dados }
  gravar(K.professor, novo)
  return novo
}

/* ---------------- alunos ---------------- */

export async function listarAlunos({ incluirInativos = false } = {}) {
  const alunos = ler(K.alunos, [])
  return alunos
    .filter((a) => incluirInativos || a.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function obterAluno(id) {
  return ler(K.alunos, []).find((a) => a.id === id) || null
}

export async function salvarAluno(dados) {
  const alunos = ler(K.alunos, [])
  if (dados.id) {
    const i = alunos.findIndex((a) => a.id === dados.id)
    if (i >= 0) alunos[i] = { ...alunos[i], ...dados }
    gravar(K.alunos, alunos)
    return alunos[i]
  }
  const novo = {
    id: uid(),
    nome: '',
    telefone: '',
    modalidade: 'avulso',
    valorAula: 0,
    valorMensal: 0,
    diaVencimento: 5,
    cobrarFalta: true,
    recorrencia: [],
    observacoes: '',
    ativo: true,
    criadoEm: toISOLocal(new Date()),
    ...dados,
  }
  alunos.push(novo)
  gravar(K.alunos, alunos)
  return novo
}

export async function arquivarAluno(id) {
  const alunos = ler(K.alunos, [])
  const a = alunos.find((x) => x.id === id)
  if (a) a.ativo = false
  gravar(K.alunos, alunos)
}

/* ---------------- aulas ---------------- */

export async function listarAulas({ alunoId, deISO: de, ateISO: ate } = {}) {
  let aulas = ler(K.aulas, [])
  if (alunoId) aulas = aulas.filter((a) => a.alunoId === alunoId)
  if (de) aulas = aulas.filter((a) => a.dataHora >= de)
  if (ate) aulas = aulas.filter((a) => a.dataHora <= ate)
  return aulas.sort((a, b) => a.dataHora.localeCompare(b.dataHora))
}

export async function obterAula(id) {
  return ler(K.aulas, []).find((a) => a.id === id) || null
}

export async function salvarAula(dados) {
  const aulas = ler(K.aulas, [])
  if (dados.id) {
    const i = aulas.findIndex((a) => a.id === dados.id)
    if (i >= 0) aulas[i] = { ...aulas[i], ...dados }
    gravar(K.aulas, aulas)
    return aulas[i]
  }
  const nova = {
    id: uid(),
    alunoId: null,
    dataHora: '',
    duracaoMin: 60,
    status: 'agendada',
    cobrarFalta: true,
    valor: 0,
    pagamentoId: null,
    cobradaEm: null,
    origem: 'avulsa',
    extra: false,
    obs: '',
    ...dados,
  }
  aulas.push(nova)
  gravar(K.aulas, aulas)
  return nova
}

export async function excluirAula(id) {
  gravar(K.aulas, ler(K.aulas, []).filter((a) => a.id !== id))
}

// Materializa as aulas recorrentes da semana atual + 3 à frente.
// Idempotente: usa a chave alunoId+dataHora — aula já criada (mesmo que
// editada, cancelada ou excluída via status) não é recriada.
export async function materializarRecorrentes() {
  const alunos = ler(K.alunos, []).filter((a) => a.ativo && a.recorrencia?.length)
  if (!alunos.length) return
  const aulas = ler(K.aulas, [])
  const existentes = new Set(aulas.map((a) => `${a.alunoId}|${a.dataHora}`))
  const base = inicioSemana(hoje())
  let mudou = false

  for (const aluno of alunos) {
    for (let sem = 0; sem < 4; sem++) {
      for (const rec of aluno.recorrencia) {
        // rec.diaSemana: 0=dom..6=sáb; semana começa na segunda
        const offsetDia = (rec.diaSemana + 6) % 7
        const dia = addDias(base, sem * 7 + offsetDia)
        const [h, m] = rec.hora.split(':').map(Number)
        dia.setHours(h, m, 0, 0)
        const dataHora = toISOLocal(dia)
        const chave = `${aluno.id}|${dataHora}`
        if (existentes.has(chave)) continue
        // não criar aulas no passado (antes de hoje)
        if (deISO(dataHora) < hoje()) continue
        existentes.add(chave)
        mudou = true
        aulas.push({
          id: uid(),
          alunoId: aluno.id,
          dataHora,
          duracaoMin: rec.duracaoMin || 60,
          status: 'agendada',
          cobrarFalta: aluno.cobrarFalta,
          valor: aluno.modalidade === 'avulso' ? aluno.valorAula : 0,
          pagamentoId: null,
          cobradaEm: null,
          origem: 'recorrente',
          extra: false,
          obs: '',
        })
      }
    }
  }
  if (mudou) gravar(K.aulas, aulas)
}

/* ---------------- pagamentos ---------------- */

export async function listarPagamentos({ alunoId, periodo } = {}) {
  let pags = ler(K.pagamentos, [])
  if (alunoId) pags = pags.filter((p) => p.alunoId === alunoId)
  if (periodo) pags = pags.filter((p) => (p.data || '').startsWith(periodo))
  return pags.sort((a, b) => b.data.localeCompare(a.data))
}

export async function registrarPagamento({ alunoId, valor, forma, tipo, periodo, aulasIds = [], obs = '' }) {
  const pags = ler(K.pagamentos, [])
  const pag = {
    id: uid(),
    alunoId,
    valor,
    forma,
    tipo, // 'mensalidade' | 'aulas'
    periodo: periodo || null,
    aulasIds,
    obs,
    data: toISOLocal(new Date()),
  }
  pags.push(pag)
  gravar(K.pagamentos, pags)

  if (aulasIds.length) {
    const aulas = ler(K.aulas, [])
    for (const a of aulas) {
      if (aulasIds.includes(a.id)) a.pagamentoId = pag.id
    }
    gravar(K.aulas, aulas)
  }
  return pag
}

export async function excluirPagamento(id) {
  const pags = ler(K.pagamentos, [])
  gravar(K.pagamentos, pags.filter((p) => p.id !== id))
  // desfaz o vínculo nas aulas
  const aulas = ler(K.aulas, [])
  let mudou = false
  for (const a of aulas) {
    if (a.pagamentoId === id) {
      a.pagamentoId = null
      mudou = true
    }
  }
  if (mudou) gravar(K.aulas, aulas)
}

/* ---------------- pendências (regra central) ---------------- */

// Aulas cobráveis e ainda não pagas de um aluno (modalidade avulsa
// ou aulas extra de mensalista): dada, ou falta com cobrança.
export async function aulasPendentes(alunoId) {
  const aulas = await listarAulas({ alunoId })
  return aulas.filter(
    (a) =>
      a.valor > 0 &&
      !a.pagamentoId &&
      (a.status === 'dada' || (a.status === 'falta' && a.cobrarFalta))
  )
}

// Mensalidades sem pagamento — olha até 6 meses para trás (a partir do cadastro).
export async function mensalidadesPendentes(aluno) {
  if (aluno.modalidade !== 'mensalista' || !aluno.valorMensal) return []
  const pags = await listarPagamentos({ alunoId: aluno.id })
  const pagos = new Set(pags.filter((p) => p.tipo === 'mensalidade').map((p) => p.periodo))
  const criado = deISO(aluno.criadoEm)
  const agora = new Date()
  const pendentes = []
  const cursor = new Date(agora.getFullYear(), agora.getMonth() - 5, 1)
  while (cursor <= agora) {
    const per = periodoDe(cursor)
    const inicioMes = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    if (inicioMes >= criado && !pagos.has(per)) {
      pendentes.push({ periodo: per, valor: aluno.valorMensal })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return pendentes
}

// Pendência total de um aluno (R$) — usada nos badges e no detalhe.
export async function pendenciaAluno(aluno) {
  const aulas = await aulasPendentes(aluno.id)
  const mensal = await mensalidadesPendentes(aluno)
  const totalAulas = aulas.reduce((s, a) => s + a.valor, 0)
  const totalMensal = mensal.reduce((s, m) => s + m.valor, 0)
  return { total: totalAulas + totalMensal, aulas, mensalidades: mensal }
}

// Resumo financeiro de um mês: previsto, recebido, pendente.
export async function resumoMes(periodo) {
  const alunos = await listarAlunos()
  const pags = ler(K.pagamentos, []).filter((p) => (p.data || '').startsWith(periodo))
  const recebido = pags.reduce((s, p) => s + p.valor, 0)
  let pendente = 0
  const pendencias = []
  for (const aluno of alunos) {
    const p = await pendenciaAluno(aluno)
    if (p.total > 0) {
      pendente += p.total
      pendencias.push({ aluno, ...p })
    }
  }
  return { recebido, pendente, previsto: recebido + pendente, pendencias, pagamentos: pags }
}

/* ---------------- marcação de cobrança ---------------- */

export async function marcarCobradas(aulasIds) {
  const aulas = ler(K.aulas, [])
  const agora = toISOLocal(new Date())
  for (const a of aulas) {
    if (aulasIds.includes(a.id)) a.cobradaEm = agora
  }
  gravar(K.aulas, aulas)
}

/* ---------------- exportação ---------------- */

export async function exportarDados() {
  return JSON.stringify(
    {
      professor: ler(K.professor, null),
      alunos: ler(K.alunos, []),
      aulas: ler(K.aulas, []),
      pagamentos: ler(K.pagamentos, []),
      exportadoEm: toISOLocal(new Date()),
    },
    null,
    2
  )
}
