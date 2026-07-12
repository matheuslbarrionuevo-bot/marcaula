# Ficha da Play Store — Marcaula

_Textos e respostas prontos para colar no Play Console. Assets nas pastas ao lado._

## Identificação
- **Nome do app (30 máx):** `Marcaula: aulas e cobranças`
- **Pacote:** `br.com.marcaula.app`
- **Categoria:** Educação
- **Site:** https://marcaula.vercel.app
- **E-mail de contato:** matheuslbarrionuevo@gmail.com
- **Política de privacidade:** https://marcaula.vercel.app/privacidade

## Descrição curta (80 máx)
```
Agenda de aulas e cobrança pronta pro WhatsApp para o professor particular.
```

## Descrição completa
```
Chega de esquecer de cobrar. Chega de caderninho.

O Marcaula é o jeito mais simples de o professor particular organizar as aulas e receber em dia — feito para quem dá aula de idiomas, música, reforço escolar, exatas e qualquer matéria.

COMO FUNCIONA

📅 AGENDA SEMANAL
Cadastre seus alunos com horário fixo e as aulas aparecem sozinhas na agenda, semana após semana. Aula avulsa? Dois toques e está marcada.

✅ MARCOU, DEU, REGISTROU
Ao fim de cada aula, um toque marca como dada — e o valor já entra na sua conta de "a receber". Aluno faltou? Você decide na hora se cobra ou não, conforme o combinado.

💬 COBRANÇA PRONTA PRO WHATSAPP
O momento constrangedor de cobrar vira um resumo educado e profissional: o Marcaula monta a mensagem com as aulas do período, o total e a sua chave PIX. Você revisa e envia pelo seu próprio WhatsApp — nada é enviado automaticamente.

💰 SEU MÊS EM DINHEIRO
Quanto você recebeu, quanto está em aberto e quem está devendo — tudo numa tela só. Registre os pagamentos com um toque e cada aula fica marcada como paga.

PARA QUEM É
• Professores particulares e autônomos
• Aulas avulsas ou mensalistas (os dois modelos juntos!)
• Quem usa caderno ou planilha e vive esquecendo de cobrar

PREÇO JUSTO
Grátis para sempre com até 5 alunos ativos. Precisa de mais? O plano Pro custa menos que meia aula por mês.

Seus dados ficam seguros na nuvem e sincronizam entre o celular e o computador. Sem anúncios. Sem comissão sobre o que você recebe dos seus alunos — 100% do PIX é seu.

Marcaula — marque, dê e cobre suas aulas. Sem esquecer ninguém.
```

## Assets (pastas ao lado)
| Item | Arquivo | Especificação |
|---|---|---|
| Ícone da ficha | `icon-512.png` | 512×512, quadrado cheio |
| Imagem de destaque | `feature-graphic.png` | 1024×500 |
| Screenshots telefone | `telefone/` (4) | 1080×1920 |
| Screenshots tablet 7"/10" | `tablet/` (4) | 1920×1200 |
| Screenshots Chromebook | `chromebook/` (4) | 1920×1080 |

## Acesso do app (para a revisão do Google)
- **E-mail:** `revisao.play@marcaula.app`
- **Senha:** `RevisaoPlay2026`
- Instrução: "Login com e-mail e senha. A conta já contém alunos e aulas de demonstração. Todos os dados são fictícios."

## Declarações do Play Console
- **Anúncios:** Não contém anúncios
- **Classificação de conteúdo:** questionário → app utilitário/produtividade → Livre
- **Público-alvo:** 18+ (ferramenta profissional; evita o fluxo de apps para crianças)
- **Compras no app:** NÃO declarar compras via Google (a assinatura Pro é vendida apenas no site; dentro do app Android não há oferta de compra)

### Segurança de dados (Data safety)
- **Coleta dados?** Sim
- **Dados coletados:** E-mail e nome (info pessoal, obrigatório, para funcionamento do app — login); Nome e telefone de alunos inseridos pelo usuário (info pessoal, para funcionamento)
- **Compartilha com terceiros?** Não (Supabase/Vercel atuam como processadores)
- **Criptografado em trânsito?** Sim
- **Usuário pode pedir exclusão?** Sim → https://marcaula.vercel.app/excluir-conta

## Teste fechado (conta pessoal — obrigatório)
1. Criar o app no Play Console → Testes → **Teste fechado** → nova faixa.
2. Subir o `app-release.aab` (artefato do GitHub Actions).
3. Adicionar os e-mails dos ~12 testadores (lista de e-mails Google).
4. Distribuir o link de adesão aos testadores.
5. **14 dias corridos** com 12+ testadores ativos → aí libera o botão "Produção".

## Depois do primeiro upload
No Play Console → Testar e lançar → Configuração → **Integridade do app**: copiar o SHA-256 da "Chave de assinatura de apps" e me avisar — eu adiciono ao `assetlinks.json` (hoje ele só tem a chave de upload; com as duas, o app abre em tela cheia garantido).
