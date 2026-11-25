-- =====================================================================
-- Pippole 0.40 · Nuevo dominio interno de los usuarios
-- Ejecutar una vez en Supabase → SQL Editor, justo después de publicar la
-- 0.40 (hasta entonces no se puede entrar con usuario). Se puede repetir
-- sin daño.
--
-- Los usuarios entran con un nombre (por ejemplo «admin» o «rm.es») que
-- Pippole convierte por dentro en <nombre>@usuarios.pippole.es. No se
-- envía ningún correo a esas direcciones: solo sirven para iniciar sesión.
-- Se cambian solo las cuentas que corresponden a un usuario de «perfiles»
-- y que aún tienen el dominio anterior; las contraseñas no cambian.
-- =====================================================================
update auth.users u
   set email = p.usuario || '@usuarios.pippole.es'
  from public.perfiles p
 where p.id = u.id
   and p.usuario is not null
   and split_part(u.email, '@', 1) = p.usuario
   and u.email <> p.usuario || '@usuarios.pippole.es';

update auth.identities i
   set identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(u.email))
  from auth.users u
 where i.user_id = u.id
   and i.provider = 'email'
   and coalesce(i.identity_data->>'email', '') <> u.email;

-- Comprobación: deberían salir todas con el dominio nuevo.
select p.usuario, u.email
  from public.perfiles p join auth.users u on u.id = p.id
 order by p.usuario;
