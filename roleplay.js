"use strict";
/* Role play con IA dentro del Circuito de Venta */
const RP_ESCENARIOS = [
  {
    id: "mirando", ini: "M", quien: "Vendedor de tienda",
    t: "El cliente que \"solo está mirando\"",
    d: "Sábado por la mañana. Entra una clienta, se para delante de los aspiradores escoba y coge uno. Tienes que acogerla, detectar qué necesita y proponerle algo.",
    persona: "Eres Marta, 41 años, clienta de una tienda Home&Cook (electrodomésticos de Groupe SEB: Rowenta, Tefal, Moulinex, Krups, WMF). Has entrado a mirar aspiradores escoba porque el tuyo con cable ya no tira bien. Vives en un piso de 90 m² con parqué y una alfombra, tienes un perro que suelta pelo y poco tiempo para limpiar. NO sueltas esta información de golpe: solo la cuentas si el vendedor pregunta. Al principio eres reservada y sueltas un \"solo estoy mirando, gracias\". Si el vendedor te da espacio y pregunta bien, te abres. Si te suelta características técnicas sin preguntarte nada, te aburres y dices que te lo vas a pensar.",
    abre: "Solo estoy mirando, gracias.",
    criterios: [
      { id: "acogida", t: "Acogida y abordaje", q: "¿Saludó, dio espacio y abordó sin agobiar, en vez de lanzarse o desaparecer?" },
      { id: "deteccion", t: "Detección de necesidades", q: "¿Preguntó por el uso real (metros, suelo, mascotas, tiempo) antes de proponer nada, y resumió lo que entendió?" },
      { id: "argumentacion", t: "Argumentación con beneficio", q: "¿Tradujo las características a lo que le pasa a ella en su casa, en vez de recitar vatios?" },
      { id: "cierre", t: "Avance hacia el cierre", q: "¿Comprobó aceptación y propuso un siguiente paso concreto?" }
    ]
  },
  {
    id: "precio", ini: "J", quien: "Vendedor de tienda",
    t: "\"En Amazon está más barato\"",
    d: "Llevas diez minutos enseñando un centro de planchado. El cliente saca el móvil y te dice que lo ha visto más barato en internet.",
    persona: "Eres Jorge, 35 años, cliente de una tienda Home&Cook. Te interesa de verdad un centro de planchado Rowenta, pero acabas de ver en el móvil uno parecido más barato en una web y lo usas como palanca. Eres educado pero insistente: repites el argumento del precio al menos dos veces con distintas palabras. Cedes solo si el vendedor te da razones sólidas de valor (servicio técnico, garantía en tienda, asesoramiento, tarjeta de fidelización) sin hablar mal de la competencia. Si solo te ofrece descuento o se pone a la defensiva, dices que te lo piensas y te vas.",
    abre: "Oye, esto mismo lo he visto por internet bastante más barato. ¿Me lo igualáis?",
    criterios: [
      { id: "empatia", t: "Empatía antes de rebatir", q: "¿Reconoció la objeción sin discutirla ni ponerse a la defensiva?" },
      { id: "valor", t: "Argumentos de valor", q: "¿Usó servicio técnico, garantía en tienda, asesoramiento o fidelización en vez de bajar el precio?" },
      { id: "competencia", t: "Trato de la competencia", q: "¿Explicó lo propio sin desacreditar a la otra marca o tienda?" },
      { id: "cierre", t: "Cierre", q: "¿Intentó cerrar con una fórmula concreta en lugar de dejar la conversación abierta?" }
    ]
  },
  {
    id: "enfado", ini: "C", quien: "Vendedor o responsable de tienda",
    t: "Devolución sin ticket, y con público",
    d: "Una clienta vuelve con una sartén usada, sin ticket, y alza la voz delante de otros clientes. Quiere que se la cambies.",
    persona: "Eres Carmen, 58 años, clienta de una tienda Home&Cook. Compraste una sartén hace unos cinco meses, se ha estropeado el antiadherente y no encuentras el ticket. Estás molesta y hablas alto al principio, delante de otros clientes. NO eres agresiva ni insultas, pero eres firme y repites que es un producto caro. Te calmas si el vendedor baja la voz, te escucha sin interrumpirte, te lleva a un lado y te explica qué puede hacer de verdad. Te enfadas más si te suelta la política de la tienda de carrerilla o te manda al servicio de atención al cliente sin más.",
    abre: "Mire, llevo cinco meses con esta sartén y está inservible. Y no, no tengo el ticket. ¿Qué me va a decir ahora?",
    criterios: [
      { id: "escucha", t: "Escucha y contención", q: "¿Bajó el tono, dejó hablar y evitó discutir delante de los demás?" },
      { id: "empatia", t: "Empatía real", q: "¿Reconoció la molestia con palabras propias en vez de con una fórmula vacía?" },
      { id: "solucion", t: "Qué sí se puede hacer", q: "¿Ofreció una salida concreta en lugar de limitarse a citar la política?" },
      { id: "cierre", t: "Cierre de la conversación", q: "¿Cerró dejando a la clienta con algo claro y con ganas de volver?" }
    ]
  },
  {
    id: "feedback", ini: "D", quien: "Store Manager",
    t: "Feedback a alguien del equipo",
    d: "Llevas tres semanas viendo que un vendedor de tu equipo no ofrece la tarjeta de fidelización y su conversión ha caído. Tienes cinco minutos en la trastienda.",
    persona: "Eres Dani, 26 años, vendedor en una tienda Home&Cook, con un año en la casa. Llevas semanas sin ofrecer la tarjeta de fidelización y tu conversión ha bajado. Al principio te justificas: hay mucha cola, a los clientes les molesta, no te da tiempo. Si tu responsable te trae hechos concretos y te pregunta en vez de sermonearte, te abres y reconoces que te da corte pedir el DNI. Si te sermonea o te compara con otros compañeros, te cierras y respondes con monosílabos.",
    abre: "¿Querías hablar conmigo? Uf, espero que no sea por lo de las cifras otra vez.",
    criterios: [
      { id: "hechos", t: "Hechos, no etiquetas", q: "¿Partió de datos concretos y observables en vez de juicios generales?" },
      { id: "preguntas", t: "Preguntar antes de concluir", q: "¿Indagó qué está pasando de verdad antes de dar la solución?" },
      { id: "respeto", t: "Cuidado de la persona", q: "¿Separó el comportamiento de la persona y evitó comparaciones con compañeros?" },
      { id: "acuerdo", t: "Acuerdo concreto", q: "¿Salieron con un compromiso claro, con qué, cómo y cuándo se revisa?" }
    ]
  }
];
const NIVELES = [
  { id: "facil", t: "Fácil", d: "colabora, se deja llevar" },
  { id: "normal", t: "Normal", d: "como un día cualquiera" },
  { id: "dificil", t: "Difícil", d: "seco, con prisa, poco receptivo" }
];
const TONO = {
  facil: "Eres una persona de trato fácil: colaboras, respondes con frases completas y te dejas ayudar en cuanto el otro lo hace medio bien.",
  normal: "Tu actitud es la de un día cualquiera: ni fácil ni imposible. Respondes con naturalidad y hace falta que el otro lo haga bien para que avances.",
  dificil: "Eres exigente: contestas corto, tienes prisa y no se lo pones fácil. No te convences con la primera respuesta; solo cedes si el otro lo hace realmente bien."
};

