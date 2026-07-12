// Camada de dados do Marcaula — Fase 2: Supabase.
// Mesmas assinaturas da Fase 1 (localStorage): as telas não mudam.
// RLS garante que cada professor só vê os próprios dados.

import { supabase } from './supabase.js'
import { toISOLocal, deISO, hoje, addDias, inicioSemana, periodoDe } from './datas.js'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function lancar(error, onde) {
  if (error) throw new Error(`${onde}: ${error.message}`)
}

/* ---------------- professor (config) ---------------- */

export async function getProfessor() {
  const { data, error } = await supabase.from('professores').select('*').maybeSingle()
  lancar(error, 'getProfessor')
  return data
}

export async function salvarProfessor(dados) {
  const { data: sessao } = await supabase.auth.getUser()
  const usuario = sessao?.user
  if (!usuario) throw new Error('salvarProfessor: sem sessão')
  const { data, error } = await supabase
    .from('professores')
    .upsert({ id: usuario.id, ...dados })
    .select()
    .single()
  lancar(error, 'salvarProfessor')
  return data
}

/* ---------------- alunos ---------------- */

export async function listarAlunos({ incluirInativos = false } = {}) {
  let q = supabase.from('alunos').select('*').order('nome')
  if (!incluirInativos) q = q.eq('ativo', true)
  const { data, error } = await q
  lancar(error, 'listarAlunos')
  return data || []
}

export async function obterAluno(id) {
  const { data, error } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle()
  lancar(error, 'obterAluno')
  return data
}

