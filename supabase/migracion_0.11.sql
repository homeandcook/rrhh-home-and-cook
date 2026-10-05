-- =====================================================================
-- Migración a la versión 0.11.0
-- Pégalo entero en el SQL Editor de Supabase y pulsa Run.
-- Se puede ejecutar varias veces sin perder datos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Faltaban dos tipos de campaña
-- La aplicación crea campañas de onboarding y de offboarding, pero la
-- base de datos solo aceptaba psico, mystery y clima: crear una campaña
-- de onboarding fallaba con un error de restricción.
-- ---------------------------------------------------------------------
alter table public.campanas drop constraint if exists campanas_tipo_check;
alter table public.campanas add constraint campanas_tipo_check
  check (tipo in ('psico', 'mystery', 'clima', 'onboarding', 'offboarding'));

-- ---------------------------------------------------------------------
-- 2. Rol nuevo: marketing (Retail Marketing Development)
-- Ve los KPIs de negocio de toda la red y el mystery shopper.
-- No ve evaluaciones, ni talento, ni bonus, ni encuestas de clima.
-- El corte es real: no tiene permiso de lectura sobre la tabla tiendas.
-- ---------------------------------------------------------------------
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check
  check (rol in ('admin', 'rm', 'marketing'));

-- Solo ve las campañas de mystery shopper; ni clima ni psicotécnicos
drop policy if exists campanas_leer on public.campanas;
create policy campanas_leer on public.campanas for select to authenticated using (
  public.mi_rol() in ('admin', 'rm')
  or (public.mi_rol() = 'marketing' and tipo = 'mystery'));

-- Y solo los códigos y respuestas de esas campañas
drop policy if exists invitaciones_leer on public.invitaciones;
create policy invitaciones_leer on public.invitaciones for select to authenticated using (
  public.mi_rol() = 'admin'
  or exists (select 1 from public.tiendas t where t.id = tienda_id and t.rm_id = auth.uid())
  or (public.mi_rol() = 'marketing'
      and exists (select 1 from public.campanas c where c.id = campana_id and c.tipo = 'mystery')));

-- No puede crear ni cerrar campañas, solo leerlas
drop policy if exists campanas_admin on public.campanas;
create policy campanas_alta   on public.campanas for insert to authenticated
  with check (public.mi_rol() = 'admin');
create policy campanas_editar on public.campanas for update to authenticated
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
create policy campanas_borrar on public.campanas for delete to authenticated
  using (public.mi_rol() = 'admin');

-- ---------------------------------------------------------------------
-- 3. Los KPIs de la red, sin una sola línea de datos de personas
-- La columna "datos" de cada tienda mezcla los KPIs mensuales con el
-- equipo y sus evaluaciones, y Postgres no sabe dar permiso a media
-- columna. Así que marketing no lee la tabla: llama a esta función, que
-- devuelve el nombre de la tienda y sus KPIs, y nada más.
-- ---------------------------------------------------------------------
create or replace function public.red_kpis(p_anio int default null)
returns table (id uuid, nombre text, codigo text, anio int, kpis jsonb)
language sql stable security definer set search_path = public as $$
  select t.id, t.nombre, t.codigo, t.anio, coalesce(t.datos -> 'kpis', '{}'::jsonb)
    from public.tiendas t
   where public.mi_rol() is not null
     and (p_anio is null or t.anio = p_anio)
     and (public.mi_rol() <> 'rm' or t.rm_id = auth.uid())
   order by t.nombre
$$;
revoke all on function public.red_kpis(int) from public, anon;
grant execute on function public.red_kpis(int) to authenticated;

-- ---------------------------------------------------------------------
-- 4. El borrado de una persona ya no deja su nombre en el registro
-- El registro de actividad guardaba frases como "Baja de Fulanita en
-- HC Málaga", así que al eliminar a alguien su nombre seguía ahí.
-- ---------------------------------------------------------------------
-- (el cambio está en la aplicación; esto solo limpia lo ya escrito)
update public.actividad
   set accion = regexp_replace(accion, '^Baja de .+ en ', 'Baja de una persona en ')
 where accion like 'Baja de %';
