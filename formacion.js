"use strict";
/* ===================== FORMACIONES =====================
   Catálogo de formaciones y, dentro, el Circuito de Venta como recorrido
   de tienda en 7 paradas. Contenido tomado del dossier y del Excel de
   sistemática comercial de Home & Cook.
   ======================================================= */

const CURSOS = [
  { id: "circuito", t: "Circuito de Venta", estado: "activo", min: 15,
    d: "Desde que el cliente entra hasta que sale: los siete pasos, con las frases que funcionan en sala.",
    quien: "Todo el equipo de tienda" },
  { id: "kpis", t: "KPIs Retail", estado: "activo", min: 20,
    d: "Conversión, ticket medio, unidades por ticket, margen y productividad: qué mide cada uno y qué hacer cuando bajan.", quien: "SM y ASM" },
  { id: "visual", t: "Visual Merchandising", estado: "activo", min: 20,
    d: "Recorrido del cliente, escaparate según el plan comercial, lineal, precio y la rutina diaria de diez minutos.", quien: "Todo el equipo" },
  { id: "pyl", t: "P&L", estado: "activo", min: 25,
    d: "La cuenta de resultados de una tienda: qué líneas dependen de ti, cuáles no, y cómo leerla cada mes.", quien: "SM" },
  { id: "equipos", t: "Gestión de equipos", estado: "activo", min: 25,
    d: "Horarios, feedback, reconocimiento, conversaciones difíciles y la acogida de quien entra.", quien: "SM y ASM" }
];
/* Las paradas de cada curso. El Circuito tiene las suyas aquí abajo; el
   resto viven en cursos.js con el mismo formato. */
/* El Circuito es el único curso que va a todo el equipo, así que es el que
   más falta hace poder enviar y medir. Siete preguntas, una por parada. */
const TEST_CIRCUITO = [
  { t: "Entra una clienta, la saludas y te contesta «solo estoy mirando». ¿Qué haces?",
    o: ["Le explicas las ofertas de la semana para engancharla",
        "«Perfecto, mire con calma. Si necesita algo estoy por aquí», y te quedas cerca y atento",
        "Asientes y te vas a ordenar el lineal",
        "La sigues a dos metros por si cambia de opinión"],
    r: 1, por: "«Solo estoy mirando» casi nunca significa que no vaya a comprar: significa que todavía no se fía. Le das espacio y te quedas disponible. Irte del todo la pierde; echársele encima la espanta." },
  { t: "Un cliente quiere un aspirador. ¿Por dónde empiezas?",
    o: ["Por el modelo más vendido, que acierta casi siempre",
        "Por el de más margen, que es lo que pesa en el Scorecard",
        "Por preguntar: qué suelo tiene, si hay mascotas, cuántos metros",
        "Por enseñarle la gama entera para que elija"],
    r: 2, por: "Sin saber para qué lo quiere, cualquier producto que propongas es una apuesta. Tres preguntas antes de abrir la boca convierten la recomendación en algo que el cliente reconoce como suyo." },
  { t: "¿Cuál de estas frases argumenta bien?",
    o: ["«Lleva 2.800 W y filtro HEPA de cuatro etapas»",
        "«Es el más vendido de la marca»",
        "«Con el pelo de su perro, este filtro le evita tener que pasarlo dos veces»",
        "«Está en oferta esta semana»"],
    r: 2, por: "La característica es el filtro; el valor es no tener que pasar el aspirador dos veces. Traduce siempre la ficha técnica a lo que le pasa a esa persona en su casa." },
  { t: "«Es muy caro». ¿Cuál es el orden correcto?",
    o: ["Rebatir con un hecho, empatizar y ofrecer una salida",
        "Empatizar, rebatir con un hecho y ofrecer una salida",
        "Ofrecer un descuento y pasar a caja",
        "Enseñarle directamente el modelo más barato"],
    r: 1, por: "Si rebates antes de empatizar, el cliente siente que no le has escuchado y se cierra. Y bajar al modelo barato sin entender la objeción suele perder la venta y el margen a la vez." },
  { t: "Has argumentado, has resuelto la objeción y el cliente asiente. ¿Qué haces?",
    o: ["Esperas a que lo diga él, que no hay que presionar",
        "Le das más argumentos para asegurarte",
        "Preguntas: «¿se lo preparo?»",
        "Le propones que se lo piense y vuelva"],
    r: 2, por: "El cierre no es un momento mágico: es preguntar. Si los pasos anteriores están bien hechos, es casi un trámite. No preguntar es la causa más habitual de una venta que se cae sola." },
  { t: "El cliente ya ha dicho que sí al aspirador. ¿Qué dices?",
    o: ["«¿Algo más?»",
        "«Le pongo también el pack de filtros de recambio, que así no se queda tirado en seis meses»",
        "Nada, no conviene presionar después del sí",
        "Le enseñas la gama de cafeteras por si acaso"],
    r: 1, por: "«¿Algo más?» se contesta que no por inercia. La venta cruzada es recomendar algo que protege o mejora lo que acaba de comprar, no ofrecer un producto cualquiera." },
  { t: "Estáis en caja. ¿Qué es lo último que debe pasar?",
    o: ["Cobrar rápido, que hay cola",
        "Ofrecerle la tarjeta de fidelización y explicarle la garantía en una frase",
        "Pedirle que valore la tienda en una encuesta",
        "Darle el tique y despedirte"],
    r: 1, por: "En caja todavía se vende, y es el último recuerdo que se lleva. La tarjeta y una frase sobre la garantía dan un motivo real para volver; la prisa se nota y se recuerda." }
];
function cursoDe(id) { return CURSOS.find(c => c.id === id); }
function pasosDe(id) { return id === "circuito" ? CIRCUITO : ((typeof CURSOS_CONTENIDO !== "undefined" && CURSOS_CONTENIDO[id]) || {}).pasos || []; }
function testDe(id) { return id === "circuito" ? TEST_CIRCUITO : ((typeof CURSOS_CONTENIDO !== "undefined" && CURSOS_CONTENIDO[id]) || {}).test || null; }

