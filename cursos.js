"use strict";
/* ===================== CURSOS: KPIs, Visual, P&L y Equipos =====================
   Mismo formato que el Circuito de Venta: cada parada tiene una idea, qué
   haces, frases que ayudan y en qué te fijas. Al final, un test corto de
   cinco preguntas que deja registro de quién lo ha superado.

   El contenido es una base de partida escrita para la red Home & Cook. Las
   cifras de ejemplo son orientativas: ajústalas a los objetivos reales y a
   la nomenclatura que use Operaciones.
   ============================================================================ */
const CURSOS_CONTENIDO = {

  /* ---------------------------------------------------------------- */
  kpis: {
    pasos: [
      { id: "trafico", t: "Tráfico y conversión", sub: "Cuántos entran y cuántos compran", min: 4,
        idea: "La conversión es el KPI que más depende de lo que hace el equipo en sala. El tráfico casi nunca lo controlas; lo que haces con él, sí.",
        haces: [
          "Mira cada mañana la conversión de ayer: tickets dividido entre visitantes del contador.",
          "Compárala por franja: si cae de 17 a 20 h, el problema es de dotación o de atención en el pico, no de producto.",
          "Cada persona que entra recibe un saludo en los primeros segundos. Es la palanca más barata de la conversión.",
          "Pon las demos en las horas de más tráfico, no cuando la tienda está vacía.",
          "Si la conversión baja y el tráfico se mantiene, revisa el circuito de venta antes de buscar excusas externas."
        ],
        dices: [
          { c: "Al abrir", f: "Ayer entraron 310 personas y compraron 34: un 11 %. Hoy el foco es saludar a todo el mundo y ofrecer la demo del robot a las 18 h." },
          { c: "Al equipo", f: "No es que vendamos más a cada cliente: es que ayudemos a más clientes de los que ya entran." },
          { c: "Al Regional Manager", f: "La conversión del sábado tarde cae al 7 % con dos personas en sala. Pido mover dos horas de la mañana del martes a esa franja." }
        ],
        ojo: [
          "Celebrar un día de ventas altas con conversión baja: fue el tráfico, no el equipo.",
          "Comparar la conversión con otra tienda sin mirar su tipo de centro: un outlet de carretera y un centro urbano no se parecen.",
          "Dejar que el contador falle semanas sin avisar: sin visitantes fiables no hay conversión."
        ] },
      { id: "ticket", t: "Ticket medio y unidades por ticket", sub: "Cuánto se lleva cada cliente", min: 4,
        idea: "El ticket medio sube de dos maneras: vendiendo gamas más altas o añadiendo un segundo producto. La segunda es la que más ignoramos.",
        haces: [
          "Sigue las unidades por ticket (UPT) además del ticket medio: si el UPT es 1,2, ocho de cada diez clientes salen con un solo producto.",
          "Para cada producto estrella, ten el complemento decidido antes de que llegue el cliente: espátulas con la sartén, tabla con el centro de planchado, bolsas con el aspirador.",
          "Propón la gama superior explicando qué resuelve, nunca solo por precio.",
          "En caja, producto pequeño a la vista y la tarjeta de fidelización explicada con su ventaja.",
          "Revisa el UPT por persona del equipo una vez a la semana y comenta el dato con quien está más bajo."
        ],
        dices: [
          { c: "Al equipo", f: "Nuestro ticket medio es 48 € y el UPT 1,3. Si uno de cada cuatro clientes se lleva un accesorio de 12 €, el ticket sube 3 € sin un cliente más." },
          { c: "En sala", f: "Para este aspirador, las bolsas homologadas aíslan mejor el polvo y aguantan más. Se lleva dos cajas y no vuelve en meses." },
          { c: "Al Regional Manager", f: "Hemos subido el UPT de 1,25 a 1,41 en seis semanas con un complemento fijo por familia." }
        ],
        ojo: [
          "Subir el ticket a base de descuentos: sube la venta y baja el margen.",
          "El \"¿algo más?\" en caja: no es venta cruzada, es un trámite.",
          "Empujar la gama alta a quien ha dicho claramente qué uso le va a dar."
        ] },
      { id: "margen", t: "Margen", sub: "Lo que queda de cada euro", min: 4,
        idea: "Dos tiendas con la misma venta pueden ganar cantidades muy distintas. La diferencia está en el mix de producto, los descuentos y las mermas.",
        haces: [
          "Conoce el margen de cada familia: menaje y accesorios suelen dar más que la electrónica de gran volumen.",
          "Aplica solo los descuentos autorizados en el plan comercial. Un descuento \"para cerrar\" fuera de plan sale del margen de la tienda.",
          "Controla las mermas: roturas, devoluciones mal gestionadas y diferencias de inventario son margen que se evapora.",
          "Da foco en sala a los productos del plan comercial: el plan está hecho con el margen en la mano.",
          "Cuando una promoción no funciona, dilo con datos; cuando funciona, no la alargues por tu cuenta."
        ],
        dices: [
          { c: "Al equipo", f: "Vender 100 € de sartenes deja más que vender 100 € de un gran electrodoméstico en promoción. Por eso el complemento no es un detalle." },
          { c: "Al cliente que pide descuento", f: "El precio ya es de outlet. Lo que sí puedo hacer es explicarle la tarjeta: 25 € de descuento acumulado para la próxima compra." },
          { c: "Al Regional Manager", f: "El margen cayó 1,2 puntos en mayo por el peso de la promoción de aspiradores. Propongo compensarlo en junio con foco en menaje." }
        ],
        ojo: [
          "Mirar solo la venta: el objetivo de margen tiene el mismo peso en el Scorecard.",
          "Descuentos \"excepcionales\" que se repiten cada semana.",
          "Un inventario con diferencias que nadie investiga."
        ] },
      { id: "productividad", t: "Productividad y horas", sub: "Venta por hora trabajada", min: 4,
        idea: "La productividad no es trabajar más horas: es tener las horas donde está el tráfico. Es el KPI que une la venta con el horario.",
        haces: [
          "Calcula la venta por hora trabajada del mes: facturación dividida entre horas realmente trabajadas.",
          "Compara el reparto de horas por franja con el reparto del tráfico. En el People Data Centre lo tienes ya calculado como ajuste al tráfico.",
          "Mueve horas de las franjas vacías a los picos antes de pedir más plantilla.",
          "Planifica el horario con dos semanas de antelación y publícalo: los cambios de última hora cuestan horas y clima.",
          "Vigila la bolsa de horas del equipo: una bolsa que crece sin parar es tiempo que se paga dos veces."
        ],
        dices: [
          { c: "Al equipo", f: "Los jueves por la mañana entran 20 personas y somos tres. El sábado por la tarde entran 90 y somos dos. Vamos a cambiarlo." },
          { c: "Al Regional Manager", f: "Con las mismas horas, moviendo doce de la semana al fin de semana, el ajuste al tráfico pasa del 71 % al 86 %." },
          { c: "A quien pide cambiar turno", f: "Cambia con quien quieras, pero el sábado tarde no puede quedarse con una persona. Dime quién lo cubre y lo apruebo." }
        ],
        ojo: [
          "Pedir más horas sin haber movido primero las que ya tienes.",
          "Mandar el horario tarde: es un ítem del Scorecard y la primera queja en las encuestas de clima.",
          "Confundir horas contratadas con horas trabajadas: las vacaciones, bajas y bolsa de horas están en medio."
        ] },
      { id: "rutina", t: "La rutina semanal", sub: "Tres datos, una causa, una acción", min: 4,
        idea: "Los KPIs no sirven para informar: sirven para decidir. Una rutina corta y fija vale más que un informe largo que nadie lee.",
        haces: [
          "Lunes, diez minutos: conversión, ticket medio y margen de la semana frente al objetivo y a la semana anterior.",
          "Elige el que más se desvía y busca una sola causa con el equipo, no tres.",
          "Decide una acción concreta, con responsable y fecha: \"demo del robot a las 18 h de jueves a sábado, Pablo, hasta el día 20\".",
          "Apúntala donde el equipo la vea y revísala el lunes siguiente antes de abrir otra.",
          "Lleva ese plan de acción a la reunión con tu Regional Manager: es lo que se valora en el ítem de capacidad estratégica."
        ],
        dices: [
          { c: "Lunes, al equipo", f: "Conversión 9,8 % frente al 10,6 de objetivo. Causa: el sábado tarde con dos personas. Acción: Laura entra a las 16 h en vez de a las 10 h hasta fin de mes." },
          { c: "Al cerrar la semana", f: "La acción ha funcionado: el sábado conversión 11,2. La mantenemos y pasamos al margen." },
          { c: "Si no funciona", f: "No ha movido el dato. Lo quitamos y probamos otra cosa: nadie se juega nada por probar." }
        ],
        ojo: [
          "Abrir cinco acciones a la vez y no cerrar ninguna.",
          "Buscar la causa fuera siempre: el centro, el tiempo, la competencia.",
          "No volver a mirar la acción la semana siguiente."
        ] }
    ],
    test: [
      { t: "La venta del sábado fue la mejor del mes, pero la conversión cayó del 11 % al 8 %. ¿Qué pasó?",
        o: ["El equipo vendió mejor que nunca", "Entró mucho más tráfico y se atendió peor a cada cliente", "El contador de tráfico está roto", "Subió el ticket medio"],
        r: 1, por: "Más venta con menos conversión significa que entró más gente de la que el equipo pudo atender bien: el mérito es del tráfico, y hay una oportunidad en la dotación del sábado." },
      { t: "Tu UPT es 1,2. ¿Qué significa?",
        o: ["Cada cliente gasta 1,2 € más que el año pasado", "Hay 1,2 personas en sala por hora", "Casi todos los clientes salen con un solo producto", "La conversión es del 12 %"],
        r: 2, por: "Unidades por ticket 1,2 quiere decir que de cada diez tickets, ocho llevan un solo producto. Es la señal de que falta venta cruzada." },
      { t: "Un cliente pide un 10 % de descuento para cerrar. ¿Qué es lo correcto?",
        o: ["Dárselo: una venta es una venta", "Explicar el valor y la tarjeta de fidelización; el descuento solo si está en el plan comercial", "Decirle que vuelva en rebajas", "Consultar al Regional Manager cada vez"],
        r: 1, por: "Los descuentos fuera de plan salen del margen de la tienda, que pesa un 30 % en el Scorecard. La tarjeta da un beneficio real sin tocar el margen de hoy." },
      { t: "El ajuste al tráfico de tu tienda es del 70 %. ¿Qué haces primero?",
        o: ["Pedir más horas de plantilla", "Mover horas de las franjas vacías a los picos", "Cerrar antes los días flojos", "Quitar las demos"],
        r: 1, por: "Antes de pedir más horas hay que colocar bien las que ya tienes. Un 70 % suele significar mañanas sobredotadas y tardes de fin de semana cortas." },
      { t: "¿Qué es un buen plan de acción semanal?",
        o: ["Una lista con todo lo que hay que mejorar", "Un dato, una causa, una acción con responsable y fecha", "Un informe para el Regional Manager", "Un objetivo de ventas más alto"],
        r: 1, por: "Un plan que se puede revisar el lunes siguiente en dos minutos. Lo que no cabe en una frase no se va a hacer." }
    ]
  },

  /* ---------------------------------------------------------------- */
  visual: {
    pasos: [
      { id: "recorrido", t: "El recorrido del cliente", sub: "Dónde mira y dónde no", min: 4,
        idea: "El cliente no recorre la tienda como tú: entra, gira a la derecha, mira a la altura de los ojos y evita el fondo. El visual merchandising es poner las cosas donde él va a estar.",
        haces: [
          "Identifica la zona caliente de tu tienda: normalmente la entrada y el primer giro a la derecha. Ahí va la campaña.",
          "La zona fría (fondo, esquinas, detrás de columnas) necesita un motivo para ir: una promoción fuerte o la demo.",
          "La mesa de entrada no es un almacén: cuenta una historia de campaña con tres o cuatro productos, no veinte.",
          "Deja pasillos de paso libres: un carro o una caja en medio corta el recorrido.",
          "Camina tu tienda una vez al día como si fueras cliente, desde la puerta."
        ],
        dices: [
          { c: "Al equipo", f: "Lo que ponemos en la mesa de entrada lo ve el 100 % de los que entran. Lo del fondo, el 30 %. Decidid con eso en la cabeza." },
          { c: "Al Regional Manager", f: "He movido la gama de desayuno al primer giro y la venta de cafeteras ha subido un 18 % en dos semanas." }
        ],
        ojo: [
          "Poner lo más caro al fondo \"para que recorran la tienda\": no recorren.",
          "Mesa de entrada con producto de todas las familias: no se entiende nada.",
          "Olvidar que la zona de caja también vende: utensilios y producto pequeño a mano."
        ] },
      { id: "escaparate", t: "Escaparate y plan comercial", sub: "El cartel más grande de la tienda", min: 4,
        idea: "El escaparate no es decoración: es el primer argumento de venta y lo marca el plan comercial. Está en el Scorecard con un 10 % de peso por algo.",
        haces: [
          "Cuando llega el plan comercial, el escaparate cambia en las 48 horas siguientes, no cuando hay un rato.",
          "Foco en la gama que marca el plan (el foco GMG): producto, precio visible y un mensaje.",
          "Tres alturas y un producto protagonista: el ojo necesita un punto donde pararse.",
          "Limpieza del cristal y del suelo del escaparate cada mañana: la suciedad se ve antes que el producto.",
          "Haz una foto del escaparate montado y envíala a tu Regional Manager: es la evidencia del ítem."
        ],
        dices: [
          { c: "Al equipo", f: "Este mes el foco es aspiración. Todo el que pase por delante tiene que entender en tres segundos que aquí hay aspiradores y a qué precio." },
          { c: "Al Regional Manager", f: "Escaparate de campaña montado el día 2 según plan. Adjunto foto. He añadido la tarjeta de fidelización en el lateral." }
        ],
        ojo: [
          "Escaparate del mes pasado con el cartel nuevo encima.",
          "Precios tapados o pequeños: el cliente no entra a preguntar, se va.",
          "Sobrecargar: si no cabe un producto más, sobran cinco."
        ] },
      { id: "lineal", t: "Mesa de promociones y lineal", sub: "Facing, altura y agrupación", min: 4,
        idea: "Un lineal bien hecho vende solo. Las reglas son pocas: cara al cliente, lo importante a la altura de los ojos y las cosas agrupadas por lo que resuelven.",
        haces: [
          "Facing: cada producto de cara, sin huecos. Un hueco en el lineal es un producto que no se vende.",
          "Altura de ojos y manos para lo que quieres vender; arriba y abajo para el resto.",
          "Agrupa por uso, no por marca: \"desayuno\", \"planchado\", \"cocina sin aceite\". El cliente piensa en problemas, no en marcas.",
          "La mesa de promociones se renueva con cada cambio de plan y se repone a lo largo del día.",
          "Muestra abierta y enchufada donde se pueda: lo que se toca, se vende."
        ],
        dices: [
          { c: "Al equipo", f: "Repón la mesa a las 13 h y a las 18 h, no solo al abrir. Una mesa medio vacía a las siete de la tarde parece una tienda que cierra." },
          { c: "En sala", f: "Pruébela, está enchufada. No es lo mismo verla que oír lo poco que suena." }
        ],
        ojo: [
          "Lineal con huecos \"porque no hay stock\": reorganiza y cierra el hueco.",
          "Mezclar en la misma balda producto de campaña y producto de fondo sin cartel.",
          "Muestras sin enchufar, sin accesorios o sucias."
        ] },
      { id: "precio", t: "Precio y cartelería", sub: "Que se entienda a la primera", min: 3,
        idea: "La mayoría de los conflictos en caja empiezan en un cartel. Un precio claro vende; un precio confuso genera una reclamación.",
        haces: [
          "Cada producto expuesto tiene su etiqueta con PVP y, si aplica, el precio outlet. Sin excepciones.",
          "Un cartel de promoción dice exactamente a qué productos aplica. Si hay letra pequeña, la promoción está mal comunicada.",
          "Retira la cartelería el mismo día en que termina la promoción, antes de abrir.",
          "Cartelería oficial de campaña, no carteles hechos a mano.",
          "Antes de abrir, una persona revisa que mesa, escaparate y lineal de campaña tienen el precio correcto en caja."
        ],
        dices: [
          { c: "Al equipo", f: "Si un cliente puede entender que el 20 % aplica a esto, aplica a esto. Si no queremos que aplique, el cartel sobra o se cambia." },
          { c: "En caja", f: "Tiene razón en que el cartel confunde. Le aplico el precio del cartel y lo corrijo ahora mismo para que no vuelva a pasar." }
        ],
        ojo: [
          "Carteles de promociones pasadas que siguen colgados.",
          "Precio de etiqueta distinto del precio en caja.",
          "Promociones con condiciones que solo conoce el equipo."
        ] },
      { id: "rutina", t: "La rutina visual", sub: "Diez minutos antes de abrir", min: 4,
        idea: "El visual merchandising se pierde en un día si nadie lo cuida. Una rutina corta y fija de apertura mantiene la tienda como el primer día de campaña.",
        haces: [
          "Antes de abrir: cristal limpio, escaparate encendido, mesa de entrada completa y con precios.",
          "Pasillo principal despejado, muestras enchufadas y limpias, lineales con facing.",
          "A mediodía y a última hora: reposición de mesa y lineal de campaña.",
          "Al cerrar: dejar la tienda como quieres encontrarla, no como quieres irte.",
          "Una foto semanal de escaparate y mesa para el Regional Manager y para compararte contigo mismo."
        ],
        dices: [
          { c: "Al abrir", f: "Diez minutos de visual: Iván escaparate y cristal, Nuria mesa y precios, yo lineal de campaña. Abrimos a las 10 en punto." },
          { c: "Al cerrar", f: "Nadie se va con un hueco en la mesa. Mañana a las 10 ya entra gente." }
        ],
        ojo: [
          "Dejar el visual para \"cuando haya un rato\": no lo hay nunca.",
          "Que lo haga siempre la misma persona: cuando libra, se nota.",
          "Abrir con las luces del escaparate apagadas."
        ] }
    ],
    test: [
      { t: "¿Dónde va el producto de campaña del mes?",
        o: ["Al fondo, para que recorran toda la tienda", "En la zona caliente: entrada y primer giro", "Junto a la caja", "Repartido por toda la tienda"],
        r: 1, por: "La zona caliente la ve todo el que entra. El fondo lo ve una minoría; ahí hace falta un motivo para ir." },
      { t: "Llega el plan comercial nuevo. ¿Cuándo cambia el escaparate?",
        o: ["Cuando se agote el stock del anterior", "En las 48 horas siguientes", "El primer día de rebajas", "Cuando lo pida el Regional Manager"],
        r: 1, por: "El escaparate es el primer argumento de venta y está en el Scorecard. Cambiarlo tarde es vender la campaña anterior." },
      { t: "Hay un hueco en el lineal porque no queda stock de una referencia. ¿Qué haces?",
        o: ["Dejarlo hasta que llegue el pedido", "Reorganizar para cerrar el hueco", "Poner un cartel de agotado", "Tapar el hueco con producto de otra familia sin precio"],
        r: 1, por: "Un hueco parece dejadez y no vende. Se reorganiza el facing para que el lineal esté lleno con lo que hay." },
      { t: "Un cliente entiende que el cartel del 20 % aplica a un producto que no entra. ¿Cuál es la causa de fondo?",
        o: ["El cliente no lee", "El cartel está mal comunicado", "El equipo de caja no explicó bien", "Las promociones son complicadas"],
        r: 1, por: "Si un cliente puede entenderlo así, el cartel está mal. Se le aplica y se corrige el cartel ese mismo día." },
      { t: "¿Cuál es la rutina visual correcta?",
        o: ["Una gran puesta a punto el primer día de campaña", "Diez minutos fijos antes de abrir y reposición a mediodía y a última hora", "Cuando la tienda está vacía", "Lo hace siempre la misma persona"],
        r: 1, por: "El visual se pierde en un día. Una rutina corta, repartida y a horas fijas lo mantiene." }
    ]
  },

  /* ---------------------------------------------------------------- */
  pyl: {
    pasos: [
      { id: "que", t: "La cuenta de resultados de una tienda", sub: "De la venta al resultado", min: 5,
        idea: "El P&L de tu tienda cabe en cinco líneas: ventas, margen, personal, alquiler y otros gastos. Lo que queda abajo es el resultado. Entenderlo te permite defender tu tienda con números.",
        haces: [
          "Ventas netas: lo facturado sin IVA y sin devoluciones. Es la cifra de la que parte todo.",
          "Margen bruto: ventas menos el coste de lo vendido. En porcentaje es el KPI de margen del Scorecard.",
          "Coste de personal: salarios, seguridad social, horas extra y sustituciones. Suele ser el mayor gasto que sí controlas.",
          "Alquiler y canon del centro: fijo o un porcentaje de ventas. No lo controlas, pero su ratio sobre ventas sí baja si vendes más.",
          "Otros gastos: consumibles, Lyreco, mantenimiento, mermas. Pequeños cada uno, grandes en conjunto."
        ],
        dices: [
          { c: "Al equipo", f: "De cada 100 € que vendemos, unos 58 se quedan como margen. De esos 58 pagamos a las personas, el local y el resto. Lo que sobra es lo que hace que la tienda siga abierta." },
          { c: "Al Regional Manager", f: "El resultado cae porque el alquiler pesa un 14 % con la venta de este año; con la venta del año pasado pesaba un 11 %." }
        ],
        ojo: [
          "Hablar de ventas con IVA: el P&L va sin IVA.",
          "Confundir margen bruto con resultado: entre uno y otro están todos los gastos.",
          "Pensar que el P&L es cosa de central: es la foto de tu gestión."
        ] },
      { id: "tuyo", t: "Lo que depende de ti", sub: "Ventas, margen, horas y gastos", min: 5,
        idea: "Cuatro líneas del P&L se mueven con tus decisiones de cada semana. Son las que mira tu Regional Manager y las que pesan en tu bonus.",
        haces: [
          "Ventas: conversión, ticket medio y venta cruzada. Todo el circuito de venta acaba aquí.",
          "Margen: mix de producto, descuentos solo del plan comercial, mermas e inventario cuadrado.",
          "Horas: planificar con el tráfico, controlar la bolsa de horas y las horas extra, cubrir ausencias sin duplicar.",
          "Gastos: pedidos de consumibles ajustados, roturas registradas, mantenimiento avisado a tiempo.",
          "Un euro de gasto ahorrado vale lo mismo que unos dos euros de venta extra: la venta llega al resultado solo por su margen."
        ],
        dices: [
          { c: "Al equipo", f: "Las horas extra de este mes han sido 38. Son 38 horas que pagamos y que no estaban en el tráfico. El mes que viene, cero sin mi visto bueno." },
          { c: "Al Regional Manager", f: "Hemos bajado el gasto de consumibles un 22 % agrupando pedidos en uno al mes." }
        ],
        ojo: [
          "Subir ventas regalando margen: el resultado no se mueve.",
          "Cubrir cada ausencia con horas extra en vez de recolocar el horario.",
          "Pedir consumibles \"por si acaso\" todos los meses."
        ] },
      { id: "nottuyo", t: "Lo que no depende de ti", sub: "Y cómo hablar de ello", min: 4,
        idea: "El alquiler, las amortizaciones o el canon no los decides tú. Pero el porcentaje que representan sobre la venta sí cambia con tu gestión, y saber explicarlo te da credibilidad.",
        haces: [
          "Distingue siempre entre gasto fijo y gasto que crece con la venta: el alquiler fijo pesa menos cuanto más vendes.",
          "Cuando el resultado cae por una línea que no controlas, dilo con el dato y pasa a lo que sí controlas.",
          "Las inversiones de reforma o mobiliario aparecen como amortización durante años: no es un gasto de este mes.",
          "Pregunta a tu Regional Manager qué líneas de tu P&L son imputaciones de central y cuáles son reales de tu tienda.",
          "No uses lo que no controlas como excusa de lo que sí controlas."
        ],
        dices: [
          { c: "Al Regional Manager", f: "El canon ha subido un 6 % y se nota en el resultado. En lo que depende de nosotros, margen y personal mejoran medio punto cada uno." },
          { c: "Al equipo", f: "El local cuesta lo mismo vendamos 80.000 o 100.000. Cada venta extra hace que el local pese menos." }
        ],
        ojo: [
          "Discutir el alquiler en cada reunión: no cambia y gasta el tiempo de lo que sí cambia.",
          "No saber qué parte del gasto es imputación de central.",
          "Tratar una amortización como un gasto de caja del mes."
        ] },
      { id: "leer", t: "Leer la cuenta cada mes", sub: "Ratios, objetivo y año anterior", min: 5,
        idea: "Un P&L se lee en porcentajes sobre ventas, nunca en euros sueltos. Y siempre contra dos referencias: el objetivo y el mismo mes del año pasado.",
        haces: [
          "Convierte cada línea a porcentaje sobre ventas: margen %, personal %, alquiler %, otros %.",
          "Compara con el objetivo del año: te dice si vas bien. Compara con el año anterior: te dice si mejoras.",
          "Busca la línea que más se desvía en puntos porcentuales, no la que más llama la atención en euros.",
          "Una desviación de un mes puede ser calendario (Semana Santa, un festivo). Mira el acumulado del año antes de alarmarte.",
          "Prepara tres frases para la reunión mensual: qué ha pasado, por qué y qué vas a hacer."
        ],
        dices: [
          { c: "Lectura", f: "Ventas +4 % sobre el año pasado, margen 57,8 % frente a 59 de objetivo, personal 21 % frente a 20. Dos desviaciones, las dos nuestras." },
          { c: "Al Regional Manager", f: "El acumulado de personal va a 20,3 %: el pico de marzo fue por la baja de Elena y las horas de sustitución. En abril ya está en 19,8." }
        ],
        ojo: [
          "Leer el P&L en euros: una tienda grande siempre \"gasta más\".",
          "Mirar solo el mes y no el acumulado.",
          "Llegar a la reunión sin saber por qué se desvía una línea."
        ] },
      { id: "accion", t: "Del P&L a la acción", sub: "Un ejemplo con números", min: 5,
        idea: "Imagina una tienda que vende 100.000 € al mes con un 58 % de margen, un 22 % de personal, un 12 % de alquiler y un 6 % de otros gastos. El resultado es un 18 %. Veamos qué mueve cada palanca.",
        haces: [
          "Subir ventas un 5 % con el mismo margen: +2.900 € de margen; con el alquiler fijo, el resultado sube unos 2,9 puntos.",
          "Ganar un punto de margen (del 58 al 59 %) por mejor mix y menos descuentos: +1.000 € directos al resultado.",
          "Bajar personal un punto (del 22 al 21 %) recolocando horas, sin perder ventas: +1.000 € al resultado.",
          "Reducir otros gastos del 6 al 5 %: +1.000 € al resultado, y suele ser lo más rápido.",
          "Las cuatro palancas juntas: el resultado pasa del 18 % al 24 % sin un cliente nuevo. Elige dos para este trimestre."
        ],
        dices: [
          { c: "Al equipo", f: "Un punto de margen son 1.000 € al mes. Es el precio de no hacer descuentos fuera de plan y cuadrar el inventario." },
          { c: "Al Regional Manager", f: "Este trimestre trabajo margen y horas: objetivo +1 punto de margen y personal del 22 al 21 %. Lo revisamos cada mes." }
        ],
        ojo: [
          "Atacar las cuatro palancas a la vez con el equipo: no se mueve ninguna.",
          "Subir ventas a costa del margen y el personal: el resultado se queda igual.",
          "Olvidar que las cifras del ejemplo son de ejemplo: usa las de tu tienda."
        ] }
    ],
    test: [
      { t: "¿Qué es el margen bruto?",
        o: ["Ventas menos todos los gastos", "Ventas menos el coste de lo vendido", "El resultado de la tienda", "Las ventas con IVA"],
        r: 1, por: "El margen bruto es lo que queda de la venta tras pagar el producto. Los gastos (personal, local, otros) se restan después." },
      { t: "¿Cuál de estas líneas NO depende de la gestión del Store Manager?",
        o: ["Horas extra", "Descuentos aplicados", "Alquiler del local", "Pedidos de consumibles"],
        r: 2, por: "El alquiler lo fija el contrato. Lo que sí cambia con tu gestión es el porcentaje que representa sobre la venta." },
      { t: "La tienda vende 100.000 € con un 58 % de margen. Ganas un punto de margen. ¿Cuánto llega al resultado?",
        o: ["580 €", "1.000 €", "5.800 €", "Depende del alquiler"],
        r: 1, por: "Un punto de margen sobre 100.000 € de ventas son 1.000 € que van directos al resultado." },
      { t: "¿Cómo se lee correctamente un P&L?",
        o: ["En euros, línea a línea", "En porcentaje sobre ventas, contra objetivo y contra el año anterior", "Solo el resultado final", "Comparando con la tienda más grande de la red"],
        r: 1, por: "Los porcentajes sobre ventas hacen comparable cualquier mes y cualquier tienda. Objetivo y año anterior son las dos referencias." },
      { t: "¿Por qué un euro de gasto ahorrado vale más que un euro de venta extra?",
        o: ["Porque el gasto es más fácil de controlar", "Porque de la venta solo llega al resultado su margen", "No es cierto, valen igual", "Porque el gasto no lleva IVA"],
        r: 1, por: "De cada euro vendido, al resultado llega aproximadamente el margen (unos 0,58 €). Un euro de gasto ahorrado llega entero." }
    ]
  },

  /* ---------------------------------------------------------------- */
  equipos: {
    pasos: [
      { id: "horarios", t: "Horarios que no queman", sub: "Antelación, equidad y tráfico", min: 5,
        idea: "El horario es la decisión de gestión que más afecta al clima y a la venta a la vez. Publicarlo tarde o repartirlo mal se paga en absentismo y en rotación.",
        haces: [
          "Publica el horario con al menos dos semanas de antelación, siempre el mismo día de la semana.",
          "Reparte fines de semana, tardes y festivos con equidad y a la vista: una tabla que todos puedan comprobar.",
          "Pon las horas donde está el tráfico: el People Data Centre te dice las franjas.",
          "Los cambios de última hora, solo por causa real y preguntando, no imponiendo.",
          "Controla la bolsa de horas de cada persona y compénsala en el mes siguiente, no en diciembre."
        ],
        dices: [
          { c: "Al equipo", f: "El horario sale cada jueves para las dos semanas siguientes. Si necesitáis un cambio, pedidlo antes del miércoles y lo encajo." },
          { c: "Ante un cambio imprevisto", f: "Me ha surgido una baja para el sábado. ¿Alguien puede entrar a las 16 h? Lo compenso el fin de semana que viene." }
        ],
        ojo: [
          "El horario del lunes que sale el domingo por la noche.",
          "Que los mismos de siempre tengan todos los sábados.",
          "Decidir los cambios por WhatsApp a las once de la noche."
        ] },
      { id: "feedback", t: "Feedback que cambia algo", sub: "Hechos, impacto, pregunta, acuerdo", min: 5,
        idea: "El feedback útil no es una opinión sobre la persona: es un hecho concreto, lo que provoca, una pregunta y un acuerdo. Cuatro pasos, en privado y pronto.",
        haces: [
          "Hecho: lo que viste u oíste, con fecha y sin adjetivos. \"El sábado no ofreciste la tarjeta a los últimos cinco clientes\".",
          "Impacto: qué consecuencia tiene. \"Son cinco clientes a los que no volvemos a ver\".",
          "Pregunta: qué está pasando de verdad. \"¿Qué te frena?\". Y escucha.",
          "Acuerdo: qué cambia, cómo y cuándo lo revisáis. \"Esta semana la ofreces a todos y el viernes lo miramos\".",
          "Pronto y en privado. El feedback positivo también sigue estos pasos, y en público si quieres."
        ],
        dices: [
          { c: "Hecho e impacto", f: "Ayer entraron tres clientes mientras estabas con el móvil detrás de la caja. Dos se fueron sin que nadie les hablara." },
          { c: "Pregunta", f: "No te lo digo para echarte nada en cara. Quiero entender qué pasó y cómo lo evitamos." },
          { c: "Acuerdo", f: "Entonces el móvil en la taquilla durante el turno y nos lo miramos el viernes. ¿Te parece?" },
          { c: "Positivo", f: "La demo que hiciste a la clienta del robot fue muy buena: preguntaste antes de enchufar nada. Así es como quiero que lo haga todo el equipo." }
        ],
        ojo: [
          "Etiquetas en vez de hechos: \"eres poco proactivo\".",
          "Guardarlo para la evaluación de diciembre.",
          "Comparar con un compañero: \"Pablo sí lo hace\"."
        ] },
      { id: "motivacion", t: "Reconocimiento y motivación", sub: "Concreto, en el momento, a la vista", min: 4,
        idea: "El ítem con más peso del Scorecard es la motivación del equipo. No va de regalos ni de discursos: va de que cada persona sepa que lo que hace se ve.",
        haces: [
          "Reconoce en concreto y en el momento: qué hizo, qué consiguió. \"Gracias\" a secas no dice nada.",
          "Objetivos del equipo visibles en la trastienda, actualizados cada semana, con el avance.",
          "Celebra los pequeños logros del equipo, no solo los récords: una semana con la mesa impecable cuenta.",
          "Da responsabilidades: quien lleva la mesa de promociones o la formación de producto se implica más.",
          "Pregunta a cada persona qué le gustaría aprender este año y apúntalo. Es la base de la Talent Matrix."
        ],
        dices: [
          { c: "En el momento", f: "Nuria, lo de llevar a la clienta al lado para hablar de la devolución ha evitado una escena. Muy bien hecho." },
          { c: "Al equipo", f: "Esta semana el UPT ha pasado de 1,3 a 1,45. Eso lo habéis hecho vosotros, un accesorio cada vez." },
          { c: "Uno a uno", f: "¿Qué te gustaría aprender o llevar este año en la tienda? Lo apunto y lo metemos en tu plan." }
        ],
        ojo: [
          "Reconocer solo las ventas: el que ordena el almacén también sostiene la tienda.",
          "Elogios genéricos y repetidos: pierden valor.",
          "Dar responsabilidades sin dar el tiempo para hacerlas."
        ] },
      { id: "dificiles", t: "Conversaciones difíciles", sub: "Bajo rendimiento, conflicto, ausencias", min: 5,
        idea: "Las conversaciones que se evitan crecen. Prepararlas cinco minutos y tenerlas pronto es lo que distingue a un responsable de un compañero con llaves.",
        haces: [
          "Prepárala: el hecho, lo que quieres conseguir y qué vas a proponer. No improvises.",
          "En privado, con tiempo y sin el móvil. Nunca en sala ni por mensaje.",
          "Empieza por el hecho y escucha más de lo que hablas: casi siempre hay algo que no sabías.",
          "Cierra con un acuerdo concreto y una fecha de revisión. Si no hay cambio, la siguiente conversación es con tu Regional Manager y RR.HH.",
          "Ante un conflicto entre dos personas, habla con cada una por separado antes de juntarlas. Ante faltas repetidas, trata el hecho (las faltas), no el motivo."
        ],
        dices: [
          { c: "Bajo rendimiento", f: "Llevas tres semanas por debajo de objetivo y ha bajado tu ritmo en sala. Quiero entender qué pasa y acordar dos cosas concretas para las próximas dos semanas." },
          { c: "Conflicto", f: "No te pido que seáis amigos. Te pido que en sala el cliente no note nada y que lo que tengáis que hablar lo habléis conmigo delante." },
          { c: "Ausencias", f: "Has faltado tres lunes en dos meses. No te pregunto por qué: te digo que la tienda se queda con una persona y que necesito saber con qué puedo contar." }
        ],
        ojo: [
          "Esperar a que \"se arregle solo\".",
          "Preguntar por motivos médicos: no te corresponde y no puedes guardarlo.",
          "Amenazar con consecuencias que no vas a aplicar."
        ] },
      { id: "acoger", t: "Acoger a quien entra", sub: "El primer día decide el primer año", min: 4,
        idea: "La mitad de las salidas en los primeros meses se deciden en la primera semana. Una acogida preparada cuesta dos horas y ahorra una selección entera.",
        haces: [
          "Antes del primer día: uniforme, accesos, taquilla y un compañero de referencia (padrino) asignado.",
          "Primer día: te espera alguien, le presentas al equipo, le enseñas la tienda y le explicas qué se espera de él en la primera semana.",
          "Primera semana: acompañado en sala, con una sola cosa en la que fijarse cada día (acogida, detección, demo).",
          "Primer mes: una conversación corta cada viernes y la formación del Circuito de Venta completada.",
          "A los 30 días recibirá la encuesta de onboarding: lo que diga ahí te va a servir para el siguiente."
        ],
        dices: [
          { c: "Primer día", f: "Bienvenida. Esta semana no te pido que vendas: te pido que mires cómo acogemos a cada cliente y que lo pruebes tú con Pablo al lado." },
          { c: "Viernes", f: "¿Qué te ha costado más esta semana? ¿Qué te ha faltado para ir más rápido?" },
          { c: "Al padrino", f: "Esta semana Nerea va contigo. No le expliques los siete pasos: enséñale uno al día y déjala probar." }
        ],
        ojo: [
          "Que el primer día nadie sepa que viene.",
          "Soltarla en sala sola el segundo día \"porque hay cola\".",
          "Dar por hecho que ha entendido sin preguntar."
        ] }
    ],
    test: [
      { t: "¿Con cuánta antelación debe publicarse el horario?",
        o: ["El día antes es suficiente", "Al menos dos semanas, siempre el mismo día", "Un mes, aunque luego cambie", "Depende de la campaña"],
        r: 1, por: "Dos semanas y un día fijo de publicación. Es la primera queja en las encuestas de clima y un ítem del Scorecard." },
      { t: "¿Cuál de estas frases es feedback útil?",
        o: ["Eres poco proactivo en sala", "Ayer entraron tres clientes mientras estabas con el móvil y dos se fueron sin que nadie les hablara", "Pablo sí ofrece la tarjeta, tú no", "Tienes que esforzarte más"],
        r: 1, por: "Un hecho concreto con su impacto. Las etiquetas, las comparaciones y los consejos vagos no dan a la persona nada sobre lo que actuar." },
      { t: "Una persona del equipo ha faltado tres lunes en dos meses. ¿Qué tratas en la conversación?",
        o: ["Por qué falta y qué le pasa", "El hecho de las faltas y su efecto en la tienda", "Nada: es asunto de RR.HH.", "Se lo comentas delante del equipo para que no se repita"],
        r: 1, por: "Tratas las faltas y su impacto, en privado. Los motivos médicos no te corresponden y no se pueden guardar." },
      { t: "¿Qué reconocimiento funciona mejor?",
        o: ["Un \"buen trabajo\" al final del mes", "Concreto y en el momento: qué hizo y qué consiguió", "Un regalo en Navidad", "Solo a quien más vende"],
        r: 1, por: "Concreto, inmediato y sobre un hecho. Es lo que hace que la persona sepa que lo que hace se ve." },
      { t: "Es el segundo día de una persona nueva y hay cola. ¿Qué haces?",
        o: ["La pones a atender sola: así aprende", "Sigue acompañada; la cola la gestionáis los demás", "La mandas al almacén hasta que baje la cola", "Le das el manual para que lo lea"],
        r: 1, por: "Soltarla sola el segundo día es la forma más rápida de perderla. La primera semana va acompañada y con una sola cosa en la que fijarse." }
    ]
  }
};
