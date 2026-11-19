"use strict";
/* ===================== AVISOS: lo que se ha completado =====================
   Campana en la cabecera con lo último que han terminado las personas que
   entran con código: encuestas de clima, formaciones, pruebas y entregas del
   Talent Review. Cada usuario ve lo que puede leer (RR.HH. todo; el Regional
   Manager, lo de sus tiendas) y marca como visto en este navegador.
   Mientras la sesión está abierta se consulta cada minuto y, si llega algo
   nuevo, sale un aviso abajo.
   Las encuestas anónimas se agrupan por campaña y sin hora ni tienda, para
   que el aviso no permita deducir quién ha respondido.
   ======================================================================== */
const AV = { prev: null, timer: null, ultimo: null };
const avClave = () => "pp-visto-" + (yoReal() || {}).id;
function avVisto() { try { return localStorage.getItem(avClave()) || ""; } catch (e) { return ""; } }
function avMarcar() { try { localStorage.setItem(avClave(), new Date().toISOString()); } catch (e) {} }

/* Entregas del Talent Review: solo RR.HH. puede leer estas tablas */
async function cargarAvisosDr() {
  S.drEnt = []; S.drCic = [];
  if (!realEsAdmin()) return;
  const [e, c] = await Promise.all([
    sb.from("dr_evaluadores").select("id,nombre,unidad,ciclo_id,entregado"),
    sb.from("dr_ciclos").select("id,nombre,ambito")]);
  if (e.error || c.error) return;
  S.drEnt = (e.data || []).filter(x => x.entregado); S.drCic = c.data || [];
}

function avLista() {
  const out = [], anon = {};
  const misTiendas = new Set((S.tiendas || []).map(t => t.id));
  (S.invitaciones || []).forEach(i => {
    if (i.estado !== "respondida" || !i.respondido) return;
    const c = (S.campanas || []).find(x => x.id === i.campana_id); if (!c) return;
    if (!esAdmin() && !misTiendas.has(i.tienda_id)) return;
    const pl = SC.plantilla(c.plantilla) || {};
    if (pl.oculto || (typeof plantillaVisible === "function" && !plantillaVisible(pl))) return;
    if (pl.anonima && !(pl.v2 && (c.config || {}).anonima === false)) {
      const g = anon[c.id] || (anon[c.id] = { tipo: "anon", c, n: 0, fecha: "", fechas: [] });
      g.n++; g.fechas.push(i.respondido); if (i.respondido > g.fecha) g.fecha = i.respondido;
      return;
    }
    const t = (S.todas || []).find(x => x.id === i.tienda_id);
    const nota = c.tipo === "formacion" || c.tipo === "psico" ? SC.puntuar(pl, i.respuestas || {}) : null;
    out.push({ tipo: "inv", c, i, fecha: i.respondido, quien: i.destinatario || "Una persona", donde: t ? t.nombre : "",
      que: c.tipo === "formacion" ? `ha completado ${SC.txt(pl.nombre) || c.titulo}` : c.tipo === "clima" ? `ha respondido ${c.titulo}` : `ha completado ${c.titulo}`,
      extra: nota && nota.max ? `${Math.round(nota.pct * 100)} %${pl.umbral ? (nota.pct >= pl.umbral ? " · superada" : " · no superada") : ""}` : "" });
  });
  const visto = avVisto();
  Object.values(anon).forEach(g => out.push(Object.assign(g, { nuevas: g.fechas.filter(f => f > visto).length })));
  (S.drEnt || []).forEach(e => {
    const c = (S.drCic || []).find(x => x.id === e.ciclo_id); if (!c) return;
    out.push({ tipo: "dr", e, c, fecha: e.entregado, quien: e.nombre, donde: e.unidad || "", que: `ha enviado su Talent Review (${c.nombre})` });
  });
  return out.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 30);
}
const avEsNuevo = (x, visto) => (x.tipo === "anon" ? x.nuevas > 0 : x.fecha > visto);
function avContar() { const v = avVisto(); return avLista().filter(x => avEsNuevo(x, v)).length; }