const CIRCUITO = [
  {
    id: "acogida", t: "Acogida", sub: "Bienvenida y abordaje", min: 2,
    idea: "Los primeros diez segundos deciden si el cliente se deja ayudar. Saluda siempre, pero no te le eches encima.",
    haces: [
      "Contacto visual en cuanto entra, estés donde estés.",
      "Sonrisa y saludo: buenos días o buenas tardes, y bienvenido a Home&Cook.",
      "Dale espacio: entre 30 y 60 segundos para que mire, sin perderle de vista.",
      "Elige el abordaje según el tráfico que haya en ese momento."
    ],
    dices: [
      { c: "Saludo", f: "Buenos días, bienvenido a Home&Cook." },
      { c: "Poco tráfico, foco fidelizar", f: "¿Es su primera vez aquí? ¿Conoce la tienda?" },
      { c: "Poco tráfico", f: "Todas las marcas de la tienda son del mismo grupo: está comprando directamente al fabricante, con dos años de garantía y reparabilidad hasta diez años en muchos productos." },
      { c: "Poco tráfico", f: "Al ser tienda outlet todos los productos tienen descuento, y en la mesa encontrará las promociones especiales." },
      { c: "Mucho tráfico, foco venta", f: "¿En qué le puedo ayudar? ¿Qué está buscando?" },
      { c: "Mucho tráfico", f: "¿Conoce nuestro robot de aspiración? Se lo muestro sin compromiso." },
      { c: "Si dice que no quiere ayuda", f: "Para cualquier consulta estoy a su disposición." }
    ],
    ojo: [
      "Abordar en el primer segundo: el cliente se cierra y contesta \"solo estoy mirando\".",
      "Dejar de mirarle mientras le das espacio: espacio no es desaparecer.",
      "Soltar la promoción antes de saber a qué ha venido."
    ]
  },
  {
    id: "deteccion", t: "Detección de necesidades", sub: "Preguntar y escuchar", min: 3,
    idea: "Antes de explicar nada, pregunta. Si no sabes para qué lo quiere, cualquier producto que propongas es una apuesta.",
    haces: [
      "Justifica por qué preguntas: al cliente no le molesta si entiende para qué.",
      "Mezcla preguntas abiertas y cerradas hasta tener claro el uso real.",
      "Escucha activa: déjale hablar y no interrumpas para argumentar.",
      "Resume en voz alta lo que te ha contado antes de proponer."
    ],
    dices: [
      { c: "Justificar", f: "Para recomendarle lo que mejor le encaje, ¿me permite un par de preguntas?" },
      { c: "Cerradas", f: "¿Cuántas personas son en casa? ¿Qué tipo de cocina tiene? ¿Qué uso va a darle: picar, batir, freír?" },
      { c: "Resumen", f: "Entonces busca un aspirador para una casa grande, con moqueta y mascotas, y para uso diario." }
    ],
    ojo: [
      "Empezar a argumentar con la tercera frase de la conversación.",
      "Encadenar preguntas sin explicar por qué: parece un interrogatorio.",
      "No resumir: el resumen es lo que hace que el cliente sienta que le has entendido."
    ],
    extra: "necesidades"
  },
  {
    id: "argumentacion", t: "Argumentación", sub: "Características y valor", min: 3,
    idea: "No recites la ficha técnica: traduce cada característica a lo que le pasa a ese cliente en su casa.",
    haces: [
      "Presenta dos o tres opciones que encajen con lo detectado, no todo el lineal.",
      "Explica solo las características que le importan a él.",
      "Da valor: número uno en ventas, fiabilidad, tecnología patentada.",
      "Deja tocar el producto y haz demostración: enciéndelo, desmóntalo, úsalo.",
      "Comprueba aceptación antes de seguir."
    ],
    dices: [
      { c: "Característica con beneficio", f: "2.800 W, 45 g/m y 400 salidas de vapor para repartirlo de forma homogénea: plancha perfecta en mucho menos tiempo." },
      { c: "Característica con beneficio", f: "Olla con tres válvulas de seguridad, cromargan y fabricada en Alemania: una olla para toda la vida que le resuelve recetas en veinte minutos." },
      { c: "Valor", f: "Es nuestro número uno en ventas." },
      { c: "Valor", f: "Es un producto patentado, no va a encontrar otro igual." },
      { c: "Comprobar aceptación", f: "¿Qué le parece? ¿Es lo que estaba buscando?" }
    ],
    ojo: [
      "Soltar vatios y materiales sin decir qué gana el cliente con ellos.",
      "Argumentar con el producto dentro de la caja o en la estantería.",
      "Seguir hablando sin comprobar si le encaja lo que le estás contando."
    ],
    extra: "argumentos"
  },
  {
    id: "objeciones", t: "Objeciones", sub: "Empatizar, rebatir, ofrecer", min: 2,
    idea: "Una objeción es interés con dudas. El orden siempre es el mismo: empatiza, rebate con un hecho y ofrece una salida.",
    haces: [
      "Empatiza primero: nunca discutas la percepción del cliente.",
      "Rebate con hechos concretos, no con opiniones.",
      "Ofrece siempre una alternativa, aunque sea de otra marca de la casa.",
      "Refuerza con lo que solo tenemos nosotros: servicio técnico nacional, atención personalizada, garantía técnica en tienda y tarjeta de fidelización."
    ],
    dices: [
      { c: "Busca otra marca", f: "Esa marca no la trabajamos, pero si tiene un minuto le enseño qué le aporta Rowenta para lo que usted necesita." },
      { c: "Mala experiencia previa", f: "Es normal que piense así, le entiendo. Por lo que me cuenta, el antiadherente no le respondió; nuestros productos han evolucionado mucho y este lleva un recubrimiento de titanio con mucha más resistencia." },
      { c: "Mala experiencia previa", f: "Si no quedó contento con esa gama, podemos ir a la otra marca del grupo y le explico las diferencias." },
      { c: "Precio", f: "Aquí tiene servicio técnico en toda España ante cualquier incidencia, atención personalizada y garantía técnica en la propia tienda." },
      { c: "Precio", f: "Además, con la tarjeta de fidelización tiene acceso prioritario a ofertas y un descuento de 25 €." }
    ],
    ojo: [
      "Rebatir antes de empatizar: el cliente se pone a la defensiva.",
      "Hablar mal de otra marca en vez de explicar lo nuestro.",
      "Quedarte en el \"no\" sin ofrecer alternativa."
    ]
  },
  {
    id: "cierre", t: "Cierre de venta", sub: "Cinco formas de rematar", min: 2,
    idea: "El cierre no es un momento mágico: es preguntar. Si has hecho bien los pasos anteriores, es casi un trámite.",
    haces: [
      "Elige la fórmula según cómo esté el cliente, y usa solo una.",
      "Cuando diga que sí, deja de vender y refuerza la decisión.",
      "Aprovecha el cierre para ofrecer la tarjeta de fidelización."
    ],
    dices: [
      { c: "Condicionando el compromiso", f: "Siendo varios en casa y con el volumen de ropa que plancha, lo razonable es que se decida por el centro de planchado." },
      { c: "Ofreciendo alternativas", f: "¿Entonces se lleva la ProMaster o la SteamForce?" },
      { c: "Cierre directo", f: "Es una promoción que no tenemos siempre. ¿Cuántas sartenes se lleva?" },
      { c: "Pregunta de aceptación", f: "La opción más recomendable es el Air Force 360, por diseño, succión y versatilidad. Es buena opción, ¿verdad?" },
      { c: "Con la tarjeta", f: "Con nuestra tarjeta se beneficia de 25 € de descuento adicional en esta compra." },
      { c: "Cuando dice que sí", f: "Ha hecho una buena compra." }
    ],
    ojo: [
      "No cerrar nunca y esperar a que el cliente lo diga.",
      "Seguir argumentando después del sí: solo puedes perder la venta.",
      "Encadenar tres fórmulas de cierre seguidas."
    ]
  },
  {
    id: "cruzada", t: "Venta cruzada", sub: "Recomendar, no ofrecer", min: 2,
    idea: "No preguntes si quiere algo más. Recomienda algo que proteja o mejore lo que acaba de comprar.",
    haces: [
      "Propón el complemento con un motivo, no por catálogo.",
      "Si el producto no admite complemento, informa de promociones y novedades.",
      "Apóyate otra vez en la tarjeta: con una compra adicional puede alcanzar el descuento."
    ],
    dices: [
      { c: "Sartenes", f: "¿Por qué no se lleva estas espátulas de silicona? No rascan la sartén y aguantan hasta 140 grados." },
      { c: "Sartenes", f: "Estas alfombrillas son del propio fabricante y, por los materiales, alargan la vida de las sartenes." },
      { c: "Centro de planchado", f: "Para este centro le recomiendo una tabla homologada, resistente y regulable, específica para centros de planchado." },
      { c: "Aspirador", f: "Para este aspirador le recomiendo nuestras bolsas homologadas: aíslan mejor el polvo y aguantan más que las convencionales." },
      { c: "Sin complemento posible", f: "Le aconsejo que eche un vistazo a la promoción flash que termina hoy: 20 % adicional en batidoras Moulinex y las sartenes Character en 3x2." },
      { c: "Tarjeta", f: "Con una compra adicional de X € tendría 25 € de descuento en su próxima visita." }
    ],
    ojo: [
      "El clásico \"¿algo más?\": no vende nada.",
      "Ofrecer el complemento después de cobrar.",
      "Recomendar accesorios que no tienen que ver con lo que se lleva."
    ]
  },
  {
    id: "despedida", t: "Despedida y caja", sub: "El último contacto", min: 2,
    idea: "Es el último recuerdo que se lleva de la tienda, y lo que decide si vuelve. En caja todavía se vende.",
    haces: [
      "En caja, ofrece producto pequeño: utensilios, picadora, espiralizador.",
      "Pide los datos de la tarjeta sin preguntar si la quiere: explícale directamente qué gana.",
      "Recuerda la garantía antes de despedirte.",
      "Actitud positiva y sonrisa, por favor y gracias, y trato de usted.",
      "Si paga con tarjeta, fíjate en el apellido y úsalo al agradecer.",
      "Muestra el datáfono con el importe, y ayuda con el producto hasta la puerta si hace falta."
    ],
    dices: [
      { c: "Tarjeta de fidelización", f: "Si me da brevemente su nombre, DNI y correo, le guardamos el ticket y le avisamos de las ofertas exclusivas para clientes. Además, por cada 40 € acumula un punto, y con seis puntos tiene 25 € de descuento." },
      { c: "Garantía", f: "Recuerde que tiene garantía técnica de quince días en tienda y dos años a nivel mundial." },
      { c: "Despedida", f: "Que disfrute de su compra, y esperamos verle pronto por Home&Cook." },
      { c: "Despedida", f: "Espero que vuelva a visitarnos y nos cuente qué tal le ha ido con el producto." },
      { c: "Con el apellido", f: "Muchas gracias, señor Fernández." }
    ],
    ojo: [
      "Preguntar \"¿tiene tarjeta?\" en vez de explicar la ventaja.",
      "Despedir sin mirar, mientras ya atiendes al siguiente.",
      "Olvidar la garantía: es lo que más tranquiliza al cliente que duda."
    ]
  }
];

