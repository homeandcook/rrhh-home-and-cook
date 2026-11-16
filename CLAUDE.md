# Pippole · notas para Claude

Contexto del proyecto para cualquier sesión de trabajo nueva. Léelo entero antes de tocar nada.
Este repositorio es **público**: aquí no van datos de personas, claves secretas ni decisiones internas de ningún cliente.

## Qué es
**Pippole** (www.pippole.es) es una plataforma web de Recursos Humanos. Nació como «RR.HH. x Home & Cook», el portal de RR.HH. de una red de 21 tiendas (14 en España y 7 en Portugal). En la versión 0.26.0 se convirtió en Pippole, una marca propia y neutra.
- Quien la promueve es el responsable de RR.HH. de ese cliente; habla en español.
- Usuarios: RR.HH. (administrador), 2 Regional Managers (`rm.es`, `rm.pt`) y Marketing (`marketing`, solo ve Mystery Shopper y People Data Centre). Los empleados de tienda **no tienen usuario**: entran con un **código de invitación** a encuestas, pruebas y formaciones.
- Todavía **no hay datos reales de empleados**, y no deben cargarse hasta que IT y el DPO del cliente lo validen (ver «Seguridad»).

## Regla de marca (desde 0.26.0)
- La interfaz de Pippole **no puede mencionar** a Home & Cook, a Groupe SEB ni a sus marcas (Tefal, Rowenta, Moulinex, Krups, WMF, Lagostina…).
- Identidad «Cercana»:
  - Color principal violeta `#5B3FD9` (variable CSS `--red` por historia; el nombre se mantiene), tinta `#231A3D`, fondo `#FBF7FF`, con tema oscuro.
  - Tipografía Plus Jakarta Sans, alojada en `fonts/`. Sin Google Fonts: evita mandar la IP de quien entra a terceros.
  - Logotipo «pippole» en minúsculas (`marca.js`) y símbolo de la **π**: dos personas que sostienen juntas una barra (`simboloPippole()` en `marcas.js`, `favicon.svg`; desde 0.27.1). `logoSEB()` y `bandaMarcas()` son nombres heredados: el primero devuelve el símbolo y el segundo nada.
- El lienzo con las cuatro direcciones de marca estudiadas está en claude.ai (artefacto «Pippole · Direcciones de marca»). La elegida es la 2, «Cercana».

## Foco actual (desde 0.28.0): tres bloques
Decidido el 16/11/2026: de momento solo se ven **Encuestas de clima**, **Desarrollo** y **Formación de IA**. El resto de apartados está oculto con `MODULOS_OCULTOS` en `app.js` (no borrado).
- **Desarrollo** = Talent Review v1.0 en web. Archivos: `desarrollo_cat.js` (escalas, 13 competencias, 9-Box, textos; objeto `TRC` y reglas `TR`), `desarrollo_eval.js` (ficha del responsable que entra con código `TR-…`; estado `TRE`, acciones `data-tr`), `desarrollo.js` (panel de RR.HH.; estado `S.dr`, acciones `data-tra`). Tablas `dr_*` y RPC `dr_abrir/dr_guardar/dr_alta/dr_entregar` (migración 0.28).
  - Oficina: manager → su equipo. Retail: Regional Manager → Store Managers; Store Manager → Assistant.
  - La especificación detallada de la v1.0 (campos, textos, reglas) se usó para construirlo; los HTML originales no están en el repositorio.
- **Formación de IA**: hay que llevar aquí el prototipo «Vigente» (repo privado `cmerhi87/vigenteIA-web`, sin acceso todavía).

## Siguiente trabajo acordado: Pippole genérica + configuración por cliente
Decidido el 16/11/2026, **aún sin diseñar ni empezar**. Pippole pasa a ser genérica y lo propio de Home & Cook se convierte en la **configuración de un cliente**, que es el primero. Hoy ese contenido sigue escrito directamente en el código:
- `engine.js`: lista `CONFIG.red` con las 21 tiendas («HOME & COOK …») y sus RM; pregunta eNPS `ENPS` y la del clima `x5` («recomendarías trabajar en Home & Cook»); puestos Store Manager / Assistant Store Manager y bonus (1000 € y 500 €).
- `formacion.js`, `curso_datos.js`, `cursos.js`: Circuito de Venta con guiones («bienvenido a Home&Cook»), familias y argumentos por producto con marcas del grupo.
- `docs_base.js`: Process Book escrito para una tienda outlet de la red.
- `escape.js` + `img/esc-*.jpg`: formación PRL «Un turno seguro» con **fotos reales de tiendas**, donde se ven marcas en los lineales.
- `pdc_carga.js`: abrevia «HOME & COOK» a «H&C» en nombres de tienda.
- `config.js`: `enlaces.hometime` (herramienta interna del cliente, con VPN) y `dominioUsuarios: "homeandcook.app"`. **El dominio interno de usuarios no se cambia**: invalidaría los usuarios que ya existen. No se ve en ninguna pantalla.
- Supabase: tabla `tiendas` y su `datos` (equipo, kpis, bajas…).

