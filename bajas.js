"use strict";
/* ===================== BAJAS Y ABSENTISMO =====================
   Registro de bajas por tienda y tasa de absentismo de la red.

   QUÉ SE GUARDA: la contingencia que consta en el parte de baja, las
   fechas y el puesto. Nada más.
   QUÉ NO SE GUARDA, A PROPÓSITO: el diagnóstico, la causa médica y
   cualquier texto libre. Eso es dato de salud del artículo 9 del RGPD y
   la empresa no tiene por qué conocerlo. No hay ningún campo donde
   escribirlo, porque si lo hubiera alguien acabaría usándolo.

   QUIÉN LO VE: las bajas viven dentro de datos.bajas de cada tienda, así
   que heredan las reglas de la tabla: RR.HH. todas, cada Regional Manager
   las suyas. Retail Marketing no lee esa tabla y la función red_kpis solo
   devuelve datos->'kpis', así que no le llegan por ninguna vía.
   ============================================================== */

function filtroBajas() {
  S.bajas = S.bajas || { zona: "", tienda: "", periodo: "todo", alta: "" };
  return S.bajas;
}
function tiendasBajas() {
  const f = filtroBajas();
  return S.tiendas.filter(t => (!f.tienda || t.id === f.tienda) && (!f.zona || t.rm_id === f.zona));
}
function mesesBajas() {
  const f = filtroBajas(), ms = mesesDisponibles();
  if (!ms.length) return [];
  if (f.periodo === "todo") return ms;
  if (f.periodo === "ultimos3") return ms.slice(-3);
  if (f.periodo === "ultimo") return ms.slice(-1);
  return ms.filter(m => m === f.periodo);
}
const tipoBaja = id => C.bajasTipos.find(x => x.id === id) || { t: id, corto: id, color: "" };
const fechaCorta = f => (f ? new Date(f + "T00:00:00Z").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" }) : "—");

function pintarBajas() {
  const f = filtroBajas(), ms = mesesBajas(), ts = tiendasBajas();
  const a = SC.absentismo(ts, ms);
  const rms = S.perfiles.filter(p => p.rol === "rm");
  const n1 = x => (x == null ? "–" : SC.fmt(x, 1));
  const objetivo = C.absentismoObjetivo;

  let h = `<div class="page bajas">
    <div class="page-h"><h1>Bajas y absentismo</h1><button class="btn" data-action="bajasCsv">Exportar CSV</button></div>
    <p class="avisoart9">Se registra la contingencia y las fechas, nunca el diagnóstico ni la causa médica.
      Es dato de salud y la empresa no tiene por qué conocerlo.</p>
    <div class="filters">
      ${esAdmin() ? `<label>Zona<select data-bajas="zona"><option value="">Todas</option>${rms.map(r => `<option value="${r.id}" ${f.zona === r.id ? "selected" : ""}>${esc(r.nombre)}${r.zona ? " (" + esc(r.zona) + ")" : ""}</option>`).join("")}</select></label>` : ""}
      <label>Tienda<select data-bajas="tienda"><option value="">Todas</option>${S.tiendas.map(t => `<option value="${t.id}" ${f.tienda === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></label>
      <label>Periodo<select data-bajas="periodo">
        <option value="todo" ${f.periodo === "todo" ? "selected" : ""}>Todo el año</option>
        <option value="ultimos3" ${f.periodo === "ultimos3" ? "selected" : ""}>Últimos 3 meses</option>
        <option value="ultimo" ${f.periodo === "ultimo" ? "selected" : ""}>Último mes</option>
        ${mesesDisponibles().slice().reverse().map(m => `<option value="${m}" ${f.periodo === m ? "selected" : ""}>${esc(nombreMes(m))}</option>`).join("")}</select></label>
      ${f.zona || f.tienda || f.periodo !== "todo" ? `<button class="btn small ghost" data-action="bajasReset">Quitar filtros</button>` : ""}
    </div>`;

  // ---- Datos clave ----
  const tarjeta = (t, v, pie, clase) => `<div class="kpi-b ${clase || ""}"><small>${esc(t)}</small><b>${v}</b><small>${pie || ""}</small></div>`;
  h += `<div class="kpis-top">
    ${tarjeta("Tasa de absentismo", a.tasa == null ? "–" : n1(a.tasa) + " %",
      a.tasa == null ? "Falta la plantilla mensual" : `Objetivo ${n1(objetivo)} %`)}
    ${tarjeta("Días perdidos", SC.fmt(a.dias, 0), ms.length ? `en ${ms.length} ${ms.length === 1 ? "mes" : "meses"}` : "")}
    ${tarjeta("Procesos", SC.fmt(a.procesos, 0), a.abiertos ? `${a.abiertos} sin fecha de alta` : "todos cerrados")}
    ${tarjeta("Duración media", a.duracionMedia == null ? "–" : n1(a.duracionMedia) + " d", "días naturales por proceso")}
  </div>`;

  if (a.tasa == null && a.dias) {
    h += `<p class="hint aviso">La tasa necesita saber cuánta gente hay en cada tienda. Ese dato (<b>empleados</b>) llega
      con los KPIs mensuales del People Data Centre. Mientras no esté, se pueden ver los días perdidos pero no el porcentaje.</p>`;
  }

  // ---- Por mes: días perdidos y tasa, del año en curso hasta hoy ----
  const mesesAnio = (() => { const out = [], hoy = new Date(); for (let m = 1; m <= 12; m++) { const k = `${C.anio}-${String(m).padStart(2, "0")}`; if (k <= hoy.toISOString().slice(0, 7)) out.push(k); } return out; })();
  const porMes = mesesAnio.map(m => ts.reduce((s, t) => s + (t.bajas || []).reduce((s2, b) => s2 + SC.diasEnMes(b, m), 0), 0));
  const tasaMes = mesesAnio.map(m => { const r = SC.absentismo(ts, [m]); return r.tasa; });
  const abrev = m => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1).toLocaleDateString("es-ES", { month: "short" });
  if (porMes.some(x => x)) h += `<div class="grupo2 grid2"><section class="card"><div class="card-h"><h2>Días perdidos por mes</h2><span class="muted">${C.anio}</span></div>
      ${svgColumnas(mesesAnio.map(abrev), porMes, { titulo: "Días perdidos por mes", alto: 160 })}</section>
    <section class="card"><div class="card-h"><h2>Tasa de absentismo por mes</h2><span class="muted">objetivo ${n1(objetivo)} %</span></div>
      ${tasaMes.some(x => x != null) ? svgColumnas(mesesAnio.map(abrev), tasaMes.map(x => x || 0), { ref: objetivo, fmt: x => SC.fmt(x, 1) + " %", titulo: "Tasa de absentismo mensual", alto: 160, color: "var(--l15)" }) : `<p class="empty">La tasa necesita la plantilla mensual del People Data Centre.</p>`}
      <p class="hint">Los meses por encima de la línea discontinua superan el objetivo.</p></section></div>`;

  // ---- Por contingencia ----
  const totalTipo = Object.values(a.porTipo).reduce((s, x) => s + x, 0);
  if (totalTipo) {
    h += `<div class="grupo2"><h2 class="grupo">Por contingencia</h2><div class="tipos">
      ${C.bajasTipos.filter(x => a.porTipo[x.id]).map(x => {
        const d = a.porTipo[x.id];
        return `<div class="tipo-b"><small>${esc(x.t)}</small><b>${SC.fmt(d, 0)} d</b>
          <i class="barra"><span class="${x.color}" style="width:${Math.round(d / totalTipo * 100)}%"></span></i>
          <small>${SC.fmt(d / totalTipo * 100, 0)} % de los días</small></div>`;
      }).join("")}</div></div>`;
  }

  // ---- Por tienda ----
  h += `<div class="grupo2"><h2 class="grupo">Por tienda</h2><div class="tablewrap"><table><thead><tr>
    <th>Tienda</th><th>Código</th><th class="n">Días perdidos</th><th class="n">Tasa</th><th class="n">Procesos</th><th></th></tr></thead><tbody>`;
  const conDatos = a.porTienda.filter(x => x.dias || x.nBajas);
  h += conDatos.length ? conDatos.map(x => `<tr>
      <td>${esc(x.nombre)}</td><td>${esc(x.codigo || "")}</td>
      <td class="n">${SC.fmt(x.dias, 0)}</td>
      <td class="n">${x.tasa == null ? "–" : `<span class="${x.tasa > objetivo ? "malo" : "bueno"}">${n1(x.tasa)} %</span>`}</td>
      <td class="n">${x.nBajas}</td>
      <td class="n"><button class="btn small ghost" data-action="bajasVer" data-id="${x.id}">Ver bajas</button></td></tr>`).join("")
    : `<tr><td colspan="6" class="muted">No hay bajas registradas para este filtro.</td></tr>`;
  h += `</tbody></table></div></div>`;

  // ---- Ficha de una tienda ----
  const t = f.tienda ? S.tiendas.find(x => x.id === f.tienda) : null;
  if (t) h += fichaBajas(t);
  else h += `<p class="hint">Elige una tienda en el filtro, o pulsa «Ver bajas», para dar de alta o cerrar una baja.</p>`;

  h += `</div>`;
  $("vista").innerHTML = h;
  const form = $("formBaja");
  if (form) form.addEventListener("submit", altaBaja);
}

function fichaBajas(t) {
  const bajas = (t.bajas || []).slice().sort((x, y) => (y.inicio || "").localeCompare(x.inicio || ""));
  const hoy = new Date().toISOString().slice(0, 10);
  return `<div class="grupo2"><h2 class="grupo">${esc(t.nombre)}${t.codigo ? ` <small>${esc(t.codigo)}</small>` : ""}</h2>
    <div class="tablewrap"><table><thead><tr>
      <th>Persona</th><th>Puesto</th><th>Contingencia</th><th>Inicio</th><th>Alta</th><th class="n">Días</th><th></th></tr></thead><tbody>
    ${bajas.length ? bajas.map(b => `<tr>
      <td>${esc(b.nombre || "—")}</td><td>${esc(b.puesto || "")}</td>
      <td><span class="badge">${esc(tipoBaja(b.tipo).corto)}</span></td>
      <td class="num">${fechaCorta(b.inicio)}</td>
      <td class="num">${b.fin ? fechaCorta(b.fin) : `<input type="date" class="fecha-alta" data-alta="${b.id}" max="${hoy}" min="${esc(b.inicio)}" title="Fecha del alta médica">`}</td>
      <td class="n">${SC.diasTotales(b)}${b.fin ? "" : ` <span class="badge abierta">abierta</span>`}</td>
      <td class="n"><button class="btn small ghost danger" data-action="bajaBorrar" data-id="${b.id}">Eliminar</button></td></tr>`).join("")
      : `<tr><td colspan="7" class="muted">Sin bajas registradas en esta tienda.</td></tr>`}
    </tbody></table></div>
    <form class="inline-form" id="formBaja"><h3>Registrar una baja</h3>
      <label>Persona<input name="nombre" required maxlength="80" placeholder="Nombre y apellido"></label>
      <label>Puesto<select name="puesto"><option>Store Manager</option><option>Assistant Store Manager</option><option selected>Vendedor/a</option><option>Otro</option></select></label>
      <label>Contingencia<select name="tipo">${C.bajasTipos.map(x => `<option value="${x.id}">${esc(x.t)}</option>`).join("")}</select></label>
      <label>Inicio<input type="date" name="inicio" required max="${hoy}"></label>
      <label>Alta<input type="date" name="fin" max="${hoy}"><small class="ayuda">Vacío si sigue de baja</small></label>
      <button class="btn primary" type="submit">Registrar</button></form>
    <p class="hint">No hay campo para el motivo ni el diagnóstico: no se guarda, por diseño.</p></div>`;
}

function altaBaja(ev) {
  ev.preventDefault();
  const t = S.tiendas.find(x => x.id === filtroBajas().tienda);
  if (!t) return;
  const f = Object.fromEntries(new FormData(ev.target));
  if (f.fin && f.fin < f.inicio) return alert("La fecha de alta no puede ser anterior al inicio de la baja.");
  t.bajas = t.bajas || [];
  t.bajas.push({ id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nombre: (f.nombre || "").trim(), puesto: f.puesto, tipo: f.tipo, inicio: f.inicio, fin: f.fin || null });
  log(`Alta de una baja en ${t.nombre}`, t);
  guardar(t); toast("Baja registrada"); pintar();
}

function bajasCsv() {
  const cab = ["Tienda", "Código", "Persona", "Puesto", "Contingencia", "Inicio", "Alta", "Días"];
  const lin = [];
  tiendasBajas().forEach(t => (t.bajas || []).forEach(b => lin.push(
    [t.nombre, t.codigo || "", b.nombre || "", b.puesto || "", tipoBaja(b.tipo).t, b.inicio, b.fin || "", SC.diasTotales(b)])));
  const q = v => { v = String(v == null ? "" : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + [cab, ...lin].map(r => r.map(q).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  a.download = `bajas_${C.anio}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

function cerrarBaja(id, fecha) {
  const t = S.tiendas.find(x => x.id === filtroBajas().tienda);
  const b = t && (t.bajas || []).find(y => y.id === id);
  if (!t || !b) return;
  if (fecha < b.inicio) { alert("El alta no puede ser anterior al inicio de la baja."); pintarBajas(); return; }
  b.fin = fecha;
  log(`Alta médica registrada en ${t.nombre}`, t);
  guardar(t); toast("Alta registrada"); pintarBajas();
}

const ACCIONES_BAJAS = {
  bajasReset() { S.bajas = { zona: "", tienda: "", periodo: "todo", alta: "" }; },
  bajasVer(b) { filtroBajas().tienda = b.dataset.id; },
  bajasCsv() { bajasCsv(); return false; },
  bajaBorrar(b) {
    const t = S.tiendas.find(x => x.id === filtroBajas().tienda); if (!t) return false;
    if (!confirm("¿Eliminar este registro de baja?")) return false;
    t.bajas = (t.bajas || []).filter(y => y.id !== b.dataset.id);
    log(`Baja eliminada del registro en ${t.nombre}`, t); guardar(t);
  }
};