RP_ESCENARIOS.push(
  {
    id: "caja", ini: "P", quien: "Vendedor o responsable de tienda", grupo: "Caja y postventa",
    t: "Cliente enfadado en caja, con cola detrás",
    d: "Estás cobrando. Un cliente se cuela y protesta en voz alta porque la promoción que vio anunciada no se le ha aplicado. Detrás hay cuatro personas esperando.",
    persona: "Eres Paco, 47 años, cliente de una tienda Home&Cook. Viste una promoción anunciada en la mesa de la entrada y al llegar a caja no te la han aplicado al producto que llevas, porque tu modelo no entraba en la promoción. Estás molesto y hablas alto delante de la cola: repites que lo pone en el cartel y que te da igual la letra pequeña. No insultas. Te calmas si te atienden rápido, reconocen que el cartel puede llevar a confusión y te dan una salida concreta sin hacerte esperar más. Te enfadas mucho más si te dicen que esperes a que acaben con el resto de la cola o si te explican la política sin mirarte.",
    abre: "Perdona, pero esto no puede ser: en el cartel de la entrada pone 20 % y aquí me cobras el precio entero. ¿Me lo explicas?",
    criterios: [
      { id: "rapidez", t: "Atender sin bloquear la cola", q: "¿Reconoció al cliente enseguida y gestionó el ritmo de la cola en vez de ignorar a uno de los dos lados?" },
      { id: "empatia", t: "Empatía sin darle la razón por sistema", q: "¿Reconoció la confusión del cartel sin culpar al cliente ni a la empresa?" },
      { id: "solucion", t: "Salida concreta", q: "¿Ofreció algo aplicable de verdad y lo explicó claro, en vez de citar la letra pequeña?" },
      { id: "cierre", t: "Cierre y resto de la cola", q: "¿Cerró dejando al cliente atendido y retomó la cola con naturalidad?" }
    ]
  },
  {
    id: "cruzada", ini: "L", quien: "Vendedor de tienda", grupo: "Caja y postventa",
    t: "Venta cruzada en el momento del cobro",
    d: "Una clienta te acaba de decir que se lleva una sartén de la gama Ingenio. Estás cobrando. Tienes veinte segundos para recomendar algo que le sirva de verdad.",
    persona: "Eres Lucía, 34 años, clienta de una tienda Home&Cook. Acabas de decidir que te llevas una sartén Ingenio. Tienes algo de prisa y, de entrada, respondes 'no, nada más, gracias' a cualquier ofrecimiento genérico. Sí te interesas si el vendedor te recomienda algo con un motivo concreto que proteja o mejore lo que llevas (espátulas de silicona que no rayan, tapas, alfombrilla) o si te explica una promoción que encaje. Si te sueltan un '¿algo más?' o te ofrecen cualquier cosa sin relación, te despides con amabilidad y te vas.",
    abre: "Pues me llevo esta, la de 24. ¿Puedo pagar con tarjeta?",
    criterios: [
      { id: "relevancia", t: "Complemento con sentido", q: "¿Recomendó algo relacionado con lo que se llevaba, no un producto al azar?" },
      { id: "motivo", t: "Recomendar, no ofrecer", q: "¿Dio un motivo concreto (protege, dura más, evita un problema) en vez de un '¿algo más?'?" },
      { id: "tiempo", t: "Respetar la prisa", q: "¿Fue breve y no insistió más de una vez ante la negativa?" },
      { id: "alternativa", t: "Plan B", q: "¿Si no coló el complemento, informó de una promoción o novedad útil?" }
    ]
  },
  {
    id: "tarjeta", ini: "A", quien: "Vendedor de tienda", grupo: "Caja y postventa",
    t: "Captación de tarjeta de fidelización",
    d: "Estás cobrando una compra de 78 €. Toca pedirle los datos para la tarjeta: nombre, DNI y correo. Es lo que peor se hace en la red.",
    persona: "Eres Ana, 52 años, clienta de una tienda Home&Cook. Acabas de comprar y te van a pedir datos personales para una tarjeta de fidelización. Tu primera reacción es de recelo: 'no quiero más publicidad', 'no doy el DNI a nadie'. Cedes si te explican en una frase clara qué ganas tú (guardan el ticket, descuento acumulable de 25 €, ofertas solo para clientes) y si te aclaran que no te van a bombardear. Si te piden los datos sin explicar para qué, o si te lo sueltan como un trámite, dices que no y zanjas.",
    abre: "¿Datos? No, mira, prefiero no dar nada. Ya tengo bastante publicidad en el correo.",
    criterios: [
      { id: "beneficio", t: "Beneficio antes que el trámite", q: "¿Explicó qué gana ella antes de pedir un solo dato?" },
      { id: "forma", t: "Pedir sin preguntar si quiere", q: "¿Lo planteó de forma natural y directa, sin el '¿tiene tarjeta?' que invita al no?" },
      { id: "objecion", t: "Manejo del recelo", q: "¿Respondió a la preocupación por la publicidad y los datos con tranquilidad y sin presionar?" },
      { id: "respeto", t: "Aceptar el no", q: "¿Insistió como mucho una vez y cerró bien aunque ella dijera que no?" }
    ]
  },
  {
    id: "seleccion", ini: "S", quien: "Store Manager", grupo: "Conversaciones de responsable",
    t: "Entrevista de selección para tu tienda",
    d: "Entrevistas a una candidata para un puesto de vendedora a 30 horas. Tienes veinte minutos y necesitas saber si vale para sala, no si cae bien.",
    persona: "Eres Sonia, 29 años, candidata a vendedora en una tienda Home&Cook. Vienes de dos años en una cadena de moda y seis meses en hostelería. Eres simpática y hablas mucho, pero tiendes a responder en general ('se me da bien el trato con el cliente') y solo das ejemplos concretos si te los piden expresamente. Tienes una duda sobre los fines de semana que sueltas si te dan pie. Si el entrevistador solo habla de la empresa y no te pregunta, te limitas a asentir. No mientes, pero te vendes bien.",
    abre: "Hola, buenas. Muchas gracias por recibirme. La verdad es que me hace mucha ilusión, me encanta el trato con el cliente.",
    criterios: [
      { id: "conducta", t: "Preguntas de conducta", q: "¿Pidió ejemplos concretos del pasado en vez de conformarse con generalidades?" },
      { id: "escucha", t: "Reparto del tiempo", q: "¿Dejó hablar a la candidata en vez de vender la empresa todo el rato?" },
      { id: "encaje", t: "Encaje real del puesto", q: "¿Comprobó disponibilidad, horarios de fin de semana y expectativas sin rodeos?" },
      { id: "cierre", t: "Cierre de la entrevista", q: "¿Explicó los siguientes pasos y los plazos con claridad?" }
    ]
  },
  {
    id: "salida", ini: "R", quien: "Store Manager o RR.HH.", grupo: "Conversaciones de responsable",
    t: "Entrevista de salida",
    d: "Un vendedor con año y medio en la tienda se va a la competencia. Última semana. Quieres saber qué ha pasado de verdad, no rellenar un formulario.",
    persona: "Eres Rubén, 27 años, vendedor de una tienda Home&Cook. Te vas a la competencia y te queda una semana. Al principio das la respuesta segura: 'nada, una oportunidad mejor, aquí he estado muy bien'. Solo cuentas lo de verdad (los cambios de turno de última hora, que pediste formación dos veces y no llegó, que el reconocimiento se lo llevaba siempre otro) si te preguntan con calma, sin ponerte a la defensiva y dejando claro que no afecta a tu finiquito ni a tus referencias. Si notas reproche o intento de retenerte a la desesperada, vuelves a la respuesta educada y cierras.",
    abre: "Bueno, pues nada, que se acaba. Ha sido una buena etapa, de verdad. Una oportunidad que no podía dejar pasar.",
    criterios: [
      { id: "clima", t: "Crear seguridad", q: "¿Dejó claro que la conversación no le perjudica y que se busca aprender, no retener?" },
      { id: "profundidad", t: "Llegar al motivo real", q: "¿Fue más allá de la primera respuesta educada con preguntas abiertas?" },
      { id: "nodefensa", t: "No defenderse", q: "¿Escuchó las críticas sin justificar ni contraatacar?" },
      { id: "cierre", t: "Buen final", q: "¿Cerró agradeciendo y dejando la puerta abierta, sin promesas vacías?" }
    ]
  },
  {
    id: "formador", ini: "N", quien: "Store Manager o formador", grupo: "Conversaciones de responsable",
    t: "Formar al formador",
    d: "Tienes que enseñar el circuito de venta a alguien que acaba de entrar, en la trastienda y con diez minutos. Que no sea una charla.",
    persona: "Eres Nerea, 22 años, acabas de entrar como vendedora en una tienda Home&Cook y es tu segundo día. Eres receptiva pero te pierdes con la teoría: si te sueltan los siete pasos de carrerilla, asientes y luego no sabes qué hacer. Haces preguntas prácticas y muy concretas ('¿y si me dice que solo está mirando?', '¿tengo que pedir el DNI de verdad?'). Aprendes de verdad cuando te ponen un ejemplo, te dejan probar en voz alta o te dan una sola cosa en la que fijarte hoy.",
    abre: "Vale, tú dirás. Ayer estuve mirando el manual pero, la verdad, no me quedó muy claro por dónde empezar.",
    criterios: [
      { id: "foco", t: "Poco y aplicable", q: "¿Eligió una o dos cosas para hoy en vez de contar los siete pasos enteros?" },
      { id: "ejemplo", t: "Ejemplos y práctica", q: "¿Puso ejemplos concretos y le hizo probar en voz alta, en vez de explicar y ya?" },
      { id: "comprobar", t: "Comprobar que lo ha entendido", q: "¿Le pidió que lo repitiera con sus palabras o le preguntó para verificar?" },
      { id: "seguimiento", t: "Siguiente paso", q: "¿Cerró con qué mirar hoy en sala y cuándo lo repasan juntos?" }
    ]
  },
  {
    id: "centro", ini: "V", quien: "Store Manager o Regional Manager", grupo: "Negociación externa",
    t: "Negociar una acción con el centro comercial",
    d: "Quieres montar una demostración de cocina en el pasillo central en fechas de campaña, y si puede ser en colaboración con otra marca del centro. Hablas con la responsable de marketing del centro.",
    persona: "Eres Virginia, responsable de marketing de un centro comercial. Recibes a un responsable de tienda que quiere un espacio en el pasillo central. De entrada eres amable pero restrictiva: el calendario está muy pedido, hay tarifa por ocupación de espacio y normativa de seguridad para cualquier aparato que caliente. Cedes si te plantean la acción como algo que atrae tráfico al centro y encaja con su calendario de campañas, si te concretan fechas, metros, horario y responsable, y si te resuelven lo de la seguridad. Si te lo plantean como un favor o sin datos, ofreces una fecha mala y cierras.",
    abre: "Dime, ¿qué necesitáis? Te aviso de que el pasillo central para campaña está prácticamente cerrado desde septiembre.",
    criterios: [
      { id: "valor", t: "Qué gana el centro", q: "¿Planteó la acción por el tráfico y el atractivo para el centro, no como un favor a la tienda?" },
      { id: "concrecion", t: "Propuesta concreta", q: "¿Puso fechas, espacio, horario y responsable encima de la mesa?" },
      { id: "obstaculos", t: "Anticipar los peros", q: "¿Se adelantó a la normativa de seguridad y al coste del espacio?" },
      { id: "acuerdo", t: "Cierre con siguiente paso", q: "¿Salió con un compromiso o una fecha de decisión, no con un 'ya hablaremos'?" }
    ]
  }
);
// Las dos primeras escenas y las de responsable se agrupan para la lista
RP_ESCENARIOS.forEach(e => { if (!e.grupo) e.grupo = e.id === "feedback" ? "Conversaciones de responsable" : e.id === "enfado" ? "Caja y postventa" : "Venta en sala"; });
RP_ESCENARIOS.find(e => e.id === "enfado").t = "Reclamación: devolución sin ticket";

