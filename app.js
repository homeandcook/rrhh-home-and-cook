"use strict";
const APP_VERSION = "0.22.1";
/* Ítems del cualitativo que el evaluador ha desplegado a mano. Vive fuera
   del estado porque es preferencia de pantalla, no dato que guardar. */
const ITEMS_ABIERTOS = new Set();
let TODO_ABIERTO = false;
const C = SC.CONFIG, esc = SC.esc, K = window.APP_CONFIG || {};
let sb = null;
const S = {
  me: null, perfiles: [], tiendas: [], actividad: [],
  modulo: "inicio", indice: false, tab: "eval", equipoT: null, invT: null, fseg: null, curso: null, paso: null, chuleta: false, fam: 0, prod: null, busca: "", campanas: [], invitaciones: [], campana: null, vista: "recorrido", ui: { t: null, p: null, fase: "obj" },
  sucios: new Set(), guardando: false, errorGuardado: null,
  f: { per: "fy", rm: "", puesto: "", estado: "", orden: "bonus", dir: -1 }
};
const $ = id => document.getElementById(id);
const configurado = () => K.supabaseUrl && !/TU-PROYECTO/.test(K.supabaseUrl) && K.supabaseAnonKey && !/TU-CLAVE/.test(K.supabaseAnonKey);
const emailDe = u => (u.includes("@") ? u : u + "@" + (K.dominioUsuarios || "homeandcook.app")).trim().toLowerCase();
/* Dentro de claude.ai la plataforma corre en un artifact: ahí funciona el
   role play con IA y no se puede cambiar la dirección para entrar en modo
   demostración, así que el acceso de ejemplo se ofrece en la pantalla. */
const enClaude = () => !!(window.claude && window.claude.use);
const esAdmin = () => S.me && S.me.rol === "admin";
/* Retail Marketing Development: solo KPIs de negocio y mystery shopper de
   toda la red. El corte de verdad está en la base de datos (no puede leer
   la tabla de tiendas); esto solo evita enseñarle puertas cerradas. */
const esMarketing = () => S.me && S.me.rol === "marketing";
const MODULOS_MARKETING = ["pdc"];
const puedeVer = id => !esMarketing() || MODULOS_MARKETING.includes(id);
const nombreRol = () => (esAdmin() ? t("admin") : esMarketing() ? t("marketing") : t("rm"));
/* Confirmación en la propia página: confirm() del navegador no funciona en
   todos los sitios donde corre esto, y una acción que borra datos no puede
   depender de un diálogo que a veces devuelve "no" sin preguntar. */
function confirmar(o) {
  return new Promise(res => {
    const v = $("modalConf"); if (v) v.remove();
    document.body.insertAdjacentHTML("beforeend", `<div class="modal" id="modalConf"><div class="modal-c estrecho">
      <h2>${esc(o.titulo)}</h2><p class="conf-t">${esc(o.texto)}</p>
      ${o.escribe ? `<label class="conf-e"><span>Escribe <b>${esc(o.escribe)}</b> para confirmar</span><input id="confTxt" autocomplete="off" spellcheck="false"></label>` : ""}
      <div class="actions"><button class="btn" id="confNo">Cancelar</button>
      <button class="btn ${o.peligro ? "peligro" : "primary"}" id="confSi"${o.escribe ? " disabled" : ""}>${esc(o.ok || "Confirmar")}</button></div></div></div>`);
    const cerrar = x => { const m = $("modalConf"); if (m) m.remove(); document.removeEventListener("keydown", tecla, true); res(x); };
    const tecla = e => { if (e.key === "Escape") { e.stopPropagation(); cerrar(false); } };
    document.addEventListener("keydown", tecla, true);
    $("confNo").onclick = () => cerrar(false);
    $("confSi").onclick = () => cerrar(true);
    const c = $("confTxt");
    if (c) { c.oninput = () => { $("confSi").disabled = c.value.trim().toUpperCase() !== o.escribe.toUpperCase(); }; c.focus(); }
    else $("confSi").focus();
  });
}
function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("on"), 2800); }
function fechaES(iso) { return iso ? new Date(iso).toLocaleDateString("es-ES") : ""; }
function traducirError(e) {
  const m = (e && (e.message || e)) + "";
  if (/Invalid login/i.test(m)) return "Usuario o contraseña incorrectos.";
  if (/row-level security|permission|Sin permiso/i.test(m)) return "No tienes permiso para esta acción.";
  if (/duplicate|dup|unique/i.test(m)) return "Ya existe un registro con ese nombre de usuario.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "No hay conexión con el servidor. Revisa tu conexión y vuelve a intentarlo.";
  return m;
}

/* =================== Arranque y acceso =================== */
function arrancar() {
  const par = new URLSearchParams(location.search);
  const modoDemo = window.FORZAR_DEMO || par.has("demo");
  if (modoDemo || !configurado()) {
    if (!modoDemo) return pantallaSinConfig();
    sb = window.crearClienteDemo();
  } else if (!window.supabase || !window.supabase.createClient) {
    // La biblioteca de Supabase viene de un CDN. Si no carga (red caída, un
    // bloqueador, una red corporativa restrictiva) la aplicación se quedaba
    // en blanco sin decir nada. Ahora al menos se explica.
    return pantallaSinLibreria();
  } else {
    sb = window.supabase.createClient(K.supabaseUrl, K.supabaseAnonKey);
  }
  /* El enlace del correo lleva a la pantalla de acceso, nunca el código
     dentro. Quien recibe la invitación teclea el código: es lo único que
     demuestra que el correo le llegó a quien tenía que llegarle, y evita
     que un enlace reenviado abra la prueba de otra persona. */
  if (par.has("codigo")) return abrirInvitacion("");
  sb.auth.getSession().then(({ data }) => (data && data.session ? entrar() : pantallaLogin()));
}
function pantallaSinLibreria() {
  $("app").innerHTML = `<div class="login"><div class="login-wrap">
    ${panelMarca()}
    <div class="login-lado">
      ${selectorIdioma()}
      <div class="login-card">
        <h1>${t("bienvenida")}</h1>
        <p class="demo-note">No se ha podido cargar una pieza necesaria de la plataforma desde internet.
          Suele ser la red o un bloqueador del navegador. Vuelve a cargar la página; si sigue igual, prueba con otra red o avisa a RR.HH.</p>
        <button class="btn primary block" onclick="location.reload()">Volver a cargar</button>
        <p class="hint acc-pie"><a href="#" data-action="irDemo">Entrar con datos de ejemplo</a></p>
      </div>
      <p class="login-pie">${esc(t("unaPlataformaDe"))} · v${APP_VERSION}</p>
    </div>
  </div></div>`;
}
function pantallaSinConfig() {
  $("app").innerHTML = `<div class="login"><div class="login-wrap">
    ${panelMarca()}
    <div class="login-lado">
      ${selectorIdioma()}
      <div class="login-card">
        <h1>${t("bienvenida")}</h1>
        <p class="demo-note">La plataforma aún no está conectada a su base de datos: falta poner la URL del proyecto y la clave publicable en <code>config.js</code>. En el README está el paso a paso.</p>
        <a class="btn primary block" href="?demo">Probar en modo demostración</a>
      </div>
      <p class="login-pie">${esc(t("unaPlataformaDe"))} · v${APP_VERSION}</p>
    </div>
  </div></div>`;
}
function selectorIdioma() {
  return `<div class="langsel">${IDIOMAS.map(i => `<button class="${LANG === i.id ? "on" : ""}" data-action="idioma" data-l="${i.id}">${i.id.toUpperCase()}</button>`).join("")}</div>`;
}
function logo(px) { return `<img class="logo" src="${window.LOGO_SRC || "logo.png"}" width="${px}" height="${px}" alt="Home &amp; Cook Official Store">`; }
function panelMarca() {
  return `<div class="login-marca">
    <div class="lm-seb"><span class="chipseb">${logoSEB(30)}</span><span>${t("unaPlataformaDe")}</span></div>
    <div class="lm-centro">
      ${logo(132)}
      <div class="marcacaja">${marcaSVG("grande", 34)}</div>
      <p class="lm-lema">${t("lemaPanel")}</p>
    </div>
    ${bandaMarcas()}
  </div>`;
}
function pantallaLogin(msg) {
  let recordado = "";
  try { recordado = localStorage.getItem("sc-usuario") || ""; } catch (e) {}
  $("app").innerHTML = `<div class="login">
    <div class="login-wrap">
      ${panelMarca()}
      <div class="login-lado">
        ${selectorIdioma()}
        <form class="login-card" id="loginForm" autocomplete="on">
          <h1>${t("bienvenida")}</h1>
          <p class="sub">${t("subAcceso")}</p>
          ${sb.demo ? `<p class="demo-note">${t("demoAviso")}</p>` : ""}
          <label>${t("usuario")}<input id="lgUser" name="username" autocomplete="username" required ${recordado ? `value="${esc(recordado)}"` : "autofocus"}></label>
          <label>${t("contrasena")}
            <span class="campo-pass">
              <input id="lgPass" name="password" type="password" autocomplete="current-password" required ${recordado ? "autofocus" : ""}>
              <button type="button" class="ojo" id="lgOjo" aria-label="${t("verPass")}" aria-pressed="false">${ICO_OJO}</button>
            </span>
          </label>
          <label class="check"><input type="checkbox" id="lgRec" ${recordado ? "checked" : ""}><span>${t("recordarme")}</span></label>
          <p class="login-err" id="lgErr" role="alert">${esc(msg || "")}</p>
          <button class="btn primary block" type="submit" id="lgBtn">${t("entrar")}</button>
          <details class="olvido"><summary>${t("olvidePass")}</summary><p>${t("olvidePassTxt")}</p></details>
        </form>
        <div class="login-o"><span>${t("tengoCodigo")}</span></div>
        <a class="btn block" href="?codigo=">${t("botonCodigo")}</a>
        ${enClaude() && !sb.demo ? `<p class="hint acc-pie"><a href="#" data-action="irDemo">Entrar con datos de ejemplo</a></p>` : ""}
        <p class="hint acc-pie">${t("botonCodigoPie")}</p>
        <p class="login-pie">${esc(t("unaPlataformaDe"))} · v${APP_VERSION}</p>
      </div>
    </div>
  </div>`;
  (recordado ? $("lgPass") : $("lgUser")).focus();
  const ojo = $("lgOjo");
  ojo.addEventListener("click", () => {
    const p = $("lgPass"), ver = p.type === "password";
    p.type = ver ? "text" : "password";
    ojo.setAttribute("aria-pressed", ver ? "true" : "false");
    ojo.setAttribute("aria-label", ver ? t("ocultarPass") : t("verPass"));
    ojo.innerHTML = ver ? ICO_OJO_NO : ICO_OJO;
    p.focus();
  });
  $("loginForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const usuario = $("lgUser").value.trim();
    $("lgBtn").disabled = true; $("lgBtn").textContent = t("entrando"); $("lgErr").textContent = "";
    let error = null;
    try {
      const r = await sb.auth.signInWithPassword({ email: emailDe(usuario), password: $("lgPass").value });
      error = r.error;
    } catch (e) { error = e; }
    if (error) { $("lgErr").textContent = errorAcceso(error); $("lgBtn").disabled = false; $("lgBtn").textContent = t("entrar"); return; }
    try { if ($("lgRec").checked) localStorage.setItem("sc-usuario", usuario); else localStorage.removeItem("sc-usuario"); } catch (e) {}
    entrar();
  });
}
const ICO_OJO = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M1.8 12S5.4 5.2 12 5.2 22.2 12 22.2 12 18.6 18.8 12 18.8 1.8 12 1.8 12Z"/><circle cx="12" cy="12" r="3.1"/></svg>`;
const ICO_OJO_NO = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3.5 3.5l17 17"/><path d="M9.6 6A9.9 9.9 0 0 1 12 5.2c6.6 0 10.2 6.8 10.2 6.8a19 19 0 0 1-3.5 4.4"/><path d="M6.3 7.7A18.7 18.7 0 0 0 1.8 12S5.4 18.8 12 18.8a9.8 9.8 0 0 0 3.9-.8"/><path d="M9.9 9.9a3.1 3.1 0 0 0 4.3 4.3"/></svg>`;
function errorAcceso(e) {
  const m = (e && (e.message || e)) + "";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return t("sinRed");
  if (/Failed to fetch|NetworkError|Load failed|ERR_/i.test(m)) return t("servidorDormido");
  return traducirError(e);
}
async function entrar() {
  $("app").innerHTML = `<div class="loading">Cargando…</div>`;
  const { data: ses } = await sb.auth.getSession();
  const { data: me, error } = await sb.from("perfiles").select("*").eq("id", ses.session.user.id).maybeSingle();
  if (error) return pantallaLogin(traducirError(error));
  if (!me || !me.activo) { await sb.auth.signOut(); return pantallaLogin("Tu usuario no tiene acceso a la plataforma. Contacta con RR.HH."); }
  S.me = me; S.modulo = "inicio"; S.tab = "eval"; S.vista = "recorrido"; S.ui = { t: null, p: null, fase: "obj" };
  await recargar();
}
async function recargar() {
  if (esMarketing()) return recargarMarketing();
  const [t, p] = await Promise.all([
    sb.from("tiendas").select("*").eq("anio", C.anio).order("nombre"),
    sb.from("perfiles").select("*").order("nombre")
  ]);
  if (t.error) { toast(traducirError(t.error)); return; }
  S.tiendas = (t.data || []).map(desdeFila);
  S.perfiles = p.data || [S.me];
  await Promise.all([recargarPruebas(), cargarDocumentos()]);
  if (esAdmin()) { const a = await sb.from("actividad").select("*").order("fecha", { ascending: false }).limit(150); S.actividad = a.data || []; }
  if (!S.tiendas.some(x => x.id === S.ui.t)) S.ui.t = null;
  pintar();
}
/* Retail Marketing no puede leer la tabla de tiendas: pide solo los KPIs.
   Lo que llega no trae equipo ni evaluaciones, así que se rellenan vacíos
   para que el resto de la aplicación no tenga que preguntar por el rol. */
