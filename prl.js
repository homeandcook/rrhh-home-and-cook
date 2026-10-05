"use strict";
/* ===================== PRL: PREVENCIÓN DE RIESGOS EN TIENDA =====================
   Lo que RR.HH. y el Regional Manager necesitan tener al día en cada tienda:
   - La formación de prevención de cada persona y cuándo caduca.
   - La evaluación de riesgos del local y el simulacro de evacuación.
   - Que el reconocimiento médico se ha ofrecido y cuándo se hizo.
   - Las incidencias y accidentes, con o sin baja.

   QUÉ NO SE GUARDA, A PROPÓSITO: el resultado del reconocimiento médico
   (apto o no apto) ni ninguna lesión o diagnóstico. Son datos de salud. Del
   reconocimiento solo consta la fecha; de un accidente, la circunstancia.

   Los datos viven en datos.prl de cada tienda y heredan sus permisos: RR.HH.
   todo, cada Regional Manager sus tiendas, Retail Marketing nada.
   ================================================================================ */
CONFIG.prl = {
  formaciones: [
    { id: "basica",     t: "Prevención básica en comercio",     cada: 36, obligatoria: true,  d: "Riesgos del puesto, señalización y medidas preventivas. Al incorporarse y cada tres años." },
    { id: "cargas",     t: "Manipulación manual de cargas",     cada: 36, obligatoria: true,  d: "Cómo levantar, transportar y almacenar cajas sin lesionarse." },
    { id: "escaleras",  t: "Uso de escaleras y almacén en altura", cada: 36, obligatoria: true, d: "Escaleras de mano, estanterías altas y orden del almacén." },
    { id: "emergencia", t: "Emergencias y evacuación",          cada: 12, obligatoria: true,  d: "Plan de emergencia del centro, salidas, extintores y punto de reunión. Cada año." },
    { id: "auxilios",   t: "Primeros auxilios",                 cada: 24, obligatoria: false, d: "Recomendada para al menos una persona por turno." }
  ],
  revisiones: [
    { id: "evaluacion", t: "Evaluación de riesgos del local", cada: 12, d: "Por el servicio de prevención. Se revisa cada año y siempre que cambie la tienda (obras, reforma, maquinaria nueva)." },
    { id: "simulacro",  t: "Simulacro de evacuación",         cada: 12, d: "Con el centro comercial o por cuenta propia. Al menos uno al año." },
    { id: "extintores", t: "Revisión de extintores y señalización", cada: 12, d: "Revisión anual de la empresa mantenedora y retimbrado cada cinco años." }
  ],
  reconocimientoCada: 12,     // meses; solo se guarda la fecha, nunca el resultado
  incidenciaTipos: ["Caída al mismo nivel", "Caída de altura (escalera)", "Golpe o corte con producto", "Sobreesfuerzo por carga", "Quemadura (demo)", "Agresión verbal de cliente", "Otro"],
  incidenciaZonas: ["Sala de venta", "Almacén", "Caja", "Escaparate", "Zona de demo", "Exterior / centro"],
  avisoDias: 60
};

function prlDe(t) { t.prl = t.prl || {}; t.prl.personas = t.prl.personas || []; t.prl.incidencias = t.prl.incidencias || []; t.prl.revisiones = t.prl.revisiones || {}; return t.prl; }
function filtroPrl() { S.prl = S.prl || { zona: "", tienda: "" }; return S.prl; }
function tiendasPrl() { const f = filtroPrl(); return S.tiendas.filter(t => (!f.tienda || t.id === f.tienda) && (!f.zona || t.rm_id === f.zona)); }
const hoyISO = () => new Date().toISOString().slice(0, 10);
function mesesDesde(iso) { if (!iso) return null; const d = new Date(iso + "T00:00:00Z"); if (isNaN(d)) return null; return (Date.now() - d.getTime()) / (30.44 * 86400000); }
/* Estado de una fecha con periodicidad: ok, pronto (caduca en menos de avisoDias), vencida o sin */
function estadoFecha(iso, cadaMeses) {
  if (!iso) return { k: "sin", t: "Sin hacer" };
  const m = mesesDesde(iso); if (m == null) return { k: "sin", t: "Sin hacer" };
  const restan = cadaMeses - m;
  if (restan < 0) return { k: "vencida", t: "Vencida" };
  if (restan * 30.44 <= CONFIG.prl.avisoDias) return { k: "pronto", t: "Caduca pronto" };
  return { k: "ok", t: "Al día" };
}
function caducaEl(iso, cadaMeses) { const d = new Date(iso + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + cadaMeses); return d.toISOString().slice(0, 10); }