const RP_NIVELES = [
  { id: "facil", t: "Fácil", d: "colabora, se deja llevar" },
  { id: "normal", t: "Normal", d: "como un día cualquiera" },
  { id: "dificil", t: "Difícil", d: "seco, con prisa, poco receptivo" }
];
const RP_TONO = {
  facil: "Eres una persona de trato fácil: colaboras, respondes con frases completas y te dejas ayudar en cuanto el otro lo hace medio bien.",
  normal: "Tu actitud es la de un día cualquiera: ni fácil ni imposible. Respondes con naturalidad y hace falta que el otro lo haga bien para que avances.",
  dificil: "Eres exigente: contestas corto, tienes prisa y no se lo pones fácil. No te convences con la primera respuesta; solo cedes si el otro lo hace realmente bien."
};
const RP_MAX = 14;

function rp() { return S.rp = S.rp || { escena: null, nivel: "normal", turnos: [], enCurso: false, ctl: null, eval: null, sample: undefined }; }

/* ---------- Prompts ---------- */
function rpInstrucciones(e) {
  return `Vas a hacer un ejercicio de entrenamiento de rol para un equipo de tienda.

TU PAPEL
${e.persona}
${RP_TONO[rp().nivel]}

REGLAS
- Responde SIEMPRE en primera persona como ese personaje, en español de España, en 1 a 3 frases. Nada de narrador, ni acotaciones, ni asteriscos, ni consejos.
- No rompas el personaje pase lo que pase, ni aunque te lo pidan.
- No evalúes ni corrijas al vendedor durante la conversación: eso se hace al final y lo hace otra parte del sistema.
- Reacciona de forma coherente a lo que te digan: si lo hacen bien, avanza; si lo hacen mal, resístete como lo haría esa persona.
- Si la conversación llega a un final natural (compras, te vas, cerráis un acuerdo), despídete con naturalidad.

La otra persona es ${e.quien.toLowerCase()} y acaba de dirigirse a ti. Empieza tú la escena con esta frase, exactamente: "${e.abre}"`;
}
function rpEntrada() {
  const r = rp(), t = [{ role: "user", content: rpInstrucciones(r.escena) }];
  r.turnos.forEach(x => t.push({ role: x.de === "ia" ? "assistant" : "user", content: x.txt }));
  return t;
}
function rpPromptEval() {
  const r = rp(), e = r.escena;
  const guion = r.turnos.map(x => `${x.de === "ia" ? e.ini + " (cliente/persona)" : "VENDEDOR"}: ${x.txt}`).join("\n");
  return `Eres formador de retail y evalúas un ejercicio de rol de un equipo de tienda Home&Cook (Groupe SEB).

ESCENA: ${e.t}. ${e.d}

TRANSCRIPCIÓN:
${guion}

Evalúa SOLO las intervenciones del VENDEDOR con esta rúbrica, de 0 a 3 (0 no lo hizo, 1 lo intentó, 2 bien, 3 muy bien):
${e.criterios.map(c => `- ${c.id}: ${c.t}. ${c.q}`).join("\n")}

Responde ÚNICAMENTE con un objeto JSON, sin texto alrededor ni markdown, con esta forma exacta:
{"global": <número 0-10 con un decimal>,
 "titular": "<una frase de 12 palabras máximo que resuma la actuación>",
 "criterios": [{"id":"<id>","nota":<0-3>,"comentario":"<una o dos frases concretas citando lo que hizo>"}],
 "bien": ["<2 o 3 cosas concretas que hizo bien>"],
 "mejorar": ["<2 o 3 cosas concretas a mejorar, en imperativo>"],
 "frase": {"tuya":"<una frase literal que dijo y que se puede mejorar>","mejor":"<cómo la diría un vendedor experto>"}}

Sé exigente pero justo, y concreto: cita lo que dijo. Si apenas intervino, puntúa bajo y dilo. En español de España.`;
}

