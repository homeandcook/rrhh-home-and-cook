-- =====================================================================
-- Scorecard Retail: esquema para Supabase
-- Ejecutar completo en Supabase > SQL Editor > New query > Run.
-- Se puede volver a ejecutar sin perder datos.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Usuarios de la plataforma (1 fila por usuario de Supabase Auth)
create table if not exists public.perfiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  usuario   text not null unique,
  nombre    text not null,
  rol       text not null check (rol in ('admin', 'rm')),
  zona      text,
  activo    boolean not null default true,
  creado    timestamptz not null default now()
);

-- Tiendas: una fila por tienda y año. "datos" guarda objetivos, resultados,
-- equipo y evaluaciones con el mismo formato que usa la aplicación.
create table if not exists public.tiendas (
  id              uuid primary key default gen_random_uuid(),
  anio            int  not null,
  nombre          text not null default '',
  codigo          text not null default '',
  rm_id           uuid references public.perfiles(id) on delete set null,
  datos           jsonb not null default '{}'::jsonb,
  version         int  not null default 1,
  actualizado     timestamptz not null default now(),
  actualizado_por uuid references public.perfiles(id) on delete set null
);
create index if not exists tiendas_anio_rm on public.tiendas (anio, rm_id);

-- Registro de actividad (validaciones, cierres, reaperturas, altas y bajas)
create table if not exists public.actividad (
  id         bigint generated always as identity primary key,
  fecha      timestamptz not null default now(),
  usuario_id uuid default auth.uid() references public.perfiles(id) on delete set null,
  tienda_id  uuid references public.tiendas(id) on delete set null,
  accion     text not null
);

-- Rol del usuario conectado (null si no tiene perfil o está desactivado)
create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where id = auth.uid() and activo
$$;

-- Cada guardado sube la versión: si dos personas editan la misma tienda
-- a la vez, la segunda recibe un aviso en lugar de pisar los cambios.
create or replace function public.tiendas_al_actualizar() returns trigger
language plpgsql as $$
begin
  new.version := old.version + 1;
  new.actualizado := now();
  new.actualizado_por := auth.uid();
  if public.mi_rol() = 'rm' then
    new.anio := old.anio;      -- un RM no puede mover tiendas de año
    new.rm_id := old.rm_id;    -- ni reasignarlas
  end if;
  return new;
end $$;
drop trigger if exists tiendas_version on public.tiendas;
create trigger tiendas_version before update on public.tiendas
  for each row execute function public.tiendas_al_actualizar();

-- Seguridad por filas
alter table public.perfiles  enable row level security;
alter table public.tiendas   enable row level security;
alter table public.actividad enable row level security;

drop policy if exists perfiles_leer on public.perfiles;
drop policy if exists perfiles_alta on public.perfiles;
drop policy if exists perfiles_editar on public.perfiles;
drop policy if exists perfiles_borrar on public.perfiles;
create policy perfiles_leer   on public.perfiles for select to authenticated using (id = auth.uid() or public.mi_rol() = 'admin');
create policy perfiles_alta   on public.perfiles for insert to authenticated with check (public.mi_rol() = 'admin');
create policy perfiles_editar on public.perfiles for update to authenticated using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
create policy perfiles_borrar on public.perfiles for delete to authenticated using (public.mi_rol() = 'admin' and id <> auth.uid());

drop policy if exists tiendas_leer on public.tiendas;
drop policy if exists tiendas_editar on public.tiendas;
drop policy if exists tiendas_alta on public.tiendas;
drop policy if exists tiendas_borrar on public.tiendas;
create policy tiendas_leer   on public.tiendas for select to authenticated
  using (public.mi_rol() = 'admin' or (public.mi_rol() = 'rm' and rm_id = auth.uid()));
create policy tiendas_editar on public.tiendas for update to authenticated
  using (public.mi_rol() = 'admin' or (public.mi_rol() = 'rm' and rm_id = auth.uid()))
  with check (public.mi_rol() = 'admin' or (public.mi_rol() = 'rm' and rm_id = auth.uid()));
create policy tiendas_alta   on public.tiendas for insert to authenticated with check (public.mi_rol() = 'admin');
create policy tiendas_borrar on public.tiendas for delete to authenticated using (public.mi_rol() = 'admin');

drop policy if exists actividad_leer on public.actividad;
drop policy if exists actividad_alta on public.actividad;
create policy actividad_leer on public.actividad for select to authenticated
  using (public.mi_rol() = 'admin' or usuario_id = auth.uid());
create policy actividad_alta on public.actividad for insert to authenticated
  with check (usuario_id = auth.uid() and public.mi_rol() is not null);

grant select, insert, update, delete on public.perfiles, public.tiendas to authenticated;
grant select, insert on public.actividad to authenticated;
revoke all on public.perfiles, public.tiendas, public.actividad from anon;

