# Registro de versiones

Formato: versión · fecha · qué cambió · si hace falta tocar la base de datos.

## 0.9.0 · 24/09/2026 · **SQL: no**
Estado actual del prototipo.
- Portada RRHH x Home&Cook con logotipo propio, Groupe SEB y cinta de marcas.
- Scorecard Retail: objetivos, seguimiento de 6 meses, cierre anual, bonus e informe imprimible.
- Talent Matrix: ficha por persona y mapa 9-Box para RR.HH.
- People Data Centre: datos clave con filtros, KPIs de negocio, de RR.HH. y ajuste al tráfico.
- Pruebas con código de invitado: Psicotécnicos, Mystery Shopper, Clima (por olas y dimensiones), Onboarding y Offboarding.
- Formaciones: Circuito de Venta en 7 paradas, chuleta imprimible, arcade "Un turno en la tienda" y role play con IA (11 escenarios).
- Idiomas: español, inglés y francés en portada, acceso y pantallas de invitado.
- Enlace a HomeTime (requiere VPN).

## 0.9.1 · 24/09/2026 · **SQL: no**
- El dominio interno de los usuarios pasa a ser `homeandcook.app`. Afecta a `config.js`, al correo del administrador en Supabase y al README.

## 0.10.0 · 26/09/2026 · **SQL: no**
Rediseño de la pantalla de acceso, la primera que ve todo el mundo.

Aspecto:
- A dos columnas en ordenador: panel de marca a la izquierda (logo de Home & Cook grande, logotipo RRHH x Home&Cook, una sola frase y la cinta de marcas dentro) y formulario a la derecha. En móvil y tablet se apila: primero el panel, debajo el formulario.
- El logo de Groupe SEB pasa al panel, acompañado de «Una plataforma de Groupe SEB Ibérica».
- De tres subtítulos a uno. Campos más altos y fondo con dos tintes en diagonal.

Funcionamiento:
- Botón visible **«Entrar con un código de invitación»**, separado del formulario. Antes era un enlace pequeño: es la puerta de las encuestas, los psicotécnicos y el mystery shopper.
- Ojo para ver la contraseña mientras se escribe.
- «Recordar mi usuario en este equipo»: si está marcado, la próxima vez el usuario viene puesto y el cursor va directo a la contraseña.
- «¿Has olvidado la contraseña?» explica que solo RR.HH. puede restablecerla.
- Mensajes distintos si no hay internet o si el servidor no responde (proyecto de Supabase en pausa), en vez de un error técnico.
- Número de versión en el pie.
- Se puede instalar en el móvil como una aplicación: `manifest.json`, `icon-192.png`, `icon-512.png` y `apple-touch-icon.png`.
- Los textos nuevos están en español, inglés y francés.
- Arreglado: al entrar por `?codigo=` sin código, ya no aparece el aviso de «código caducado» antes de escribir nada.

## 0.10.1 · 26/09/2026 · **SQL: no**
- **KRUPS**: el logo se veía lavado al lado de los demás porque su opacidad máxima era 199 de 255. Reconstruido desde el fichero original de marca, a opacidad completa y con su gris oscuro (60, 57, 53), el mismo del propio fichero. Sigue pendiente la versión oficial del portal de marca.
- **WMF**: su logo es cuadrado y de dos líneas, así que a 30 px quedaba pequeño al lado de los logotipos horizontales. Sube a 42 px, que es donde la altura de sus letras iguala a la de KRUPS y Rowenta.
- `config.js` sale del paquete y pasa a llamarse `config.EJEMPLO.js`, para que al subir una actualización no pueda machacar las claves del proyecto.

## 0.11.0 · 27/09/2026 · **SQL: SÍ** — ejecuta `supabase/migracion_0.11.sql`

