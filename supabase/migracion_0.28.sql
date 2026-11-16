-- =====================================================================
-- Pippole 0.28 · Desarrollo (Talent Review)
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de
-- una vez sin romper nada.
--
-- Cuatro tablas:
--   dr_ciclos       un ciclo de Talent Review por año y ámbito (oficina o retail)
--   dr_evaluadores  cada responsable que valora a un equipo; entra con un código
--   dr_personas     cada persona valorada, con su ficha en «datos»
--   dr_decisiones   estado de los asuntos de la cola de decisiones de RR.HH.
-- Solo RR.HH. (rol admin) lee y escribe las tablas. Los responsables no
-- tienen usuario: usan las funciones dr_abrir, dr_guardar, dr_alta y
-- dr_entregar con su código, y solo ven y tocan su propio equipo.
-- =====================================================================

create table if not exists public.dr_ciclos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  anio          int  not null,
  ambito        text not null check (ambito in ('oficina', 'retail')),
  estado        text not null default 'abierto' check (estado in ('abierto', 'cerrado')),
  fecha_limite  date,
  config        jsonb not null default '{}'::jsonb,
  creado        timestamptz not null default now()
);

create table if not exists public.dr_evaluadores (
  id         uuid primary key default gen_random_uuid(),
  ciclo_id   uuid not null references public.dr_ciclos(id) on delete cascade,
  nombre     text not null,
  email      text,
  puesto     text,
  unidad     text,
  codigo     text not null unique,
  enviado    timestamptz,
  abierto    timestamptz,
  entregado  timestamptz,
  encuesta   jsonb not null default '{}'::jsonb,
  creado     timestamptz not null default now()
);
create index if not exists dr_evaluadores_ciclo on public.dr_evaluadores (ciclo_id);

create table if not exists public.dr_personas (
  id            uuid primary key default gen_random_uuid(),
  ciclo_id      uuid not null references public.dr_ciclos(id) on delete cascade,
  evaluador_id  uuid not null references public.dr_evaluadores(id) on delete cascade,
  nombre        text not null,
  puesto        text,
  departamento  text,
  categoria     text,
  ant_compania  numeric,
  ant_puesto    numeric,
  id_empleado   text,
  manual        boolean not null default false,
  datos         jsonb not null default '{}'::jsonb,
  estado        text not null default 'borrador' check (estado in ('borrador', 'enviada')),
  actualizado   timestamptz not null default now(),
  creado        timestamptz not null default now()
);
create index if not exists dr_personas_ciclo on public.dr_personas (ciclo_id);
create index if not exists dr_personas_evaluador on public.dr_personas (evaluador_id);

create table if not exists public.dr_decisiones (
  id           uuid primary key default gen_random_uuid(),
  ciclo_id     uuid not null references public.dr_ciclos(id) on delete cascade,
  clave        text not null,
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'en curso', 'resuelto', 'descartado')),
  responsable  text,
  comentario   text,
  actualizado  timestamptz not null default now(),
  unique (ciclo_id, clave)
);

alter table public.dr_ciclos      enable row level security;
alter table public.dr_evaluadores enable row level security;
alter table public.dr_personas    enable row level security;
alter table public.dr_decisiones  enable row level security;

drop policy if exists dr_ciclos_admin on public.dr_ciclos;
drop policy if exists dr_evaluadores_admin on public.dr_evaluadores;
drop policy if exists dr_personas_admin on public.dr_personas;
drop policy if exists dr_decisiones_admin on public.dr_decisiones;
create policy dr_ciclos_admin      on public.dr_ciclos      for all to authenticated using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
create policy dr_evaluadores_admin on public.dr_evaluadores for all to authenticated using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
create policy dr_personas_admin    on public.dr_personas    for all to authenticated using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
create policy dr_decisiones_admin  on public.dr_decisiones  for all to authenticated using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