async function recargarMarketing() {
  const { data, error } = await sb.rpc("red_kpis", { p_anio: C.anio });
  if (error) { toast(traducirError(error)); return; }
  S.tiendas = (data || []).map(r => ({
    id: r.id, nombre: r.nombre, codigo: r.codigo, rm_id: null, version: 1,
    objetivos: { s1: {}, fy: {} }, resultados: { s1: {}, fy: {} },
    objetivosValidados: null, personas: [], equipo: [], kpis: r.kpis || {}
  }));
  S.perfiles = [S.me];
  await recargarPruebas();
  if (!S.tiendas.some(x => x.id === S.ui.t)) S.ui.t = null;
  if (!puedeVer(S.modulo) && S.modulo !== "inicio") S.modulo = "inicio";
  pintar();
}
async function salir() {
  if (S.sucios.size) await volcar();
  if (S.sucios.size && !confirm("Hay cambios sin guardar. ¿Salir igualmente?")) return;
  await sb.auth.signOut(); S.me = null; S.tiendas = []; pantallaLogin();
}

/* =================== Datos y guardado =================== */
function desdeFila(r) {
  const d = r.datos || {};
  return { id: r.id, rm_id: r.rm_id, version: r.version, actualizado: r.actualizado, nombre: r.nombre, codigo: r.codigo,
    objetivos: d.objetivos || { s1: {}, fy: {} }, resultados: d.resultados || { s1: {}, fy: {} },
    objetivosValidados: d.objetivosValidados || null, personas: d.personas || [], equipo: d.equipo || [], kpis: d.kpis || {}, bajas: d.bajas || [], prl: d.prl || {} };
}
function aDatos(t) { return { objetivos: t.objetivos, resultados: t.resultados, objetivosValidados: t.objetivosValidados, personas: t.personas, equipo: t.equipo || [], kpis: t.kpis || {}, bajas: t.bajas || [], prl: t.prl || {} }; }
function guardar(t) { t = t || tienda(); if (!t) return; S.sucios.add(t.id); pintarEstado(); clearTimeout(guardar.h); guardar.h = setTimeout(volcar, 700); }
async function volcar() {
  if (S.guardando) { clearTimeout(guardar.h); guardar.h = setTimeout(volcar, 400); return; }
  S.guardando = true; pintarEstado();
  for (const id of [...S.sucios]) {
    const t = S.tiendas.find(x => x.id === id); if (!t) { S.sucios.delete(id); continue; }
    S.sucios.delete(id);
    const { data, error } = await sb.from("tiendas").update({ nombre: t.nombre || "", codigo: t.codigo || "", datos: aDatos(t) })
      .eq("id", t.id).eq("version", t.version).select();
    if (error) { S.sucios.add(id); S.errorGuardado = traducirError(error); break; }
    if (!data || !data.length) {
      S.errorGuardado = null;
      alert(`Otra persona ha guardado cambios en ${t.nombre || "esta tienda"} mientras editabas. Se carga su versión; repite tu último cambio.`);
      const r = await sb.from("tiendas").select("*").eq("id", t.id).maybeSingle();
      if (r.data) Object.assign(t, desdeFila(r.data)); pintar(); continue;
    }
    t.version = data[0].version; t.actualizado = data[0].actualizado; S.errorGuardado = null;
  }
  S.guardando = false; pintarEstado();
}
function pintarEstado() {
  const el = $("estadoGuardado"); if (!el) return;
  if (S.errorGuardado) { el.innerHTML = `${t("sinGuardar")}: ${esc(S.errorGuardado)} <button class="btn small" data-action="reintentar">Reintentar</button>`; el.className = "saved bad"; return; }
  el.textContent = S.guardando || S.sucios.size ? t("guardando") : t("guardado");
  el.className = "saved" + (S.guardando || S.sucios.size ? " warn" : "");
}
function log(accion, t) { sb.from("actividad").insert({ accion, tienda_id: t ? t.id : null, usuario_id: S.me.id }).then(() => {}); }

/* =================== Utilidades de evaluación =================== */
const tienda = () => S.tiendas.find(t => t.id === S.ui.t);
const persona = t => t && t.personas.find(p => p.id === S.ui.p);
const perfil = id => S.perfiles.find(p => p.id === id);
const rmNombre = t => { const p = perfil(t.rm_id); return p ? p.nombre : (t.rm_id === S.me.id ? S.me.nombre : "Sin asignar"); };
function ev(p, per) { p.evals = p.evals || {}; return p.evals[per] = p.evals[per] || { val: {}, evid: {} }; }
function setPath(o, path, v) { const k = path.split("."); let x = o; for (let i = 0; i < k.length - 1; i++) x = x[k[i]] = x[k[i]] || {}; x[k[k.length - 1]] = v; }
function getPath(o, path) { return path.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o); }
function resultadosBloqueados(t, per) { return t.personas.some(p => p.evals && p.evals[per] && p.evals[per].cerrado); }
function bonusMax(p) { const b = C.bonus[p.puesto]; if (!b) return 0; const pr = SC.num(p.prorrata); return b.importe * (pr == null ? 1 : Math.min(Math.max(pr, 0), 100) / 100); }
function nivelFactor(f) { return f < 0.5 ? 0 : f < 1 ? 0.5 : f < 1.5 ? 1 : f < 2 ? 1.5 : 2; }
function inp(scope, path, val, attrs) { return `<input data-scope="${scope}" data-path="${path}" value="${esc(val == null ? "" : val)}" ${attrs || ""}>`; }
function autoGrow(el) { el.style.height = "auto"; el.style.height = el.scrollHeight + 2 + "px"; }

/* =================== Estructura =================== */
const MODULOS = [
  { id: "evaluacion", t: "Evaluación y Desarrollo", grupo: "activo",
    d: "Objetivos y bonus del Store Manager, mapa de talento de la red, y las encuestas de incorporación y de salida.",
    tabs: [["eval", "Scorecard"], ["consolidado", "Consolidado", true], ["talent", "Talent Matrix"],
           ["mapa", "Mapa 9-Box", true], ["onboarding", "Onboarding"], ["offboarding", "Offboarding"]] },
  { id: "prl", t: "PRL", grupo: "activo",
    d: "Salud y seguridad de la red: bajas y absentismo, formación y revisiones de prevención, y el clima de las tiendas, que es donde se ven los riesgos psicosociales.",
    tabs: [["bajas", "Bajas y absentismo"], ["prevencion", "Prevención"], ["clima", "Clima"]] },
  { id: "pdc", t: "People Data Centre", grupo: "activo",
    d: "El cuadro de mando de personas de la red: productividad, dotación por hora de apertura y ajuste de la plantilla al tráfico." },
  { id: "formacion", t: "Formaciones", grupo: "activo",
    d: "Cinco formaciones breves para el equipo de tienda, con test, y las pruebas situacionales de selección.",
    tabs: [["cursos", "Formaciones"], ["envios", "Enviar a tienda"], ["seguimiento", "Seguimiento"], ["psico", "Pruebas situacionales"]] },
  { id: "docs", t: "Process Book y Políticas", grupo: "activo",
    d: "Los procesos de tienda paso a paso y las normas que el equipo consulta a diario, en un solo sitio.",
    tabs: [["process", "Process Book"], ["politica", "Políticas"]] },
  { id: "hometime", t: "HomeTime", grupo: "externo", enlace: "hometime", d: "" }
];
/* Qué apartado y qué pestaña corresponden a cada cuestionario con código */
const TAB_TXT = { envios: "envios", seguimiento: "seguimiento", eval: "scorecard", consolidado: "consolidado", talent: "talent", mapa: "mapa",
  onboarding: "onboarding", offboarding: "offboarding", bajas: "bajas", prevencion: "prevencion",
  clima: "clima", cursos: "cursos", psico: "psico", process: "process", politica: "politica" };
const TAB_PRUEBA = { onboarding: ["evaluacion", "onboarding"], offboarding: ["evaluacion", "offboarding"],
                     clima: ["prl", "clima"], psico: ["formacion", "psico"], formacion: ["formacion", "envios"] };
/* Pestaña por defecto al entrar en un apartado */
function tabPorDefecto(id) {
  const m = MODULOS.find(x => x.id === id);
  if (!m || !m.tabs) return null;
  const t = m.tabs.filter(x => !x[2] || esAdmin());
  return (t[0] || [])[0];
}
/* La pestaña activa, siempre válida para el apartado en el que estamos */
function tabActual() {
  const m = modActual();
  if (!m || !m.tabs) return null;
  const ok = m.tabs.filter(x => !x[2] || esAdmin()).map(x => x[0]);
  return ok.includes(S.tab) ? S.tab : (S.tab = ok[0]);
}
function modActual() { return MODULOS.find(m => m.id === S.modulo); }
function pintar() {
  if (!S.me) return;
  const m = modActual();
  const tabs = m && m.tabs ? m.tabs.filter(x => !x[2] || esAdmin()) : [];
  $("app").innerHTML = `<header class="top">
      <button class="brand" data-action="inicio" title="${t("inicio")}">${logoSEB(36)}${marcaSVG("linea", 17)}</button>
      ${S.modulo !== "inicio" ? `<button class="atras" data-action="atras">← ${esc(etiquetaAtras())}</button>` : ""}
      ${m && !S.indice && etiquetaAtras() !== modTxt(m.id, 0) ? `<span class="modname">${esc(modTxt(m.id, 0))}</span>` : ""}
      ${tabs.length > 1 && !S.indice ? `<nav class="mainnav">${tabs.map(([id, t]) => `<button class="${tabActual() === id ? "on" : ""}" data-action="tab" data-v="${id}">${t}</button>`).join("")}</nav>` : ""}
      <div class="spacer"></div>
      <div class="busca-g"><input id="buscaGlobal" type="search" placeholder="Buscar tienda, persona o apartado" autocomplete="off" aria-label="Búsqueda rápida"><div id="buscaRes" hidden></div></div>
      <span id="estadoGuardado" class="saved"></span>
      ${selectorIdioma()}
      <details class="user"><summary>${esc(S.me.nombre)} <small>${nombreRol()}</small></summary>
        <div class="menu"><button data-action="inicio">${t("inicio")}</button>${esAdmin() ? `<button data-action="modulo" data-m="gestion">${t("gestionUsuarios")}</button>` : ""}<button data-action="miPassword">${t("cambiarPass")}</button><button data-action="salir">${t("salir")}</button></div></details>
    </header>
    ${sb.demo ? `<div class="demo-bar">${t("demoBarra")}</div>` : ""}
    <div id="vista"></div><div id="print"></div>`;
  pintarEstado();
  if (S.modulo === "gestion" && esAdmin()) return pintarGestion();
  if (S.indice && tabs.length > 1) return pintarIndice(m, tabs);
  const tab = tabActual();
  if (S.modulo === "evaluacion") {
    if (tab === "consolidado") return pintarConsolidado();
    if (tab === "mapa") return pintarMapaTalento();
    if (tab === "talent") return pintarModulo("talent", "Talent Matrix");
    if (tab === "onboarding" || tab === "offboarding") return pintarPruebas(tab);
    return pintarModulo("scorecard", "Scorecard Retail");
  }
  if (S.modulo === "prl") {
    if (tab === "bajas") return pintarBajas();
    if (tab === "clima") return pintarPruebas("clima");
    return pintarPrl();
  }
  if (S.modulo === "formacion") return tab === "psico" ? pintarPruebas("psico") : tab === "envios" ? pintarPruebas("formacion") : tab === "seguimiento" ? pintarSegForm() : pintarFormaciones();
  if (S.modulo === "docs") return pintarDocs(tab);
  if (S.modulo === "pdc") return pintarPDC();
  pintarInicio();
}
/* ============ Índice de apartado y navegación hacia atrás ============
   Al entrar en un apartado desde la portada se ve primero su índice: las
   mismas tarjetas, un nivel más abajo. Las pestañas de arriba siguen ahí
   para saltar directo, y "Atrás" sube un nivel cada vez.
   ==================================================================== */
