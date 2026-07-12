// POST /api/criar-assinatura — cria a assinatura Pro no Mercado Pago
// e devolve a URL de checkout. Roda como função da Vercel.
//
// Env vars necessárias (painel da Vercel):
//   MP_ACCESS_TOKEN            — token de produção do Mercado Pago
//   VITE_SUPABASE_URL          — já existe (compartilhada com o front)
//   VITE_SUPABASE_ANON_KEY     — já existe (compartilhada com o front)

import { createClient } from '@supabase/supabase-js'

const PRECO_PRO = 14.9

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'metodo nao permitido' })
  }

  const mpToken = process.env.MP_ACCESS_TOKEN
  if (!mpToken) {
    return res.status(503).json({ erro: 'pagamento nao configurado' })
  }

  // identifica o professor pela sessão do Supabase
  const auth = req.headers.authorization || ''
  const jwt = auth.replace(/^Bearer\s+/i, '')
  if (!jwt) return res.status(401).json({ erro: 'sem sessao' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  )
  const { data: dadosUsuario, error: erroUsuario } = await supabase.auth.getUser(jwt)
  const usuario = dadosUsuario?.user
  if (erroUsuario || !usuario) return res.status(401).json({ erro: 'sessao invalida' })

  // cria a pré-aprovação (assinatura mensal) no Mercado Pago
  const resposta = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mpToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'Marcaula Pro — alunos ilimitados',
      external_reference: usuario.id, // liga a assinatura ao professor
      payer_email: usuario.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: PRECO_PRO,
        currency_id: 'BRL',
      },
      back_url: 'https://marcaula.vercel.app/perfil',
      status: 'pending',
    }),
  })

  const corpo = await resposta.json().catch(() => ({}))
  if (!resposta.ok || !corpo.init_point) {
    console.error('MP preapproval falhou:', resposta.status, corpo)
    return res.status(502).json({ erro: 'falha ao criar assinatura no Mercado Pago' })
  }

  return res.status(200).json({ url: corpo.init_point })
}
