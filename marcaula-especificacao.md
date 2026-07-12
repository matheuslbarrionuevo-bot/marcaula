# Marcaula — Especificação do Produto e do MVP

_v1.0 · 12/07/2026 · documento vivo: atualizar conforme decisões._

> **Uma frase:** O jeito mais simples de o professor particular nunca mais esquecer de cobrar — agenda + PIX + cobrança pronta no WhatsApp.

---

## 1. Conhecimento consolidado (relatório da pesquisa)

### 1.1 O mercado
- Mercado maduro no exterior: **TutorBird** (US$ 14,95/mês), **My Music Staff** (US$ 14,95–19,95), **Fons** (~US$ 19,95), **Teachworks** (US$ 175 — centros). Todos cobram **assinatura fixa por professor, alunos ilimitados**.
- No Brasil, concorrente direto: **Classr** (R$ 32/mês) — agenda + financeiro + WhatsApp nativo + resumos IA + página profissional. Secundários: **iProfe** (R$ 29,90, controla pagamentos mas **não cobra**), **Proffin** (R$ 28, forte em relatório financeiro, fraco em agenda/WhatsApp).
- Lacunas exploráveis: (a) cobrança **PIX + WhatsApp** excelente; (b) **casar pagamento ↔ aula específica** (reclamação real do TutorBird: "faturas são extratos"); (c) **mobile-first de verdade** (TutorBird não tem app); (d) onboarding em 5 min.

### 1.2 As dores (o porquê)
1. **Esquecer de cobrar** → perda direta de receita. Dor nº 1.
2. **Vergonha de cobrar** → o app apresenta o número objetivo e o texto pronto; a cobrança deixa de ser "conversa chata" e vira "resumo do mês".
3. **Aluno que falta: cobro ou não?** → política de falta explícita por aluno.
4. **Correr atrás de pagamento** → pendências visíveis por aluno.
5. **Caderno/planilha** → substituição completa.
6. **Misturar conta pessoal com a das aulas** → extrato separado do "negócio aulas".

### 1.3 Decisões tomadas
| Decisão | Valor |
|---|---|
| Nome | **Marcaula** (verificado livre; trocadilho marca/marcar aula) |
| Plataforma | **Web PWA mobile-first** (mesmo pipeline do Parcere: Vercel + TWA na Play depois) |
| Preço | **R$ 14,90/mês** (menos da metade do Classr) · freemium grátis até **5 alunos** · anual ~R$ 149 (2 meses grátis) · sem comissão · sem limite de alunos no pago |
| Estratégia | Concorrer com o Classr por **preço + simplicidade + cobrança-WhatsApp superior** |
| Modos de cobrança | **Os dois**: mensalista (fecha o período) **e** avulso (por aula) |
| Diferencial matador | A **mensagem de cobrança**: quebra por aula, PIX copia-e-cola, tom gentil, editável |
| Envio WhatsApp | Link `wa.me` com texto pronto (o professor envia) — **nunca** automação não-oficial (risco de banimento) |

---

## 2. Persona e princípios

**Persona:** professor(a) particular autônomo — idiomas, música, reforço, exatas. 5–40 alunos. Gerencia tudo pelo celular, entre uma aula e outra. Não-técnico. Hoje usa caderno, planilha ou memória. Sensível a preço. WhatsApp é o canal universal com o aluno/responsável.

**Princípios de design (inegociáveis):**
1. **Mobile-first.** Tudo utilizável com o polegar. Desktop é bônus.
2. **A tela-mãe é a semana.** Abriu o app → vê a semana com as aulas, verde (paga) / âmbar (pendente).
3. **Presença alimenta o financeiro.** Marcar "aula dada" no calendário gera o valor a receber automaticamente. Zero redigitação.
4. **Um toque para pagar.** "Marcar como pago" é um botão, não um formulário.
5. **A cobrança é o clímax.** O botão "Cobrar no WhatsApp" é o momento pelo qual o professor paga a assinatura. Tem de ser perfeito.
6. **Onboarding < 5 min.** Nome + chave PIX + primeiro aluno + primeira aula. Sem cartão, sem e-mail de confirmação no início.
7. **Menos é mais.** Se uma feature não serve o ciclo *agendar → dar aula → cobrar → receber*, ela não entra no MVP.

