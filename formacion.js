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
  { id: "kpis", t: "KPIs Retail", estado: "pendiente", min: 20,
    d: "Conversión, ticket medio, unidades por ticket y margen: qué mide cada uno y qué hacer cuando bajan.", quien: "SM y ASM" },
  { id: "visual", t: "Visual Merchandising", estado: "pendiente", min: 20,
    d: "Escaparate, mesa de promociones y recorrido de tienda según el plan comercial.", quien: "Todo el equipo" },
  { id: "pyl", t: "P&L", estado: "pendiente", min: 25,
    d: "La cuenta de resultados de una tienda: qué líneas dependen de ti y cuáles no.", quien: "SM" },
  { id: "equipos", t: "Gestión de equipos", estado: "pendiente", min: 25,
    d: "Horarios, feedback, motivación y conversaciones difíciles.", quien: "SM y ASM" }
];

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
function vistos() { return (progreso().circuito || {}).vistos || []; }
function marcarVisto(id) {
  const p = progreso(); p.circuito = p.circuito || { vistos: [] };
  if (!p.circuito.vistos.includes(id)) p.circuito.vistos.push(id);
  p.circuito.ultimo = id;
  if (p.circuito.vistos.length === CIRCUITO.length && !p.circuito.completado) {
    p.circuito.completado = new Date().toISOString();
    log("Formación completada: Circuito de Venta");
  }
  guardarProgreso(p);
}

/* ---------------- Catálogo ---------------- */
function pintarFormaciones() {
  if (S.curso === "circuito") return pintarCircuito();
  const v = vistos().length, p = progreso().circuito || {};
  const npr = (p.practicas || []).length, narc = (p.arcade || {}).partidas || 0;
  const pie = c => c.estado === "pendiente" ? "En preparación"
    : p.completado ? "Completada el " + fechaES(p.completado) + (npr ? ` · ${npr} ${npr === 1 ? "práctica" : "prácticas"}` : "") + (narc ? ` · ${narc} ${narc === 1 ? "partida" : "partidas"}` : "")
    : (v ? `${v} de ${CIRCUITO.length} pasos vistos` : "Sin empezar")
      + (npr ? ` · ${npr} ${npr === 1 ? "práctica" : "prácticas"}` : "") + (narc ? ` · ${narc} ${narc === 1 ? "partida" : "partidas"}` : "");
  $("vista").innerHTML = `<div class="page">
    <h1>Formaciones</h1>
    <p class="lead">Formación breve, pensada para hacerla en el móvil antes de abrir o entre horas. Cada una deja registro de quién la ha completado.</p>
    <div class="cards">${CURSOS.map(c => `<button class="mod ${c.estado === "pendiente" ? "pendiente" : ""}" data-action="abrirCurso" data-c="${c.id}" ${c.estado === "pendiente" ? "disabled" : ""}>
      <span class="mod-t">${esc(c.t)}${c.estado === "pendiente" ? `<span class="badge">${t("pendiente")}</span>` : ""}</span>
      <span class="mod-d">${esc(c.d)}</span>
      <span class="curso-meta">${esc(c.quien)} · ${c.min} min</span>
      <span class="mod-f">${esc(pie(c))}</span></button>`).join("")}</div></div>`;
}

