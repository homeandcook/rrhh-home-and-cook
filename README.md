# RR.HH. x Home & Cook

Portal de RR.HH. para la red de tiendas Home & Cook. Los Regional Managers entran con su usuario y ven sus tiendas; RR.HH. (administrador) gestiona usuarios, tiendas y los consolidados.

Apartados en marcha: **Scorecard Retail** (objetivos, seguimiento, cierre anual y bonus) y **Talent Matrix** (desempeño, potencial, riesgo, sucesión y plan de desarrollo, con matriz 9-Box).
Destacado en la portada: **People Data Centre**, cuadro de mando con datos clave y tres bloques (negocio, RR.HH. y *staff adaptation to traffic*). Los datos mensuales por tienda se guardan en `datos.kpis` de cada tienda; de momento se cargan a mano o desde el ejemplo, la importación desde Excel está pendiente.
También en marcha, con el mismo circuito de códigos: **Psicotécnicos**, **Mystery Shopper**, **Encuesta de Clima** (por olas, con dimensiones y eNPS) y **Onboarding y Offboarding**.
También en marcha: **Formaciones**, con el *Circuito de Venta* desarrollado y KPIs Retail, Visual Merchandising, P&L y Gestión de equipos por hacer.
En preparación: **Process Book**, **Política de RR.HH.** y **PRL**.

Los apartados se definen en el array `MODULOS`, al principio de `app.js`: cambiar un texto, añadir uno nuevo o pasar uno de pendiente a activo se hace ahí.

- **Web:** GitHub Pages (gratis, enlace tipo `https://tu-usuario.github.io/scorecard-retail/`)
- **Usuarios y datos:** Supabase (gratis en su plan inicial). Las reglas de acceso viven en la base de datos, no en el navegador.

Puedes probarla sin configurar nada añadiendo `?demo` al final del enlace.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Página y estilos |
| `app.js` | Lógica de la plataforma |
| `engine.js` | **Parámetros y cálculo** del bonus y de la Talent Matrix (pesos, escalados, importes, bandas, competencias, año) |
| `talent.js` | Módulo Talent Matrix: ficha del RM y mapa de talento |
| `pruebas.js` | Psicotécnicos, Mystery Shopper, Clima, Onboarding y Offboarding: campañas, códigos y acceso de invitado |
| `pdc.js` | People Data Centre: cuadro de mando con filtros |
| `formacion.js` | Formaciones: catálogo y Circuito de Venta en 7 paradas |
| `curso_datos.js` | Preguntas por familia y argumentos por producto (sistemática comercial) |
| `i18n.js` | Idiomas (español, inglés, francés) del portal y de las pantallas de invitado |
| `marca.js` | Logotipo RR.HH. x Home & Cook dibujado en curvas SVG (sin fuentes externas) |
| `marcas.js` | Logos de Groupe SEB y de las marcas, recortados e incrustados, y la cinta inferior |
| `config.js` | Conexión a tu proyecto de Supabase. **Se crea una vez y no se vuelve a subir nunca**: si lo subes de nuevo, borras tus claves. En este paquete va como `config.EJEMPLO.js` para que no pueda pasar por accidente. |
| `demo.js` | Modo demostración (`?demo`) |
| `roleplay.js` | Role play con IA dentro del Circuito de Venta |
| `arcade.js` | Juego «Un turno en la tienda» |
| `logo.png` | Logo Home & Cook |
| `manifest.json` | Datos para instalar la plataforma en el móvil |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Iconos de esa instalación |
| `supabase/schema.sql` | Tablas y reglas de seguridad |

### Instalarla en el móvil

Con `manifest.json` y los tres iconos subidos, cualquiera que abra el enlace desde el móvil puede añadirla a la pantalla de inicio y abrirla como una aplicación, sin barra del navegador. En Android: menú del navegador → «Añadir a pantalla de inicio». En iPhone: botón de compartir → «Añadir a pantalla de inicio».

## Puesta en marcha (unos 20 minutos)

### 1. Supabase
1. Crea una cuenta en supabase.com y un proyecto nuevo. Elige una **región de la UE**.
2. **SQL Editor → New query**: pega el contenido de `supabase/schema.sql` y pulsa **Run**.
3. **Authentication → Sign In / Providers → Email**: desactiva **Confirm email** (los usuarios no tienen correo real) y deja activado **Allow new users to sign up** (lo usa el administrador para dar de alta a los RM).
4. **Primer administrador**: en **Authentication → Users → Add user → Create new user** crea `admin@homeandcook.app` con una contraseña y marca *Auto Confirm User*. Luego, en el SQL Editor:
   ```sql
   insert into public.perfiles (id, usuario, nombre, rol)
   select id, 'admin', 'RR.HH.', 'admin' from auth.users where email = 'admin@homeandcook.app';
   ```
