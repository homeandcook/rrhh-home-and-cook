-- =====================================================================
-- Pippole 0.36 · Employer Branding: sitios de Google cuyas reseñas se leen
-- Ejecutar una vez en Supabase → SQL Editor. Se puede repetir sin daño.
--
-- Solo se guarda el identificador del sitio en Google (place_id), que las
-- condiciones de Google permiten guardar. Las reseñas no se guardan: se
-- consultan en vivo con la función «resenas».
-- =====================================================================
create table if not exists public.resenas_sitios (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.mi_empresa() references public.empresas(id) on delete cascade,
  nombre     text not null,
  tipo       text not null default 'tienda' check (tipo in ('tienda', 'oficina', 'otro')),
  tienda_id  uuid references public.tiendas(id) on delete set null,
  place_id   text not null,
  direccion  text not null default '',
  creado     timestamptz not null default now()
);
create unique index if not exists resenas_sitios_place on public.resenas_sitios (empresa_id, place_id);

alter table public.resenas_sitios enable row level security;
drop policy if exists resenas_sitios_admin on public.resenas_sitios;
create policy resenas_sitios_admin on public.resenas_sitios for all to authenticated
  using (empresa_id = public.mi_empresa() and public.mi_rol() = 'admin')
  with check (empresa_id = public.mi_empresa() and public.mi_rol() = 'admin');
