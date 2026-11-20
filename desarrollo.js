"use strict";
/* ===================== DESARROLLO · panel de RR.HH. =====================
   Talent Review y plan de desarrollo, en dos ámbitos (pestañas):
   - Oficina: cada manager valora a su equipo.
   - Retail: el Regional Manager valora a sus Store Managers y cada Store
     Manager a su Assistant.
   RR.HH. prepara el ciclo (carga la plantilla o la genera desde las
   tiendas), reparte un código por responsable, sigue las entregas y
   analiza lo recibido: mapa 9-Box, retención, competencias, planes y
   sucesión, ficha ejecutiva y panel de datos con la cola de decisiones.
   Solo cuenta lo que cada responsable ha enviado.
   ======================================================================== */
const DRV = [["recepcion", "Recepción"], ["mapa", "Mapa de talento"], ["retencion", "Retención"], ["competencias", "Competencias"],
  ["planes", "Planes y sucesión"], ["informes", "Informe por equipo"], ["ficha", "Informe por persona"], ["panel", "★ Datos y plan de acción"]];
function drS() {
  if (!S.dr) S.dr = { amb: null, cargando: false, error: "", ciclos: [], ciclo: null, ev: [], per: [], dec: [], vista: "recepcion",
    f: { dep: "", cat: "", mgr: "", q: "" }, nombres: false, sel9: null, selR: null, ficha: null, msg: "", plan: { mgr: "", q: "" }, nuevo: false, inf: null };
  return S.dr;
}
function resumenDesarrollo() {
  const D = drS();
  if (!D.ciclo) return "Ningún ciclo abierto todavía";
  const ev = D.ev, ent = ev.filter(e => e.entregado).length;
  return `${ent} de ${ev.length} responsables han enviado`;
}
async function drCargar(amb) {
  const D = drS(); D.amb = amb; D.cargando = true; D.error = "";
  const c = await sb.from("dr_ciclos").select("*").eq("ambito", amb).order("anio", { ascending: false });
  if (c.error) { D.cargando = false; D.error = c.error.message || "error"; return; }
  D.ciclos = c.data || [];
  if (!D.ciclos.some(x => x.id === D.ciclo)) D.ciclo = D.ciclos.length ? D.ciclos[0].id : null;
  await drCargarCiclo();
  D.cargando = false;
}
async function drCargarCiclo() {
  const D = drS(); D.ev = []; D.per = []; D.dec = [];
  if (!D.ciclo) return;
  const [e, p, d] = await Promise.all([
    sb.from("dr_evaluadores").select("*").eq("ciclo_id", D.ciclo).order("nombre"),
    sb.from("dr_personas").select("*").eq("ciclo_id", D.ciclo).order("nombre"),
    sb.from("dr_decisiones").select("*").eq("ciclo_id", D.ciclo)]);
  D.ev = e.data || []; D.per = p.data || []; D.dec = d.data || [];
}
const drCiclo = () => drS().ciclos.find(c => c.id === drS().ciclo);
const drMgr = p => (drS().ev.find(e => e.id === p.evaluador_id) || {}).nombre || "—";
/* Personas de responsables que ya han enviado, con los filtros aplicados */
function drFilas(sinFiltro) {
  const D = drS(), f = D.f, ok = new Set(D.ev.filter(e => e.entregado).map(e => e.id));
  return D.per.filter(p => ok.has(p.evaluador_id)).filter(p => sinFiltro || (
    (!f.dep || p.departamento === f.dep) && (!f.cat || p.categoria === f.cat) && (!f.mgr || p.evaluador_id === f.mgr) &&
    (!f.q || norm(p.nombre).includes(norm(f.q)))));
}
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const drSets = filas => {
  const activas = filas.filter(p => !TR.d(p).baja), evaluadas = activas.filter(p => { const e = TR.d(p); return !e.noEval && e.perf > 0 && e.pot > 0; });
  return { activas, evaluadas };
};
const pctS = (n, d) => (d ? Math.round(n / d * 100) : 0);
const drNom = p => (drS().nombres ? esc(TR.apellidos(p.nombre)) : "");
const drFichaBtn = p => `<button class="tr-link" data-tra="verFicha" data-id="${p.id}">ficha →</button>`;

