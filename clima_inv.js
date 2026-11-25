"use strict";
/* ===================== CLIMA · pantalla de quien responde =====================
   Una pregunta cada vez: se toca la respuesta y pasa sola a la siguiente.
   En el ordenador, las teclas 1 a 5 (0 a 9 en la de recomendación).
   - Se guarda en el dispositivo (localStorage por código) para seguir otro rato.
   - Si se llega desde el botón de respuesta del correo (?codigo=…&r=b0:3),
     esa primera respuesta ya viene marcada.
   - La parte 2 enseña a quién se evalúa (invitaciones.responsable).
   - La abierta de las encuestas de colectivo pregunta por la dimensión peor
     valorada; se guarda cuál fue en <id>_dim, nunca nada que identifique.
   - Vista previa para RR.HH. (clPrevia): mismo recorrido, sin guardar nada.
   ============================================================================ */
const CI = { activo: false };

function clInvSeq() {
  const qs = clPreguntas(CI.pl, CI.cfg), seq = [];
  qs.forEach(q => {
    if (q.parte === 2 && !seq.some(x => x.k === "p2")) seq.push({ k: "p2" });
    seq.push(q.tipo === "texto" ? { k: "abierta", q } : { k: "q", q });
  });
  seq.push({ k: "fin" });
  return seq;
}
function clInvTramos(seq) {
  const tramo = s => (s.k === "abierta" ? "Abiertas" : s.q && s.q.parte === 2 ? "Responsable" : CI.pl.gptw && s.q ? (CL.DIMS.includes(s.q.dim) ? s.q.dim : "Compañerismo") : "Parte 1");
  const orden = [];
  seq.forEach(s => { if (s.k === "q" || s.k === "abierta") { const t = tramo(s); if (!orden.includes(t)) orden.push(t); } });
  return orden.map(t => {
    const js = seq.map((s, j) => ({ s, j })).filter(o => (o.s.k === "q" || o.s.k === "abierta") && tramo(o.s) === t);
    return { t, peso: js.length, lleno: js.filter(o => o.j < CI.i || (o.j === CI.i && false)).length / js.length };
  });
}
const clClave = () => "pp-cl-" + (CI.codigo || "previa");
function clGuardar() { if (CI.previa) return; try { localStorage.setItem(clClave(), JSON.stringify({ ans: CI.ans, textos: CI.textos, i: CI.i })); } catch (e) {} }
function clCargar() { if (CI.previa) return null; try { return JSON.parse(localStorage.getItem(clClave()) || "null"); } catch (e) { return null; } }

function clInvIniciar(pl, cfg, extra) {
  Object.assign(CI, { activo: true, pl, cfg: cfg || {}, i: -1, ans: {}, textos: {}, lock: false, fin: false, enviando: false, t0: 0, aviso: "" }, extra);
  const g = clCargar();
  if (g && g.ans) { CI.ans = g.ans; CI.textos = g.textos || {}; CI.guardado = Object.keys(g.ans).length ? g.i : null; }
  // Respuesta desde el correo: «r=b0:3»
  if (CI.pre && !Object.keys(CI.ans).length) {
    const [id, v] = String(CI.pre).split(":"), seq = clInvSeq(), k = seq.findIndex(s => s.q && s.q.id === id);
    if (k >= 0 && /^\d+$/.test(v) && +v >= 0 && +v <= 4 && seq[k].q.tipo === "likert") {
      CI.ans[id] = +v; CI.i = k + 1; CI.t0 = Date.now(); CI.aviso = "Tu primera respuesta ya está guardada. Sigue por la segunda.";
      clGuardar();
    }
  }
}