-- El administrador puede poner una contraseña nueva a cualquier usuario
create or replace function public.admin_cambiar_password(p_usuario uuid, p_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.mi_rol() is distinct from 'admin' then
    raise exception 'Solo un administrador puede cambiar contraseñas de otros usuarios';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'La contraseña debe tener al menos 8 caracteres';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_usuario;
  if not found then raise exception 'Usuario no encontrado'; end if;
end $$;
revoke all on function public.admin_cambiar_password(uuid, text) from public, anon;
grant execute on function public.admin_cambiar_password(uuid, text) to authenticated;

-- =====================================================================
-- Pruebas e invitaciones: Psicotécnicos, Mystery Shopper y Clima
-- =====================================================================
create table if not exists public.campanas (
  id         uuid primary key default gen_random_uuid(),
  anio       int  not null,
  tipo       text not null check (tipo in ('psico', 'mystery', 'clima')),
  plantilla  text not null,
  titulo     text not null,
  estado     text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  creado     timestamptz not null default now(),
  creado_por uuid references public.perfiles(id) on delete set null
);
create table if not exists public.invitaciones (
  id           uuid primary key default gen_random_uuid(),
  campana_id   uuid not null references public.campanas(id) on delete cascade,
  tienda_id    uuid references public.tiendas(id) on delete set null,
  destinatario text,                       -- null en las campañas anónimas
  codigo       text not null unique,
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'abierta', 'respondida')),
  respuestas   jsonb not null default '{}'::jsonb,
  abierto      timestamptz,
  respondido   timestamptz,
  creado       timestamptz not null default now()
);
create index if not exists invitaciones_campana on public.invitaciones (campana_id);

alter table public.campanas     enable row level security;
alter table public.invitaciones enable row level security;

drop policy if exists campanas_leer on public.campanas;
drop policy if exists campanas_admin on public.campanas;
create policy campanas_leer  on public.campanas for select to authenticated using (public.mi_rol() is not null);
create policy campanas_admin on public.campanas for all to authenticated
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

-- Un RM ve y crea códigos solo de sus tiendas; el admin, de todas.
drop policy if exists invitaciones_leer on public.invitaciones;
drop policy if exists invitaciones_alta on public.invitaciones;
drop policy if exists invitaciones_borrar on public.invitaciones;
create policy invitaciones_leer on public.invitaciones for select to authenticated using (
  public.mi_rol() = 'admin' or exists (select 1 from public.tiendas t where t.id = tienda_id and t.rm_id = auth.uid()));
create policy invitaciones_alta on public.invitaciones for insert to authenticated with check (
  public.mi_rol() = 'admin' or exists (select 1 from public.tiendas t where t.id = tienda_id and t.rm_id = auth.uid()));
create policy invitaciones_borrar on public.invitaciones for delete to authenticated using (public.mi_rol() = 'admin');

grant select, insert, update, delete on public.campanas to authenticated;
grant select, insert, delete on public.invitaciones to authenticated;
revoke all on public.campanas, public.invitaciones from anon;

-- Acceso de invitado: solo a través de estas dos funciones, nunca a las tablas.
create or replace function public.invitacion_abrir(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_i public.invitaciones; v_c public.campanas; v_t text;
begin
  select * into v_i from public.invitaciones where codigo = upper(trim(p_codigo));
  if not found then return null; end if;
  select * into v_c from public.campanas where id = v_i.campana_id;
  select nombre into v_t from public.tiendas where id = v_i.tienda_id;
  if v_i.estado = 'pendiente' and v_c.estado = 'abierta' then
    update public.invitaciones set estado = 'abierta', abierto = now() where id = v_i.id;
    v_i.estado := 'abierta';
  end if;
  return jsonb_build_object(
    'titulo', v_c.titulo, 'plantilla', v_c.plantilla, 'tipo', v_c.tipo,
    'campana_estado', v_c.estado, 'estado', v_i.estado,
    'destinatario', v_i.destinatario, 'tienda', v_t,
    'respuestas', case when v_i.estado = 'respondida' then '{}'::jsonb else v_i.respuestas end);
end $$;

create or replace function public.invitacion_responder(p_codigo text, p_respuestas jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_i public.invitaciones; v_c public.campanas;
begin
  select * into v_i from public.invitaciones where codigo = upper(trim(p_codigo));
  if not found then raise exception 'Código no encontrado'; end if;
  select * into v_c from public.campanas where id = v_i.campana_id;
  if v_c.estado <> 'abierta' then raise exception 'La campaña está cerrada'; end if;
  if v_i.estado = 'respondida' then raise exception 'Este código ya se ha utilizado'; end if;
  if jsonb_typeof(p_respuestas) <> 'object' then raise exception 'Respuestas no válidas'; end if;
  if length(p_respuestas::text) > 20000 then raise exception 'Respuestas demasiado largas'; end if;
  update public.invitaciones
     set respuestas = p_respuestas, estado = 'respondida', respondido = now()
   where id = v_i.id;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.invitacion_abrir(text), public.invitacion_responder(text, jsonb) from public;
grant execute on function public.invitacion_abrir(text) to anon, authenticated;
grant execute on function public.invitacion_responder(text, jsonb) to anon, authenticated;