- **Arreglado el fallo que rompía Onboarding.** La base de datos solo aceptaba campañas de tipo psico, mystery y clima; crear una de onboarding o de offboarding fallaba. Ahora acepta los cinco tipos.
- **Rol nuevo: Retail Marketing.** Ve el People Data Centre de toda la red y el Mystery Shopper, y nada más. Ni evaluaciones, ni talento, ni bonus, ni clima. El corte está en la base de datos, no en la pantalla: ese usuario no tiene permiso de lectura sobre la tabla de tiendas y recibe los KPIs por una función que no devuelve datos de personas.
- **Las 21 tiendas reales de España y Portugal**, con su código, en `engine.js` (`CONFIG.red`). En Usuarios y tiendas hay un botón para crear de golpe las que falten.
- **El modo demostración y el prototipo pasan a la estructura real**: 2 Regional Managers (España, y Portugal más Tui) más Retail Marketing, y las 21 tiendas con su código. El recorrido guiado sube a 20 pasos, con uno nuevo que enseña qué ve cada rol.
- Al eliminar a una persona, el registro de actividad ya no guarda su nombre.

Comprobado en un PostgreSQL 16 real: 41 pruebas de acceso, todas pasan. Un Regional Manager no puede soltar ni reasignar sus tiendas ni cambiarlas de año (lo intenta y el dato no se mueve); Retail Marketing no alcanza ni una línea de datos de personas por ninguna vía; el rol anónimo no lee ninguna tabla.

## 0.12.0 · 27/09/2026 · **SQL: no**

**Apartado nuevo: Bajas y absentismo.** Registro de bajas por tienda y tasa de absentismo de la red.

- Datos clave: tasa de absentismo frente al objetivo, días perdidos, procesos abiertos y duración media.
- Desglose por contingencia y tabla por tienda, con las que superan el objetivo marcadas.
- Ficha por tienda para registrar una baja y para poner la fecha del alta. El alta se pone en un campo de fecha de la propia fila, no en una ventana emergente.
- Exportación a CSV.

**Lo que se guarda y lo que no.** Se guardan la contingencia que consta en el parte de baja, las fechas y el puesto. **No se guarda el diagnóstico ni la causa médica, y no hay ningún campo donde escribirlos**: es dato de salud del artículo 9 del RGPD y la empresa no tiene por qué conocerlo. Si el campo existiera, alguien acabaría usándolo.

**Quién lo ve.** RR.HH. toda la red; cada Regional Manager sus tiendas; Retail Marketing **no**. Las bajas viven dentro de `datos.bajas` de cada tienda, así que heredan las reglas que ya existían: no hizo falta tocar el SQL. Verificado, no supuesto.

La tasa se calcula como días naturales perdidos ÷ (plantilla × días del periodo). La plantilla sale del campo `empleados` de los KPIs mensuales; sin ese dato la tasa se muestra vacía en lugar de inventada. El objetivo por defecto es 4,5 %, la referencia habitual del comercio minorista en España: cámbialo en `engine.js` (`CONFIG.absentismoObjetivo`) cuando tengas el dato real de la red.

Comprobado: 50 pruebas de acceso en un PostgreSQL 16 real, todas pasan. Retail Marketing no alcanza las bajas por ninguna vía, incluida la función que le sirve los KPIs. Un Regional Manager ve y edita las de sus tiendas y ninguna más.

## 0.13.0 · 29/09/2026 · **SQL: no**

Rediseño de la pantalla de evaluación del Scorecard, que era la más cargada de toda la plataforma. **De 3.396 px de alto a 2.203.** El cálculo no cambia: el bonus de Málaga sigue dando 607,88 € y la nota 3,65.

Qué se ha quitado de en medio:

- **El campo de evidencias ya no está siempre abierto.** Era el 40 % del alto de cada ítem y casi siempre estaba vacío. Ahora se abre solo cuando importa: en las notas 0 y 2, donde es obligatorio, y cuando ya hay algo escrito. También a mano, con el botón de cada fila.
- **La pregunta de ayuda tampoco.** Útil la primera vez, ruido la décima. Está bajo el mismo botón, y hay un «Ver las preguntas» que las despliega todas de golpe.
- **La etiqueta de nivel bajo cada fila** («En línea con las expectativas») repetía lo que ya dice el botón marcado. Se ha movido dentro del detalle.
- **Los cuatro bloques dejan de ser cuatro tarjetas** con su padding: ahora son cabeceras finas dentro de una sola tarjeta.
- **El factor de cada KPI** era un recuadro de color relleno. Cinco de ellos en la misma tabla eran lo más ruidoso de la pantalla; ahora es el número coloreado, sin caja.

