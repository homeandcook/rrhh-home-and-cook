-- =====================================================================
-- Migración a la versión 0.14.0
-- Pégalo entero en el SQL Editor de Supabase y pulsa Run.
-- Se puede ejecutar varias veces sin perder datos.
-- Requiere haber ejecutado antes migracion_0.11.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Process Book y Política de RR.HH. editables desde la plataforma
-- Una fila por libro ("process" o "politica"). Si no hay fila, la
-- aplicación enseña el contenido base que lleva incorporado. Lo lee
-- cualquier usuario con perfil; solo RR.HH. lo escribe.
-- ---------------------------------------------------------------------
create table if not exists public.documentos (
  clave           text primary key check (clave in ('process', 'politica')),
  cuerpo          jsonb not null default '{}'::jsonb,
  actualizado     timestamptz not null default now(),
  actualizado_por uuid references public.perfiles(id) on delete set null
);

create or replace function public.documentos_al_actualizar() returns trigger
language plpgsql as $$
begin
  new.actualizado := now();
  new.actualizado_por := auth.uid();
  return new;
end $$;
drop trigger if exists documentos_fecha on public.documentos;
create trigger documentos_fecha before insert or update on public.documentos
  for each row execute function public.documentos_al_actualizar();

alter table public.documentos enable row level security;
drop policy if exists documentos_leer on public.documentos;
drop policy if exists documentos_escribir on public.documentos;
drop policy if exists documentos_editar on public.documentos;
drop policy if exists documentos_borrar on public.documentos;
create policy documentos_leer     on public.documentos for select to authenticated using (public.mi_rol() in ('admin', 'rm'));
create policy documentos_escribir on public.documentos for insert to authenticated with check (public.mi_rol() = 'admin');
create policy documentos_editar   on public.documentos for update to authenticated using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
create policy documentos_borrar   on public.documentos for delete to authenticated using (public.mi_rol() = 'admin');

grant select, insert, update, delete on public.documentos to authenticated;
revoke all on public.documentos from anon;

-- ---------------------------------------------------------------------
-- PRL y People Data Centre no necesitan tablas nuevas: viven dentro de
-- "datos" de cada tienda (datos.prl y datos.kpis) y heredan sus reglas.
-- La función red_kpis sigue devolviendo solo datos->'kpis', así que
-- Retail Marketing no ve nada de PRL.
-- ---------------------------------------------------------------------
