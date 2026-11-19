"use strict";
/* =====================================================================
   Employer Branding (0.36.0): reseñas de Google de cada tienda y de la
   oficina, en un solo sitio. Solo RR.HH.
   - Sitios vinculados: tabla resenas_sitios (solo el place_id de Google;
     migración 0.36).
   - Reseñas: función «resenas», que consulta Google Places (New) en vivo.
     Google da la nota, el número de reseñas y como mucho 5 reseñas por
     sitio. Cuando haya acceso a Google Business Profile se podrán leer
     todas (paso siguiente acordado).
   - «Nuevas»: se compara con lo que esta persona vio la última vez,
     recordado solo en su navegador (localStorage). Nada de Google se
     guarda en la base de datos.
   - Actualización automática como mucho una vez al día por persona, para
     no pasar de las 1.000 consultas gratuitas al mes de Google.
   ===================================================================== */
const EB_HORAS_AUTO = 20;
function ebS() {
  if (!S.eb) S.eb = { sitios: null, falta: false, datos: {}, consultado: null, cargando: false, error: "", ver: "todas", orden: "peor", conf: false, busca: null, nuevas: {} };
  return S.eb;
}
function ebClave() { const yo = (typeof yoReal === "function" ? yoReal() : S.me) || {}; return "pp-eb-" + (yo.id || "x"); }
function ebMemoria() { try { return JSON.parse(localStorage.getItem(ebClave()) || "{}") || {}; } catch (e) { return {}; } }
function ebGuardarMemoria(m) { try { localStorage.setItem(ebClave(), JSON.stringify(m)); } catch (e) {} }

async function cargarSitiosResenas() {
  const E = ebS();
  if (!esAdmin()) { E.sitios = []; return; }
  const r = await sb.from("resenas_sitios").select("*").order("nombre");
  if (r.error) { E.sitios = null; E.falta = /resenas_sitios|relation|does not exist|schema cache|42P01/i.test((r.error.message || "") + (r.error.code || "")); return; }
  E.falta = false; E.sitios = r.data || [];
}
/* Consulta a Google (vía la función). auto = solo si hace más de 20 h */
async function ebActualizar(auto) {
  const E = ebS();
  if (!Array.isArray(E.sitios) || !E.sitios.length || E.cargando) return;
  const M = ebMemoria();
  if (auto && M.ultimo && Date.now() - Date.parse(M.ultimo) < EB_HORAS_AUTO * 36e5) return;
  E.cargando = true; E.error = "";
  if (S.modulo === "employer") pintar();
  try {
    const { data, error } = await sb.functions.invoke("resenas", { body: { sitios: E.sitios.map(s => s.place_id) } });
    let det = "";
    if (error) { try { det = (await error.context.json()).error || ""; } catch (e) {} throw new Error(det || error.message || "sin respuesta"); }
    E.datos = {}; (data.sitios || []).forEach(x => { E.datos[x.id] = x; });
    E.consultado = data.consultado || new Date().toISOString();
    // Nuevas: más reseñas que la última vez que esta persona las marcó como vistas
    const prev = M.cuentas || {};
    E.nuevas = {};
    Object.values(E.datos).forEach(x => { if (!x.error && prev[x.id] != null && x.total > prev[x.id]) E.nuevas[x.id] = x.total - prev[x.id]; });
    if (!M.cuentas) { M.cuentas = {}; Object.values(E.datos).forEach(x => { if (!x.error) M.cuentas[x.id] = x.total; }); M.visto = E.consultado; }
    M.ultimo = new Date().toISOString(); ebGuardarMemoria(M);
  } catch (e) {
    const m = (e && e.message) || String(e);
    E.error = m === "FALTA_CLAVE" ? "FALTA_CLAVE" : m;
  }
  E.cargando = false;
  if (S.modulo === "employer" || S.modulo === "inicio") pintar();
  if (typeof avRefrescar === "function") avRefrescar();
}
const ebNuevasTotal = () => Object.values(ebS().nuevas || {}).reduce((a, b) => a + b, 0);
/* Para la campana de avisos */
function ebAvisos() {
  const E = ebS(); if (!esAdmin() || !E.consultado) return [];
  return Object.entries(E.nuevas || {}).map(([pid, n]) => {
    const s = (E.sitios || []).find(x => x.place_id === pid), d = E.datos[pid] || {};
    return { tipo: "eb", fecha: E.consultado, quien: (s && s.nombre) || d.nombre || "Un sitio", que: `tiene ${n} ${n === 1 ? "reseña nueva" : "reseñas nuevas"} en Google`, extra: d.nota != null ? "★ " + String(d.nota).replace(".", ",") : "", donde: "" };
  });
}

