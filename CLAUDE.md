# Marcaula

App da **Monte Cristo** (mesma empresa do Parcere, contabilidade única — mas projeto, repo e banco 100% separados). Documentos centrais da empresa (plano de negócios, caixa de ideias): `C:\Users\Matheus Barrionuevo\Documents\Monte Cristo`.

**O que é:** agenda + cobrança para professores particulares. Pilares: (1) grade de aulas com horários e recorrência; (2) confirmação de pagamentos casada com aulas específicas; (3) mensagem de cobrança pronta para WhatsApp (via link `wa.me` — **nunca** automação não-oficial, risco de banimento).

**Posicionamento:** rival direto do Classr (R$ 32/mês), competindo por preço + simplicidade + cobrança superior. Preço-alvo: **R$ 14,90/mês**, freemium grátis até 5 alunos, sem comissão, sem limite de alunos no pago. Dor central: professor esquece de cobrar, tem vergonha de cobrar, mistura conta pessoal.

A especificação completa (pesquisa de mercado, modelo de dados, regras, telas, fases) está em `marcaula-especificacao.md` — leia antes de mudanças de produto.

## Stack e estrutura

- React + Vite (**JS puro, sem TS**), react-router-dom, vite-plugin-pwa. Mesmo padrão do Parcere.
- App em `app/`. Porta dev: **5175** (`npm run dev` dentro de `app/`; config "marcaula" no `.claude/launch.json`).
- `app/src/lib/api.js` — camada de dados (localStorage na Fase 1, **todas as funções já são async** para virar Supabase na Fase 2 sem mexer nas telas).
- `app/src/lib/cobranca.js` — gerador das mensagens de cobrança (avulso e mensalista) + `linkWhatsApp()`. É a feature matadora: mudanças aqui pedem cuidado com tom (gentil, prestação de contas) e concordância singular/plural.
- `app/src/lib/datas.js` — datas locais pt-BR; semana começa na segunda; `toISOLocal` sem timezone (single-device na Fase 1).
- `app/src/pages/` — Onboarding, Agenda (home), NovaAula, Alunos, AlunoForm, Aluno, Cobrancas, Cobrar, Pagar, Perfil.

## Regras de negócio essenciais

- **Avulso:** aula `dada` (ou `falta` com `cobrarFalta`) gera valor a receber; pagamento seleciona quais aulas quita (`aula.pagamentoId`).
- **Mensalista:** a receber = `valorMensal` por mês civil (pago quando existe pagamento `tipo:'mensalidade'` do `periodo`); aulas registram presença e entram na mensagem como prestação de contas; aula `extra` é cobrada à parte.
- **Recorrência:** `materializarRecorrentes()` roda no boot do App — cria aulas da semana atual + 3 à frente, idempotente por `alunoId|dataHora`, nunca no passado; aula cancelada mantém o registro para não ser recriada.
- Onboarding conclui com `window.location.href` (reload proposital — SPA nav voltava ao guard antes do estado atualizar; não "otimizar" isso sem resolver o guard).

## Processo

- **QA após cada mudança:** varrer console/erros e testar o ciclo aluno → aula → dada → cobrar → pagar (preferência do usuário, herdada do Parcere).
- Responder em português do Brasil.
- Fases: 1=MVP local ✅ · 2=Supabase ✅ (projeto `pyfpumfellhgwxluwclu`, chave `sb_publishable_` em `app/.env.local`, schema em `supabase/schema.sql` com colunas camelCase entre aspas e ids text gerados no cliente; RLS por professor; confirmação de e-mail DESLIGADA; conta de teste qa.marcaula@teste.com/senha123qa) · 3=paywall R$ 14,90 · 4=Vercel + TWA na Play (`br.com.marcaula.app`; copiar pipeline do Parcere) · 5=lembretes, pacotes, recibos, Google Agenda.
- Fase 2 — como funciona: login obrigatório (`AuthContext` + tela `Login.jsx`); `api.js` fala com o Supabase mantendo as MESMAS assinaturas da Fase 1; `migrarDadosLocais()` roda no login e importa localStorage se a nuvem estiver vazia (flag `mc_migrado`); `materializarRecorrentes()` roda no boot E ao salvar aluno com recorrência (AlunoForm); `resumoMes` usa 4 consultas em lote, não N por aluno; `excluirPagamento` confia no FK `ON DELETE SET NULL` para soltar as aulas.