/* ---------------- Progreso ---------------- */
function claveProgreso() { return "sc-formacion-" + (S.me ? S.me.id : "anon"); }
function progreso() {
  try { return JSON.parse(localStorage.getItem(claveProgreso())) || {}; } catch (e) { return {}; }
}
function guardarProgreso(p) { try { localStorage.setItem(claveProgreso(), JSON.stringify(p)); } catch (e) {} }
/* El progreso se guarda por curso, con la misma clave que su id. El del
   Circuito guarda además las prácticas con IA y las partidas del arcade. */
function progresoCurso(id) { return progreso()[id || S.curso] || {}; }
function vistos(id) { return progresoCurso(id).vistos || []; }
function marcarVisto(paso) {
  const cid = S.curso, p = progreso(); p[cid] = p[cid] || { vistos: [] };
  p[cid].vistos = p[cid].vistos || [];
  if (!p[cid].vistos.includes(paso)) p[cid].vistos.push(paso);
  p[cid].ultimo = paso;
  if (p[cid].vistos.length === pasosDe(cid).length && !p[cid].completado) {
    p[cid].completado = new Date().toISOString();
    log("Formación completada: " + cursoDe(cid).t);
  }
  guardarProgreso(p);
}
function cursosCompletados() { return CURSOS.filter(c => progresoCurso(c.id).completado).length; }