5. **Project Settings → API Keys** (o el botón *Connect*): copia la *Project URL* y la **clave publicable** (`sb_publishable_…`). En proyectos creados antes de noviembre de 2025 se llama *anon public* y sirve igual.

### 2. config.js
Pega la URL y la clave publicable en `config.js`. Si cambias `dominioUsuarios`, usa el mismo dominio en el correo del paso 4.
Esa clave es pública por diseño. **Nunca** pongas una clave secreta (`sb_secret_…` o *service_role*).

### 3. GitHub Pages
1. En GitHub: **New repository** (por ejemplo `scorecard-retail`) → sube todos los archivos manteniendo la carpeta `supabase/`.
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`** → Save.
3. En uno o dos minutos la web estará en `https://tu-usuario.github.io/scorecard-retail/`.

### 4. Primer uso
Entra como `admin` → **Usuarios y tiendas**: crea los 3 Regional Managers (usuario + contraseña inicial), crea las tiendas y asígnalas. Cada RM puede cambiar su contraseña desde su nombre, arriba a la derecha.

## Uso durante el año
- **Enero:** cada RM fija y valida los objetivos de sus tiendas y añade al SM/ASM.
- **Seguimiento 6 meses:** resultados de tienda + valoración cualitativa → bonus indicativo.
- **Cierre anual:** resultados + valoración → bonus a liquidar. Al cerrar se bloquea.
- **RR.HH.:** *Consolidado* del bonus (calibración entre RM, alertas, CSV para nómina) y *Actividad reciente*.
- **Pruebas con código:** RR.HH. crea la campaña, se generan códigos por tienda y se envían con un mensaje ya redactado. Quien lo recibe entra en `.../index.html?codigo=XXXX-XXXX`, sin usuario, responde una sola vez y el resultado vuelve al panel. La de clima es anónima: códigos sin nombre y nada de resultados en tiendas con menos de 4 respuestas.
- **Talent Matrix:** el RM rellena una ficha por persona (el desempeño se propone desde la nota del Scorecard) y RR.HH. ve la matriz 9-Box, la distribución frente a los guardarraíles, las prioridades de retención, las tiendas sin sucesor y la calibración por zona.

## Cambiar parámetros o de año
Edita `engine.js` en GitHub (icono del lápiz) y guarda: la web se actualiza sola.
Para un año nuevo cambia `anio` y `version`; las tiendas del año anterior quedan guardadas pero dejan de mostrarse.

## Idiomas
El selector (arriba a la derecha) cambia entre español, inglés y francés. Están traducidos la portada, el acceso, el menú y todo lo que ve la gente de tienda, incluidos los cuestionarios de clima, onboarding y offboarding. El Scorecard, la Talent Matrix, el People Data Centre y la gestión siguen solo en español; los textos viven en `i18n.js` y en las plantillas de `engine.js`.

## Cómo actualizar la web después de un cambio

El repositorio de GitHub es la única fuente de verdad. Cada vez que pidas un cambio, recibes **solo los ficheros que cambian** y una nota que dice si hay que tocar la base de datos.

1. Descarga los ficheros nuevos.
2. En GitHub, abre el repositorio y arrastra los ficheros encima: sustituye los que existan y confirma el cambio (*Commit changes*).
3. En uno o dos minutos la web ya está actualizada. Si no ves el cambio, recarga con Ctrl+F5.
4. Si la nota dice que hay SQL, pega ese trozo en **Supabase → SQL Editor → Run** antes de probar.

Reglas para no romper nada:
- **`config.js` no se sustituye nunca**: ahí están tus claves. Si alguna vez hiciera falta cambiarlo, se te dice expresamente.
- Si editas ficheros a mano en GitHub, avísalo: si no, el siguiente paquete de cambios puede pisar tu edición.
- Los datos no se pierden al actualizar la web: viven en Supabase, no en los ficheros.
- El **role play con IA** no funciona en GitHub Pages: necesita una función de servidor en Supabase. Todo lo demás, incluido el arcade, funciona sin ella.
- Anota cada entrega en `CHANGELOG.md` para saber qué versión está publicada.

## Seguridad
- Cada RM solo puede leer y modificar sus tiendas; no puede reasignarlas ni cambiarlas de año. Esto lo impone la base de datos.
- Solo el administrador crea, desactiva o cambia contraseñas de usuarios y crea o elimina tiendas.
- Si dos personas editan la misma tienda a la vez, la segunda recibe un aviso en lugar de sobrescribir.
- Un usuario desactivado pierde el acceso al momento; sus datos se conservan.
