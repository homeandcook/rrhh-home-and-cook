-- =====================================================================
-- Pippole 0.38 · «Tus datos»: cada persona puede ver lo que Pippole
-- guarda sobre ella, quién lo ve y quién ha abierto su ficha.
-- Ejecutar una vez en Supabase → SQL Editor. Se puede repetir sin daño.
--
-- 1. Código personal de consulta (empleados.datos_hash). Pippole guarda
--    solo la huella SHA-256 del código, nunca el código: si alguien lee
--    la tabla, no puede entrar con él. El código lo genera la base de
--    datos y se enseña una sola vez, para enviarlo por correo.
-- 2. Registro de quién abre la ficha de cada persona (accesos_ficha),
--    uno por persona, usuario, día y apartado.
-- 3. mis_datos(código): lo que ve la persona. Solo lectura. Las encuestas
--    anónimas no aparecen porque no se guarda quién las respondió.
-- =====================================================================

alter table public.empleados add column if not exists datos_hash    text;
alter table public.empleados add column if not exists datos_enviado timestamptz;
create unique index if not exists empleados_datos_hash on public.empleados (datos_hash) where datos_hash is not null;

create table if not exists public.accesos_ficha (
  id          bigint generated always as identity primary key,
  empleado_id uuid not null references public.empleados(id) on delete cascade,
  usuario_id  uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  donde       text not null default '',
  dia         date not null default current_date,
  cuando      timestamptz not null default now(),
  unique (empleado_id, usuario_id, dia, donde)
);
create index if not exists accesos_ficha_empleado on public.accesos_ficha (empleado_id, cuando desc);
alter table public.accesos_ficha enable row level security;
drop policy if exists accesos_ficha_leer on public.accesos_ficha;
create policy accesos_ficha_leer on public.accesos_ficha for select to authenticated using (public.mi_rol() = 'admin');
-- Nadie escribe directamente: solo con registrar_acceso().

