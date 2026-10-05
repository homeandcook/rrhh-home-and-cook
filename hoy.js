"use strict";
/* ===================== PARA HOY Y BÚSQUEDA RÁPIDA =====================
   "Para hoy": lo que pide atención en todos los apartados, en una lista en
   la portada, calculado con lo que ya está cargado. Cada aviso lleva al
   sitio donde se resuelve.
   Búsqueda rápida: desde la cabecera, una tienda, una persona o un
   apartado, y abre directamente.
   ======================================================================== */
function avisosHoy() {
  const A = [];
  const add = (nivel, txt, modulo, extra) => A.push(Object.assign({ nivel, txt, modulo }, extra || {}));
  const hoy = new Date();
  if (esMarketing()) {
    const ms = mesesDisponibles();
    if (!ms.length) add("info", "El People Data Centre todavía no tiene datos mensuales.", "pdc");
    return A;
  }
  // Scorecard
  const sinVal = S.tiendas.filter(t => !t.objetivosValidados && t.personas.length);
  if (sinVal.length) add("aviso", `${sinVal.length} ${sinVal.length === 1 ? "tienda con objetivos sin validar" : "tiendas con objetivos sin validar"}`, "scorecard", { t: sinVal[0].id, fase: "obj" });
  const completas = [];
  S.tiendas.forEach(t => t.personas.forEach(p => ["s1", "fy"].forEach(per => { const r = SC.calcular(t, p, per); if (r.estado === "completo") completas.push({ t, p, per }); })));
  if (completas.length) add("aviso", `${completas.length} ${completas.length === 1 ? "evaluación completa sin cerrar" : "evaluaciones completas sin cerrar"}`, "scorecard", { t: completas[0].t.id, p: completas[0].p.id, fase: completas[0].per });
  const mes = hoy.getMonth() + 1;
  if (mes >= 11) {
    const sinFy = S.tiendas.reduce((s, t) => s + t.personas.filter(p => !((p.evals || {}).fy || {}).cerrado).length, 0);
    if (sinFy) add("info", `${sinFy} ${sinFy === 1 ? "cierre anual pendiente" : "cierres anuales pendientes"} antes de fin de año`, "scorecard");
  }
  // Talent
  const urg = [];
  S.tiendas.forEach(t => t.personas.forEach(p => { const r = SC.talent(t, p); if (r.prioridad === "Actuar ya" && !(r.tal.retencion || "").trim()) urg.push({ t, p }); }));
  if (urg.length) add("alerta", `${urg.length} ${urg.length === 1 ? "persona con riesgo alto de salida sin acción de retención" : "personas con riesgo alto de salida sin acción de retención"}`, "talent", { t: urg[0].t.id, p: urg[0].p.id, fase: "talent" });
  // Bajas
  const largas = [];
  S.tiendas.forEach(t => (t.bajas || []).forEach(b => { if (!b.fin && SC.diasTotales(b) > 30) largas.push({ t, b }); }));
  if (largas.length) add("info", `${largas.length} ${largas.length === 1 ? "baja abierta de más de 30 días" : "bajas abiertas de más de 30 días"}: comprobar si hay alta`, "bajas", { tienda: largas[0].t.id });
  // PRL
  if (typeof resumenPrl === "function") {
    const R = S.tiendas.map(t => Object.assign({ t }, resumenPrl(t)));
    const venc = R.reduce((s, x) => s + x.vencidas, 0), rev = R.filter(x => x.revVencidas);
    if (venc) add("alerta", `${venc} ${venc === 1 ? "formación de prevención vencida o sin hacer" : "formaciones de prevención vencidas o sin hacer"}`, "prl", { tienda: (R.find(x => x.vencidas) || {}).t });
    if (rev.length) add("aviso", `${rev.length} ${rev.length === 1 ? "tienda con revisiones del local pendientes" : "tiendas con revisiones del local pendientes"} (evaluación, simulacro o extintores)`, "prl", { tienda: rev[0].t });
  }
  // Pruebas y encuestas
  (S.campanas || []).filter(c => c.estado === "abierta").forEach(c => {
    const inv = (S.invitaciones || []).filter(i => i.campana_id === c.id);
    const mias = esAdmin() ? inv : inv.filter(i => { const t = S.tiendas.find(x => x.id === i.tienda_id); return t && t.rm_id === S.me.id; });
    const pend = mias.filter(i => i.estado !== "respondida").length;
    if (mias.length && pend / mias.length > 0.5 && pend >= 3) add("info", `${c.titulo}: ${pend} de ${mias.length} códigos sin responder`, (CONFIG.tiposPrueba[c.tipo] || {}).modulo || (c.tipo === "offboarding" ? "onboarding" : c.tipo), { campana: c.id });
  });
  // People Data Centre
  const ms = mesesDisponibles();
  if (ms.length) {
    const ult = ms[ms.length - 1], d = new Date(ult + "-01T00:00:00Z"), dias = (hoy - d) / 86400000;
    if (dias > 75) add("info", `Los datos del People Data Centre llegan hasta ${nombreMes(ult)}: falta cargar ${Math.floor(dias / 30) - 1} ${Math.floor(dias / 30) - 1 === 1 ? "mes" : "meses"}`, "pdc", { carga: true });
  } else add("info", "El People Data Centre todavía no tiene datos mensuales", "pdc", { carga: true });
  // Formación propia
  if (typeof cursosCompletados === "function") {
    const pend = CURSOS.length - cursosCompletados();
    if (pend) add("info", `Tienes ${pend} ${pend === 1 ? "formación pendiente" : "formaciones pendientes"} en el catálogo`, "formacion");
  }
  const orden = { alerta: 0, aviso: 1, info: 2 };
  return A.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
function bloqueHoy() {
  const A = avisosHoy();
  const hoy = (d => d.charAt(0).toUpperCase() + d.slice(1))(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));
  return `<section class="hoy"><div class="hoy-h"><h2 class="grupo" style="margin:0">Para hoy</h2><span class="muted">${esc(hoy)}</span></div>
    ${A.length ? `<ul class="hoy-l">${A.map(a => `<li class="${a.nivel}"><button data-action="irAviso" data-m="${esc(a.modulo)}" ${a.t ? `data-t="${esc(a.t)}"` : ""} ${a.p ? `data-p="${esc(a.p)}"` : ""} ${a.fase ? `data-fase="${esc(a.fase)}"` : ""} ${a.tienda ? `data-tienda="${esc(a.tienda)}"` : ""} ${a.campana ? `data-campana="${esc(a.campana)}"` : ""} ${a.carga ? `data-carga="1"` : ""}><i></i><span>${esc(a.txt)}</span><small>${esc(modTxt(a.modulo, 0))} →</small></button></li>`).join("")}</ul>`
      : `<p class="hoy-ok">Todo al día. Nada pide atención en ningún apartado.</p>`}</section>`;
}