/* Resumen de una tienda */
function resumenPrl(t) {
  const p = prlDe(t), oblig = CONFIG.prl.formaciones.filter(f => f.obligatoria);
  let alDia = 0, vencidas = 0, pronto = 0;
  p.personas.forEach(x => {
    const est = oblig.map(f => estadoFecha((x.formaciones || {})[f.id], f.cada));
    if (est.every(e => e.k === "ok" || e.k === "pronto")) alDia++;
    vencidas += est.filter(e => e.k === "vencida" || e.k === "sin").length;
    pronto += est.filter(e => e.k === "pronto").length;
  });
  const rev = CONFIG.prl.revisiones.map(r => Object.assign({ r }, estadoFecha(p.revisiones[r.id], r.cada)));
  const recon = p.personas.map(x => estadoFecha(x.reconocimiento, CONFIG.prl.reconocimientoCada));
  const anio = String(C.anio);
  const inc = p.incidencias.filter(i => (i.fecha || "").startsWith(anio));
  return { personas: p.personas.length, alDia, vencidas, pronto, rev, revVencidas: rev.filter(x => x.k !== "ok").length,
    reconPendientes: recon.filter(x => x.k !== "ok").length, incidencias: inc.length, conBaja: inc.filter(i => i.conBaja).length,
    diasBaja: inc.reduce((s, i) => s + (i.conBaja ? Number(i.dias) || 0 : 0), 0) };
}

