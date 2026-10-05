"use strict";
/* ===================== PEOPLE DATA CENTRE: CARGA DE DATOS Y GRÁFICOS =====================
   Dos formas de meter los KPIs mensuales de cada tienda:
   1. Pegar desde Excel (o subir un CSV) con una fila por tienda y mes. Se
      reconocen las columnas por su nombre, se previsualiza y se carga.
   2. Formulario manual: una tienda, un mes, los campos.
   Y los gráficos del cuadro de mando: tendencia mensual y ranking de tiendas,
   dibujados en SVG a escala, sin librerías.
   ========================================================================================= */
const PDC_CAMPOS = [
  { id: "ventas",           t: "Ventas (€)",            alias: ["ventas", "facturacion", "facturación", "sales", "venta"] },
  { id: "tickets",          t: "Tickets",               alias: ["tickets", "ticket", "transacciones", "operaciones"] },
  { id: "unidades",         t: "Unidades",              alias: ["unidades", "units", "uds"] },
  { id: "visitantes",       t: "Visitantes",            alias: ["visitantes", "trafico", "tráfico", "visitas", "footfall", "entradas"] },
  { id: "horasContratadas", t: "Horas contratadas",     alias: ["horas contratadas", "h contratadas", "contratadas", "hc"] },
  { id: "horasTrabajadas",  t: "Horas trabajadas",      alias: ["horas trabajadas", "h trabajadas", "trabajadas", "ht"] },
  { id: "horasApertura",    t: "Horas de apertura",     alias: ["horas apertura", "horas de apertura", "apertura", "ha"] },
  { id: "empleados",        t: "Empleados (plantilla)", alias: ["empleados", "plantilla", "headcount", "personas"] }
];
const PDC_FRANJA_RE = /^(trafico|tráfico|t|horas plan|plan|hp)\s*[_\- ]?\s*(\d{1,2})\s*[-–]\s*(\d{1,2})$/i;

