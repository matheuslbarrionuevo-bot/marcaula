// Gerador da mensagem de cobrança — a feature matadora do Marcaula.
// A mensagem é sempre um RESUMO gentil (prestação de contas), nunca um confronto.

import { deISO, formatarData, formatarMoeda, horaDe, labelPeriodo, DIAS_CURTOS, MESES } from './datas.js'

function primeiroNome(nome) {
  return (nome || '').trim().split(/\s+/)[0]
}

function linhaAula(aula) {
  const d = deISO(aula.dataHora)
  const dia = DIAS_CURTOS[d.getDay()]
  const marcador =
    aula.status === 'falta' ? ' (falta — combinado cobrar)' : aula.extra ? ' (aula extra)' : ''
  return `• ${dia} ${formatarData(d)} às ${horaDe(aula.dataHora)} ✅${marcador}`
}

// Cobrança de aulas avulsas (ou extras de mensalista).
export function mensagemAulas({ aluno, aulas, chavePix }) {
  const total = aulas.reduce((s, a) => s + a.valor, 0)
  const meses = [...new Set(aulas.map((a) => deISO(a.dataHora).getMonth()))]
  // aulas de um mês só citam o mês; de meses mistos, não citam nenhum
  const deMes = meses.length === 1 ? ` de ${MESES[meses[0]]}` : ''
  const singular = aulas.length === 1
  const plural = singular ? 'aula' : 'aulas'

  return [
    `Oi, ${primeiroNome(aluno.nome)}! Tudo bem? 😊`,
    ``,
    `Segue o resumo ${singular ? 'da sua aula' : 'das suas aulas'}${deMes}:`,
    ``,
    `📚 ${aulas.length} ${plural}:`,
    ...aulas.map(linhaAula),
    ``,
    `💰 Total: ${formatarMoeda(total)}`,
    ``,
    `Pode fazer o Pix para a chave abaixo 👇`,
    `${chavePix}`,
    ``,
    `Qualquer dúvida me chama! Obrigado(a) 🙏`,
  ].join('\n')
}

// Cobrança de mensalidade (mensalista) — lista as aulas do mês como prestação de contas.
export function mensagemMensalidade({ aluno, periodo, aulasDoMes, chavePix }) {
  const dadas = aulasDoMes.filter((a) => a.status === 'dada')
  const dias = dadas.map((a) => formatarData(deISO(a.dataHora))).join(', ')
  const linhas = [
    `Oi, ${primeiroNome(aluno.nome)}! Tudo bem? 😊`,
    ``,
    `Passando o lembrete da mensalidade de ${labelPeriodo(periodo)}: ${formatarMoeda(aluno.valorMensal)}.`,
  ]
  if (dadas.length) {
    linhas.push(``, `Nesse mês tivemos:`, `📚 ${dadas.length} ${dadas.length === 1 ? 'aula' : 'aulas'}: ${dias} ✅`)
  }
  linhas.push(``, `Pix: ${chavePix}`, ``, `Qualquer dúvida me chama! Obrigado(a) 🙏`)
  return linhas.join('\n')
}

// Link wa.me — o professor envia manualmente (nunca automação não-oficial).
export function linkWhatsApp(telefone, mensagem) {
  const so = (telefone || '').replace(/\D/g, '')
  const numero = so.startsWith('55') ? so : `55${so}`
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