function etiquetaAtras() {
  if (S.indice || S.modulo === "gestion") return t("inicio");
  const m = modActual();
  const n = m && m.tabs ? m.tabs.filter(x => !x[2] || esAdmin()).length : 0;
  return n > 1 ? modTxt(m.id, 0) : t("inicio");
}
function irAtras() {
  const m = modActual();
  const n = m && m.tabs ? m.tabs.filter(x => !x[2] || esAdmin()).length : 0;
  if (!S.indice && n > 1) { S.indice = true; S.campana = null; if (S.docs) { S.docs.sel = null; S.docs.edit = null; } }
  else { S.modulo = "inicio"; S.indice = false; }
  window.scrollTo(0, 0);
}
function resumenTab(id) {
  const campana = tipo => {
    const cs = (S.campanas || []).filter(c => c.tipo === tipo);
    if (!cs.length) return "Sin campañas todavía";
    const inv = (S.invitaciones || []).filter(i => cs.some(c => c.id === i.campana_id));
    if (!inv.length) return `${cs.length} ${cs.length === 1 ? "campaña" : "campañas"} · sin códigos`;
    return `${inv.filter(i => i.estado === "respondida").length} de ${inv.length} códigos respondidos`;
  };
  const personas = () => S.tiendas.reduce((a, t2) => a + t2.personas.length, 0);
  try {
    if (id === "eval") { const c = S.tiendas.reduce((a, t2) => a + t2.personas.filter(p => ((p.evals || {}).fy || {}).cerrado).length, 0); return `${c} de ${personas()} cierres anuales`; }
    if (id === "consolidado") return `${S.tiendas.length} ${S.tiendas.length === 1 ? "tienda" : "tiendas"} en una tabla`;
    if (id === "talent") { const f = S.tiendas.flatMap(t2 => t2.personas.map(p => SC.talent(t2, p))); return `${f.filter(x => x.cerrado).length} de ${f.length} fichas cerradas`; }
    if (id === "mapa") return `${personas()} ${personas() === 1 ? "persona" : "personas"} en la matriz`;
    if (id === "onboarding" || id === "offboarding" || id === "clima" || id === "psico") return campana(id);
    if (id === "bajas") { const a = SC.absentismo(S.tiendas, mesesDisponibles()); return a.tasa == null ? (a.procesos ? `${a.dias} días perdidos` : "Sin bajas registradas") : `${SC.fmt(a.tasa, 1)} % de absentismo`; }
    if (id === "prevencion") { const R = S.tiendas.map(resumenPrl), per = R.reduce((a, x) => a + x.personas, 0), ok = R.reduce((a, x) => a + x.alDia, 0); return per ? `${SC.pct(ok / per, 0)} con la formación al día` : "Sin personas dadas de alta"; }
    if (id === "cursos") { const n = typeof cursosCompletados === "function" ? cursosCompletados() : 0; return `${CURSOS.length} formaciones · ${n} ${n === 1 ? "completada" : "completadas"}`; }
    if (id === "process") return `${libro("process").items.length} procesos`;
    if (id === "politica") return `${libro("politica").items.length} fichas`;
  } catch (e) {}
  return "";
}
function pintarIndice(m, tabs) {
  const AV = typeof avisosHoy === "function" ? avisosHoy() : [];
  const pend = AV.reduce((a, x) => { if (x.nivel !== "info" && x.modulo === m.id && x.tab) a[x.tab] = (a[x.tab] || 0) + 1; return a; }, {});
  const tarjeta = ([id, et, soloHr]) => {
    const k = TAB_TXT[id], tit = k ? modTxt(k, 0) : et, des = k ? modTxt(k, 1) : "";
    return `<button class="mod" data-action="tab" data-v="${id}">
      <span class="mod-t">${esc(tit)}${pend[id] ? `<span class="mod-n">${pend[id]}</span>` : ""}${soloHr ? `<span class="badge">${t("soloRRHH")}</span>` : ""}</span>
      ${des ? `<span class="mod-d">${esc(des)}</span>` : ""}
      <span class="mod-f">${esc(resumenTab(id))}</span></button>`;
  };
  $("vista").innerHTML = `<div class="home idx">
    <div class="idx-h"><h1>${esc(modTxt(m.id, 0))}</h1><p>${esc(modTxt(m.id, 1))}</p></div>
    <div class="cards">${tabs.map(tarjeta).join("")}</div>
    ${bandaMarcas()}</div>`;
}
function pintarInicio() {
  const resumen = m => {
    if (m.grupo === "pendiente") return t("enPreparacion");
    if (m.id === "formacion") {
      const n = typeof cursosCompletados === "function" ? cursosCompletados() : 0;
      const cs = (S.campanas || []).filter(c => c.tipo === "psico");
      const inv = (S.invitaciones || []).filter(i => cs.some(c => c.id === i.campana_id));
      const pruebas = inv.length ? ` · ${inv.filter(i => i.estado === "respondida").length} de ${inv.length} pruebas` : "";
      return `${CURSOS.length} formaciones · ${n} ${n === 1 ? "completada" : "completadas"}${pruebas}`;
    }
    if (m.id === "docs") return `${libro("process").items.length} procesos · ${libro("politica").items.length} fichas de política`;
    if (m.id === "prl") {
      const a = SC.absentismo(S.tiendas, mesesDisponibles());
      const R = S.tiendas.map(resumenPrl), per = R.reduce((s2, x) => s2 + x.personas, 0), ok = R.reduce((s2, x) => s2 + x.alDia, 0);
      const abs = a.tasa == null ? (a.procesos ? `${a.dias} días perdidos` : "Sin bajas registradas") : `${SC.fmt(a.tasa, 1)} % de absentismo`;
      return per ? `${abs} · ${SC.pct(ok / per, 0)} con formación PRL al día` : abs;
    }
    if (m.id === "pdc") {
      const ms = mesesDisponibles(), k = ms.length ? SC.kpis(S.tiendas, ms) : null;
      return k && k.ventas ? `${SC.eur(k.ventas, 0)} en ${k.nTiendas} tiendas` : "Sin datos cargados todavía";
    }
    if (m.id === "evaluacion") {
      const cierres = S.tiendas.reduce((s2, t2) => s2 + t2.personas.filter(p => (p.evals || {}).fy && p.evals.fy.cerrado).length, 0);
      const total = S.tiendas.reduce((s2, t2) => s2 + t2.personas.length, 0);
      const fichas = S.tiendas.flatMap(t2 => t2.personas.map(p => SC.talent(t2, p)));
      return `${cierres} de ${total} cierres anuales · ${fichas.filter(x => x.cerrado).length} de ${fichas.length} fichas de talento`;
    }
    return "";
  };
  const AV = typeof avisosHoy === "function" ? avisosHoy() : [];
  const pend = AV.reduce((a, x) => { if (x.nivel !== "info") a[x.modulo] = (a[x.modulo] || 0) + 1; return a; }, {});
  const tarjeta = m => m.grupo === "externo"
    ? `<a class="mod externo" href="${esc((K.enlaces || {})[m.enlace] || "#")}" target="_blank" rel="noopener noreferrer">
        <span class="mod-t">${esc(modTxt(m.id, 0))}<span class="badge">${t("externo")}</span></span>
        <span class="mod-d">${esc(modTxt(m.id, 1))}</span>
        <span class="mod-f">${t("abrirEnPestana")} ↗</span></a>`
    : `<button class="mod ${m.grupo} m-${m.id}" data-action="modulo" data-m="${m.id}" ${m.grupo === "pendiente" ? "disabled" : ""}>
      <span class="mod-t">${esc(modTxt(m.id, 0))}${pend[m.id] ? `<span class="mod-n" title="${pend[m.id] === 1 ? "1 cosa pide atención" : pend[m.id] + " cosas piden atención"}">${pend[m.id]}</span>` : ""}${m.grupo === "destacado" ? `<span class="badge oro">${t("enDiseno")}</span>` : m.grupo === "pendiente" ? `<span class="badge">${t("pendiente")}</span>` : ""}</span>
      <span class="mod-d">${esc(modTxt(m.id, 1))}</span>
      ${m.kpis ? `<span class="mod-k">${m.kpis.map(k => `<i>${esc(k.t)}</i>`).join("")}</span>` : ""}
      <span class="mod-f">${esc(resumen(m))}</span></button>`;
  const visibles = MODULOS.filter(m => puedeVer(m.id));
  const enMarcha = visibles.filter(m => m.grupo !== "pendiente"), pendientes = visibles.filter(m => m.grupo === "pendiente");
  $("vista").innerHTML = `<div class="home">
    <div class="home-h">${logo(76)}<div class="home-txt">${marcaSVG("grande", 34)}
      <p>${t("homeIntro")} ${esAdmin() ? t("homeAdmin") : esMarketing() ? t("homeMk") : t("homeRM")}</p></div></div>
    ${bloqueHoy(AV)}
    <h2 class="grupo">${t("enMarcha")}</h2><div class="cards">${enMarcha.map(tarjeta).join("")}</div>
    ${esAdmin() ? `<button class="adminbar" data-action="modulo" data-m="gestion">
      <span class="adminbar-t"><b>${t("gestionUsuarios")}</b><small>${esc(modTxt("gestion", 1))}</small></span>
      <span class="adminbar-f">${S.perfiles.length} ${S.perfiles.length === 1 ? "usuario" : "usuarios"} · ${S.tiendas.length} ${S.tiendas.length === 1 ? "tienda" : "tiendas"} →</span></button>` : ""}
    ${pendientes.length ? `<h2 class="grupo">${t("enPreparacion")}</h2><div class="cards">${pendientes.map(tarjeta).join("")}</div>` : ""}
    ${bandaMarcas()}</div>`;
}
/* =================== Evaluaciones =================== */
function estadoTienda(t) {
  const f = per => {
    if (!t.personas.length) return "vacio";
    const st = t.personas.map(p => SC.calcular(t, p, per).estado);
    if (st.every(s => s === "cerrado")) return "cerrado";
    if (st.some(s => s !== "pendiente")) return "curso";
    return "pendiente";
  };
  return { obj: !!t.objetivosValidados, s1: f("s1"), fy: f("fy") };
}
function itemTienda(t) {
  const e = estadoTienda(t);
  return `<li class="${t.id === S.ui.t ? "on" : ""}"><button data-action="selTienda" data-id="${t.id}">
    <span class="sname">${esc(t.nombre || "Tienda sin nombre")}</span>
    <span class="phases"><span class="ph ${e.obj ? "cerrado" : "pendiente"}" title="Objetivos ${e.obj ? "validados" : "sin validar"}">Obj</span><span class="ph ${e.s1}" title="Seguimiento 6 meses">6m</span><span class="ph ${e.fy}" title="Cierre anual">Año</span></span></button>
    <ul class="people">${t.personas.map(p => `<li>${esc(p.nombre || "Sin nombre")} <small>${esc(p.puesto)}</small></li>`).join("")}</ul></li>`;
}
function pintarSide() {
  const el = $("side"); if (!el) return;
  let h = `<div class="side-h"><h2>${esAdmin() ? "Todas las tiendas" : "Mis tiendas"}</h2></div>`;
  if (!S.tiendas.length) h += `<p class="empty">${esAdmin() ? "Aún no hay tiendas. Créalas en Usuarios y tiendas." : "Todavía no tienes tiendas asignadas. RR.HH. te las asignará."}</p>`;
  if (esAdmin()) {
    const grupos = {}; S.tiendas.forEach(t => { const k = rmNombre(t); (grupos[k] = grupos[k] || []).push(t); });
    Object.keys(grupos).sort().forEach(g => { h += `<h3 class="grp">${esc(g)}</h3><ul class="stores">${grupos[g].map(itemTienda).join("")}</ul>`; });
  } else h += `<ul class="stores">${S.tiendas.map(itemTienda).join("")}</ul>`;
  h += `<div class="legend"><span><span class="ph cerrado"></span>cerrado</span><span><span class="ph curso"></span>en curso</span><span><span class="ph"></span>pendiente</span></div>`;
  el.innerHTML = h;
}
const FASES = [["obj", "1", "Objetivos"], ["s1", "2", "Seguimiento 6 meses"], ["fy", "3", "Cierre anual"], ["pdi", "4", "Desarrollo"]];
function pintarModulo(modulo, rotulo) {
  $("vista").innerHTML = `<div class="layout"><aside id="side"></aside><main id="main"></main></div>`;
  pintarSide();
  const m = $("main"), t = tienda();
  const cab = modulo === "scorecard" ? `<nav class="steps">${FASES.map(([id, n, txt]) => `<button class="step ${S.ui.fase === id ? "on" : ""}" data-action="fase" data-f="${id}" ${t ? "" : "disabled"}><b>${n}</b>${txt}</button>`).join("")}
    <button class="step aux ${S.ui.fase === "reglas" ? "on" : ""}" data-action="fase" data-f="reglas">Reglas de cálculo</button></nav>` : "";
  if (modulo === "scorecard" && S.ui.fase === "reglas") { m.innerHTML = cab + vistaReglas(); return; }
  if (!t) {
    m.innerHTML = cab + `<div class="empty big"><h1>${esc(rotulo || modActual().t)}</h1><p>${S.tiendas.length ? "Elige una tienda en la lista para trabajar en ella." : esAdmin() ? "Empieza creando los usuarios de los Regional Managers y sus tiendas." : "Cuando RR.HH. te asigne tiendas aparecerán aquí."}</p>
      ${esAdmin() && !S.tiendas.length ? `<button class="btn primary" data-action="modulo" data-m="gestion">Ir a Usuarios y tiendas</button>` : ""}</div>`;
    return;
  }
  // En pantallas estrechas el listado lateral de 21 tiendas tapaba el trabajo:
  // ahí se esconde y se cambia de tienda con este desplegable.
  const selMovil = `<label class="selmovil">Tienda<select data-action="selTiendaSel">${S.tiendas.map(x => `<option value="${x.id}" ${x.id === t.id ? "selected" : ""}>${esc(x.nombre || "Sin nombre")}</option>`).join("")}</select></label>`;
  const titulo = selMovil + `<h1 class="store">${esc(t.nombre || "Tienda sin nombre")}${t.codigo ? ` <small>${esc(t.codigo)}</small>` : ""}${esAdmin() ? ` <small>${esc(rmNombre(t))}</small>` : ""}</h1>`;
  const body = modulo === "talent" ? vistaTalent(t)
    : S.ui.fase === "obj" ? vistaObjetivos(t) : S.ui.fase === "pdi" ? vistaPDI(t) : vistaPeriodo(t, S.ui.fase);
  m.innerHTML = cab + titulo + body;
  pintarKPIs(); pintarTicket(); pintarTalTicket(); document.querySelectorAll("textarea").forEach(autoGrow);
}

