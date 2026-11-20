/* =====================================================================
   Pippole · Pruebas de capacidad (0.39.0) · apartado y pantalla de invitado

   - Apartado «capacidad» (solo RR.HH.): pestañas capnueva (crear y enviar),
     capcurso (en curso y resultados) y capcatalogo (probar cada prueba).
   - Cada envío es una campaña de tipo «psico» con plantilla «cap»;
     campanas.config = { version: 1, capacidad: true, juegos: [...], bateria,
     extra (1 o 1.5), cierre, externos, correo }.
   - Cada persona recibe un código (invitaciones, con nombre y correo) y hace
     las pruebas seguidas. El avance se guarda en el navegador por si se
     corta; al terminar se envía todo con invitacion_responder:
     respuestas = { v: 1, juegos: {id: resultado}, extra, dispositivo, inicio, fin, reinicios }.
   - Sin migración: usa campanas e invitaciones tal como están.
   ===================================================================== */

SC.CONFIG.plantillas.push({ id: "cap", tipo: "psico", capacidad: true, nombre: "Pruebas de capacidad", preguntas: [], oculto: false });
const capEsCampana = c => !!c && c.tipo === "psico" && c.plantilla === "cap";
const capCampanas = () => (S.campanas || []).filter(capEsCampana).sort((a, b) => (a.creado < b.creado ? 1 : -1));
const capCfg = c => (c && c.config) || {};
function capN() {
  return (S.capN = S.capN || { bat: "retail", juegos: CAP_BATERIAS.retail.juegos.slice(), titulo: "", origen: "personas", lista: "", extra: false, cierre: "", correo: {} });
}
function capResumenTab(id) {
  const cs = capCampanas(), inv = (S.invitaciones || []).filter(i => cs.some(c => c.id === i.campana_id));
  if (id === "capcatalogo") return `${Object.keys(CAPJ).length} pruebas · baterías retail y oficina`;
  if (id === "capnueva") return "Batería retail u oficina, o a medida";
  return cs.length ? `${cs.filter(c => c.estado === "abierta").length} abiertas · ${inv.filter(i => i.estado === "respondida").length} de ${inv.length} terminadas` : "Sin pruebas enviadas todavía";
}
function capInfo(js) { js = (js || []).filter(j => CAPJ[j]); return { min: capMinutos(js), n: js.length, pc: js.some(j => CAPJ[j].pc) }; }

