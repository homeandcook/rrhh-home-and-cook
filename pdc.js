"use strict";
/* ===================== PEOPLE DATA CENTRE =====================
   Datos clave de la red con filtros, y tres bloques: negocio, RR.HH.
   y ajuste de la plantilla al tráfico.
   ============================================================== */
function mesesDisponibles() {
  const set = new Set();
  S.tiendas.forEach(t => Object.keys(t.kpis || (t.datos && t.datos.kpis) || {}).forEach(m => set.add(m)));
  return [...set].sort();
}
function nombreMes(m) {
  const [a, mm] = m.split("-");
  return new Date(Number(a), Number(mm) - 1, 1).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}
function filtroPDC() {
  S.pdc = S.pdc || { zona: "", tienda: "", periodo: "todo" };
  return S.pdc;
}
function tiendasPDC() {
  const f = filtroPDC();
  return S.tiendas.filter(t => (!f.tienda || t.id === f.tienda) && (!f.zona || (perfil(t.rm_id) || {}).id === f.zona));
}
function mesesPDC() {
  const f = filtroPDC(), ms = mesesDisponibles();
  if (f.periodo === "todo" || !ms.length) return ms;
  if (f.periodo === "ultimos3") return ms.slice(-3);
  if (f.periodo === "ultimo") return ms.slice(-1);
  return ms.filter(m => m === f.periodo);
}