Qué se ha añadido:

- **Barra de progreso**: «9 de 14 valorados · faltan 5».
- **El panel del bonus se queda fijo** mientras puntúas, así que ves moverse la cifra en vez de tener que subir a buscarla.
- **En móvil y tablet el listado lateral de 21 tiendas desaparece** y se cambia de tienda con un desplegable. Antes ocupaba la pantalla entera antes de llegar al trabajo.
- **El lateral pasa de 63 etiquetas de color a 63 puntos**: la misma información, una fracción del ruido.

## 0.14.0 · 03/10/2026 · **SQL: sí** (`supabase/migracion_0.14.sql`)

Todos los apartados de la portada quedan en marcha. Desaparece el bloque «En preparación».

**Formaciones: cinco cursos completos.** Al Circuito de Venta se suman KPIs Retail, Visual Merchandising, P&L y Gestión de equipos, cada uno con cinco paradas en el mismo formato (idea, qué haces, frases que ayudan, cuidado con) y un test final de cinco preguntas corregido en pantalla, con la explicación de cada respuesta. El progreso y el resultado del test quedan registrados por persona. La chuleta y la impresión funcionan para cualquier curso. El contenido está escrito para la red Home & Cook y conviene que Operaciones lo revise.

**Process Book.** Doce procesos de tienda (apertura, cierre, caja, devoluciones, recepción, inventario, mermas, cambio de campaña, incidencias, demo, acogida y horarios) como listas paso a paso que se marcan desde el móvil mientras se hacen; las marcas se reinician cada día. Buscador, impresión por ficha y edición desde la propia plataforma por RR.HH.: lo que se guarda lo ve toda la red al momento y siempre se puede volver a la versión base. Nueva tabla `documentos`.

**Política de RR.HH.** Trece fichas en lenguaje claro: fichaje y descansos, horarios, vacaciones, permisos retribuidos, baja médica, nacimiento y cuidado de menores, uniformidad, móvil y datos, compras de empleado, gastos, respeto y canal de denuncias, formación y dónde preguntar. Cifras del Estatuto de los Trabajadores vigente; marcado como borrador hasta que lo valide asesoría laboral. Mismo motor y misma edición que el Process Book.

**PRL.** Por tienda: formación de prevención de cada persona con su caducidad (básica, cargas, escaleras, emergencias, primeros auxilios), revisiones del local (evaluación de riesgos, simulacro, extintores), fecha del reconocimiento médico e incidencias con o sin baja. Cuadro de mando de la red con plantilla al día, vencimientos e incidencias del año. Datos en `datos.prl` de cada tienda, con los permisos de siempre. No se guarda el resultado del reconocimiento ni ninguna lesión: no hay campo para ello.

**People Data Centre: ya se cargan los datos.** Pegando desde Excel (reconoce las columnas por su nombre, previsualiza y avisa de lo que no cuadra), subiendo un CSV o con un formulario de un mes para una tienda. Plantilla CSV descargable con las 21 tiendas. Gráficos de tendencia mensual (facturación, productividad, conversión) y ranking de productividad por tienda frente a la media. Pasa de «En diseño» a «En marcha».

**Portada: «Para hoy».** Un bloque con lo que pide atención en todos los apartados, calculado con lo que ya está cargado: evaluaciones completas sin cerrar, objetivos sin validar, riesgo de salida sin acción, bajas de más de 30 días, formación de prevención vencida, revisiones del local, códigos sin responder, meses sin cargar y formaciones pendientes. Cada aviso abre el sitio donde se resuelve.

**Búsqueda rápida** en la cabecera: una tienda, una persona, un apartado, un curso o una ficha del Process Book, y abre directamente. Enter va al primer resultado.

**Bajas y absentismo**: dos gráficos nuevos, días perdidos por mes y tasa mensual frente al objetivo.

**Psicotécnicos pasa a llamarse Pruebas situacionales**, que es lo que son. Solo cambia el nombre.

## 0.14.1 · 05/10/2026 · **SQL: no**