function pdcEstado() { const f = filtroPDC(); f.vista = f.vista || "cuadro"; return f; }
function pdcNormaliza(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9%€\- ]+/g, " ").replace(/\s+/g, " ").trim(); }
function pdcMes(v) {
  const s = String(v || "").trim();
  let m = s.match(/^(\d{4})[-\/](\d{1,2})/); if (m) return `${m[1]}-${String(m[2]).padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[-\/](\d{4})/); if (m) return `${m[2]}-${String(m[1]).padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/); if (m) return `${m[3]}-${String(m[2]).padStart(2, "0")}`;
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  m = pdcNormaliza(s).match(/^([a-z]{3})[a-z]*\.?\s*[-\/ ]?\s*(\d{2,4})$/);
  if (m && meses.includes(m[1])) return `${m[2].length === 2 ? "20" + m[2] : m[2]}-${String(meses.indexOf(m[1]) + 1).padStart(2, "0")}`;
  return null;
}
/* Parsea texto pegado (tabulado o CSV con ; o ,) a filas reconocidas */
function pdcParsear(texto) {
  const lineas = String(texto || "").replace(/\r/g, "").split("\n").filter(l => l.trim());
  if (lineas.length < 2) return { error: "Hacen falta al menos una fila de cabecera y una de datos." };
  const sep = lineas[0].includes("\t") ? "\t" : (lineas[0].split(";").length > lineas[0].split(",").length ? ";" : ",");
  const partir = l => l.split(sep).map(x => x.trim().replace(/^"|"$/g, ""));
  const cab = partir(lineas[0]).map(pdcNormaliza);
  const col = {};
  let iTienda = -1, iMes = -1;
  const franjas = {};
  cab.forEach((c, i) => {
    if (["codigo", "código", "tienda", "store", "code", "cod"].includes(c)) { if (iTienda < 0) iTienda = i; return; }
    if (["mes", "month", "periodo", "fecha"].includes(c)) { iMes = i; return; }
    const f = PDC_CAMPOS.find(x => x.alias.map(pdcNormaliza).includes(c)); if (f) { col[f.id] = i; return; }
    const m = c.match(PDC_FRANJA_RE);
    if (m) { const k = /plan|hp/.test(m[1]) ? "horasPlan" : "trafico", fr = `${m[2]}-${m[3]}`, fi = C.franjas.indexOf(fr); if (fi >= 0) { franjas[k] = franjas[k] || {}; franjas[k][fi] = i; } }
  });
  if (iTienda < 0) return { error: "No encuentro la columna de tienda. Llámala «Código» o «Tienda»." };
  if (iMes < 0) return { error: "No encuentro la columna «Mes» (formato 2026-03, 03/2026 o mar-26)." };
  if (!Object.keys(col).length) return { error: "No reconozco ninguna columna de datos. Usa la plantilla o los nombres de la lista." };
  const filas = [];
  lineas.slice(1).forEach((l, n) => {
    const v = partir(l); if (!v.some(x => x)) return;
    const ref = pdcNormaliza(v[iTienda]);
    const t = S.tiendas.find(x => pdcNormaliza(x.codigo) === ref) || S.tiendas.find(x => pdcNormaliza(x.nombre) === ref) || S.tiendas.find(x => ref && pdcNormaliza(x.nombre).includes(ref));
    const mes = pdcMes(v[iMes]);
    const d = {};
    Object.entries(col).forEach(([k, i]) => { const x = SC.num(v[i]); if (x != null) d[k] = x; });
    ["trafico", "horasPlan"].forEach(k => { if (franjas[k]) { d[k] = C.franjas.map((_, fi) => franjas[k][fi] != null ? (SC.num(v[franjas[k][fi]]) || 0) : 0); } });
    filas.push({ n: n + 2, ref: v[iTienda], t, mes, d, ok: !!t && !!mes && Object.keys(d).length > 0,
      error: !t ? "Tienda no encontrada" : !mes ? "Mes no válido" : !Object.keys(d).length ? "Sin datos numéricos" : "" });
  });
  return { filas, columnas: Object.keys(col), franjas: Object.keys(franjas) };
}
function pdcPlantillaCsv() {
  const cab = ["Código", "Mes"].concat(PDC_CAMPOS.map(c => c.t.replace(/ \(.*\)/, "")), C.franjas.map(f => "Tráfico " + f), C.franjas.map(f => "Horas plan " + f));
  const mes = new Date(); mes.setMonth(mes.getMonth() - 1);
  const m = mes.toISOString().slice(0, 7);
  const lin = S.tiendas.map(t => [t.codigo || t.nombre, m].concat(PDC_CAMPOS.map(() => ""), C.franjas.map(() => ""), C.franjas.map(() => "")));
  const txt = "﻿" + [cab, ...lin].map(r => r.join(";")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
  a.download = `plantilla_kpis_${m}.csv`; document.body.appendChild(a); a.click(); a.remove();
}
function pdcAplicar(filas) {
  let n = 0; const tocadas = new Set();
  filas.filter(f => f.ok).forEach(f => {
    f.t.kpis = f.t.kpis || {};
    f.t.kpis[f.mes] = Object.assign({}, f.t.kpis[f.mes] || {}, f.d);
    tocadas.add(f.t); n++;
  });
  tocadas.forEach(t => guardar(t));
  log(`PDC: cargados ${n} registros mensuales en ${tocadas.size} tiendas`);
  return n;
}

/* ---------- Vista de carga ---------- */
function pintarPDCCarga() {
  const f = pdcEstado(), prev = f.previa;
  const t = f.manualTienda ? S.tiendas.find(x => x.id === f.manualTienda) : null;
  const mesDef = f.manualMes || (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const dat = t && t.kpis && t.kpis[mesDef] ? t.kpis[mesDef] : {};
  let h = `<div class="page pdc">
    <div class="page-h"><div><button class="btn small ghost" data-action="pdcVista" data-v="cuadro">← Cuadro de mando</button><h1>Cargar datos mensuales</h1></div>
      <button class="btn small" data-action="pdcPlantilla">Descargar plantilla CSV</button></div>
    <div class="grid2 carga">
    <section class="card"><h2>Pegar desde Excel</h2>
      <p class="hint">Copia el rango en Excel (con la fila de cabecera) y pégalo aquí. Una fila por tienda y mes. Columnas reconocidas: Código o Tienda, Mes, ${PDC_CAMPOS.map(c => c.t.replace(/ \(.*\)/, "")).join(", ")}; y, si las tienes, «Tráfico 10-12»… y «Horas plan 10-12»… por franja.</p>
      <textarea id="pdcPegar" rows="8" placeholder="Código	Mes	Ventas	Tickets	Unidades	Visitantes	Horas contratadas	Horas trabajadas	Horas apertura	Empleados
ES014	2026-03	96.420	2.011	2.650	18.900	1.280	1.195	300	7">${esc(f.pegado || "")}</textarea>
      <div class="actions"><label class="btn" style="margin:0">Subir CSV<input type="file" id="pdcFichero" accept=".csv,.txt,.tsv" hidden></label><button class="btn primary" data-action="pdcPrevisualizar">Previsualizar</button></div>
      ${prev ? (prev.error ? `<p class="bad">${esc(prev.error)}</p>` : `
        <div class="card-h" style="margin-top:14px"><h3>${prev.filas.filter(x => x.ok).length} filas listas de ${prev.filas.length}</h3><span class="muted">${prev.columnas.length} columnas de datos${prev.franjas.length ? " · franjas: " + prev.franjas.join(", ") : ""}</span></div>
        <div class="tablewrap previa"><table class="mini"><thead><tr><th>Fila</th><th>Tienda</th><th>Mes</th><th class="n">Ventas</th><th class="n">Tickets</th><th class="n">Visitantes</th><th class="n">H. trab.</th><th class="n">Empl.</th><th></th></tr></thead><tbody>
        ${prev.filas.map(x => `<tr class="${x.ok ? "" : "fila-mal"}"><td class="n">${x.n}</td><td>${x.t ? esc(x.t.nombre) : `<span class="err">${esc(x.ref)}</span>`}</td><td>${esc(x.mes || "–")}</td>
          <td class="n">${x.d.ventas != null ? SC.fmt(x.d.ventas, 0) : "–"}</td><td class="n">${x.d.tickets != null ? SC.fmt(x.d.tickets, 0) : "–"}</td><td class="n">${x.d.visitantes != null ? SC.fmt(x.d.visitantes, 0) : "–"}</td>
          <td class="n">${x.d.horasTrabajadas != null ? SC.fmt(x.d.horasTrabajadas, 0) : "–"}</td><td class="n">${x.d.empleados != null ? SC.fmt(x.d.empleados, 0) : "–"}</td>
          <td>${x.ok ? `<span class="st cerrado">lista</span>` : `<span class="flag e">${esc(x.error)}</span>`}</td></tr>`).join("")}</tbody></table></div>
        <div class="actions"><button class="btn primary" data-action="pdcCargar" ${prev.filas.some(x => x.ok) ? "" : "disabled"}>Cargar ${prev.filas.filter(x => x.ok).length} filas</button></div>
        <p class="hint">Si un mes ya tenía datos en una tienda, se sustituyen solo los campos que vienen en el fichero.</p>`) : ""}
    </section>
    <section class="card"><h2>Un mes a mano</h2>
      <p class="hint">Para corregir un dato o cargar una tienda suelta.</p>
      <form id="formPdcManual"><div class="grid2">
        <label>Tienda<select name="tienda" data-pdcm="manualTienda"><option value="">Elige tienda</option>${S.tiendas.map(x => `<option value="${x.id}" ${f.manualTienda === x.id ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select></label>
        <label>Mes<input type="month" name="mes" data-pdcm="manualMes" value="${esc(mesDef)}" required></label>
        ${PDC_CAMPOS.map(c => `<label>${esc(c.t)}<input name="${c.id}" inputmode="decimal" class="numin" value="${dat[c.id] != null ? esc(SC.fmt(dat[c.id], c.id === "empleados" ? 0 : 0)) : ""}" placeholder="–"></label>`).join("")}
        </div>
        <h3 style="margin-top:14px">Por franja horaria <small>opcional: para el ajuste al tráfico</small></h3>
        <div class="tablewrap"><table class="mini franjas"><thead><tr><th></th>${C.franjas.map(fr => `<th class="n">${esc(fr)}</th>`).join("")}</tr></thead><tbody>
          <tr><td>Visitantes</td>${C.franjas.map((fr, i) => `<td><input name="trafico${i}" inputmode="numeric" class="numin short" value="${(dat.trafico || [])[i] != null ? esc(dat.trafico[i]) : ""}"></td>`).join("")}</tr>
          <tr><td>Horas planificadas</td>${C.franjas.map((fr, i) => `<td><input name="horasPlan${i}" inputmode="numeric" class="numin short" value="${(dat.horasPlan || [])[i] != null ? esc(dat.horasPlan[i]) : ""}"></td>`).join("")}</tr>
        </tbody></table></div>
        <div class="actions"><button class="btn primary" type="submit" ${t ? "" : "disabled"}>Guardar ${t ? esc(nombreMes(mesDef)) : ""}</button></div>
      </form>
      ${t && t.kpis && Object.keys(t.kpis).length ? `<p class="hint">${esc(t.nombre)} tiene datos de: ${Object.keys(t.kpis).sort().map(nombreMes).join(", ")}.</p>` : ""}
    </section></div></div>`;
  $("vista").innerHTML = h;
  const fi = $("pdcFichero"); if (fi) fi.addEventListener("change", ev => {
    const file = ev.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = () => { pdcEstado().pegado = String(r.result); pdcEstado().previa = pdcParsear(r.result); pintarPDCCarga(); }; r.readAsText(file, "utf-8");
  });
  const fm = $("formPdcManual"); if (fm) fm.addEventListener("submit", ev => {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(fm)), tt = S.tiendas.find(x => x.id === v.tienda); if (!tt) return;
    const d = {}; PDC_CAMPOS.forEach(c => { const x = SC.num(v[c.id]); if (x != null) d[c.id] = x; });
    const tr = C.franjas.map((_, i) => SC.num(v["trafico" + i])), hp = C.franjas.map((_, i) => SC.num(v["horasPlan" + i]));
    if (tr.some(x => x != null)) d.trafico = tr.map(x => x || 0);
    if (hp.some(x => x != null)) d.horasPlan = hp.map(x => x || 0);
    if (!Object.keys(d).length) { toast("No hay ningún dato que guardar."); return; }
    tt.kpis = tt.kpis || {}; tt.kpis[v.mes] = Object.assign({}, tt.kpis[v.mes] || {}, d);
    guardar(tt); log(`PDC: datos de ${nombreMes(v.mes)} en ${tt.nombre}`, tt); toast("Mes guardado"); pdcEstado().manualMes = v.mes; pintarPDCCarga();
  });
}

/* ---------- Gráficos SVG ---------- */
function svgLineas(series, meses, opt) {
  // series: [{t, v:[...], color}] con un valor por mes; dibuja a escala con eje y desde 0
  const W = 640, H = opt.alto || 170, L = 58, R = 14, T = 16, B = 28, w = W - L - R, h = H - T - B;
  const vals = series.flatMap(s => s.v).filter(x => x != null);
  if (!vals.length) return `<p class="empty">Sin datos para dibujar.</p>`;
  const max = Math.max(...vals) * 1.1 || 1, n = meses.length;
  const X = i => L + (n === 1 ? w / 2 : i * w / (n - 1)), Y = v => T + h - v / max * h;
  const fmt = opt.fmt || (x => SC.fmt(x, 0)), fmtEje = opt.fmtEje || fmt;
  const ticks = [0, 0.5, 1].map(k => max * k);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.titulo || "")}">`;
  ticks.forEach(v => s += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="grid"/><text x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" class="tick" text-anchor="end">${esc(fmtEje(v))}</text>`);
  meses.forEach((m, i) => { if (n <= 8 || i % Math.ceil(n / 8) === 0) s += `<text x="${X(i).toFixed(1)}" y="${H - 8}" class="tick" text-anchor="middle">${esc(nombreMes(m).replace(/ \d{4}/, ""))}</text>`; });
  series.forEach(se => {
    const pts = se.v.map((v, i) => v == null ? null : [X(i), Y(v)]).filter(Boolean);
    if (pts.length > 1) s += `<path d="M${pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L")}" fill="none" stroke="${se.color}" stroke-width="2.5" stroke-linejoin="round"/>`;
    pts.forEach(p => s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${se.color}"/>`);
    const u = pts[pts.length - 1]; if (u) s += `<text x="${(u[0] + (u[0] > W - 80 ? -8 : 8)).toFixed(1)}" y="${(u[1] - 8).toFixed(1)}" class="lbl" text-anchor="${u[0] > W - 80 ? "end" : "start"}">${esc(fmt(se.v.filter(x => x != null).slice(-1)[0]))}</text>`;
  });
  return s + `</svg>`;
}
function svgBarras(filas, opt) {
  // filas: [{t, v, ref}] ordenadas; barras horizontales a escala con línea de referencia opcional
  if (!filas.length) return `<p class="empty">Sin datos para dibujar.</p>`;
  const max = Math.max(...filas.map(f => f.v), opt.ref || 0) * 1.05 || 1;
  const fmt = opt.fmt || (x => SC.fmt(x, 0));
  return `<div class="barras">${filas.map(f => `<div class="barra-f"><span class="barra-t" title="${esc(f.t)}">${esc(f.t)}</span>
    <span class="barra-b"><i style="width:${(f.v / max * 100).toFixed(1)}%" class="${opt.ref != null ? (f.v >= opt.ref ? "ok" : "mal") : ""}"></i>${opt.ref != null ? `<b style="left:${(opt.ref / max * 100).toFixed(1)}%" title="Media ${esc(fmt(opt.ref))}"></b>` : ""}</span>
    <span class="barra-v num">${esc(fmt(f.v))}</span></div>`).join("")}</div>`;
}
const compacto = x => x >= 1e6 ? SC.fmt(x / 1e6, 1) + " M€" : x >= 1000 ? SC.fmt(Math.round(x / 1000), 0) + " k€" : SC.eur(x, 0);
const nombreCorto = n => String(n || "").replace(/^HOME & COOK /i, "H&C ");
function svgColumnas(etiquetas, valores, opt) {
  // columnas verticales a escala; opt.ref dibuja una línea de referencia
  if (!valores.some(v => v)) return `<p class="empty">${esc(opt.vacio || "Sin datos para dibujar.")}</p>`;
  const W = 640, H = opt.alto || 150, L = 44, R = 10, T = 14, B = 26, w = W - L - R, h = H - T - B, n = valores.length;
  const max = Math.max(...valores, opt.ref || 0) * 1.12 || 1, fmt = opt.fmt || (x => SC.fmt(x, 0));
  const bw = Math.min(40, w / n * 0.62), X = i => L + (i + 0.5) * w / n, Y = v => T + h - v / max * h;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.titulo || "")}">`;
  [0, 0.5, 1].forEach(k => { const v = max * k; s += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="grid"/><text x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" class="tick" text-anchor="end">${esc(fmt(v))}</text>`; });
  valores.forEach((v, i) => {
    s += `<rect x="${(X(i) - bw / 2).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(T + h - Y(v)).toFixed(1)}" rx="3" fill="${opt.ref != null && v > opt.ref ? "var(--l0)" : (opt.color || "var(--l1)")}"/>`;
    if (v) s += `<text x="${X(i).toFixed(1)}" y="${(Y(v) - 5).toFixed(1)}" class="lbl" text-anchor="middle">${esc(fmt(v))}</text>`;
    s += `<text x="${X(i).toFixed(1)}" y="${H - 8}" class="tick" text-anchor="middle">${esc(etiquetas[i])}</text>`;
  });
  if (opt.ref != null) s += `<line x1="${L}" x2="${W - R}" y1="${Y(opt.ref).toFixed(1)}" y2="${Y(opt.ref).toFixed(1)}" stroke="var(--ink)" stroke-dasharray="4 4" opacity=".6"/>`;
  return s + `</svg>`;
}
function bloqueGraficosPDC(ts, ms) {
  const todos = mesesDisponibles();
  if (todos.length < 2) return "";
  const serie = fn => todos.map(m => { const k = SC.kpis(ts, [m]); return k.nTiendas ? fn(k) : null; });
  const rank = ts.map(t => ({ t: t.nombre, k: SC.kpis([t], ms) })).filter(x => x.k.nTiendas && x.k.productividad != null).map(x => ({ t: nombreCorto(x.t), v: x.k.productividad })).sort((a, b) => b.v - a.v);
  const media = rank.length ? rank.reduce((s, x) => s + x.v, 0) / rank.length : null;
  return `<div class="grid2 graficos"><section class="card"><div class="card-h"><h2>Tendencia mensual</h2><span class="muted">${todos.length} meses</span></div>
      <p class="chart-leyenda"><i style="background:var(--l1)"></i>Facturación del mes</p>
      ${svgLineas([{ t: "Facturación", v: serie(k => k.ventas), color: "var(--l1)" }], todos, { fmt: x => SC.eur(x, 0), fmtEje: compacto, titulo: "Facturación mensual de las tiendas filtradas", alto: 150 })}
      <p class="chart-leyenda"><i style="background:var(--oro)"></i>Facturación por hora trabajada</p>
      ${svgLineas([{ t: "€/h", v: serie(k => k.productividad), color: "var(--oro)" }], todos, { fmt: x => SC.eur(x, 0), titulo: "Productividad mensual", alto: 130 })}
      <p class="chart-leyenda"><i style="background:var(--l15)"></i>Conversión</p>
      ${svgLineas([{ t: "Conversión", v: serie(k => k.conversion == null ? null : k.conversion * 100), color: "var(--l15)" }], todos, { fmt: x => SC.fmt(x, 1) + " %", titulo: "Conversión mensual", alto: 130 })}
    </section>
    <section class="card"><div class="card-h"><h2>Productividad por tienda</h2><span class="muted">€ por hora trabajada</span></div>
      <p class="hint">La línea es la media del filtro${media != null ? ` (${SC.eur(media, 0)})` : ""}. Las tiendas por debajo suelen tener horas en franjas sin tráfico.</p>
      ${svgBarras(rank.slice(0, 21), { ref: media, fmt: x => SC.eur(x, 0) })}
    </section></div>`;
}
document.addEventListener("change", e => {
  const el = e.target; if (!el.dataset.pdcm) return;
  pdcEstado()[el.dataset.pdcm] = el.value; pintarPDCCarga();
});
const ACCIONES_PDC_CARGA = {
  pdcVista(b) { pdcEstado().vista = b.dataset.v; pdcEstado().previa = null; window.scrollTo(0, 0); },
  pdcPlantilla() { pdcPlantillaCsv(); return false; },
  pdcPrevisualizar() { const f = pdcEstado(); f.pegado = ($("pdcPegar") || {}).value || ""; f.previa = pdcParsear(f.pegado); pintarPDCCarga(); return false; },
  pdcCargar() {
    const f = pdcEstado(); if (!f.previa || f.previa.error) return false;
    const n = pdcAplicar(f.previa.filas); toast(`${n} registros cargados`); f.previa = null; f.pegado = ""; f.vista = "cuadro";
  }
};
Object.assign(ACCIONES_PDC, ACCIONES_PDC_CARGA);
