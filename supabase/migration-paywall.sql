-- ============================================================
-- MARCAULA — Migração Fase 3 (paywall)
-- Rodar UMA vez no SQL Editor (depois do schema.sql).
-- 1) Plano free: máximo 5 alunos ATIVOS (regra no banco, não só na UI)
-- 2) Cliente não pode alterar a própria assinatura (só o servidor,
--    via chave secreta, quando o Mercado Pago confirmar o pagamento)
-- ============================================================

-- Identifica se a requisição veio de um cliente do app
-- (anon/authenticated) ou do servidor (service role / SQL direto).
create or replace function public.requisicao_de_cliente()
returns boolean
language sql stable
as $$
  select coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '')
         in ('anon', 'authenticated')
$$;

-- ---------- 1) limite de alunos no plano free ----------
create or replace function public.limita_alunos_free()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  plano text;
  qtd int;
begin
  -- só interessa entrada de aluno ativo novo ou reativação
  if tg_op = 'UPDATE' and (old.ativo = true or new.ativo = false) then
    return new;
  end if;
  if tg_op = 'INSERT' and new.ativo = false then
    return new;
  end if;

  select assinatura into plano from public.professores where id = new."professorId";
  if coalesce(plano, 'free') = 'free' then
    select count(*) into qtd
      from public.alunos
     where "professorId" = new."professorId" and ativo = true;
    if qtd >= 5 then
      raise exception 'LIMITE_FREE';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists alunos_limite_free on public.alunos;
create trigger alunos_limite_free
  before insert or update of ativo on public.alunos
  for each row execute function public.limita_alunos_free();

-- ---------- 2) proteção da coluna assinatura ----------
create or replace function public.protege_assinatura()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if public.requisicao_de_cliente() then
      new.assinatura := 'free';
    end if;
    return new;
  end if;
  if new.assinatura is distinct from old.assinatura
     and public.requisicao_de_cliente() then
    new.assinatura := old.assinatura; -- ignora tentativa do cliente
  end if;
  return new;
end
$$;

drop trigger if exists professores_protege_assinatura on public.professores;
create trigger professores_protege_assinatura
  before insert or update on public.professores
  for each row execute function public.protege_assinatura();