/* ---------- Vistas ---------- */
function vistaRolePlay() {
  const r = rp();
  if (r.sample === undefined) rpCargar();
  if (r.eval) return rpEvaluacion();
  if (r.escena) return rpChat();
  return rpInicio();
}
function rpInicio() {
  const r = rp(), hechas = (progreso().circuito || {}).practicas || [];
  return `<section class="card"><h2>Practica la conversación antes de tenerla en la tienda</h2>
    <p class="hint">Hablas por escrito con un personaje que interpreta una IA. Al terminar recibes una valoración con la rúbrica del circuito. Cinco minutos por ejercicio.</p>
    <div class="aviso-ia"><b>Estás hablando con una inteligencia artificial</b>, no con una persona. La conversación no se guarda: al salir desaparece. La valoración es formativa y no entra en tu evaluación de desempeño.</div>
    ${r.sample === null ? `<div class="bad">El simulador necesita conexión con el modelo y esta copia no la tiene. Funciona abriendo la plataforma publicada en claude.ai; en el fichero descargable y en el despliegue propio hará falta el servidor.</div>` : ""}
    ${[...new Set(RP_ESCENARIOS.map(e => e.grupo))].map(g => `<h3 class="tit-frases" style="margin-top:16px">${esc(g)}</h3>
    <div class="esc-rp">${RP_ESCENARIOS.filter(e => e.grupo === g).map(e => {
      const h = hechas.filter(x => x.escena === e.id).slice(-1)[0];
      return `<button class="escena" data-action="rpElegir" data-e="${e.id}" ${r.sample === null ? "disabled" : ""}>
        <span class="ava-rp">${esc(e.ini)}</span>
        <span><b>${esc(e.t)}</b><span class="hint">${esc(e.d)}</span>
        <span class="quien">${esc(e.quien)}${h ? ` · última nota ${SC.fmt(h.nota, 1)}` : ""}</span></span></button>`;
    }).join("")}</div>`).join("")}
    <h3 class="tit-frases" style="margin-top:18px">Dificultad</h3>
    <div class="pills">${RP_NIVELES.map(n => `<button class="pill ${r.nivel === n.id ? "on" : ""}" data-action="rpNivel" data-n="${n.id}">${n.t}<small>${n.d}</small></button>`).join("")}</div>
  </section>`;
}
function rpChat() {
  const r = rp(), e = r.escena;
  return `<section class="card"><div class="card-h"><h2>${esc(e.t)}</h2>
      <button class="btn small ghost" data-action="rpSalir">Cambiar de situación</button></div>
    <p class="hint">${esc(e.d)}</p>
    <div class="aviso-ia">Hablas con una IA que interpreta a este personaje. Dificultad: ${esc((RP_NIVELES.find(n => n.id === r.nivel) || {}).t || "").toLowerCase()}.</div>
    <div class="hilo" id="hilo"></div>
    <div class="entrada"><textarea id="rpTxt" rows="1" placeholder="Escribe lo que le dirías…"></textarea>
      <button class="btn primary" data-action="rpEnviar" id="rpEnviar">Enviar</button></div>
    <div class="metachat"><span class="num" id="rpCont"></span>
      <span><button class="btn small ghost" data-action="rpParar" id="rpParar" hidden>Parar</button>
      <button class="btn small" data-action="rpEvaluar" id="rpEvaluar">Terminar y evaluar</button></span></div></section>`;
}
function rpPintarHilo(parcial) {
  const r = rp(), h = $("hilo"); if (!h || !r.escena) return;
  h.innerHTML = r.turnos.map(x => `<div class="msg ${x.de}"><span class="ava-rp chico">${x.de === "ia" ? esc(r.escena.ini) : "TÚ"}</span>
      <span class="bub">${esc(x.txt)}</span></div>`).join("")
    + (parcial != null ? `<div class="msg ia ${parcial ? "" : "pensando"}"><span class="ava-rp chico">${esc(r.escena.ini)}</span>
        <span class="bub">${parcial ? esc(parcial) : "Pensando…"}</span></div>` : "");
  const c = $("rpCont"); if (c) c.textContent = `${r.turnos.filter(x => x.de === "yo").length} de ${RP_MAX} intervenciones`;
  h.scrollTop = h.scrollHeight;
}
function rpEvaluacion() {
  const r = rp(), v = r.eval, e = r.escena;
  return `<section class="card"><div class="card-h"><h2>Tu valoración</h2>
      <button class="btn small ghost" data-action="rpSalir">Volver a las situaciones</button></div>
    <div class="nota-rp"><b class="num">${esc(String(v.global))}</b><span class="hint">sobre 10</span></div>
    <p style="font-size:17px;margin-bottom:12px">${esc(v.titular)}</p>
    <div class="crit">${(v.criterios || []).map(c => {
      const def = (e.criterios.find(x => x.id === c.id) || { t: c.id });
      return `<div class="fila"><span>${esc(def.t)}</span><span class="n">${esc(String(c.nota))}/3</span><small>${esc(c.comentario)}</small></div>`;
    }).join("")}</div>
    <div class="bloques" style="margin-top:18px">
      <div class="bloque"><h3>Lo hiciste bien</h3><ul class="lista">${(v.bien || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="bloque"><h3>A mejorar</h3><ul class="lista cuidado">${(v.mejorar || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
    ${v.frase ? `<div class="frases" style="margin-top:6px">
      <blockquote class="frase"><span class="ctx">Dijiste</span><p>${esc(v.frase.tuya)}</p></blockquote>
      <blockquote class="frase"><span class="ctx">Quedaría mejor así</span><p>${esc(v.frase.mejor)}</p></blockquote></div>` : ""}
    <div class="paso-nav"><button class="btn" data-action="rpRepetir">Repetir esta situación</button>
      <span class="muted num">${r.turnos.filter(x => x.de === "yo").length} intervenciones</span>
      <button class="btn primary" data-action="rpSalir">Probar otra</button></div></section>
    <section class="card"><h2>La conversación</h2>
      ${r.turnos.map(x => `<p style="margin-bottom:8px"><b>${x.de === "ia" ? esc(e.ini) : "Tú"}:</b> ${esc(x.txt)}</p>`).join("")}</section>`;
}

