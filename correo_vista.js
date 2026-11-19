"use strict";
/* =====================================================================
   Vista previa y edición del correo antes de enviar (0.34.0)
   La plantilla es la misma que usa la función de envío:
   supabase/functions/_shared/correo.js, cargada como módulo en
   index.html (window.CORREO). Se puede cambiar el asunto, el texto
   principal, una nota destacada y la firma. El código, el botón y las
   instrucciones no: son los que permiten entrar.
   Lo que se cambia se guarda en la campaña (campanas.config.correo) o en
   el ciclo de Desarrollo (dr_ciclos.config.correo); la función lo aplica
   a todos los envíos y recordatorios de esa campaña o ciclo.
   ===================================================================== */
const VC = { abierto: false };
const VC_CAMPOS = ["asunto", "intro", "extra", "firma", "cargo"];

/* Modo del correo según la campaña, igual que en la función de envío */
function modoCorreo(c, pl) {
  if (pl && pl.anonima) return "anonima";
  return c && ["clima", "formacion", "psico", "onboarding", "offboarding", "mystery"].includes(c.tipo) ? c.tipo : "psico";
}
function vcFirmaPorDefecto() { const yo = (typeof yoReal === "function" ? yoReal() : S.me) || {}; return { firma: yo.nombre || "", cargo: yo.rol === "rm" ? "Regional Manager" : "Recursos Humanos" }; }
function vcUrl() { return (location.origin + location.pathname).replace(/index\.html$/, ""); }

/* op = { titulo, modo, info, limite, personas, aj, n (destinatarios),
          ejemplo (nombre de ejemplo), alGuardar(aj), alEnviar(aj), txtEnviar } */
/* La plantilla (supabase/functions/_shared/correo.js) es un script normal
   que deja sus funciones en window.CORREO. Se carga como el resto de la
   web: primero la copia que publicar-pages.yml deja en la raíz del sitio
   (correo_plantilla.js) y, si no está (en local), la del repositorio. */
let vcCarga = null;
function vcScript(src) {
  return new Promise((ok, mal) => {
    const el = document.createElement("script"); el.src = src; el.async = true;
    el.onload = () => (window.CORREO ? ok(window.CORREO) : mal(new Error(src + " no define la plantilla")));
    el.onerror = () => { el.remove(); mal(new Error("no se ha podido descargar " + src.split("?")[0])); };
    document.head.appendChild(el);
  });
}
function cargarPlantillaCorreo() {
  if (window.CORREO) return Promise.resolve(window.CORREO);
  if (!vcCarga) {
    const v = "?v=" + (typeof APP_VERSION !== "undefined" ? APP_VERSION : Date.now());
    vcCarga = vcScript("correo_plantilla.js" + v).catch(() => vcScript("supabase/functions/_shared/correo.js" + v))
      .catch(e => { vcCarga = null; throw e; });
  }
  return vcCarga;
}
window.addEventListener("load", () => { cargarPlantillaCorreo().catch(() => {}); });
/* Si el navegador no consigue descargar la plantilla (pasa en algunas redes
   de empresa), el correo lo monta la función de envío: modo vista_previa,
   que no envía nada. */
