// Detecção de plataforma — usada para cumprir a política de faturamento
// do Google Play: dentro do app Android (TWA), a venda da assinatura
// (que é via Mercado Pago, fora do Google) não pode ser oferecida.
//
// O TWA abre com document.referrer "android-app://br.com.marcaula.app".
// O referrer só existe na primeira navegação, então persistimos a marca.

const CHAVE = 'mc_plataforma_twa'

export function marcarPlataforma() {
  try {
    if (document.referrer.startsWith('android-app://')) {
      localStorage.setItem(CHAVE, '1')
    }
  } catch {
    /* sem localStorage — segue como web */
  }
}

export function ehTWA() {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}