/* ---------- Búsqueda rápida ---------- */
function buscarGlobal(q) {
  q = (q || "").trim().toLowerCase(); if (q.length < 2) return [];
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const nq = norm(q), out = [];
  MODULOS.filter(m => puedeVer(m.id) && m.grupo !== "externo").forEach(m => { if (norm(modTxt(m.id, 0)).includes(nq) || norm(m.id).includes(nq)) out.push({ tipo: "Apartado", t: modTxt(m.id, 0), m: m.id }); });
  if (typeof CURSOS !== "undefined") CURSOS.forEach(c => { if (norm(c.t).includes(nq)) out.push({ tipo: "Formación", t: c.t, m: "formacion", curso: c.id }); });
  S.tiendas.forEach(t => { if (norm(t.nombre).includes(nq) || norm(t.codigo).includes(nq)) out.push({ tipo: "Tienda", t: t.nombre, sub: t.codigo, m: esMarketing() ? "pdc" : "scorecard", tienda: t.id }); });
  if (!esMarketing()) S.tiendas.forEach(t => t.personas.forEach(p => { if (norm(p.nombre).includes(nq)) out.push({ tipo: "Persona", t: p.nombre, sub: `${(C.bonus[p.puesto] || {}).nombre || p.puesto} · ${t.nombre}`, m: "scorecard", tienda: t.id, p: p.id }); }));
  DOCS_TIPOS.forEach(tipo => { if (!puedeVer(tipo)) return; libro(tipo).items.forEach(x => { if (norm(x.t).includes(nq)) out.push({ tipo: libro(tipo).titulo, t: x.t, m: tipo, doc: x.id }); }); });
  return out.slice(0, 9);
}
function pintarBusqueda() {
  const el = $("buscaRes"), inp = $("buscaGlobal"); if (!el || !inp) return;
  const r = buscarGlobal(inp.value);
  if (!inp.value.trim()) { el.hidden = true; el.innerHTML = ""; return; }
  el.hidden = false;
  el.innerHTML = r.length ? r.map((x, i) => `<button class="${i === 0 ? "on" : ""}" data-action="irBusca" data-m="${esc(x.m)}" ${x.tienda ? `data-tienda="${esc(x.tienda)}"` : ""} ${x.p ? `data-p="${esc(x.p)}"` : ""} ${x.curso ? `data-curso="${esc(x.curso)}"` : ""} ${x.doc ? `data-doc="${esc(x.doc)}"` : ""}><small>${esc(x.tipo)}</small><b>${esc(x.t)}</b>${x.sub ? `<span>${esc(x.sub)}</span>` : ""}</button>`).join("")
    : `<p class="muted">Nada con «${esc(inp.value)}».</p>`;
}
function irA(d) {
  S.modulo = d.m; S.campana = null;
  if (S.docs) { S.docs.sel = d.doc || null; S.docs.edit = null; S.docs.busca = ""; }
  if (d.m === "scorecard") { S.vista = "eval"; S.ui = { t: d.tienda || d.t || null, p: d.p || null, fase: d.fase || (d.p ? "fy" : "obj") }; }
  else if (d.m === "talent") { S.vista = "eval"; S.ui = { t: d.tienda || d.t || null, p: d.p || null, fase: "talent" }; }
  else if (d.m === "pdc") { const f = filtroPDC(); f.tienda = d.tienda || ""; f.vista = d.carga ? "cargar" : "cuadro"; }
  else if (d.m === "bajas") { filtroBajas().tienda = d.tienda || ""; }
  else if (d.m === "prl") { filtroPrl().tienda = d.tienda || ""; }
  else if (d.m === "formacion") { S.curso = d.curso || null; S.chuleta = false; S.vista = "recorrido"; if (d.curso) S.paso = progresoCurso(d.curso).ultimo || (pasosDe(d.curso)[0] || {}).id; }
  else if (d.campana) { const c = (S.campanas || []).find(x => x.id === d.campana); if (c) { S.campana = c.id; if (c.tipo === "offboarding" || c.tipo === "onboarding") S.vista = c.tipo; } }
  const i = $("buscaGlobal"); if (i) i.value = "";
  window.scrollTo(0, 0);
}
const ACCIONES_HOY = {
  irAviso(b) { irA(b.dataset); },
  irBusca(b) { irA(b.dataset); }
};
document.addEventListener("input", e => { if (e.target.id === "buscaGlobal") pintarBusqueda(); });
document.addEventListener("keydown", e => {
  if (e.target.id !== "buscaGlobal") return;
  if (e.key === "Escape") { e.target.value = ""; pintarBusqueda(); e.target.blur(); }
  if (e.key === "Enter") { const b = document.querySelector("#buscaRes button.on") || document.querySelector("#buscaRes button"); if (b) b.click(); }
});
document.addEventListener("click", e => { const r = $("buscaRes"); if (r && !r.hidden && !e.target.closest(".busca-g")) { r.hidden = true; } });