Hay que proponer el diseño antes de construir, porque toca la base de datos. Algunas preguntas que el diseño tiene que responder:
- ¿Una sola instancia con varios clientes (columna de cliente y reglas por fila) o un proyecto de Supabase por cliente?
- ¿Dónde vive la configuración: un fichero por cliente o una tabla?
- ¿Qué apartados son genéricos y cuáles opcionales por cliente?
- ¿Cómo se sustituyen las fotos con marcas?

## Pieza siguiente: matriz de talento con dos configuraciones
- Hoy existe una matriz de talento de **retail** (`talent.js` + `CONFIG.talent` en `engine.js`): desempeño a partir del Scorecard, potencial a 3 niveles, competencias de Store Manager, riesgo × impacto, sucesión y mapa 9-Box.
- Existe además una herramienta **corporativa** offline anterior, «Talent Review» v1.0 (v2026.1). Son dos HTML: panel de RR.HH. y ficha del manager. Incluye:
  - 9-Box y riesgo × impacto 3×3 con nomenclatura A0–C2.
  - Guardarraíles de distribución 20/70/10, calibración entre managers, sucesión, planes de desarrollo, «voz de los managers» y cola de decisiones.
  - Esos ficheros **no están en el repositorio**; el usuario los adjunta si hacen falta.
- Objetivo: un único motor de talento con dos configuraciones, **retail** (dentro de Pippole) y **corporativa** (web independiente, con su propio proyecto de Supabase). Primero mejorar la versión retail con lo mejor de la v1.0. La corporativa espera a que el usuario la acuerde internamente.

## Cómo está hecho
- **HTML, CSS y JavaScript sin framework ni compilación.** `index.html` lleva todos los estilos y carga los scripts en este orden:
  `supabase-js@2` (CDN jsdelivr) → config, i18n, marca, marcas, engine, talent, pruebas, pdc, pdc_carga, bajas, prl, curso_datos, cursos, formacion, docs_base, docs, arcade, escape, hoy, demo, app.
- **`app.js`**:
  - Estado global `S`, pintado completo con `pintar()` y apartados en el array `MODULOS`.
  - Delegación de eventos: `data-action="x"` llama a `acciones.x(boton, …)`. Cada módulo aporta su objeto `ACCIONES_*`. Si una acción devuelve `false`, no se repinta.
  - Navegación en dos niveles: índice del apartado con tarjetas y botón atrás.
  - Para confirmar, usa `confirmar()`, un modal propio; nunca `confirm()`.
  - **Ver como** (0.27.0): `cambiarVista(id)` pone en `S.me` el usuario elegido y guarda el administrador en `S.real`.
    - `S.todas` tiene todas las tiendas; `aplicarVista()` recorta `S.tiendas` según el rol que se está viendo.
    - Para escribir en la base de datos con el usuario real, usa `yoReal()`. Por ejemplo, `actividad.usuario_id` debe ser `auth.uid()`.
  - **Mis tiendas** (0.27.0): portada del RM y ficha de tienda (`S.modulo = "tienda"`, `S.tiendaFoco`, `APARTADOS_TIENDA`).
    - Abre cada apartado con `irA()` de `hoy.js`, filtrado por la tienda.
    - Los nombres de acción son globales: `irTienda` ya existe en Usuarios y tiendas. Antes de crear una acción, comprueba que el nombre no esté usado.
- **Invitados con código**: `pruebas.js` (`abrirInvitacion`, `pintarInvitado`) usa las funciones de base de datos SECURITY DEFINER `invitacion_abrir` e `invitacion_responder`. Encuestas, pruebas, formaciones y el escape room son **plantillas de preguntas** que puntúa `SC.puntuar`.
- **Clima**: anónima o nominal. Las anónimas no guardan nombre.
- **Correo**: Edge Function `supabase/functions/enviar-invitacion` (Deno) que envía con Resend.
  - Lee las invitaciones con el JWT del usuario, así que aplican las reglas por fila.
  - Secretos en Supabase: `RESEND_API_KEY`, `CORREO_DE`, `URL_PLATAFORMA=https://www.pippole.es/`.
  - Resend **no tiene dominio verificado**: solo envía al correo de la cuenta. Falta verificar `pippole.es` en Resend, con registros DNS en Hostinger.
  - El cambio de diseño del correo de la 0.26.0 **no está desplegado** todavía.
