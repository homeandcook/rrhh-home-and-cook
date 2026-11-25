# Pippole · notas para Claude

Contexto del proyecto para cualquier sesión de trabajo nueva. Léelo entero antes de tocar nada.
Este repositorio es **público**: aquí no van datos de personas, claves secretas ni decisiones internas de ningún cliente.

## Qué es
**Pippole** (www.pippole.es) es una plataforma web de Recursos Humanos para empresas con equipos que no trabajan delante de un ordenador (redes de tiendas, franquicias, equipos de campo). Es un producto propio del usuario (Camilo), que habla en español.
- **Desde el 25/11/2026 no hay cliente**: el primer cliente para el que nació ya no forma parte del proyecto. En la 0.40.0 se quitó todo su contenido (red de tiendas, Process Book, fotos, guiones de venta, herramienta interna, dominio de usuarios). No volver a usar su nombre, el de su grupo ni sus marcas en ningún sitio: ni en la interfaz, ni en el código, ni en la documentación.
- Usuarios: RR.HH. (administrador), 2 Regional Managers (`rm.es`, `rm.pt`) y Marketing (`marketing`, solo ve Mystery Shopper y People Data Centre). Los empleados de tienda **no tienen usuario**: entran con un **código de invitación** a encuestas, pruebas y formaciones.
- Todavía **no hay datos reales de empleados**, y no deben cargarse hasta que el cliente que los aporte tenga firmado el contrato de encargado y lo valide su DPO (ver «Seguridad»).

## Regla de marca (desde 0.26.0)
- La interfaz no menciona marcas de terceros. La demo usa una empresa ficticia (`CONFIG.red` en `engine.js`: 12 tiendas de ejemplo, 8 en España y 4 en Portugal).
- Identidad «Cercana»:
  - Color principal violeta `#5B3FD9` (variable CSS `--red` por historia; el nombre se mantiene), tinta `#231A3D`, fondo `#FBF7FF`, con tema oscuro.
  - Tipografía Plus Jakarta Sans, alojada en `fonts/`. Sin Google Fonts: evita mandar la IP de quien entra a terceros.
  - Logotipo «pippole» en minúsculas (`marca.js`) y símbolo de la **π**: dos personas que sostienen juntas una barra (`simboloPippole()` en `marcas.js`, `favicon.svg`, `logo.png`; desde 0.27.1).
- El lienzo con las cuatro direcciones de marca estudiadas está en claude.ai (artefacto «Pippole · Direcciones de marca»). La elegida es la 2, «Cercana».

## Foco actual (desde 0.28.0)
Decidido el 16/11/2026: de momento solo se ven **Encuestas de clima**, **Desarrollo** y **Formación de IA**; desde la 0.34.0 también **Scorecard** (apartado `evaluacion`, pestañas Scorecard y Consolidado) y **Personas**; desde la 0.39.0, **Pruebas de capacidad** (solo RR.HH.). El resto de apartados está oculto con `MODULOS_OCULTOS` en `app.js` (no borrado).
- **Desarrollo** = Talent Review v1.0 en web. Archivos: `desarrollo_cat.js` (escalas, 13 competencias, 9-Box, textos; objeto `TRC` y reglas `TR`), `desarrollo_eval.js` (ficha del responsable que entra con su código; estado `TRE`, acciones `data-tr`), `desarrollo.js` (panel de RR.HH.; estado `S.dr`, acciones `data-tra`), `desarrollo_inf.js` (objeto `TRI`: informe por equipo y por persona, compartidos por los dos lados; desde 0.30.0). Tablas `dr_*` y RPC `dr_abrir/dr_guardar/dr_alta/dr_entregar` (migración 0.28).
  - Oficina: manager → su equipo. Retail: Regional Manager → Store Managers; Store Manager → Assistant.
  - **Regla (16/11/2026): todo lo que rellenan terceros usa el mismo sistema de códigos que la encuesta de clima**: misma puerta («Entrar con un código de invitación»), mismo formato `XXXX-XXXX` (`SC.codigoInvitacion()`), envío por correo con la función `enviar-invitacion`. `abrirInvitacion()` prueba primero `invitacion_abrir` y, si no existe, `dr_abrir`.
  - La especificación detallada de la v1.0 (campos, textos, reglas) se usó para construirlo; los HTML originales no están en el repositorio.