async function vcPedir(op, aj) {
  const it = vcItem(op);
  const r = await sb.functions.invoke("enviar-invitacion", { body: { vista_previa: { it: { modo: it.modo, titulo: it.titulo, nombre: it.nombre, info: it.info, limite: it.limite, personas: it.personas }, aj } } });
  if (r.error || !r.data || !r.data.html) throw new Error((r.data && r.data.error) || (r.error && r.error.message) || "sin respuesta");
  return r.data;
}
async function abrirVistaCorreo(op) {
  let remoto = null;
  if (!window.CORREO) {
    try { await cargarPlantillaCorreo(); }
    catch (e) {
      if (sb.demo) { alert("No se ha podido cargar la plantilla del correo (" + ((e && e.message) || e) + ")."); return; }
      try { toast("Preparando la vista previa…"); remoto = await vcPedir(op, op.aj || {}); }
      catch (e2) { alert("No se ha podido preparar la vista previa del correo (" + ((e2 && e2.message) || e2) + "). Vuelve a intentarlo en un momento."); return; }
    }
  }
  const def = remoto ? { firma: remoto.firma, cargo: remoto.cargo } : vcFirmaPorDefecto();
  const it = vcItem(op);
  const base = remoto ? remoto.base : CORREO.textosCorreo(it, def.firma, {});
  const aj = Object.assign({}, op.aj || {});
  Object.assign(VC, { abierto: true, op, def, base, aj, ancho: "pc", ocupado: false, remoto: !!remoto, m: remoto ? { asunto: remoto.asunto, html: remoto.html } : null,
    val: { asunto: aj.asunto || base.asunto, intro: aj.intro || (it.modo === "recordatorio" ? "" : base.intro), extra: aj.extra || "", firma: aj.firma || def.firma, cargo: aj.cargo || def.cargo } });
  vcPintar();
}
function vcItem(op) {
  return { id: "vista", codigo: "ABCD-2345", nombre: op.modo === "anonima" || op.modo === "recordatorio" ? "" : (op.ejemplo || "Ana Ortega"), email: "",
    titulo: op.titulo || "", modo: op.modo, repite: false, info: op.info || {}, limite: op.limite || null, personas: op.personas || 0 };
}
/* Lo que se guarda: solo lo que difiere del texto de siempre */
function vcAjustes() {
  const v = VC.val, b = VC.base, d = VC.def, out = {};
  if (v.asunto.trim() && v.asunto.trim() !== b.asunto) out.asunto = v.asunto.trim();
  if (v.intro.trim() && v.intro.trim() !== b.intro) out.intro = v.intro.trim();
  if (v.extra.trim()) out.extra = v.extra.trim();
  if (v.firma.trim() && v.firma.trim() !== d.firma) out.firma = v.firma.trim();
  if (v.cargo.trim() && v.cargo.trim() !== d.cargo) out.cargo = v.cargo.trim();
  return out;
}
function vcHtml() {
  if (VC.remoto) return VC.m;
  const it = vcItem(VC.op);
  return CORREO.prepararCorreo(it, VC.def.firma, VC.def.cargo, vcUrl(), vcAjustes());
}
function vcCerrar() { VC.abierto = false; const o = document.getElementById("vcOv"); if (o) o.remove(); document.body.classList.remove("imp-on"); }
function vcPintar() {
  let o = document.getElementById("vcOv");
  if (!o) {
    o = document.createElement("div"); o.id = "vcOv"; o.className = "imp-ov"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Correo antes de enviar");
    document.body.appendChild(o); document.body.classList.add("imp-on");
    o.addEventListener("click", vcClic); o.addEventListener("input", vcEscribe);
  }
  const op = VC.op, v = VC.val, rec = op.modo === "recordatorio", m = vcHtml();
  o.innerHTML = `<div class="imp vc">
    <div class="imp-h"><div><h2>${op.alEnviar ? "Revisa el correo antes de enviar" : "El correo de esta campaña"}</h2>
      <p class="muted">${op.n ? `Lo recibirán ${op.n} ${op.n === 1 ? "persona" : "personas"}. ` : ""}Los cambios valen para todos los envíos${rec ? "" : " y recordatorios"} de ${op.ciclo ? "este ciclo" : "esta campaña"}.</p></div>
      <button class="btn ghost" data-vc="cerrar" ${VC.ocupado ? "disabled" : ""}>Cerrar</button></div>
    <div class="vc-g">
      <form class="vc-f" onsubmit="return false">
        ${op.soloVer ? `<p class="hint warn">El texto del correo lo decide RR.HH. Aquí puedes ver cómo llegará.</p>` : ""}
        <fieldset class="vc-fs" ${op.soloVer ? "disabled" : ""}>
        <label>Asunto<input data-vc-c="asunto" value="${esc(v.asunto)}" maxlength="150"></label>
        ${rec ? `<p class="hint">El texto del recordatorio general no se cambia: explica que se use el código del primer correo, porque al ser anónima no se puede reenviar.</p>` : `<label>Texto principal<textarea data-vc-c="intro" rows="7" maxlength="1500">${esc(v.intro)}</textarea><small>Una línea en blanco separa párrafos.</small></label>`}
        <label>Nota destacada, opcional<input data-vc-c="extra" value="${esc(v.extra)}" maxlength="400" placeholder="Por ejemplo: tienes hasta el viernes 28"></label>
        <div class="vc-2"><label>Firma<input data-vc-c="firma" value="${esc(v.firma)}" maxlength="80"></label><label>Cargo<input data-vc-c="cargo" value="${esc(v.cargo)}" maxlength="80"></label></div>
        <p class="hint">El código, el botón y «Cómo funciona» no se pueden cambiar: son los que permiten entrar. ${op.modo === "anonima" ? "Tampoco el saludo: en las anónimas no lleva nombre." : "El saludo lleva el nombre de cada persona."}</p>
        ${op.soloVer ? "" : `<button type="button" class="btn small ghost" data-vc="restablecer">Volver al texto de siempre</button>`}
        </fieldset>
      </form>
      <div class="vc-p">
        <div class="vc-p-h"><div class="imp-filtro"><button class="${VC.ancho === "pc" ? "on" : ""}" data-vc="ancho" data-v="pc">Ordenador</button><button class="${VC.ancho === "movil" ? "on" : ""}" data-vc="ancho" data-v="movil">Móvil</button></div>
          <span class="vc-asunto"><small>Asunto</small> ${esc(m.asunto)}</span></div>
        <div class="vc-marco ${VC.ancho}"><iframe title="Vista previa del correo" sandbox="" id="vcFrame"></iframe></div>
        <p class="hint">Ejemplo con el código ABCD-2345${op.modo === "anonima" || rec ? "" : " y el nombre «" + esc((op.ejemplo || "Ana Ortega").split(" ")[0]) + "»"}. Cada persona recibe el suyo.</p>
      </div>
    </div>
    <div class="imp-pie">
      <button class="btn" data-vc="cerrar" ${VC.ocupado ? "disabled" : ""}>Cancelar</button>
      <span class="spacer"></span>
      ${op.alEnviar && op.alGuardar ? `<button class="btn" data-vc="guardar" ${VC.ocupado ? "disabled" : ""}>Guardar sin enviar</button>` : ""}
      <button class="btn primary" data-vc="${op.alEnviar ? "enviar" : "guardar"}" ${VC.ocupado ? "disabled" : ""}>${VC.ocupado ? "Un momento…" : op.alEnviar ? esc(op.txtEnviar || `Enviar ${op.n} ${op.n === 1 ? "correo" : "correos"}`) : "Guardar"}</button>
    </div></div>`;
  vcRefrescar(m);
}
let vcPedido = 0;
async function vcRefrescar(m) {
  if (!m && VC.remoto) {
    const n = ++vcPedido;
    try { const r = await vcPedir(VC.op, vcAjustes()); if (n !== vcPedido || !VC.abierto) return; VC.m = { asunto: r.asunto, html: r.html }; }
    catch (e) { return; }
    m = VC.m;
  }
  const f = document.getElementById("vcFrame"); if (!f) return;
  m = m || vcHtml();
  f.srcdoc = m.html;
  const a = document.querySelector("#vcOv .vc-asunto"); if (a) a.innerHTML = `<small>Asunto</small> ${esc(m.asunto)}`;
}
let vcT = null;
function vcEscribe(e) {
  const k = e.target.dataset && e.target.dataset.vcC; if (!k) return;
  VC.val[k] = e.target.value;
  clearTimeout(vcT); vcT = setTimeout(() => vcRefrescar(), VC.remoto ? 500 : 150);
}
async function vcClic(e) {
  const b = e.target.closest("[data-vc]"); if (!b || b.disabled) return;
  e.preventDefault();
  const a = b.dataset.vc, op = VC.op;
  if (a === "cerrar") return vcCerrar();
  if (a === "ancho") { VC.ancho = b.dataset.v; return vcPintar(); }
  if (a === "restablecer") { VC.val = { asunto: VC.base.asunto, intro: op.modo === "recordatorio" ? "" : VC.base.intro, extra: "", firma: VC.def.firma, cargo: VC.def.cargo }; vcPintar(); if (VC.remoto) vcRefrescar(); return; }
  if (a === "guardar" || a === "enviar") {
    const aj = vcAjustes();
    VC.ocupado = true; vcPintar();
    try {
      if (op.alGuardar) await op.alGuardar(aj);
      if (a === "enviar" && op.alEnviar) { vcCerrar(); await op.alEnviar(aj); return; }
      vcCerrar(); toast("Texto del correo guardado");
    } catch (err) { VC.ocupado = false; vcPintar(); alert("No se ha podido guardar: " + traducirError(err)); }
  }
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && VC.abierto && !VC.ocupado) vcCerrar(); });

/* Guardar los cambios del correo en una campaña (campanas.config.correo) */
async function guardarCorreoCampana(c, aj) {
  const cfg = Object.assign({}, c.config || {}, { correo: aj });
  const r = await sb.from("campanas").update({ config: cfg }).eq("id", c.id);
  if (r.error) throw r.error;
  c.config = cfg;
}
