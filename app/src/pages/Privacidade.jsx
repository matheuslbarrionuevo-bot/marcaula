// Página pública (acessível sem login) — exigida pela Google Play.
export default function Privacidade() {
  return (
    <div className="tela" style={{ paddingBottom: 40, maxWidth: 640 }}>
      <div className="topo">
        <h1>Política de Privacidade</h1>
      </div>
      <div style={{ display: 'grid', gap: 14, fontSize: '0.95rem', lineHeight: 1.6 }}>
        <p><b>Marcaula</b> — atualizada em 12/07/2026.</p>

        <p>
          O Marcaula é um aplicativo de organização de aulas e cobranças para professores
          particulares, operado por Matheus Barrionuevo (Monte Cristo). Esta política explica,
          em linguagem direta, quais dados tratamos e por quê, conforme a Lei Geral de
          Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>

        <h2 style={{ fontSize: '1.05rem' }}>Dados que coletamos</h2>
        <p>
          <b>Da sua conta:</b> nome, e-mail e senha (criptografada). Se você assinar o plano
          Pro, o pagamento é processado pelo Mercado Pago — não vemos nem armazenamos dados
          do seu cartão.
        </p>
        <p>
          <b>Dados que você cadastra:</b> informações dos seus alunos (nome, telefone),
          aulas, valores e pagamentos. Esses dados são seus: usamos apenas para o
          funcionamento do app e não os utilizamos para nenhum outro fim.
        </p>

        <h2 style={{ fontSize: '1.05rem' }}>Onde os dados ficam</h2>
        <p>
          Os dados são armazenados no Supabase (banco de dados e autenticação) e o app é
          hospedado na Vercel — ambos processadores que seguem padrões internacionais de
          segurança. Toda a comunicação é criptografada (HTTPS). Cada professor só acessa
          os próprios dados.
        </p>

        <h2 style={{ fontSize: '1.05rem' }}>O que NÃO fazemos</h2>
        <p>
          Não vendemos nem compartilhamos seus dados com terceiros para publicidade.
          Não enviamos mensagens aos seus alunos — as cobranças por WhatsApp são sempre
          revisadas e enviadas por você, do seu próprio aparelho.
        </p>

        <h2 style={{ fontSize: '1.05rem' }}>Seus direitos (LGPD)</h2>
        <p>
          Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer
          momento. O app oferece exportação completa dos dados (Perfil → Exportar meus
          dados) e a exclusão da conta está descrita em{' '}
          <a href="/excluir-conta" style={{ color: 'var(--indigo)' }}>marcaula.vercel.app/excluir-conta</a>.
        </p>

        <h2 style={{ fontSize: '1.05rem' }}>Contato</h2>
        <p>
          Dúvidas sobre privacidade: <b>matheuslbarrionuevo@gmail.com</b>
        </p>

        <a href="/" style={{ color: 'var(--indigo)', fontWeight: 700 }}>← Voltar ao Marcaula</a>
      </div>
    </div>
  )
}
