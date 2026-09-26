"use strict";
/* ===================== ARCADE: UN TURNO EN LA TIENDA =====================
   Mismo contenido del circuito de venta, con presión de tiempo.
   ======================================================================== */
const ARC_COLORES = ["#C8102E","#2F6FDE","#0F7B6C","#C4640A","#6B3FA0","#1B7A2F","#B4478C"];
const ARC_SITUACIONES = [
  { id:"mirando", zona:"SALA", que:"Mira aspiradores", dice:"Solo estoy mirando, gracias.", paso:"Acogida",
    ops:[
      {t:"\"Perfecto, mire con calma. Si necesita algo estoy por aquí.\" Y te quedas cerca, atento.", v:2, eco:"Le diste espacio sin desaparecer. A los 40 segundos te llama ella."},
      {t:"\"Este modelo lleva 2.800 W y filtro HEPA, es el más vendido.\"", v:0, eco:"Le soltaste la ficha técnica sin saber qué necesita. Se va."},
      {t:"Asientes y te vas a ordenar el lineal.", v:1, eco:"Le diste espacio, sí, pero también la perdiste de vista. Sale sin preguntar."}],
    sigue:"deteccion" },
  { id:"deteccion", zona:"SALA", que:"Se deja ayudar", dice:"Pues sí, mire, tengo un perro que suelta muchísimo pelo.", paso:"Detección",
    ops:[
      {t:"\"¿Qué tipo de suelo tiene y cuántos metros? Así le digo cuál le encaja.\"", v:2, eco:"Preguntas de uso real. Ya sabes qué proponerle."},
      {t:"\"Entonces le va a ir genial este, el de mayor succión.\"", v:1, eco:"Has acertado de casualidad. Sin preguntar, es una apuesta."},
      {t:"\"Todos los nuestros valen para pelo de mascota.\"", v:0, eco:"Respuesta de catálogo. La clienta duda y se lo va a pensar."}],
    sigue:"argumenta" },
  { id:"argumenta", zona:"SALA", que:"Escucha la propuesta", dice:"Vale, ¿y este en qué se diferencia del de al lado, que es 80 € más barato?", paso:"Argumentación",
    ops:[
      {t:"\"Este tiene cepillo antienredo: con un perro que suelta pelo, se va a ahorrar limpiar el rodillo cada semana.\"", v:2, eco:"Traduces la característica a su vida. Asiente."},
      {t:"\"Tiene más potencia y mejor filtro.\"", v:1, eco:"Cierto, pero no le dice nada a ella."},
      {t:"\"La verdad es que por precio le compensa el otro.\"", v:0, eco:"Te has vendido a ti mismo a la baja."}],
    sigue:"cierra" },
  { id:"cierra", zona:"SALA", que:"A punto de decidir", dice:"Me gusta… pero me lo tengo que pensar.", paso:"Cierre",
    ops:[
      {t:"\"¿Se lo lleva hoy o prefiere que se lo reserve hasta el sábado?\"", v:2, eco:"Cierre con alternativa. Se lo lleva."},
      {t:"\"Claro, piénselo con calma.\"", v:0, eco:"Sin siguiente paso. Se va y no vuelve."},
      {t:"\"Le recuerdo que la promoción acaba hoy.\"", v:1, eco:"Funciona a veces, pero suena a presión."}] },
  { id:"precio", zona:"SALA", que:"Compara con internet", dice:"Esto en internet lo tengo más barato. ¿Me lo igualáis?", paso:"Objeciones",
    ops:[
      {t:"\"Entiendo que mire el precio. Aquí tiene servicio técnico en toda España y garantía en la propia tienda: si falla, lo trae aquí.\"", v:2, eco:"Empatía y valor. Se queda."},
      {t:"\"Es que esa web vende productos de peor calidad.\"", v:0, eco:"Hablar mal de otros te deja a ti mal. Se marcha."},
      {t:"\"Puedo hacerle un pequeño descuento.\"", v:1, eco:"Cierras, pero regalando margen que no hacía falta."}] },
  { id:"cola", zona:"CAJA", que:"Protesta por una promo", dice:"¡En el cartel pone 20 %! ¿Por qué no me lo aplicas?", paso:"Reclamación",
    ops:[
      {t:"\"Tiene razón en que el cartel confunde, déjeme diez segundos que lo miro.\" Y sigues cobrando mientras.", v:2, eco:"Atiendes a los dos lados. La cola no se rompe."},
      {t:"\"Señor, hay cola. Espere su turno, por favor.\"", v:0, eco:"Sube el tono y lo oye toda la tienda."},
      {t:"Dejas la caja y te vas con él al cartel.", v:1, eco:"Le resuelves, pero la cola se queja."}] },
  { id:"devolucion", zona:"CAJA", que:"Devolución sin ticket", dice:"Se ha estropeado el antiadherente y no tengo el ticket. ¿Qué hacemos?", paso:"Reclamación",
    ops:[
      {t:"\"Vamos a ver qué puedo hacer. ¿Recuerda si pagó con tarjeta? A veces lo localizamos.\"", v:2, eco:"Buscas la salida antes que la norma. Se calma."},
      {t:"\"Sin ticket no hay devolución, lo siento.\"", v:0, eco:"Cierras la puerta en la primera frase."},
      {t:"\"Llame al servicio de atención al cliente.\"", v:1, eco:"Te la quitas de encima, y ella lo nota."}] },
  { id:"cruzada", zona:"CAJA", que:"Se lleva una sartén", dice:"Me llevo esta. ¿Puedo pagar con tarjeta?", paso:"Venta cruzada",
    ops:[
      {t:"\"Claro. Y para que no le raye el antiadherente, estas espátulas de silicona aguantan 140 grados.\"", v:2, eco:"Recomendación con motivo. Se lleva las dos."},
      {t:"\"¿Algo más?\"", v:0, eco:"La pregunta que nunca vende nada."},
      {t:"\"Mire, tenemos promoción en cafeteras.\"", v:1, eco:"No tiene que ver con lo que se lleva, pero al menos informas."}] },
  { id:"tarjeta", zona:"CAJA", que:"Compra de 78 €", dice:"No, datos no. Ya tengo bastante publicidad.", paso:"Fidelización",
    ops:[
      {t:"\"Solo para guardarle el ticket y que acumule: con 6 puntos son 25 € de descuento. Nada de publicidad diaria.\"", v:2, eco:"Explicas el beneficio y despejas el recelo. Acepta."},
      {t:"\"Necesito nombre, DNI y correo.\"", v:0, eco:"Pides datos sin dar razón. No."},
      {t:"\"Como quiera, sin problema.\"", v:1, eco:"Respetas su no… sin haberlo intentado."}] },
  { id:"prisa", zona:"SALA", que:"Tiene prisa", dice:"Necesito una plancha, la que sea, pero rápido que tengo el coche en doble fila.", paso:"Detección",
    ops:[
      {t:"\"Dos preguntas rápidas: ¿plancha mucho y hay cal en su zona?\" Y le llevas directo a dos opciones.", v:2, eco:"Rápido no es sin preguntar. Se lleva la buena."},
      {t:"Le das la primera que ves.", v:1, eco:"Vende, pero es la barata. Ticket bajo."},
      {t:"Le explicas la gama entera.", v:0, eco:"Se va sin nada mirando el reloj."}] },
  { id:"acompanante", zona:"SALA", que:"Viene con su pareja", dice:"Yo lo veo caro, ¿eh? (mirando a su pareja)", paso:"Objeciones",
    ops:[
      {t:"Te diriges a los dos y preguntas qué uso le van a dar en casa.", v:2, eco:"Incluir al acompañante desbloquea la compra."},
      {t:"Sigues hablando solo con quien preguntó primero.", v:0, eco:"El acompañante se convierte en el freno."},
      {t:"\"Es que la calidad se paga.\"", v:1, eco:"Defiendes el precio, pero no das razones."}] },
  { id:"demo", zona:"SALA", que:"Duda con un robot", dice:"No sé, parece complicado de usar.", paso:"Argumentación",
    ops:[
      {t:"\"Deme diez segundos.\" Lo enciendes y le dejas probarlo a ella.", v:2, eco:"La demo vende sola. Se lo lleva."},
      {t:"\"Trae un manual muy sencillo.\"", v:1, eco:"No resuelve el miedo."},
      {t:"\"Es que hay que aprender un poco, sí.\"", v:0, eco:"Le das la razón a su duda. Se va."}] },
  { id:"garantia", zona:"CAJA", que:"Pagando", dice:"Oye, ¿y si me da problemas?", paso:"Despedida",
    ops:[
      {t:"\"Tiene 15 días de garantía técnica aquí mismo y 2 años a nivel mundial. Cualquier cosa, me pregunta por mí.\"", v:2, eco:"Se va tranquilo. Ese vuelve."},
      {t:"\"Tranquilo, nunca dan problemas.\"", v:1, eco:"Promesa que no puedes cumplir."},
      {t:"\"Guarde el ticket.\"", v:0, eco:"Frío. La despedida también vende."}] }
];
const ARC_CADENA = { mirando:1, deteccion:1, argumenta:1, cierra:0 };
const ARC_NIVELES = [
  { id:"rodaje", t:"Día de diario", seg:150, cada:[3.5,6], pac:[17,24], max:3 },
  { id:"sabado", t:"Sábado", seg:150, cada:[2.4,4.2], pac:[13,19], max:4 },
  { id:"campana", t:"Campaña de Navidad", seg:150, cada:[2.2,4], pac:[10,15], max:5 }
];
const ARC_TICKET = { alto:[70,140], medio:[30,60] };