export async function salvarAluno(dados) {
  if (dados.id) {
    const { data, error } = await supabase
      .from('alunos')
      .update(dados)
      .eq('id', dados.id)
      .select()
      .single()
    lancar(error, 'salvarAluno')
    return data
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
  const { data, error } = await supabase.from('alunos').insert(novo).select().single()
  lancar(error, 'salvarAluno')
  return data
}

export async function arquivarAluno(id) {
  const { error } = await supabase.from('alunos').update({ ativo: false }).eq('id', id)
  lancar(error, 'arquivarAluno')
}

/* ---------------- aulas ---------------- */

export async function listarAulas({ alunoId, deISO: de, ateISO: ate } = {}) {
  let q = supabase.from('aulas').select('*').order('dataHora')
  if (alunoId) q = q.eq('alunoId', alunoId)
  if (de) q = q.gte('dataHora', de)
  if (ate) q = q.lte('dataHora', ate)
  const { data, error } = await q
  lancar(error, 'listarAulas')
  return data || []
}

export async function obterAula(id) {
  const { data, error } = await supabase.from('aulas').select('*').eq('id', id).maybeSingle()
  lancar(error, 'obterAula')
  return data
}

export async function salvarAula(dados) {
  if (dados.id) {
    const { data, error } = await supabase
      .from('aulas')
      .update(dados)
      .eq('id', dados.id)
      .select()
      .single()
    lancar(error, 'salvarAula')
    return data
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
  const { data, error } = await supabase.from('aulas').insert(nova).select().single()
  lancar(error, 'salvarAula')
  return data
}

export async function excluirAula(id) {
  const { error } = await supabase.from('aulas').delete().eq('id', id)
  lancar(error, 'excluirAula')
}

// Materializa aulas recorrentes: semana atual + 3 à frente.
// Idempotente pela chave alunoId|dataHora (aula cancelada permanece
// como registro e não é recriada).
export async function materializarRecorrentes() {
  const alunos = await listarAlunos()
  const comRecorrencia = alunos.filter((a) => a.recorrencia?.length)
  if (!comRecorrencia.length) return

  const base = inicioSemana(hoje())
  const existentes = await listarAulas({ deISO: toISOLocal(base) })
  const chaves = new Set(existentes.map((a) => `${a.alunoId}|${a.dataHora}`))
  const novas = []

  for (const aluno of comRecorrencia) {
    for (let sem = 0; sem < 4; sem++) {
      for (const rec of aluno.recorrencia) {
        const offsetDia = (rec.diaSemana + 6) % 7 // semana começa na segunda
        const dia = addDias(base, sem * 7 + offsetDia)
        const [h, m] = rec.hora.split(':').map(Number)
        dia.setHours(h, m, 0, 0)
        const dataHora = toISOLocal(dia)
        const chave = `${aluno.id}|${dataHora}`
        if (chaves.has(chave)) continue
        if (deISO(dataHora) < hoje()) continue
        chaves.add(chave)
        novas.push({
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
  if (novas.length) {
    const { error } = await supabase.from('aulas').insert(novas)
    lancar(error, 'materializarRecorrentes')
  }
}

/* ---------------- pagamentos ---------------- */

export async function listarPagamentos({ alunoId, periodo } = {}) {
  let q = supabase.from('pagamentos').select('*').order('data', { ascending: false })
  if (alunoId) q = q.eq('alunoId', alunoId)
  if (periodo) q = q.like('data', `${periodo}%`)
  const { data, error } = await q
  lancar(error, 'listarPagamentos')
  return data || []
}

export async function registrarPagamento({ alunoId, valor, forma, tipo, periodo, aulasIds = [], obs = '' }) {
  const pag = {
    id: uid(),
    alunoId,
    valor,
    forma,
    tipo,
    periodo: periodo || null,
    aulasIds,
    obs,
    data: toISOLocal(new Date()),
  }
  const { data, error } = await supabase.from('pagamentos').insert(pag).select().single()
  lancar(error, 'registrarPagamento')

  if (aulasIds.length) {
    const { error: e2 } = await supabase
      .from('aulas')
      .update({ pagamentoId: data.id })
      .in('id', aulasIds)
    lancar(e2, 'registrarPagamento (vincular aulas)')
  }
  return data
}

export async function excluirPagamento(id) {
  // FK aulas.pagamentoId tem ON DELETE SET NULL — as aulas voltam a pendentes sozinhas
  const { error } = await supabase.from('pagamentos').delete().eq('id', id)
  lancar(error, 'excluirPagamento')
}

/* ---------------- pendências (regra central) ---------------- */

function ehCobravel(aula) {
  return (
    aula.valor > 0 &&
    !aula.pagamentoId &&
    (aula.status === 'dada' || (aula.status === 'falta' && aula.cobrarFalta))
  )
}

export async function aulasPendentes(alunoId) {
  const { data, error } = await supabase
    .from('aulas')
    .select('*')
    .eq('alunoId', alunoId)
    .gt('valor', 0)
    .is('pagamentoId', null)
    .in('status', ['dada', 'falta'])
    .order('dataHora')
  lancar(error, 'aulasPendentes')
  return (data || []).filter(ehCobravel)
}

function mensalidadesPendentesCalc(aluno, periodosPagos) {
  if (aluno.modalidade !== 'mensalista' || !aluno.valorMensal) return []
  const criado = deISO(aluno.criadoEm)
  const agora = new Date()
  const pendentes = []
  const cursor = new Date(agora.getFullYear(), agora.getMonth() - 5, 1)
  while (cursor <= agora) {
    const per = periodoDe(cursor)
    const fimMes = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    if (fimMes >= criado && !periodosPagos.has(per)) {
      pendentes.push({ periodo: per, valor: aluno.valorMensal })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return pendentes
}

export async function mensalidadesPendentes(aluno) {
  const pags = await listarPagamentos({ alunoId: aluno.id })
  const pagos = new Set(pags.filter((p) => p.tipo === 'mensalidade').map((p) => p.periodo))
  return mensalidadesPendentesCalc(aluno, pagos)
}

export async function pendenciaAluno(aluno) {
  const [aulas, mensal] = await Promise.all([aulasPendentes(aluno.id), mensalidadesPendentes(aluno)])
  const totalAulas = aulas.reduce((s, a) => s + a.valor, 0)
  const totalMensal = mensal.reduce((s, m) => s + m.valor, 0)
  return { total: totalAulas + totalMensal, aulas, mensalidades: mensal }
}

// Resumo do mês em 4 consultas (não N por aluno).
export async function resumoMes(periodo) {
  const [alunos, pagsMes, aulasAbertas, pagsMensalidade] = await Promise.all([
    listarAlunos(),
    listarPagamentos({ periodo }),
    supabase
      .from('aulas')
      .select('*')
      .gt('valor', 0)
      .is('pagamentoId', null)
      .in('status', ['dada', 'falta'])
      .then(({ data, error }) => {
        lancar(error, 'resumoMes (aulas)')
        return (data || []).filter(ehCobravel)
      }),
    supabase
      .from('pagamentos')
      .select('alunoId, periodo')
      .eq('tipo', 'mensalidade')
      .then(({ data, error }) => {
        lancar(error, 'resumoMes (mensalidades)')
        return data || []
      }),
  ])

  const pagosPorAluno = new Map()
  for (const p of pagsMensalidade) {
    if (!pagosPorAluno.has(p.alunoId)) pagosPorAluno.set(p.alunoId, new Set())
    pagosPorAluno.get(p.alunoId).add(p.periodo)
  }

  const recebido = pagsMes.reduce((s, p) => s + p.valor, 0)
  let pendente = 0
  const pendencias = []
  for (const aluno of alunos) {
    const aulas = aulasAbertas.filter((a) => a.alunoId === aluno.id)
    const mensalidades = mensalidadesPendentesCalc(aluno, pagosPorAluno.get(aluno.id) || new Set())
    const total =
      aulas.reduce((s, a) => s + a.valor, 0) + mensalidades.reduce((s, m) => s + m.valor, 0)
    if (total > 0) {
      pendente += total
      pendencias.push({ aluno, total, aulas, mensalidades })
    }
  }
  return { recebido, pendente, previsto: recebido + pendente, pendencias, pagamentos: pagsMes }
}

/* ---------------- marcação de cobrança ---------------- */

export async function marcarCobradas(aulasIds) {
  if (!aulasIds.length) return
  const { error } = await supabase
    .from('aulas')
    .update({ cobradaEm: toISOLocal(new Date()) })
    .in('id', aulasIds)
  lancar(error, 'marcarCobradas')
}

/* ---------------- exportação ---------------- */

export async function exportarDados() {
  const [professor, alunos, aulas, pagamentos] = await Promise.all([
    getProfessor(),
    listarAlunos({ incluirInativos: true }),
    listarAulas(),
    listarPagamentos(),
  ])
  return JSON.stringify(
    { professor, alunos, aulas, pagamentos, exportadoEm: toISOLocal(new Date()) },
    null,
    2
  )
}

/* ---------------- migração da Fase 1 (localStorage) ---------------- */

// Roda uma vez após login/cadastro: importa o que existir no aparelho
// para a nuvem, se a conta ainda estiver vazia. Dados locais ficam
// intactos como backup (apenas marcamos a migração como feita).
export async function migrarDadosLocais() {
  try {
    if (localStorage.getItem('mc_migrado')) return

    const ler = (k) => {
      try {
        return JSON.parse(localStorage.getItem(k))
      } catch {
        return null
      }
    }
    const professorLocal = ler('mc_professor')
    const alunosLocais = ler('mc_alunos') || []
    const aulasLocais = ler('mc_aulas') || []
    const pagamentosLocais = ler('mc_pagamentos') || []

    if (!professorLocal?.nome && !alunosLocais.length) {
      localStorage.setItem('mc_migrado', '1')
      return
    }

    // conta já tem dados na nuvem? então não importa (evita duplicar)
    const { count, error } = await supabase
      .from('alunos')
      .select('id', { count: 'exact', head: true })
    lancar(error, 'migrarDadosLocais (verificação)')
    if (count > 0) {
      localStorage.setItem('mc_migrado', '1')
      return
    }

    if (professorLocal?.nome) await salvarProfessor(professorLocal)
    if (alunosLocais.length) {
      const { error: e1 } = await supabase.from('alunos').insert(alunosLocais)
      lancar(e1, 'migrarDadosLocais (alunos)')
    }
    if (pagamentosLocais.length) {
      const { error: e2 } = await supabase.from('pagamentos').insert(pagamentosLocais)
      lancar(e2, 'migrarDadosLocais (pagamentos)')
    }
    if (aulasLocais.length) {
      const { error: e3 } = await supabase.from('aulas').insert(aulasLocais)
      lancar(e3, 'migrarDadosLocais (aulas)')
    }
    localStorage.setItem('mc_migrado', '1')
  } catch (e) {
    // migração nunca deve travar o login; dados locais permanecem como backup
    console.error('Migração local → nuvem falhou (tentará no próximo login):', e)
  }
}