/* =================== pintado =================== */
function pintarDesarrollo(amb) {
  const D = drS();
  if (!esAdmin()) {
    $("vista").innerHTML = `<div class="page"><div class="page-h"><h1>Desarrollo · ${esc(TRC.AMBITO[amb].nombre)}</h1></div><div class="empty big"><p>El Talent Review lo prepara RR.HH. Si te toca valorar a tu equipo, recibirás un código para entrar.</p>
      <p class="hint">Con el código, entra desde la pantalla de acceso en «Entrar con un código de invitación».</p></div></div>`;
    return;
  }
  if (D.amb !== amb && !D.cargando) { $("vista").innerHTML = `<div class="page"><p class="muted">Cargando…</p></div>`; drCargar(amb).then(() => { if (S.modulo === "desarrollo") pintar(); }); return; }
  if (D.cargando) { $("vista").innerHTML = `<div class="page"><p class="muted">Cargando…</p></div>`; return; }
  if (D.error) {
    $("vista").innerHTML = `<div class="page"><div class="page-h"><h1>Desarrollo</h1></div><div class="empty big"><p><b>Falta preparar la base de datos.</b> Este bloque necesita las tablas de la versión 0.28.</p>
      <p class="hint">En Supabase → SQL Editor, pega el contenido de <code>supabase/migracion_0.28.sql</code> del repositorio y pulsa Run. Después, recarga esta página.</p><p class="hint">Detalle: ${esc(D.error)}</p>
      <button class="btn" data-tra="recargar">Volver a intentarlo</button></div></div>`;
    return;
  }
  const c = drCiclo(), A = TRC.AMBITO[amb];
  let h = `<div class="page tr tr-hr"><div class="page-h"><div><span class="tr-eyebrow">Desarrollo · ${esc(A.nombre)}</span><h1>${c ? esc(c.nombre) : "Talent Review"}</h1>
    ${c ? `<p class="hint">${c.estado === "abierto" ? "Ciclo abierto" : "Ciclo cerrado"}${c.fecha_limite ? ` · fecha límite ${esc(trFecha(c.fecha_limite))}` : ""} · ${D.ev.length} responsables · ${D.per.length} personas</p>` : ""}</div>
    <div class="page-h-b">${D.ciclos.length > 1 ? `<select data-trs="ciclo">${D.ciclos.map(x => `<option value="${x.id}" ${x.id === D.ciclo ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select>` : ""}
      ${c ? `<button class="btn" data-tra="recargar">Actualizar</button><details class="tr-mas"><summary class="btn">Más ▾</summary><div class="tr-menu">
        <button data-tra="csv">Exportar CSV maestro</button><button data-tra="resumen">Copiar resumen ejecutivo</button><button data-tra="imprimir">Imprimir esta vista</button>
        <button data-tra="estadoCiclo">${c.estado === "abierto" ? "Cerrar el ciclo" : "Reabrir el ciclo"}</button><button data-tra="nuevoCiclo">Nuevo ciclo</button><hr>
        <button class="peligro" data-tra="borrarCiclo">Borrar este ciclo…</button></div></details>` : ""}</div></div>`;
  if (D.msg) h += `<div class="tr-banda ok">${esc(D.msg)}</div>`;
  if (!c || D.nuevo) h += drNuevoCiclo(amb, !c);
  else {
    h += drKpis() + drCola() + drFiltros();
    h += `<nav class="tr-tabs">${DRV.map(([id, t]) => `<button class="${D.vista === id ? "on" : ""}${id === "panel" ? " oro" : ""}" data-tra="vista" data-v="${id}">${t}</button>`).join("")}</nav><div id="drVista">`;
    h += ({ recepcion: drRecepcion, mapa: drMapa, retencion: drRetencion, competencias: drCompetencias, planes: drPlanes, informes: drInformes, ficha: drFicha, panel: drPanel })[D.vista](amb);
    h += `</div>`;
  }
  $("vista").innerHTML = h + `</div>`;
}

function drNuevoCiclo(amb, primero) {
  const anio = new Date().getFullYear();
  return `<section class="tr-card tr-pad"><span class="tr-eyebrow">${primero ? "Empezar" : "Nuevo ciclo"}</span><h2>Crear un ciclo de Talent Review · ${esc(TRC.AMBITO[amb].nombre)}</h2>
    <p class="hint">${amb === "retail" ? "Después podrás generar los equipos a partir de las tiendas: cada Regional Manager valora a sus Store Managers y cada Store Manager a su Assistant." : "Después cargarás la plantilla: quién es cada persona y quién es su manager. Cada manager recibe un código y valora a su equipo."}</p>
    <form id="drNuevo" class="tr-form tr-g3"><label class="tr-lbl">Nombre<input name="nombre" required value="Talent Review ${anio}${amb === "retail" ? " · Retail" : ""}"></label>
      <label class="tr-lbl">Año<input name="anio" type="number" required value="${anio}"></label>
      <label class="tr-lbl">Fecha límite para los responsables<input name="fecha" type="date"></label>
      <div class="tr-dlg-b"><button class="btn primary" type="submit">Crear ciclo</button>${primero ? "" : `<button class="btn" type="button" data-tra="cancelarNuevo">Cancelar</button>`}</div></form>
    ${sb.demo ? `<p class="hint">Modo demostración: <button class="tr-link" data-tra="ejemplo">crear un ciclo con datos inventados</button> para ver cómo queda el panel con respuestas.</p>` : ""}</section>`;
}

function drKpis() {
  const D = drS(), filas = drFilas(), { activas, evaluadas } = drSets(filas), todas = drFilas(true);
  const ent = D.ev.filter(e => e.entregado).length;
  const alto = evaluadas.filter(p => TR.d(p).perf >= 8).length, hot = activas.filter(p => TR.hot(TR.d(p))).length;
  const noEv = activas.filter(p => TR.d(p).noEval).length, man = todas.filter(p => p.manual).length, sal = todas.filter(p => TR.d(p).baja).length;
  const ts = D.ev.map(e => (e.encuesta || {}).t).filter(Boolean), moda = ts.length ? Object.entries(ts.reduce((a, t) => (a[t] = (a[t] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1])[0][0] : "—";
  const k = (v, t, c) => `<div class="tr-kpi ${c || ""}"><b>${v}</b><span>${t}</span></div>`;
  return `<div class="tr-kpis">${k(`${ent}<small> / ${D.ev.length}</small>`, "Responsables que han enviado")}${k(evaluadas.length, `Personas evaluadas (de ${activas.length} activas)`)}
    ${k(pctS(alto, evaluadas.length) + "%", "En banda alta de desempeño", "oro")}${k(hot, "Prioridad de retención (riesgo × impacto altos)", "warn")}
    ${k(noEv, "No evaluables este ciclo")}${k(`${man} · ${sal}`, "Altas manuales · salidas comunicadas")}${k(esc(moda.replace("Entre ", "").replace("Menos de 5 minutos", "<5′").replace("Más de 20", ">20′")), "Tiempo por persona más citado")}</div>`;
}

/* Cola de decisiones: lo que necesita una decisión de RR.HH., con estado */
function drColaItems() {
  const filas = drFilas(), { activas } = drSets(filas), amb = drS().amb, it = [];
  activas.forEach(p => { const e = TR.d(p); if (!e.noEval && TR.hot(e)) it.push(["crit", p, "Riesgo e impacto altos"]); });
  activas.forEach(p => { const e = TR.d(p); if (!e.noEval && TR.necesitaSucesor(e, p, amb) && e.sucExiste !== "Sí") it.push(["suc", p, p.puesto || ""]); });
  activas.forEach(p => { const e = TR.d(p); if (e.noEval) return;
    [["A"], ["B"]].forEach(([k]) => { if (e["obj" + k] && e["acc" + k] && (e["bud" + k] === "Requiere presupuesto" || e["pri" + k] === "Alta")) it.push(["bud", p, `Plan ${k}: ${e["acc" + k]} · prioridad ${e["pri" + k] || "—"}${e["bud" + k] === "Requiere presupuesto" ? " · presupuesto" : ""}`, k]); }); });
  return it;
}
function drCola() {
  const D = drS(), it = drColaItems(), st = cl => (D.dec.find(d => d.clave === cl) || {}).estado || "pendiente";
  const bloques = [["crit", "Retención en zona crítica", "Riesgo e impacto de salida, ambos altos.", "bad"], ["suc", "Puestos críticos sin sucesor", "Criticidad alta o puesto de mando, sin sucesor identificado.", "mid"], ["bud", "Planes con presupuesto o prioridad alta", "Requieren decisión de presupuesto o lanzarse ya.", "ink"]];
  const abiertos = it.filter(([t, p, , k]) => !["resuelto", "descartado"].includes(st(`${t}:${p.id}${k || ""}`))).length;
  return `<details class="tr-card tr-cola" ${D.colaAbierta ? "open" : ""} id="drCola"><summary><b>Cola de decisiones</b> <span class="hint">— lo que requiere una decisión tuya. El resto es consulta.</span><em class="tr-pill">${abiertos} ${abiertos === 1 ? "asunto abierto" : "asuntos abiertos"}</em></summary>
    ${bloques.map(([cl, t, d, c]) => { const xs = it.filter(x => x[0] === cl);
      return `<div class="tr-cb"><div class="tr-cbh"><i class="tr-pt ${c}"></i><b class="tr-cn2">${xs.length}</b><div><b>${t}</b><small>${d}</small></div></div>
      ${xs.length ? `<div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Detalle</th><th>Responsable</th><th>Estado</th><th></th></tr></thead><tbody>${xs.map(([tp, p, det, k]) => { const clave = `${tp}:${p.id}${k || ""}`, s = st(clave);
        return `<tr class="${["resuelto", "descartado"].includes(s) ? "apag" : ""}"><td>${esc(p.nombre)}</td><td>${esc(det)}</td><td>${esc(drMgr(p))}</td>
          <td><select data-trs="decision" data-clave="${esc(clave)}">${["pendiente", "en curso", "resuelto", "descartado"].map(o => `<option ${o === s ? "selected" : ""}>${o}</option>`).join("")}</select></td><td>${drFichaBtn(p)}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="tr-ok">✓ Nada pendiente en este bloque.</p>`}</div>`; }).join("")}</details>`;
}

function drFiltros() {
  const D = drS(), todas = drFilas(true), f = D.f, filas = drFilas();
  const vals = k => [...new Set(todas.map(p => p[k]).filter(Boolean))].sort();
  const algo = f.dep || f.cat || f.mgr || f.q;
  return `<div class="tr-filtros"><b>Filtros</b>
    <select data-trs="f" data-k="dep"><option value="">Todas las unidades</option>${vals("departamento").map(v => `<option ${v === f.dep ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>
    <select data-trs="f" data-k="cat"><option value="">Todas las categorías</option>${vals("categoria").map(v => `<option ${v === f.cat ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>
    <select data-trs="f" data-k="mgr"><option value="">Todos los responsables</option>${D.ev.map(e => `<option value="${e.id}" ${e.id === f.mgr ? "selected" : ""}>${esc(TR.apellidos(e.nombre))}</option>`).join("")}</select>
    <input data-trs="f" data-k="q" placeholder="Buscar por nombre…" value="${esc(f.q)}">
    <button class="tr-mini" data-tra="nombres">${D.nombres ? "Ocultar nombres" : "Mostrar nombres"}</button>
    ${algo ? `<button class="tr-link" data-tra="limpiar">Limpiar</button>` : ""}<span class="tr-sp"></span><span class="hint">${filas.length}${algo ? " / " + todas.length : ""} personas</span></div>`;
}

/* ---------- Recepción ---------- */
function drRecepcion(amb) {
  const D = drS(), c = drCiclo(), A = TRC.AMBITO[amb];
  const estado = e => {
    const ps = D.per.filter(p => p.evaluador_id === e.id), act = ps.filter(p => !TR.d(p).baja), ok = act.filter(p => TR.completa(TR.d(p))).length;
    if (e.entregado) return `<span class="tr-tag ok">Enviado · ${esc(new Date(e.entregado).toLocaleDateString("es-ES"))}</span>`;
    if (ps.some(p => TR.tocada(TR.d(p)))) return `<span class="tr-tag mid">En curso · ${ok} de ${act.length} listas</span>`;
    return e.abierto ? `<span class="tr-tag">Abierto, sin empezar</span>` : e.enviado ? `<span class="tr-tag">Correo enviado · ${esc(new Date(e.enviado).toLocaleDateString("es-ES"))}</span>` : `<span class="tr-tag">Sin enviar</span>`;
  };
  const pend = D.ev.filter(e => !e.entregado);
  let h = `<section class="tr-card tr-pad"><div class="tr-ch"><div><span class="tr-eyebrow">Responsables</span><h2>Entregas</h2></div><span class="hint">${D.ev.length - pend.length} recibidas · ${pend.length} pendientes ${envioDirecto() ? `<button class="btn small ghost" data-tra="correo">Ver y editar el correo</button>` : ""}</span></div>`;
  if (!D.ev.length) h += `<p class="empty">Todavía no hay responsables en este ciclo. Carga la plantilla aquí debajo${amb === "retail" ? " o genérala desde las tiendas" : ""}.</p>`;
  else h += `<div class="tablewrap"><table class="tr-t"><thead><tr><th>Responsable</th><th>${esc(A.unidad)}</th><th class="n">Personas</th><th>Estado</th><th>Código</th><th></th></tr></thead><tbody>
    ${D.ev.map(e => { const n = D.per.filter(p => p.evaluador_id === e.id && !TR.d(p).baja).length, sen = D.per.filter(p => p.evaluador_id === e.id);
      const senales = [sen.filter(p => p.manual).length && `${sen.filter(p => p.manual).length} alta manual`, sen.filter(p => TR.d(p).baja).length && `${sen.filter(p => TR.d(p).baja).length} salida`].filter(Boolean).join(" · ");
      return `<tr><td><b>${esc(e.nombre)}</b>${e.email ? `<small>${esc(e.email)}</small>` : ""}${senales ? `<small class="tr-oro">${esc(senales)}</small>` : ""}</td><td>${esc(e.unidad || "—")}</td><td class="n">${n}</td><td>${estado(e)}</td><td><code>${esc(e.codigo)}</code></td>
        <td class="n tr-acc2">${e.email && !e.entregado && c.estado === "abierto" ? (envioDirecto() ? `<button class="btn small" data-tra="enviarCorreo" data-id="${e.id}">${e.enviado ? "Reenviar" : "Enviar"} correo</button>` : `<a class="btn small ghost" href="${esc(drMailto(e))}">Correo</a>`) : ""}<button class="btn small ghost" data-tra="copiarEnlace" data-id="${e.id}">Copiar código</button>
          ${e.entregado ? `<button class="btn small" data-tra="verInforme" data-id="${e.id}">Informe</button><button class="btn small ghost" data-tra="acuse" data-id="${e.id}">Copiar acuse</button>` : ""}<button class="btn small ghost danger" data-tra="quitarEv" data-id="${e.id}" title="Quitar a este responsable y a su equipo">Quitar</button></td></tr>`; }).join("")}</tbody></table></div>
    ${pend.length ? `<div class="tr-pend"><span class="hint">Pendientes:</span> ${pend.map(e => `<span class="tr-chip">${esc(TR.apellidos(e.nombre))}</span>`).join("")}
      ${envioDirecto() && c.estado === "abierto" ? `<button class="btn small primary" data-tra="enviarTodos">Enviar el código por correo a los ${pend.filter(e => e.email).length} pendientes con correo</button>` : ""}
      <button class="btn small" data-tra="recordatorio">Copiar recordatorio</button></div>` : ""}
    <p class="hint">Es el mismo sistema de códigos que las encuestas de clima y las formaciones: cada responsable entra en www.pippole.es por «Entrar con un código de invitación» y escribe su código. ${envioDirecto() ? "El correo sale desde la plataforma." : "Sin envío desde la plataforma configurado, «Correo» abre tu programa de correo con el texto preparado."}</p>`;
  h += `</section>`;
  if (c.estado === "abierto") {
    const pegar = `<p class="hint">Pega desde Excel una fila por persona, con estas columnas en este orden (separadas por tabulador o punto y coma). La primera fila puede ser la cabecera:</p>
      <p class="tr-cols-ej"><code>Nombre (APELLIDOS, NOMBRE)</code><code>Puesto</code><code>${esc(A.unidad)}</code><code>Categoría</code><code>Antigüedad en la compañía (años)</code><code>Antigüedad en el puesto (años)</code><code>ID de empleado</code><code>Responsable</code><code>Correo del responsable</code></p>
      <p class="hint">Categorías: ${A.categorias.map(esc).join(", ")}. Cada responsable recibe un código propio; si ya existe en el ciclo, sus personas se añaden a su equipo.</p>
      <textarea id="drPlantilla" class="tr-mono" rows="6" placeholder="GARCÍA LÓPEZ, ANA;Key Account Manager;Comercial;Técnico / Specialist;6;2;1001;PÉREZ RUIZ, LUIS;luis@empresa.com"></textarea>
      <div class="tr-dlg-b"><button class="btn${Array.isArray(S.emp) ? "" : " primary"}" data-tra="cargarPlantilla">Cargar</button></div>`;
    if (Array.isArray(S.emp)) {
      const k = "dr-" + amb, Q = selP(k, { tips: amb === "retail" ? ["tiendas"] : ["oficinas", "comerciales", "demostradores"] });
      const resps = selPElegidos(k, drTieneEquipo), nP = resps.reduce((n, r) => n + drEquipo(r).length, 0);
      const auto = A.categorias.includes("Manager") ? "Quien tiene equipo a su cargo entra como «Manager»." : "Store Manager o Assistant según el puesto.";
      h += `<section class="tr-card tr-pad"><span class="tr-eyebrow">Preparar el ciclo</span><h2>Elegir de Personas</h2>
        <p class="hint">Marca a los responsables que valoran en este ciclo. Cada uno entra con su equipo directo: las personas que lo tienen como «responsable directo» en Personas.</p>
        ${selPHtml(k, { filtro: drTieneEquipo, etiqueta: "responsables", detalle: e => `${drEquipo(e).length} en su equipo · ${[e.puesto, empGrupo(e)].filter(Boolean).join(" · ")}${e.correo ? "" : " · sin correo"}` })}
        ${A.categorias.includes("Manager") ? `<label class="dr-cat">Categoría de quien no tiene equipo<select id="drCat">${A.categorias.filter(x => x !== "Manager").map(x => `<option>${esc(x)}</option>`).join("")}</select></label>` : ""}
        <p class="hint">${auto} La antigüedad sale de la fecha de alta. Lo que falte se completa en la ficha.</p>
        <div class="tr-dlg-b"><button class="btn primary" data-tra="dePersonas" ${resps.length ? "" : "disabled"}>Añadir ${resps.length} ${resps.length === 1 ? "responsable" : "responsables"} con ${nP} ${nP === 1 ? "persona" : "personas"}</button>
          ${amb === "retail" ? `<button class="btn" data-tra="desdeTiendas">Generar desde las tiendas</button>` : ""}</div>
        ${amb === "retail" ? `<p class="hint">«Generar desde las tiendas» añade a cada Regional Manager con los Store Managers de sus tiendas, y a cada Store Manager con su Assistant (de Personas).</p>` : ""}
        <details class="dr-pegar"><summary>O pegar la plantilla desde Excel</summary>${pegar}</details></section>`;
      void Q;
    } else {
      h += `<section class="tr-card tr-pad"><span class="tr-eyebrow">Preparar el ciclo</span><h2>Cargar la plantilla</h2>${pegar}
        ${amb === "retail" ? `<div class="tr-dlg-b"><button class="btn" data-tra="desdeTiendas">Generar desde las tiendas</button></div><p class="hint">«Generar desde las tiendas» usa el equipo de cada tienda: el Regional Manager de la tienda valora al Store Manager y el Store Manager valora al Assistant Store Manager.</p>` : ""}
        <p class="hint">Con Personas en marcha (migración 0.33) podrás elegir a los responsables en lugar de pegar la plantilla.</p></section>`;
    }
  }
  const voz = D.ev.filter(e => e.encuesta && (e.encuesta.sobra || e.encuesta.falta));
  if (voz.length) h += `<section class="tr-card tr-pad"><div class="tr-ch"><h2>Voz de los responsables</h2><span class="hint">${voz.length} ${voz.length === 1 ? "encuesta recibida" : "encuestas recibidas"}</span></div>
    <div class="tr-g2"><div><span class="tr-eyebrow">Qué les sobró</span>${voz.filter(e => e.encuesta.sobra).map(e => `<blockquote>«${esc(e.encuesta.sobra)}» — ${esc(TR.apellidos(e.nombre))}</blockquote>`).join("") || `<p class="hint">—</p>`}</div>
    <div><span class="tr-eyebrow">Qué les faltó</span>${voz.filter(e => e.encuesta.falta).map(e => `<blockquote>«${esc(e.encuesta.falta)}» — ${esc(TR.apellidos(e.nombre))}</blockquote>`).join("") || `<p class="hint">—</p>`}</div></div></section>`;
  return h;
}
/* ---------- Desde Personas (0.34.0) ---------- */
const drEquipo = r => empActivos().filter(p => p.responsable_id === r.id);
const drTieneEquipo = e => empActivos().some(p => p.responsable_id === e.id);
/* El Talent Review escribe los nombres como «APELLIDOS, NOMBRE» */
const drNombre = e => (e.apellidos ? `${e.apellidos}, ${e.nombre}` : e.nombre).toLocaleUpperCase("es");
function drCategoria(p, A, def) {
  if (A.categorias.includes("Store Manager")) return clEsSM(p) ? "Store Manager" : "Assistant Store Manager";
  return A.categorias.includes("Manager") && drTieneEquipo(p) ? "Manager" : def;
}
function drAnios(f) { if (!f) return null; const d = (Date.now() - Date.parse(f)) / (365.25 * 864e5); return d >= 0 ? Math.round(d * 10) / 10 : null; }
const drEnlace = () => `${location.origin}${location.pathname}?codigo=`;
function drMailto(e) {
  const c = drCiclo();
  const cuerpo = `Hola,\n\nTe toca valorar a tu equipo en ${c.nombre}${c.fecha_limite ? `, antes del ${trFecha(c.fecha_limite)}` : ""}.\n\nEntra aquí: ${drEnlace(e)}\nTu código: ${e.codigo}\n\nSon unos 10 minutos por persona. Se guarda solo y puedes dejarlo a medias. Cuando termines, pulsa «Enviar a RR.HH.».\n\nGracias,\nRR.HH.`;
  return `mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent(c.nombre + " · tu código")}&body=${encodeURIComponent(cuerpo)}`;
}

/* ---------- Mapa de talento ---------- */
function drMapa() {
  const D = drS(), { evaluadas } = drSets(drFilas()), n = evaluadas.length;
  if (!n) return `<p class="empty">Todavía no hay valoraciones enviadas.</p>`;
  const idx = p => { const e = TR.d(p); return TRC.segIdx(e.perf, e.pot); };
  const filas = [[6, 7, 8], [3, 4, 5], [0, 1, 2]];
  let h = `<section class="tr-card tr-pad"><div class="tr-ch"><h2>9-Box · ${D.f.dep ? esc(D.f.dep) : "toda la organización"}</h2><span class="hint">recuento + % · pulsa una casilla para ver a las personas</span></div>
    <div class="tr-9"><div class="tr-9y"><span>Potencial alto</span><span>Potencial medio</span><span>Potencial bajo</span></div><div class="tr-9g">${filas.flat().map(i => {
      const ps = evaluadas.filter(p => idx(p) === i), [nom, nota, c] = TRC.SEG[i];
      return `<button class="tr-cell ${c}${D.sel9 === i ? " sel" : ""}" data-tra="sel9" data-i="${i}"><span class="tr-cn">${esc(nom)}</span><small>${esc(nota)}</small><b>${ps.length} <em>· ${pctS(ps.length, n)}%</em></b>
        <div>${D.nombres && ps.length && ps.length <= 8 ? ps.map(p => `<span class="tr-chip">${drNom(p)}</span>`).join("") : ps.length ? `<span class="hint">Ver ${ps.length} ▸</span>` : ""}</div></button>`;
    }).join("")}</div><div></div><div class="tr-9x"><span>Desempeño bajo</span><span>Desempeño medio</span><span>Desempeño alto</span></div></div>`;
  if (D.sel9 != null) {
    const ps = evaluadas.filter(p => idx(p) === D.sel9);
    h += `<div class="tr-detalle"><b>${esc(TRC.SEG[D.sel9][0])} — ${ps.length} ${ps.length === 1 ? "persona" : "personas"}</b>${drTablaP(ps, [["Desemp.", p => TR.d(p).perf], ["Pot.", p => TR.d(p).pot]])}</div>`;
  }
  h += `<p class="hint">${n} personas evaluadas. Cada casilla indica qué hacer, no una etiqueta para la persona.</p></section>
    <div class="tr-g2">${["perf", "pot"].map(k => `<section class="tr-card tr-pad"><h2>Distribución de ${k === "perf" ? "desempeño" : "potencial"}</h2>${drBarras([["Banda alta (8-10)", evaluadas.filter(p => TR.d(p)[k] >= 8).length, "g"], ["Banda media (5-7)", evaluadas.filter(p => TRC.band(TR.d(p)[k]) === 2).length, "m"], ["Banda baja (1-4)", evaluadas.filter(p => TRC.band(TR.d(p)[k]) === 1).length, "b"]], n)}</section>`).join("")}</div>`;
  return h;
}
function drBarras(items, total) {
  const max = Math.max(1, ...items.map(x => x[1]));
  return `<div class="tr-barras">${items.map(([t, v, c]) => `<div class="tr-br"><span>${esc(t)}</span><div><i class="${c || ""}" style="width:${(v / (total || max)) * 100}%"></i></div><b>${v}${total ? ` · ${pctS(v, total)}%` : ""}</b></div>`).join("")}</div>`;
}
function drTablaP(ps, extra) {
  if (!ps.length) return `<p class="hint">Nadie en esta combinación.</p>`;
  return `<div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Unidad</th><th>Responsable</th>${extra.map(x => `<th>${x[0]}</th>`).join("")}<th></th></tr></thead><tbody>
    ${ps.map(p => `<tr><td>${esc(p.nombre)}${p.manual ? ` <span class="tr-tag mid">alta manual</span>` : ""}</td><td>${esc(p.departamento || "—")}</td><td>${esc(TR.apellidos(drMgr(p)))}</td>${extra.map(x => `<td>${x[2] ? x[1](p) : esc(x[1](p))}</td>`).join("")}<td>${drFichaBtn(p)}</td></tr>`).join("")}</tbody></table></div>`;
}

/* ---------- Retención: riesgo × impacto A0–C2 ---------- */
function drRetencion() {
  const D = drS(), { activas } = drSets(drFilas()), xs = activas.filter(p => { const e = TR.d(p); return !e.noEval && e.riesgo && e.impacto; });
  const fondo = ["#EFEAFE", "#D9CFFC", "#B6A6FF", "#8C75F0", "#5B3FD9"];
  const cod = p => { const e = TR.d(p); return TRC.riesgoCod(e.riesgo, e.impacto); };
  let h = `<section class="tr-card tr-pad"><div class="tr-ch"><h2>Riesgo de salida × impacto</h2><span class="hint">pulsa una casilla para ver a las personas</span></div>
    <div class="tr-9"><div class="tr-9y"><span>Impacto alto</span><span>Impacto medio</span><span>Impacto bajo</span></div><div class="tr-9g">${[2, 1, 0].map(i => ["C", "B", "A"].map((r, ri) => {
      const c = r + i, ps = xs.filter(p => cod(p) === c), sev = ri + i;
      return `<button class="tr-rcell${D.selR === c ? " sel" : ""}" style="background:${fondo[sev]};color:${sev >= 3 ? "#fff" : "#231A3D"}" data-tra="selR" data-c="${c}"><span class="tr-rc">${c}</span><b>${ps.length || "·"}</b>
        <div>${D.nombres && ps.length && ps.length <= 6 ? ps.map(p => `<span class="tr-chip">${drNom(p)}</span>`).join("") : ""}</div></button>`; }).join("")).join("")}</div>
    <div></div><div class="tr-9x"><span>Riesgo bajo</span><span>Riesgo medio</span><span>Riesgo alto</span></div></div>`;
  if (D.selR) { const ps = xs.filter(p => cod(p) === D.selR), [r, i] = [TRC.NIVEL3["CBA".indexOf(D.selR[0])], TRC.NIVEL3[+D.selR[1]]];
    h += `<div class="tr-detalle"><b>Riesgo ${r.toLowerCase()} · Impacto ${i.toLowerCase()} — ${ps.length} ${ps.length === 1 ? "persona" : "personas"}</b>${drTablaP(ps, [["Acción de retención", p => TR.d(p).retencion || "—"]])}</div>`; }
  const crit = xs.filter(p => cod(p) === "A2"), vig = xs.filter(p => ["A0", "A1", "B2", "C2"].includes(cod(p)));
  h += `<div class="tr-g2 tr-ley"><div><b>Probabilidad de salida (riesgo)</b><p>Bajo: persona estable y alineada, sin señales de salida.<br>Medio: podría considerar otras oportunidades si se le presentan.<br>Alto: muy probable que se marche en los próximos 12 meses.</p></div>
    <div><b>Impacto de la salida</b><p>Bajo: sucesor disponible o perfil fácil de reemplazar.<br>Medio: puede no haber sucesor; hasta 3 meses de perturbación.<br>Alto: crítico, difícil de reemplazar y sin sucesor inmediato; más de 6 meses.</p></div></div>
    <p><b>${crit.length}</b> en zona crítica (A2 · riesgo e impacto altos) · <b>${vig.length}</b> en vigilancia (una dimensión alta)</p></section>
    <section class="tr-card tr-pad"><h2>Prioridad de retención · acción a 90 días</h2>${crit.length ? `<div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Responsable</th><th>Unidad</th><th>Riesgo</th><th>Impacto</th><th>Acción registrada</th><th></th></tr></thead><tbody>
      ${crit.map(p => { const e = TR.d(p); return `<tr><td>${esc(p.nombre)}${p.manual ? ` <span class="tr-tag mid">alta manual</span>` : ""}</td><td>${esc(TR.apellidos(drMgr(p)))}</td><td>${esc(p.departamento || "—")}</td><td>${esc(e.riesgo)}</td><td>${esc(e.impacto)}</td><td>${e.retencion ? esc(e.retencion) : `<b class="tr-rojo">SIN ACCIÓN</b>`}</td><td>${drFichaBtn(p)}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="hint">Nadie en zona crítica con los datos recibidos.</p>`}</section>`;
  return h;
}

/* ---------- Competencias ---------- */
function drCompetencias() {
  const { evaluadas } = drSets(drFilas());
  if (!evaluadas.length) return `<p class="empty">Todavía no hay valoraciones enviadas.</p>`;
  const cnt = TRC.COMPS.map(c => { let es = 0, fu = 0, me = 0; evaluadas.forEach(p => { const e = TR.d(p); if (e.star === c.n) es++; if ((e.str || []).includes(c.n)) fu++; if ((e.imp || []).includes(c.n)) me++; }); return { n: c.n, es, fu, me }; });
  const fort = cnt.map(c => [c.n, c.es + c.fu, "g"]).filter(x => x[1]).sort((a, b) => b[1] - a[1]), mej = cnt.map(c => [c.n, c.me, "b"]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  return `<div class="tr-g2"><section class="tr-card tr-pad"><div class="tr-ch"><h2>Fortalezas del equipo</h2><span class="hint">estrella + fortaleza · de más a menos</span></div>${drBarras(fort)}</section>
    <section class="tr-card tr-pad"><div class="tr-ch"><h2>Áreas de mejora del equipo</h2><span class="hint">de más a menos</span></div>${drBarras(mej)}</section></div>
    <details class="tr-card tr-pad"><summary><b>Matriz detallada de competencias</b> <span class="hint">${evaluadas.length} personas</span></summary><div class="tablewrap"><table class="tr-t"><thead><tr><th>Competencia</th><th class="n">Estrella</th><th class="n">Fortaleza</th><th class="n">Mejora</th></tr></thead><tbody>
      ${cnt.sort((a, b) => b.es + b.fu + b.me - (a.es + a.fu + a.me)).map(c => `<tr><td>${esc(c.n)}</td><td class="n">${c.es}</td><td class="n">${c.fu}</td><td class="n">${c.me}</td></tr>`).join("")}</tbody></table></div></details>`;
}

/* ---------- Planes y sucesión ---------- */
function drPlanes(amb) {
  const D = drS(), { activas, evaluadas } = drSets(drFilas());
  const planes = []; activas.forEach(p => { const e = TR.d(p); if (e.noEval) return; ["A", "B"].forEach(k => { if (e["obj" + k] && e["acc" + k]) planes.push({ p, k, obj: e["obj" + k], acc: e["acc" + k], tim: e["tim" + k], pri: e["pri" + k], bud: e["bud" + k], res: e["res" + k] }); }); });
  const cuenta = (arr, fn) => Object.entries(arr.reduce((a, x) => { const k = fn(x); if (k) a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const porAcc = cuenta(planes, x => x.acc), top5 = porAcc.slice(0, 5).map(x => x[0]);
  const fondoN = (n, pr) => (n ? (pr === "Alta" ? "b" : pr === "Media" ? "m" : "g") : "");
  let h = `<div class="tr-g3"><section class="tr-card tr-pad"><h2>Demanda por acción</h2>${drBarras(porAcc.map(([a, n]) => [a, n, ""]))}</section>
    <section class="tr-card tr-pad"><div class="tr-ch"><h2>Acción × prioridad</h2><span class="hint">dónde se concentra la demanda</span></div><table class="tr-t tr-mx"><thead><tr><th></th>${TRC.PRIOS.map(x => `<th class="n">${x}</th>`).join("")}</tr></thead><tbody>
      ${top5.map(a => `<tr><td>${esc(a)}</td>${TRC.PRIOS.map(pr => { const n = planes.filter(x => x.acc === a && x.pri === pr).length; return `<td class="n tr-c-${fondoN(n, pr)}">${n || ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table></section>
    <section class="tr-card tr-pad"><div class="tr-ch"><h2>Reparto por plazo</h2><span class="hint">la carga de desarrollo en el tiempo</span></div>${drBarras(TRC.PLAZOS.map(t => [t, planes.filter(x => x.tim === t).length, ""]))}</section></div>
    <p class="tr-lectura"><b>${planes.length}</b> planes sobre <b>${evaluadas.length}</b> personas · <b>${planes.filter(x => x.bud === "Requiere presupuesto").length}</b> requieren presupuesto · <b>${planes.filter(x => x.pri === "Alta").length}</b> de prioridad alta</p>`;
  const fp = planes.filter(x => (!D.plan.mgr || x.p.evaluador_id === D.plan.mgr) && (!D.plan.q || norm(x.p.nombre).includes(norm(D.plan.q))));
  const grupos = D.ev.map(e => [e, fp.filter(x => x.p.evaluador_id === e.id)]).filter(g => g[1].length).sort((a, b) => b[1].length - a[1].length);
  h += `<section class="tr-card tr-pad"><div class="tr-ch"><h2>Planes de desarrollo</h2><span class="hint">Pulsa un responsable para desplegar sus planes.</span></div>
    <div class="tr-filtros"><select data-trs="plan" data-k="mgr"><option value="">Todos los responsables</option>${D.ev.map(e => `<option value="${e.id}" ${e.id === D.plan.mgr ? "selected" : ""}>${esc(TR.apellidos(e.nombre))}</option>`).join("")}</select>
      <input data-trs="plan" data-k="q" placeholder="Buscar persona…" value="${esc(D.plan.q)}"></div>
    ${grupos.length ? grupos.map(([e, xs]) => `<details class="tr-grupo"><summary><b>${esc(TR.apellidos(e.nombre))}</b> ${xs.length} planes · ${xs.filter(x => x.pri === "Alta").length} alta · ${xs.filter(x => x.bud === "Requiere presupuesto").length} presup.</summary>
      <div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Objetivo</th><th>Acción</th><th>Plazo</th><th>Prio.</th><th>Presup.</th><th>Qué será distinto</th></tr></thead><tbody>
      ${xs.map(x => `<tr><td>${esc(x.p.nombre)} <small>(${x.k})</small></td><td>${esc(x.obj)}</td><td>${esc(x.acc)}</td><td>${esc(x.tim || "—")}</td><td><span class="tr-tag ${x.pri === "Alta" ? "bad" : x.pri === "Media" ? "mid" : "ok"}">${esc(x.pri || "—")}</span></td><td>${x.bud === "Requiere presupuesto" ? "Sí" : "—"}</td><td>${esc(x.res || "")}</td></tr>`).join("")}</tbody></table></div></details>`).join("") : `<p class="hint">Sin planes con ese filtro.</p>`}</section>`;
  const crit = activas.filter(p => { const e = TR.d(p); return !e.noEval && TR.necesitaSucesor(e, p, amb); }).sort((a, b) => (TR.d(a).sucExiste === "Sí") - (TR.d(b).sucExiste === "Sí"));
  h += `<section class="tr-card tr-pad"><div class="tr-ch"><h2>Puestos críticos y sucesión</h2><span class="hint">${crit.filter(p => TR.d(p).sucExiste !== "Sí").length} sin sucesor de ${crit.length} críticos</span></div>
    ${crit.length ? `<div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Puesto</th><th>Responsable</th><th>¿Sucesor/a?</th><th>Quién</th><th>Readiness</th><th></th></tr></thead><tbody>
      ${crit.map(p => { const e = TR.d(p); return `<tr><td>${esc(p.nombre)}</td><td>${esc(p.puesto || "—")}</td><td>${esc(TR.apellidos(drMgr(p)))}</td><td><span class="tr-tag ${e.sucExiste === "Sí" ? "ok" : "bad"}">${e.sucExiste === "Sí" ? "Sí" : "No"}</span></td><td>${esc(e.sucQuien || "—")}</td><td>${esc(e.sucRdy || "—")}</td><td>${drFichaBtn(p)}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="hint">Ningún puesto marcado como crítico todavía.</p>`}</section>`;
  return h;
}

/* ---------- Informe por equipo (un Talent Review) ---------- */
const drCx = (e, ps) => ({ ciclo: drCiclo(), amb: drS().amb, ev: e, personas: ps, mgr: drMgr, ver: p => `data-tra="verFicha" data-id="${p.id}"` });
function drInformes() {
  const D = drS(), ent = D.ev.filter(e => e.entregado);
  if (!ent.length) return `<p class="empty">Todavía no ha enviado nadie. El informe de cada equipo aparece aquí en cuanto su responsable pulsa «Enviar a RR.HH.».</p>`;
  if (!ent.some(e => e.id === D.inf)) D.inf = ent[0].id;
  const e = ent.find(x => x.id === D.inf), ps = D.per.filter(p => p.evaluador_id === e.id);
  return `<div class="tr-filtros"><select data-trs="inf">${ent.map(x => `<option value="${x.id}" ${x.id === e.id ? "selected" : ""}>${esc(x.nombre)}${x.unidad ? " — " + esc(x.unidad) : ""}</option>`).join("")}</select>
    <span class="hint">${ent.length} de ${D.ev.length} equipos enviados</span><span class="tr-sp"></span>
    <button class="btn small" data-tra="imprimirInf">Imprimir el informe</button><button class="btn small ghost" data-tra="imprimirInfTodo">Imprimir con todas las fichas</button></div>
    ${TRI.equipo(drCx(e, ps))}`;
}

/* ---------- Informe por persona (ficha ejecutiva) ---------- */
function drFicha() {
  const D = drS(), todas = drFilas(true), { activas } = drSets(drFilas());
  const lista = activas.length ? activas : todas;
  if (!lista.length) return `<p class="empty">Todavía no hay valoraciones enviadas.</p>`;
  if (!todas.some(p => p.id === D.ficha)) D.ficha = lista[0].id;
  const p = todas.find(x => x.id === D.ficha), e = D.ev.find(x => x.id === p.evaluador_id);
  const opciones = lista.some(x => x.id === p.id) ? lista : [p, ...lista];
  return `<div class="tr-filtros"><select data-trs="ficha">${opciones.map(x => `<option value="${x.id}" ${x.id === p.id ? "selected" : ""}>${esc(x.nombre)}${x.departamento ? " — " + esc(x.departamento) : ""}</option>`).join("")}</select>
    ${e ? `<button class="tr-link" data-tra="verInforme" data-id="${e.id}">Informe del equipo de ${esc(TR.apellidos(e.nombre))} →</button>` : ""}<span class="tr-sp"></span>
    <button class="btn small" data-tra="imprimir">Imprimir / Guardar PDF</button></div>
    ${TRI.persona(drCx(e, []), p)}`;
}

/* ---------- Panel de datos y plan de acción ---------- */
function drPanel(amb) {
  const D = drS(), { activas, evaluadas } = drSets(drFilas()), n = evaluadas.length;
  if (!n) return `<p class="empty">Todavía no hay valoraciones enviadas.</p>`;
  const idx = p => { const e = TR.d(p); return TRC.segIdx(e.perf, e.pot); }, en = is => evaluadas.filter(p => is.includes(idx(p))).length;
  const modas = TRC.SEG.map((s, i) => [i, en([i])]).sort((a, b) => b[1] - a[1])[0];
  const cifra = (v, t, s) => `<div class="tr-cifra"><b>${v}</b><span>${t}</span><small>${s}</small></div>`;
  let h = `<div class="tr-cifras">${cifra(en([8]), "Estrellas", `${pctS(en([8]), n)}% · alto / alto`)}${cifra(en([5, 7]), "Alto·Medio / Medio·Alto", `${pctS(en([5, 7]), n)}% · una banda alta y otra media`)}
    ${cifra(en([1, 3]), "Medio·Bajo / Bajo·Medio", `${pctS(en([1, 3]), n)}% · una banda media y otra baja`)}${cifra(modas[1], "Concentración (moda)", esc(TRC.SEG[modas[0]][0]))}</div>`;
  const top = fn => { const c = {}; evaluadas.forEach(p => fn(TR.d(p)).forEach(x => { if (x) c[x] = (c[x] || 0) + 1; })); const o = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return o ? `<b>${esc(o[0])}</b><small>${o[1]} ${o[1] === 1 ? "mención" : "menciones"}</small>` : "<b>—</b>"; };
  h += `<div class="tr-g3">${[["Competencia estrella", e => [e.star]], ["Fortaleza más repetida", e => e.str || []], ["Área de mejora más repetida", e => e.imp || []]].map(([t, fn]) => `<div class="tr-card tr-pad tr-dest"><span class="tr-eyebrow">${t}</span>${top(fn)}</div>`).join("")}</div>`;
  // Guardarraíles: Alto = casillas 5, 7 y 8 (una banda alta y la otra al menos media); Bajo = casilla 0.
  const tier = p => { const e = TR.d(p); const s = TRC.band(e.perf) + TRC.band(e.pot); return s >= 5 ? "Alto" : s === 2 ? "Bajo" : "Medio"; };
  const veredicto = (t, pc, obj) => (t === "Alto" ? (pc > obj + 8 ? ["warn", "por encima: posible inflación"] : pc < obj - 8 ? ["info", "banquillo corto"] : ["ok", "en línea"])
    : t === "Bajo" ? (pc > obj + 8 ? ["warn", "concentración alta en la base"] : ["ok", "en línea"]) : ["ok", "en línea"]);
  h += `<section class="tr-card tr-pad"><div class="tr-ch"><h2>Guardarraíles de distribución</h2><span class="hint">reparto real del 9-Box frente a una referencia orientativa</span></div>
    ${TRC.GUARDARRAIL.map(([t, obj, col]) => { const v = evaluadas.filter(p => tier(p) === t).length, pc = pctS(v, n), [cl, txt] = veredicto(t, pc, obj);
      return `<div class="tr-gr"><span>${t}</span><div><i style="width:${pc}%;background:${col}"></i><em style="left:${obj}%"></em></div><b>${pc}%</b><small>obj. ${obj}%</small><span class="tr-tag ${cl === "warn" ? "bad" : cl === "info" ? "mid" : "ok"}">${txt}</span></div>`; }).join("")}
    <p class="hint"><b>Alto</b> = una banda alta y la otra al menos media (casillas Alto rendimiento, Futuro líder y Estrella). <b>Bajo</b> = desempeño y potencial bajos. La referencia 20 / 70 / 10 es orientativa para la conversación de calibración, no una cuota; tolerancia ±8 puntos.</p></section>`;
  // Calibración de responsables
  const idxP = p => (TR.d(p).perf + TR.d(p).pot) / 2, media = evaluadas.reduce((s, p) => s + idxP(p), 0) / n;
  const mg = D.ev.map(e => { const ps = evaluadas.filter(p => p.evaluador_id === e.id); if (!ps.length) return null; const m = ps.reduce((s, p) => s + idxP(p), 0) / ps.length;
    return { e, n: ps.length, m, dev: m - media, alto: pctS(ps.filter(p => tier(p) === "Alto").length, ps.length) }; }).filter(Boolean).sort((a, b) => a.dev - b.dev);
  const tend = d => (d >= 0.75 ? ["mid", "Indulgente"] : d <= -0.75 ? ["azul", "Severo"] : ["ok", "En línea"]);
  const rango = Math.max(0.6, ...mg.map(x => Math.abs(x.dev) * 1.18)), pos = d => 50 + d / rango * 50;
  h += `<section class="tr-card tr-pad"><div class="tr-ch"><h2>Calibración de responsables · tendencia de puntuación</h2><span class="hint">media global ${SC.fmt(media, 1)} / 10</span></div>
    ${mg.length < 2 ? `<p class="hint">Se necesita más de un responsable con valoraciones para comparar tendencias.</p>` : `<div class="tr-cal"><div class="tr-cal-band" style="left:${pos(-0.75)}%;width:${pos(0.75) - pos(-0.75)}%"></div><div class="tr-cal-0"></div>
      ${mg.map(x => `<span class="tr-cal-p ${tend(x.dev)[0]}" style="left:${pos(x.dev)}%" title="${esc(x.e.nombre)}: ${x.dev >= 0 ? "+" : ""}${SC.fmt(x.dev, 2)}"></span>`).join("")}</div>
      <div class="tr-cal-x"><span>← puntúa más bajo</span><span>banda «en línea» ±0,75</span><span>puntúa más alto →</span></div>
      <div class="tablewrap"><table class="tr-t"><thead><tr><th>Responsable</th><th class="n">Personas</th><th class="n">Media</th><th class="n">Desv.</th><th class="n">% Alto</th><th>Tendencia</th></tr></thead><tbody>
      ${mg.slice().reverse().map(x => { const [c, t] = tend(x.dev); return `<tr><td>${esc(TR.apellidos(x.e.nombre))}</td><td class="n">${x.n}</td><td class="n">${SC.fmt(x.m, 1)}</td><td class="n">${x.dev >= 0 ? "+" : ""}${SC.fmt(x.dev, 2)}</td><td class="n">${x.alto}%</td><td><span class="tr-tag ${c}">${t}</span></td></tr>`; }).join("")}</tbody></table></div>
      <p class="hint">Índice = media de desempeño y potencial (0-10). Es una señal para <b>moderar la calibración</b>, no un juicio: un equipo puede estar legítimamente por encima o por debajo de la media.</p>`}</section>`;
  const criticos = activas.filter(p => TR.d(p).critRole === "Alto");
  const nv = v => ({ Bajo: 1, Medio: 2, Alto: 3 }[v] || 0);
  const talentos = evaluadas.filter(p => { const e = TR.d(p); return (e.perf >= 8 || e.pot >= 8) && nv(e.riesgo) >= 2 && nv(e.impacto) >= 2; })
    .sort((a, b) => { const s = p => { const e = TR.d(p); return nv(e.riesgo) + nv(e.impacto) + e.perf + e.pot; }; return s(b) - s(a); });
  h += `<div class="tr-g2"><details class="tr-card tr-pad tr-acc-crit" open><summary><b>Roles más críticos</b> <span class="hint">${criticos.length} ${criticos.length === 1 ? "puesto" : "puestos"}</span></summary>
      ${criticos.length ? `<ul class="tr-ul">${criticos.map(p => `<li><b>${esc(p.puesto || "—")}</b> — ${esc(p.nombre)} · ${esc(p.departamento || "")} ${drFichaBtn(p)}</li>`).join("")}</ul>` : `<p class="tr-ok">✓ Ninguno marcado como crítico.</p>`}</details>
    <details class="tr-card tr-pad tr-acc-tal" open><summary><b>Mayores talentos con mayor riesgo</b> <span class="hint">${talentos.length}</span></summary>
      ${talentos.length ? `<ul class="tr-ul">${talentos.map(p => { const e = TR.d(p); return `<li><b>${esc(p.nombre)}</b> · ${esc(p.puesto || "")} · D${e.perf}/P${e.pot} · riesgo ${esc(e.riesgo.toLowerCase())} ${drFichaBtn(p)}</li>`; }).join("")}</ul>` : `<p class="tr-ok">✓ Ninguno ahora mismo.</p>`}</details></div>`;
  h += drTodos(evaluadas, activas, tier);
  return h;
}
/* Todos los Talent Review del ciclo: un resumen por equipo y la tabla completa */
function drTodos(evaluadas, activas, tier) {
  const D = drS(), filtrado = new Set(activas.map(p => p.id));
  const fila = e => {
    const ps = D.per.filter(p => p.evaluador_id === e.id && filtrado.has(p.id)), ev = evaluadas.filter(p => p.evaluador_id === e.id);
    const act = ps.filter(p => !TR.d(p).noEval), pl = act.reduce((n, p) => { const x = TR.d(p); return n + (x.objA || x.accA ? 1 : 0) + (x.objB || x.accB ? 1 : 0); }, 0);
    const crit = act.filter(p => TR.hot(TR.d(p))).length, suc = act.filter(p => { const x = TR.d(p); return TR.necesitaSucesor(x, p, D.amb) && x.sucExiste !== "Sí"; }).length;
    const m = ev.length ? ev.reduce((s, p) => s + (TR.d(p).perf + TR.d(p).pot) / 2, 0) / ev.length : null;
    return `<tr><td><b>${esc(e.nombre)}</b><small>${esc(e.unidad || "")}</small></td><td>${e.entregado ? `<span class="tr-tag ok">Enviado · ${esc(new Date(e.entregado).toLocaleDateString("es-ES"))}</span>` : `<span class="tr-tag">Pendiente</span>`}</td>
      <td class="n">${e.entregado ? ev.length : "—"}</td><td class="n">${m == null ? "—" : SC.fmt(m, 1)}</td><td class="n">${ev.length ? pctS(ev.filter(p => tier(p) === "Alto").length, ev.length) + "%" : "—"}</td>
      <td class="n">${e.entregado ? crit : "—"}</td><td class="n">${e.entregado ? pl : "—"}</td><td class="n">${e.entregado ? suc : "—"}</td>
      <td>${e.entregado ? `<button class="tr-link" data-tra="verInforme" data-id="${e.id}">informe →</button>` : ""}</td></tr>`;
  };
  const pill = v => (v ? `<span class="tr-tag ${v === "Alto" ? "bad" : v === "Medio" ? "mid" : "ok"}">${esc(v)}</span>` : "—");
  return `<section class="tr-card tr-pad"><div class="tr-ch"><h2>Todos los Talent Review</h2><span class="hint">un equipo por responsable · ${D.ev.filter(e => e.entregado).length} de ${D.ev.length} enviados</span></div>
    <div class="tablewrap"><table class="tr-t"><thead><tr><th>Responsable</th><th>Estado</th><th class="n">Valoradas</th><th class="n">Índice medio</th><th class="n">% Alto</th><th class="n">Retención crítica</th><th class="n">Planes</th><th class="n">Sin sucesor</th><th></th></tr></thead>
    <tbody>${D.ev.map(fila).join("")}</tbody></table></div></section>
    <details class="tr-card tr-pad" ${D.todasAbierta ? "open" : ""} id="drTodas"><summary><b>Todas las personas valoradas</b> <span class="hint">${activas.length} · desempeño, potencial, riesgo, siguiente paso y plan de cada una</span></summary>
    <div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Responsable</th><th class="n">Desemp.</th><th class="n">Pot.</th><th>9-Box</th><th>Riesgo</th><th>Impacto</th><th>Siguiente paso</th><th>Plan principal</th><th>Sucesor/a</th><th></th></tr></thead><tbody>
    ${activas.map(p => { const e = TR.d(p), si = TRC.segIdx(e.perf, e.pot);
      return `<tr><td><b>${esc(p.nombre)}</b><small>${esc([p.puesto, p.departamento].filter(Boolean).join(" · "))}</small></td><td>${esc(TR.apellidos(drMgr(p)))}</td>
        ${e.noEval ? `<td colspan="7" class="hint">No evaluable: ${esc(e.noEvalWhy || "")}</td>` : `<td class="n">${e.perf || "—"}</td><td class="n">${e.pot || "—"}</td><td>${si >= 0 ? esc(TRC.SEG[si][0]) : "—"}</td><td>${pill(e.riesgo)}</td><td>${pill(e.impacto)}</td><td>${esc(e.promo || "—")}</td>
        <td>${e.accA ? esc(e.accA) + `<small>${esc(e.timA || "")}</small>` : "—"}</td>`}<td>${TR.necesitaSucesor(e, p, D.amb) && !e.noEval ? (e.sucExiste === "Sí" ? esc(e.sucQuien || "Sí") : `<span class="tr-tag bad">No</span>`) : ""}</td><td>${drFichaBtn(p)}</td></tr>`; }).join("")}</tbody></table></div></details>`;
}

/* =================== acciones =================== */
function drResumen() {
  const D = drS(), c = drCiclo(), { activas, evaluadas } = drSets(drFilas()), ent = D.ev.filter(e => e.entregado).length;
  const hot = activas.filter(p => TR.hot(TR.d(p))), sin = hot.filter(p => !(TR.d(p).retencion || "").trim()).length;
  const planes = []; activas.forEach(p => { const e = TR.d(p); ["A", "B"].forEach(k => { if (e["obj" + k] && e["acc" + k]) planes.push(e); }); });
  const pl = []; activas.forEach(p => { const e = TR.d(p); ["A", "B"].forEach(k => { if (e["obj" + k] && e["acc" + k]) pl.push({ bud: e["bud" + k], pri: e["pri" + k] }); }); });
  const crit = activas.filter(p => { const e = TR.d(p); return !e.noEval && TR.necesitaSucesor(e, p, D.amb); });
  return `${c.nombre.toUpperCase()} — RESUMEN EJECUTIVO (${new Date().toLocaleDateString("es-ES")})

· Recepción: ${ent} de ${D.ev.length} responsables · ${evaluadas.length} personas evaluadas (${activas.filter(p => TR.d(p).noEval).length} no evaluables).
· Desempeño: ${pctS(evaluadas.filter(p => TR.d(p).perf >= 8).length, evaluadas.length)}% en banda alta.
· Retención: ${hot.length} personas en zona crítica (riesgo e impacto altos)${sin ? `, ${sin} SIN acción registrada` : ""}.
· Desarrollo: ${pl.length} planes; ${pl.filter(x => x.bud === "Requiere presupuesto").length} requieren presupuesto; ${pl.filter(x => x.pri === "Alta").length} de prioridad alta.
· Sucesión: ${crit.length} puestos críticos; ${crit.filter(p => TR.d(p).sucExiste !== "Sí").length} sin sucesor identificado.`;
}
/* Vista previa del correo del ciclo; lo que se cambia va a dr_ciclos.config.correo */
function drVistaCorreo(n, alEnviar) {
  const c = drCiclo(), D = drS(), e0 = D.ev.find(e => !e.entregado) || D.ev[0];
  abrirVistaCorreo({ titulo: c.nombre, modo: "desarrollo", info: {}, limite: c.fecha_limite, ciclo: true,
    personas: e0 ? D.per.filter(p => p.evaluador_id === e0.id).length : 0, ejemplo: e0 ? e0.nombre : "", aj: (c.config || {}).correo || {}, n,
    alGuardar: async aj => { const cfg = Object.assign({}, c.config || {}, { correo: aj }); const r = await sb.from("dr_ciclos").update({ config: cfg }).eq("id", c.id); if (r.error) throw r.error; c.config = cfg; },
    alEnviar });
}
async function drEnviar(ids) {
  if (!ids.length) return toast("Nadie con correo pendiente");
  const D = drS();
  let enviados = 0; const mal = [];
  try {
    for (let i = 0; i < ids.length; i += LOTE) {
      const r = await enviarPorLaPlataforma(ids.slice(i, i + LOTE), "desarrollo");
      enviados += r.enviados || 0;
      (r.resultados || []).forEach(x => { if (x.ok) { const e = D.ev.find(y => y.id === x.id); if (e) e.enviado = new Date().toISOString(); } else mal.push(x); });
      if (mal.some(x => x.motivo === "LIMITE_DIARIO")) break;
    }
    D.msg = `${enviados} de ${ids.length} correos enviados.` + (mal.length ? ` Sin enviar: ${mal.map(x => `${TR.apellidos((D.ev.find(y => y.id === x.id) || {}).nombre)} (${motivoLegible(x.motivo)})`).join("; ")}.` : "");
  } catch (err) { D.msg = `${enviados ? enviados + " enviados. " : ""}No se ha podido enviar: ` + err.message; }
}
async function drCopiar(txt, ok) {
  try { await navigator.clipboard.writeText(txt); toast(ok || "Copiado"); }
  catch (e) { await confirmar({ titulo: "Copia este texto", texto: txt, ok: "Cerrar", no: null }); }
}
function drParsear(txt) {
  return txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => l.split(l.includes("\t") ? "\t" : ";").map(x => x.trim()))
    .filter((c, i) => !(i === 0 && /nombre/i.test(c[0])));
}
async function drCrearEquipos(lista) {
  // lista: [{ resp, email, unidad, puesto, personas: [{nombre, puesto, departamento, categoria, ant_compania, ant_puesto, id_empleado}] }]
  const D = drS(); let nE = 0, nP = 0;
  for (const g of lista) {
    let ev = D.ev.find(e => norm(e.nombre) === norm(g.resp));
    if (!ev) {
      const r = await sb.from("dr_evaluadores").insert({ ciclo_id: D.ciclo, nombre: g.resp, email: g.email || null, unidad: g.unidad || null, puesto: g.puesto || null, codigo: SC.codigoInvitacion() }).select().single();
      if (r.error) { toast("No se ha podido crear a " + g.resp + ": " + r.error.message); continue; }
      ev = r.data; D.ev.push(ev); nE++;
    } else if (g.email && !ev.email) { await sb.from("dr_evaluadores").update({ email: g.email }).eq("id", ev.id); ev.email = g.email; }
    const nuevas = g.personas.filter(p => !D.per.some(x => x.evaluador_id === ev.id && norm(x.nombre) === norm(p.nombre)))
      .map(p => Object.assign({ ciclo_id: D.ciclo, evaluador_id: ev.id, datos: {}, estado: "borrador", manual: false }, p));
    if (nuevas.length) { const r = await sb.from("dr_personas").insert(nuevas).select(); if (r.error) toast("Error al crear personas: " + r.error.message); else { D.per.push(...r.data); nP += r.data.length; } }
  }
  D.ev.sort((a, b) => a.nombre.localeCompare(b.nombre)); D.per.sort((a, b) => a.nombre.localeCompare(b.nombre));
  D.msg = `${nE} ${nE === 1 ? "responsable nuevo" : "responsables nuevos"} · ${nP} ${nP === 1 ? "persona añadida" : "personas añadidas"}.`;
}
const ACCIONES_DR = {
  async recargar() { const D = drS(); D.amb = null; D.msg = ""; },
  vista(b) { drS().vista = b.dataset.v; drS().msg = ""; },
  nombres() { drS().nombres = !drS().nombres; },
  limpiar() { drS().f = { dep: "", cat: "", mgr: "", q: "" }; },
  sel9(b) { const D = drS(), i = +b.dataset.i; D.sel9 = D.sel9 === i ? null : i; },
  selR(b) { const D = drS(); D.selR = D.selR === b.dataset.c ? null : b.dataset.c; },
  verFicha(b) { const D = drS(); D.ficha = b.dataset.id; D.vista = "ficha"; if (!drFilas().some(p => p.id === D.ficha)) D.f = { dep: "", cat: "", mgr: "", q: "" }; window.scrollTo(0, 0); },
  nuevoCiclo(b) { b.closest("details").open = false; drS().nuevo = true; },
  cancelarNuevo() { drS().nuevo = false; },
  async estadoCiclo(b) {
    b.closest("details").open = false; const c = drCiclo(), nuevo = c.estado === "abierto" ? "cerrado" : "abierto";
    if (!(await confirmar({ titulo: nuevo === "cerrado" ? "¿Cerrar el ciclo?" : "¿Reabrir el ciclo?", texto: nuevo === "cerrado" ? "Los responsables ya no podrán cambiar ni enviar valoraciones. Podrán seguir consultándolas." : "Los responsables podrán volver a cambiar y enviar sus valoraciones.", ok: nuevo === "cerrado" ? "Cerrar ciclo" : "Reabrir" }))) return false;
    const { error } = await sb.from("dr_ciclos").update({ estado: nuevo }).eq("id", c.id); if (error) return toast(error.message);
    c.estado = nuevo;
  },
  async borrarCiclo(b) {
    b.closest("details").open = false; const c = drCiclo();
    if (!(await confirmar({ titulo: `¿Borrar «${c.nombre}»?`, texto: `Se borran los ${drS().ev.length} responsables, las ${drS().per.length} personas y todas sus valoraciones. No se puede deshacer.`, ok: "Borrar", peligro: true, escribe: "BORRAR" }))) return false;
    const { error } = await sb.from("dr_ciclos").delete().eq("id", c.id); if (error) return toast(error.message);
    const D = drS(); D.ciclos = D.ciclos.filter(x => x.id !== c.id); D.ciclo = D.ciclos.length ? D.ciclos[0].id : null; await drCargarCiclo(); toast("Ciclo borrado");
  },
  async cargarPlantilla() {
    const filas = drParsear(($("drPlantilla") || {}).value || ""); if (!filas.length) return toast("Pega primero la plantilla");
    const num = v => { const x = parseFloat(String(v || "").replace(",", ".")); return isNaN(x) ? null : x; };
    const malas = filas.filter(c => !c[0] || !c[7]); if (malas.length) return toast(`${malas.length} ${malas.length === 1 ? "fila no tiene" : "filas no tienen"} nombre o responsable`);
    const g = {}; filas.forEach(c => { const k = norm(c[7]); g[k] = g[k] || { resp: c[7], email: (c[8] || "").toLowerCase(), unidad: c[2] || "", personas: [] };
      g[k].personas.push({ nombre: c[0], puesto: c[1] || null, departamento: c[2] || null, categoria: c[3] || null, ant_compania: num(c[4]), ant_puesto: num(c[5]), id_empleado: c[6] || null }); });
    await drCrearEquipos(Object.values(g));
  },
  async desdeTiendas() {
    const tiendas = S.todas && S.todas.length ? S.todas : S.tiendas, g = [];
    tiendas.forEach(t => {
      const eq = equipoDe(t), sms = eq.filter(x => x.puesto === "Store Manager"), asms = eq.filter(x => x.puesto === "Assistant Store Manager");
      const rm = S.perfiles.find(p => p.id === t.rm_id);
      if (rm && sms.length) g.push({ resp: rm.nombre, unidad: rm.zona || "Regional", puesto: "Regional Manager", personas: sms.map(x => ({ nombre: x.nombre, puesto: "Store Manager", departamento: t.nombre, categoria: "Store Manager" })) });
      if (sms[0] && asms.length) g.push({ resp: sms[0].nombre, email: sms[0].email || "", unidad: t.nombre, puesto: "Store Manager", personas: asms.map(x => ({ nombre: x.nombre, puesto: "Assistant Store Manager", departamento: t.nombre, categoria: "Assistant Store Manager" })) });
    });
    if (!g.length) return toast("Las tiendas no tienen Store Managers en su equipo. Añádelos en Usuarios y tiendas → Tiendas y equipos de tienda.");
    const fus = {}; g.forEach(x => { const k = norm(x.resp); if (fus[k]) fus[k].personas.push(...x.personas); else fus[k] = x; });
    await drCrearEquipos(Object.values(fus));
  },
  enviarCorreo(b) { const id = b.dataset.id; drVistaCorreo(1, async () => { await drEnviar([id]); pintar(); }); return false; },
  enviarTodos() {
    const D = drS(), ids = D.ev.filter(e => !e.entregado && e.email).map(e => e.id);
    if (!ids.length) { toast("Nadie con correo pendiente"); return false; }
    drVistaCorreo(ids.length, async () => { await drEnviar(ids); pintar(); });
    return false;
  },
  correo() { drVistaCorreo(0, null); return false; },
  async dePersonas() {
    const D = drS(), amb = D.amb, A = TRC.AMBITO[amb], resps = selPElegidos("dr-" + amb, drTieneEquipo);
    if (!resps.length) return toast("Marca al menos a un responsable");
    const def = ($("drCat") || {}).value || A.categorias[A.categorias.length - 1];
    await drCrearEquipos(resps.map(r => ({ resp: drNombre(r), email: r.correo || "", unidad: r.departamento || r.ubicacion || "", puesto: r.puesto || null,
      personas: drEquipo(r).map(p => ({ nombre: drNombre(p), puesto: p.puesto || null, departamento: p.departamento || p.ubicacion || null,
        categoria: drCategoria(p, A, def), ant_compania: drAnios(p.fecha_alta), ant_puesto: null, id_empleado: p.id || null })) })));
    selP("dr-" + amb).pers = []; selP("dr-" + amb).grupos = [];
  },
  async copiarEnlace(b) { const e = drS().ev.find(x => x.id === b.dataset.id); await drCopiar(`${drEnlace(e)}\nCódigo: ${e.codigo}`, "Enlace y código copiados"); return false; },
  async acuse(b) {
    const e = drS().ev.find(x => x.id === b.dataset.id), ps = drS().per.filter(p => p.evaluador_id === e.id), c = drCiclo();
    await drCopiar(`Acuse de recibo — ${c.nombre}\nResponsable: ${e.nombre}\nValoraciones recibidas: ${ps.filter(p => !TR.d(p).baja).length} (${ps.filter(p => TR.d(p).baja).length} salidas comunicadas)\nEnviado: ${new Date(e.entregado).toLocaleString("es-ES")}\nGracias por completarlo en plazo.\nRR.HH.`, "Acuse copiado"); return false;
  },
  async recordatorio() {
    const D = drS(), c = drCiclo(), pend = D.ev.filter(e => !e.entregado);
    await drCopiar(`Asunto: Recordatorio · ${c.nombre} — valoración pendiente\n\nHola,\n\nTodavía no hemos recibido la valoración de tu equipo para ${c.nombre}.\nEntra con tu código, complétala y pulsa «Enviar a RR.HH.»${c.fecha_limite ? ` antes del ${trFecha(c.fecha_limite)}` : ""}.\nSi tienes cualquier duda, responde a este correo.\n\nGracias,\nRR.HH.\n\n— Pendientes a día de hoy (${pend.length}): ${pend.map(e => e.nombre + (e.email ? ` <${e.email}>` : "")).join("; ")}`, "Recordatorio copiado"); return false;
  },
  async quitarEv(b) {
    const D = drS(), e = D.ev.find(x => x.id === b.dataset.id);
    if (!(await confirmar({ titulo: `¿Quitar a ${e.nombre}?`, texto: "Se borran su código, su equipo en este ciclo y las valoraciones que haya hecho.", ok: "Quitar", peligro: true }))) return false;
    const { error } = await sb.from("dr_evaluadores").delete().eq("id", e.id); if (error) return toast(error.message);
    D.ev = D.ev.filter(x => x.id !== e.id); D.per = D.per.filter(p => p.evaluador_id !== e.id);
  },
  csv() {
    const D = drS(), ent = new Set(D.ev.filter(e => e.entregado).map(e => e.id));
    log(`Exportación del maestro de Talent Review: ${drCiclo().nombre}`);
    trCsv(D.per.filter(p => ent.has(p.evaluador_id)), `${drCiclo().nombre.replace(/\W+/g, "_")}_MAESTRO.csv`,
      [["Responsable", p => drMgr(p)], ["IDEmpleado", p => p.id_empleado], ["FechaEnvio", p => { const e = D.ev.find(x => x.id === p.evaluador_id); return e && e.entregado ? new Date(e.entregado).toLocaleDateString("es-ES") : ""; }]]);
    return false;
  },
  async resumen(b) { b.closest("details") && (b.closest("details").open = false); await drCopiar(drResumen(), "Resumen ejecutivo copiado"); return false; },
  verInforme(b) { const D = drS(); D.inf = b.dataset.id; D.vista = "informes"; window.scrollTo(0, 0); },
  imprimirInf() { const D = drS(), e = D.ev.find(x => x.id === D.inf); TRI.imprimir(TRI.equipo(Object.assign(drCx(e, D.per.filter(p => p.evaluador_id === e.id)), { ver: null }))); return false; },
  imprimirInfTodo() { const D = drS(), e = D.ev.find(x => x.id === D.inf), ps = D.per.filter(p => p.evaluador_id === e.id), cx = Object.assign(drCx(e, ps), { ver: null });
    TRI.imprimir(TRI.equipo(cx) + ps.map(p => TRI.persona(cx, p)).join("")); return false; },
  imprimir(b) { const d = b.closest("details"); if (d) d.open = false;
    const art = drS().vista === "ficha" && document.querySelector("#drVista .tr-inf-p"); if (art) { TRI.imprimir(art.outerHTML); return false; } const v = $("drVista"); if (v) trImprimir(`<div class="tr tr-hr">${v.innerHTML}</div>`); return false; },
  async ejemplo() { await drEjemplo(); }
};
document.addEventListener("click", async ev => {
  if (!S.me || S.modulo !== "desarrollo") return;
  const b = ev.target.closest("[data-tra]"); if (!b || b.disabled) return;
  const fn = ACCIONES_DR[b.dataset.tra]; if (!fn) return;
  ev.preventDefault();
  const r = await fn(b); if (r !== false) pintar();
});
document.addEventListener("change", async ev => {
  const t = ev.target; if (!S.me || S.modulo !== "desarrollo" || !t.dataset.trs) return;
  const D = drS(), k = t.dataset.trs;
  if (k === "ciclo") { D.ciclo = t.value; await drCargarCiclo(); }
  else if (k === "f" && t.tagName === "SELECT") D.f[t.dataset.k] = t.value;
  else if (k === "plan" && t.tagName === "SELECT") D.plan[t.dataset.k] = t.value;
  else if (k === "ficha") D.ficha = t.value;
  else if (k === "inf") D.inf = t.value;
  else if (k === "decision") {
    const clave = t.dataset.clave, est = t.value, prev = D.dec.find(d => d.clave === clave);
    const r = prev ? await sb.from("dr_decisiones").update({ estado: est, actualizado: new Date().toISOString() }).eq("id", prev.id)
                   : await sb.from("dr_decisiones").insert({ ciclo_id: D.ciclo, clave, estado: est }).select().single();
    if (r.error) return toast(r.error.message);
    if (prev) prev.estado = est; else D.dec.push(r.data);
    D.colaAbierta = true;
  } else return;
  pintar();
});
document.addEventListener("input", ev => {
  const t = ev.target; if (!S.me || S.modulo !== "desarrollo" || !t.dataset.trs || t.tagName !== "INPUT") return;
  const D = drS(); (t.dataset.trs === "plan" ? D.plan : D.f)[t.dataset.k] = t.value;
  clearTimeout(drS()._t); drS()._t = setTimeout(() => { pintar(); const i = document.querySelector(`input[data-trs="${t.dataset.trs}"][data-k="${t.dataset.k}"]`); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 350);
});
document.addEventListener("toggle", ev => { if (ev.target.id === "drCola") drS().colaAbierta = ev.target.open; }, true);
document.addEventListener("submit", async ev => {
  if (ev.target.id !== "drNuevo") return;
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target)), D = drS();
  const r = await sb.from("dr_ciclos").insert({ nombre: f.nombre.trim(), anio: +f.anio, ambito: D.amb, fecha_limite: f.fecha || null, estado: "abierto", config: {} }).select().single();
  if (r.error) { toast(r.error.message); return; }
  D.ciclos.unshift(r.data); D.ciclo = r.data.id; D.nuevo = false; D.vista = "recepcion"; await drCargarCiclo(); pintar();
});

/* Modo demostración: un ciclo con datos inventados para ver el panel con respuestas */
async function drEjemplo() {
  const D = drS(), amb = D.amb, A = TRC.AMBITO[amb], rnd = a => a[Math.floor(Math.random() * a.length)];
  const r = await sb.from("dr_ciclos").insert({ nombre: `Talent Review ${new Date().getFullYear()} · ejemplo`, anio: new Date().getFullYear(), ambito: amb, estado: "abierto", config: {} }).select().single();
  if (r.error) return toast(r.error.message);
  D.ciclos.unshift(r.data); D.ciclo = r.data.id; D.nuevo = false; await drCargarCiclo();
  const ap = ["GARCÍA", "MARTÍN", "LÓPEZ", "SÁNCHEZ", "PÉREZ", "GÓMEZ", "RUIZ", "DÍAZ", "MORENO", "ÁLVAREZ", "ROMERO", "NAVARRO", "TORRES", "DOMÍNGUEZ", "VÁZQUEZ", "RAMOS", "GIL", "SERRANO", "BLANCO", "MOLINA"];
  const no = ["ANA", "LUIS", "MARTA", "JAVIER", "LUCÍA", "PABLO", "SARA", "DAVID", "ELENA", "SERGIO", "NURIA", "IVÁN", "CLARA", "RAÚL", "PAULA", "ÓSCAR"];
  const uds = amb === "retail" ? ["Tienda Centro", "Tienda Norte", "Tienda Sur", "Tienda Este"] : ["Comercial", "Marketing", "Finanzas", "Operaciones"];
  const grupos = uds.map((u, i) => ({ resp: `${ap[i * 3]} ${ap[i * 3 + 1]}, ${no[i]}`, unidad: u, personas: Array.from({ length: 6 }, (_, j) => ({
    nombre: `${rnd(ap)} ${rnd(ap)}, ${rnd(no)}`, puesto: amb === "retail" ? (j === 0 ? "Store Manager" : "Assistant Store Manager") : rnd(["Key Account Manager", "Analista", "Responsable de área", "Técnico", "Coordinador/a"]),
    departamento: u, categoria: amb === "retail" ? (j === 0 ? "Store Manager" : "Assistant Store Manager") : rnd(A.categorias), ant_compania: Math.round(Math.random() * 12 * 10) / 10, ant_puesto: Math.round(Math.random() * 5 * 10) / 10 })) }));
  await drCrearEquipos(grupos);
  for (const e of D.ev) {
    const ps = D.per.filter(p => p.evaluador_id === e.id);
    for (const p of ps) {
      const perf = rnd([4, 5, 5, 6, 6, 6, 7, 7, 8, 9]), pot = rnd([3, 4, 5, 5, 6, 6, 7, 8, 9]), cs = TRC.COMPS.map(c => c.n).sort(() => Math.random() - 0.5);
      const d = Object.assign(TR.vacio(), { perf, pot, evP: "En el segundo trimestre superó su objetivo un 12 % y cerró tres proyectos en plazo.", evO: "En marzo asumió la coordinación de un proyecto nuevo sin que se lo pidieran y lo sacó adelante.",
        justP: perf >= 8 ? "Fue la única persona del equipo que mantuvo el resultado durante la reorganización." : "", justO: pot >= 8 ? "Lideró a dos compañeros sin tener el puesto formal." : "",
        star: cs[0], str: [cs[1]], imp: [cs[2]], promo: rnd(TRC.PROMO), critRole: rnd(["Bajo", "Medio", "Medio", "Alto"]), riesgo: rnd(["Bajo", "Bajo", "Medio", "Alto"]), impacto: rnd(["Bajo", "Medio", "Alto"]),
        objA: TRC.comp(cs[2]).obj, accA: TRC.comp(cs[2]).acc, timA: rnd(TRC.PLAZOS), priA: rnd(TRC.PRIOS), budA: rnd(TRC.PRESUP), resA: "Presentará su plan sin apoyo al comité.", talked: rnd(["Sí", "No"]),
        sucExiste: rnd(["Sí", "No"]), ambicion: rnd(TRC.AMBICION)[0], carrera: rnd(TRC.CARRERA) });
      if (TR.hot(d)) d.retencion = Math.random() > 0.4 ? "Conversación de carrera con dirección antes de fin de mes." : "";
      await sb.from("dr_personas").update({ datos: d, estado: "enviada" }).eq("id", p.id); p.datos = d; p.estado = "enviada";
    }
    const enc = { t: rnd(["Entre 5 y 10", "Entre 10 y 20"]), sobra: rnd(["", "Las preguntas de ambición se solapan un poco.", ""]), falta: rnd(["", "Poder ver la valoración del año pasado.", ""]) };
    const ent = new Date().toISOString(); await sb.from("dr_evaluadores").update({ entregado: ent, encuesta: enc }).eq("id", e.id); e.entregado = ent; e.encuesta = enc;
  }
  D.msg = "Ciclo de ejemplo creado con datos inventados.";
}
