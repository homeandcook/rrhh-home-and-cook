# Dar de alta a las cuatro personas

Hay que hacerlo en dos pasos porque Supabase guarda la contraseña en un sitio
(Authentication) y el nombre y el rol en otro (la tabla `perfiles`).

## Paso 1 — Crear los usuarios

En Supabase → **Authentication** → **Add user** → *Create new user*.
Marca **Auto Confirm User** en los cuatro. Apunta la contraseña que pongas: se
la tendrás que comunicar tú, porque estos correos no existen y no llega ningún
mensaje.

| Email | Quién | Contraseña |
|---|---|---|
| `admin@homeandcook.app` | Camilo Merhi, HRBP | (ya creado) |
| `rm.es@homeandcook.app` | E.T., Regional Manager de España | la que pongas |
| `rm.pt@homeandcook.app` | A.N., Regional Manager de Portugal y Tui | la que pongas |
| `marketing@homeandcook.app` | E.M., Retail Marketing Development | la que pongas |

Cada persona entra escribiendo solo la parte de delante de la arroba: `rm.es`,
`rm.pt`, `marketing`. Y puede cambiarse la contraseña desde su nombre, arriba a
la derecha.

## Paso 2 — Copiar los identificadores

En la misma pantalla, cada usuario tiene un **UID** largo. Cópialos.

## Paso 3 — Crear los perfiles

En **SQL Editor**, pega esto sustituyendo los tres UID por los que has copiado,
y pulsa Run. El de Camilo ya está creado, no hace falta repetirlo.

```sql
insert into public.perfiles (id, usuario, nombre, rol, zona) values
  ('PEGA-AQUI-EL-UID-DE-RM-ES', 'rm.es',     'E.T.', 'rm',        'España'),
  ('PEGA-AQUI-EL-UID-DE-RM-PT', 'rm.pt',     'A.N.', 'rm',        'Portugal y Tui'),
  ('PEGA-AQUI-EL-UID-DE-MKT',   'marketing', 'E.M.', 'marketing', '')
on conflict (id) do update
  set usuario = excluded.usuario, nombre = excluded.nombre,
      rol = excluded.rol, zona = excluded.zona;
```

Pon los nombres completos de verdad en lugar de las iniciales: son los que verá
todo el mundo dentro de la plataforma.

## Paso 4 — Las tiendas

Entra en la plataforma como `admin`, ve a **Usuarios y tiendas** y pulsa
**Crear las que faltan**: se dan de alta las 21 tiendas de la red con su código,
sin asignar. Después, en el desplegable de cada fila, reparte:

- **A.N. (rm.pt)** → las 7 de Portugal y **ES007 HOME & COOK TUI**
- **E.T. (rm.es)** → las 13 restantes

## Qué ve cada rol

| | Camilo (admin) | E.T. y A.N. (rm) | E.M. (marketing) |
|---|---|---|---|
| Scorecard y bonus | Todo | Sus tiendas | **No** |
| Talent Matrix | Todo | Sus tiendas | **No** |
| People Data Centre | Todo | Sus tiendas | **Toda la red** |
| Mystery Shopper | Todo | Sus tiendas | **Toda la red** |
| Clima, psicotécnicos, onboarding | Todo | Sus tiendas | **No** |
| Usuarios y tiendas | Sí | No | No |

El corte de Retail Marketing está en la base de datos, no en la pantalla: ese
usuario no tiene permiso para leer la tabla de tiendas, y recibe los KPIs por
una función que devuelve el nombre de la tienda y sus números, sin una sola
línea de datos de personas.