function pintarClimaInvitado() {
  const d = INV.datos;
  if (!CI.activo || CI.codigo !== INV.codigo) {
    clInvIniciar(SC.plantilla(d.plantilla), d.config || {}, { codigo: INV.codigo, previa: false, responsable: d.responsable, unidad: d.tienda || d.grupo || "", pre: INV.pre });
  }
  if (d.estado === "respondida" && !INV.enviado) CI.fin = true, CI.yaEstaba = true;
  clInvPintar();
}
function clPrevia(plId, cfg) {
  let ov = $("clPrev");
  if (!ov) { ov = document.createElement("div"); ov.id = "clPrev"; ov.className = "cli-prev"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Vista previa de la encuesta"); document.body.appendChild(ov); }
  ov.innerHTML = `<div class="cli-prev-b"><span>Vista previa: así la verá quien responda. No se guarda nada.</span><button class="btn small" data-action="cliCerrarPrevia">Cerrar</button></div><div id="clPrevIn"></div>`;
  clInvIniciar(SC.plantilla(plId), cfg || { parte2: true }, { codigo: "", previa: true, responsable: "Marta Ruiz (ejemplo)", unidad: "Tienda de ejemplo", pre: null });
  clInvPintar();
}

function clInvPintar() {
  const root = CI.previa ? $("clPrevIn") : $("app");
  if (!root) return;
  const seq = clInvSeq(), paso = CI.fin ? { k: "fin" } : CI.i >= 0 ? seq[CI.i] : null;
  const col = CI.pl.colectivo ? CL.COLECTIVOS[CI.pl.colectivo] : null;
  const contables = seq.filter(s => s.k === "q" || s.k === "abierta");
  const marca = `<span class="cli-marca">${simboloPippole(26)}<b>pippole</b></span>`;
  let h;
  if (!paso) {
    const n = contables.length, min = clMinutos(CI.pl, CI.cfg);
    const partes = [[CI.pl.gptw ? "Cómo es trabajar aquí" : "Tu día a día", CI.pl.gptw ? "60 afirmaciones en 5 apartados: credibilidad, respeto, imparcialidad, orgullo y compañerismo, y una valoración global." : `${contables.filter(s => s.q && s.q.parte === 1).length} preguntas sobre cómo se trabaja.`]];
    const anon = CI.cfg.anonima !== false;
    if (CI.cfg.parte2) partes.push(["Tu responsable directo", anon ? "10 afirmaciones, también anónimas." : "10 afirmaciones."]);
    partes.push([CI.pl.gptw ? "Dos preguntas abiertas" : "Una pregunta abierta", "Opcionales: escribe solo si quieres."]);
    h = `<div class="cli-in">${marca}
      <div class="cli-tit"><span class="cli-eti">Encuesta de clima${CI.unidad ? " · " + esc(CI.unidad) : col ? " · " + esc(col.n) : ""}</span>
        <h1>¿Cómo se trabaja aquí?</h1>
        <p>Toca la respuesta que más se acerque a lo que vives. Pasa sola a la siguiente y puedes volver atrás para cambiarla.</p></div>
      <div class="cli-datos"><div><b>${min}</b><small>minutos</small></div><div><b>${n}</b><small>preguntas</small></div><div><b>${anon ? "100 %" : "Con"}</b><small>${anon ? "anónima" : "tu nombre"}</small></div></div>
      <ol class="cli-partes">${partes.map(p => `<li><b>${esc(p[0])}</b><span>${esc(p[1])}</span></li>`).join("")}</ol>
      <div class="cli-sp"></div>
      <button class="cli-btn" data-action="cliEmpezar">${CI.guardado != null ? "Seguir donde lo dejé" : "Empezar"}</button>
      <p class="cli-nota">${anon ? "Tu código no lleva tu nombre." : "Esta encuesta no es anónima: tus respuestas llevan tu nombre y RR.HH. las verá así."} Se guarda en este dispositivo: si la dejas a medias, vuelve con el mismo código.</p></div>`;
  } else if (paso.k === "fin") {
    const dur = CI.t0 ? Math.max(1, Math.round((Date.now() - CI.t0) / 1000)) : 0;
    const r = Object.keys(CI.ans).length + Object.values(CI.textos).filter(x => x && x.trim()).length;
    h = `<div class="cli-in fin">${marca}
      <span class="cli-ok" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
      <h1>${CI.previa ? "Fin de la vista previa" : "Gracias. Ya está enviada."}</h1>
      <p>${CI.previa ? "Así termina la encuesta para quien responde. No se ha guardado ninguna respuesta." : CI.yaEstaba ? "Esta encuesta ya se respondió con este código. Gracias por participar." : `Has respondido ${r} preguntas${dur ? " en " + (dur >= 60 ? Math.floor(dur / 60) + " min " + (dur % 60) + " s" : dur + " segundos") : ""}. ${CI.cfg.anonima !== false ? `Tus respuestas son anónimas y se suman a las de tu ${esc(col ? col.eq : "equipo")}.` : "Tus respuestas han llegado a RR.HH. con tu nombre."}`}</p>
      ${CI.previa ? `<button class="cli-btn" data-action="cliCerrarPrevia">Cerrar la vista previa</button>` : `<div class="cli-caja"><b>¿Y ahora qué?</b><span>Cuando cierre la encuesta, se compartirán los resultados de tu ${esc(col ? col.eq : "equipo")} y las acciones que se decidan con ellos.</span></div>
      <p class="cli-nota">Ya puedes cerrar esta ventana.</p>`}</div>`;
  } else {
    const pos = Math.max(1, seq.slice(0, CI.i + 1).filter(s => s.k === "q" || s.k === "abierta").length);
    const quedanSeg = seq.slice(CI.i).filter(s => s.k === "q").length * 6 + seq.slice(CI.i).filter(s => s.k === "abierta").length * 30;
    const quedan = quedanSeg < 60 ? "menos de 1 min" : "quedan " + Math.ceil(quedanSeg / 60) + " min";
    const tramos = clInvTramos(seq);
    const cab = `<div class="cli-cab"><button class="cli-atras" data-action="cliAtras" aria-label="Pregunta anterior"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
      <div class="cli-prog"><div class="cli-prog-t"><span>${pos} de ${contables.length}</span><span>${quedan}</span></div>
        <div class="cli-tramos">${tramos.map(t => `<div style="flex:${t.peso}" title="${esc(t.t)}"><i style="width:${Math.round(t.lleno * 100)}%"></i></div>`).join("")}</div></div></div>`;
    if (paso.k === "p2") {
      const m = (CI.responsable || "").match(/^(.*)\s*\(([^()]*)\)\s*$/);
      const [nom, rol] = m ? [m[1].trim(), m[2]] : [CI.responsable || "", ""];
      const ini = (nom || "R").split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase();
      h = `<div class="cli-in">${cab}<div class="cli-cuerpo">
        <span class="cli-eti chip">Parte 1 hecha</span>
        <h2 class="cli-p">Ahora, 10 preguntas sobre tu responsable directo</h2>
        <div class="cli-resp"><span>${esc(ini)}</span><div><b>${esc(nom || "Tu responsable directo")}</b><small>${esc(rol || (col ? col.resp : "Responsable directo"))}</small></div></div>
        <p class="cli-txt">${CI.cfg.anonima !== false ? `También es anónima. Solo verá un resumen si le han valorado ${CL.MIN} personas o más, nunca respuestas sueltas.` : `RR.HH. verá tus respuestas con tu nombre. Tu responsable solo verá un resumen si le han valorado ${CL.MIN} personas o más.`}</p>
        <div class="cli-sp"></div><button class="cli-btn" data-action="cliSeguir">Seguir · 1 minuto</button></div></div>`;
    } else if (paso.k === "abierta") {
      const q = paso.q, ultima = seq[CI.i + 1] && seq[CI.i + 1].k === "fin";
      const txt = q.inteligente ? clInvAbierta().t : q.t;
      const abiertas = seq.filter(s => s.k === "abierta"), na = abiertas.indexOf(paso) + 1;
      h = `<div class="cli-in">${cab}<div class="cli-cuerpo">
        <span class="cli-eti chip">${abiertas.length > 1 ? `Abierta ${na} de ${abiertas.length}` : "Última"} · opcional</span>
        <h2 class="cli-p">${esc(txt)}</h2>
        <label class="cli-area"><span>Tu respuesta</span><textarea data-cli-txt="${q.id}" maxlength="500" rows="5" placeholder="Escribe aquí, en pocas palabras">${esc(CI.textos[q.id] || "")}</textarea></label>
        <span class="cli-nota izq">${CI.cfg.anonima !== false ? "Sin nombres, por favor: así nadie puede reconocerte. " : ""}Máximo 500 caracteres.</span>
        <div class="cli-sp"></div>
        <button class="cli-btn" data-action="cliSeguir" ${CI.enviando ? "disabled" : ""}>${ultima ? (CI.enviando ? "Enviando…" : CI.previa ? "Terminar la vista previa" : "Enviar respuestas") : "Siguiente"}</button>
        <button class="cli-btn ghost" data-action="cliSaltar" ${CI.enviando ? "disabled" : ""}>${ultima ? "Saltar y enviar" : "Saltar"}</button></div></div>`;
    } else {
      const q = paso.q, v = CI.ans[q.id];
      const eti = q.parte === 2 ? "Parte 2 · Tu responsable" : CI.pl.gptw ? (q.apartado ? `${CL.DIMS.indexOf(q.dim) + 1}/5 · ${q.dim} · ${q.apartado}` : "En conjunto") : (CI.cfg.parte2 ? "Parte 1 · " : "") + (q.dim || "");
      const opciones = q.tipo === "nps"
        ? `<div class="cli-nps">${Array.from({ length: 11 }, (_, k) => `<button class="${v === k ? "on" : ""}" data-action="cliResp" data-v="${k}" aria-pressed="${v === k}" aria-label="${k} sobre 10">${k}</button>`).join("")}</div>
           <div class="cli-nps-l"><span>0 · Nada probable</span><span>10 · Seguro que sí</span></div>`
        : `<div class="cli-ops">${CL.ESCALA.map((t, k) => `<button class="${v === k ? "on" : ""}" data-action="cliResp" data-v="${k}" aria-pressed="${v === k}"><span>${k + 1}</span>${esc(t)}</button>`).join("")}</div>`;
      h = `<div class="cli-in">${cab}<div class="cli-cuerpo">
        ${CI.aviso ? `<p class="cli-aviso">${esc(CI.aviso)}</p>` : ""}
        <span class="cli-eti chip">${esc(eti)}</span>
        <h2 class="cli-p">${esc(q.t)}</h2>
        ${q.tipo === "likert" ? `<span class="cli-sub">¿Hasta qué punto es verdad?</span>` : ""}
        <div class="cli-sp"></div>
        ${opciones}
        <p class="cli-tecla">Atajo: ${q.tipo === "nps" ? "teclas del 0 al 9" : "teclas del 1 al 5"}.</p></div></div>`;
    }
  }
  root.innerHTML = `<div class="cli${CI.previa ? " en-previa" : ""}">${h}</div>`;
  if (!CI.previa) document.title = "Encuesta de clima · Pippole";
}
/* Abierta inteligente: por la dimensión peor valorada en la parte 1 */
function clInvAbierta() {
  let peor = null, media = 9;
  CL.DIMS.forEach(d => {
    const vs = clPreguntas(CI.pl, CI.cfg).filter(q => q.parte === 1 && q.dim === d && q.tipo === "likert").map(q => CI.ans[q.id]).filter(v => typeof v === "number");
    if (!vs.length) return;
    const m = vs.reduce((a, b) => a + b, 0) / vs.length;
    if (m < media) { media = m; peor = d; }
  });
  return peor && media < 2.6
    ? { dim: peor, t: `Lo que menos has valorado es ${CL.FRASE[peor]}. Si pudieras cambiar una sola cosa, ¿cuál sería?` }
    : { dim: null, t: "¿Qué es lo que más valoras de trabajar aquí?" };
}
function clInvAvanzar() { const seq = clInvSeq(); CI.i = Math.min(CI.i + 1, seq.length - 1); CI.aviso = ""; clGuardar(); clInvPintar(); window.scrollTo(0, 0); }
async function clInvEnviar() {
  const seq = clInvSeq(), resp = Object.assign({}, CI.ans);
  seq.filter(s => s.k === "abierta").forEach(s => {
    const t = (CI.textos[s.q.id] || "").trim().slice(0, 500);
    if (t) { resp[s.q.id] = t; if (s.q.inteligente) { const a = clInvAbierta(); if (a.dim) resp[s.q.id + "_dim"] = a.dim; } }
  });
  if (CI.previa) { CI.fin = true; clInvPintar(); return; }
  CI.enviando = true; clInvPintar();
  const { error } = await sb.rpc("invitacion_responder", { p_codigo: INV.codigo, p_respuestas: resp });
  CI.enviando = false;
  if (error) { avisar("No se han podido enviar las respuestas: " + traducirError(error) + "\n\nTus respuestas siguen guardadas en este dispositivo: inténtalo de nuevo."); clInvPintar(); return; }
  INV.enviado = true; CI.fin = true;
  try { localStorage.removeItem(clClave()); } catch (e) {}
  clInvPintar(); window.scrollTo(0, 0);
}

const ACCIONES_CLI = {
  cliEmpezar() { CI.i = CI.guardado != null ? Math.max(0, CI.guardado) : 0; if (!CI.t0) CI.t0 = Date.now(); clInvPintar(); return false; },
  cliAtras() { CI.i = Math.max(-1, CI.i - 1); CI.aviso = ""; clGuardar(); clInvPintar(); return false; },
  cliSeguir() {
    const seq = clInvSeq(), paso = seq[CI.i];
    if (paso && paso.k === "abierta" && seq[CI.i + 1] && seq[CI.i + 1].k === "fin") { clInvEnviar(); return false; }
    clInvAvanzar(); return false;
  },
  cliSaltar() {
    const seq = clInvSeq(), paso = seq[CI.i];
    if (paso && paso.q) delete CI.textos[paso.q.id];
    return ACCIONES_CLI.cliSeguir();
  },
  cliResp(b) {
    if (CI.lock) return false;
    const seq = clInvSeq(), paso = seq[CI.i];
    if (!paso || !paso.q) return false;
    CI.ans[paso.q.id] = Number(b.dataset.v); CI.lock = true; clGuardar(); clInvPintar();
    setTimeout(() => { CI.lock = false; clInvAvanzar(); }, 200);
    return false;
  },
  cliCerrarPrevia() { const ov = $("clPrev"); if (ov) ov.remove(); CI.activo = false; CI.previa = false; return false; }
};
if (typeof ACCIONES_INVITADO !== "undefined") Object.assign(ACCIONES_INVITADO, ACCIONES_CLI);

document.addEventListener("input", e => {
  const id = e.target && e.target.dataset && e.target.dataset.cliTxt;
  if (id && CI.activo) { CI.textos[id] = e.target.value; clGuardar(); }
});
document.addEventListener("keydown", e => {
  if (!CI.activo || CI.fin || e.altKey || e.ctrlKey || e.metaKey) return;
  if (!CI.previa && S.me) return;
  if (/^(TEXTAREA|INPUT|SELECT)$/.test((e.target || {}).tagName || "")) return;
  const seq = clInvSeq(), paso = CI.i >= 0 ? seq[CI.i] : null;
  if (!paso && e.key === "Enter") { e.preventDefault(); ACCIONES_CLI.cliEmpezar(); return; }
  if (!paso) return;
  if (paso.k === "p2" && e.key === "Enter") { e.preventDefault(); ACCIONES_CLI.cliSeguir(); return; }
  if (paso.k !== "q") return;
  const n = paso.q.tipo === "nps" ? (/^[0-9]$/.test(e.key) ? +e.key : null) : (/^[1-5]$/.test(e.key) ? +e.key - 1 : null);
  if (n != null) { e.preventDefault(); ACCIONES_CLI.cliResp({ dataset: { v: n } }); }
  else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); ACCIONES_CLI.cliAtras(); }
});