/* ---------------- Catálogo ---------------- */
function pintarFormaciones() {
  if (S.curso) return pintarCurso();
  const pie = c => {
    const p = progresoCurso(c.id), v = (p.vistos || []).length, n = pasosDe(c.id).length;
    const extra = [];
    if (c.id === "circuito") {
      const narc = (p.arcade || {}).partidas || 0;
      if (narc) extra.push(`${narc} ${narc === 1 ? "partida" : "partidas"}`);
    }
    if (p.test) extra.push(`test ${p.test.aciertos} de ${p.test.total}`);
    const base = p.completado ? "Completada el " + fechaES(p.completado) : (v ? `${v} de ${n} pasos vistos` : "Sin empezar");
    return [base].concat(extra).join(" · ");
  };
  const hechos = cursosCompletados();
  $("vista").innerHTML = `<div class="page">
    <div class="page-h"><h1>Formaciones</h1><span class="muted num">${hechos} de ${CURSOS.length} completadas</span></div>
    <p class="lead">Formación breve, pensada para hacerla en el móvil antes de abrir o entre horas. Cada curso termina con un test corto y deja registro de quién lo ha completado.</p>
    <div class="cards">${CURSOS.map(c => { const p = progresoCurso(c.id), n = pasosDe(c.id).length, v = (p.vistos || []).length;
      return `<button class="mod curso-card ${p.completado ? "hecho" : ""}" data-action="abrirCurso" data-c="${c.id}">
      <span class="mod-t">${esc(c.t)}${p.completado ? `<span class="badge ok">Completada</span>` : ""}</span>
      <span class="mod-d">${esc(c.d)}</span>
      <span class="curso-meta">${esc(c.quien)} · ${c.min} min · ${n} paradas${testDe(c.id) ? " + test" : " + práctica con IA"}</span>
      <i class="prog mini" aria-hidden="true"><span style="width:${n ? Math.round(v / n * 100) : 0}%"></span></i>
      <span class="mod-f">${esc(pie(c))}</span></button>`; }).join("")}</div></div>`;
}