function vistaObjetivos(t) {
  const bloq = !!t.objetivosValidados;
  let h = `<section class="card"><div class="card-h"><h2>Objetivos de la tienda</h2>
    ${bloq ? `<span class="badge ok">Validados el ${fechaES(t.objetivosValidados.fecha)}${t.objetivosValidados.por ? " por " + esc(t.objetivosValidados.por) : ""}</span>` : `<span class="badge">Sin validar</span>`}</div>
    <p class="hint">Se fijan a principio de año y son comunes a todo el equipo de la tienda. Introduce objetivo y resultado siempre en la misma unidad.</p>
    <fieldset ${bloq ? "disabled" : ""}><div class="tablewrap"><table class="kpi"><thead><tr><th>Indicador</th><th class="n">Peso</th><th class="n">Objetivo 6 meses</th><th class="n">Objetivo anual</th></tr></thead><tbody>`;
  C.kpis.forEach(k => {
    if (k.tipo === "inventario") h += `<tr><td>${esc(k.nombre)}<small>${esc(k.ayuda)}</small></td><td class="n">${SC.pct(k.peso, 0)}</td><td colspan="2" class="n muted">Escala fija, sin objetivo</td></tr>`;
    else h += `<tr><td>${esc(k.nombre)}<small>${esc(k.ayuda)}</small></td><td class="n">${SC.pct(k.peso, 0)}</td>
      <td class="n">${inp("t", "objetivos.s1." + k.id, getPath(t, "objetivos.s1." + k.id), 'inputmode="decimal" class="numin"')}</td>
      <td class="n">${inp("t", "objetivos.fy." + k.id, getPath(t, "objetivos.fy." + k.id), 'inputmode="decimal" class="numin"')}</td></tr>`;
  });
  h += `</tbody></table></div></fieldset><div class="actions">
    ${bloq ? `<button class="btn" data-action="editarObjetivos">Editar objetivos</button>`
           : `<button class="btn" data-action="copiarObjetivos">Copiar 6 meses a anual</button><button class="btn primary" data-action="validarObjetivos">Validar objetivos</button>`}</div></section>`;
  h += `<section class="card"><div class="card-h"><h2>Equipo evaluado</h2><button class="btn small" data-action="nuevaPersona">Añadir persona</button></div>`;
  if (!t.personas.length) h += `<p class="empty">Añade al Store Manager y, si lo hay, al Assistant Store Manager.</p>`;
  else {
    h += `<div class="tablewrap"><table class="people-t"><thead><tr><th>Nombre</th><th>Puesto</th><th class="n">% del año en el puesto</th><th class="n">Bonus máximo</th><th></th></tr></thead><tbody>`;
    t.personas.forEach(p => {
      const lock = Object.values(p.evals || {}).some(x => x && x.cerrado), dis = lock ? "disabled" : "";
      h += `<tr title="${lock ? "Tiene evaluaciones cerradas: reábrelas para cambiar estos datos" : ""}"><td>${inp("p:" + p.id, "nombre", p.nombre, 'placeholder="Nombre y apellidos" ' + dis)}</td>
        <td><select data-scope="p:${p.id}" data-path="puesto" ${dis}>${Object.entries(C.bonus).map(([k, b]) => `<option value="${k}" ${p.puesto === k ? "selected" : ""}>${esc(b.nombre)}</option>`).join("")}</select></td>
        <td class="n">${inp("p:" + p.id, "prorrata", p.prorrata == null ? 100 : p.prorrata, 'inputmode="decimal" class="numin short" ' + dis)}</td>
        <td class="n" id="bmax-${p.id}">${SC.eur(bonusMax(p), 0)}</td>
        <td class="n"><button class="btn small ghost" data-action="borrarPersona" data-id="${p.id}" ${dis}>Eliminar</button></td></tr>`;
    });
    h += `</tbody></table></div><p class="hint">Si alguien ha estado solo parte del año en el puesto, indica el % y el bonus se prorratea.</p>`;
  }
  return h + `</section>`;
}
function selectorPersonas(t) {
  if (!t.personas.length) return `<div class="empty"><p>Esta tienda no tiene personas a evaluar.</p><button class="btn primary" data-action="fase" data-f="obj">Añadirlas en Objetivos</button></div>`;
  if (!persona(t)) S.ui.p = t.personas[0].id;
  return `<div class="pills" role="tablist">${t.personas.map(p => `<button role="tab" aria-selected="${p.id === S.ui.p}" class="pill ${p.id === S.ui.p ? "on" : ""}" data-action="selPersona" data-id="${p.id}">${esc(p.nombre || "Sin nombre")}<small>${esc((C.bonus[p.puesto] || {}).nombre || p.puesto)}</small></button>`).join("")}</div>`;
}
function vistaPeriodo(t, per) {
  const P = C.periodos[per], bloqR = resultadosBloqueados(t, per);
  let h = "";
  if (!t.objetivosValidados) h += `<div class="notice">Los objetivos de esta tienda aún no están validados. Puedes adelantar el trabajo, pero no cerrar la evaluación.</div>`;
  h += `<section class="card"><div class="card-h"><h2>Resultados de tienda: ${P.corto.toLowerCase()}</h2>${bloqR ? `<span class="badge ok">Bloqueados</span>` : ""}</div>
    <p class="hint">${bloqR ? "Hay evaluaciones cerradas en este periodo. Para corregir un resultado, reabre esas evaluaciones." : "Comunes a todo el equipo de la tienda."}</p>
    <fieldset ${bloqR ? "disabled" : ""}><div class="tablewrap"><table class="kpi"><thead><tr><th>Indicador</th><th class="n">Peso</th><th class="n">Objetivo</th><th class="n">Conseguido</th><th class="n">Consecución</th><th class="n">Factor</th></tr></thead><tbody>`;
  C.kpis.forEach(k => {
    const o = getPath(t, `objetivos.${per}.${k.id}`);
    if (k.tipo === "inventario") h += `<tr><td>${esc(k.nombre)}<small>${esc(k.ayuda)}</small></td><td class="n">${SC.pct(k.peso, 0)}</td><td class="n muted">Escala fija</td>
      <td class="n inv"><label>Falta (€) ${inp("t", `resultados.${per}.invFalta`, getPath(t, `resultados.${per}.invFalta`), 'inputmode="decimal" class="numin"')}</label>
      <label>Venta (€) ${inp("t", `resultados.${per}.invVenta`, getPath(t, `resultados.${per}.invVenta`), 'inputmode="decimal" class="numin"')}</label></td>
      <td class="n" id="kc-${k.id}-p"></td><td class="n" id="kc-${k.id}-f"></td></tr>`;
    else h += `<tr><td>${esc(k.nombre)}<small>${esc(k.ayuda)}</small></td><td class="n">${SC.pct(k.peso, 0)}</td>
      <td class="n">${o == null || o === "" ? `<span class="muted">Sin objetivo</span>` : esc(o)}</td>
      <td class="n">${inp("t", `resultados.${per}.${k.id}`, getPath(t, `resultados.${per}.${k.id}`), 'inputmode="decimal" class="numin"')}</td>
      <td class="n" id="kc-${k.id}-p"></td><td class="n" id="kc-${k.id}-f"></td></tr>`;
  });
  h += `</tbody></table></div></fieldset></section>` + selectorPersonas(t);
  const p = persona(t); if (!p) return h;
  const e = ev(p, per), cerr = !!e.cerrado, sc = `e:${p.id}:${per}`;
  // Cada ítem es una fila: nombre, peso y la escala. La pregunta de ayuda y
  // el campo de evidencias viven plegados y solo se abren cuando hacen falta:
  // en las notas 0 y 2, donde la evidencia es obligatoria, si ya hay texto
  // escrito, o si se pulsa el botón de detalle. Antes estaban siempre a la
  // vista y eran el 60 % del alto de la pantalla.
  const total = C.bloques.reduce((s, b) => s + b.items.length, 0);
  const hechos = C.bloques.reduce((s, b) => s + b.items.filter(i => typeof e.val[i.id] === "number").length, 0);
  h += `<div class="evalgrid"><div><fieldset ${cerr ? "disabled" : ""}>
    <section class="card eval">
      <div class="eval-h">
        <div class="eval-t"><div><h2>Valoración cualitativa</h2>
          <small>${hechos} de ${total} valorados${hechos < total ? ` · faltan ${total - hechos}` : " · completo"}</small></div>
          <button type="button" class="btn small ghost" data-action="itemTodos">${TODO_ABIERTO ? "Ocultar preguntas" : "Ver las preguntas"}</button></div>
        <i class="prog" aria-hidden="true"><span style="width:${Math.round(hechos / total * 100)}%"></span></i>
      </div>`;
  C.bloques.forEach(b => {
    h += `<div class="blq"><span>${esc(b.nombre)}</span><i></i><span class="num">${SC.pct(b.items.reduce((s, i) => s + i.peso, 0), 0)}</span></div>`;
    b.items.forEach(i => {
      const v = e.val[i.id], txt = e.evid[i.id] || "";
      const obliga = v === 0 || v === 2;
      const abierto = TODO_ABIERTO || obliga || !!txt || ITEMS_ABIERTOS.has(i.id);
      h += `<div class="it ${typeof v === "number" ? "hecho" : ""} ${abierto ? "abierto" : ""}">
        <div class="it-h">
          <b>${esc(i.nombre)}</b><span class="w num">${SC.pct(i.peso, 0)}</span>
          <div class="scale" role="radiogroup" aria-label="${esc(i.nombre)}">${C.escala.map(s => `<button role="radio" aria-checked="${v === s.v}" class="lv lv${String(s.v).replace(".", "")} ${v === s.v ? "on" : ""}" data-action="valorar" data-i="${i.id}" data-v="${s.v}" title="${esc(s.t)}">${SC.fmt(s.v, s.v % 1 ? 1 : 0)}</button>`).join("")}</div>
          <button type="button" class="it-mas ${txt ? "lleno" : ""}" data-action="itemMas" data-i="${i.id}"
            title="${abierto ? "Ocultar" : "Ver"} la pregunta y las evidencias" aria-expanded="${abierto}">${txt ? "✎" : "＋"}</button>
        </div>
        <div class="it-body">
          ${i.guia ? `<p class="guia">${esc(i.guia)}</p>` : ""}
          ${typeof v === "number" ? `<p class="nivel">${esc(SC.nivel(v))}</p>` : ""}
          <textarea rows="2" data-scope="${sc}" data-path="evid.${i.id}" placeholder="Evidencias y ejemplos concretos${obliga ? " (obligatorio en 0 y 2)" : ""}">${esc(txt)}</textarea>
        </div></div>`;
    });
  });
  h += `</section>`;
  h += `<section class="card"><h2>Conversación</h2><div class="grid2">
    <label>Comentarios del evaluador<textarea rows="3" data-scope="${sc}" data-path="comentEvaluador">${esc(e.comentEvaluador || "")}</textarea></label>
    <label>Comentarios del evaluado<textarea rows="3" data-scope="${sc}" data-path="comentEvaluado">${esc(e.comentEvaluado || "")}</textarea></label>
    <label class="span2">Plan de mejora acordado<textarea rows="3" data-scope="${sc}" data-path="planMejora">${esc(e.planMejora || "")}</textarea></label>
    <label>Evaluador ${inp(sc, "evaluador", e.evaluador == null ? rmNombre(t) : e.evaluador)}</label>
    <label>Fecha de la reunión <input type="date" data-scope="${sc}" data-path="fecha" value="${esc(e.fecha || "")}"></label>
    </div></section></fieldset></div><aside class="ticket" id="ticket"></aside></div>`;
  return h;
}
function pintarTicket() {
  const t = tienda(), p = persona(t), el = $("ticket");
  if (!el || !t || !p || !C.periodos[S.ui.fase]) return;
  const per = S.ui.fase, r = SC.calcular(t, p, per), e = ev(p, per), P = C.periodos[per];
  let h = `<p class="t-per">${esc(P.nombre)}</p><p class="t-lbl">${esc(P.bonus)}</p>
    <p class="t-big num">${r.bonus == null ? "–" : SC.eur(r.bonus)}</p>
    <p class="t-sub num">de ${SC.eur(bonusMax(p), 0)} máximo${SC.num(p.prorrata) != null && SC.num(p.prorrata) !== 100 ? " (prorrateado)" : ""}</p>
    <dl class="t-rows num">
      <dt>Cualitativo <small>${r.nValorados}/${r.nItems} ítems</small></dt><dd>${SC.fmt(r.ptsCual, 3)} <small>/ ${SC.fmt(r.maxCual, 2)}</small><span>${SC.eur(r.bonusCual)}</span></dd>
      <dt>Cuantitativo <small>${r.kpis.filter(k => k.completo).length}/${r.kpis.length} KPIs</small></dt><dd>${SC.fmt(r.ptsCuant, 3)} <small>/ ${SC.fmt(r.maxCuant, 2)}</small><span>${SC.eur(r.bonusCuant)}</span></dd>
      <dt>Nota final</dt><dd class="nota">${SC.fmt(r.nota, 2)} <small>/ ${SC.fmt(r.notaMax, 0)}</small></dd></dl>`;
  if (r.alertas.length) h += `<ul class="alerts">${r.alertas.map(a => `<li class="${a.tipo}">${esc(a.t)}</li>`).join("")}</ul>`;
  if (e.cerrado) h += `<p class="closed">Cerrada el ${fechaES(e.cerrado.fecha)}${e.cerrado.por ? " por " + esc(e.cerrado.por) : ""}${r.modificadoTrasCierre ? ". Los resultados han cambiado desde el cierre." : ""}</p><button class="btn" data-action="reabrir">Reabrir evaluación</button>`;
  else h += `<button class="btn primary block" data-action="cerrar">Cerrar evaluación</button>`;
  el.innerHTML = h + `<button class="btn ghost block" data-action="imprimir">Imprimir informe</button>`;
}
function pintarKPIs() {
  const t = tienda(); if (!t || !C.periodos[S.ui.fase]) return;
  C.kpis.forEach(k => {
    const x = SC.calcKPI(k, (t.objetivos || {})[S.ui.fase], (t.resultados || {})[S.ui.fase]);
    const ep = $(`kc-${k.id}-p`), ef = $(`kc-${k.id}-f`); if (!ep) return;
    ep.textContent = x.completo ? SC.pct(x.pct, k.tipo === "inventario" ? 3 : 1) : "–";
    ef.innerHTML = x.completo ? `<span class="fac f${String(nivelFactor(x.factor)).replace(".", "")}">${SC.fmt(x.factor, 3)}</span>` : (x.error ? `<span class="err">Revisar</span>` : "–");
  });
}
function vistaPDI(t) {
  let h = selectorPersonas(t);
  const p = persona(t); if (!p) return h;
  const d = p.pdi = p.pdi || {}, sc = "p:" + p.id;
  const siNo = (path, v) => `<select data-scope="${sc}" data-path="${path}"><option value=""></option>${["Sí", "No"].map(o => `<option ${v === o ? "selected" : ""}>${o}</option>`).join("")}</select>`;
  return h + `<section class="card"><h2>Desarrollo</h2><div class="grid2">
    <label class="span2">¿Manifiesta deseos de evolución profesional? (cambio de tienda, puesto, participación en aperturas…)<textarea rows="3" data-scope="${sc}" data-path="pdi.evolucion">${esc(d.evolucion || "")}</textarea></label>
    <label>¿Interesado en movilidad geográfica?${siNo("pdi.movilidad", d.movilidad)}</label>
    <label>Zona preferida ${inp(sc, "pdi.zona", d.zona)}</label>
    <label>¿Desea entrevista con el HR Business Partner?${siNo("pdi.entrevistaHR", d.entrevistaHR)}</label></div></section>
    <section class="card"><h2>Valoración global anual</h2><div class="vg" role="radiogroup">
    ${C.valoracionGlobal.map(v => `<label class="vg-o ${d.valoracion === v.id ? "on" : ""}"><input type="radio" name="vg" data-scope="${sc}" data-path="pdi.valoracion" value="${v.id}" ${d.valoracion === v.id ? "checked" : ""}><b>${esc(v.t)}</b><small>${esc(v.d)}</small></label>`).join("")}</div></section>
    <section class="card"><h2>Planes de mejora</h2><p class="hint">Se recogen de cada evaluación. Edítalos en su fase.</p><div class="grid2">
    ${["s1", "fy"].map(per => `<div><h3>${C.periodos[per].nombre}</h3><p class="pre">${esc(((p.evals || {})[per] || {}).planMejora || "Sin plan registrado.")}</p></div>`).join("")}</div>
    <div class="actions"><button class="btn primary" data-action="imprimir">Imprimir informe</button></div></section>`;
}
function vistaReglas() {
  const modo = C.referenciaBonus === "maximo"
    ? `El importe de cada puesto es el <b>máximo</b>: se cobra entero con puntuación 2 en todo. Con todo "en línea" (1) se cobra la mitad.`
    : `El importe de cada puesto se cobra con todo "en línea" (1) y puede llegar al doble con puntuación 2.`;
  return `<section class="card prose"><h2>Cómo se calcula</h2>
  <p>La evaluación combina un bloque cualitativo (${SC.pct(C.pesoCualitativo, 0)}) y uno cuantitativo de tienda (${SC.pct(C.pesoCuantitativo, 0)}). Cada ítem y cada KPI se puntúa de 0 a ${C.puntuacionMaxima}.</p>
  <p><b>Puntos cualitativos</b> = ${SC.fmt(C.pesoCualitativo, 2)} × Σ(peso del ítem × valoración). <b>Puntos cuantitativos</b> = ${SC.fmt(C.pesoCuantitativo, 2)} × Σ(peso del KPI × factor).</p>
  <p>Si los puntos cualitativos no llegan a ${SC.fmt(C.umbralCualitativo, 2)}, o los cuantitativos a ${SC.fmt(C.umbralCuantitativo, 2)}, ese bloque no genera bonus (equivale a una media de 0,9).</p>
  <p><b>Bonus</b> = importe base × puntos de cada bloque. ${modo}</p>
  <p><b>Nota final</b> = (puntos cualitativos + cuantitativos) × ${C.multiplicadorNota}. Va de 0 a ${SC.fmt(C.puntuacionMaxima * C.multiplicadorNota, 0)}; 3 equivale a "en línea con las expectativas".</p>
  <p>El seguimiento de 6 meses calcula un bonus indicativo. Solo se liquida el del cierre anual.</p></section>
  <div class="grid2">
  <section class="card"><h2>Bonus por puesto</h2><table class="mini"><tbody>${Object.values(C.bonus).map(b => `<tr><td>${esc(b.nombre)}</td><td class="n">${SC.eur(b.importe, 0)}</td></tr>`).join("")}</tbody></table></section>
  <section class="card"><h2>Escala de valoración</h2><table class="mini"><tbody>${C.escala.map(s => `<tr><td class="n">${SC.fmt(s.v, 1)}</td><td>${esc(s.t)}</td></tr>`).join("")}</tbody></table></section>
  <section class="card"><h2>Escalado KPIs</h2><p class="hint">Consecución (conseguido / objetivo) desde la que se aplica cada factor.</p><table class="mini"><thead><tr><th class="n">Desde</th><th class="n">Factor</th></tr></thead><tbody>${C.escaladoKPI.map(([a, b]) => `<tr><td class="n">${SC.pct(a, 0)}</td><td class="n">${SC.fmt(b, 3)}</td></tr>`).join("")}</tbody></table></section>
  <section class="card"><h2>Escalado inventario</h2><p class="hint">Falta de inventario sobre venta desde la que se aplica cada factor.</p><table class="mini"><thead><tr><th class="n">Desde</th><th class="n">Factor</th></tr></thead><tbody>${C.escaladoInventario.map(([a, b]) => `<tr><td class="n">${SC.pct(a, 2)}</td><td class="n">${SC.fmt(b, 1)}</td></tr>`).join("")}</tbody></table>
  <h2 style="margin-top:18px">Pesos</h2><table class="mini"><tbody>${C.kpis.map(k => `<tr><td>${esc(k.nombre)}</td><td class="n">${SC.pct(k.peso, 0)}</td></tr>`).join("")}${SC.items().map(i => `<tr><td>${esc(i.nombre)}</td><td class="n">${SC.pct(i.peso, 0)}</td></tr>`).join("")}</tbody></table></section>
  </div><p class="hint">Versión de parámetros ${esc(C.version)}.</p>`;
}
function informe(t, p) {
  const bloque = per => {
    const r = SC.calcular(t, p, per), e = (p.evals || {})[per] || { val: {}, evid: {} };
    return `<h2>${esc(C.periodos[per].nombre)}${e.fecha ? " – " + fechaES(e.fecha) : ""}</h2>
    <table><thead><tr><th>Indicador</th><th>Objetivo</th><th>Consecución</th><th>Factor</th></tr></thead><tbody>
    ${r.kpis.map(k => `<tr><td>${esc(k.kpi.nombre)}</td><td>${k.kpi.tipo === "inventario" ? "Escala fija" : esc(getPath(t, `objetivos.${per}.${k.kpi.id}`) || "–")}</td><td>${k.completo ? SC.pct(k.pct, k.kpi.tipo === "inventario" ? 3 : 1) : "–"}</td><td>${k.completo ? SC.fmt(k.factor, 3) : "–"}</td></tr>`).join("")}</tbody></table>
    <table><thead><tr><th>Ítem cualitativo</th><th>Valoración</th><th>Evidencias</th></tr></thead><tbody>
    ${SC.items().map(i => `<tr><td>${esc(i.nombre)}</td><td>${typeof (e.val || {})[i.id] === "number" ? SC.fmt(e.val[i.id], 1) + " " + esc(SC.nivel(e.val[i.id])) : "–"}</td><td>${esc((e.evid || {})[i.id] || "")}</td></tr>`).join("")}</tbody></table>
    <p class="res">Puntos cualitativos ${r.cualCompleto ? SC.fmt(r.ptsCual, 3) : "–"}, cuantitativos ${r.cuantCompleto ? SC.fmt(r.ptsCuant, 3) : "–"}. Nota ${SC.fmt(r.nota, 2)} / ${SC.fmt(r.notaMax, 0)}. ${esc(C.periodos[per].bonus)}: <b>${SC.eur(r.bonus)}</b></p>
    ${e.comentEvaluador ? `<p><b>Evaluador:</b> ${esc(e.comentEvaluador)}</p>` : ""}${e.comentEvaluado ? `<p><b>Evaluado:</b> ${esc(e.comentEvaluado)}</p>` : ""}${e.planMejora ? `<p><b>Plan de mejora:</b> ${esc(e.planMejora)}</p>` : ""}`;
  };
  const d = p.pdi || {}, vg = C.valoracionGlobal.find(v => v.id === d.valoracion);
  return `<div class="pr-head">${logo(56)}<div><h1>Scorecard Retail ${C.anio}</h1><p class="meta">RR.HH. x Home &amp; Cook, Groupe SEB</p>
  <p class="meta">${esc(p.nombre)}, ${esc((C.bonus[p.puesto] || {}).nombre || p.puesto)}. Tienda ${esc(t.nombre)}. Regional Manager: ${esc(rmNombre(t))}.</p></div></div>
  ${bloque("s1")}${bloque("fy")}
  <h2>Desarrollo</h2><p><b>Evolución profesional:</b> ${esc(d.evolucion || "–")}</p>
  <p><b>Movilidad geográfica:</b> ${esc(d.movilidad || "–")}${d.zona ? " (" + esc(d.zona) + ")" : ""}. <b>Entrevista con HRBP:</b> ${esc(d.entrevistaHR || "–")}</p>
  <p><b>Valoración global:</b> ${vg ? esc(vg.t) : "–"}</p>
  <div class="firmas"><div>Firma del evaluador<br><br>${esc(rmNombre(t))}</div><div>Firma del evaluado<br><br>${esc(p.nombre)}</div></div>`;
}

