-- ===================================================================
-- Migración 0.20 · RR.HH. x Home & Cook
-- Guarda cuándo se envió por correo cada código, para no mandarlo dos
-- veces y para saber a quién hay que recordárselo.
-- Se puede ejecutar varias veces sin romper nada.
-- ===================================================================

alter table public.invitaciones add column if not exists enviado timestamptz;

comment on column public.invitaciones.enviado is
  'Fecha del último envío por correo desde la plataforma. Lo escribe la función enviar-invitacion; la plataforma no tiene política de UPDATE sobre esta tabla y sigue sin tenerla.';