- **Modo demostración**: `?demo` usa `demo.js`, un cliente falso en memoria. Usuarios `admin`, `rm.es`, `rm.pt` y `marketing`, contraseña `demo1234`.
- **Idiomas**: `i18n.js` (es, en y fr) para el acceso y las pantallas de invitado. El resto de la interfaz está en español.

## Despliegue
- Repositorio `homeandcook/rrhh-home-and-cook` (público). La web se sirve con **GitHub Pages** desde la rama `main` en `www.pippole.es`.
  - El archivo `CNAME` es imprescindible: no borrarlo.
  - DNS en Hostinger: cuatro registros A a GitHub y CNAME `www` → `homeandcook.github.io`.
- Base de datos: **Supabase**, proyecto `hrybclllymcsbujancuw`, región UE (Irlanda), plan gratuito, en la organización «Groupe SEB Iberica».
  - La clave publicable está en `config.js`. **Nunca** poner en el código la clave secreta ni la `service_role`.
  - **`config.js` no se sobrescribe** en las actualizaciones: tiene las claves reales y cambios del propio usuario.
- **SQL**: `supabase/schema.sql` + `migracion_0.xx.sql`. Si una versión toca la base de datos, la migración la ejecuta el usuario a mano en el SQL Editor; el CHANGELOG lo indica con «SQL: sí».
- **Flujos de GitHub Actions**:
  - `publicar-pages.yml`: publica.
  - `mantener-supabase.yml`: cada 3 días, para que el plan gratuito no pause el proyecto. Da por buena la respuesta 42501.
  - `desplegar-funciones.yml`: **falla** porque faltan `SUPABASE_ACCESS_TOKEN` (secreto) y `SUPABASE_PROJECT_REF` (variable) en GitHub. Mientras falten, la función de correo se despliega pegando el código en el panel de Supabase.
- **Versiones**: `APP_VERSION` en `app.js` y una entrada en `CHANGELOG.md`, siempre las dos. Versión actual: **0.28.0**.

## Cómo comprobar los cambios
- La web no tiene compilación: se prueba sirviendo la carpeta (`python3 -m http.server`) y abriendo `?demo`.
- Si la sesión no puede salir a jsdelivr, en Playwright se sirve `supabase.js` desde el paquete de npm `@supabase/supabase-js` (`dist/umd/supabase.js`) interceptando la ruta del CDN.
- Comprobar siempre en escritorio (1280 px) y móvil (390 px), en tema claro y oscuro, y que la consola no muestre errores.
- El usuario quiere que cada respuesta diga **qué se ha comprobado y qué no** se ha podido comprobar.

## Seguridad y datos (no negociable)
- Ninguna clave secreta en el código ni en el chat: ni la de Resend ni el token de Supabase.
- Nada de datos reales de empleados hasta que IT y el DPO lo validen. Para ese paso hace falta:
  - Cuentas de empresa (organización de GitHub y de Supabase) y traspaso del repositorio y del proyecto.
  - Plan de pago con copias de seguridad.
  - SSO corporativo.
  - Contrato de encargado de tratamiento (RGPD art. 28) y registro de tratamientos (art. 30).
  - Probablemente una EIPD para la matriz de talento.
  - Informar al comité si hay decisiones automatizadas (ET art. 64.4.d).
- Bajas y PRL: **nunca** se guarda diagnóstico, causa médica ni resultado de reconocimientos.
- Fotos: sin caras reconocibles; difuminar a cualquier persona.
- No copiar tipografías ni rotulaciones de terceros.
- PRL: la formación del juego **complementa**, no sustituye, la formación específica del puesto que exige la LPRL. El contenido debe revisarlo el servicio de prevención.

## Correcciones del usuario que hay que respetar
- En las tiendas **no hay demostraciones de cocina**.
- Las formaciones **no se repiten**. En la 0.23.0 se añadió una caducidad anual (`caducada()` en `formacion.js`); **pendiente de confirmar si se quita**.
- El correo y la interfaz deben ser sobrios y profesionales, sin adornos.
