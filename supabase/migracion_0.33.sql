-- =====================================================================
-- Pippole 0.33 · Personas (altas de empleados) y primera empresa
-- Ejecutar una vez en Supabase → SQL Editor, DESPUÉS de migracion_0.32.sql.
-- Se puede repetir sin daño.
--
-- - empresas: de momento una sola fila. Deja la base preparada para que
--   Pippole tenga varias empresas sin rehacer nada (ver el documento
--   «Pippole multiempresa · diseño»).
-- - perfiles.empresa_id: a qué empresa pertenece cada usuario.
-- - empleados: la base de personas de la empresa. No son usuarios: no
--   entran en la plataforma, reciben códigos por correo.
-- - Los equipos que había dentro de cada tienda (tiendas.datos.equipo) se
--   copian a empleados. Lo de dentro de la tienda no se borra.
-- =====================================================================

create table if not exists public.empresas (
  id      uuid primary key default gen_random_uuid(),
  slug    text not null unique,
  nombre  text not null,
  marca   jsonb not null default '{}'::jsonb,
  activa  boolean not null default true,
  creado  timestamptz not null default now()
);
-- El nombre se cambia luego desde la plataforma o aquí mismo.
insert into public.empresas (slug, nombre) values ('principal', 'Mi empresa')
  on conflict (slug) do nothing;

alter table public.perfiles add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
update public.perfiles set empresa_id = (select id from public.empresas where slug = 'principal') where empresa_id is null;

-- Empresa del usuario conectado. Mientras solo haya una, si el perfil no
-- tiene empresa se usa la primera.
create or replace function public.mi_empresa() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select empresa_id from public.perfiles where id = auth.uid() and activo),
    (select id from public.empresas order by creado limit 1))
$$;
alter table public.perfiles alter column empresa_id set default public.mi_empresa();

create table if not exists public.empleados (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null default public.mi_empresa() references public.empresas(id) on delete cascade,
  nombre         text not null,
  apellidos      text not null default '',
  correo         text,
  puesto         text not null default '',
  tipologia      text not null default 'tiendas' check (tipologia in ('tiendas', 'oficinas', 'comerciales', 'demostradores')),
  ubicacion      text not null default '',
  tienda_id      uuid references public.tiendas(id) on delete set null,
  departamento   text not null default '',
  responsable_id uuid references public.empleados(id) on delete set null,
  fecha_alta     date,
  fecha_baja     date,
  activo         boolean not null default true,
  creado         timestamptz not null default now(),
  actualizado    timestamptz not null default now()
);
create unique index if not exists empleados_correo on public.empleados (empresa_id, correo) where correo is not null;
create index if not exists empleados_tienda on public.empleados (tienda_id);

create or replace function public.empleados_al_guardar() returns trigger
language plpgsql as $$
begin
  new.correo := nullif(lower(trim(coalesce(new.correo, ''))), '');
  new.nombre := trim(new.nombre);
  new.apellidos := trim(coalesce(new.apellidos, ''));
  new.actualizado := now();
  return new;
end $$;
drop trigger if exists empleados_guardar on public.empleados;
create trigger empleados_guardar before insert or update on public.empleados
  for each row execute function public.empleados_al_guardar();

alter table public.empresas  enable row level security;
alter table public.empleados enable row level security;

drop policy if exists empresas_leer on public.empresas;
drop policy if exists empresas_editar on public.empresas;
create policy empresas_leer   on public.empresas for select to authenticated using (id = public.mi_empresa());
create policy empresas_editar on public.empresas for update to authenticated
  using (id = public.mi_empresa() and public.mi_rol() = 'admin') with check (id = public.mi_empresa() and public.mi_rol() = 'admin');

-- RR.HH. ve y edita toda su empresa. Un Regional Manager solo ve a las
-- personas de sus tiendas y no edita. Marketing no ve a nadie.
drop policy if exists empleados_leer on public.empleados;
drop policy if exists empleados_alta on public.empleados;
drop policy if exists empleados_editar on public.empleados;
drop policy if exists empleados_borrar on public.empleados;
create policy empleados_leer on public.empleados for select to authenticated using (
  empresa_id = public.mi_empresa() and (
    public.mi_rol() = 'admin'
    or (public.mi_rol() = 'rm' and exists (select 1 from public.tiendas t where t.id = tienda_id and t.rm_id = auth.uid()))));
create policy empleados_alta   on public.empleados for insert to authenticated
  with check (empresa_id = public.mi_empresa() and public.mi_rol() = 'admin');
create policy empleados_editar on public.empleados for update to authenticated
  using (empresa_id = public.mi_empresa() and public.mi_rol() = 'admin')
  with check (empresa_id = public.mi_empresa() and public.mi_rol() = 'admin');
create policy empleados_borrar on public.empleados for delete to authenticated
  using (empresa_id = public.mi_empresa() and public.mi_rol() = 'admin');

-- Copia de los equipos de tienda que ya existían (último año cargado).
-- Primera palabra = nombre, el resto = apellidos. No duplica si se repite.
insert into public.empleados (empresa_id, nombre, apellidos, correo, puesto, tipologia, ubicacion, tienda_id)
select (select id from public.empresas where slug = 'principal'),
       split_part(trim(x->>'nombre'), ' ', 1),
       trim(substr(trim(x->>'nombre'), length(split_part(trim(x->>'nombre'), ' ', 1)) + 1)),
       nullif(lower(trim(coalesce(x->>'email', ''))), ''),
       coalesce(x->>'puesto', ''), 'tiendas', t.nombre, t.id
  from public.tiendas t, jsonb_array_elements(coalesce(t.datos->'equipo', '[]'::jsonb)) x
 where t.anio = (select max(anio) from public.tiendas)
   and trim(coalesce(x->>'nombre', '')) <> ''
   and not exists (select 1 from public.empleados e
                    where e.tienda_id = t.id
                      and lower(trim(e.nombre || ' ' || e.apellidos)) = lower(trim(x->>'nombre')))
on conflict do nothing;