- **El aviso del modo demostración listaba usuarios que ya no existen** (`rm.norte`, `rm.centro`, `rm.sur`, de una versión anterior). Los que crea hoy son `admin`, `rm.es`, `rm.pt` y `marketing`. Quien abría `?demo` y los copiaba recibía «Usuario o contraseña incorrectos». Corregido en los tres idiomas, y el aviso explica además cómo volver al acceso real quitando `?demo` de la dirección.

## 0.15.0 · 06/10/2026 · **SQL: no**

El menú pasa de **catorce tarjetas a seis**. No se ha quitado ninguna función: lo que antes era un apartado suelto ahora es una pestaña dentro del apartado que le corresponde.

| Apartado | Pestañas |
|---|---|
| **Evaluación y Desarrollo** | Scorecard · Consolidado (RR.HH.) · Talent Matrix · Mapa 9-Box (RR.HH.) · Onboarding · Offboarding |
| **People Data Centre** | — |
| **PRL** | Bajas y absentismo · Prevención · Clima |
| **Formaciones** | Formaciones · Pruebas situacionales |
| **Process Book y Políticas** | Process Book · Políticas |
| **HomeTime** | enlace externo |

Más, en detalle:

- **Mystery Shopper sale del menú.** Las campañas y respuestas que hubiera siguen en la base de datos intactas; simplemente ya no hay tarjeta que las abra. Si algún día se quiere recuperar, es una línea de código. Retail Marketing, que antes veía People Data Centre y Mystery Shopper, ahora solo ve el primero.
- **La tarjeta del People Data Centre pierde la lista de KPIs** (productividad por hora trabajada, headcount por hora de apertura…). Se veía bien en la portada pero cargaba la tarjeta de texto que solo importa una vez dentro.
- **Las pestañas van en su propia fila**, bajo la cabecera, con la activa subrayada en rojo. Con seis pestañas ya no caben al lado del nombre del apartado, y así se comportan igual en móvil y en escritorio.
- **El resumen de cada tarjeta se ha rehecho** para que resuma el conjunto: Evaluación y Desarrollo muestra cierres anuales y fichas de talento; PRL, absentismo y formación de prevención al día; Formaciones, cursos completados y pruebas respondidas; Process Book y Políticas, cuántas fichas hay de cada uno.
- **Internamente**, la pestaña del apartado pasa a vivir en `S.tab`, separada de `S.vista`, que queda solo para las vistas internas de Formaciones (recorrido, chuleta, test, práctica con IA y arcade). Antes compartían variable y al agrupar habrían chocado.
- **Arreglado en el modo demostración**: al abrir un cuestionario con código, las respuestas se devolvían por referencia, así que ir respondiendo modificaba la fila guardada antes de pulsar Enviar. Ahora se devuelve una copia. En Supabase real nunca pasó, porque los datos viajan por la red.

## 0.15.1 · 06/10/2026 · **SQL: no**
Portada: jerarquía visual.
- Cabecera en una sola fila: logotipo Home & Cook y título a la izquierda, sello Groupe SEB a la derecha. Antes los dos logotipos quedaban apilados y descolocados.
- "Para hoy" pasa a una fila por aviso: el texto ya no se parte en tres líneas y el apartado de destino queda alineado a la derecha. Contador de lo urgente junto al título y filo rojo cuando hay algo que no es informativo.
- El pie de cada tarjeta deja de ser rojo. El rojo pasa a significar algo: cada tarjeta lleva un contador de lo que pide atención en ese apartado, enlazado con "Para hoy".
- "Usuarios y tiendas" deja de ser una tarjeta huérfana en su propia fila y pasa a una barra de gestión bajo la rejilla.
- HomeTime deja el borde discontinuo (parecía sin terminar) y se distingue por fondo.