---

## 3. Modelo de dados

Camada de dados em `src/lib/api.js` — **localStorage na Fase 1**, trocável por Supabase na Fase 2 sem mexer nas telas (padrão que funcionou no Parcere).

### professor (config, singleton)
```
{ nome, chavePix, tipoChavePix: 'cpf'|'celular'|'email'|'aleatoria',
  valorAulaPadrao, duracaoPadraoMin: 60, assinatura: 'free'|'pro' }
```

### alunos
```
{ id, nome, telefone,            // com DDD; vira wa.me/55{telefone}
  modalidade: 'mensalista'|'avulso',
  valorMensal,                    // se mensalista
  valorAula,                      // se avulso (e p/ aula extra de mensalista)
  diaVencimento,                  // mensalista: dia do mês p/ cobrar (default 5)
  cobrarFalta: true|false,        // política de falta (default true = falta avisada <24h cobra)
  recorrencia: [ { diaSemana: 0-6, hora: 'HH:MM', duracaoMin } ],
  observacoes, ativo, criadoEm }
```

### aulas
```
{ id, alunoId,
  dataHora,                       // ISO local
  duracaoMin,
  status: 'agendada'|'dada'|'falta'|'cancelada',
  cobrarFalta: bool,              // editável na hora de marcar falta
  valor,                          // snapshot do valor no momento (avulso); 0 para mensalista
  pagamentoId: null|id,           // avulso: casa pagamento ↔ aula (diferencial!)
  origem: 'recorrente'|'avulsa',
  obs }
```

### pagamentos
```
{ id, alunoId, valor, data,
  forma: 'pix'|'dinheiro'|'outro',
  tipo: 'mensalidade'|'aulas',
  periodo: 'AAAA-MM',             // se mensalidade
  aulasIds: [],                   // se aulas avulsas — casamento explícito
  obs }
```

### Regras de negócio
**Recorrência →** ao abrir o app, materializar aulas `recorrente` da semana atual + 3 semanas à frente (idempotente: não duplicar; não sobrescrever aula editada).

**Avulso:** cada aula `dada` (ou `falta` com `cobrarFalta=true`) gera valor a receber. Pendente = aulas cobráveis sem `pagamentoId`. Pagamento seleciona quais aulas quita.

**Mensalista:** o a receber é `valorMensal` por mês civil. Pago quando existe pagamento `tipo:'mensalidade'` daquele `periodo`. As aulas continuam registrando presença (entram na mensagem como prestação de contas). Aula extra fora da recorrência pode ser marcada "extra" e cobrada à parte (valorAula).

**Falta:** ao marcar falta, o app pergunta "Cobrar esta aula?" com default da política do aluno. Decisão fica registrada — mata a dor do "cobro ou não?".

---

## 4. A mensagem de cobrança (feature matadora)

Gerador em `src/lib/cobranca.js`. Sempre **editável** antes de enviar. Abre `https://wa.me/55{telefone}?text={encodeURIComponent(msg)}`.

**Avulso (aulas do período selecionado):**
```
Oi, {primeiroNome}! Tudo bem? 😊

Segue o resumo das suas aulas de {mês}:

📚 3 aulas:
• seg 07/07 às 19:00 ✅
• seg 14/07 às 19:00 ✅
• seg 21/07 às 19:00 ✅ (falta avisada — combinado cobrar)

💰 Total: R$ 180,00

Pode fazer o Pix para a chave abaixo 👇
{chavePix}

Qualquer dúvida me chama! Obrigado(a) 🙏
```

**Mensalista:**
```
Oi, {primeiroNome}! Tudo bem? 😊

Passando o lembrete da mensalidade de {mês}: R$ {valorMensal}.

Nesse mês tivemos:
📚 4 aulas: 07, 14, 21 e 28/07 ✅

Pix: {chavePix}

Qualquer dúvida me chama! Obrigado(a) 🙏
```

Detalhes que importam: primeira pessoa e tom gentil (reduz a vergonha); a lista de aulas é **prestação de contas**, não confronto; chave PIX em linha própria (fácil copiar); emojis com parcimônia; texto 100% editável no preview.

---

## 5. Telas do MVP

Navegação: **bottom nav** com 4 abas — `Agenda · Alunos · Cobranças · Perfil`.

