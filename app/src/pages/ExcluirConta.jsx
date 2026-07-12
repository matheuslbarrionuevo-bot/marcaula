// Página pública (acessível sem login) — exigida pela Google Play.
export default function ExcluirConta() {
  return (
    <div className="tela" style={{ paddingBottom: 40, maxWidth: 640 }}>
      <div className="topo">
        <h1>Excluir minha conta</h1>
      </div>
      <div style={{ display: 'grid', gap: 14, fontSize: '0.95rem', lineHeight: 1.6 }}>
        <p>
          Para excluir sua conta do <b>Marcaula</b> e todos os dados associados
          (perfil, alunos, aulas e pagamentos registrados):
        </p>

        <ol style={{ paddingLeft: 20, display: 'grid', gap: 8 }}>
          <li>
            Se tiver assinatura Pro ativa, cancele-a primeiro no aplicativo do
            Mercado Pago (Assinaturas → Marcaula Pro → Cancelar).
          </li>
          <li>
            Envie um e-mail para <b>matheuslbarrionuevo@gmail.com</b> com o assunto
            <b> “Excluir conta Marcaula”</b>, a partir do mesmo e-mail cadastrado no app.
          </li>
          <li>
            Confirmaremos a exclusão em até <b>7 dias</b>. A remoção é permanente e
            inclui todos os dados: conta, alunos, aulas e histórico de pagamentos.
          </li>
        </ol>

        <p>
          Dica: antes de excluir, você pode baixar uma cópia de tudo em
          <b> Perfil → Exportar meus dados</b>.
        </p>

        <a href="/" style={{ color: 'var(--indigo)', fontWeight: 700 }}>← Voltar ao Marcaula</a>
      </div>
    </div>
  )
}