## 0.16.0 · 06/10/2026 · **SQL: no**
Navegación de dos niveles y sello de Groupe SEB en la cabecera.
- El sello de Groupe SEB deja la portada y pasa a la cabecera, junto a RRHH ✕ Home&Cook, a 38 px.
- Al entrar en un apartado con varias pantallas se ve primero su índice, con las mismas tarjetas de la portada: título, descripción y un dato real de cada pantalla. Las pestañas de arriba siguen estando para saltar directo.
- Botón "Atrás" en la cabecera, que sube un nivel cada vez: pantalla → índice del apartado → portada. Cuando el botón ya dice el nombre del apartado, deja de repetirse al lado.
- People Data Centre y PRL intercambian su sitio en la portada. El título de People Data Centre pasa a dorado, igual que HomeTime va en azul.
- Descripciones nuevas en los tres idiomas para Consolidado, Mapa 9-Box, Prevención, Offboarding y Formaciones.

## 0.16.1 · 06/10/2026 · **SQL: no**
- En la cabecera, arriba a la izquierda, queda solo el logotipo de Groupe SEB, en el sitio que ocupaba el de Home & Cook. El de Home & Cook sigue presidiendo la portada.

## 0.17.0 · 06/10/2026 · **SQL: no**
Borrar y vaciar en las encuestas y pruebas (Clima, Pruebas situacionales, Onboarding y Offboarding).
- **Borrar** en cada fila de la tabla de códigos. Si el código ya está respondido, el aviso dice que esa respuesta se pierde.
- **Borrar los N sin responder**, en la cabecera de la tabla: limpia los códigos que nadie ha contestado y deja intactas las respuestas recibidas. Sirve para repetir un reparto sin perder lo ya recogido.
- **Borrar campaña**, junto a "Nueva campaña": se lleva la campaña, sus códigos y sus respuestas. Pide escribir BORRAR.
- Todo esto solo para el administrador, igual que la política de la base de datos, que ya permitía borrar solo a admin. No ha hecho falta tocar SQL.
- Las confirmaciones pasan a hacerse dentro de la página, no con el diálogo del navegador: en algunos entornos `confirm()` devuelve "no" sin llegar a preguntar, y una acción que borra datos no puede depender de eso. Cerrar una campaña usa ya el mismo cuadro.

## 0.18.0 · 06/10/2026 · **SQL: SÍ** — ejecuta `supabase/migracion_0.17.sql`
El código de acceso ahora hay que teclearlo, y se puede invitar a una persona que no es usuaria de la plataforma.
- **El enlace del correo ya no lleva el código dentro.** Antes abría la prueba directamente, así que el código no servía de nada y un correo reenviado daba acceso a la prueba de otra persona. Ahora el enlace lleva a la pantalla de acceso y hay que escribir el código.
- **Alta temporal de la persona**: nombre, puesto y correo al generar el código, sin que tenga que ser usuaria de la plataforma. Se borra con la campaña.
- **Enviar correo** desde la fila: abre tu cliente de correo con destinatario, asunto y mensaje puestos. El envío sale de tu buzón, con tu firma.
- **Ver respuestas también en las encuestas anónimas**: se ve lo que contestó cada código, nunca quién lo usó, con el aviso puesto en la propia ficha.
- Corregido: la ficha de respuestas se rompía en cuanto la plantilla llevaba una pregunta de eNPS, como la de clima. Daba por hecho que todas las preguntas tienen opciones.
- Corregido: en las formaciones, la lista de «Cuidado con» se salía de su columna y se montaba encima de «Qué haces». La clase `ojo` se llamaba igual que el botón que enseña la contraseña en el acceso, que va posicionado en absoluto. Renombrada a `cuidado`.

## 0.19.0 · 06/10/2026 · **SQL: SÍ** — vuelve a ejecutar `supabase/migracion_0.17.sql`
Las formaciones se pueden enviar a gente que no tiene cuenta, con el mismo circuito que la Encuesta de Clima.
- Pestaña nueva en Formaciones: **Enviar a tienda**. RR.HH. crea una campaña eligiendo el curso, genera un código por persona (nombre, puesto y correo) y lo envía.
- Quien recibe el código lee el curso pantalla a pantalla desde su móvil, con Anterior y Siguiente, y al final hace el test. Puede volver al curso desde el test.
- Al enviar ve **su nota y la corrección**: qué contestó, cuál era la respuesta correcta y por qué. En una formación eso es el contenido, no un extra. Se aprueba con el 60 %.
- La nota vuelve a la plataforma: participación, resultado medio, resultado por pregunta y por tienda, los mismos cuadros que ya existían.
- El test de cada curso se convierte en una plantilla igual que las demás, así que puntuar, ver respuestas, enviar el correo y borrar funcionan sin código nuevo. El Circuito de Venta queda fuera porque no tiene test.
- La migración 0.17 añade `formacion` a los tipos de campaña permitidos. Si ya la habías ejecutado, vuelve a pasarla: está escrita para poder repetirse.