-- ---------------------------------------------------------------------
-- Funciones para el responsable que entra con su código
-- ---------------------------------------------------------------------
create or replace function public.dr_abrir(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_e public.dr_evaluadores; v_c public.dr_ciclos;
begin
  select * into v_e from public.dr_evaluadores where codigo = upper(trim(p_codigo));
  if not found then return null; end if;
  select * into v_c from public.dr_ciclos where id = v_e.ciclo_id;
  if v_e.abierto is null then update public.dr_evaluadores set abierto = now() where id = v_e.id; end if;
  return jsonb_build_object(
    'ciclo', jsonb_build_object('id', v_c.id, 'nombre', v_c.nombre, 'anio', v_c.anio, 'ambito', v_c.ambito,
                                'estado', v_c.estado, 'fecha_limite', v_c.fecha_limite, 'config', v_c.config),
    'evaluador', jsonb_build_object('id', v_e.id, 'nombre', v_e.nombre, 'unidad', v_e.unidad,
                                    'entregado', v_e.entregado, 'encuesta', v_e.encuesta),
    'personas', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'nombre', p.nombre, 'puesto', p.puesto, 'departamento', p.departamento,
        'categoria', p.categoria, 'ant_compania', p.ant_compania, 'ant_puesto', p.ant_puesto,
        'manual', p.manual, 'datos', p.datos, 'estado', p.estado) order by p.nombre)
      from public.dr_personas p where p.evaluador_id = v_e.id), '[]'::jsonb));
end $$;

create or replace function public.dr_guardar(p_codigo text, p_persona uuid, p_datos jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_e public.dr_evaluadores; v_c public.dr_ciclos;
begin
  select * into v_e from public.dr_evaluadores where codigo = upper(trim(p_codigo));
  if not found then raise exception 'Código no encontrado'; end if;
  select * into v_c from public.dr_ciclos where id = v_e.ciclo_id;
  if v_c.estado <> 'abierto' then raise exception 'El ciclo está cerrado'; end if;
  if jsonb_typeof(p_datos) <> 'object' then raise exception 'Datos no válidos'; end if;
  if length(p_datos::text) > 40000 then raise exception 'La ficha es demasiado larga'; end if;
  update public.dr_personas set datos = p_datos, actualizado = now()
   where id = p_persona and evaluador_id = v_e.id;
  if not found then raise exception 'Esa persona no está en tu equipo'; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.dr_alta(p_codigo text, p_nombre text, p_puesto text, p_departamento text,
                                          p_categoria text, p_nuevo boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_e public.dr_evaluadores; v_c public.dr_ciclos; v_id uuid;
begin
  select * into v_e from public.dr_evaluadores where codigo = upper(trim(p_codigo));
  if not found then raise exception 'Código no encontrado'; end if;
  select * into v_c from public.dr_ciclos where id = v_e.ciclo_id;
  if v_c.estado <> 'abierto' then raise exception 'El ciclo está cerrado'; end if;
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_puesto), '') = '' then raise exception 'Nombre y posición son obligatorios.'; end if;
  if exists (select 1 from public.dr_personas where evaluador_id = v_e.id and lower(nombre) = lower(trim(p_nombre))) then
    raise exception 'Esa persona ya está en tu equipo.'; end if;
  if (select count(*) from public.dr_personas where evaluador_id = v_e.id) >= 60 then raise exception 'Demasiadas personas en el equipo'; end if;
  insert into public.dr_personas (ciclo_id, evaluador_id, nombre, puesto, departamento, categoria, ant_puesto, manual)
  values (v_e.ciclo_id, v_e.id, trim(p_nombre), trim(p_puesto), nullif(trim(coalesce(p_departamento, '')), ''),
          nullif(trim(coalesce(p_categoria, '')), ''), case when p_nuevo then 0.5 end, true)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.dr_entregar(p_codigo text, p_encuesta jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_e public.dr_evaluadores; v_c public.dr_ciclos;
begin
  select * into v_e from public.dr_evaluadores where codigo = upper(trim(p_codigo));
  if not found then raise exception 'Código no encontrado'; end if;
  select * into v_c from public.dr_ciclos where id = v_e.ciclo_id;
  if v_c.estado <> 'abierto' then raise exception 'El ciclo está cerrado'; end if;
  if p_encuesta is not null and length(p_encuesta::text) > 4000 then raise exception 'Encuesta demasiado larga'; end if;
  update public.dr_evaluadores
     set entregado = now(),
         encuesta = case when p_encuesta is null or p_encuesta = '{}'::jsonb then encuesta else p_encuesta end
   where id = v_e.id;
  update public.dr_personas set estado = 'enviada' where evaluador_id = v_e.id;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.dr_abrir(text), public.dr_guardar(text, uuid, jsonb),
  public.dr_alta(text, text, text, text, text, boolean), public.dr_entregar(text, jsonb) from public;
grant execute on function public.dr_abrir(text) to anon, authenticated;
grant execute on function public.dr_guardar(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.dr_alta(text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.dr_entregar(text, jsonb) to anon, authenticated;