const ICO_CAMPANA = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;
function campanaAvisos() {
  if (esMarketing && esMarketing() && !S.real) return "";
  const n = avContar();
  return `<details class="avisos" id="avisos"><summary data-action="abrirAvisos" aria-label="Novedades${n ? `: ${n} sin ver` : ""}" title="Novedades">${ICO_CAMPANA}<b id="avN" ${n ? "" : "hidden"}>${n > 9 ? "9+" : n}</b></summary><div class="av-menu" id="avMenu"></div></details>`;
}
function avMenuHtml() {
  const v = AV.prev != null ? AV.prev : avVisto(), xs = avLista();
  const hora = f => { const d = new Date(f); return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); };
  return `<div class="av-h"><b>Novedades</b><span class="hint">lo último que se ha completado</span></div>
    ${xs.length ? `<ul>${xs.map((x, k) => `<li class="${avEsNuevo(x, v) ? "nuevo" : ""}"><button data-action="irNovedad" data-k="${k}">
      ${x.tipo === "anon" ? `<b>${x.n} ${x.n === 1 ? "respuesta" : "respuestas"} en ${esc(x.c.titulo)}</b><small>Encuesta anónima${x.nuevas ? ` · ${x.nuevas} sin ver` : ""} · ${esc(new Date(x.fecha).toLocaleDateString("es-ES"))}</small>`
      : `<b>${esc(x.quien)}</b> <span>${esc(x.que)}</span>${x.extra ? ` <em>${esc(x.extra)}</em>` : ""}<small>${x.donde ? esc(x.donde) + " · " : ""}${esc(hora(x.fecha))}</small>`}</button></li>`).join("")}</ul>`
      : `<p class="hint av-vacio">Todavía no se ha completado nada. Aquí aparecerá cada encuesta, formación o Talent Review en cuanto se termine.</p>`}`;
}
function avRefrescar() {
  const n = avContar(), b = $("avN"); if (!b) return;
  b.hidden = !n; b.textContent = n > 9 ? "9+" : n;
  const d = $("avisos"); if (d && d.open) $("avMenu").innerHTML = avMenuHtml();
}

/* Consulta ligera cada minuto: solo lo completado desde la última vez */
async function avSondear() {
  if (!S.me || document.hidden) return;
  const desde = AV.ultimo || new Date(Date.now() - 60000).toISOString();
  AV.ultimo = new Date().toISOString();
  const nuevos = [];
  const r = await sb.from("invitaciones").select("*").gte("respondido", desde);
  if (!r.error) (r.data || []).forEach(i => {
    const k = (S.invitaciones || []).findIndex(x => x.id === i.id);
    const antes = k >= 0 ? S.invitaciones[k] : null;
    if (k >= 0) S.invitaciones[k] = i; else (S.invitaciones = S.invitaciones || []).push(i);
    if (i.estado === "respondida" && (!antes || antes.estado !== "respondida")) nuevos.push(i);
  });
  if (realEsAdmin()) {
    const e = await sb.from("dr_evaluadores").select("id,nombre,unidad,ciclo_id,entregado").gte("entregado", desde);
    if (!e.error) (e.data || []).forEach(x => {
      const k = (S.drEnt || []).findIndex(y => y.id === x.id);
      if (k >= 0) { if (S.drEnt[k].entregado !== x.entregado) { S.drEnt[k] = x; nuevos.push({ dr: x }); } }
      else { (S.drEnt = S.drEnt || []).push(x); nuevos.push({ dr: x }); }
    });
  }
  const vis = nuevos.filter(x => x.dr || avLista().some(y => y.i && y.i.id === x.id) || avLista().some(y => y.tipo === "anon" && y.c.id === x.campana_id));
  if (!vis.length) return;
  avRefrescar();
  const x = vis[vis.length - 1];
  if (x.dr) toast(`${x.dr.nombre} ha enviado su Talent Review`);
  else { const it = avLista().find(y => y.i && y.i.id === x.id); toast(vis.length > 1 ? `${vis.length} novedades nuevas` : it ? `${it.quien} ${it.que}` : "Nueva respuesta en una encuesta"); }
}
function avArrancar() {
  if (AV.timer) return;
  AV.ultimo = new Date().toISOString();
  AV.timer = setInterval(() => { avSondear().catch(() => {}); }, 60000);
  const n = avContar();
  if (n) setTimeout(() => toast(n === 1 ? "Tienes 1 novedad sin ver" : `Tienes ${n} novedades sin ver`), 600);
}

const ACCIONES_AVISOS = {
  abrirAvisos(b) {
    const d = b.closest("details");
    if (!d.open) { AV.prev = avVisto(); $("avMenu").innerHTML = avMenuHtml(); avMarcar(); const n = $("avN"); if (n) n.hidden = true; }
    else AV.prev = null;
    return false;
  },
  irNovedad(b) {
    const v = AV.prev != null ? AV.prev : avVisto(), x = avLista()[+b.dataset.k]; AV.prev = null;
    void v;
    const d = $("avisos"); if (d) d.open = false;
    if (!x) return false;
    S.tiendaFoco = null;
    if (x.tipo === "dr") {
      irA({ m: "desarrollo", tab: x.c.ambito });
      const D = drS(); D.ciclo = x.c.id; D.vista = "informes"; D.inf = x.e.id; D.amb = null;
      return;
    }
    const c = x.c;
    if (c.tipo === "clima") irA({ m: "clima", campana: c.id });
    else if (c.tipo === "formacion") irA({ m: "formacion", tab: "seguimiento" });
    else if (c.tipo === "psico") irA({ m: "formacion", tab: "psico", campana: c.id });
    else irA({ m: S.modulo, campana: c.id });
  }
};
document.addEventListener("click", e => {
  const d = $("avisos");
  if (d && d.open && !d.contains(e.target)) { d.open = false; AV.prev = null; }
});
document.addEventListener("keydown", e => { const d = $("avisos"); if (e.key === "Escape" && d && d.open) { d.open = false; AV.prev = null; } });