/* ---------------- Un curso: recorrido por paradas ---------------- */
function pintarCurso() {
  if (S.chuleta) return pintarChuleta();
  if (S.vista === "test") return pintarTest();
  if (S.curso === "circuito" && S.vista === "arcade") return pintarArcade();
  const curso = cursoDe(S.curso), PASOS = pasosDe(S.curso), vis = vistos();
  if (!curso || !PASOS.length) { S.curso = null; return pintarFormaciones(); }
  const i = Math.max(0, PASOS.findIndex(p => p.id === S.paso));
  const p = PASOS[i], ult = i === PASOS.length - 1, esCircuito = S.curso === "circuito";
  const prog = progresoCurso(), test = testDe(S.curso);
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverCursos">← Formaciones</button>
      <h1>${esc(curso.t)}</h1></div>
      <div class="curso-acc">${esCircuito ? `<button class="btn small" data-action="arcade">Jugar el turno</button>` : ""}
        ${test ? `<button class="btn small" data-action="irTest">Hacer el test</button>` : ""}
        <button class="btn small" data-action="chuleta">Ver la chuleta</button>
        <button class="btn small ghost" data-action="imprimirCurso">Imprimir</button></div></div>

    <div class="ruta" style="--n:${PASOS.length}">
      <div class="ruta-linea"><i style="width:${Math.round(vis.length / PASOS.length * 100)}%"></i></div>
      ${PASOS.map((x, k) => `<button class="parada ${x.id === p.id ? "on" : ""} ${vis.includes(x.id) ? "hecha" : ""}" data-action="irPaso" data-p="${x.id}">
        <span class="bolita">${vis.includes(x.id) ? "✓" : k + 1}</span><span class="parada-t">${esc(x.t)}</span></button>`).join("")}
    </div>

    <section class="card paso">
      <div class="paso-h"><span class="paso-n">${i + 1}</span><div><h2>${esc(p.t)}</h2><p class="muted">${esc(p.sub)} · ${p.min} min</p></div>
        <span class="paso-est ${vis.includes(p.id) ? "ok" : ""}">${vis.includes(p.id) ? "Visto" : "Pendiente"}</span></div>
      <p class="idea">${esc(p.idea)}</p>

      <div class="bloques">
        <div class="bloque"><h3>Qué haces</h3><ul class="lista">${p.haces.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="bloque"><h3>Cuidado con</h3><ul class="lista cuidado">${p.ojo.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>

      <h3 class="tit-frases">${esCircuito ? "Qué dices" : "Frases que ayudan"}</h3>
      <div class="frases">${p.dices.map((f, k) => `<blockquote class="frase"><span class="ctx">${esc(f.c)}</span>
        <p>${esc(f.f)}</p><button class="btn small ghost" data-action="copiarFrase" data-i="${i}" data-k="${k}">Copiar</button></blockquote>`).join("")}</div>

      ${p.extra === "necesidades" ? extraNecesidades() : ""}
      ${p.extra === "argumentos" ? extraArgumentos() : ""}

      ${ult && test ? `<div class="cta-rp"><div><b>Has llegado al final del curso.</b>
        <p class="hint">Cinco preguntas para comprobar que te lo llevas. Se pueden repetir las veces que quieras; queda la última.</p></div>
        <span><button class="btn primary" data-action="irTest">Hacer el test</button></span></div>` : ""}
      <div class="paso-nav">
        <button class="btn" data-action="pasoAnt" ${i === 0 ? "disabled" : ""}>Anterior</button>
        <span class="muted num">${vis.length} de ${PASOS.length} pasos</span>
        <button class="btn primary" data-action="pasoSig">${ult ? "Marcar y terminar" : "Lo tengo, siguiente"}</button>
      </div>
    </section>

    ${prog.completado ? `<section class="card fin"><h2>Formación completada</h2>
      <p class="hint">Terminada el ${fechaES(prog.completado)}.${prog.test ? ` Test: ${prog.test.aciertos} de ${prog.test.total} aciertos el ${fechaES(prog.test.fecha)}.` : ""} Puedes volver cuando quieras: la chuleta está pensada para repasar en dos minutos antes de abrir.</p>
      <div class="actions"><button class="btn" data-action="chuleta">Ver la chuleta</button>${test ? `<button class="btn" data-action="irTest">${prog.test ? "Repetir el test" : "Hacer el test"}</button>` : ""}<button class="btn ghost" data-action="reiniciarCurso">Empezar de nuevo</button></div></section>` : ""}
  </div>`;
}

/* ---------------- Test final ---------------- */
function testEstado() { S.test = S.test || { resp: {}, corregido: false }; return S.test; }
function pintarTest() {
  const curso = cursoDe(S.curso), test = testDe(S.curso), st = testEstado();
  if (!test) { S.vista = "recorrido"; return pintarCurso(); }
  const n = test.length, contestadas = test.filter((q, i) => typeof st.resp[i] === "number").length;
  const aciertos = test.filter((q, i) => st.resp[i] === q.r).length;
  const prog = progresoCurso();
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverRecorrido">← ${esc(curso.t)}</button>
      <h1>Comprueba lo aprendido</h1></div>
      ${prog.test ? `<span class="muted num">Último resultado: ${prog.test.aciertos} de ${prog.test.total}</span>` : ""}</div>
    ${st.corregido ? `<section class="card test-res ${aciertos >= 4 ? "ok" : ""}">
        <div class="nota-rp"><b class="num">${aciertos}</b><span class="hint">de ${n} aciertos</span></div>
        <p class="test-titular">${aciertos === n ? "Impecable. Te lo llevas entero." : aciertos >= 4 ? "Bien. Repasa la que has fallado y listo." : aciertos >= 3 ? "A medias: vuelve a las paradas que te han fallado antes de repetir." : "Vuelve al recorrido con calma y repite el test después."}</p>
        <div class="actions"><button class="btn" data-action="volverRecorrido">Volver al recorrido</button><button class="btn primary" data-action="testRepetir">Repetir el test</button></div>
      </section>` : ""}
    <div class="qlist test">${test.map((q, i) => {
      const v = st.resp[i], ok = st.corregido && v === q.r;
      return `<section class="q"><p class="qt"><span class="qn">${i + 1}</span>${esc(q.t)}</p>
        <div class="opts">${q.o.map((o, k) => `<button type="button" class="opt ${v === k ? "on" : ""} ${st.corregido ? (k === q.r ? "bien" : (v === k ? "mal" : "")) : ""}" data-action="testResp" data-q="${i}" data-v="${k}" ${st.corregido ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
        ${st.corregido ? `<p class="porque ${ok ? "ok" : ""}"><b>${ok ? "Correcto." : "La correcta era la " + (q.r + 1) + "."}</b> ${esc(q.por)}</p>` : ""}</section>`;
    }).join("")}</div>
    ${st.corregido ? "" : `<div class="guest-f"><span class="muted num">${contestadas} de ${n} respondidas</span>
      <button class="btn primary" data-action="testCorregir" ${contestadas === n ? "" : "disabled"}>Corregir</button></div>`}
  </div>`;
}

function extraNecesidades() {
  return `<div class="extra"><h3>Preguntas por familia</h3>
    <p class="hint">De la sistemática comercial. Elige la familia y llévate dos o tres preguntas a la conversación.</p>
    <div class="pills fam">${CURSO_DATOS.necesidades.map((f, k) => `<button class="pill ${k === (S.fam || 0) ? "on" : ""}" data-action="famSel" data-k="${k}">${esc(f.t)}</button>`).join("")}</div>
    <ul class="preguntas">${(CURSO_DATOS.necesidades[S.fam || 0] || { items: [] }).items.map(q => `<li>${esc(q)}</li>`).join("")}</ul></div>`;
}
function extraArgumentos() {
  const lista = CURSO_DATOS.argumentos;
  const q = (S.busca || "").toLowerCase();
  const enc = q ? lista.filter(x => x.t.toLowerCase().includes(q) || x.items.some(i => i.toLowerCase().includes(q))) : lista;
  const sel = enc.find(x => x.t === S.prod) || enc[0];
  return `<div class="extra"><h3>Puntos fuertes por producto</h3>
    <p class="hint">${lista.length} productos con sus argumentos, tal y como están en la sistemática comercial.</p>
    <input id="buscaProd" class="busca" placeholder="Busca un producto o una palabra: titanio, silencio, autonomía…" value="${esc(S.busca || "")}">
    ${enc.length ? `<div class="pills prod">${enc.slice(0, 40).map(x => `<button class="pill ${sel && x.t === sel.t ? "on" : ""}" data-action="prodSel" data-t="${esc(x.t)}">${esc(x.t)}</button>`).join("")}</div>
    <ul class="preguntas">${sel.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`
    : `<p class="empty">Ningún producto coincide con esa búsqueda.</p>`}</div>`;
}

function pintarArcade() {
  const a = (progreso().circuito || {}).arcade || {};
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverRecorrido">← Recorrido</button>
      <h1>El turno en la tienda</h1></div>
      ${a.partidas ? `<span class="muted num">${a.partidas} ${a.partidas === 1 ? "partida" : "partidas"}</span>` : `<span class="muted">Prototipo en pruebas</span>`}</div>
    ${vistaArcade()}</div>`;
  arcRefrescar(); arcPintarDecision();
}
function pintarChuleta() {
  const curso = cursoDe(S.curso), PASOS = pasosDe(S.curso);
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="chuletaNo">← Volver al recorrido</button>
      <h1>${esc(curso.t)} en una pantalla</h1></div>
      <button class="btn small" data-action="imprimirCurso">Imprimir</button></div>
    <div class="chuleta">${PASOS.map((p, k) => `<section class="card"><div class="paso-h"><span class="paso-n">${k + 1}</span><div><h2>${esc(p.t)}</h2><p class="muted">${esc(p.sub)}</p></div></div>
      <ul class="lista">${p.haces.slice(0, 3).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <blockquote class="frase mini"><p>${esc(p.dices[0].f)}</p></blockquote></section>`).join("")}</div></div>`;
}

function informeCurso() {
  const curso = cursoDe(S.curso), PASOS = pasosDe(S.curso), esCircuito = S.curso === "circuito";
  return `<div class="pr-head">${logo(56)}<div><h1>${esc(curso.t)}</h1>
    <p class="meta">RRHH x Home&Cook, Groupe SEB${S.me ? " · " + esc(S.me.nombre) : ""}</p></div></div>
    ${PASOS.map((p, k) => `<h2>${k + 1}. ${esc(p.t)} — ${esc(p.sub)}</h2>
      <p><b>${esc(p.idea)}</b></p>
      <p><b>Qué haces:</b></p><ul>${p.haces.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <p><b>${esCircuito ? "Qué dices" : "Frases que ayudan"}:</b></p><ul>${p.dices.map(f => `<li><i>${esc(f.c)}:</i> ${esc(f.f)}</li>`).join("")}</ul>
      <p><b>Cuidado con:</b></p><ul>${p.ojo.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`).join("")}`;
}

const ACCIONES_FORMACION = {
  abrirCurso(b) {
    S.curso = b.dataset.c; const PASOS = pasosDe(S.curso);
    S.paso = progresoCurso().ultimo || (PASOS[0] || {}).id; S.chuleta = false; S.vista = "recorrido"; S.test = null;
  },
  volverCursos() { S.curso = null; S.chuleta = false; S.vista = "recorrido"; },
  irPaso(b) { S.paso = b.dataset.p; window.scrollTo(0, 0); },
  pasoAnt() { const P = pasosDe(S.curso), i = P.findIndex(x => x.id === S.paso); if (i > 0) S.paso = P[i - 1].id; window.scrollTo(0, 0); },
  pasoSig() {
    const P = pasosDe(S.curso), i = P.findIndex(x => x.id === S.paso);
    marcarVisto(S.paso);
    if (i < P.length - 1) { S.paso = P[i + 1].id; window.scrollTo(0, 0); }
    else toast("Formación completada");
  },
  chuleta() { S.chuleta = true; S.vista = "recorrido"; window.scrollTo(0, 0); },
  arcade() { S.vista = "arcade"; S.chuleta = false; window.scrollTo(0, 0); },
  volverRecorrido() { S.vista = "recorrido"; },
  chuletaNo() { S.chuleta = false; },
  reiniciarCurso() { if (!confirm("Se borra tu progreso de esta formación. ¿Seguro?")) return false; const p = progreso(); delete p[S.curso]; guardarProgreso(p); S.paso = (pasosDe(S.curso)[0] || {}).id; },
  famSel(b) { S.fam = Number(b.dataset.k); },
  prodSel(b) { S.prod = b.dataset.t; },
  copiarFrase(b) {
    const f = pasosDe(S.curso)[Number(b.dataset.i)].dices[Number(b.dataset.k)].f;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(f).then(() => toast("Frase copiada"), () => toast(f));
    else toast(f);
    return false;
  },
  imprimirCurso() { $("print").innerHTML = informeCurso(); window.print(); return false; },
  /* Test final */
  irTest() { S.vista = "test"; S.chuleta = false; S.test = { resp: {}, corregido: false }; window.scrollTo(0, 0); },
  testResp(b) { const st = testEstado(); if (st.corregido) return false; const q = Number(b.dataset.q), v = Number(b.dataset.v); st.resp[q] = st.resp[q] === v ? undefined : v; if (st.resp[q] === undefined) delete st.resp[q]; },
  testCorregir() {
    const st = testEstado(), test = testDe(S.curso);
    if (test.some((q, i) => typeof st.resp[i] !== "number")) { toast("Responde todas las preguntas antes de corregir."); return false; }
    st.corregido = true;
    const aciertos = test.filter((q, i) => st.resp[i] === q.r).length;
    const p = progreso(); p[S.curso] = p[S.curso] || { vistos: [] };
    p[S.curso].test = { aciertos, total: test.length, fecha: new Date().toISOString() };
    guardarProgreso(p);
    log(`Test de formación: ${cursoDe(S.curso).t} (${aciertos}/${test.length})`);
    window.scrollTo(0, 0);
  },
  testRepetir() { S.test = { resp: {}, corregido: false }; window.scrollTo(0, 0); }
};

/* ============ El curso visto por quien entra con un código ============
   Mismas pantallas que dentro de la plataforma, pero sin menú, sin guardar
   progreso en el navegador (el código solo sirve una vez) y terminando en el
   test. Reutiliza las clases del recorrido interno, así que se ve igual.
   ====================================================================== */
function pasoInvitado(pl) {
  const P = pasosDe(pl.curso), n = P.length;
  const i = Math.min(Math.max(0, INV.paso | 0), n - 1), p = P[i];
  if (!p) { INV.fase = "test"; return ""; }
  const curso = CURSOS.find(c => c.id === pl.curso) || { t: "" };
  return `<div class="guest wide"><div class="esquina"><span class="chipseb">${logoSEB(32)}</span></div>
    <div class="guest-card wide curso-inv">${selectorIdioma()}
      <div class="guest-h">${logo(56)}<div><h1>${esc(curso.t)}</h1>
        <p class="sub">${esc(INV.datos.tienda || "")}${INV.datos.destinatario ? " · " + esc(INV.datos.destinatario) : ""}</p></div></div>
      <div class="ruta-inv"><div class="ruta-linea"><i style="width:${Math.round((i + 1) / n * 100)}%"></i></div>
        <span class="muted">Pantalla ${i + 1} de ${n}</span></div>
      <section class="paso">
        <div class="paso-h"><span class="paso-n">${i + 1}</span><div><h2>${esc(p.t)}</h2>
          <p class="muted">${esc(p.sub)} · ${p.min} min</p></div></div>
        <p class="idea">${esc(p.idea)}</p>
        <div class="bloques">
          <div class="bloque"><h3>Qué haces</h3><ul class="lista">${p.haces.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
          <div class="bloque"><h3>Cuidado con</h3><ul class="lista cuidado">${p.ojo.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        </div>
        <h3 class="tit-frases">Frases que ayudan</h3>
        <div class="frases">${p.dices.map(f => `<blockquote class="frase"><span class="ctx">${esc(f.c)}</span><p>${esc(f.f)}</p></blockquote>`).join("")}</div>
      </section>
      <div class="guest-f">
        <button class="btn" data-action="invPasoAnt" ${i === 0 ? "disabled" : ""}>Anterior</button>
        <span class="muted num">${i + 1} / ${n}</span>
        <button class="btn primary" data-action="invPasoSig">${i === n - 1 ? "Ir al test" : "Siguiente"}</button>
      </div></div>${bandaMarcas()}</div>`;
}
const ACCIONES_INV_CURSO = {
  invPasoAnt() { INV.paso = Math.max(0, (INV.paso | 0) - 1); window.scrollTo(0, 0); pintarInvitado(); return false; },
  invPasoSig() {
    const pl = SC.plantilla(INV.datos.plantilla), n = pasosDe(pl.curso).length;
    if ((INV.paso | 0) >= n - 1) INV.fase = "test"; else INV.paso = (INV.paso | 0) + 1;
    window.scrollTo(0, 0); pintarInvitado(); return false;
  },
  invVolverCurso() { INV.fase = "curso"; window.scrollTo(0, 0); pintarInvitado(); return false; }
};

/* ===================== FORMACIONES PARA GENTE SIN CUENTA =====================
   El equipo de tienda no tiene usuario en la plataforma. Para que puedan hacer
   una formación se usa el mismo circuito que la Encuesta de Clima: RR.HH. crea
   una campaña, genera un código por persona y se lo envía. Quien recibe el
   código lee el curso y hace el test; la nota vuelve aquí.

   El test de cada curso se convierte en una plantilla igual que las demás, así
   que todo lo que ya existe (puntuar, resultados por tienda, ficha de
   respuestas, borrar, enviar el correo) funciona sin tocar nada. La opción
   correcta vale 1 punto y las demás 0.
   ============================================================================ */
(function () {
  const C = SC.CONFIG;
  C.tiposPrueba.formacion = { t: { es: "Formación a tienda", en: "Store training", fr: "Formation magasin" } };
  CURSOS.forEach(curso => {
    const test = testDe(curso.id), pasos = pasosDe(curso.id);
    if (!test || !test.length) return;
    C.plantillas.push({
      id: "form-" + curso.id, tipo: "formacion", anonima: false, curso: curso.id,
      nombre: { es: "Formación: " + curso.t, en: "Training: " + curso.t, fr: "Formation : " + curso.t },
      intro: { es: `Primero lee las ${pasos.length} pantallas del curso y después contesta las ${test.length} preguntas. Puedes volver atrás cuando quieras.`,
               en: `First read the ${pasos.length} screens of the course, then answer the ${test.length} questions. You can go back at any time.`,
               fr: `Lisez d'abord les ${pasos.length} écrans du cours, puis répondez aux ${test.length} questions. Vous pouvez revenir en arrière.` },
      aviso: { es: `Se tarda unos ${curso.min} minutos. El código sirve una sola vez, así que termínalo de una sentada.`,
               en: `It takes about ${curso.min} minutes. The code works only once, so finish it in one go.`,
               fr: `Environ ${curso.min} minutes. Le code ne sert qu'une fois : terminez d'une traite.` },
      preguntas: test.map((q, k) => ({ id: "p" + (k + 1), t: q.t, por: q.por,
        o: q.o.map((op, j) => ({ t: op, v: j === q.r ? 1 : 0 })) }))
    });
  });
})();

