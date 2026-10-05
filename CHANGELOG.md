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

## Cómo numerar
- Cambio de textos o estilos: sube el tercer número (0.9.1).
- Apartado nuevo o cambio de funcionamiento: el segundo (0.10.0).
- Cuando entre en producción con datos reales: 1.0.0.