1. **Onboarding** (primeira abertura): nome → chave PIX → valor padrão da aula → "Cadastre seu primeiro aluno". 4 passos, pulável.
2. **Agenda (home):** semana em lista vertical por dia (não grade horária — melhor no celular). Cada aula = card: hora, aluno, status. Toque → ação rápida: ✅ Dada · ❌ Falta (pergunta se cobra) · 🗑 Cancelar · ✏️ Editar. Swipe de semana (‹ ›). FAB "+ Aula".
3. **Alunos:** lista com foto/inicial, nome, modalidade, **badge de pendência** (R$ em aberto). FAB "+ Aluno".
4. **Aluno (detalhe):** cabeçalho com pendência em destaque + botão verde **"Cobrar no WhatsApp"**; abas internas: Aulas (histórico + próximas) · Pagamentos · Dados (recorrência, valores, política de falta).
5. **Cobranças (a central do dinheiro):** mês atual — total a receber, recebido, pendente; lista de alunos com pendência, cada um com botão "Cobrar"; histórico de pagamentos. É a tela que responde "quanto ganhei / quem me deve".
6. **Preview da cobrança:** textarea com a mensagem gerada (editável) + botões "Abrir WhatsApp" e "Copiar". Ao enviar, marca as aulas como "cobradas" (para saber o que já foi cobrado ≠ pago).
7. **Registrar pagamento:** do aluno ou da cobrança — valor pré-preenchido, forma (PIX/dinheiro), avulso: checklist de quais aulas quita; mensalista: mês de referência. 2 toques no caminho feliz.
8. **Perfil:** dados do professor, chave PIX, valores padrão, plano (free/pro — visual apenas na Fase 1), exportar dados (JSON).

**Identidade visual:** tema claro, base **índigo (#4F46E5)** para marca/navegação; **verde WhatsApp (#25D366)** exclusivo do botão Cobrar (associação imediata); âmbar para pendências, verde-escuro para pago. Fonte system-ui. Cantos arredondados, cards com sombra leve — mesmo vocabulário do Parcere.

---

## 6. Stack e arquitetura

| Camada | Escolha | Motivo |
|---|---|---|
| Frontend | **React + Vite, JS puro** (sem TS) | Mesmo padrão do Parcere — pipeline conhecido |
| Rotas | react-router-dom | idem |
| PWA | vite-plugin-pwa | instalável, offline |
| Dados Fase 1 | localStorage via `lib/api.js` | zero backend, MVP rápido; API assíncrona desde já p/ troca limpa |
| Dados Fase 2 | Supabase (auth + Postgres) | multi-dispositivo, contas |
| Deploy | Vercel (repo GitHub privado) | auto-deploy no push |
| Android | TWA via Bubblewrap + GitHub Actions | pipeline do Parcere pronto p/ copiar |
| Pagamento da assinatura (Fase 3) | Stripe ou Mercado Pago assinaturas | decidir depois |

Estrutura: `app/` na subpasta (padrão Parcere), `src/lib/api.js` (dados), `src/lib/cobranca.js` (mensagens), `src/lib/datas.js` (datas), `src/pages/`, `src/components/`.

## 7. Fases

- **Fase 0 — Spec** ✅ (este documento)
- **Fase 1 — MVP local:** tudo da seção 5, dados no aparelho. Critério de pronto: ciclo completo *aluno → aula recorrente → marcar dada → cobrar no WhatsApp (mensagem real) → registrar pagamento → pendência zera*, sem erro de console, instalável como PWA.
- **Fase 2 — Contas + Supabase:** login, sync multi-dispositivo, migração dos dados locais.
- **Fase 3 — Monetização:** paywall free (5 alunos) → Pro R$ 14,90, assinatura via Stripe/MP, página de vendas.
- **Fase 4 — Play Store:** TWA, ficha, screenshots (reusar geradores do Parcere).
- **Fase 5 — Diferenciais:** lembretes automáticos, pacotes de aulas, recibo PDF, relatórios/previsão, Google Agenda, PIX copia-e-cola com QR.

## 8. Fora do escopo do MVP (anotado para não esquecer)
Portal do aluno · envio automático de mensagens · multiprofessor · grupos/turmas · IA · página profissional pública · emissão fiscal.