/* =================== Consolidado (admin) =================== */
function filas() {
  const out = [];
  S.tiendas.forEach(t => t.personas.forEach(p => {
    const r = SC.calcular(t, p, S.f.per), e = (p.evals || {})[S.f.per] || {};
    const vals = SC.items().map(i => (e.val || {})[i.id]).filter(v => typeof v === "number");
    const rp = perfil(t.rm_id);
    out.push({ t, p, rm: rp ? rp.nombre : "Sin asignar", zona: rp ? rp.zona || "" : "", tienda: t.nombre, codigo: t.codigo || "", persona: p.nombre, puesto: p.puesto,
      prorrata: SC.num(p.prorrata) == null ? 100 : SC.num(p.prorrata), r, objetivos: !!t.objetivosValidados,
      altas: vals.length ? vals.filter(v => v >= 1.5).length / vals.length : null,
      mediaCual: r.cualCompleto ? r.sumCual : null, mediaCuant: r.cuantCompleto ? r.sumCuant : null,
      fecha: e.fecha || "", evaluador: e.evaluador || (rp ? rp.nombre : "") });
  }));
  return out;
}
function pintarConsolidado() {
  const f = S.f, todas = filas(), P = C.periodos[f.per];
  const rms = [...new Set(todas.map(x => x.rm))].sort();
  let rows = todas.filter(x => (!f.rm || x.rm === f.rm) && (!f.puesto || x.puesto === f.puesto) && (!f.estado || x.r.estado === f.estado));
  const key = { rm: x => x.rm, tienda: x => x.tienda, persona: x => x.persona, puesto: x => x.puesto, estado: x => x.r.estado, cual: x => x.r.ptsCual, cuant: x => x.r.ptsCuant, nota: x => x.r.nota ?? -1, bonus: x => x.r.bonus ?? -1 }[f.orden];
  rows.sort((a, b) => { const A = key(a), B = key(b); return (A > B ? 1 : A < B ? -1 : 0) * f.dir; });
  S.filasCsv = rows;
  const cerr = rows.filter(x => x.r.estado === "cerrado");
  const total = rows.reduce((s, x) => s + (x.r.bonus || 0), 0), totalCerr = cerr.reduce((s, x) => s + (x.r.bonus || 0), 0);
  const maxPosible = rows.reduce((s, x) => s + bonusMax(x.p), 0);
  const notas = rows.filter(x => x.r.nota != null);
  let h = `<div class="page"><div class="page-h"><h1>Consolidado</h1><button class="btn" data-action="csv">Exportar CSV para nómina</button></div>`;
  if (!todas.length) { $("vista").innerHTML = h + `<div class="empty big"><p>Todavía no hay personas evaluadas en ninguna tienda.</p></div></div>`; return; }
  h += `<div class="filters">
    <div class="seg">${Object.entries(C.periodos).map(([k, p]) => `<button class="${f.per === k ? "on" : ""}" data-action="per" data-v="${k}">${esc(p.nombre)}</button>`).join("")}</div>
    <label>Regional Manager<select data-f="rm"><option value="">Todos</option>${rms.map(r => `<option ${f.rm === r ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></label>
    <label>Puesto<select data-f="puesto"><option value="">Todos</option>${Object.entries(C.bonus).map(([k, b]) => `<option value="${k}" ${f.puesto === k ? "selected" : ""}>${esc(b.nombre)}</option>`).join("")}</select></label>
    <label>Estado<select data-f="estado"><option value="">Todos</option>${["cerrado", "completo", "en curso", "pendiente"].map(s => `<option ${f.estado === s ? "selected" : ""}>${s}</option>`).join("")}</select></label></div>
  <div class="kpis">
    <div><small>${esc(P.bonus)} (evaluaciones cerradas)</small><b>${SC.eur(totalCerr, 0)}</b><small>${SC.eur(total, 0)} contando las completas sin cerrar. Máximo posible ${SC.eur(maxPosible, 0)}</small></div>
    <div><small>Evaluaciones cerradas</small><b>${cerr.length} / ${rows.length}</b></div>
    <div><small>Nota media</small><b>${notas.length ? SC.fmt(notas.reduce((s, x) => s + x.r.nota, 0) / notas.length, 2) : "–"}</b><small>sobre ${SC.fmt(C.puntuacionMaxima * C.multiplicadorNota, 0)}</small></div>
    <div><small>Tiendas con objetivos sin validar</small><b>${S.tiendas.filter(t => !t.objetivosValidados).length}</b><small>de ${S.tiendas.length}</small></div></div>`;
  const base = todas.filter(x => (!f.puesto || x.puesto === f.puesto) && x.mediaCual != null);
  const glob = base.length ? base.reduce((s, x) => s + x.mediaCual, 0) / base.length : null;
  h += `<section class="card"><div class="card-h"><h2>Calibración entre Regional Managers</h2><span class="muted">${esc(P.nombre)}</span></div>
    <p class="hint">La parte cuantitativa sale de datos de tienda; la cualitativa depende del criterio de cada RM. Una media cualitativa que se separa 0,25 puntos o más de la media global merece una conversación de calibración.</p>
    <div class="tablewrap"><table><thead><tr><th>Regional Manager</th><th class="n">Evaluaciones con cualitativo completo</th><th class="n">Media cualitativa (0–2)</th><th class="n">Diferencia con la media</th><th class="n">% valoraciones 1,5 o 2</th><th class="n">Media factor cuantitativo</th><th class="n">Bonus medio</th></tr></thead><tbody>`;
  rms.forEach(rm => {
    const xs = base.filter(x => x.rm === rm);
    if (!xs.length) { h += `<tr><td>${esc(rm)}</td><td class="n">0</td><td colspan="5" class="muted">Sin evaluaciones cualitativas completas</td></tr>`; return; }
    const avg = (a, fn) => a.length ? a.reduce((s, x) => s + fn(x), 0) / a.length : null;
    const m = avg(xs, x => x.mediaCual), dv = m - glob;
    const mq = avg(xs.filter(x => x.mediaCuant != null), x => x.mediaCuant), mb = avg(xs.filter(x => x.r.bonus != null), x => x.r.bonus), ma = avg(xs.filter(x => x.altas != null), x => x.altas);
    h += `<tr><td>${esc(rm)}</td><td class="n">${xs.length}</td><td class="n">${SC.fmt(m, 2)}</td>
      <td class="n"><span class="dev ${dv > 0.005 ? "pos" : dv < -0.005 ? "neg" : ""} ${Math.abs(dv) >= 0.25 ? "alta" : ""}">${dv > 0 ? "+" : ""}${SC.fmt(dv, 2)}</span></td>
      <td class="n">${SC.pct(ma, 0)}</td><td class="n">${SC.fmt(mq, 2)}</td><td class="n">${SC.eur(mb, 0)}</td></tr>`;
  });
  h += `<tr><td><b>Media global</b></td><td class="n">${base.length}</td><td class="n"><b>${SC.fmt(glob, 2)}</b></td><td colspan="4"></td></tr></tbody></table></div></section>`;
  const th = (k, t, n) => `<th class="sort ${n ? "n" : ""}" data-action="orden" data-k="${k}">${t}${f.orden === k ? (f.dir < 0 ? " ↓" : " ↑") : ""}</th>`;
  h += `<section class="card"><div class="card-h"><h2>Detalle por persona</h2><span class="muted">${rows.length} personas</span></div><div class="tablewrap"><table><thead><tr>
    ${th("rm", "RM")}${th("tienda", "Tienda")}${th("persona", "Persona")}${th("puesto", "Puesto")}${th("estado", "Estado")}${th("cual", "Cualitativo", 1)}${th("cuant", "Cuantitativo", 1)}${th("nota", "Nota", 1)}${th("bonus", "Bonus", 1)}<th>Revisar</th></tr></thead><tbody>`;
  rows.forEach(x => {
    const fl = x.r.alertas.slice();
    if (x.r.modificadoTrasCierre) fl.push({ tipo: "error", t: "Los datos han cambiado después del cierre." });
    if (!x.objetivos) fl.push({ tipo: "aviso", t: "Objetivos sin validar." });
    if (x.prorrata !== 100) fl.push({ tipo: "aviso", t: "Prorrata " + SC.fmt(x.prorrata, 0) + " %." });
    h += `<tr class="click" data-action="abrirEval" data-t="${x.t.id}" data-p="${x.p.id}"><td>${esc(x.rm)}</td><td>${esc(x.tienda)}</td><td>${esc(x.persona)}</td><td>${esc(x.puesto)}</td>
      <td><span class="st ${x.r.estado.replace(" ", "")}">${esc(x.r.estado)}</span></td>
      <td class="n">${x.r.cualCompleto ? SC.fmt(x.r.ptsCual, 3) : "–"}</td><td class="n">${x.r.cuantCompleto ? SC.fmt(x.r.ptsCuant, 3) : "–"}</td>
      <td class="n">${SC.fmt(x.r.nota, 2)}</td><td class="n"><b>${SC.eur(x.r.bonus)}</b></td>
      <td>${fl.map(a => `<span class="flag ${a.tipo === "error" ? "e" : ""}">${esc(a.t)}</span>`).join("")}</td></tr>`;
  });
  $("vista").innerHTML = h + `</tbody></table></div></section></div>`;
}
function csv() {
  const rows = S.filasCsv || []; if (!rows.length) return;
  const d = (x, n) => x == null ? "" : SC.fmt(x, n).replace(/\./g, "");
  const cab = ["Año", "Periodo", "Regional Manager", "Zona", "Tienda", "Código", "Persona", "Puesto", "Prorrata %", "Estado", "Fecha reunión", "Evaluador", "Puntos cualitativos", "Puntos cuantitativos", "Nota", "Bonus cualitativo", "Bonus cuantitativo", "Bonus total"];
  const lin = rows.map(x => [C.anio, C.periodos[S.f.per].nombre, x.rm, x.zona, x.tienda, x.codigo, x.persona, (C.bonus[x.puesto] || {}).nombre || x.puesto, d(x.prorrata, 0), x.r.estado, x.fecha, x.evaluador,
    d(x.r.cualCompleto ? x.r.ptsCual : null, 3), d(x.r.cuantCompleto ? x.r.ptsCuant : null, 3), d(x.r.nota, 2), d(x.r.bonusCual, 2), d(x.r.bonusCuant, 2), d(x.r.bonus, 2)]);
  const q = v => { v = String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const txt = "\ufeff" + [cab, ...lin].map(r => r.map(q).join(";")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
  a.download = `scorecard_${C.anio}_${S.f.per === "fy" ? "anual" : "6meses"}_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
}

/* =================== Usuarios y tiendas (admin) =================== */
function pintarGestion() {
  const rms = S.perfiles.filter(p => p.rol === "rm");
  const nT = id => S.tiendas.filter(t => t.rm_id === id).length;
  let h = `<div class="page"><h1>Usuarios y tiendas</h1>
  <section class="card"><div class="card-h"><h2>Usuarios</h2></div>
  <div class="tablewrap"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Zona</th><th class="n">Tiendas</th><th>Acceso</th><th></th></tr></thead><tbody>
  ${S.perfiles.map(p => {
    const yo = p.id === S.me.id;
    return `<tr><td>${esc(p.nombre)}${yo ? " <small>(tú)</small>" : ""}</td><td><code>${esc(p.usuario)}</code></td>
      <td>${p.rol === "admin" ? "Administrador" : p.rol === "marketing" ? "Retail Marketing" : "Regional Manager"}</td>
      <td><input class="short2" data-perfil="${p.id}" data-campo="zona" value="${esc(p.zona || "")}" ${p.rol === "rm" ? "" : "disabled"}></td>
      <td class="n">${p.rol === "rm" ? nT(p.id) : ""}</td>
      <td>${yo ? `<span class="badge ok">Activo</span>` : `<button class="btn small ${p.activo ? "" : "danger"}" data-action="toggleActivo" data-id="${p.id}">${p.activo ? "Activo" : "Desactivado"}</button>`}</td>
      <td class="n">${yo ? "" : `<button class="btn small ghost" data-action="resetPass" data-id="${p.id}">Nueva contraseña</button>`}</td></tr>`;
  }).join("")}</tbody></table></div>
  <form class="inline-form" id="formUsuario"><h3>Añadir usuario</h3>
    <label>Nombre<input name="nombre" required placeholder="Nombre y apellidos"></label>
    <label>Usuario<input name="usuario" required placeholder="p. ej. rm.sur" pattern="[a-z0-9._-]{3,}" title="Minúsculas, números, punto, guion. Mínimo 3."></label>
    <label>Contraseña inicial<input name="password" required minlength="8" autocomplete="new-password"></label>
    <label>Rol<select name="rol"><option value="rm">Regional Manager</option><option value="marketing">Retail Marketing (solo KPIs y mystery)</option><option value="admin">Administrador</option></select></label>
    <label>Zona<input name="zona" placeholder="Opcional"></label>
    <button class="btn primary" type="submit">Crear usuario</button></form>
  <p class="hint">Comunica a cada persona su usuario y contraseña inicial; puede cambiarla desde su nombre, arriba a la derecha. Desactivar un usuario le corta el acceso sin borrar sus datos.</p></section>

  <section class="card"><div class="card-h"><h2>Tiendas ${C.anio}</h2></div>
  <div class="tablewrap"><table><thead><tr><th>Tienda</th><th>Código</th><th>Regional Manager</th><th class="n">Personas</th><th>Objetivos</th><th></th></tr></thead><tbody>
  ${S.tiendas.map(t => `<tr><td>${esc(t.nombre || "Sin nombre")}</td><td>${esc(t.codigo)}</td>
    <td><select data-asignar="${t.id}"><option value="">Sin asignar</option>${rms.map(r => `<option value="${r.id}" ${t.rm_id === r.id ? "selected" : ""}>${esc(r.nombre)}${r.activo ? "" : " (desactivado)"}</option>`).join("")}</select></td>
    <td class="n">${t.personas.length}</td><td>${t.objetivosValidados ? `<span class="badge ok">Validados</span>` : `<span class="badge">Pendientes</span>`}</td>
    <td class="n"><button class="btn small ghost" data-action="irTienda" data-id="${t.id}">Abrir</button><button class="btn small ghost danger" data-action="borrarTienda" data-id="${t.id}">Eliminar</button></td></tr>`).join("")}
  </tbody></table></div>
  <form class="inline-form" id="formTienda"><h3>Añadir tienda</h3>
    <label>Nombre<input name="nombre" required placeholder="p. ej. HC Málaga"></label>
    <label>Código<input name="codigo" placeholder="Opcional"></label>
    <label>Regional Manager<select name="rm_id"><option value="">Sin asignar</option>${rms.map(r => `<option value="${r.id}">${esc(r.nombre)}</option>`).join("")}</select></label>
    <button class="btn primary" type="submit">Crear tienda</button></form>
  ${faltanDeLaRed().length ? `<p class="hint" style="margin-top:14px">Faltan ${faltanDeLaRed().length} de las ${C.red.length} tiendas de la red.
    <button class="btn small" data-action="cargarRed">Crear las que faltan</button>
    Se crean sin asignar; después repartes con el desplegable de cada una.</p>` : ""}</section>

  ${bloqueEquipos()}

  <section class="card"><h2>Actividad reciente</h2><div class="tablewrap act"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr></thead><tbody>
  ${S.actividad.length ? S.actividad.map(a => `<tr><td class="num">${new Date(a.fecha).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</td><td>${esc((perfil(a.usuario_id) || {}).nombre || "–")}</td><td>${esc(a.accion)}</td></tr>`).join("") : `<tr><td colspan="3" class="muted">Sin actividad todavía.</td></tr>`}
  </tbody></table></div></section></div>`;
  $("vista").innerHTML = h;
  $("formUsuario").addEventListener("submit", crearUsuario);
  $("formTienda").addEventListener("submit", crearTienda);
  const fe = $("formEquipo"); if (fe) fe.addEventListener("submit", anadirAEquipo);
}
async function crearUsuario(ev) {
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  f.usuario = f.usuario.trim().toLowerCase();
  if (S.perfiles.some(p => p.usuario === f.usuario)) return alert("Ya existe un usuario con ese nombre.");
  const btn = ev.target.querySelector("button"); btn.disabled = true; btn.textContent = "Creando…";
  try {
    // Cliente aparte para no cerrar la sesión del administrador
    const cli = sb.demo ? sb : window.supabase.createClient(K.supabaseUrl, K.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false, storageKey: "sc-alta-" + Date.now() } });
    const { data, error } = await cli.auth.signUp({ email: emailDe(f.usuario), password: f.password });
    if (error) throw error;
    if (!data.user || (data.user.identities && !data.user.identities.length)) throw new Error("Ese usuario ya existe en el sistema de acceso.");
    const r = await sb.from("perfiles").insert({ id: data.user.id, usuario: f.usuario, nombre: f.nombre.trim(), rol: f.rol, zona: f.zona.trim() || null });
    if (r.error) throw r.error;
    log(`Alta de usuario ${f.usuario} (${f.rol})`); toast("Usuario creado");
    await recargar();
  } catch (e) { alert("No se ha podido crear el usuario: " + traducirError(e)); btn.disabled = false; btn.textContent = "Crear usuario"; }
}
async function crearTienda(ev) {
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  const { error } = await sb.from("tiendas").insert({ anio: C.anio, nombre: f.nombre.trim(), codigo: f.codigo.trim(), rm_id: f.rm_id || null,
    datos: { objetivos: { s1: {}, fy: {} }, resultados: { s1: {}, fy: {} }, objetivosValidados: null, personas: [] } });
  if (error) return alert("No se ha podido crear la tienda: " + traducirError(error));
  log(`Alta de tienda ${f.nombre}`); toast("Tienda creada"); await recargar();
}
/* Las tiendas de la red (engine.js, CONFIG.red) que aún no existen este año.
   Se compara por código, que es lo único estable: el nombre puede cambiar. */