## 0.19.1 · 06/10/2026 · **SQL: no**
Repartir los códigos de una encuesta anónima, sin romper el anonimato.
- Tarjeta **Repartir en la tienda** en las campañas anónimas: eliges la tienda y obtienes, o bien un único mensaje con todos sus códigos sin usar para mandárselo al responsable, o bien las papeletas listas para imprimir y recortar.
- No hay envío individual por correo en las anónimas, y es deliberado: mandar un código a cada persona deja en tu bandeja de enviados qué código tiene quién, que es justo lo que la encuesta promete no saber. El aviso lo explica en la propia pantalla.
- En las campañas nominativas (pruebas situacionales, onboarding, offboarding, formaciones) sigue estando el envío persona a persona, que ahí sí tiene sentido.

## 0.20.0 · 06/10/2026 · **SQL: no**
La encuesta de clima puede ser anónima o con nombre, y el equipo de cada tienda vive en la plataforma.
- **Dos versiones de cada encuesta de clima.** Al crear la campaña eliges plantilla: «anónima» (la de siempre, intacta) o «con nombre». En la nominativa, la primera pantalla que ve la persona dice sin rodeos que su nombre va asociado a sus respuestas y quién las lee. No se promete lo que no se puede cumplir.
- **Tiendas y equipos de tienda**, apartado nuevo en Usuarios y tiendas: nombre, puesto y correo de cada persona de sala, editable en la propia tabla. No son usuarios de la plataforma ni entran en el Scorecard. Botón para traer el SM y el ASM del Scorecard sin volver a teclearlos, y descarga en CSV.
- **Generar códigos desde el equipo**: en las campañas con nombre sale la lista de la tienda con casillas. Quien no tiene correo o ya tiene código aparece desactivado, así que no se duplica ni se genera un código que no se puede enviar.
- **Añadir a una persona a mano** sigue estando, para quien no está en la libreta.
- **Enviar a todos los pendientes**: abre un correo por persona, con un respiro entre uno y otro.
- En las campañas anónimas no aparece nada de esto: solo el reparto en tienda de la 0.19.1.

## 0.21.0 · 06/10/2026 · **SQL: SÍ** — `supabase/migracion_0.20.sql`, y hay que montar la función
Envío real de correos desde una dirección de la empresa.
- **Función `enviar-invitacion`** en Supabase (Edge Function), en `supabase/funciones/`. La plataforma es un sitio estático y no puede enviar nada por sí misma; la clave del proveedor de correo tampoco puede estar en el navegador. La función hace las dos cosas.
- Antes de enviar comprueba: lee las invitaciones **con la sesión de quien llama**, así que las políticas de la base de datos ya filtran (un RM solo escribe a su gente); si alguna no le sale, no envía ninguna; no envía a campañas cerradas, a quien ya respondió, ni a direcciones mal formadas; máximo 50 por llamada.
- **`correoDirecto` en config.js**: con `false` (por defecto) el botón abre tu programa de correo, como hasta ahora. Con `true` envía la plataforma. Nada se rompe mientras no esté montado.
- Columna **`enviado`**: la tabla de códigos dice cuándo se envió cada uno y el botón pasa a decir «Reenviar». La escribe la función; la plataforma sigue sin tener permiso de UPDATE sobre invitaciones.
- **`supabase/CORREO.md`**: el paso a paso completo, incluido lo que tiene que hacer IT con el DNS.