if (typeof ACCIONES_INVITADO !== "undefined") Object.assign(ACCIONES_INVITADO, ACCIONES_INV_CURSO);

/* ===================== SEGUIMIENTO DE FORMACIONES =====================
   "Enviar a tienda" vive dentro de una campaña: enseña una formación y una
   tanda de códigos. Esto es lo contrario: todas las campañas a la vez, para
   responder a la pregunta que de verdad se hace en una reunión de RR.HH.,
   que es quién de la red ha hecho qué y quién no.
   ====================================================================== */
function campanasForm() { return (S.campanas || []).filter(c => c.tipo === "formacion"); }
/* Una formación de retail vale un año: lo que se hizo en una campaña de un
   año anterior cuenta como caducado y vuelve a aparecer como pendiente. */
function caducada(c) { return c.anio < SC.CONFIG.anio; }
function cursoDeCampana(c) { const pl = SC.plantilla(c.plantilla); return pl && pl.curso ? pl.curso : null; }
function filtroSeg() { return (S.fseg = S.fseg || { tienda: "", curso: "", estado: "" }); }

/* Un registro por persona y curso, con lo que haga falta para la tabla. */
function registrosForm() {
  const out = [];
  campanasForm().forEach(c => {
    const pl = SC.plantilla(c.plantilla); if (!pl) return;
    const curso = cursoDeCampana(c), nom = (cursoDe(curso) || {}).t || curso;
    (S.invitaciones || []).filter(i => i.campana_id === c.id).forEach(i => {
      const t = S.tiendas.find(x => x.id === i.tienda_id);
      if (!esAdmin() && !(t && t.rm_id === S.me.id)) return;
      const hecho = i.estado === "respondida", cad = hecho && caducada(c);
      const p = hecho ? SC.puntuar(pl, i.respuestas) : null;
      out.push({
        inv: i, campana: c, curso, cursoT: nom, tienda: t, plantilla: pl,
        persona: i.destinatario || "–", puesto: i.puesto || "", email: i.email || "",
        hecho, caducada: cad, anio: c.anio,
        apto: p ? p.pct >= 0.6 : null, nota: p, fecha: i.respondido || null, enviado: i.enviado || null,
        estado: cad ? "caducada" : hecho ? (p && p.pct >= 0.6 ? "apto" : "noapto") : i.enviado ? "enviado" : "sinenviar"
      });
    });
  });
  return out.sort((a, b) => (a.tienda ? a.tienda.nombre : "").localeCompare(b.tienda ? b.tienda.nombre : "") || a.persona.localeCompare(b.persona));
}
const ETIQ_SEG = { apto: "Superada", noapto: "No superada", caducada: "Caducada", enviado: "Enviado, sin hacer", sinenviar: "Sin enviar" };

