// Helpers de data — tudo em horário local, pt-BR.

export const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
export const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// 'AAAA-MM-DDTHH:MM' local (sem timezone — o app é single-device na Fase 1)
export function toISOLocal(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function deISO(iso) {
  return new Date(iso)
}

export function hoje() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDias(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// Segunda-feira como início da semana
export function inicioSemana(d) {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  const dia = r.getDay()
  r.setDate(r.getDate() - ((dia + 6) % 7))
  return r
}

export function mesmaData(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function periodoDe(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function labelPeriodo(periodo) {
  const [ano, mes] = periodo.split('-').map(Number)
  return `${MESES[mes - 1]}/${ano}`
}

export function formatarData(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}`
}

export function formatarDataHora(iso) {
  const d = deISO(iso)
  return `${DIAS_CURTOS[d.getDay()]} ${formatarData(d)} às ${horaDe(iso)}`
}

export function horaDe(iso) {
  return iso.slice(11, 16)
}

export function formatarMoeda(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