- **Formación de IA** (0.29.0): curso «Inteligencia artificial en el trabajo», traído de Vigente (repo privado `cmerhi87/vigenteIA-web`; el usuario lo pasó en ZIP).
  - `ia_datos.js` es **generado** desde `lib/content.mjs` de Vigente: no se edita a mano. Se regenera con un script de node que importa `lib/content.mjs` y escribe `IA_DATOS` (módulos y las 12 preguntas del examen, elegidas como `armarExamen()` de Vigente).
  - `ia.js`: reproductor (`pintarIA` vista previa, `pintarIAInvitado` con código), plantilla `form-ia` con `umbral` 0.75, certificado imprimible. Avance en `localStorage` por código.
  - Los cursos de tienda (KPIs Retail, Visual Merchandising, P&L, Gestión de equipos, en `cursos.js`) tienen `oculto: true` en `CURSOS`; `cursosVisibles()` y `plantillaVisible()` los filtran. Desde 0.40.0 ya no existen el Circuito de Venta, el arcade ni el escape room de PRL.
  - El revisor jurídico de Vigente sigue como marcador («[Nombre Apellido]…»): el contenido no está revisado por un abogado.

## Siguiente trabajo: Pippole multicliente
Pippole ya es genérica (0.40.0) y no tiene cliente. Cuando llegue el primero, lo propio de cada uno será su **configuración**: red de tiendas (`CONFIG.red`), puestos y bonus (`CONFIG.bonus`), textos y datos en Supabase (tabla `tiendas` y su `datos`).

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
  `supabase-js@2` (CDN jsdelivr) → config, i18n, marca, marcas, engine, talent, pruebas, envios, importar, personas, correo_vista (carga la plantilla del correo al usarla con un `<script>` normal: `cargarPlantillaCorreo()` → `window.CORREO`), resenas, clima, clima_inv, pdc, pdc_carga, bajas, prl, cursos, formacion, ia_datos, ia, desarrollo_cat, desarrollo_inf, desarrollo_eval, desarrollo, hoy, avisos, demo, explica, copiloto, misdatos, capacidad, capacidad_app, app.
- **`app.js`**:
  - Estado global `S`, pintado completo con `pintar()` y apartados en el array `MODULOS`.
  - Delegación de eventos: `data-action="x"` llama a `acciones.x(boton, …)`. Cada módulo aporta su objeto `ACCIONES_*`. Si una acción devuelve `false`, no se repinta.
  - Navegación en dos niveles: índice del apartado con tarjetas y botón atrás.
  - Para confirmar, usa `confirmar()`, un modal propio; para avisar, `avisar(texto, titulo)`. Nunca `confirm()` ni `alert()` (desde 0.37.0 no queda ninguno).
  - **Ver como** (0.27.0): `cambiarVista(id)` pone en `S.me` el usuario elegido y guarda el administrador en `S.real`.
    - `S.todas` tiene todas las tiendas; `aplicarVista()` recorta `S.tiendas` según el rol que se está viendo.
    - Para escribir en la base de datos con el usuario real, usa `yoReal()`. Por ejemplo, `actividad.usuario_id` debe ser `auth.uid()`.
  - **Mis tiendas** (0.27.0): portada del RM y ficha de tienda (`S.modulo = "tienda"`, `S.tiendaFoco`, `APARTADOS_TIENDA`).
    - Abre cada apartado con `irA()` de `hoy.js`, filtrado por la tienda.
    - Los nombres de acción son globales: `irTienda` ya existe en Usuarios y tiendas. Antes de crear una acción, comprueba que el nombre no esté usado.
- **Employer Branding** (0.36.0; **aparcado y oculto desde 0.36.1** a petición del usuario: para retomarlo, quitar `employer` de `MODULOS_OCULTOS`, ejecutar `migracion_0.36.sql` y poner el secreto `GOOGLE_PLACES_KEY`): `resenas.js` (apartado `employer`, solo admin vía `MODULOS_SOLO_ADMIN`; estado `S.eb` con `ebS()`, acciones `eb*` en `ACCIONES_EB`). Tabla `resenas_sitios` (solo `place_id`, migración 0.36). Edge Function `supabase/functions/resenas`: `{buscar}` (Text Search) y `{sitios:[place_id]}` (Place Details con reseñas, máximo 5 por sitio). Secreto `GOOGLE_PLACES_KEY`.
  - **Condiciones de Google**: no se guarda contenido de Places en la base de datos (solo el `place_id`); hay que mostrar la atribución a Google y el autor de cada reseña. Lo visto por cada persona va en `localStorage` (`pp-eb-<usuario>`).
  - Coste: Place Details con reseñas es SKU «Enterprise + Atmosphere» (1.000 gratis al mes). Consulta automática como mucho cada 20 h por persona (`EB_HORAS_AUTO`).
  - Siguiente paso acordado: Google Business Profile API (todas las reseñas y respuestas) cuando haya acceso de quien gestiona las fichas.