/* ---------- Lado de quien hace las pruebas ---------- */
const CAPI = {};
function capClave() { return "pp-cap-" + INV.codigo; }
function capLeer() { try { return JSON.parse(localStorage.getItem(capClave()) || "null") || {}; } catch (e) { return {}; } }
function capGuardar(x) { try { localStorage.setItem(capClave(), JSON.stringify(x)); } catch (e) {} }
function pintarCapInvitado() {
  const d = INV.datos, cfg = d.config || {}, juegos = (cfg.juegos || []).filter(j => CAPJ[j]);
  const caja = cuerpo => { $("app").innerHTML = `<div class="guest cap-guest"><div class="esquina"><span class="chipseb">${logoSEB(34)}</span></div><div class="cap-card">${cuerpo}</div></div>`; };
  if (d.estado === "respondida") return caja(`<h1>Pruebas completadas</h1><p class="sub">Ya las hiciste y se enviaron a RR.HH. Gracias por tu tiempo.</p>`);
  if (d.campana_estado === "cerrada") return caja(`<h1>Estas pruebas ya están cerradas</h1><p class="sub">Si crees que es un error, escribe a quien te envió el código.</p>`);
  if (!juegos.length) return caja(`<h1>No hay pruebas en este código</h1><p class="sub">Escribe a quien te lo envió.</p>`);
  const prog = capLeer();
  // Una prueba que se empezó y no se terminó (se cerró o recargó la página) cuenta como reinicio.
  if (prog.enCurso && !(prog.hechos || {})[prog.enCurso]) { prog.reinicios = prog.reinicios || {}; prog.reinicios[prog.enCurso] = (prog.reinicios[prog.enCurso] || 0) + 1; prog.enCurso = null; capGuardar(prog); }
  const hechos = prog.hechos || {}, faltan = juegos.filter(j => !hechos[j]);
  const pc = juegos.some(j => CAPJ[j].pc), nombre = (d.destinatario || "").split(" ")[0];
  if (!faltan.length) return capEntregar();
  caja(`<span class="cap-paso">${esc(d.titulo || "Pruebas de capacidad")}</span>
    <h1>${nombre ? "Hola, " + esc(nombre) : "Hola"}</h1>
    <p class="sub">Vas a hacer ${juegos.length} pruebas cortas, de unos ${capMinutos(juegos)} minutos en total${cfg.extra > 1 ? ", y tienes un 50 % más de tiempo en las que tienen límite" : ""}. No hace falta prepararlas ni saber nada antes.</p>
    <ol class="cap-lista-ini">${juegos.map(j => `<li class="${hechos[j] ? "hecha" : ""}"><b>${esc(CAPJ[j].t)}</b><span>${esc(CAPJ[j].mide)} · ${CAPJ[j].min} min${hechos[j] ? " · hecha" : ""}</span></li>`).join("")}</ol>
    <div class="cap-caja"><b>Antes de empezar</b><p>Busca un sitio tranquilo y sin interrupciones${pc ? ", mejor en ordenador" : ""}. Cada prueba se hace una vez: si cierras la página a mitad, esa prueba vuelve a empezar y queda anotado. Entre una y otra puedes descansar.</p></div>
    <div class="cap-fila"><button class="btn primary" id="capGo">${Object.keys(hechos).length ? "Seguir" : "Empezar"}</button></div>`);
  $("capGo").addEventListener("click", () => {
    const p = capLeer(); if (!p.inicio) { p.inicio = new Date().toISOString(); capGuardar(p); }
    caja(`<div id="capJ"></div>`);
    CAPI.rep = capReproducir($("capJ"), { juegos, extra: cfg.extra > 1 ? 1.5 : 1, semilla: capSemilla(INV.codigo), hechos,
      alEmpezarJuego: id => { const p2 = capLeer(); p2.enCurso = id; capGuardar(p2); },
      alTerminarJuego: (id, res) => { const p2 = capLeer(); p2.hechos = Object.assign(p2.hechos || {}, { [id]: res }); p2.enCurso = null; capGuardar(p2); },
      alFin: () => capEntregar() });
  });
}
function capSemilla(cod) { let h = 2166136261; for (const ch of String(cod) + Date.now()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
async function capEntregar() {
  const p = capLeer(), d = INV.datos, cfg = d.config || {};
  const juegos = (cfg.juegos || []).filter(j => CAPJ[j]), res = {};
  juegos.forEach(j => { if (p.hechos && p.hechos[j]) res[j] = Object.assign({}, p.hechos[j], { reinicios: (p.reinicios || {})[j] || 0 }); });
  const resp = { v: 1, juegos: res, extra: cfg.extra > 1 ? 1.5 : 1, inicio: p.inicio || null, fin: new Date().toISOString(),
    dispositivo: { ancho: window.innerWidth, tactil: "ontouchstart" in window || navigator.maxTouchPoints > 0 } };
  // La nota explicativa está en el código (CAP_NOTAS): no hace falta guardarla.
  // invitacion_responder acepta hasta 20 000 caracteres: si no cabe, sobra el detalle en bruto.
  Object.values(res).forEach(x => { delete x.nota; });
  if (JSON.stringify(resp).length > 19000) Object.values(res).forEach(x => { delete x.datos; });
  $("app").innerHTML = `<div class="guest cap-guest"><div class="cap-card"><h1>Enviando…</h1><p class="sub">Un momento.</p></div></div>`;
  const { error } = await sb.rpc("invitacion_responder", { p_codigo: INV.codigo, p_respuestas: resp });
  if (error) {
    $("app").innerHTML = `<div class="guest cap-guest"><div class="cap-card"><h1>No se ha podido enviar</h1><p class="sub">${esc(traducirError(error))}</p><p class="sub">Tus resultados siguen guardados en este navegador. Comprueba la conexión y vuelve a intentarlo.</p><div class="cap-fila"><button class="btn primary" id="capRe">Volver a intentarlo</button></div></div></div>`;
    $("capRe").addEventListener("click", capEntregar);
    return;
  }
  try { localStorage.removeItem(capClave()); } catch (e) {}
  INV.datos.estado = "respondida";
  $("app").innerHTML = `<div class="guest cap-guest"><div class="cap-card"><h1>Gracias, ya está</h1><p class="sub">Tus pruebas se han enviado a RR.HH. No hace falta que hagas nada más.</p></div></div>`;
}

/* ---------- Apartado de RR.HH. ---------- */
function pintarCapacidad(tab) {
  if (!esAdmin()) { $("vista").innerHTML = `<div class="page"><p class="empty">Este apartado es solo para RR.HH.</p></div>`; return; }
  if (tab === "capcatalogo") return capPintarCatalogo();
  if (tab === "capcurso") return capPintarCurso();
  return capPintarNueva();
}
const capAviso = `<p class="hint cap-legal">Sin baremo todavía: las puntuaciones sirven para comparar dentro de una misma campaña, nunca para decidir solas. Antes de usarlas en selección real hace falta un piloto con personas del puesto, un estudio de sesgos y el visto bueno del DPO.</p>`;

function capPintarCatalogo() {
  $("vista").innerHTML = `<div class="page"><div class="page-h"><div><h1>Las pruebas</h1><p class="muted">Siete minijuegos originales. Pruébalos como lo haría un candidato: el resultado se ve al terminar y no se guarda.</p></div></div>
    <div class="cap-cat">${Object.entries(CAPJ).map(([id, J]) => `<article class="cap-cat-i"><div class="cap-cat-ico">${capIcono(id)}</div><div><h2>${esc(J.t)}</h2><p class="muted">${esc(J.mide)} · ${J.min} min${J.pc ? " · mejor en ordenador" : ""}</p><p>${esc(J.ins)}</p>
      <p class="cap-en">${Object.values(CAP_BATERIAS).filter(b => b.juegos.includes(id)).map(b => `<span class="badge">${esc(b.t)}</span>`).join(" ")}</p>
      <button class="btn" data-action="capProbar" data-j="${id}">Probar</button></div></article>`).join("")}</div>${capAviso}</div>`;
}
function capIcono(id) {
  const I = {
    ruta: `<rect x="2" y="2" width="44" height="44" rx="8" fill="#2E2747"/><rect x="8" y="8" width="10" height="10" rx="2" fill="#3A3156"/><rect x="30" y="8" width="10" height="10" rx="2" fill="#3A3156"/><path d="M12 32H36" stroke="#8B77F3" stroke-width="2" stroke-dasharray="3 3"/><rect x="7" y="27" width="10" height="10" rx="2.5" fill="#8B77F3"/><circle cx="38" cy="32" r="4" fill="none" stroke="#F0B35A" stroke-width="2"/>`,
    memoria: `<rect x="2" y="2" width="44" height="44" rx="8" fill="#0E0B16"/>${[[8, 8], [20, 8], [32, 8], [8, 20], [20, 20], [32, 20], [8, 32], [20, 32], [32, 32]].map(([x, y], k) => `<rect x="${x}" y="${y}" width="9" height="9" rx="2" fill="${k === 2 ? "#8B77F3" : k === 4 ? "rgba(139,119,243,.55)" : k === 6 ? "rgba(139,119,243,.3)" : "#2E2747"}"/>`).join("")}`,
    clasificador: `<rect x="2" y="2" width="44" height="44" rx="8" fill="#2E2747"/><circle cx="16" cy="24" r="8" fill="#7B63F0"/><rect x="26" y="16" width="16" height="16" rx="3" fill="#E3A33A"/>`,
    caja: `<rect x="2" y="2" width="44" height="44" rx="8" fill="#2E2747"/><rect x="10" y="9" width="28" height="30" rx="3" fill="#F6F2FD"/><path d="M15 17h18M15 23h12M15 29h16" stroke="#5A5170" stroke-width="2" stroke-linecap="round"/><circle cx="35" cy="35" r="7" fill="#F0B35A"/>`,
    patrones: `<rect x="2" y="2" width="44" height="44" rx="8" fill="#2E2747"/><g fill="none" stroke="#B3A6FA" stroke-width="2"><circle cx="13" cy="13" r="5"/><rect x="20" y="8" width="9" height="9" rx="1"/><path d="M35 8l5 9h-10z"/><rect x="8" y="20" width="9" height="9" rx="1"/><path d="M24 20l5 9h-10z"/><circle cx="35" cy="25" r="5"/><path d="M13 32l5 9H8z"/><circle cx="24" cy="37" r="5"/></g><text x="35" y="41" text-anchor="middle" font-size="10" font-weight="800" fill="#F0B35A">?</text>`,
    caso: `<rect x="2" y="2" width="44" height="44" rx="8" fill="#2E2747"/><path d="M2 30C14 25 26 35 46 26" stroke="#3B6FA8" stroke-width="4" fill="none" opacity=".7"/><path d="M14 2V46M30 2V46M2 16H46" stroke="#3A3156" stroke-width="3"/><circle cx="14" cy="16" r="3.5" fill="#8B77F3"/><circle cx="36" cy="16" r="4" fill="#F0B35A"/><circle cx="30" cy="36" r="3.5" fill="#8B77F3"/>`,
    bandeja: `<rect x="2" y="2" width="44" height="44" rx="8" fill="#2E2747"/>${[10, 20, 30].map((y, k) => `<rect x="9" y="${y}" width="30" height="7" rx="2" fill="${k ? "#3A3156" : "#8B77F3"}"/>`).join("")}`
  };
  return `<svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true">${I[id] || ""}</svg>`;
}

function capPintarNueva() {
  const N = capN(), js = N.juegos;
  // Por defecto nadie: se eligen las personas una a una (unas pruebas no se mandan a toda la plantilla).
  if (Array.isArray(S.emp) && typeof selP === "function") selP("cap", { modo: "personas" });
  const personas = Array.isArray(S.emp) ? selPElegidos("cap").filter(e => e.correo) : [];
  const lista = capLeerLista(N.lista), dest = N.origen === "personas" ? personas.map(e => ({ n: empNombre(e), e: e.correo, t: e.tienda_id || null, p: e.puesto || null })) : lista.ok;
  const sinMail = N.origen === "personas" && Array.isArray(S.emp) ? selPElegidos("cap").filter(e => !e.correo).length : 0;
  $("vista").innerHTML = `<div class="page"><div class="page-h"><div><h1>Nuevas pruebas</h1><p class="muted">Elige las pruebas, a quién van y envía un código a cada persona.</p></div></div>
    <div class="cap-nueva"><div>
      <section class="card"><div class="card-h"><h2>1 · Qué pruebas</h2></div>
        <div class="cap-bats">${Object.entries(CAP_BATERIAS).map(([k, b]) => `<button class="cap-bat ${N.bat === k ? "on" : ""}" data-action="capBat" data-v="${k}" aria-pressed="${N.bat === k}"><b>${esc(b.t)}</b><small>${esc(b.d)}</small><small>${capMinutos(b.juegos)} min</small></button>`).join("")}
          <button class="cap-bat ${N.bat === "propia" ? "on" : ""}" data-action="capBat" data-v="propia" aria-pressed="${N.bat === "propia"}"><b>A medida</b><small>Elige tú las pruebas.</small><small>${capMinutos(js)} min</small></button></div>
        <div class="cap-js">${Object.entries(CAPJ).map(([id, J]) => `<label class="cap-j ${js.includes(id) ? "on" : ""}"><input type="checkbox" data-action="capJuego" data-v="${id}" ${js.includes(id) ? "checked" : ""}>${capIcono(id)}<span><b>${esc(J.t)}</b><small>${esc(J.mide)} · ${J.min} min</small></span></label>`).join("")}</div>
      </section>
      <section class="card"><div class="card-h"><h2>2 · A quién</h2></div>
        <div class="seg" role="radiogroup"><button class="seg-b ${N.origen === "personas" ? "on" : ""}" data-action="capOrigen" data-v="personas" role="radio" aria-checked="${N.origen === "personas"}">Personas de la plantilla</button><button class="seg-b ${N.origen === "lista" ? "on" : ""}" data-action="capOrigen" data-v="lista" role="radio" aria-checked="${N.origen === "lista"}">Candidatos u otras personas</button></div>
        ${N.origen === "personas" ? (Array.isArray(S.emp) ? selPHtml("cap", { etiqueta: "personas" }) + (sinMail ? `<p class="hint">${sinMail} ${sinMail === 1 ? "persona elegida no tiene" : "personas elegidas no tienen"} correo: no recibirán código.</p>` : "") : `<p class="empty">Falta la migración de Personas (0.33).</p>`)
          : `<label class="cap-lista-lbl">Una persona por línea: nombre y correo, separados por punto y coma o tabulador
              <textarea id="capLista" rows="6" placeholder="Laura Gómez; laura.gomez@correo.com">${esc(N.lista)}</textarea></label>
             <p class="hint">${lista.ok.length} ${lista.ok.length === 1 ? "persona lista" : "personas listas"}${lista.mal.length ? ` · ${lista.mal.length} ${lista.mal.length === 1 ? "línea sin correo válido" : "líneas sin correo válido"}: ${esc(lista.mal.slice(0, 3).join(" · "))}` : ""}</p>
             <p class="hint cap-legal">Candidatos externos: son datos de personas que no están en la plantilla. Pide el visto bueno del DPO e incluye el aviso de privacidad antes de enviar a personas reales.</p>`}
      </section>
      <section class="card"><div class="card-h"><h2>3 · Opciones</h2></div><div class="cap-opts">
        <label>Nombre de la campaña<input id="capTit" value="${esc(N.titulo)}" placeholder="Selección Store Manager · ${esc(String(SC.CONFIG.anio))}" maxlength="120"></label>
        <label>Fecha de cierre (opcional)<input id="capCierre" type="date" value="${esc(N.cierre)}"></label>
        <label class="cap-sw"><input type="checkbox" data-action="capExtra" ${N.extra ? "checked" : ""}><span><b>Tiempo adicional del 50 %</b><small>Para adaptar las pruebas a una persona que lo necesite (por ejemplo, por discapacidad). Se aplica a toda la campaña.</small></span></label>
      </div></section>
    </div>
    <aside class="cap-res-n card"><h2>Resumen</h2><dl>
      <dt>Pruebas</dt><dd>${js.length ? js.map(j => esc(CAPJ[j].t)).join(", ") : "Ninguna"}</dd>
      <dt>Duración</dt><dd>${capMinutos(js)} minutos${N.extra ? " (+50 %)" : ""}</dd>
      <dt>Destinatarios</dt><dd>${dest.length} con correo</dd></dl>
      <button class="btn block" data-action="capCorreo" ${js.length ? "" : "disabled"}>Ver y editar el correo</button>
      <button class="btn primary block" data-action="capCrear" ${js.length && dest.length ? "" : "disabled"}>Crear y enviar ${dest.length} ${dest.length === 1 ? "código" : "códigos"}</button>
      ${capAviso}</aside></div></div>`;
  const ta = $("capLista"); if (ta) ta.addEventListener("input", () => { N.lista = ta.value; clearTimeout(capPintarNueva.h); capPintarNueva.h = setTimeout(() => { const pos = ta.selectionStart; capPintarNueva(); const t2 = $("capLista"); if (t2) { t2.focus(); t2.setSelectionRange(pos, pos); } }, 600); });
  const ti = $("capTit"); if (ti) ti.addEventListener("input", () => { N.titulo = ti.value; });
  const ci = $("capCierre"); if (ci) ci.addEventListener("change", () => { N.cierre = ci.value; });
}
function capLeerLista(txt) {
  const ok = [], mal = [], vistos = new Set();
  String(txt || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
    const m = l.match(/[^\s;,\t<>]+@[^\s;,\t<>]+\.[a-z]{2,}/i);
    if (!m) { mal.push(l.slice(0, 40)); return; }
    const e = m[0].toLowerCase(); if (vistos.has(e)) return; vistos.add(e);
    const n = l.replace(m[0], "").replace(/[;,\t<>]+/g, " ").replace(/\s+/g, " ").trim();
    ok.push({ n: n || e.split("@")[0], e, t: null, p: null });
  });
  return { ok, mal };
}
function capDestinatarios() {
  const N = capN();
  if (N.origen === "personas") return Array.isArray(S.emp) ? selPElegidos("cap").filter(e => e.correo).map(e => ({ n: empNombre(e), e: e.correo, t: e.tienda_id || null, p: e.puesto || null })) : [];
  return capLeerLista(N.lista).ok;
}
function capOpCorreo(titulo, js, aj) { return { titulo, modo: "capacidad", info: capInfo(js), aj: aj || {} }; }
async function capCrearYEnviar(aj) {
  const N = capN(), js = N.juegos.slice(), dest = capDestinatarios();
  const titulo = (N.titulo || "").trim() || `Pruebas de capacidad · ${CAP_BATERIAS[N.bat] ? CAP_BATERIAS[N.bat].t : "a medida"}`;
  const cfg = { version: 1, capacidad: true, bateria: N.bat, juegos: js, extra: N.extra ? 1.5 : 1, cierre: N.cierre || null, externos: N.origen === "lista", correo: aj || N.correo || {} };
  const ins = await sb.from("campanas").insert({ tipo: "psico", plantilla: "cap", titulo, anio: SC.CONFIG.anio, estado: "abierta", creado_por: yoReal().id, config: cfg }).select().single();
  if (ins.error) { avisar("No se ha podido crear: " + traducirError(ins.error)); return; }
  const c = ins.data; log(`Pruebas de capacidad creadas: ${titulo} (${dest.length} personas)`);
  const filas = dest.map(x => ({ campana_id: c.id, tienda_id: x.t, destinatario: x.n, puesto: x.p, email: x.e, codigo: SC.codigoInvitacion(), estado: "pendiente", respuestas: {} }));
  const ids = [];
  for (let i = 0; i < filas.length; i += 50) {
    const r = await sb.from("invitaciones").insert(filas.slice(i, i + 50)).select("id");
    if (r.error) { avisar("Se ha creado la campaña, pero no todos los códigos: " + traducirError(r.error)); break; }
    ids.push(...r.data.map(x => x.id));
  }
  await recargarPruebas();
  const res = await capEnviarIds(c, ids);
  S.capN = null; S.campana = c.id; S.tab = "capcurso"; pintar();
  capAvisoEnvio(res, ids.length);
}
async function capEnviarIds(c, ids) {
  let bien = 0, tope = false; const fallos = [];
  for (let i = 0; i < ids.length && !tope; i += LOTE) {
    let r; try { r = await enviarPorLaPlataforma(ids.slice(i, i + LOTE), null, { info: { [c.id]: capInfo(capCfg(c).juegos || []) } }); }
    catch (e) { fallos.push(e.message); break; }
    (r.resultados || []).forEach(x => { if (x.ok) bien++; else { if (x.motivo === "LIMITE_DIARIO") tope = true; fallos.push(x.motivo); } });
  }
  await recargarPruebas();
  return { bien, fallos, tope };
}
function capAvisoEnvio(res, total) {
  if (!res.fallos.length) return toast(`Enviados ${res.bien} ${res.bien === 1 ? "código" : "códigos"}`);
  avisar(`Enviados: ${res.bien} de ${total}.${res.tope ? "\n\nSe ha llegado al límite diario de correos. Los que faltan se pueden enviar mañana desde «En curso y resultados»." : ""}\n\n${[...new Set(res.fallos)].slice(0, 5).map(m => typeof motivoLegible === "function" ? motivoLegible(m) : m).join("\n")}`, "Envío con avisos");
}

function capIndice(i) {
  const r = (i.respuestas || {}).juegos || {}, xs = Object.values(r).map(x => x.score).filter(x => typeof x === "number");
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
}
function capPintarCurso() {
  const cs = capCampanas();
  if (!cs.length) { $("vista").innerHTML = `<div class="page"><div class="page-h"><div><h1>En curso y resultados</h1></div></div><div class="cl-vacio"><b>Todavía no hay pruebas enviadas</b><p>Créalas en «Nuevas pruebas».</p><button class="btn primary" data-action="tab" data-v="capnueva">Nuevas pruebas</button></div></div>`; return; }
  const c = cs.find(x => x.id === S.campana) || cs[0]; S.campana = c.id;
  const cfg = capCfg(c), js = (cfg.juegos || []).filter(j => CAPJ[j]), invs = invitacionesDe(c.id);
  const hechas = invs.filter(i => i.estado === "respondida"), sinEnviar = invs.filter(i => !i.enviado && i.estado !== "respondida");
  const ord = S.capOrd || "indice";
  const filas = invs.slice().sort((a, b) => {
    if (ord === "nombre") return (a.destinatario || "").localeCompare(b.destinatario || "", "es");
    const x = capIndice(a), y = capIndice(b); return (y == null ? -1 : y) - (x == null ? -1 : x);
  });
  const cel = v => v == null ? `<td class="num muted">–</td>` : `<td class="num"><span class="cap-punt" style="--p:${Math.round(v * 100)}%">${Math.round(v * 100)}</span></td>`;
  $("vista").innerHTML = `<div class="page"><div class="page-h cap-ph"><div><h1>En curso y resultados</h1><p class="muted">Puntuaciones de 0 a 100 en cada prueba. El índice es la media de las pruebas hechas.</p></div>
      <div class="page-h-b"><select data-capcamp="1" aria-label="Campaña">${cs.map(x => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.titulo)}</option>`).join("")}</select></div></div>
    <div class="cl-kpis"><div class="oscuro"><small>Completadas</small><b>${hechas.length} de ${invs.length}</b><small>${invs.length ? Math.round(hechas.length / invs.length * 100) : 0} % de participación</small></div>
      <div><small>Pruebas</small><b style="font-size:18px">${js.length}</b><small>${esc(js.map(j => CAPJ[j].t).join(", "))}</small></div>
      <div><small>Estado</small><b style="font-size:18px">${c.estado === "abierta" ? "Abierta" : "Cerrada"}</b><small>${cfg.cierre ? "Cierre previsto el " + new Date(cfg.cierre + "T12:00:00").toLocaleDateString("es-ES") : "Sin fecha de cierre"}${cfg.extra > 1 ? " · tiempo +50 %" : ""}</small></div></div>
    <div class="cap-acc">
      ${sinEnviar.length && c.estado === "abierta" ? `<button class="btn primary" data-action="capEnviarPend">Enviar ${sinEnviar.length} sin enviar</button>` : ""}
      ${c.estado === "abierta" && invs.some(i => i.enviado && i.estado !== "respondida") ? `<button class="btn" data-action="capRecordar">Recordar a quien falta</button>` : ""}
      <button class="btn" data-action="capCsv" ${hechas.length ? "" : "disabled"}>Descargar CSV</button>
      <button class="btn" data-action="capEstado">${c.estado === "abierta" ? "Cerrar la campaña" : "Reabrir"}</button>
      <label class="cap-ord">Ordenar por <select data-capord="1"><option value="indice" ${ord === "indice" ? "selected" : ""}>Índice</option><option value="nombre" ${ord === "nombre" ? "selected" : ""}>Nombre</option></select></label></div>
    <section class="card"><div class="tablewrap"><table class="cap-tabla"><thead><tr><th>Persona</th><th>Estado</th>${js.map(j => `<th class="num">${esc(CAPJ[j].t)}</th>`).join("")}<th class="num">Índice</th><th></th></tr></thead>
      <tbody>${filas.map(i => { const r = (i.respuestas || {}).juegos || {}, rein = Object.values(r).reduce((s, x) => s + (x.reinicios || 0), 0);
        return `<tr><td><b>${esc(i.destinatario || "Sin nombre")}</b><small class="muted cap-mail">${esc(i.email || "")}</small></td>
          <td>${i.estado === "respondida" ? `<span class="badge ok">Hecha</span>${rein ? ` <span class="badge" title="Recargó la página a mitad de alguna prueba">${rein} reinicio${rein === 1 ? "" : "s"}</span>` : ""}` : i.estado === "abierta" ? `<span class="badge">Empezada</span>` : i.enviado ? `<span class="badge">Enviada</span>` : `<span class="badge">Sin enviar</span>`}</td>
          ${js.map(j => cel(r[j] ? r[j].score : null)).join("")}${cel(capIndice(i))}
          <td>${i.estado === "respondida" ? `<button class="btn small" data-action="capVer" data-id="${i.id}">Ver informe</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div></section>
    ${capAviso}</div>`;
}
function capVerInforme(i) {
  const c = (S.campanas || []).find(x => x.id === i.campana_id), R = i.respuestas || {}, js = (capCfg(c).juegos || []).filter(j => CAPJ[j]);
  const dur = R.inicio && R.fin ? capMmss(new Date(R.fin) - new Date(R.inicio)) : "–";
  const cuerpo = `<div class="cap-kpis"><div><small>Índice</small><b>${capIndice(i) == null ? "–" : Math.round(capIndice(i) * 100)}</b><small>media de las pruebas, de 0 a 100</small></div>
      <div><small>Duración total</small><b>${dur}</b><small>con pausas</small></div><div><small>Dispositivo</small><b style="font-size:16px">${R.dispositivo ? (R.dispositivo.tactil && R.dispositivo.ancho < 900 ? "Móvil o tableta" : "Ordenador") : "–"}</b><small>${R.dispositivo ? R.dispositivo.ancho + " px de ancho" : ""}</small></div>
      <div><small>Tiempo adicional</small><b style="font-size:16px">${R.extra > 1 ? "Sí, +50 %" : "No"}</b></div></div>
    ${js.map(j => capInformeHtml((R.juegos || {})[j])).join("")}${capAviso}`;
  log(`Informe de pruebas de capacidad visto: ${i.destinatario || ""}`);
  abrirExplica(`Informe de ${i.destinatario || "la persona"}`, c ? c.titulo : "", cuerpo);
}
function capProbar(id) {
  const ov = document.createElement("div"); ov.id = "capOv"; ov.className = "cap-ov";
  ov.innerHTML = `<div class="cap-ov-c" role="dialog" aria-modal="true" aria-label="Probar ${esc(CAPJ[id].t)}"><div class="cap-ov-h"><b>Vista previa · no se guarda nada</b><button class="btn" data-capcerrar="1">Cerrar</button></div><div id="capPrev"></div></div>`;
  document.body.appendChild(ov); document.body.classList.add("cap-bloq");
  ov.querySelector("[data-capcerrar]").addEventListener("click", capCerrarPrev);
  // Escape cierra aunque el foco se haya perdido al cambiar de pantalla dentro de la prueba.
  CAPI.esc = e => { if (e.key === "Escape") { e.preventDefault(); capCerrarPrev(); } };
  document.addEventListener("keydown", CAPI.esc);
  ov.addEventListener("click", e => { if (e.target === ov) capCerrarPrev(); });
  CAPI.prev = capReproducir($("capPrev"), { juegos: [id], mostrarResultados: true, semilla: Date.now() >>> 0, alFin: capCerrarPrev });
}
function capCerrarPrev() { capTeclas(null); if (CAPI.esc) { document.removeEventListener("keydown", CAPI.esc); CAPI.esc = null; } const o = $("capOv"); if (o) o.remove(); document.body.classList.remove("cap-bloq"); }

const ACCIONES_CAP = {
  capBat(b) { const N = capN(); N.bat = b.dataset.v; if (CAP_BATERIAS[N.bat]) N.juegos = CAP_BATERIAS[N.bat].juegos.slice(); },
  capJuego(b) {
    const N = capN(), id = b.dataset.v;
    N.juegos = N.juegos.includes(id) ? N.juegos.filter(x => x !== id) : N.juegos.concat(id);
    // Si coincide con una batería, se queda con su orden (de más ligera a más exigente).
    const igual = Object.entries(CAP_BATERIAS).find(([, v]) => v.juegos.length === N.juegos.length && v.juegos.every(x => N.juegos.includes(x)));
    N.bat = igual ? igual[0] : "propia"; if (igual) N.juegos = igual[1].juegos.slice();
  },
  capOrigen(b) { capN().origen = b.dataset.v; },
  capExtra(b) { capN().extra = b.checked; },
  capProbar(b) { capProbar(b.dataset.j); return false; },
  capCorreo() {
    const N = capN(), titulo = (N.titulo || "").trim() || "Pruebas de capacidad";
    abrirVistaCorreo(Object.assign(capOpCorreo(titulo, N.juegos, N.correo), { n: capDestinatarios().length, alGuardar: aj => { N.correo = aj; } }));
    return false;
  },
  async capCrear() {
    const N = capN(), dest = capDestinatarios();
    if (!N.juegos.length || !dest.length) return false;
    const titulo = (N.titulo || "").trim() || "Pruebas de capacidad";
    abrirVistaCorreo(Object.assign(capOpCorreo(titulo, N.juegos, N.correo), { n: dest.length, txtEnviar: `Crear y enviar ${dest.length} ${dest.length === 1 ? "código" : "códigos"}`,
      alGuardar: aj => { N.correo = aj; }, alEnviar: aj => { N.correo = aj; capCrearYEnviar(aj); } }));
    return false;
  },
  async capEnviarPend() {
    const c = capCampanas().find(x => x.id === S.campana); if (!c) return false;
    const ids = invitacionesDe(c.id).filter(i => !i.enviado && i.estado !== "respondida").map(i => i.id);
    toast("Enviando…"); const res = await capEnviarIds(c, ids); pintar(); capAvisoEnvio(res, ids.length); return false;
  },
  async capRecordar() {
    const c = capCampanas().find(x => x.id === S.campana); if (!c) return false;
    const ids = invitacionesDe(c.id).filter(i => i.enviado && i.estado !== "respondida").map(i => i.id);
    if (!(await confirmar({ titulo: "Recordar a quien falta", texto: `Se reenvía su código a ${ids.length} ${ids.length === 1 ? "persona" : "personas"} que aún no han terminado.`, ok: "Enviar" }))) return false;
    toast("Enviando…"); const res = await capEnviarIds(c, ids); pintar(); capAvisoEnvio(res, ids.length); return false;
  },
  async capEstado() {
    const c = capCampanas().find(x => x.id === S.campana); if (!c) return false;
    const nuevo = c.estado === "abierta" ? "cerrada" : "abierta";
    if (nuevo === "cerrada" && !(await confirmar({ titulo: "Cerrar la campaña", texto: "Quien no haya terminado ya no podrá entregar sus pruebas.", ok: "Cerrar" }))) return false;
    const { error } = await sb.from("campanas").update({ estado: nuevo }).eq("id", c.id);
    if (error) { avisar(traducirError(error)); return false; }
    log(`Campaña ${nuevo === "cerrada" ? "cerrada" : "reabierta"}: ${c.titulo}`); await recargarPruebas();
  },
  capVer(b) { const i = (S.invitaciones || []).find(x => x.id === b.dataset.id); if (i) capVerInforme(i); return false; },
  capCsv() {
    const c = capCampanas().find(x => x.id === S.campana); if (!c) return false;
    const js = (capCfg(c).juegos || []).filter(j => CAPJ[j]), q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const lin = [["Persona", "Correo", "Estado", ...js.map(j => CAPJ[j].t), "Índice", "Reinicios"].map(q).join(";")].concat(
      invitacionesDe(c.id).map(i => { const r = (i.respuestas || {}).juegos || {}; return [i.destinatario, i.email, i.estado, ...js.map(j => r[j] ? Math.round(r[j].score * 100) : ""), capIndice(i) == null ? "" : Math.round(capIndice(i) * 100), Object.values(r).reduce((s, x) => s + (x.reinicios || 0), 0)].map(q).join(";"); }));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + lin.join("\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `pruebas-capacidad-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    log(`Exportación de resultados de pruebas de capacidad: ${c.titulo}`);
    return false;
  }
};
document.addEventListener("change", e => {
  const s = e.target;
  if (s.matches && s.matches("[data-capcamp]")) { S.campana = s.value; pintar(); }
  if (s.matches && s.matches("[data-capord]")) { S.capOrd = s.value; pintar(); }
});