function pintarSegForm() {
  const R = registrosForm(), f = filtroSeg();
  if (!R.length) {
    $("vista").innerHTML = `<div class="page"><h1>Seguimiento</h1>
      <div class="empty big"><p>Todavía no has enviado ninguna formación.</p>
      <p class="hint">Ve a <b>Enviar a tienda</b>, crea una campaña con el curso que quieras y genera los códigos. Aquí verás quién la ha hecho.</p></div></div>`;
    return;
  }
  const cursos = [...new Set(R.map(x => x.curso))];
  const tiendas = [...new Set(R.map(x => x.tienda && x.tienda.id).filter(Boolean))]
    .map(id => S.tiendas.find(t => t.id === id)).filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const vis = R.filter(x => (!f.tienda || (x.tienda && x.tienda.id === f.tienda))
    && (!f.curso || x.curso === f.curso) && (!f.estado || x.estado === f.estado));

  const hechos = R.filter(x => x.hecho && !x.caducada), aptos = R.filter(x => x.estado === "apto");
  const media = hechos.length ? hechos.reduce((s, x) => s + x.nota.pct, 0) / hechos.length : null;
  const pendientes = R.filter(x => !x.hecho);
  const caducadas = R.filter(x => x.caducada);

  let h = `<div class="page"><div class="page-h"><h1>Seguimiento</h1>
    <div class="page-h-b">${pendientes.filter(x => x.email).length ? `<button class="btn" data-action="recordarForm">Recordar a los ${pendientes.filter(x => x.email).length} pendientes</button>` : ""}
      <button class="btn" data-action="segCsv">Descargar CSV</button></div></div>

    <div class="kpis"><div><small>Formaciones hechas</small><b>${hechos.length} de ${R.length}</b><small>${SC.pct(hechos.length / R.length, 0)} de lo enviado</small></div>
      <div><small>Superadas</small><b>${aptos.length}</b><small>${hechos.length ? SC.pct(aptos.length / hechos.length, 0) + " de las hechas" : "–"}</small></div>
      <div><small>Nota media</small><b>${media == null ? "–" : SC.pct(media, 0)}</b><small>se aprueba con el 60 %</small></div>
      <div><small>${caducadas.length ? "Caducadas" : "Pendientes"}</small><b>${caducadas.length || pendientes.length}</b><small>${caducadas.length ? "hechas en " + (SC.CONFIG.anio - 1) + ": toca repetirlas" : pendientes.filter(x => !x.enviado).length + " sin enviar todavía"}</small></div></div>`;

  // Matriz tiendas x cursos: la foto que se mira en una reunión
  h += `<section class="card"><div class="card-h"><h2>Por tienda y curso</h2><span class="muted">hechas de enviadas</span></div>
    <div class="tablewrap"><table class="mini"><thead><tr><th>Tienda</th>${cursos.map(c => `<th class="n">${esc((cursoDe(c) || {}).t || c)}</th>`).join("")}<th class="n">Total</th></tr></thead><tbody>
    ${tiendas.map(t => {
      const suyos = R.filter(x => x.tienda && x.tienda.id === t.id);
      return `<tr><td>${esc(t.nombre)}</td>${cursos.map(c => {
        const xs = suyos.filter(x => x.curso === c);
        if (!xs.length) return `<td class="n muted">–</td>`;
        const n = xs.filter(x => x.hecho && !x.caducada).length;
        return `<td class="n"><span class="celda ${n === xs.length ? "ok" : n ? "medio" : "no"}">${n}/${xs.length}</span></td>`;
      }).join("")}<td class="n"><b>${suyos.filter(x => x.hecho && !x.caducada).length}/${suyos.length}</b></td></tr>`;
    }).join("")}</tbody></table></div></section>`;

  // Tabla de personas
  h += `<section class="card"><div class="card-h"><h2>Personas</h2><span class="muted">${vis.length} de ${R.length}</span></div>
    <div class="inline-form" style="border:0;margin:0 0 12px;padding:0">
      <label>Tienda<select data-seg="tienda"><option value="">Todas</option>${tiendas.map(t => `<option value="${t.id}" ${f.tienda === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></label>
      <label>Curso<select data-seg="curso"><option value="">Todos</option>${cursos.map(c => `<option value="${c}" ${f.curso === c ? "selected" : ""}>${esc((cursoDe(c) || {}).t || c)}</option>`).join("")}</select></label>
      <label>Estado<select data-seg="estado"><option value="">Todos</option>${Object.keys(ETIQ_SEG).map(k => `<option value="${k}" ${f.estado === k ? "selected" : ""}>${ETIQ_SEG[k]}</option>`).join("")}</select></label></div>
    ${vis.length ? `<div class="tablewrap"><table><thead><tr><th>Persona</th><th>Tienda</th><th>Formación</th><th>Estado</th><th class="n">Nota</th><th></th></tr></thead><tbody>
      ${vis.map(x => `<tr><td><b>${esc(x.persona)}</b>${x.puesto ? `<br><small>${esc(x.puesto)}</small>` : ""}${x.email ? `<br><small class="mail">${esc(x.email)}</small>` : ""}</td>
        <td>${esc(x.tienda ? x.tienda.nombre : "–")}</td>
        <td>${esc(x.cursoT)}<br><small class="muted">${esc(x.campana.titulo)}</small></td>
        <td><span class="st ${x.estado === "apto" ? "cerrado" : x.estado === "noapto" || x.estado === "caducada" ? "encurso" : "pendiente"}">${ETIQ_SEG[x.estado]}</span>
          ${x.caducada ? `<br><small class="muted">de ${x.anio}</small>` : ""}
          ${x.fecha ? `<br><small class="muted">${new Date(x.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</small>`
            : x.enviado ? `<br><small class="muted">enviado ${new Date(x.enviado).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</small>` : ""}</td>
        <td class="n">${x.nota ? `<b>${x.nota.obt} de ${x.nota.puntuables}</b>` : "–"}</td>
        <td class="n">${x.hecho ? `<button class="btn small ghost" data-action="verRespuestas" data-id="${x.inv.id}">Ver respuestas</button>`
          : x.email ? `<button class="btn small ghost" data-action="${typeof envioDirecto === "function" && envioDirecto() ? "enviarYa" : "enviarInv"}" data-id="${x.inv.id}">${x.enviado ? "Reenviar" : "Enviar"}</button>` : `<span class="muted">Sin correo</span>`}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">Nada con esos filtros.</p>`}</section></div>`;
  $("vista").innerHTML = h;
}

const ACCIONES_SEG = {
  segCsv() {
    const R = registrosForm();
    const filas = [["Tienda", "Persona", "Puesto", "Correo", "Formación", "Campaña", "Año", "Estado", "Aciertos", "Total", "Fecha"]]
      .concat(R.map(x => [x.tienda ? x.tienda.nombre : "", x.persona, x.puesto, x.email, x.cursoT, x.campana.titulo, x.anio,
        ETIQ_SEG[x.estado], x.nota ? x.nota.obt : "", x.nota ? x.nota.puntuables : "",
        x.fecha ? new Date(x.fecha).toLocaleDateString("es-ES") : ""]));
    const csv = "﻿" + filas.map(f => f.map(v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `formaciones-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    return false;
  },
  async recordarForm() {
    const pend = registrosForm().filter(x => !x.hecho && !x.caducada && x.email);
    if (!pend.length) { toast("No hay nadie pendiente con correo"); return false; }
    const directo = typeof envioDirecto === "function" && envioDirecto();
    const ok = await confirmar({ titulo: `Recordar a ${pend.length} ${pend.length === 1 ? "persona" : "personas"}`,
      ok: directo ? "Enviar ahora" : "Abrir el correo",
      texto: directo ? "Se les reenvía su código desde la dirección de la empresa. Son los que aún no han hecho su formación."
                     : "Se abrirá tu programa de correo con un mensaje por persona." });
    if (!ok) return false;
    if (!directo) {
      pend.forEach((x, k) => setTimeout(() => {
        const a = document.createElement("a");
        a.href = `mailto:${encodeURIComponent(x.email)}?subject=${encodeURIComponent(asuntoInvitacion(x.inv))}&body=${encodeURIComponent(mensajeInvitacion(x.inv))}`;
        document.body.appendChild(a); a.click(); a.remove();
      }, k * 700));
      return false;
    }
    toast("Enviando…");
    let bien = 0; const fallos = [];
    for (let i = 0; i < pend.length; i += 25) {
      try {
        const r = await enviarPorLaPlataforma(pend.slice(i, i + 25).map(x => x.inv.id));
        bien += r.enviados || 0;
        (r.resultados || []).filter(z => !z.ok).forEach(z => fallos.push(z.motivo));
      } catch (e) { fallos.push(e.message); break; }
    }
    log(`${bien} recordatorios de formación enviados`);
    await recargarPruebas(); pintar();
    if (fallos.length) alert(`Enviados ${bien} de ${pend.length}.\n\nNo han salido:\n` + fallos.slice(0, 12).join("\n"));
    else toast(bien === 1 ? "1 recordatorio enviado" : bien + " recordatorios enviados");
    return false;
  }
};
if (typeof ACCIONES_FORMACION !== "undefined") Object.assign(ACCIONES_FORMACION, ACCIONES_SEG);