- **Avisos** (0.30.0): `avisos.js`, campana de la cabecera con lo completado (invitaciones respondidas y entregas `dr_evaluadores.entregado`). Sondeo cada minuto; «visto» en `localStorage` por usuario. Las anónimas se agrupan sin hora ni tienda.
- **Invitados con código**: `pruebas.js` (`abrirInvitacion`, `pintarInvitado`) usa las funciones de base de datos SECURITY DEFINER `invitacion_abrir` e `invitacion_responder`. Encuestas, pruebas y formaciones son **plantillas de preguntas** que puntúa `SC.puntuar`.
- **Personas** (0.33.0): `personas.js` (apartado `personas`, estado `S.emp` (null si falta la migración 0.33, con `S.empFalta`), filtros `S.pf`, formulario `S.pe`, acciones `p*` en `ACCIONES_PERSONAS`) e `importar.js` (`abrirImportador("base"|"encuesta", {alUsar})`, estado `IMP`, overlay `#impOv` con sus propios eventos `data-imp*`, sin pasar por `pintar()`).
  - Tabla `empleados` con `empresa_id` (tabla `empresas`, función `mi_empresa()`; migración 0.33). Tipologías fijas: tiendas, oficinas, comerciales, demostradores. `tienda_id` se rellena si la ubicación coincide con una tienda (`impTiendaDe`).
  - `equipoDe(t)` (app.js) devuelve las personas activas de esa tienda desde `S.emp`; si `S.emp` es null, el equipo antiguo de `tiendas.datos.equipo`.
  - Lectores cargados al usarlos: `read-excel-file@9.3.17` (global `readXlsxFile`; no lee .xls) y `mammoth@1.13.0` (Word). No se usa SheetJS: la versión de npm (0.18.5) tiene fallos de seguridad conocidos y la corregida no está en npm.
  - La lectura con IA está como botón desactivado: no activarla sin el visto bueno del DPO de quien aporte los datos.
  - **Desde 0.34.0 Personas tiene pestañas** `pplantilla` (pintarPersonas), `paccesos`, `ptiendas`, `pactividad` (las tres con `pintarGestion(parte)`). `S.modulo = "gestion"` redirige a Personas → Usuarios con acceso.
  - **Selector común** (0.34.0, personas.js): `selPHtml(k, op)`, `selPElegidos(k, filtro)`, estado `S.selP[k]`, acciones `spTip/spModo/spGrupo/spPers`. Lo usan envíos de campañas (`k = "env"`, envios.js) y Desarrollo (`k = "dr-oficina|dr-retail"`, acción `data-tra="dePersonas"`). Scorecard: `scCandidatos(t)` y acción `scDePersonas`.
  - Modo "usuarios" (0.33.1): alta masiva de cuentas desde Usuarios y tiendas (acción `impUsuarios`). `impCrearUsuarios` crea cada cuenta con `crearCuenta()` (app.js), de una en una, y se para si Supabase devuelve límite de altas.
  - **Alta de cuentas** (0.37.0): `crearCuenta(usuario, password)` llama a la Edge Function `crear-cuenta` (solo admin; usa la clave de servicio que Supabase pone en las funciones) y, si no está desplegada, al registro público como antes. Con la función desplegada, el registro público de Supabase se puede desactivar.