function pintarPrl() {
  const f = filtroPrl(), ts = tiendasPrl(), rms = S.perfiles.filter(p => p.rol === "rm");
  const R = ts.map(t => Object.assign({ t }, resumenPrl(t)));
  const tot = R.reduce((a, x) => ({ personas: a.personas + x.personas, alDia: a.alDia + x.alDia, vencidas: a.vencidas + x.vencidas, pronto: a.pronto + x.pronto,
    revVencidas: a.revVencidas + x.revVencidas, reconPendientes: a.reconPendientes + x.reconPendientes, incidencias: a.incidencias + x.incidencias, conBaja: a.conBaja + x.conBaja, diasBaja: a.diasBaja + x.diasBaja }),
    { personas: 0, alDia: 0, vencidas: 0, pronto: 0, revVencidas: 0, reconPendientes: 0, incidencias: 0, conBaja: 0, diasBaja: 0 });
  const tarjeta = (tt, v, pie, clase) => `<div class="kpi-b ${clase || ""}"><small>${esc(tt)}</small><b>${v}</b><small>${pie || ""}</small></div>`;
  let h = `<div class="page prl">
    <div class="page-h"><h1>Prevención de riesgos</h1><button class="btn" data-action="prlCsv">Exportar CSV</button></div>
    <p class="avisoart9">Se registra qué formación tiene cada persona, cuándo se hizo el reconocimiento y qué pasó en cada incidencia.
      Nunca el resultado del reconocimiento ni ninguna lesión: son datos de salud y no hay campo para ellos.</p>
    <div class="filters">
      ${esAdmin() ? `<label>Zona<select data-prl="zona"><option value="">Todas</option>${rms.map(r => `<option value="${r.id}" ${f.zona === r.id ? "selected" : ""}>${esc(r.nombre)}${r.zona ? " (" + esc(r.zona) + ")" : ""}</option>`).join("")}</select></label>` : ""}
      <label>Tienda<select data-prl="tienda"><option value="">Todas</option>${S.tiendas.map(t => `<option value="${t.id}" ${f.tienda === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></label>
      ${f.zona || f.tienda ? `<button class="btn small ghost" data-action="prlReset">Quitar filtros</button>` : ""}
    </div>
    <div class="kpis-top">
      ${tarjeta("Plantilla con formación al día", tot.personas ? SC.pct(tot.alDia / tot.personas, 0) : "–", `${tot.alDia} de ${tot.personas} personas`)}
      ${tarjeta("Formaciones vencidas o sin hacer", SC.fmt(tot.vencidas, 0), tot.pronto ? `${tot.pronto} caducan en ${CONFIG.prl.avisoDias} días` : "ninguna caduca pronto", tot.vencidas ? "mal" : "")}
      ${tarjeta("Revisiones del local pendientes", SC.fmt(tot.revVencidas, 0), "evaluación, simulacro, extintores", tot.revVencidas ? "mal" : "")}
      ${tarjeta("Reconocimientos pendientes", SC.fmt(tot.reconPendientes, 0), "más de 12 meses o sin fecha")}
      ${tarjeta(`Incidencias ${C.anio}`, SC.fmt(tot.incidencias, 0), `${tot.conBaja} con baja · ${tot.diasBaja} días`)}
    </div>`;

  // Por tienda
  h += `<div class="grupo2"><h2 class="grupo">Por tienda</h2><div class="tablewrap"><table><thead><tr>
    <th>Tienda</th><th class="n">Personas</th><th class="n">Formación al día</th><th class="n">Vencidas</th><th>Revisiones</th><th class="n">Reconoc. pdtes.</th><th class="n">Incidencias</th><th></th></tr></thead><tbody>
    ${R.map(x => `<tr class="${x.vencidas || x.revVencidas ? "" : ""}"><td>${esc(x.t.nombre)}<small>${esc(x.t.codigo || "")}</small></td>
      <td class="n">${x.personas}</td>
      <td class="n">${x.personas ? `<span class="${x.alDia === x.personas ? "bueno" : "malo"}">${SC.pct(x.alDia / x.personas, 0)}</span>` : "–"}</td>
      <td class="n">${x.vencidas ? `<span class="malo">${x.vencidas}</span>` : "0"}</td>
      <td><span class="semaforo">${x.rev.map(r => `<i class="s-${r.k}" title="${esc(r.r.t)}: ${esc(r.t)}"></i>`).join("")}</span></td>
      <td class="n">${x.reconPendientes || "0"}</td>
      <td class="n">${x.incidencias}${x.conBaja ? ` <small>${x.conBaja} con baja</small>` : ""}</td>
      <td class="n"><button class="btn small ghost" data-action="prlVer" data-id="${x.t.id}">Abrir</button></td></tr>`).join("")}
    </tbody></table></div>
    <p class="hint"><span class="semaforo"><i class="s-ok"></i></span> al día <span class="semaforo"><i class="s-pronto"></i></span> caduca pronto <span class="semaforo"><i class="s-vencida"></i></span> vencida <span class="semaforo"><i class="s-sin"></i></span> sin fecha · evaluación de riesgos, simulacro y extintores.</p></div>`;

  const t = f.tienda ? S.tiendas.find(x => x.id === f.tienda) : null;
  h += t ? fichaPrl(t) : `<p class="hint">Elige una tienda en el filtro, o pulsa «Abrir», para gestionar su plantilla, revisiones e incidencias.</p>`;
  $("vista").innerHTML = h + `</div>`;
  const fp = $("formPrlPersona"); if (fp) fp.addEventListener("submit", prlAltaPersona);
  const fi = $("formPrlInc"); if (fi) fi.addEventListener("submit", prlAltaIncidencia);
}

function fichaPrl(t) {
  const p = prlDe(t), hoy = hoyISO(), F = CONFIG.prl.formaciones;
  const chip = e => `<span class="est-prl ${e.k}">${esc(e.t)}</span>`;
  const delScorecard = t.personas.filter(x => x.nombre && !p.personas.some(y => y.nombre === x.nombre));
  let h = `<div class="grupo2"><h2 class="grupo">${esc(t.nombre)}${t.codigo ? ` <small>${esc(t.codigo)}</small>` : ""}</h2>`;

  // Revisiones del local
  h += `<section class="card"><h2>Revisiones del local</h2><div class="revs">
    ${CONFIG.prl.revisiones.map(r => { const e = estadoFecha(p.revisiones[r.id], r.cada), v = p.revisiones[r.id];
      return `<div class="rev"><div><b>${esc(r.t)}</b><small>${esc(r.d)}</small></div>
        <label>Última fecha<input type="date" data-prlrev="${r.id}" value="${esc(v || "")}" max="${hoy}"></label>
        <div class="rev-est">${chip(e)}${v ? `<small>caduca ${fechaCorta(caducaEl(v, r.cada))}</small>` : ""}</div></div>`; }).join("")}</div></section>`;

  // Plantilla
  h += `<section class="card"><div class="card-h"><h2>Plantilla y formación</h2><span class="muted">${p.personas.length} personas</span></div>
    <p class="hint">Marca la fecha en que cada persona hizo cada formación. Las obligatorias son las que cuentan para el «al día». Del reconocimiento médico solo se guarda la fecha.</p>
    <div class="tablewrap"><table class="prl-t"><thead><tr><th>Persona</th>${F.map(f => `<th title="${esc(f.d)}">${esc(f.t)}${f.obligatoria ? "" : " <small>opcional</small>"}<small>cada ${f.cada / 12 >= 1 ? f.cada / 12 + (f.cada === 12 ? " año" : " años") : f.cada + " meses"}</small></th>`).join("")}<th>Reconocimiento</th><th></th></tr></thead><tbody>
    ${p.personas.length ? p.personas.map(x => `<tr><td><b>${esc(x.nombre)}</b><small>${esc(x.puesto || "")}${x.alta ? " · desde " + fechaCorta(x.alta) : ""}</small></td>
      ${F.map(f => { const v = (x.formaciones || {})[f.id], e = estadoFecha(v, f.cada);
        return `<td class="fecha-c ${e.k}"><input type="date" data-prlform="${x.id}" data-fid="${f.id}" value="${esc(v || "")}" max="${hoy}" title="${esc(e.t)}${v ? " · caduca " + fechaCorta(caducaEl(v, f.cada)) : ""}"></td>`; }).join("")}
      <td class="fecha-c ${estadoFecha(x.reconocimiento, CONFIG.prl.reconocimientoCada).k}"><input type="date" data-prlrecon="${x.id}" value="${esc(x.reconocimiento || "")}" max="${hoy}" title="Fecha del último reconocimiento ofrecido y realizado"></td>
      <td class="n"><button class="btn small ghost danger" data-action="prlBorrarPersona" data-id="${x.id}">Quitar</button></td></tr>`).join("")
      : `<tr><td colspan="${F.length + 3}" class="muted">Sin personas registradas en esta tienda.</td></tr>`}
    </tbody></table></div>
    <form class="inline-form" id="formPrlPersona"><h3>Añadir persona</h3>
      <label>Nombre<input name="nombre" required maxlength="80" placeholder="Nombre y apellido"></label>
      <label>Puesto<select name="puesto"><option>Store Manager</option><option>Assistant Store Manager</option><option selected>Vendedor/a</option><option>Otro</option></select></label>
      <label>Fecha de alta<input type="date" name="alta" max="${hoy}"></label>
      <button class="btn primary" type="submit">Añadir</button>
      ${delScorecard.length ? `<button class="btn" type="button" data-action="prlImportar">Traer ${delScorecard.length === 1 ? "al" : "a los"} ${delScorecard.length} del Scorecard</button>` : ""}</form></section>`;

  // Incidencias
  const inc = p.incidencias.slice().sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  h += `<section class="card"><div class="card-h"><h2>Incidencias y accidentes</h2><span class="muted">${inc.length}</span></div>
    <div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Zona</th><th>Baja</th><th>Qué pasó</th><th>Medidas</th><th></th></tr></thead><tbody>
    ${inc.length ? inc.map(i => `<tr><td class="num">${fechaCorta(i.fecha)}</td><td>${esc(i.tipo)}</td><td>${esc(i.zona)}</td>
      <td>${i.conBaja ? `<span class="badge abierta">Con baja${i.dias ? " · " + i.dias + " d" : ""}</span>` : `<span class="badge">Sin baja</span>`}</td>
      <td class="txt">${esc(i.que || "")}</td><td class="txt">${esc(i.medidas || "")}</td>
      <td class="n"><button class="btn small ghost danger" data-action="prlBorrarInc" data-id="${i.id}">Eliminar</button></td></tr>`).join("")
      : `<tr><td colspan="7" class="muted">Sin incidencias registradas.</td></tr>`}
    </tbody></table></div>
    <form class="inline-form" id="formPrlInc"><h3>Registrar una incidencia</h3>
      <label>Fecha<input type="date" name="fecha" required max="${hoy}" value="${hoy}"></label>
      <label>Tipo<select name="tipo">${CONFIG.prl.incidenciaTipos.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
      <label>Zona<select name="zona">${CONFIG.prl.incidenciaZonas.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
      <label class="check" style="align-self:center"><input type="checkbox" name="conBaja"><span>Con baja</span></label>
      <label>Días de baja<input type="number" name="dias" min="0" class="short2" placeholder="Si se sabe"></label>
      <label style="flex-basis:100%">Qué pasó <small class="ayuda">la circunstancia (una caja mal apilada, suelo mojado), no la lesión</small><input name="que" maxlength="160" required placeholder="p. ej. Caja de 18 kg en la balda alta sin escalera"></label>
      <label style="flex-basis:100%">Medidas tomadas<input name="medidas" maxlength="160" placeholder="p. ej. Reubicadas las cajas pesadas en baldas bajas"></label>
      <button class="btn primary" type="submit">Registrar</button></form>
    <p class="hint">Un accidente de trabajo se comunica siempre a la mutua a través de RR.HH.; esto es el registro interno para prevenir el siguiente.</p></section></div>`;
  return h;
}

function prlAltaPersona(ev) {
  ev.preventDefault();
  const t = S.tiendas.find(x => x.id === filtroPrl().tienda); if (!t) return;
  const f = Object.fromEntries(new FormData(ev.target));
  prlDe(t).personas.push({ id: SC.uid(), nombre: f.nombre.trim(), puesto: f.puesto, alta: f.alta || null, formaciones: {}, reconocimiento: null });
  log(`PRL: alta de una persona en ${t.nombre}`, t); guardar(t); toast("Persona añadida"); pintar();
}
function prlAltaIncidencia(ev) {
  ev.preventDefault();
  const t = S.tiendas.find(x => x.id === filtroPrl().tienda); if (!t) return;
  const f = Object.fromEntries(new FormData(ev.target));
  prlDe(t).incidencias.push({ id: SC.uid(), fecha: f.fecha, tipo: f.tipo, zona: f.zona, conBaja: !!f.conBaja, dias: f.conBaja ? Number(f.dias) || 0 : 0, que: f.que.trim(), medidas: (f.medidas || "").trim() });
  log(`PRL: incidencia registrada en ${t.nombre} (${f.tipo}${f.conBaja ? ", con baja" : ""})`, t); guardar(t); toast("Incidencia registrada"); pintar();
}
function prlCsv() {
  const cab = ["Tienda", "Código", "Persona", "Puesto", "Alta"].concat(CONFIG.prl.formaciones.map(f => f.t), ["Reconocimiento (fecha)", "Formación obligatoria al día"]);
  const lin = [];
  tiendasPrl().forEach(t => prlDe(t).personas.forEach(x => {
    const ok = CONFIG.prl.formaciones.filter(f => f.obligatoria).every(f => ["ok", "pronto"].includes(estadoFecha((x.formaciones || {})[f.id], f.cada).k));
    lin.push([t.nombre, t.codigo || "", x.nombre, x.puesto || "", x.alta || ""].concat(CONFIG.prl.formaciones.map(f => (x.formaciones || {})[f.id] || ""), [x.reconocimiento || "", ok ? "Sí" : "No"]));
  }));
  const q = v => { v = String(v == null ? "" : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + [cab, ...lin].map(r => r.map(q).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  a.download = `prl_${C.anio}_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
}

const ACCIONES_PRL = {
  prlReset() { S.prl = { zona: "", tienda: "" }; },
  prlVer(b) { filtroPrl().tienda = b.dataset.id; },
  prlCsv() { prlCsv(); return false; },
  prlImportar() {
    const t = S.tiendas.find(x => x.id === filtroPrl().tienda); if (!t) return false;
    const p = prlDe(t); let n = 0;
    t.personas.filter(x => x.nombre && !p.personas.some(y => y.nombre === x.nombre)).forEach(x => { p.personas.push({ id: SC.uid(), nombre: x.nombre, puesto: (C.bonus[x.puesto] || {}).nombre || x.puesto, alta: null, formaciones: {}, reconocimiento: null }); n++; });
    log(`PRL: ${n} personas traídas del Scorecard en ${t.nombre}`, t); guardar(t); toast(`${n} personas añadidas`);
  },
  prlBorrarPersona(b) {
    const t = S.tiendas.find(x => x.id === filtroPrl().tienda); if (!t) return false;
    const p = prlDe(t), x = p.personas.find(y => y.id === b.dataset.id);
    if (!confirm(`¿Quitar a ${x.nombre} del registro de prevención de esta tienda?`)) return false;
    p.personas = p.personas.filter(y => y.id !== x.id); log(`PRL: baja de una persona en ${t.nombre}`, t); guardar(t);
  },
  prlBorrarInc(b) {
    const t = S.tiendas.find(x => x.id === filtroPrl().tienda); if (!t) return false;
    if (!confirm("¿Eliminar esta incidencia del registro?")) return false;
    const p = prlDe(t); p.incidencias = p.incidencias.filter(y => y.id !== b.dataset.id); log(`PRL: incidencia eliminada en ${t.nombre}`, t); guardar(t);
  }
};
/* Las fechas se guardan al cambiarlas, sin botón */
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.prl) { filtroPrl()[el.dataset.prl] = el.value; pintarPrl(); return; }
  if (!el.dataset.prlrev && !el.dataset.prlform && !el.dataset.prlrecon) return;
  const t = S.tiendas.find(x => x.id === filtroPrl().tienda); if (!t) return;
  const p = prlDe(t);
  if (el.dataset.prlrev) p.revisiones[el.dataset.prlrev] = el.value || null;
  else {
    const x = p.personas.find(y => y.id === (el.dataset.prlform || el.dataset.prlrecon)); if (!x) return;
    if (el.dataset.prlform) { x.formaciones = x.formaciones || {}; x.formaciones[el.dataset.fid] = el.value || null; }
    else x.reconocimiento = el.value || null;
  }
  guardar(t); pintarPrl();
});
