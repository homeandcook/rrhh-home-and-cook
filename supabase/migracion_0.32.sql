-- =====================================================================
-- Pippole 0.32 · Encuestas de clima por colectivo
-- Ejecutar una vez en Supabase → SQL Editor. Se puede repetir sin daño.
--
-- - campanas.config: lo que RR.HH. decide al crear la encuesta (tipo de
--   encuesta, colectivo, si lleva la evaluación al responsable y cierre).
-- - invitaciones.responsable: a quién evalúa la parte 2 quien tenga ese
--   código (el Store Manager de su tienda, su Regional Manager o el que
--   venga en la lista pegada). No es el nombre de quien responde.
-- - invitaciones.grupo: zona, departamento o córner de las listas pegadas
--   (comerciales, oficinas, demostradores), que no tienen tienda.
-- - invitacion_abrir devuelve también config, responsable y grupo.
-- =====================================================================
alter table public.campanas     add column if not exists config      jsonb not null default '{}'::jsonb;
alter table public.invitaciones add column if not exists responsable text;
alter table public.invitaciones add column if not exists grupo       text;

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
    'config', v_c.config, 'responsable', v_i.responsable, 'grupo', v_i.grupo,
    'respuestas', case when v_i.estado = 'respondida' then '{}'::jsonb else v_i.respuestas end);
end $$;

revoke all on function public.invitacion_abrir(text) from public;
grant execute on function public.invitacion_abrir(text) to anon, authenticated;

-- Comprobación: debe devolver las tres columnas nuevas
select table_name, column_name from information_schema.columns
 where table_schema = 'public' and column_name in ('config', 'responsable', 'grupo')
 order by table_name, column_name;