- **Clima** (0.32.0): `clima.js` (banco de preguntas `CL`, plantillas `clima2-tiendas|campo|oficinas|demo|gptw`, pestañas `clnueva/clcurso/clanteriores/clresultados/clmodelos`, acciones `ACCIONES_CLIMA`) y `clima_inv.js` (pantalla de quien responde, estado `CI`, acciones `cli*`, vista previa `clPrevia`).
  - «A quién» (0.33): `N.usarB` (de Personas: `modoB` todas|grupos|personas, `tips` en GPTW) y `N.usarL` (archivo con el importador, `N.imp`). `clRespEmp(e)` decide a quién evalúa en la parte 2.
  - **Anónimas por defecto; con nombre si se elige** (0.35.0): `campanas.config.anonima === false` (`clAnon(c)`). Con nombre: `pendientes` lleva `n`, la invitación lleva `destinatario` y `email`, se envía con `{ids}` (modo «clima» del correo), recordatorio solo a quien falta, y Resultados muestra respuestas por persona. Anónimas: nunca se guarda el nombre.
  - `campanas.config` = {version 2, encuesta, colectivo, parte2, anonima, cierre, pendientes [{e,t,g,r,(n)}], enviadosA, correo}. `invitaciones.responsable` (a quién evalúa la parte 2) y `grupo` (listas pegadas). Migración 0.32.
  - El código de cada correo se crea justo antes de enviarlo (`clEnviarPendientes`); si no sale, se borra y vuelve a pendientes.
  - Resultados: % favorable (respuestas 3 y 4 de 0–4), mínimo `CL.MIN` = 5 por grupo y por responsable.
  - Las frases de la tipo Great Place To Work son propias: su cuestionario está protegido y no se copia.
  - `?codigo=XXXX&r=b0:3` abre directamente con la primera respuesta (correo).
  - Las campañas antiguas (plantillas `clima-*`) se siguen viendo con `pintarPruebas`.
- **Correo**: Edge Function `supabase/functions/enviar-invitacion` (Deno) que envía con Resend.
  - **Plantilla compartida** (0.34.0; script normal desde 0.34.2): `supabase/functions/_shared/correo.js`, sin `export`: deja `textosCorreo`, `montarCorreo` y `prepararCorreo` en `globalThis.CORREO` (la función hace `import "../_shared/correo.js"`). No convertirlo en módulo: como módulo no cargaba en la web publicada. La importa la función y la web la carga para la vista previa; `publicar-pages.yml` la copia a la raíz del sitio como `correo_plantilla.js` (y a su ruta). En local no existe esa copia: el 404 de `correo_plantilla.js` en la consola es normal. Cambiar el correo = cambiar ese fichero.
  - **Vista previa desde la función** (0.34.3): si el navegador no puede descargar la plantilla (pasó en la web publicada, motivo sin confirmar), `abrirVistaCorreo` pide el correo montado a `enviar-invitacion` con `{vista_previa: {it, aj}}` (`VC.remoto`); devuelve `{asunto, html, base, firma, cargo}` y no envía nada.
  - **Vista previa y edición** (0.34.0): `correo_vista.js`, `abrirVistaCorreo(op)` (overlay `#vcOv`, eventos `data-vc*`). Lo editado (`asunto, intro, extra, firma, cargo`) va a `campanas.config.correo` o `dr_ciclos.config.correo`; la función lo lee y lo aplica en todos los envíos.
  - Lee las invitaciones con el JWT del usuario, así que aplican las reglas por fila.
  - Modos (0.31.0): `{ids}` invitaciones con nombre, `{anonimos:[{id,email}]}` anónimas (la dirección no se guarda), `{recordatorio:{campana_id,emails}}` recordatorio general sin código, `{tipo:"desarrollo", ids}`. `info` lleva duración, preguntas y nota de la plantilla (que vive en el navegador). Texto y aspecto por tipo de campaña. Envía con la API por lotes de Resend, máximo 100 por llamada; el tope diario llega como motivo `LIMITE_DIARIO`.
  - Plan gratuito de Resend: 100 correos al día y 3.000 al mes. Para enviar a toda la red de una vez hace falta un plan de pago.
- **Envíos masivos** (0.31.0): `envios.js` (`bloqueMasivo`, `infoCampana`, `enviarEnLotes`), dentro de cada campaña. Toma a las personas de `equipoDe(t)`. En anónimas, las direcciones ya enviadas se recuerdan solo en `localStorage` (`pp-anon-<campaña>`), nunca junto al código.
  - Secretos en Supabase: `RESEND_API_KEY`, `CORREO_DE`, `URL_PLATAFORMA=https://www.pippole.es/`.
  - Resend: cuenta propia de Pippole (no la personal del usuario), dominio `pippole.es` en región Irlanda, registros DNS añadidos en Hostinger el 16/11/2026 (DKIM `resend._domainkey`, CNAME `send` y `rsend`). Remitente `Pippole <no-responder@pippole.es>`.
  - La función con el diseño de la 0.26.0 y el envío de Desarrollo está desplegada desde el 16/11/2026.