function faltanDeLaRed() {
  const hay = new Set(S.tiendas.map(t => (t.codigo || "").trim().toUpperCase()).filter(Boolean));
  return C.red.filter(x => !hay.has(x.codigo));
}
async function cargarRedDeTiendas() {
  const faltan = faltanDeLaRed();
  if (!faltan.length) return toast("Ya están las 21 tiendas de la red.");
  if (!confirm(`Se van a crear ${faltan.length} tiendas de ${C.anio}, sin asignar a ningún Regional Manager. ¿Seguimos?`)) return false;
  const filas = faltan.map(x => ({ anio: C.anio, nombre: x.nombre, codigo: x.codigo, rm_id: null,
    datos: { objetivos: { s1: {}, fy: {} }, resultados: { s1: {}, fy: {} }, objetivosValidados: null, personas: [] } }));
  const { error } = await sb.from("tiendas").insert(filas);
  if (error) return alert("No se han podido crear las tiendas: " + traducirError(error));
  log(`Alta de ${faltan.length} tiendas de la red`); toast(`${faltan.length} tiendas creadas`); await recargar();
}

/* =================== Eventos =================== */
function scopeObj(scope) {
  const t = tienda(); if (scope === "t") return t;
  const [k, id, per] = scope.split(":"), p = t && t.personas.find(x => x.id === id);
  if (k === "p") return p;
  if (k === "tal") return p && talFicha(p);
  if (k === "e") return p && ev(p, per);
}
document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "buscaProd") { S.busca = el.value; S.prod = null; const foco = el.selectionStart; pintar();
    const n = $("buscaProd"); if (n) { n.focus(); n.setSelectionRange(foco, foco); } return; }
  if (!el.dataset.scope) return;
  const o = scopeObj(el.dataset.scope); if (!o) return;
  setPath(o, el.dataset.path, el.value);
  if (el.tagName === "TEXTAREA") autoGrow(el);
  guardar();
  pintarKPIs(); pintarTicket(); pintarTalTicket(); pintarSide();
  const t = tienda();
  if (el.dataset.scope.startsWith("p:")) { const p = t.personas.find(x => x.id === el.dataset.scope.slice(2)), b = $("bmax-" + el.dataset.scope.slice(2)); if (p && b) b.textContent = SC.eur(bonusMax(p), 0); }
});
document.addEventListener("change", async e => {
  const el = e.target;
  if (el.dataset.scope && (el.type === "radio" || el.tagName === "SELECT")) { pintar(); return; }
  if (el.dataset.action === "equipoTienda") { S.equipoT = el.value; pintarGestion(); return; }
  if (el.dataset.action === "invTienda") { S.invT = el.value; pintar(); return; }
  if (el.dataset.eq !== undefined) {
    const t = S.tiendas.find(x => x.id === S.equipoT), p = t && equipoDe(t)[Number(el.dataset.eq)];
    if (!p) return;
    p[el.dataset.campo] = el.dataset.campo === "email" ? el.value.trim().toLowerCase() : el.value;
    guardar(t); return;
  }
  if (el.dataset.seg) { filtroSeg()[el.dataset.seg] = el.value; pintarSegForm(); return; }
  if (el.dataset.pdc) { filtroPDC()[el.dataset.pdc] = el.value; pintarPDC(); return; }
  if (el.dataset.bajas) { filtroBajas()[el.dataset.bajas] = el.value; pintarBajas(); return; }
  if (el.dataset.action === "selTiendaSel") { S.ui.t = el.value; S.ui.p = null; pintar(); return; }
  if (el.dataset.alta) { if (el.value) cerrarBaja(el.dataset.alta, el.value); return; }
  if (el.dataset.f) { S.f[el.dataset.f] = el.value; S.tab === "mapa" ? pintarMapaTalento() : pintarConsolidado(); return; }
  if (el.dataset.asignar) {
    const t = S.tiendas.find(x => x.id === el.dataset.asignar);
    const { error } = await sb.from("tiendas").update({ rm_id: el.value || null }).eq("id", t.id).select();
    if (error) { alert(traducirError(error)); return recargar(); }
    log(`Tienda ${t.nombre} asignada a ${(perfil(el.value) || {}).nombre || "nadie"}`, t); toast("Asignación guardada"); await recargar();
  }
  if (el.dataset.perfil) {
    const { error } = await sb.from("perfiles").update({ [el.dataset.campo]: el.value || null }).eq("id", el.dataset.perfil);
    if (error) alert(traducirError(error)); else { toast("Guardado"); await recargar(); }
  }
});
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-action]"); if (!b || b.disabled) return;
  const a = b.dataset.action;
  if (a === "idioma" && !S.me) { e.preventDefault(); setLang(b.dataset.l); if (typeof INV !== "undefined" && (INV.datos || INV.codigo !== undefined && document.querySelector(".guest"))) pintarInvitado(); else pantallaLogin(); return; }
  if (typeof ACCIONES_INVITADO !== "undefined" && ACCIONES_INVITADO[a]) { e.preventDefault(); await ACCIONES_INVITADO[a](b); return; }
  if (a === "irDemo") { e.preventDefault(); sb = window.crearClienteDemo(); pantallaLogin(); return; }
  if (!S.me) return;
  const t = tienda();
  const nombreYo = S.me.nombre;
  const acciones = Object.assign({
    idioma() { setLang(b.dataset.l); },
    inicio() { S.modulo = "inicio"; S.indice = false; b.closest("details") && (b.closest("details").open = false); },
    modulo() {
      if (!puedeVer(b.dataset.m)) return false;
      S.modulo = b.dataset.m; S.campana = null;
      if (S.docs) { S.docs.sel = null; S.docs.edit = null; S.docs.busca = ""; }
      S.tab = tabPorDefecto(S.modulo);
      const mm = MODULOS.find(x => x.id === S.modulo);
      S.indice = !!(mm && mm.tabs && mm.tabs.filter(x => !x[2] || esAdmin()).length > 1);
      if (S.modulo === "formacion") { S.curso = null; S.chuleta = false; S.vista = "recorrido"; }
      if (S.modulo === "evaluacion") S.ui.fase = "obj";
      b.closest("details") && (b.closest("details").open = false);
    },
    atras() { irAtras(); },
    tab() {
      S.tab = b.dataset.v; S.indice = false; S.campana = null;
      if (S.modulo === "evaluacion") S.ui.fase = S.tab === "talent" ? "talent" : (S.ui.fase === "talent" ? "obj" : S.ui.fase);
      if (S.modulo === "formacion") { S.curso = null; S.chuleta = false; S.vista = "recorrido"; }
      if (S.docs) { S.docs.sel = null; S.docs.edit = null; S.docs.busca = ""; }
      window.scrollTo(0, 0);
    },
    salir() { salir(); return false; },
    reintentar() { S.errorGuardado = null; volcar(); return false; },
    async miPassword() {
      b.closest("details").open = false;
      const p1 = prompt("Nueva contraseña (mínimo 8 caracteres):"); if (p1 == null) return false;
      if (p1.length < 8) { alert("La contraseña debe tener al menos 8 caracteres."); return false; }
      if (prompt("Repite la nueva contraseña:") !== p1) { alert("Las contraseñas no coinciden."); return false; }
      const { error } = await sb.auth.updateUser({ password: p1 });
      alert(error ? "No se ha podido cambiar: " + traducirError(error) : "Contraseña cambiada."); return false;
    },
    selTienda() { S.ui.t = b.dataset.id; S.ui.p = null; if (S.ui.fase === "reglas") S.ui.fase = "obj"; },
    irTienda() { S.modulo = "evaluacion"; S.tab = "eval"; S.ui.t = b.dataset.id; S.ui.p = null; S.ui.fase = "obj"; },
    abrirEval() { S.modulo = "evaluacion"; S.tab = "eval"; S.ui.t = b.dataset.t; S.ui.p = b.dataset.p; S.ui.fase = S.f.per; },
    fase() { S.ui.fase = b.dataset.f; },
    selPersona() { S.ui.p = b.dataset.id; },
    nuevaPersona() { const np = { id: SC.uid(), nombre: "", puesto: t.personas.some(p => p.puesto === "SM") ? "ASM" : "SM", prorrata: 100, evals: {}, pdi: {} }; t.personas.push(np); S.ui.p = np.id; guardar(t); },
    borrarPersona() { const p = t.personas.find(x => x.id === b.dataset.id); if (!confirm(`¿Eliminar a ${p.nombre || "esta persona"} y sus evaluaciones?`)) return false; t.personas = t.personas.filter(x => x !== p); log(`Baja de una persona en ${t.nombre}`, t); guardar(t); },
    copiarObjetivos() { t.objetivos.fy = Object.assign({}, t.objetivos.fy, t.objetivos.s1); guardar(t); toast("Objetivos anuales copiados del seguimiento de 6 meses"); },
    validarObjetivos() {
      const falta = C.kpis.filter(k => k.tipo !== "inventario").filter(k => ["s1", "fy"].some(per => { const v = SC.num(getPath(t, `objetivos.${per}.${k.id}`)); return v == null || v <= 0; }));
      if (falta.length) { alert("Faltan objetivos válidos en: " + falta.map(k => k.nombre).join(", ") + "."); return false; }
      t.objetivosValidados = { fecha: new Date().toISOString(), por: nombreYo }; log(`Objetivos validados en ${t.nombre}`, t); guardar(t); toast("Objetivos validados");
    },
    editarObjetivos() {
      if (resultadosBloqueados(t, "s1") || resultadosBloqueados(t, "fy")) { alert("Hay evaluaciones cerradas en esta tienda. Reábrelas antes de cambiar objetivos."); return false; }
      if (!confirm("Los objetivos quedarán sin validar hasta que los vuelvas a validar. El cambio queda registrado.")) return false;
      t.objetivosValidados = null; log(`Objetivos reabiertos en ${t.nombre}`, t); guardar(t);
    },
    valorar() { const e2 = ev(persona(t), S.ui.fase), v = Number(b.dataset.v); if (e2.val[b.dataset.i] === v) delete e2.val[b.dataset.i]; else e2.val[b.dataset.i] = v; guardar(t); },
    itemMas() { const i = b.dataset.i; ITEMS_ABIERTOS.has(i) ? ITEMS_ABIERTOS.delete(i) : ITEMS_ABIERTOS.add(i); },
    itemTodos() { TODO_ABIERTO = !TODO_ABIERTO; ITEMS_ABIERTOS.clear(); },
    cerrar() {
      const p = persona(t), per = S.ui.fase, e2 = ev(p, per), r = SC.calcular(t, p, per), faltan = [];
      if (!t.objetivosValidados) faltan.push("validar los objetivos de la tienda");
      if (!p.nombre) faltan.push("el nombre de la persona");
      if (!r.cuantCompleto) faltan.push("los resultados de tienda");
      if (!r.cualCompleto) faltan.push(`${r.nItems - r.nValorados} valoraciones cualitativas`);
      if (!(e2.evaluador == null ? rmNombre(t) : e2.evaluador)) faltan.push("el nombre del evaluador");
      if (!e2.fecha) faltan.push("la fecha de la reunión");
      if (r.alertas.some(x => x.tipo === "error")) faltan.push("corregir los errores señalados");
      if (faltan.length) { alert("Para cerrar falta: " + faltan.join(", ") + "."); return false; }
      if (r.alertas.some(x => /sin evidencia/.test(x.t)) && !confirm("Hay valoraciones extremas sin evidencia. ¿Cerrar igualmente?")) return false;
      if (e2.evaluador == null) e2.evaluador = rmNombre(t);
      e2.cerrado = { fecha: new Date().toISOString(), por: nombreYo, nota: r.nota, bonus: r.bonus, ptsCual: r.ptsCual, ptsCuant: r.ptsCuant };
      log(`Cierre ${C.periodos[per].corto} de ${p.nombre} (${t.nombre}): ${SC.eur(r.bonus)}`, t); guardar(t); toast("Evaluación cerrada");
    },
    reabrir() { const p = persona(t), e2 = ev(p, S.ui.fase); if (!confirm("La evaluación volverá a ser editable. La reapertura queda registrada.")) return false; log(`Reapertura ${C.periodos[S.ui.fase].corto} de ${p.nombre} (${t.nombre})`, t); delete e2.cerrado; guardar(t); },
    imprimir() { $("print").innerHTML = informe(t, persona(t)); window.print(); return false; },
    per() { S.f.per = b.dataset.v; },
    orden() { if (S.f.orden === b.dataset.k) S.f.dir *= -1; else { S.f.orden = b.dataset.k; S.f.dir = ["bonus", "nota", "cual", "cuant"].includes(b.dataset.k) ? -1 : 1; } },
    csv() { csv(); return false; },
    async toggleActivo() {
      const p = perfil(b.dataset.id);
      if (p.activo && !confirm(`¿Desactivar a ${p.nombre}? No podrá entrar hasta que lo reactives. Sus tiendas y datos se conservan.`)) return false;
      const { error } = await sb.from("perfiles").update({ activo: !p.activo }).eq("id", p.id);
      if (error) { alert(traducirError(error)); return false; }
      log(`${p.activo ? "Desactivado" : "Reactivado"} el usuario ${p.usuario}`); await recargar(); return false;
    },
    async resetPass() {
      const p = perfil(b.dataset.id), pw = prompt(`Nueva contraseña para ${p.nombre} (mínimo 8 caracteres):`);
      if (pw == null) return false;
      const { error } = await sb.rpc("admin_cambiar_password", { p_usuario: p.id, p_password: pw });
      alert(error ? "No se ha podido cambiar: " + traducirError(error) : `Contraseña de ${p.nombre} cambiada. Comunícasela por un canal seguro.`);
      if (!error) log(`Contraseña restablecida para ${p.usuario}`);
      return false;
    },
    async cargarRed() { if (!esAdmin()) return false; return cargarRedDeTiendas(); },
    async borrarTienda() {
      const x = S.tiendas.find(y => y.id === b.dataset.id);
      if (!confirm(`¿Eliminar ${x.nombre} y todas sus evaluaciones de ${C.anio}? No se puede deshacer.`)) return false;
      const { error } = await sb.from("tiendas").delete().eq("id", x.id);
      if (error) { alert(traducirError(error)); return false; }
      log(`Baja de tienda ${x.nombre}`); await recargar(); return false;
    }
  }, typeof ACCIONES_TALENT === "undefined" ? {} : ACCIONES_TALENT, typeof ACCIONES_PRUEBAS === "undefined" ? {} : ACCIONES_PRUEBAS, typeof ACCIONES_PDC === "undefined" ? {} : ACCIONES_PDC, typeof ACCIONES_BAJAS === "undefined" ? {} : ACCIONES_BAJAS, typeof ACCIONES_FORMACION === "undefined" ? {} : ACCIONES_FORMACION, typeof ACCIONES_RP === "undefined" ? {} : ACCIONES_RP, typeof ACCIONES_ARC === "undefined" ? {} : ACCIONES_ARC, typeof ACCIONES_DOCS === "undefined" ? {} : ACCIONES_DOCS, typeof ACCIONES_PRL === "undefined" ? {} : ACCIONES_PRL, typeof ACCIONES_HOY === "undefined" ? {} : ACCIONES_HOY, typeof ACCIONES_EQUIPO === "undefined" ? {} : ACCIONES_EQUIPO);
  if (!acciones[a]) return;
  const res = await acciones[a](b, t);
  if (res !== false) pintar();
});
window.addEventListener("beforeunload", e => { if (S.sucios.size || S.guardando) { e.preventDefault(); e.returnValue = ""; } });
arrancar();

