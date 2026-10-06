-- ===================================================================
-- Migración 0.17 · RR.HH. x Home & Cook
-- Añade puesto y correo a las invitaciones, para poder dar de alta a
-- una persona en el momento (sin que sea usuario de la plataforma) y
-- enviarle el código a su correo.
--
-- Se puede ejecutar varias veces sin romper nada.
-- No toca ninguna política: las de invitaciones siguen igual.
-- ===================================================================

alter table public.invitaciones add column if not exists puesto text;
alter table public.invitaciones add column if not exists email  text;

comment on column public.invitaciones.puesto is
  'Puesto de la persona invitada. Solo en campañas nominativas; en las anónimas va siempre a null.';
comment on column public.invitaciones.email is
  'Correo al que se envió el código. Solo en campañas nominativas; en las anónimas va siempre a null.';

-- La función invitacion_abrir() devuelve una lista cerrada de campos y no
-- incluye ni el puesto ni el correo: quien entra con el código no los
-- necesita para responder, así que no se tocan sus permisos.

-- ===================================================================
-- Formaciones enviadas a gente sin cuenta
-- El equipo de tienda no es usuario de la plataforma. Para que pueda
-- hacer una formación se reutiliza el circuito de códigos, así que
-- 'formacion' pasa a ser un tipo de campaña más.
-- ===================================================================
alter table public.campanas drop constraint if exists campanas_tipo_check;
alter table public.campanas add  constraint campanas_tipo_check
  check (tipo in ('psico', 'mystery', 'clima', 'onboarding', 'offboarding', 'formacion'));