- **Modo demostración**: `?demo` usa `demo.js`, un cliente falso en memoria, con equipos de ejemplo en cada tienda y la función de correo simulada (`sb.functions.invoke`). Usuarios `admin`, `rm.es`, `rm.pt` y `marketing`, contraseña `demo1234`.
- **Idiomas**: `i18n.js` (es, en y fr) para el acceso y las pantallas de invitado. El resto de la interfaz está en español: al entrar, `entrar()` pone `LANG = "es"` y el selector no sale en la cabecera (0.37.0).
- **Privacidad** (0.37.0): `privacidad.html` + `privacidad.js` (rellena los huecos con `APP_CONFIG.legal`: `responsable`, `encargado`, `contacto`, `conservacion`, `fecha`, `validado`). Pie `#pieLegal` fuera de `#app` con `pintarPieLegal("invitado"|"acceso"|"oculto")`: aviso completo a quien entra con código, enlace en el acceso. Texto pendiente de validar por el DPO.
- **CSP** (0.37.0): etiqueta `meta` en `index.html` y en `privacidad.html`. Scripts solo de `'self'` y jsdelivr; conexiones solo a `*.supabase.co`. Nada de `onclick=` ni `<script>` en línea ni `eval`. Si se añade un CDN o un servicio, hay que añadirlo a la CSP.
- **«¿De dónde sale?»** (0.38.0): `explica.js`. `abrirExplica(titulo, sub, html)` (overlay `#exOv`, acción `exCerrar`), `explicaBonus(t, p, per)` y `explicaClima(c, dim)`. Acciones `exBonus` (panel del bonus) y `exClima` (`data-dim` opcional). Calcula con `SC.calcular`, `clDatos` y `clResumen`: nunca con fórmulas propias. Ojo: la base del bonus es `importe ÷ puntuacionMaxima` (referenciaBonus "maximo"), no «÷ 2 periodos».
- **Copiloto del manager** (0.38.0): `copiloto.js`. `copBorrador(t, p, per)` arma el borrador **con reglas, sin IA**; `copClima(t)` toma la encuesta más reciente con `CL.MIN` respuestas de la tienda. Acciones `copiloto`, `copFila`, `copQuitar`, `copLlevar` (añade a `planMejora`). La IA solo podría sustituir la redacción, con el visto bueno del DPO; las reglas deciden qué datos entran.
- **«Tus datos»** (0.38.0): `misdatos.js` + `migracion_0.38.sql`. `empleados.datos_hash` (huella SHA-256 del código, nunca el código) y `datos_enviado`; tabla `accesos_ficha`; funciones `datos_codigo_nuevo(uuid)` (solo admin), `registrar_acceso(uuid, donde)` y `mis_datos(codigo)` (anon). `abrirInvitacion()` prueba `invitacion_abrir` → Talent Review → `abrirMisDatos()`. Correo `{tipo: "datos", datos: [{id, codigo}]}` en `enviar-invitacion`. `registrarAcceso(empId, donde)` en Personas (`pEditar`) y Scorecard (`p.emp_id`). Pantalla solo en español (pendiente en y fr).
- **Pruebas de capacidad** (0.39.0): `capacidad.js` (motor: 7 minijuegos `capMontar*`, catálogo `CAPJ`, baterías `CAP_BATERIAS` retail y oficina, notas `CAP_NOTAS`, informe `capInformeHtml`, reproductor `capReproducir`; teclado con un único manejador `capTeclas`) y `capacidad_app.js` (apartado `capacidad`, solo admin vía `MODULOS_SOLO_ADMIN`; pestañas `capnueva/capcurso/capcatalogo`; estado `S.capN`; acciones `cap*` en `ACCIONES_CAP`; invitado `pintarCapInvitado`).
  - Campaña `tipo: "psico"`, `plantilla: "cap"`, `config = {version 1, capacidad, bateria, juegos, extra (1 o 1.5), cierre, externos, correo}`. `campanasDe()` y los contadores de Formación las excluyen. Sin migración.
  - Respuestas: `{v, juegos: {id: {score 0–1, kpis, tabla, datos, reinicios}}, extra, inicio, fin, dispositivo}`; la nota explicativa no se guarda (sale de `CAP_NOTAS`) y, si pasa de 19 000 caracteres, se quita `datos` (el límite de `invitacion_responder` es 20 000).
  - Avance del invitado en `localStorage` `pp-cap-<código>`; recargar a mitad cuenta como reinicio de esa prueba. El invitado no ve puntuaciones.
  - Correo modo `capacidad` (en `enviar-invitacion` se elige por `plantilla === "cap"`).
  - **Sin baremo ni validación**: el aviso de la interfaz lo dice. Para selección real hace falta piloto, estudio de sesgos y visto bueno del DPO; los candidatos externos necesitan aviso de privacidad. Pantallas de invitado solo en español.
  - Cada montaje deja de actuar si su elemento ya no está en la página (`el.isConnected`), para que cerrar la vista previa no deje temporizadores vivos.