/* ---------- Motor ---------- */
async function rpCargar() {
  const r = rp();
  r.sample = null;
  try { r.sample = (window.claude && window.claude.use) ? await window.claude.use("sample") : null; }
  catch (e) { r.sample = null; }
  if (S.modulo === "formacion" && S.vista === "practicar") pintar();
}
function rpError(code) {
  return ({ not_granted: "Has denegado el permiso para hablar con la IA, así que el ejercicio no puede continuar en esta visita.",
    rate_limited: "Demasiadas peticiones seguidas. Espera un minuto y vuelve a intentarlo.",
    invalid_json: "La valoración llegó con un formato ilegible. Prueba a evaluar otra vez.",
    refused: "La IA ha preferido no continuar con esta conversación.", cancelled: "",
    upstream_error: "Ha fallado la conexión con la IA. Inténtalo de nuevo en un momento." })[code]
    || "Algo ha fallado al hablar con la IA. Inténtalo de nuevo.";
}
async function rpTurnoIA() {
  const r = rp();
  if (!r.sample) { toast(rpError("not_granted")); return; }
  r.enCurso = true; r.ctl = new AbortController();
  const p = $("rpParar"), en = $("rpEnviar"); if (p) p.hidden = false; if (en) en.disabled = true;
  rpPintarHilo("");
  try {
    const { text } = await r.sample(rpEntrada(), { signal: r.ctl.signal, modelTier: "quick", cache: false,
      onText: ({ text }) => rpPintarHilo(text) });
    r.turnos.push({ de: "ia", txt: text.trim() });
  } catch (err) {
    if (err && err.code === "cancelled" && err.text) r.turnos.push({ de: "ia", txt: err.text.trim() });
    else toast(rpError(err && err.code));
    if (err && err.code === "not_granted") r.sample = null;
  } finally {
    r.enCurso = false; r.ctl = null;
    const p2 = $("rpParar"), e2 = $("rpEnviar"); if (p2) p2.hidden = true; if (e2) e2.disabled = false;
    rpPintarHilo();
    const t = $("rpTxt"); if (t) t.focus();
  }
}
const ACCIONES_RP = {
  rpElegir(b) { const r = rp(); r.escena = RP_ESCENARIOS.find(x => x.id === b.dataset.e); r.turnos = []; r.eval = null; setTimeout(rpTurnoIA, 60); },
  rpNivel(b) { rp().nivel = b.dataset.n; },
  rpSalir() { const r = rp(); r.escena = null; r.turnos = []; r.eval = null; },
  rpRepetir() { const r = rp(); r.turnos = []; r.eval = null; setTimeout(rpTurnoIA, 60); },
  rpParar() { const r = rp(); if (r.ctl) r.ctl.abort(); return false; },
  rpEnviar() {
    const r = rp(), t = $("rpTxt"), v = (t.value || "").trim();
    if (r.enCurso || !v) return false;
    if (r.turnos.filter(x => x.de === "yo").length >= RP_MAX) { toast("Has llegado al límite del ejercicio. Pulsa Terminar y evaluar."); return false; }
    r.turnos.push({ de: "yo", txt: v }); t.value = ""; t.style.height = "auto";
    rpPintarHilo(); rpTurnoIA(); return false;
  },
  async rpEvaluar(b) {
    const r = rp();
    if (r.enCurso) return false;
    if (r.turnos.filter(x => x.de === "yo").length < 2) { toast("Habla un poco más con el personaje antes de pedir la valoración."); return false; }
    if (!r.sample) { toast(rpError("not_granted")); return false; }
    b.disabled = true; b.textContent = "Valorando…";
    try {
      r.eval = await r.sample.json(rpPromptEval(), { modelTier: "default", cache: false });
      const p = progreso(); p.circuito = p.circuito || { vistos: [] };
      p.circuito.practicas = (p.circuito.practicas || []).concat([{ escena: r.escena.id, nivel: r.nivel, nota: Number(r.eval.global) || 0, fecha: new Date().toISOString() }]);
      guardarProgreso(p);
      log(`Role play completado: ${r.escena.t} (${SC.fmt(Number(r.eval.global) || 0, 1)}/10)`);
      pintar(); window.scrollTo(0, 0);
    } catch (err) { toast(rpError(err && err.code)); b.disabled = false; b.textContent = "Terminar y evaluar"; }
    return false;
  }
};