/* =================== Equipos de tienda ===================
   El equipo de sala no tiene cuenta en la plataforma y no sale en Scorecard
   (ahí solo van SM y ASM, que son los que llevan bonus). Esto es una libreta
   de nombre, puesto y correo por tienda, para no volver a teclearlos cada vez
   que se manda una encuesta o una formación.
   Vive en el mismo jsonb de la tienda, así que no hace falta tabla nueva: lo
   ve y lo edita quien ya puede editar esa tienda.
   ========================================================== */
const PUESTOS_EQUIPO = ["Store Manager", "Assistant Store Manager", "Vendedor/a", "Vendedor/a a tiempo parcial", "Visual", "Suplente", "Becario/a"];
function equipoDe(t) { return (t && t.equipo) || []; }
function tiendasQueVeo() { return esAdmin() ? S.tiendas : S.tiendas.filter(t => t.rm_id === S.me.id); }
function bloqueEquipos() {
  const ts = tiendasQueVeo();
  if (!ts.length) return "";
  const sel = ts.find(t => t.id === S.equipoT) || ts[0];
  S.equipoT = sel.id;
  const eq = equipoDe(sel), total = ts.reduce((a, t) => a + equipoDe(t).length, 0);
  const conMail = eq.filter(p => (p.email || "").trim()).length;
  return `<section class="card" id="equipos"><div class="card-h"><h2>Tiendas y equipos de tienda</h2>
      <span class="muted">${total} ${total === 1 ? "persona" : "personas"} en la red</span></div>
    <p class="hint" style="margin-top:0">Quién trabaja en cada tienda, con su correo. No son usuarios de la plataforma ni entran en el Scorecard: sirve para mandarles encuestas y formaciones sin teclear los datos cada vez.</p>
    <div class="inline-form" style="border:0;margin:0 0 14px;padding:0">
      <label>Tienda<select data-action="equipoTienda">${ts.map(t => `<option value="${t.id}" ${t.id === sel.id ? "selected" : ""}>${esc(t.nombre || "Sin nombre")} · ${equipoDe(t).length}</option>`).join("")}</select></label>
      ${sel.personas.length ? `<button class="btn" data-action="equipoDesdeScorecard">Traer SM y ASM del Scorecard</button>` : ""}
      ${eq.length ? `<button class="btn" data-action="equipoCsv">Descargar CSV</button>` : ""}</div>
    ${eq.length ? `<div class="tablewrap"><table><thead><tr><th>Nombre</th><th>Puesto</th><th>Correo</th><th></th></tr></thead><tbody>
      ${eq.map((p, i) => `<tr><td><input data-eq="${i}" data-campo="nombre" value="${esc(p.nombre || "")}"></td>
        <td><select data-eq="${i}" data-campo="puesto">${PUESTOS_EQUIPO.map(x => `<option ${x === p.puesto ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></td>
        <td><input data-eq="${i}" data-campo="email" type="email" value="${esc(p.email || "")}" placeholder="nombre@correo.com"></td>
        <td class="n"><button class="btn small ghost danger" data-action="equipoBorrar" data-i="${i}">Quitar</button></td></tr>`).join("")}
      </tbody></table></div>
      ${conMail < eq.length ? `<p class="hint">${eq.length - conMail} ${eq.length - conMail === 1 ? "persona no tiene correo y no podrá recibir el enlace" : "personas no tienen correo y no podrán recibir el enlace"}.</p>` : ""}`
      : `<p class="empty">Esta tienda todavía no tiene equipo. Añádelo abajo.</p>`}
    <form class="inline-form" id="formEquipo"><h3>Añadir a ${esc(sel.nombre || "la tienda")}</h3>
      <label>Nombre<input name="nombre" required placeholder="Nombre y apellido"></label>
      <label>Puesto<select name="puesto">${PUESTOS_EQUIPO.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
      <label>Correo<input name="email" type="email" placeholder="nombre@correo.com"></label>
      <button class="btn primary" type="submit">Añadir</button></form>
    <p class="hint">Dato personal de empleados: antes de meter correos reales, confírmalo con IT y con el responsable de protección de datos. La plataforma no guarda nada más que nombre, puesto y correo.</p></section>`;
}
const ACCIONES_EQUIPO = {
  equipoTienda(b) { S.equipoT = b.value; },
  equipoBorrar(b) {
    const t = S.tiendas.find(x => x.id === S.equipoT); if (!t) return false;
    t.equipo = equipoDe(t).filter((_, i) => i !== Number(b.dataset.i));
    guardar(t); pintar(); return false;
  },
  equipoDesdeScorecard() {
    const t = S.tiendas.find(x => x.id === S.equipoT); if (!t) return false;
    const eq = equipoDe(t).slice();
    let n = 0;
    t.personas.forEach(p => {
      const nom = (p.nombre || "").trim(); if (!nom) return;
      if (eq.some(x => (x.nombre || "").trim().toLowerCase() === nom.toLowerCase())) return;
      eq.push({ nombre: nom, puesto: (C.bonus[p.puesto] || {}).nombre || p.puesto || PUESTOS_EQUIPO[0], email: "" }); n++;
    });
    if (!n) { toast("No hay nadie nuevo que traer"); return false; }
    t.equipo = eq; guardar(t); pintar();
    toast(n === 1 ? "1 persona traída, ponle el correo" : n + " personas traídas, ponles el correo");
    return false;
  },
  equipoCsv() {
    const t = S.tiendas.find(x => x.id === S.equipoT); if (!t) return false;
    const filas = [["Tienda", "Nombre", "Puesto", "Correo"]].concat(equipoDe(t).map(p => [t.nombre, p.nombre, p.puesto, p.email || ""]));
    const csv = "﻿" + filas.map(f => f.map(x => `"${String(x == null ? "" : x).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `equipo-${(t.codigo || t.nombre || "tienda")}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    return false;
  }
};
function anadirAEquipo(ev) {
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  const t = S.tiendas.find(x => x.id === S.equipoT); if (!t) return;
  const nom = (f.nombre || "").trim(); if (!nom) return;
  t.equipo = equipoDe(t).concat([{ nombre: nom, puesto: f.puesto, email: (f.email || "").trim().toLowerCase() }]);
  guardar(t); pintar(); toast("Añadido a " + (t.nombre || "la tienda"));
}