## 0.22.0 · 07/10/2026 · **SQL: no**
Seguimiento de formaciones: pestaña nueva en Formaciones.
- **Enviar a tienda** mira una campaña; **Seguimiento** las mira todas a la vez, que es la pregunta de una reunión de RR.HH.: quién de la red ha hecho qué y quién no.
- Arriba, cuatro datos: formaciones hechas sobre enviadas, cuántas superadas, nota media y cuántas quedan pendientes (con cuántas ni siquiera se han enviado).
- **Matriz de tiendas por curso**, con el color puesto: verde si la tienda lo tiene todo hecho, ámbar si va a medias, rojo si no ha empezado.
- **Tabla de personas** filtrable por tienda, curso y estado, con la nota, la fecha y el botón para ver sus respuestas o reenviarle el código.
- **Recordar a los pendientes**: un botón que escribe a todos los que aún no la han hecho. Usa el envío directo si está configurado, y si no, abre el correo.
- **Descargar CSV** de todo el seguimiento, para el informe de formación o para RR.HH. corporativo.
- Cada Regional Manager ve solo a la gente de sus tiendas; el administrador, toda la red.

## 0.22.1 · 07/10/2026 · **SQL: no**, pero hay que volver a desplegar la función
- **Botón Actualizar** en las campañas. La pantalla se pintaba con lo que había al entrar, así que quien respondía mientras tú mirabas no aparecía hasta recargar el navegador. Ahora se piden las respuestas nuevas y te dice cuántas han llegado.
- **Correo rediseñado**: maquetado con tablas, que es lo único que Outlook renderiza igual que el resto; filete rojo SEB arriba, la marca en tipografía, el código en su propia caja, botón sólido, firma con el apartado y pie con las marcas del grupo. Sin imágenes remotas, por dos motivos: la mayoría de los clientes las bloquean y, además, la plataforma está en privado, así que un logotipo alojado ahí no cargaría.
- Comprobado a 760 y a 400 píxeles: sin desbordes. La dirección larga ya parte de línea, que era lo que descuadraba el móvil.

## 0.23.0 · 08/10/2026 · **SQL: no**
Formación: un solo formato, el Circuito medible y caducidad anual.
- **Fuera el role play con IA.** No encajaba y, sobre todo, no funcionaba: necesita el entorno de claude.ai, así que en Netlify y en GitHub Pages enseñaba un recuadro de error. Borrado el módulo entero, no escondido.
- **El Circuito de Venta ya tiene test**: siete preguntas, una por parada, con la corrección explicada. Era la única formación para todo el equipo y la única que no se podía enviar ni medir. Ahora se envía como las demás.
- **Caducidad anual**: una formación hecha en una campaña de un año anterior aparece como «Caducada» y deja de contar como vigente, ni en los contadores ni en la matriz. El seguimiento carga también el año anterior para poder decirlo. El recordatorio no las toca: una caducada necesita campaña nueva, no un reenvío.
- **Repartir en la tienda, también en las formaciones**: el mensaje para el responsable lleva cada código con el nombre de su persona, y las papeletas imprimibles salen con el nombre encima. Es la vía para quien no tiene correo, que en tienda son la mayoría.
- El cliente de demostración aprende `gte`, `lte` e `in`, que le faltaban.

## 0.24.0 · 09/10/2026 · **SQL: no**
Formación nueva: **Un turno seguro**, un escape room de PRL.
- Cuatro dependencias de la tienda — trastienda, sala de venta, zona de caja y almacén alto — con 17 riesgos escondidos entre objetos que están bien puestos. Acertar es distinguirlos, no pulsar todo.
- Cada sala completa da una llave; con las cuatro se abre la taquilla, que son tres preguntas con corrección explicada. El resultado queda en el progreso del curso.
- Al final, el listado de los 17 riesgos por sala con qué se hace en cada caso, imprimible para colgar en la trastienda.
- Las salas van dibujadas en SVG, no en imágenes: pesan unos kilobytes en lugar de megabytes, se ven nítidas en cualquier pantalla y no dependen de ningún banco de imágenes. Los puntos van en porcentajes, así que el día que haya fotos de una tienda real solo se cambia el fondo.
- **Todavía no se puede enviar a externos.** El progreso vive en el navegador, no en la invitación. Hacerlo enviable es otra pieza.

## Cómo numerar
- Cambio de textos o estilos: sube el tercer número (0.9.1).
- Apartado nuevo o cambio de funcionamiento: el segundo (0.10.0).
- Cuando entre en producción con datos reales: 1.0.0.
