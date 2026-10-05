"use strict";
/* ===================== PROCESS BOOK Y POLÍTICA: CONTENIDO BASE =====================
   Es la versión que ve la red si RR.HH. todavía no ha editado nada en la
   plataforma. En cuanto RR.HH. guarda una edición, manda la copia de la base
   de datos y esta queda como "versión base" a la que se puede volver.

   BORRADOR: los procesos están escritos para una tienda outlet Home & Cook
   tipo y hay que contrastarlos con Operaciones. Las cifras de la política
   salen del Estatuto de los Trabajadores (texto vigente tras el RDL 5/2023);
   el convenio colectivo de comercio de cada provincia puede mejorarlas y, si
   lo hace, manda el convenio. Portugal se rige por el Código do Trabalho.
   ================================================================================= */
const DOCS_BASE = {
  process: {
    titulo: "Process Book", intro: "Los procesos de tienda, paso a paso, para consultarlos en el móvil mientras se hacen. Marca cada paso según avanzas: la lista se reinicia cada día.",
    grupos: ["Apertura y cierre", "Caja", "Producto y stock", "Cliente", "Equipo"],
    items: [
      { id: "apertura", grupo: "Apertura y cierre", t: "Apertura de la tienda", quien: "Responsable del turno de mañana", cuando: "Cada día, 30 minutos antes de abrir",
        resumen: "Media hora antes de abrir, en este orden. Si falta alguien, se abre igual con lo imprescindible: alarma, caja, luces y mesa.",
        pasos: [
          "Desconectar la alarma y encender luces de sala, escaparate y rótulo.",
          "Recorrido de seguridad: salidas despejadas, extintores visibles, nada en el suelo.",
          "Encender TPV, datáfono y contador de tráfico; comprobar que comunican.",
          "Contar el fondo de caja y anotarlo en la hoja de apertura.",
          "Diez minutos de visual: cristal, mesa de entrada completa con precios, lineal de campaña con facing.",
          "Comprobar que las muestras están enchufadas, limpias y con accesorios.",
          "Revisar correo y comunicados de central: cambios de precio o promociones de hoy.",
          "Repasar con el equipo el foco del día: un dato de ayer y una acción para hoy.",
          "Abrir la puerta a la hora en punto."
        ],
        claves: ["La hora de apertura se cumple aunque falte algo por hacer.", "Un cambio de precio comunicado por central se aplica antes de abrir, no a lo largo del día."] },
      { id: "cierre", grupo: "Apertura y cierre", t: "Cierre de la tienda", quien: "Responsable del turno de tarde", cuando: "Cada día, desde 15 minutos antes de cerrar",
        resumen: "El cierre empieza antes de cerrar la puerta y termina cuando la tienda está lista para abrir mañana.",
        pasos: [
          "Quince minutos antes: aviso en sala de que la tienda cierra, sin apagar nada todavía.",
          "Cerrar la puerta a la hora; atender a quien ya está dentro hasta el final.",
          "Cierre de caja: arqueo, cuadre con el TPV y registro de cualquier diferencia (ver proceso de caja).",
          "Cierre del datáfono y comprobación de que el total coincide con el TPV.",
          "Reposición de mesa y lineal de campaña: la tienda se deja como se quiere abrir.",
          "Apagar muestras, luces de sala y TPV; el escaparate según la consigna del centro.",
          "Recorrido final: trastienda, aseos, puertas de emergencia y ventanas.",
          "Conectar la alarma y cerrar. Anotar la hora de salida."
        ],
        claves: ["Nadie se va con la caja sin cuadrar o con la mesa vacía.", "Las diferencias de caja se registran el mismo día, nunca se arrastran."] },
      { id: "caja", grupo: "Caja", t: "Caja: arqueo y diferencias", quien: "Quien cierra la caja", cuando: "Al cierre y en cada cambio de cajero",
        resumen: "La caja cuadra o se explica por qué no cuadra. Las dos cosas se escriben el mismo día.",
        pasos: [
          "Contar efectivo delante de otra persona cuando sea posible.",
          "Comparar efectivo y tarjeta con el informe Z del TPV.",
          "Si cuadra: firmar la hoja de arqueo y guardar el efectivo según el procedimiento de la tienda.",
          "Si no cuadra: recontar, revisar tickets anulados, devoluciones y cambios del día.",
          "Registrar la diferencia con fecha, importe y quién ha estado en caja. Avisar al Store Manager si supera 20 €.",
          "Nunca cubrir una diferencia con dinero propio ni dejarla para el día siguiente."
        ],
        claves: ["Una diferencia pequeña registrada es normal; una diferencia sin registrar es un problema.", "Los tickets anulados se guardan con el motivo escrito."] },
      { id: "devoluciones", grupo: "Caja", t: "Devoluciones y garantías", quien: "Todo el equipo", cuando: "Cuando un cliente trae un producto",
        resumen: "Primero la persona, después la norma. Casi siempre hay una salida que el cliente puede aceptar.",
        pasos: [
          "Escuchar sin interrumpir y, si hay público, llevar al cliente a un lado.",
          "Identificar el caso: devolución por desistimiento, cambio, garantía técnica o reclamación.",
          "Buscar el ticket: en papel, por tarjeta de fidelización o por pago con tarjeta.",
          "Garantía técnica: comprobar el producto, abrir la incidencia en el sistema y explicar plazos.",
          "Devolución sin ticket: aplicar la política vigente de la tienda y ofrecer siempre la alternativa (vale, cambio).",
          "Registrar la operación en el TPV con el motivo correcto: afecta a las mermas y al margen.",
          "Despedir con algo claro: qué se ha hecho, qué pasa ahora y cuándo."
        ],
        claves: ["La política de devoluciones vigente está en caja, impresa y actualizada.", "Un cliente que sale con una solución vuelve; uno que sale con una norma, no."] },
      { id: "recepcion", grupo: "Producto y stock", t: "Recepción de mercancía", quien: "Responsable del turno", cuando: "Cada entrega",
        resumen: "Lo que no se cuenta al recibirlo aparece después como diferencia de inventario.",
        pasos: [
          "Comprobar bultos y estado del envío antes de firmar al transportista; anotar incidencias en el albarán.",
          "Contar referencias frente al albarán el mismo día de la entrega.",
          "Registrar la entrada en el sistema y marcar las diferencias.",
          "Comunicar a central las faltas o roturas con foto en 24 horas.",
          "Ubicar el producto: primero lineal y mesa de campaña, después almacén por familia.",
          "Retirar embalajes y dejar la zona de recepción despejada."
        ],
        claves: ["Firmar sin contar es aceptar lo que venga.", "Las roturas con foto se abonan; sin foto, se discuten."] },
      { id: "inventario", grupo: "Producto y stock", t: "Inventario", quien: "Store Manager y equipo", cuando: "Según calendario de central y recuentos cíclicos",
        resumen: "El inventario pesa un 10 % en el Scorecard y, sobre todo, es la foto de cómo se gestiona el stock cada día.",
        pasos: [
          "La semana anterior: almacén ordenado por familia y todo el producto etiquetado.",
          "El día antes: registrar todas las entradas, salidas y devoluciones pendientes.",
          "Contar por zonas con parejas; una cuenta, otra anota. Sin saltarse zonas.",
          "Recontar las referencias con diferencia antes de cerrar el recuento.",
          "Analizar las diferencias por familia: buscar el patrón (robo, error de entrada, devoluciones mal registradas).",
          "Enviar el informe a central y al Regional Manager con las causas identificadas y una acción por causa."
        ],
        claves: ["Un recuento cíclico mensual de las familias de más valor evita sorpresas en el inventario anual.", "La diferencia no se ajusta y se olvida: se investiga."] },
      { id: "mermas", grupo: "Producto y stock", t: "Mermas y roturas", quien: "Todo el equipo", cuando: "En el momento en que se produce",
        resumen: "Cada producto que se rompe, se daña o se queda sin caja es margen que se pierde. Se registra en el momento, no a final de mes.",
        pasos: [
          "Apartar el producto dañado y etiquetarlo con fecha y causa.",
          "Registrar la merma en el sistema con el motivo (rotura, caducidad, demo, robo detectado).",
          "Producto de demo: darlo de alta como demo cuando se saca de la caja, no cuando se retira.",
          "Revisar una vez por semana la zona de mermas con el Store Manager y decidir destino (devolución, outlet, baja).",
          "Comparar la merma mensual con el objetivo y comentar las causas con el equipo."
        ],
        claves: ["La merma no registrada aparece como diferencia de inventario y nadie sabe de dónde salió."] },
      { id: "campana", grupo: "Producto y stock", t: "Cambio de campaña", quien: "Store Manager", cuando: "Al recibir el plan comercial",
        resumen: "El plan comercial llega con fecha de inicio. El cambio de campaña se hace en las 48 horas siguientes, en este orden.",
        pasos: [
          "Leer el plan entero y apuntar: foco de gama, promociones, precios que cambian y cartelería que llega.",
          "Pedir a central lo que falte (cartelería, muestras) el mismo día.",
          "Retirar la cartelería anterior la noche antes del inicio.",
          "Montar escaparate, mesa de entrada y lineal de campaña antes de abrir el primer día.",
          "Comprobar en caja que los precios y promociones nuevas están cargados.",
          "Explicar la campaña al equipo: qué se vende, por qué y con qué argumento. Foto a Regional Manager."
        ],
        claves: ["Ningún cartel de promoción cuelga sin que el precio esté cargado en caja."] },
      { id: "incidencias", grupo: "Cliente", t: "Incidencias y reclamaciones", quien: "Responsable del turno", cuando: "Cuando se produce",
        resumen: "Una reclamación bien gestionada es una oportunidad de fidelizar. Una mal gestionada llega a redes antes que a RR.HH.",
        pasos: [
          "Atender en el momento, en privado, y escuchar entera la queja.",
          "Decir qué se puede hacer de verdad, aunque no sea lo que pide el cliente.",
          "Si pide la hoja de reclamaciones oficial, entregarla sin discutir: es un derecho.",
          "Registrar la incidencia en el sistema con fecha, motivo y solución dada.",
          "Avisar al Store Manager el mismo día; si afecta a la seguridad o a un empleado, al Regional Manager también.",
          "Revisar las incidencias del mes en la reunión de equipo: patrones y acciones."
        ],
        claves: ["Nunca se discute una queja delante de otros clientes.", "Las reseñas públicas se responden desde central; en tienda, se resuelve."] },
      { id: "demo", grupo: "Cliente", t: "Demostración en tienda", quien: "Todo el equipo", cuando: "En las horas de más tráfico",
        resumen: "La demo vende sola, pero solo si está preparada. Diez minutos de preparación y una regla: el cliente toca el producto.",
        pasos: [
          "Elegir el producto de demo según el foco de campaña y tenerlo listo: enchufado, limpio y con lo que necesita (agua, ingredientes, tela).",
          "Programar la demo en las franjas de más tráfico, no cuando la tienda está vacía.",
          "Invitar a quien pasa con una pregunta, no con un discurso: \"¿Ha probado alguna vez un robot de cocina?\".",
          "Dejar que el cliente lo use: enciende, prueba, siente el resultado.",
          "Cerrar con una pregunta de aceptación y, si compra, el complemento.",
          "Limpiar y dejar la demo lista para la siguiente persona."
        ],
        claves: ["Una demo sucia o sin accesorios vende lo contrario de lo que queremos."] },
      { id: "acogida", grupo: "Equipo", t: "Acogida de una persona nueva", quien: "Store Manager", cuando: "Desde antes del primer día hasta el día 30",
        resumen: "Dos horas de preparación evitan una selección entera. Lo que vive la persona en su primera semana decide su primer año.",
        pasos: [
          "Antes del primer día: uniforme, taquilla, accesos al TPV y padrino asignado. Avisar al equipo de quién llega y cuándo.",
          "Primer día: recibirla, presentar al equipo, enseñar la tienda y explicar qué se espera de ella esta semana. Formación de PRL básica.",
          "Primera semana: siempre acompañada en sala, una cosa nueva al día (acogida, detección, demo, caja).",
          "Semana dos y tres: empezar el Circuito de Venta en la plataforma y practicar con el padrino.",
          "Cada viernes: cinco minutos con el Store Manager: qué ha costado, qué ha faltado.",
          "Día 30: recibirá el código de la encuesta de onboarding; leer la respuesta y ajustar la acogida del siguiente."
        ],
        claves: ["Nunca sola en sala el segundo día, por mucha cola que haya."] },
      { id: "horarios", grupo: "Equipo", t: "Horarios y cambios de turno", quien: "Store Manager", cuando: "Cada semana, el mismo día",
        resumen: "El horario se publica con dos semanas de antelación y se construye sobre el tráfico de la tienda.",
        pasos: [
          "Mirar el reparto de tráfico por franja en el People Data Centre antes de planificar.",
          "Repartir fines de semana, tardes y festivos con equidad y a la vista de todos.",
          "Publicar el horario en HomeTime y avisar al equipo el mismo día cada semana.",
          "Cambios entre compañeros: se piden antes del miércoles y se aprueban si la franja queda cubierta.",
          "Imprevistos: pedir, no imponer; compensar en la semana siguiente y anotar en la bolsa de horas.",
          "Revisar la bolsa de horas de cada persona cada mes y compensarla antes de que crezca."
        ],
        claves: ["Horario tarde = ítem del Scorecard y primera queja del clima."] }
    ]
  },

  politica: {
    titulo: "Política de RR.HH.", intro: "Las normas que el equipo de tienda consulta a diario, en lenguaje claro. Si tu convenio mejora lo que pone aquí, manda el convenio.",
    grupos: ["Tiempo de trabajo", "Ausencias y permisos", "En la tienda", "Dinero y medios", "Personas"],
    aviso: "Borrador para validar por RR.HH. y asesoría laboral. Las referencias legales son las del Estatuto de los Trabajadores vigente en España; el convenio de comercio de cada provincia y, en Portugal, el Código do Trabalho pueden mejorarlas.",
    items: [
      { id: "fichaje", grupo: "Tiempo de trabajo", t: "Fichaje y descansos", quien: "Todo el equipo",
        resumen: "El registro de jornada es obligatorio por ley para todas las personas, todos los días. Se ficha al entrar y al salir, también en las pausas largas.",
        puntos: [
          "Se ficha al entrar y al salir en el sistema de la tienda. Olvidar un fichaje se comunica al Store Manager el mismo día para corregirlo.",
          "En jornadas de más de seis horas seguidas hay un descanso mínimo de quince minutos. El convenio puede ampliarlo y decir si cuenta como trabajo.",
          "Entre el final de una jornada y el inicio de la siguiente hay al menos doce horas.",
          "El descanso semanal es de día y medio seguido como mínimo; en comercio suele acumularse por periodos según convenio.",
          "El registro de jornada se conserva cuatro años y cada persona puede pedir el suyo."
        ],
        quienAcudir: "Store Manager para correcciones; RR.HH. para consultar tu registro.",
        ref: "Estatuto de los Trabajadores, art. 34 (jornada y registro) y 37.1 (descanso semanal)." },
      { id: "horarios", grupo: "Tiempo de trabajo", t: "Horarios, turnos y cambios", quien: "Todo el equipo",
        resumen: "El horario se publica con antelación y los cambios se piden, no se improvisan.",
        puntos: [
          "El horario se publica con al menos dos semanas de antelación, el mismo día de cada semana.",
          "Fines de semana, tardes y festivos se reparten con equidad dentro del equipo.",
          "Los cambios entre compañeros se solicitan al Store Manager antes del miércoles de la semana anterior y se aprueban si la franja queda cubierta.",
          "Las horas de más o de menos se anotan en la bolsa de horas y se compensan dentro del mes siguiente.",
          "Las horas extraordinarias son voluntarias salvo pacto, se autorizan antes por el Store Manager y se compensan según convenio."
        ],
        quienAcudir: "Store Manager; si no hay acuerdo, Regional Manager.",
        ref: "Estatuto de los Trabajadores, art. 34 y 35." },
      { id: "vacaciones", grupo: "Ausencias y permisos", t: "Vacaciones", quien: "Todo el equipo",
        resumen: "Treinta días naturales al año como mínimo, que se disfrutan dentro del año y se planifican con el equipo.",
        puntos: [
          "Mínimo legal: 30 días naturales por año completo trabajado; proporcional si entras o sales durante el año. El convenio puede mejorarlo.",
          "El calendario de vacaciones se cierra de común acuerdo con el Store Manager y se conoce al menos con dos meses de antelación.",
          "En campaña (noviembre y diciembre, rebajas) se limita el número de personas de vacaciones a la vez; se comunica cada año.",
          "Las vacaciones no se pagan en dinero salvo al terminar el contrato.",
          "Si una baja médica o de nacimiento coincide con las vacaciones, se pueden disfrutar después, con los plazos que marca la ley.",
          "Portugal: 22 días hábiles al año según el Código do Trabalho."
        ],
        quienAcudir: "Store Manager para el calendario; RR.HH. para dudas de cómputo.",
        ref: "Estatuto de los Trabajadores, art. 38. Código do Trabalho, art. 238." },
      { id: "permisos", grupo: "Ausencias y permisos", t: "Permisos retribuidos", quien: "Todo el equipo",
        resumen: "Días que se pueden faltar cobrando, avisando antes y justificando después. Son los mínimos de la ley; tu convenio puede dar más.",
        puntos: [
          "Matrimonio o registro como pareja de hecho: 15 días naturales.",
          "Accidente o enfermedad grave, hospitalización o intervención sin hospitalización con reposo domiciliario, de cónyuge, pareja de hecho o familiar hasta segundo grado: 5 días.",
          "Fallecimiento de cónyuge, pareja de hecho o familiar hasta segundo grado: 2 días, 4 si hay que desplazarse.",
          "Traslado del domicilio habitual: 1 día.",
          "Deber público inexcusable (juicio, mesa electoral): el tiempo indispensable.",
          "Exámenes prenatales y preparación al parto, y trámites de adopción o acogimiento: el tiempo indispensable.",
          "Fuerza mayor familiar urgente (enfermedad o accidente que exija presencia inmediata): hasta 4 días al año, retribuidas las horas equivalentes.",
          "Lactancia de menor de nueve meses: una hora de ausencia al día, divisible, o acumulable en jornadas completas según convenio o acuerdo.",
          "Cómo se pide: aviso al Store Manager en cuanto se conozca y justificante en los tres días siguientes."
        ],
        quienAcudir: "Store Manager; RR.HH. para los permisos de más de dos días.",
        ref: "Estatuto de los Trabajadores, art. 37.3, 37.4 y 37.9." },
      { id: "bajas", grupo: "Ausencias y permisos", t: "Baja médica: qué hacer", quien: "Todo el equipo",
        resumen: "Si estás de baja, avisa el primer día. El parte ya no lo entregas tú: lo comunica el médico a la Seguridad Social y de ahí llega a la empresa.",
        puntos: [
          "Avisa al Store Manager el mismo día en que no vas a poder ir, por el canal que tengáis acordado.",
          "Desde abril de 2023 no tienes que entregar copia del parte de baja ni de los de confirmación: el servicio de salud los envía al INSS y el INSS a la empresa.",
          "La empresa solo necesita saber la contingencia (común, accidente de trabajo, etc.) y las fechas. No tienes que decir el diagnóstico y nadie debe preguntártelo.",
          "Durante la baja no se trabaja ni se te puede pedir que lo hagas. Tampoco se contacta contigo salvo para trámites.",
          "Al recibir el alta, avisa y reincorpórate el siguiente día laborable.",
          "Accidente de trabajo: comunícalo en el momento al responsable, aunque parezca leve; la empresa lo notifica a la mutua."
        ],
        quienAcudir: "Store Manager para el aviso; RR.HH. para los trámites con la mutua o la Seguridad Social.",
        ref: "RD 1060/2022 (partes de baja). Ley de Prevención de Riesgos Laborales (accidentes)." },
      { id: "nacimiento", grupo: "Ausencias y permisos", t: "Nacimiento, adopción y cuidado de menores", quien: "Todo el equipo",
        resumen: "Dieciséis semanas para cada progenitor, con las seis primeras obligatorias e ininterrumpidas tras el parto, y permisos de cuidado hasta los ocho años.",
        puntos: [
          "Nacimiento, adopción o acogimiento: 16 semanas para cada progenitor, las 6 primeras obligatorias y seguidas; el resto hasta que el menor cumpla 12 meses, de forma continuada o por semanas.",
          "Se puede disfrutar a jornada completa o parcial, con acuerdo con la empresa.",
          "Permiso parental de cuidado: hasta 8 semanas, continuas o no, hasta que el menor cumpla 8 años. Avisa con 10 días de antelación.",
          "Reducción de jornada por guarda legal de menores de 12 años o familiares dependientes: entre un octavo y la mitad de la jornada, con reducción proporcional de salario.",
          "Adaptación de jornada por conciliación: se puede pedir y la empresa tiene que negociar y responder por escrito en 15 días."
        ],
        quienAcudir: "RR.HH., con antelación suficiente para organizar la tienda.",
        ref: "Estatuto de los Trabajadores, art. 48.4, 45.1.o, 37.6 y 34.8." },
      { id: "uniforme", grupo: "En la tienda", t: "Uniformidad e imagen", quien: "Todo el equipo",
        resumen: "El uniforme es parte de la marca. La empresa lo entrega y cada persona lo mantiene.",
        puntos: [
          "La empresa entrega el uniforme y lo repone por desgaste. Se usa completo durante todo el turno, con la identificación visible.",
          "Limpio y en buen estado cada día. Calzado cerrado y cómodo: hay muchas horas de pie.",
          "Imagen personal cuidada; no hay normas sobre pelo, tatuajes o complementos más allá de la higiene y la seguridad (nada que pueda engancharse en una demo o en el almacén).",
          "Fuera del horario de trabajo el uniforme no se lleva puesto en espacios públicos."
        ],
        quienAcudir: "Store Manager para reposiciones.",
        ref: "Política interna. Ley de Prevención de Riesgos Laborales (calzado y equipos)." },
      { id: "movil", grupo: "En la tienda", t: "Móvil, datos de clientes y redes", quien: "Todo el equipo",
        resumen: "El móvil personal, en la taquilla durante el turno. Los datos de los clientes solo se usan para lo que los dieron.",
        puntos: [
          "El móvil personal se guarda durante el turno; las urgencias familiares se avisan al Store Manager, que facilita el contacto.",
          "Los datos de la tarjeta de fidelización (nombre, DNI, correo) se piden explicando para qué y se registran solo en el sistema. Nunca en papel ni en el móvil.",
          "No se fotografía a clientes, tickets ni pantallas del TPV.",
          "En redes sociales personales no se publica nada de la tienda, los compañeros ni los clientes sin autorización de central.",
          "Las contraseñas del TPV y de la plataforma son personales y no se comparten."
        ],
        quienAcudir: "Store Manager; RR.HH. o el delegado de protección de datos ante cualquier duda sobre datos personales.",
        ref: "RGPD y LOPDGDD. Política de uso de medios digitales de la compañía." },
      { id: "descuento", grupo: "Dinero y medios", t: "Compras de empleado", quien: "Todo el equipo",
        resumen: "El descuento de empleado es para uso personal y familiar directo, con las condiciones que fija central cada año.",
        puntos: [
          "Las compras de empleado se registran siempre con la identificación de empleado en el TPV.",
          "Son para uso personal y de la familia directa; no se revenden ni se compran para terceros.",
          "Cada persona cobra sus propias compras: nunca te cobras a ti mismo.",
          "Las condiciones (porcentaje, límites, productos excluidos) las comunica central y se aplican tal cual."
        ],
        quienAcudir: "Store Manager; RR.HH. para las condiciones vigentes.",
        ref: "Política interna de compras de empleado." },
      { id: "gastos", grupo: "Dinero y medios", t: "Gastos, desplazamientos y dietas", quien: "SM, ASM y quien se desplace",
        resumen: "Los gastos se autorizan antes y se justifican después, con ticket o factura.",
        puntos: [
          "Cualquier gasto de tienda (consumibles, reparaciones menores) lo autoriza antes el Store Manager y se paga con los medios de la tienda, no con dinero personal.",
          "Desplazamientos a formaciones, inventarios de otras tiendas o reuniones de zona: se autorizan por el Regional Manager y se liquidan con el kilometraje o el billete y la dieta que marque la política vigente.",
          "Se presentan en el mes en que se producen, con el justificante original.",
          "Las formaciones obligatorias son tiempo de trabajo y sus gastos corren a cargo de la empresa."
        ],
        quienAcudir: "Regional Manager para autorizar; RR.HH. para la liquidación.",
        ref: "Política interna de gastos. Estatuto de los Trabajadores, art. 23 (formación)." },
      { id: "respeto", grupo: "Personas", t: "Respeto, acoso y canal de denuncias", quien: "Todo el equipo",
        resumen: "Tolerancia cero con el acoso, la discriminación y el trato vejatorio, vengan de quien vengan: compañeros, responsables o clientes.",
        puntos: [
          "Nadie tiene que aguantar insultos, humillaciones, comentarios sexuales o discriminación por sexo, origen, orientación, edad, discapacidad o cualquier otra condición.",
          "Si lo vives o lo ves, puedes acudir a tu Store Manager, a tu Regional Manager, a RR.HH. o directamente al canal de denuncias de la compañía, que admite comunicaciones anónimas.",
          "La compañía tiene un protocolo frente al acoso: toda comunicación se investiga con confidencialidad y sin represalias para quien la hace de buena fe.",
          "Con clientes: ante una agresión verbal, no se discute; se avisa al responsable y, si hace falta, a seguridad del centro.",
          "Todas las personas de la plantilla reciben formación sobre este protocolo al incorporarse."
        ],
        quienAcudir: "Cualquiera de los canales anteriores; ninguno es obligatorio antes que otro.",
        ref: "Ley 2/2023 de protección del informante. LO 3/2007 de igualdad. Protocolo de acoso de la compañía." },
      { id: "formacion", grupo: "Personas", t: "Formación y desarrollo", quien: "Todo el equipo",
        resumen: "La formación es parte del trabajo. Lo que aprendes queda registrado y cuenta en tu evaluación y en tu desarrollo.",
        puntos: [
          "Las formaciones de producto (SEB Academy) y las de la plataforma se hacen en horario de trabajo o se compensan.",
          "Cada persona completa el Circuito de Venta en su primer mes y las formaciones asignadas a su puesto a lo largo del año.",
          "Hay 20 horas anuales de permiso retribuido para formación vinculada al puesto, acumulables hasta cinco años, según marca la ley.",
          "El plan de desarrollo se habla con el Store Manager o el Regional Manager en la evaluación y se registra en la Talent Matrix.",
          "Si quieres crecer (otra tienda, zona, aperturas), dilo en la evaluación: la red crece con gente de dentro."
        ],
        quienAcudir: "Store Manager o Regional Manager; RR.HH. para la oferta formativa.",
        ref: "Estatuto de los Trabajadores, art. 23.3." },
      { id: "dudas", grupo: "Personas", t: "Dónde preguntar", quien: "Todo el equipo",
        resumen: "Para cualquier duda sobre nómina, contrato, vacaciones o permisos hay un camino claro. No hace falta esperar a la evaluación.",
        puntos: [
          "Primero, el Store Manager: resuelve horarios, cambios, uniformes y la mayoría de permisos.",
          "Después, el Regional Manager: formación, movilidad, desarrollo y lo que el Store Manager no pueda resolver.",
          "RR.HH.: nómina, contrato, bajas y permisos largos, conciliación y cualquier tema personal que prefieras tratar fuera de la tienda.",
          "Para asuntos de respeto y acoso, el canal de denuncias de la compañía está siempre disponible y admite comunicaciones anónimas.",
          "Las respuestas de RR.HH. llegan en un máximo de cinco días laborables."
        ],
        quienAcudir: "El canal que prefieras: ninguno es obligatorio antes que otro.",
        ref: "Política interna." }
    ]
  }
};
