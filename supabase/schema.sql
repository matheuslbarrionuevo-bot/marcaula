-- ============================================================
-- MARCAULA — Schema Fase 2 (Supabase)
-- Rodar UMA vez no SQL Editor do projeto pyfpumfellhgwxluwclu.
-- ids em text (gerados no cliente) para migração 1:1 do localStorage.
-- Colunas em camelCase (entre aspas) para espelhar o código JS.
-- ============================================================

-- --------------------- professores --------------------------
create table if not exists public.professores (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  "chavePix" text not null default '',
  "valorAulaPadrao" numeric not null default 0,
  "duracaoPadraoMin" int not null default 60,
  assinatura text not null default 'free' check (assinatura in ('free', 'pro')),
  "criadoEm" timestamptz not null default now()
);

alter table public.professores enable row level security;

create policy "professor le o proprio perfil"
  on public.professores for select using (id = auth.uid());
create policy "professor cria o proprio perfil"
  on public.professores for insert with check (id = auth.uid());
create policy "professor edita o proprio perfil"
  on public.professores for update using (id = auth.uid());

-- ------------------------ alunos ----------------------------
create table if not exists public.alunos (
  id text primary key,
  "professorId" uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  telefone text not null default '',
  modalidade text not null default 'avulso' check (modalidade in ('avulso', 'mensalista')),
  "valorAula" numeric not null default 0,
  "valorMensal" numeric not null default 0,
  "diaVencimento" int not null default 5,
  "cobrarFalta" boolean not null default true,
  recorrencia jsonb not null default '[]',
  observacoes text not null default '',
  ativo boolean not null default true,
  "criadoEm" text not null default ''
);

alter table public.alunos enable row level security;

create policy "professor gerencia os proprios alunos"
  on public.alunos for all
  using ("professorId" = auth.uid())
  with check ("professorId" = auth.uid());

create index if not exists alunos_professor_idx on public.alunos ("professorId");

-- ---------------------- pagamentos --------------------------
-- (antes de aulas por causa da FK aulas.pagamentoId)
create table if not exists public.pagamentos (
  id text primary key,
  "professorId" uuid not null default auth.uid() references auth.users (id) on delete cascade,
  "alunoId" text not null references public.alunos (id) on delete cascade,
  valor numeric not null default 0,
  forma text not null default 'pix' check (forma in ('pix', 'dinheiro', 'outro')),
  tipo text not null default 'aulas' check (tipo in ('aulas', 'mensalidade')),
  periodo text,
  "aulasIds" jsonb not null default '[]',
  obs text not null default '',
  data text not null default ''
);

alter table public.pagamentos enable row level security;

create policy "professor gerencia os proprios pagamentos"
  on public.pagamentos for all
  using ("professorId" = auth.uid())
  with check ("professorId" = auth.uid());

create index if not exists pagamentos_professor_data_idx on public.pagamentos ("professorId", data);

-- ------------------------- aulas ----------------------------
create table if not exists public.aulas (
  id text primary key,
  "professorId" uuid not null default auth.uid() references auth.users (id) on delete cascade,
  "alunoId" text not null references public.alunos (id) on delete cascade,
  "dataHora" text not null,           -- 'AAAA-MM-DDTHH:MM' hora local (ordena lexicograficamente)
  "duracaoMin" int not null default 60,
  status text not null default 'agendada' check (status in ('agendada', 'dada', 'falta', 'cancelada')),
  "cobrarFalta" boolean not null default true,
  valor numeric not null default 0,
  "pagamentoId" text references public.pagamentos (id) on delete set null,
  "cobradaEm" text,
  origem text not null default 'avulsa' check (origem in ('avulsa', 'recorrente')),
  extra boolean not null default false,
  obs text not null default ''
);

alter table public.aulas enable row level security;

create policy "professor gerencia as proprias aulas"
  on public.aulas for all
  using ("professorId" = auth.uid())
  with check ("professorId" = auth.uid());

create index if not exists aulas_professor_data_idx on public.aulas ("professorId", "dataHora");
create index if not exists aulas_aluno_idx on public.aulas ("alunoId");