/* ---------------- Circuito de Venta ---------------- */
function pintarCircuito() {
  if (S.chuleta) return pintarChuleta();
  if (S.vista === "practicar") return pintarPractica();
  if (S.vista === "arcade") return pintarArcade();
  const vis = vistos();
  const i = Math.max(0, CIRCUITO.findIndex(p => p.id === S.paso));
  const p = CIRCUITO[i], ult = i === CIRCUITO.length - 1;
  const prog = progreso().circuito || {};
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverCursos">← Formaciones</button>
      <h1>Circuito de Venta</h1></div>
      <div class="curso-acc"><button class="btn small" data-action="arcade">Jugar el turno</button>
        <button class="btn small" data-action="practicar">Practicar con IA</button>
        <button class="btn small" data-action="chuleta">Ver la chuleta</button>
        <button class="btn small ghost" data-action="imprimirCurso">Imprimir</button></div></div>

    <div class="ruta">
      <div class="ruta-linea"><i style="width:${Math.round(vis.length / CIRCUITO.length * 100)}%"></i></div>
      ${CIRCUITO.map((x, k) => `<button class="parada ${x.id === p.id ? "on" : ""} ${vis.includes(x.id) ? "hecha" : ""}" data-action="irPaso" data-p="${x.id}">
        <span class="bolita">${vis.includes(x.id) ? "✓" : k + 1}</span><span class="parada-t">${esc(x.t)}</span></button>`).join("")}
    </div>

    <section class="card paso">
      <div class="paso-h"><span class="paso-n">${i + 1}</span><div><h2>${esc(p.t)}</h2><p class="muted">${esc(p.sub)} · ${p.min} min</p></div>
        <span class="paso-est ${vis.includes(p.id) ? "ok" : ""}">${vis.includes(p.id) ? "Visto" : "Pendiente"}</span></div>
      <p class="idea">${esc(p.idea)}</p>

      <div class="bloques">
        <div class="bloque"><h3>Qué haces</h3><ul class="lista">${p.haces.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="bloque"><h3>Cuidado con</h3><ul class="lista ojo">${p.ojo.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>

      <h3 class="tit-frases">Qué dices</h3>
      <div class="frases">${p.dices.map((f, k) => `<blockquote class="frase"><span class="ctx">${esc(f.c)}</span>
        <p>${esc(f.f)}</p><button class="btn small ghost" data-action="copiarFrase" data-i="${i}" data-k="${k}">Copiar</button></blockquote>`).join("")}</div>

      ${p.extra === "necesidades" ? extraNecesidades() : ""}
      ${p.extra === "argumentos" ? extraArgumentos() : ""}

      ${ult ? `<div class="cta-rp"><div><b>Ya has visto el circuito entero.</b>
        <p class="hint">Ahora pruébalo: habla con un cliente simulado y recibe una valoración con esta misma rúbrica.</p></div>
        <span><button class="btn" data-action="arcade">Jugar el turno</button>
        <button class="btn primary" data-action="practicar">Practicar con IA</button></span></div>` : ""}
      <div class="paso-nav">
        <button class="btn" data-action="pasoAnt" ${i === 0 ? "disabled" : ""}>Anterior</button>
        <span class="muted num">${vis.length} de ${CIRCUITO.length} pasos</span>
        <button class="btn primary" data-action="pasoSig">${ult ? "Marcar y terminar" : "Lo tengo, siguiente"}</button>
      </div>
    </section>

    ${prog.completado ? `<section class="card fin"><h2>Formación completada</h2>
      <p class="hint">Terminada el ${fechaES(prog.completado)}. Puedes volver cuando quieras: la chuleta está pensada para repasar en dos minutos antes de abrir.</p>
      <div class="actions"><button class="btn" data-action="chuleta">Ver la chuleta</button><button class="btn ghost" data-action="reiniciarCurso">Empezar de nuevo</button></div></section>` : ""}
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

function pintarPractica() {
  const p = progreso().circuito || {}, pr = p.practicas || [];
  const media = pr.length ? pr.reduce((s, x) => s + x.nota, 0) / pr.length : null;
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverRecorrido">← Recorrido</button>
      <h1>Practicar el Circuito de Venta</h1></div>
      ${pr.length ? `<span class="muted num">${pr.length} ${pr.length === 1 ? "práctica" : "prácticas"} · media ${SC.fmt(media, 1)}/10</span>` : ""}</div>
    ${vistaRolePlay()}</div>`;
  const t = $("rpTxt");
  if (t) {
    t.oninput = () => { t.style.height = "auto"; t.style.height = Math.min(140, t.scrollHeight) + "px"; };
    t.onkeydown = ev => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); ACCIONES_RP.rpEnviar(); } };
    t.focus();
  }
  rpPintarHilo();
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
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="chuletaNo">← Volver al recorrido</button>
      <h1>Circuito de Venta en una pantalla</h1></div>
      <button class="btn small" data-action="imprimirCurso">Imprimir</button></div>
    <div class="chuleta">${CIRCUITO.map((p, k) => `<section class="card"><div class="paso-h"><span class="paso-n">${k + 1}</span><div><h2>${esc(p.t)}</h2><p class="muted">${esc(p.sub)}</p></div></div>
      <ul class="lista">${p.haces.slice(0, 3).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <blockquote class="frase mini"><p>${esc(p.dices[0].f)}</p></blockquote></section>`).join("")}</div></div>`;
}

function informeCurso() {
  return `<div class="pr-head">${logo(56)}<div><h1>Circuito de Venta</h1>
    <p class="meta">RRHH x Home&Cook, Groupe SEB${S.me ? " · " + esc(S.me.nombre) : ""}</p></div></div>
    ${CIRCUITO.map((p, k) => `<h2>${k + 1}. ${esc(p.t)} — ${esc(p.sub)}</h2>
      <p><b>${esc(p.idea)}</b></p>
      <p><b>Qué haces:</b></p><ul>${p.haces.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <p><b>Qué dices:</b></p><ul>${p.dices.map(f => `<li><i>${esc(f.c)}:</i> ${esc(f.f)}</li>`).join("")}</ul>
      <p><b>Cuidado con:</b></p><ul>${p.ojo.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`).join("")}`;
}

const ACCIONES_FORMACION = {
  abrirCurso(b) { S.curso = b.dataset.c; S.paso = (progreso().circuito || {}).ultimo || CIRCUITO[0].id; S.chuleta = false; S.vista = "recorrido"; },
  volverCursos() { S.curso = null; S.chuleta = false; S.vista = "recorrido"; },
  irPaso(b) { S.paso = b.dataset.p; window.scrollTo(0, 0); },
  pasoAnt() { const i = CIRCUITO.findIndex(x => x.id === S.paso); if (i > 0) S.paso = CIRCUITO[i - 1].id; window.scrollTo(0, 0); },
  pasoSig() {
    const i = CIRCUITO.findIndex(x => x.id === S.paso);
    marcarVisto(S.paso);
    if (i < CIRCUITO.length - 1) { S.paso = CIRCUITO[i + 1].id; window.scrollTo(0, 0); }
    else toast("Formación completada");
  },
  chuleta() { S.chuleta = true; S.vista = "recorrido"; window.scrollTo(0, 0); },
  practicar() { S.vista = "practicar"; S.chuleta = false; window.scrollTo(0, 0); },
  arcade() { S.vista = "arcade"; S.chuleta = false; window.scrollTo(0, 0); },
  volverRecorrido() { S.vista = "recorrido"; },
  chuletaNo() { S.chuleta = false; },
  reiniciarCurso() { if (!confirm("Se borra tu progreso de esta formación. ¿Seguro?")) return false; const p = progreso(); delete p.circuito; guardarProgreso(p); S.paso = CIRCUITO[0].id; },
  famSel(b) { S.fam = Number(b.dataset.k); },
  prodSel(b) { S.prod = b.dataset.t; },
  copiarFrase(b) {
    const f = CIRCUITO[Number(b.dataset.i)].dices[Number(b.dataset.k)].f;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(f).then(() => toast("Frase copiada"), () => toast(f));
    else toast(f);
    return false;
  },
  imprimirCurso() { $("print").innerHTML = informeCurso(); window.print(); return false; }
};