- **Prueba de humo** (0.37.0): `pruebas/humo.py` (Playwright). `publicar-pages.yml` la pasa, junto con `node --check` de cada fichero, antes de publicar. En local: `HUMO_LIBS=<ruta a supabase.js> python3 pruebas/humo.py`. Falla si aparece una marca del cliente en pantalla.

## Despliegue
- Repositorio `homeandcook/rrhh-home-and-cook` (público; el nombre de la cuenta y del repositorio son heredados y se pueden cambiar, ajustando el CNAME de `www`). La web se sirve con **GitHub Pages** desde la rama `main` en `www.pippole.es`.
  - El archivo `CNAME` es imprescindible: no borrarlo.
  - DNS en Hostinger: cuatro registros A a GitHub y CNAME `www` → `homeandcook.github.io`.
- Base de datos: **Supabase**, proyecto `hrybclllymcsbujancuw`, región UE (Irlanda), plan gratuito, en una organización del usuario (con un nombre heredado que conviene cambiar en *Organization settings*).
  - La clave publicable está en `config.js`. **Nunca** poner en el código la clave secreta ni la `service_role`.
  - **`config.js` no se sobrescribe** en las actualizaciones: tiene las claves reales y cambios del propio usuario.
- **SQL**: `supabase/schema.sql` + `migracion_0.xx.sql`. Si una versión toca la base de datos, la migración la ejecuta el usuario a mano en el SQL Editor; el CHANGELOG lo indica con «SQL: sí».
- **Flujos de GitHub Actions**:
  - `publicar-pages.yml`: publica.
  - `mantener-supabase.yml`: cada 3 días, para que el plan gratuito no pause el proyecto. Da por buena la respuesta 42501.
  - `desplegar-funciones.yml`: despliega `enviar-invitacion`, `resenas` y `crear-cuenta` en cada cambio de `supabase/functions/` (o a mano con «Run workflow»). Funciona desde el 16/11/2026, con `--yes` porque la CLI pide confirmación. El token de GitHub (`SUPABASE_ACCESS_TOKEN`) está limitado al proyecto (Edge Functions lectura-escritura y Project Settings lectura) y **caduca el 14/02/2027**: entonces hay que generar otro igual y sustituirlo.
- **Versiones**: `APP_VERSION` en `app.js` y una entrada en `CHANGELOG.md`, siempre las dos. Versión actual: **0.40.0**. Al cambiar de versión, cambia también `?v=` en los `<script>` de `index.html`..

## Cómo comprobar los cambios
- La web no tiene compilación: se prueba sirviendo la carpeta (`python3 -m http.server`) y abriendo `?demo`.
- Si la sesión no puede salir a jsdelivr, en Playwright se sirve `supabase.js` desde el paquete de npm `@supabase/supabase-js` (`dist/umd/supabase.js`) interceptando la ruta del CDN.
- Comprobar siempre en escritorio (1280 px) y móvil (390 px), en tema claro y oscuro, y que la consola no muestre errores.
- El usuario quiere que cada respuesta diga **qué se ha comprobado y qué no** se ha podido comprobar.

## Seguridad y datos (no negociable)
- Ninguna clave secreta en el código ni en el chat: ni la de Resend ni el token de Supabase.
- Nada de datos reales de empleados hasta que el cliente y su DPO lo validen. Para ese paso hace falta:
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
- El ítem q13 del Scorecard es «Atención y asesoramiento al cliente» (0.37.0).
- Las formaciones **no se repiten**. En la 0.23.0 se añadió una caducidad anual (`caducada()` en `formacion.js`); **pendiente de confirmar si se quita**.
- El correo y la interfaz deben ser sobrios y profesionales, sin adornos.
