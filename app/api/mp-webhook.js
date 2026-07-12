// POST /api/mp-webhook — notificações do Mercado Pago sobre assinaturas.
// Quando a assinatura é autorizada → professor vira 'pro'.
// Quando é cancelada/pausada → volta a 'free'.
//
// Env vars necessárias (painel da Vercel):
//   MP_ACCESS_TOKEN        — token de produção do Mercado Pago
//   SUPABASE_SECRET_KEY    — chave sb_secret_... (Settings → API Keys) — NUNCA no front
//   VITE_SUPABASE_URL      — já existe
//
// Configurar no painel do MP: Webhooks → https://marcaula.vercel.app/api/mp-webhook
// evento "subscription_preapproval" (Planos e assinaturas).

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const mpToken = process.env.MP_ACCESS_TOKEN
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!mpToken || !secretKey) {
    console.error('mp-webhook: env vars ausentes')
    return res.status(503).end()
  }

  try {
    const corpo = req.body || {}
    // formatos possíveis: { type: 'subscription_preapproval', data: { id } }
    // ou ?topic=preapproval&id=... na query
    const tipo = corpo.type || corpo.topic || req.query?.topic || ''
    const id = corpo?.data?.id || corpo?.id || req.query?.id
    if (!String(tipo).includes('preapproval') || !id) {
      return res.status(200).json({ ignorado: true }) // evento que não nos interessa
    }

    // busca a assinatura na fonte (nunca confiar só no corpo do webhook)
    const resposta = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })
    if (!resposta.ok) {
      console.error('mp-webhook: preapproval não encontrada', id, resposta.status)
      return res.status(200).json({ ignorado: true })
    }
    const assinatura = await resposta.json()
    const professorId = assinatura.external_reference
    if (!professorId) return res.status(200).json({ ignorado: true })

    const plano = assinatura.status === 'authorized' ? 'pro' : 'free'

    const admin = createClient(process.env.VITE_SUPABASE_URL, secretKey)
    const { error } = await admin
      .from('professores')
      .update({ assinatura: plano })
      .eq('id', professorId)
    if (error) {
      console.error('mp-webhook: falha ao atualizar plano', professorId, error.message)
      return res.status(500).end()
    }

    console.log(`mp-webhook: professor ${professorId} → ${plano} (status MP: ${assinatura.status})`)
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('mp-webhook: erro inesperado', e)
    return res.status(500).end()
  }
}
