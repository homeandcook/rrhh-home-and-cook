# Pippole

Plataforma web de Recursos Humanos para empresas con equipos que no trabajan delante de un ordenador: redes de tiendas, franquicias, hostelería, equipos de campo. Quien gestiona (RR.HH., responsables de zona) entra con usuario; el resto de la plantilla **no necesita usuario**: recibe un código y entra con él a encuestas, pruebas y formaciones.

Web: [www.pippole.es](https://www.pippole.es). Para verla sin configurar nada, añade `?demo` al final del enlace (usuarios `admin`, `rm.es`, `rm.pt` y `marketing`, contraseña `demo1234`). La demo usa una empresa ficticia y guarda los datos solo en la pestaña del navegador.

## Apartados visibles
- **Encuestas de clima**: por colectivo o de cultura y confianza, anónimas o con nombre, con resultados por dimensión y eNPS.
- **Desarrollo**: revisión de talento con 9-Box, riesgo × impacto, sucesión y plan de desarrollo; cada responsable rellena su ficha con un código.
- **Scorecard**: objetivos, seguimiento, cierre y bonus por tienda, con consolidado para RR.HH.
- **Formación de IA**: curso «Inteligencia artificial en el trabajo» con examen y certificado.
- **Pruebas de capacidad**: siete minijuegos (planificación, memoria, atención, cálculo, razonamiento, análisis de datos y priorización) en baterías para tienda y para oficina.
- **Personas**: plantilla, usuarios con acceso, tiendas y registro de actividad.
- **«Tus datos»**: cada persona puede ver los datos que la plataforma guarda sobre ella.

Hay más apartados construidos y ocultos (People Data Centre, PRL, Employer Branding). Se activan o se ocultan con `MODULOS_OCULTOS`, al principio de `app.js`.

## Cómo está hecho
HTML, CSS y JavaScript sin framework ni compilación. `index.html` lleva los estilos y carga los scripts; cada apartado vive en su fichero (`clima.js`, `desarrollo*.js`, `capacidad*.js`, `personas.js`…). Los datos y los usuarios están en **Supabase** (región UE), con reglas de acceso por fila en la base de datos. El correo sale por **Resend** desde una función de Supabase (`supabase/functions/enviar-invitacion`). La web se publica con **GitHub Pages**.

El detalle técnico de cada pieza está en `CLAUDE.md` y la historia de versiones en `CHANGELOG.md`.

## Puesta en marcha
1. **Supabase**: crea un proyecto en una región de la UE. En **SQL Editor**, ejecuta `supabase/schema.sql` y después las `migracion_0.xx.sql` en orden.
2. **Autenticación**: en **Authentication → Sign In / Providers → Email**, desactiva *Confirm email* (los usuarios no tienen correo real).
3. **Primer administrador**: en **Authentication → Users → Add user** crea `admin@usuarios.pippole.es` con una contraseña y marca *Auto Confirm User*. Luego, en el SQL Editor:
   ```sql
   insert into public.perfiles (id, usuario, nombre, rol)
   select id, 'admin', 'RR.HH.', 'admin' from auth.users where email = 'admin@usuarios.pippole.es';
   ```
4. **config.js**: pon la *Project URL* y la **clave publicable** (`sb_publishable_…`). Es pública por diseño. **Nunca** pongas aquí una clave secreta.
5. **Correo**: sigue `supabase/CORREO.md` (cuenta de Resend, dominio y secretos de la función).
6. **GitHub Pages**: *Settings → Pages → Deploy from a branch → `main`*. El flujo `publicar-pages.yml` pasa la prueba de humo antes de publicar.

Al entrar como `admin`, en **Personas** se crean los usuarios con acceso y las tiendas.

## Seguridad y datos
- Las reglas de acceso están en la base de datos: cada responsable solo ve lo suyo.
- Ninguna clave secreta en el código.
- Antes de cargar datos reales de personas hace falta el contrato de encargado de tratamiento (RGPD art. 28), el registro de actividades (art. 30) y, para la revisión de talento, probablemente una evaluación de impacto.
- Las pruebas de capacidad no tienen baremo: sirven para comparar dentro de una campaña, nunca para decidir solas.