-- Normaliza un código a «XXXX-XXXX» (o null si no tiene 8 caracteres).
create or replace function public.datos_normalizar(p text) returns text
language sql immutable as $$
  select case when length(v) = 8 then substr(v, 1, 4) || '-' || substr(v, 5, 4) end
    from (select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')) as v) x;
$$;

create or replace function public.datos_huella(p text) returns text
language sql immutable as $$
  select encode(sha256(convert_to(public.datos_normalizar(p), 'UTF8')), 'hex');
$$;

-- RR.HH. pide un código nuevo para una persona. Sustituye al anterior.
create or replace function public.datos_codigo_nuevo(p_empleado uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  abc  constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  idx  constant int[] := array[0, 1, 2, 3, 4, 5, 9, 10]; -- bytes del uuid que son aleatorios del todo
  b    bytea;
  c    text;
  i    int;
begin
  if public.mi_rol() is distinct from 'admin' then raise exception 'Solo RR.HH. puede crear códigos de consulta'; end if;
  if not exists (select 1 from empleados where id = p_empleado and empresa_id = public.mi_empresa() and activo) then
    raise exception 'Esa persona no existe o está de baja';
  end if;
  loop
    b := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    c := '';
    for i in 1..8 loop
      c := c || substr(abc, (get_byte(b, idx[i]) & 31) + 1, 1);
      if i = 4 then c := c || '-'; end if;
    end loop;
    exit when not exists (select 1 from empleados where datos_hash = public.datos_huella(c))
          and not exists (select 1 from invitaciones where codigo = c)
          and not exists (select 1 from dr_evaluadores where codigo = c);
  end loop;
  update empleados set datos_hash = public.datos_huella(c), datos_enviado = null where id = p_empleado;
  return c;
end $$;

-- Deja constancia de que alguien con usuario ha abierto la ficha de una persona.
create or replace function public.registrar_acceso(p_empleado uuid, p_donde text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.mi_rol() is null then return; end if;
  if not exists (select 1 from empleados where id = p_empleado and empresa_id = public.mi_empresa()) then return; end if;
  insert into accesos_ficha (empleado_id, usuario_id, donde)
  values (p_empleado, auth.uid(), left(coalesce(p_donde, ''), 40))
  on conflict (empleado_id, usuario_id, dia, donde) do update set cuando = now();
end $$;

-- Lo que ve la persona con su código. null si el código no vale.
create or replace function public.mis_datos(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e   empleados%rowtype;
  t   tiendas%rowtype;
  rm  text;
  rs  text;
begin
  select * into e from empleados where datos_hash = public.datos_huella(p_codigo) and activo;
  if not found then return null; end if;
  select * into t from tiendas where id = e.tienda_id;
  select nombre into rm from perfiles where id = t.rm_id;
  select trim(nombre || ' ' || apellidos) into rs from empleados where id = e.responsable_id;

  return jsonb_build_object(
    'ficha', jsonb_build_object(
      'nombre', e.nombre, 'apellidos', e.apellidos, 'correo', e.correo, 'puesto', e.puesto,
      'tipologia', e.tipologia, 'ubicacion', e.ubicacion, 'departamento', e.departamento,
      'tienda', t.nombre, 'responsable', rs, 'fecha_alta', e.fecha_alta),
    'quien', jsonb_build_object('rm', rm, 'responsable', rs),
    'scorecard', coalesce((
      select jsonb_agg(jsonb_build_object('anio', t.anio, 'periodo', k.key,
               'fecha', k.value->'cerrado'->>'fecha', 'por', k.value->'cerrado'->>'por',
               'nota', k.value->'cerrado'->'nota', 'bonus', k.value->'cerrado'->'bonus') order by k.key desc)
        from jsonb_array_elements(coalesce(t.datos->'personas', '[]'::jsonb)) p,
             jsonb_each(case when jsonb_typeof(p->'evals') = 'object' then p->'evals' else '{}'::jsonb end) k
       where p->>'emp_id' = e.id::text
         and jsonb_typeof(k.value->'cerrado') = 'object'), '[]'::jsonb),
    'desarrollo', coalesce((
      select jsonb_agg(jsonb_build_object('ciclo', c.nombre, 'anio', c.anio, 'estado', dp.estado, 'evaluador', ev.nombre) order by c.creado desc)
        from dr_personas dp join dr_ciclos c on c.id = dp.ciclo_id join dr_evaluadores ev on ev.id = dp.evaluador_id
       where dp.id_empleado = e.id::text), '[]'::jsonb),
    'invitaciones', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', c.tipo, 'titulo', c.titulo, 'estado', i.estado, 'respondido', i.respondido) order by i.creado desc)
        from invitaciones i join campanas c on c.id = i.campana_id
       where e.correo is not null and lower(i.email) = lower(e.correo)), '[]'::jsonb),
    'accesos', coalesce((
      select jsonb_agg(x order by x->>'cuando' desc) from (
        select jsonb_build_object('rol', pf.rol, 'nombre', pf.nombre, 'cuando', max(a.cuando)) x
          from accesos_ficha a join perfiles pf on pf.id = a.usuario_id
         where a.empleado_id = e.id and a.cuando > now() - interval '90 days'
         group by pf.rol, pf.nombre) z), '[]'::jsonb)
  );
end $$;

revoke all on function public.datos_codigo_nuevo(uuid) from public;
revoke all on function public.registrar_acceso(uuid, text) from public;
revoke all on function public.mis_datos(text) from public;
grant execute on function public.datos_codigo_nuevo(uuid) to authenticated;
grant execute on function public.registrar_acceso(uuid, text) to authenticated;
grant execute on function public.mis_datos(text) to anon, authenticated;

-- Comprobación: debería salir «ok».
select case when count(*) = 3 then 'ok' else 'faltan funciones' end as resultado
  from pg_proc where proname in ('datos_codigo_nuevo', 'registrar_acceso', 'mis_datos');