const ebEstrellas = n => { const k = Math.round(n || 0); return `<span class="eb-est" aria-label="${n} de 5 estrellas">${"★".repeat(k)}<i>${"★".repeat(5 - k)}</i></span>`; };
const ebNota = v => (v == null ? "–" : (Math.round(v * 10) / 10).toFixed(1).replace(".", ","));

function pintarEmployer() {
  const E = ebS(), M = ebMemoria();
  if (E.sitios == null && !E.falta) { cargarSitiosResenas().then(() => { pintar(); ebActualizar(true); }); $("vista").innerHTML = `<div class="page"><p class="muted">Cargando…</p></div>`; return; }
  let h = `<div class="page eb"><div class="page-h"><div><h1>Employer Branding</h1>
      <p class="muted">Lo que dicen en Google de cada tienda y de la oficina. Son reseñas de clientes: hablan de la compra y del trato del equipo.</p></div>
    <div class="page-h-b">${E.sitios && E.sitios.length ? `<button class="btn" data-action="ebActualizar" ${E.cargando ? "disabled" : ""}>${E.cargando ? "Consultando Google…" : "Actualizar"}</button>` : ""}
      ${E.sitios ? `<button class="btn ${E.sitios.length ? "" : "primary"}" data-action="ebConf">${E.conf ? "Cerrar sitios" : `Sitios de Google (${E.sitios.length})`}</button>` : ""}</div></div>`;
  if (E.falta) return ($("vista").innerHTML = h + `<div class="cl-vacio"><b>Falta un paso en la base de datos</b><p>Ejecuta <code>supabase/migracion_0.36.sql</code> en el SQL Editor de Supabase y vuelve a cargar la página.</p></div></div>`);
  if (E.error === "FALTA_CLAVE") h += `<div class="cl-vacio"><b>Falta la clave de Google</b><p>Añade el secreto <code>GOOGLE_PLACES_KEY</code> en Supabase (Edge Functions → Secrets) con una clave de la API de Google Places (New) y pulsa «Actualizar».</p></div>`;
  else if (E.error) h += `<p class="hint warn">No se ha podido consultar Google: ${esc(E.error)}</p>`;
  if (E.conf || !E.sitios.length) h += ebConfig();
  const sitios = E.sitios.map(s => Object.assign({ s }, E.datos[s.place_id] || {}));
  const con = sitios.filter(x => x.total != null && !x.error);
  if (E.sitios.length && con.length) {
    const tot = con.reduce((a, x) => a + (x.total || 0), 0);
    const media = tot ? con.reduce((a, x) => a + (x.nota || 0) * (x.total || 0), 0) / tot : null;
    const bajos = con.filter(x => x.nota != null && x.nota < 4).length, nuevas = ebNuevasTotal();
    h += `<div class="cl-kpis"><div class="oscuro"><small>Nota media</small><b>${ebNota(media)}</b><small>ponderada por número de reseñas</small></div>
      <div><small>Reseñas en Google</small><b>${tot.toLocaleString("es-ES")}</b><small>en ${con.length} ${con.length === 1 ? "sitio" : "sitios"}</small></div>
      <div class="${nuevas ? "nuevo" : ""}"><small>Nuevas</small><b>${nuevas}</b><small>${nuevas ? `desde ${M.visto ? new Date(M.visto).toLocaleDateString("es-ES") : "tu última revisión"}` : "nada nuevo desde tu última revisión"}</small>${nuevas ? `<button class="btn small" data-action="ebVistas">Marcar como vistas</button>` : ""}</div>
      <div><small>Por debajo de 4</small><b>${bajos}</b><small>${bajos === 1 ? "sitio" : "sitios"}</small></div></div>`;
    const filtro = { todas: () => true, nuevas: x => E.nuevas[x.id], bajas: x => (x.resenas || []).some(r => r.nota <= 3) }[E.ver] || (() => true);
    const lista = sitios.filter(x => !x.error && x.total != null && filtro(x))
      .sort((a, b) => (E.orden === "peor" ? (a.nota ?? 9) - (b.nota ?? 9) : E.orden === "mas" ? b.total - a.total : String(a.s.nombre).localeCompare(b.s.nombre, "es")));
    h += `<div class="eb-barra"><div class="imp-filtro">${[["todas", "Todos"], ["nuevas", "Con nuevas"], ["bajas", "Con reseñas de 3 o menos"]].map(([k, t]) => `<button class="${E.ver === k ? "on" : ""}" data-action="ebVer" data-v="${k}">${t}</button>`).join("")}</div>
      <label class="eb-orden">Ordenar<select data-ebord="1"><option value="peor" ${E.orden === "peor" ? "selected" : ""}>Peor nota primero</option><option value="mas" ${E.orden === "mas" ? "selected" : ""}>Más reseñas</option><option value="nombre" ${E.orden === "nombre" ? "selected" : ""}>Nombre</option></select></label>
      <span class="muted">${E.consultado ? "Consultado " + new Date(E.consultado).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span></div>`;
    h += lista.length ? `<div class="eb-lista">${lista.map(x => ebTarjeta(x, M)).join("")}</div>` : `<p class="empty">Nada con este filtro.</p>`;
    const err = sitios.filter(x => x.error);
    if (err.length) h += `<p class="hint warn">No se han podido leer ${err.length} ${err.length === 1 ? "sitio" : "sitios"}: ${err.map(x => esc(x.s.nombre)).join(", ")}. Revisa que sigan existiendo en Google.</p>`;
    h += `<p class="hint eb-atr">Datos y reseñas de Google Maps. Google solo deja mostrar aquí la nota, el total y hasta 5 reseñas de cada sitio; las nuevas se detectan porque sube el total. Para leerlas todas y responderlas hará falta el acceso de Google Business Profile.</p>`;
  } else if (E.sitios.length && E.cargando) h += `<p class="muted">Consultando Google…</p>`;
  else if (E.sitios.length && !E.error) h += `<div class="cl-vacio"><b>Sin consultar todavía</b><p>Pulsa «Actualizar» para leer las reseñas de Google.</p></div>`;
  $("vista").innerHTML = h + `</div>`;
}
function ebTarjeta(x, M) {
  const E = ebS(), visto = M.visto || "";
  const rs = (x.resenas || []).slice().sort((a, b) => ((a.fecha || "") < (b.fecha || "") ? 1 : -1));
  return `<section class="card eb-card"><div class="eb-card-h"><div><h2>${esc(x.s.nombre)}</h2><small class="muted">${esc(x.direccion || x.s.direccion || "")}</small></div>
      <div class="eb-nota"><b>${ebNota(x.nota)}</b>${ebEstrellas(x.nota)}<small>${(x.total || 0).toLocaleString("es-ES")} ${x.total === 1 ? "reseña" : "reseñas"}${E.nuevas[x.id] ? ` · <span class="eb-nueva">+${E.nuevas[x.id]} nuevas</span>` : ""}</small></div></div>
    ${rs.length ? `<ul class="eb-rs">${rs.map(r => `<li class="${r.nota <= 3 ? "baja" : ""}"><div class="eb-r-h">${ebEstrellas(r.nota)}
        ${r.autor ? (r.autor.uri ? `<a href="${esc(r.autor.uri)}" target="_blank" rel="noopener">${esc(r.autor.nombre || "Usuario de Google")}</a>` : `<span>${esc(r.autor.nombre || "Usuario de Google")}</span>`) : ""}
        <small>${esc(r.hace || "")}</small>${r.fecha && visto && r.fecha > visto ? `<span class="eb-nueva">Nueva</span>` : ""}</div>
        ${r.texto ? `<p>${esc(r.texto)}</p>` : `<p class="muted">Sin texto, solo la nota.</p>`}</li>`).join("")}</ul>` : `<p class="muted">Google no muestra reseñas con texto de este sitio.</p>`}
    ${x.enlace ? `<a class="btn small ghost" href="${esc(x.enlace)}" target="_blank" rel="noopener">Ver todas en Google Maps</a>` : ""}</section>`;
}
function ebConfig() {
  const E = ebS(), B = E.busca, ts = (S.todas && S.todas.length ? S.todas : S.tiendas) || [];
  const de = id => E.sitios.find(s => s.tienda_id === id);
  const otros = E.sitios.filter(s => !s.tienda_id);
  const res = para => (B && B.para === para ? `<div class="eb-res">${B.cargando ? `<p class="muted">Buscando en Google…</p>` : B.error ? `<p class="hint warn">${esc(B.error)}</p>`
    : B.res && B.res.length ? B.res.map(r => `<button class="eb-cand" data-action="ebVincular" data-pid="${esc(r.id)}" data-n="${esc(r.nombre || "")}" data-d="${esc(r.direccion || "")}"><b>${esc(r.nombre || "")}</b><small>${esc(r.direccion || "")}</small><span>Vincular</span></button>`).join("")
    : B.res ? `<p class="muted">Google no ha encontrado nada. Prueba con el nombre y la ciudad.</p>` : ""}</div>` : "");
  const buscador = (para, def) => `<div class="eb-busca"><input id="ebQ-${para}" value="${esc(B && B.para === para ? B.q : def)}" aria-label="Buscar en Google"><button class="btn small primary" data-action="ebBuscar" data-para="${para}">Buscar en Google</button><button class="btn small ghost" data-action="ebCancelar">Cancelar</button></div>${res(para)}`;
  return `<section class="card eb-conf"><div class="card-h"><h2>Sitios de Google</h2><span class="muted">${E.sitios.length} vinculados</span></div>
    <p class="hint" style="margin-top:0">Vincula cada tienda con su ficha de Google Maps, y añade la oficina u otros sitios. Solo se guarda el identificador de Google.</p>
    <div class="tablewrap"><table><thead><tr><th>Tienda</th><th>Ficha de Google</th><th></th></tr></thead><tbody>
    ${ts.map(t => { const s = de(t.id), abierto = B && B.para === t.id;
      return `<tr><td><b>${esc(t.nombre)}</b></td><td>${s ? `${esc(s.nombre)}<small class="pp-sub">${esc(s.direccion)}</small>` : `<span class="muted">Sin vincular</span>`}${abierto ? buscador(t.id, t.nombre) : ""}</td>
        <td class="n">${s ? `<button class="btn small ghost" data-action="ebQuitar" data-id="${s.id}">Quitar</button>` : abierto ? "" : `<button class="btn small" data-action="ebAbrirBusca" data-para="${t.id}" data-q="${esc(t.nombre)}">Buscar</button>`}</td></tr>`; }).join("")}
    </tbody></table></div>
    <h3 class="cl-h3">Oficina y otros sitios</h3>
    ${otros.length ? `<ul class="eb-otros">${otros.map(s => `<li><span><b>${esc(s.nombre)}</b><small class="pp-sub">${esc(s.direccion)}</small></span><button class="btn small ghost" data-action="ebQuitar" data-id="${s.id}">Quitar</button></li>`).join("")}</ul>` : ""}
    ${B && B.para === "otro" ? buscador("otro", "") : `<button class="btn small" data-action="ebAbrirBusca" data-para="otro" data-q="">Añadir un sitio</button>`}</section>`;
}
const ACCIONES_EB = {
  ebActualizar() { ebActualizar(false); return false; },
  ebConf() { const E = ebS(); E.conf = !E.conf; E.busca = null; },
  ebVer(b) { ebS().ver = b.dataset.v; },
  ebVistas() {
    const E = ebS(), M = ebMemoria(); M.cuentas = M.cuentas || {};
    Object.values(E.datos).forEach(x => { if (!x.error) M.cuentas[x.id] = x.total; });
    M.visto = E.consultado || new Date().toISOString(); ebGuardarMemoria(M); E.nuevas = {};
    if (typeof avRefrescar === "function") avRefrescar();
  },
  ebAbrirBusca(b) { ebS().busca = { para: b.dataset.para, q: b.dataset.q || "", res: null }; },
  ebCancelar() { ebS().busca = null; },
  async ebBuscar(b) {
    const E = ebS(), para = b.dataset.para, q = (($("ebQ-" + para) || {}).value || "").trim();
    E.busca = { para, q, res: null, cargando: true }; pintar();
    try {
      const { data, error } = await sb.functions.invoke("resenas", { body: { buscar: q } });
      let det = ""; if (error) { try { det = (await error.context.json()).error || ""; } catch (e) {} throw new Error(det || error.message); }
      E.busca = { para, q, res: data.sitios || [] };
    } catch (e) { E.busca = { para, q, res: null, error: (e.message === "FALTA_CLAVE" ? "Falta la clave de Google (secreto GOOGLE_PLACES_KEY en Supabase)." : "No se ha podido buscar: " + e.message) }; }
    pintar(); return false;
  },
  async ebVincular(b) {
    const E = ebS(), para = E.busca && E.busca.para; if (!para) return false;
    const t = para === "otro" ? null : ((S.todas && S.todas.length ? S.todas : S.tiendas) || []).find(x => x.id === para);
    const fila = { nombre: t ? t.nombre : (b.dataset.n || "Sitio"), tipo: t ? "tienda" : /oficina|sede|central/i.test(b.dataset.n || "") ? "oficina" : "otro", tienda_id: t ? t.id : null, place_id: b.dataset.pid, direccion: b.dataset.d || "" };
    const r = await sb.from("resenas_sitios").insert(fila).select().single();
    if (r.error) { avisar(/duplicate|unique/i.test(r.error.message || "") ? "Esa ficha de Google ya está vinculada." : "No se ha podido vincular: " + traducirError(r.error)); return false; }
    E.sitios.push(r.data); E.busca = null; log(`Ficha de Google vinculada: ${fila.nombre} (Employer Branding)`);
    toast("Vinculada"); ebActualizarUno(r.data.place_id);
  },
  async ebQuitar(b) {
    const E = ebS(), s = E.sitios.find(x => x.id === b.dataset.id); if (!s) return false;
    const ok = await confirmar({ titulo: `Quitar ${s.nombre}`, ok: "Quitar", texto: "Deja de consultarse en Google. Se puede volver a vincular cuando quieras." });
    if (!ok) return false;
    const r = await sb.from("resenas_sitios").delete().eq("id", s.id);
    if (r.error) { avisar(traducirError(r.error)); return false; }
    E.sitios = E.sitios.filter(x => x.id !== s.id); delete E.datos[s.place_id];
  }
};
/* Al vincular, se consulta solo ese sitio */
async function ebActualizarUno(pid) {
  const E = ebS();
  try {
    const { data } = await sb.functions.invoke("resenas", { body: { sitios: [pid] } });
    (data && data.sitios || []).forEach(x => { E.datos[x.id] = x; const M = ebMemoria(); M.cuentas = M.cuentas || {}; if (!x.error) M.cuentas[x.id] = x.total; ebGuardarMemoria(M); });
    E.consultado = E.consultado || (data && data.consultado);
  } catch (e) {}
  if (S.modulo === "employer") pintar();
}
document.addEventListener("change", e => { if (e.target && e.target.dataset && e.target.dataset.ebord) { ebS().orden = e.target.value; pintar(); } });