const arcEur = n => new Intl.NumberFormat("es-ES",{maximumFractionDigits:0}).format(Math.round(n)) + " €";
const arcPct = n => Math.round(n*100) + " %";
const arcRnd = (a,b) => a + Math.random()*(b-a);
let ARC_UID = 0, ARC_RAF = null, ARC_ULT = 0;
function arc() { return S.arc = S.arc || { nivel: "sabado", G: null }; }
function arcSit(id) { return ARC_SITUACIONES.find(s => s.id === id); }
function arcVivo() { return S.modulo === "formacion" && S.curso === "circuito" && S.vista === "arcade" && document.getElementById("arcTienda"); }

/* ---------- Partida ---------- */
function arcNuevoCliente(forzar) {
  const A = arc(), N = ARC_NIVELES.find(n => n.id === A.nivel);
  const libres = ARC_SITUACIONES.filter(s => !["deteccion","argumenta","cierra"].includes(s.id));
  const s = arcSit(forzar) || libres[Math.floor(Math.random()*libres.length)];
  const orden = s.ops.map((_, i) => i);
  for (let i = orden.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
  return { uid: ++ARC_UID, sit: s.id, orden, pacMax: arcRnd(N.pac[0], N.pac[1]), pac: 0,
    color: ARC_COLORES[Math.floor(Math.random()*ARC_COLORES.length)], ini: "ABCDEFGHIJKLMNPRSTUV"[Math.floor(Math.random()*20)] };
}
function arcEmpezar() {
  const A = arc(), N = ARC_NIVELES.find(n => n.id === A.nivel);
  A.G = { N, t: N.seg, clientes: [], prox: 0.8, ventas: 0, atendidos: 0, compras: 0, tarjetas: 0,
          perdidos: 0, aciertos: 0, fallos: 0, pasos: {}, fin: false, decision: null, eco: null };
  ARC_ULT = performance.now();
  pintar();
  ARC_RAF = requestAnimationFrame(arcBucle);
}
function arcBucle(ts) {
  const A = arc(), G = A.G;
  if (!G || G.fin) return;
  if (!arcVivo()) { G.fin = true; return; }   // el jugador se ha ido a otra pantalla
  const dt = Math.min(0.1, (ts - ARC_ULT) / 1000); ARC_ULT = ts;
  G.t -= dt; G.prox -= dt;
  if (G.prox <= 0 && G.clientes.length < G.N.max && G.t > 12) { G.clientes.push(arcNuevoCliente()); G.prox = arcRnd(G.N.cada[0], G.N.cada[1]); }
  let fuera = false;
  G.clientes.forEach(c => { c.pac += dt; if (c.pac >= c.pacMax && !(G.decision && G.decision.uid === c.uid)) { c.fuera = true; fuera = true; } });
  if (fuera) {
    G.clientes.filter(c => c.fuera).forEach(() => { G.perdidos++; G.atendidos++; arcFlotante("se va", "mal"); });
    G.clientes = G.clientes.filter(c => !c.fuera);
  }
  arcRefrescar();
  if (G.t <= 0) return arcTerminar();
  ARC_RAF = requestAnimationFrame(arcBucle);
}
function arcFlotante(txt, clase) {
  const t = document.getElementById("arcTienda"); if (!t) return;
  const el = document.createElement("div");
  el.className = "flot " + clase; el.textContent = txt;
  el.style.left = (18 + Math.random()*60) + "%"; el.style.bottom = "45%";
  t.appendChild(el); setTimeout(() => el.remove(), 1100);
}
function arcResponder(pos) {
  const G = arc().G, c = G && G.decision; if (!c) return;
  const s = arcSit(c.sit), i = c.orden[pos], op = s.ops[i];
  G.pasos[s.paso] = G.pasos[s.paso] || { bien: 0, mal: 0 };
  if (op.v === 2) { G.aciertos++; G.pasos[s.paso].bien++; } else { G.fallos++; if (op.v === 0) G.pasos[s.paso].mal++; }
  let venta = 0, tarjeta = false, sigue = null;
  if (op.v === 2) {
    if (s.sigue) sigue = s.sigue;
    else { venta = arcRnd(ARC_TICKET.alto[0], ARC_TICKET.alto[1]); if (s.id === "tarjeta") { tarjeta = true; venta = arcRnd(20,45); } }
  } else if (op.v === 1) {
    if (s.sigue) sigue = s.sigue; else venta = arcRnd(ARC_TICKET.medio[0], ARC_TICKET.medio[1]);
  }
  if (s.id === "cruzada" && op.v === 2) venta += arcRnd(12, 22);
  if (venta > 0) { G.ventas += venta; G.compras++; }
  if (tarjeta) G.tarjetas++;
  G.eco = { texto: op.eco, bien: op.v === 2, elegida: pos, venta, tarjeta };
  arcPintarDecision();
  setTimeout(() => {
    if (!arcVivo() || G.fin) return;
    G.clientes = G.clientes.filter(x => x.uid !== c.uid);
    if (sigue && op.v >= 1) {
      const n = arcNuevoCliente(sigue);
      n.color = c.color; n.ini = c.ini; n.pacMax = Math.max(9, c.pacMax * 0.85);
      G.clientes.unshift(n); G.decision = n; G.eco = null;
    } else {
      G.atendidos++; arcFlotante(venta > 0 ? "+" + arcEur(venta) : "sin venta", venta > 0 ? "bien" : "mal");
      G.decision = null; G.eco = null;
    }
    arcPintarDecision(); arcRefrescar();
  }, op.v === 2 ? 1100 : 1500);
}
function arcTerminar() {
  const A = arc(), G = A.G;
  G.fin = true; cancelAnimationFrame(ARC_RAF);
  const conv = G.atendidos ? G.compras / G.atendidos : 0;
  const tm = G.compras ? G.ventas / G.compras : 0;
  const acierto = (G.aciertos + G.fallos) ? G.aciertos / (G.aciertos + G.fallos) : 0;
  G.res = { conv, tm, acierto, nota: Math.max(0, Math.min(10, acierto*6 + conv*3 + Math.min(1, G.tarjetas/3))) };
  const p = progreso(); p.circuito = p.circuito || { vistos: [] };
  const a = p.circuito.arcade = p.circuito.arcade || { partidas: 0, records: {} };
  a.partidas++;
  if (!(a.records[A.nivel] > G.ventas)) { a.records[A.nivel] = Math.round(G.ventas); G.res.record = true; }
  a.ultima = { nivel: A.nivel, nota: G.res.nota, ventas: Math.round(G.ventas), fecha: new Date().toISOString() };
  guardarProgreso(p);
  log(`Arcade jugado (${G.N.t}): ${arcEur(G.ventas)}, nota ${SC.fmt(G.res.nota, 1)}`);
  pintar(); window.scrollTo(0, 0);
}

/* ---------- Vistas ---------- */
function vistaArcade() {
  const A = arc(), G = A.G;
  if (G && G.fin && G.res) return arcFinal();
  if (G && !G.fin) return arcJuego();
  return arcPortada();
}
function arcPortada() {
  const A = arc(), a = (progreso().circuito || {}).arcade || { records: {}, partidas: 0 };
  return `<section class="card arc"><div class="portada">
    <h2 style="font-size:24px">Un turno en la tienda</h2>
    <p class="sub">Dos minutos y medio de tienda comprimida. Entran clientes con su paciencia y tú decides a quién atiendes y qué le dices. Las decisiones son las del circuito de venta.</p>
    <div class="niveles">${ARC_NIVELES.map(n => `<button class="chip-arc ${A.nivel === n.id ? "on" : ""}" data-action="arcNivel" data-n="${n.id}">${esc(n.t)}${a.records[n.id] ? ` · récord ${arcEur(a.records[n.id])}` : ""}</button>`).join("")}</div>
    <button class="btn primary grande" data-action="arcJugar">Empezar el turno</button>
    <div class="reglas">
      <div><b>Paciencia</b>La barra de cada cliente baja sola. Si llega al final, se va y cuenta como perdido.</div>
      <div><b>Encadenado</b>Si aciertas con quien está mirando, sigue la conversación: detección, argumentación y cierre.</div>
      <div><b>Marcadores</b>Ventas, conversión, ticket medio y tarjetas, los mismos KPIs de la tienda.</div>
      <div><b>Al final</b>Nota, medallas y qué parada del circuito repasar según dónde fallaste.</div>
    </div>
    ${a.partidas ? `<p class="hint">${a.partidas} ${a.partidas === 1 ? "partida jugada" : "partidas jugadas"}${a.ultima ? ` · última nota ${SC.fmt(a.ultima.nota, 1)}` : ""}</p>` : ""}
  </div></section>`;
}
function arcJuego() {
  return `<section class="card arc">
    <div class="hud">
      <div class="reloj"><small>Turno</small><b id="arcT">0:00</b><i id="arcTb"></i></div>
      <div><small>Ventas</small><b id="arcV">0 €</b></div>
      <div><small>Conversión</small><b id="arcC">–</b></div>
      <div><small>Ticket medio</small><b id="arcTM">–</b></div>
      <div><small>Tarjetas</small><b id="arcTa">0</b></div>
    </div>
    <div class="tienda" id="arcTienda">
      <span class="rotulo">HOME&amp;COOK</span>
      <div class="mueble lineal"></div><div class="mueble lineal2"></div>
      <div class="mueble mesa"></div><div class="mueble caja"></div>
      <div class="clientes" id="arcClientes"></div>
    </div>
    <div class="dec" id="arcDec"></div>
    <p class="hint" style="margin-top:10px">Pulsa un cliente para atenderle. Mientras decides, los demás siguen esperando.</p>
  </section>`;
}
function arcRefrescar() {
  const G = arc().G, T = document.getElementById("arcT"); if (!G || !T) return;
  const m = Math.max(0, G.t);
  T.textContent = Math.floor(m/60) + ":" + String(Math.floor(m%60)).padStart(2,"0");
  document.getElementById("arcTb").style.width = (m / G.N.seg * 100) + "%";
  document.getElementById("arcV").textContent = arcEur(G.ventas);
  document.getElementById("arcC").textContent = G.atendidos ? arcPct(G.compras / G.atendidos) : "–";
  document.getElementById("arcTM").textContent = G.compras ? arcEur(G.ventas / G.compras) : "–";
  document.getElementById("arcTa").textContent = G.tarjetas;
  const cont = document.getElementById("arcClientes"); if (!cont) return;
  const clave = G.clientes.map(c => c.uid).join(",") + "|" + (G.decision ? G.decision.uid : "");
  if (cont.dataset.k !== clave) {
    cont.dataset.k = clave;
    const ficha = c => {
      const s = arcSit(c.sit);
      return `<button class="cli ${G.decision && G.decision.uid === c.uid ? "sel" : ""}" data-action="arcCli" data-uid="${c.uid}">
        <span class="zona">${esc(s.zona)}</span><span class="cara" style="background:${c.color}">${esc(c.ini)}</span>
        <span class="que">${esc(s.que)}</span><span class="pac"><i></i></span></button>`;
    };
    const sala = G.clientes.filter(c => arcSit(c.sit).zona !== "CAJA"), caja = G.clientes.filter(c => arcSit(c.sit).zona === "CAJA");
    cont.innerHTML = G.clientes.length
      ? `<div class="zona-g">${sala.map(ficha).join("")}</div><div class="zona-g caja">${caja.map(ficha).join("")}</div>`
      : `<div class="vacio">Tienda vacía… disfrútalo, dura poco.</div>`;
  }
  if (!G.decision) {
    const e = document.querySelector("#arcDec .espera");
    if (e) e.textContent = G.clientes.length ? "Elige a quién atiendes." : "Nadie en tienda ahora mismo. Aprovecha para ordenar el lineal…";
    else arcPintarDecision();
  }
  G.clientes.forEach(c => {
    const el = cont.querySelector(`[data-uid="${c.uid}"]`); if (!el) return;
    const r = Math.max(0, 1 - c.pac / c.pacMax);
    el.querySelector(".pac i").style.width = (r*100) + "%";
    el.classList.toggle("impaciente", r < .5);
    el.classList.toggle("critico", r < .22);
  });
}
function arcPintarDecision() {
  const G = arc().G, d = document.getElementById("arcDec"); if (!G || !d) return;
  const c = G.decision;
  if (!c) { d.innerHTML = `<div class="espera">${G.clientes.length ? "Elige a quién atiendes." : "Nadie en tienda ahora mismo."}</div>`; return; }
  const s = arcSit(c.sit), e = G.eco;
  d.innerHTML = `<div class="quien"><span class="cara" style="background:${c.color}">${esc(c.ini)}</span>
      <div><span class="paso-et">${esc(s.paso)}</span><br><b>${esc(s.que)}</b> <span class="hint">· ${esc(s.zona.toLowerCase())}</span></div></div>
    <div class="dice">${esc(s.dice)}</div>
    <div class="ops">${c.orden.map((real, pos) => `<button class="op ${e && e.elegida === pos ? (e.bien ? "buena" : "mala") : ""}" data-action="arcOp" data-p="${pos}" ${e ? "disabled" : ""}>${esc(s.ops[real].t)}</button>`).join("")}</div>
    ${e ? `<div class="eco"><b>${e.bien ? "Bien jugado." : "Ahí se pierde."}</b> ${esc(e.texto)}${e.venta ? ` <b>+${arcEur(e.venta)}</b>` : ""}${e.tarjeta ? " <b>+1 tarjeta</b>" : ""}</div>` : ""}`;
}
function arcFinal() {
  const G = arc().G, r = G.res;
  const flojos = Object.entries(G.pasos).filter(([,v]) => v.mal > 0).sort((a,b) => b[1].mal - a[1].mal).slice(0,3);
  const medallas = [];
  if (r.conv >= .6) medallas.push("Conversión de crack");
  if (G.tarjetas >= 3) medallas.push("Cazador de tarjetas");
  if (G.perdidos === 0 && G.atendidos > 4) medallas.push("Nadie se fue solo");
  if (r.tm >= 90) medallas.push("Ticket alto");
  if (r.acierto === 1 && G.atendidos > 5) medallas.push("Turno impecable");
  return `<section class="card arc" style="text-align:center">
      <p class="hint">Fin del turno · ${esc(G.N.t)}</p>
      <div class="nota-arc num">${SC.fmt(r.nota, 1)}</div><p class="hint">sobre 10</p>
      ${medallas.map(m => `<span class="medalla">${esc(m)}</span>`).join("")}
      ${r.record ? `<p style="color:var(--red);font-weight:700;margin-top:8px">¡Récord de ventas en este nivel!</p>` : ""}
    </section>
    <div class="res-arc">
      <div><small>Ventas del turno</small><b>${arcEur(G.ventas)}</b></div>
      <div><small>Clientes atendidos</small><b>${G.atendidos}</b></div>
      <div><small>Conversión</small><b>${arcPct(r.conv)}</b></div>
      <div><small>Ticket medio</small><b>${G.compras ? arcEur(r.tm) : "–"}</b></div>
      <div><small>Tarjetas</small><b>${G.tarjetas}</b></div>
      <div><small>Se fueron sin atender</small><b>${G.perdidos}</b></div>
    </div>
    <section class="card"><h2>Qué repasar</h2>
      ${flojos.length ? `<ul class="lista">${flojos.map(([p,v]) => `<li><b>${esc(p)}</b>: ${v.mal} ${v.mal === 1 ? "decisión que costó" : "decisiones que costaron"} la venta. Vuelve a esa parada del circuito.</li>`).join("")}</ul>`
        : `<p>No fallaste en ninguna parada del circuito. ${G.perdidos ? "Lo que se te escapó fue por tiempo: prioriza mejor a quién atiendes." : "Turno redondo."}</p>`}
      ${G.perdidos ? `<p class="hint" style="margin-top:10px">${G.perdidos} ${G.perdidos === 1 ? "cliente se fue" : "clientes se fueron"} sin que llegaras.</p>` : ""}
      <div class="paso-nav"><button class="btn" data-action="arcMenu">Cambiar de nivel</button>
        <span></span><button class="btn primary" data-action="arcJugar">Otro turno</button></div></section>`;
}

const ACCIONES_ARC = {
  arcNivel(b) { arc().nivel = b.dataset.n; },
  arcJugar() { arcEmpezar(); return false; },
  arcMenu() { arc().G = null; },
  arcCli(b) {
    const G = arc().G; if (!G) return false;
    const c = G.clientes.find(x => x.uid === +b.dataset.uid); if (!c) return false;
    G.decision = c; G.eco = null; arcPintarDecision(); arcRefrescar(); return false;
  },
  arcOp(b) { arcResponder(+b.dataset.p); return false; }
};