function pintarPDC() {
  if (filtroPDC().vista === "cargar") return pintarPDCCarga();
  const f = filtroPDC(), ms = mesesPDC(), ts = tiendasPDC(), k = SC.kpis(ts, ms);
  const msPrev = (() => { const all = mesesDisponibles(); const i = all.indexOf(ms[0]); return i > 0 ? all.slice(Math.max(0, i - ms.length), i) : []; })();
  const kPrev = msPrev.length ? SC.kpis(ts, msPrev) : null;
  const rms = S.perfiles.filter(p => p.rol === "rm");
  const eur0 = x => x == null ? "–" : SC.eur(x, 0);
  const comp = (a, b, inv) => {
    if (a == null || b == null || !b) return "";
    const d = (a - b) / Math.abs(b), bueno = inv ? d < 0 : d > 0;
    return `<span class="dev ${Math.abs(d) < 0.005 ? "" : bueno ? "pos" : "neg"}">${d > 0 ? "+" : ""}${SC.pct(d, 1)}</span>`;
  };
  const tarjeta = (titulo, valor, pie, extra) => `<div class="kpi-b"><small>${esc(titulo)}</small><b>${valor}</b><small>${pie || ""} ${extra || ""}</small></div>`;

  let h = `<div class="page pdc">
    <div class="page-h"><h1>People Data Centre</h1><span class="docs-acc">${esMarketing() ? "" : `<button class="btn" data-action="pdcVista" data-v="cargar">Cargar datos</button>`}<button class="btn ghost" data-action="pdcCsv">Exportar CSV</button></span></div>
    <div class="filters">
      <label>Zona<select data-pdc="zona"><option value="">Todas</option>${rms.map(r => `<option value="${r.id}" ${f.zona === r.id ? "selected" : ""}>${esc(r.nombre)}${r.zona ? " (" + esc(r.zona) + ")" : ""}</option>`).join("")}</select></label>
      <label>Tienda<select data-pdc="tienda"><option value="">Todas</option>${S.tiendas.map(t => `<option value="${t.id}" ${f.tienda === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></label>
      <label>Periodo<select data-pdc="periodo">
        <option value="todo" ${f.periodo === "todo" ? "selected" : ""}>Todo el año</option>
        <option value="ultimos3" ${f.periodo === "ultimos3" ? "selected" : ""}>Últimos 3 meses</option>
        <option value="ultimo" ${f.periodo === "ultimo" ? "selected" : ""}>Último mes</option>
        ${mesesDisponibles().slice().reverse().map(m => `<option value="${m}" ${f.periodo === m ? "selected" : ""}>${esc(nombreMes(m))}</option>`).join("")}</select></label>
      ${f.zona || f.tienda || f.periodo !== "todo" ? `<button class="btn small ghost" data-action="pdcReset">Quitar filtros</button>` : ""}
    </div>`;

  if (!ms.length || !k.nTiendas) { $("vista").innerHTML = h + `<div class="empty big"><p>${mesesDisponibles().length ? "No hay datos para este filtro." : "Todavía no hay datos mensuales cargados."}</p>
    ${esMarketing() ? "" : `<p class="hint">Se cargan pegando desde Excel o con el formulario de un mes, tienda a tienda.</p><button class="btn primary" data-action="pdcVista" data-v="cargar">Cargar datos</button>`}</div></div>`; return; }

  // Datos clave
  h += `<div class="kpis-top">
    ${tarjeta("Tiendas", k.nTiendas, `${esc(ms.length)} ${ms.length === 1 ? "mes" : "meses"}`)}
    ${tarjeta("Empleados", k.empleados, "en plantilla")}
    ${tarjeta("Facturación", eur0(k.ventas), "del periodo", kPrev ? comp(k.ventas, kPrev.ventas) : "")}
    ${tarjeta("Facturación por tienda", eur0(k.ventas / k.nTiendas), "media")}
    ${tarjeta("Ticket medio", k.ticketMedio == null ? "–" : SC.eur(k.ticketMedio), "", kPrev ? comp(k.ticketMedio, kPrev.ticketMedio) : "")}
    ${tarjeta("Conversión", SC.pct(k.conversion, 1), "visitas que compran", kPrev ? comp(k.conversion, kPrev.conversion) : "")}
  </div>`;

  h += bloqueGraficosPDC(ts, ms);

  // Bloque 1: negocio
  h += `<h2 class="grupo">KPIs de negocio</h2><div class="kpis-grid">
    ${tarjeta("Ticket medio", k.ticketMedio == null ? "–" : SC.eur(k.ticketMedio), "facturación ÷ tickets")}
    ${tarjeta("Unidades por ticket", SC.fmt(k.upt, 2), "unidades ÷ tickets")}
    ${tarjeta("Conversión", SC.pct(k.conversion, 1), "tickets ÷ visitantes")}
    ${tarjeta("Tickets", SC.fmt(k.tickets, 0), "del periodo")}
    ${tarjeta("Visitantes", SC.fmt(k.visitantes, 0), "contador de tráfico")}
    ${tarjeta("Facturación por empleado", eur0(k.ventasPorEmpleado), "del periodo")}
  </div>`;

  // Bloque 2: RR.HH.
  h += `<h2 class="grupo">KPIs de RR.HH.</h2><div class="kpis-grid">
    ${tarjeta("Facturación por hora contratada", eur0(k.ventasPorHoraContratada), "ventas ÷ horas contratadas", kPrev ? comp(k.ventasPorHoraContratada, kPrev.ventasPorHoraContratada) : "")}
    ${tarjeta("Productividad por hora trabajada", eur0(k.productividad), "ventas ÷ horas trabajadas")}
    ${tarjeta("Horas contratadas por hora de apertura", SC.fmt(k.horasContratadasPorApertura, 2), "cobertura contractual")}
    ${tarjeta("Headcount por hora de apertura", SC.fmt(k.headcountPorApertura, 2), "personas de media en sala")}
    ${tarjeta("Uso de horas contratadas", SC.pct(k.usoHoras, 0), "trabajadas ÷ contratadas")}
    ${tarjeta("Horas de apertura", SC.fmt(k.horasApertura, 0), "del periodo")}
  </div>`;

  // Bloque 3: staff adaptation to traffic
  const sumT = k.trafico.reduce((a, b) => a + b, 0), sumP = k.horasPlan.reduce((a, b) => a + b, 0);
  h += `<h2 class="grupo">Staff adaptation to traffic</h2>
  <div class="grid2"><section class="card">
    <div class="card-h"><h2>Ajuste global</h2><span class="prio ${k.adaptacion >= 0.85 ? "pSeguimientonormal" : k.adaptacion >= 0.75 ? "pVigilar" : "pActuarya"}">${SC.pct(k.adaptacion, 0)}</span></div>
    <p class="hint">Mide cuánto se parece el reparto de horas planificadas al reparto del tráfico por franja. 100 % sería tener las horas exactamente donde está la gente.</p>
    <table class="mini"><thead><tr><th>Franja</th><th class="n">Tráfico</th><th class="n">Horas</th><th>Comparación</th></tr></thead><tbody>
    ${SC.CONFIG.franjas.map((fr, i) => {
      const a = sumT ? k.trafico[i] / sumT : 0, b = sumP ? k.horasPlan[i] / sumP : 0;
      return `<tr><td>${esc(fr)}</td><td class="n">${SC.pct(a, 0)}</td><td class="n">${SC.pct(b, 0)}</td>
        <td><span class="bar2"><i class="t" style="width:${Math.round(a * 200)}%"></i><i class="p" style="width:${Math.round(b * 200)}%"></i></span></td></tr>`;
    }).join("")}</tbody></table>
    <p class="hint"><span class="leyenda t"></span> tráfico <span class="leyenda p"></span> horas planificadas</p></section>
  <section class="card"><h2>Tiendas peor ajustadas</h2>
    <table class="mini"><tbody>${tiendasPDC().map(t => ({ t, a: SC.kpis([t], ms).adaptacion })).filter(x => x.a != null).sort((a, b) => a.a - b.a).slice(0, 8)
      .map(x => `<tr><td>${esc(x.t.nombre)}</td><td class="n" style="width:70px"><b>${SC.pct(x.a, 0)}</b></td>
        <td style="width:120px"><span class="bar"><i style="width:${Math.round(x.a * 100)}%"></i></span></td></tr>`).join("")}</tbody></table>
    <p class="hint">Por debajo del 75 % suele significar horas concentradas en la mañana cuando el tráfico está por la tarde.</p></section></div>`;

  // Detalle por tienda
  h += `<section class="card"><div class="card-h"><h2>Detalle por tienda</h2><span class="muted">${k.nTiendas} tiendas</span></div>
  <div class="tablewrap"><table><thead><tr><th>Tienda</th><th>Zona</th><th class="n">Facturación</th><th class="n">Ticket medio</th><th class="n">UPT</th><th class="n">Conversión</th><th class="n">€/hora contratada</th><th class="n">Horas contr./apertura</th><th class="n">Ajuste al tráfico</th></tr></thead><tbody>
  ${tiendasPDC().map(t => ({ t, k: SC.kpis([t], ms) })).filter(x => x.k.nTiendas).sort((a, b) => b.k.ventas - a.k.ventas).map(x => `<tr>
    <td>${esc(x.t.nombre)}</td><td>${esc((perfil(x.t.rm_id) || {}).zona || "–")}</td>
    <td class="n">${eur0(x.k.ventas)}</td><td class="n">${x.k.ticketMedio == null ? "–" : SC.eur(x.k.ticketMedio)}</td>
    <td class="n">${SC.fmt(x.k.upt, 2)}</td><td class="n">${SC.pct(x.k.conversion, 1)}</td>
    <td class="n">${eur0(x.k.ventasPorHoraContratada)}</td><td class="n">${SC.fmt(x.k.horasContratadasPorApertura, 2)}</td>
    <td class="n">${SC.pct(x.k.adaptacion, 0)}</td></tr>`).join("")}
  </tbody></table></div></section></div>`;
  $("vista").innerHTML = h;
}

function pdcCsv() {
  const ms = mesesPDC();
  const cab = ["Tienda", "Zona", "Periodo", "Facturación", "Tickets", "Unidades", "Visitantes", "Ticket medio", "UPT", "Conversión", "Horas contratadas", "Horas trabajadas", "Horas apertura", "Empleados", "€/hora contratada", "Productividad €/hora trabajada", "Horas contratadas por hora apertura", "Headcount por hora apertura", "Ajuste al tráfico"];
  const n = (x, d) => x == null ? "" : SC.fmt(x, d).replace(/\./g, "");
  const lin = tiendasPDC().map(t => { const k = SC.kpis([t], ms); return [t.nombre, (perfil(t.rm_id) || {}).zona || "", ms.join(" "), n(k.ventas, 2), n(k.tickets, 0), n(k.unidades, 0), n(k.visitantes, 0),
    n(k.ticketMedio, 2), n(k.upt, 2), n(k.conversion, 4), n(k.horasContratadas, 0), n(k.horasTrabajadas, 0), n(k.horasApertura, 0), n(k.empleados, 0),
    n(k.ventasPorHoraContratada, 2), n(k.productividad, 2), n(k.horasContratadasPorApertura, 2), n(k.headcountPorApertura, 2), n(k.adaptacion, 4)]; });
  const q = v => { v = String(v == null ? "" : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + [cab, ...lin].map(r => r.map(q).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  a.download = `people_data_centre_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
}

const ACCIONES_PDC = {
  pdcReset() { S.pdc = { zona: "", tienda: "", periodo: "todo", vista: "cuadro" }; },
  pdcCsv() { pdcCsv(); return false; }
};
