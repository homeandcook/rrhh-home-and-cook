"use strict";
/* ===================== TALENT MATRIX =====================
   Ficha por persona (la rellena el Regional Manager) y mapa de talento (RR.HH.).
   Reutiliza el equipo y la nota del Scorecard: no hay que volver a cargar gente.
   ========================================================= */
const T = () => SC.CONFIG.talent;

function talFicha(p) { return p.talent = p.talent || {}; }

function vistaTalent(t) {
  let h = selectorPersonas(t);
  const p = persona(t); if (!p) return h;
  const tal = talFicha(p), r = SC.talent(t, p), cerr = !!tal.cerrado, sc = `tal:${p.id}`;
  const op = (lista, val, vacio) => `<option value="">${vacio || "—"}</option>` + lista.map(x => {
    const v = typeof x === "string" ? x : x.id, txt = typeof x === "string" ? x : x.t;
    return `<option value="${esc(v)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`;
  }).join("");
  const sel = (path, lista, val, vacio) => `<select data-scope="${sc}" data-path="${path}">${op(lista, val, vacio)}</select>`;

  h += `<div class="evalgrid"><div><fieldset ${cerr ? "disabled" : ""}>`;

  // 1. Desempeño
  h += `<section class="card"><div class="card-h"><h2>Desempeño del año</h2><span class="muted">Viene del Scorecard</span></div>
    <p class="hint">${r.notaScorecard == null
      ? "Esta persona todavía no tiene el cierre anual del Scorecard completo. Puedes elegir la banda a mano y ajustarla después."
      : `Nota del cierre anual: <b>${SC.fmt(r.notaScorecard, 2)}</b> de ${SC.fmt(SC.CONFIG.puntuacionMaxima * SC.CONFIG.multiplicadorNota, 0)}, que corresponde a <b>${esc(T().bandasDesempeno[r.propuesta].t)}</b>.`}</p>
    <div class="grid2"><label>Banda de desempeño${sel("desempeno", T().bandasDesempeno, tal.desempeno || (r.propuesta != null ? T().bandasDesempeno[r.propuesta].id : ""))}</label>
    ${r.ajustado ? `<label>Por qué te apartas de la nota<textarea rows="2" data-scope="${sc}" data-path="motivoAjuste">${esc(tal.motivoAjuste || "")}</textarea></label>` : `<p class="hint">Si la nota no refleja el año (una tienda en obras, una baja larga), cambia la banda y explica por qué.</p>`}</div></section>`;

  // 2. Potencial
  h += `<section class="card"><h2>Potencial</h2>
    <p class="hint">No es cuánto vale, sino hasta dónde puede llegar en los próximos dos años.</p>
    <div class="vg" style="grid-template-columns:repeat(3,1fr)">
      ${T().potencial.map(x => `<label class="vg-o ${tal.potencial === x.id ? "on" : ""}"><input type="radio" name="pot" data-scope="${sc}" data-path="potencial" value="${x.id}" ${tal.potencial === x.id ? "checked" : ""}><b>${esc(x.t)}</b><small>${esc(x.d)}</small></label>`).join("")}
    </div>
    <label style="margin-top:14px">Evidencias: ¿qué ha hecho que sostenga esa valoración?
      <textarea rows="3" data-scope="${sc}" data-path="evidencia" placeholder="Hechos concretos del año: qué hizo, cuándo y con qué resultado.">${esc(tal.evidencia || "")}</textarea></label>
    <p class="hint">${(tal.evidencia || "").trim().length < T().minEvidencia ? "Con un par de frases concretas basta, pero hacen falta: son las que sostienen la calibración con RR.HH." : "Evidencia suficiente."}</p></section>`;

  // 3. Competencias
  const marcadas = k => tal[k] || [];
  h += `<section class="card"><h2>Competencias de tienda</h2>
    <div class="grid2"><label>Competencia estrella${sel("estrella", T().competencias, tal.estrella)}</label>
    <p class="hint">Aquella en la que es referencia para el resto de la red.</p></div>
    <h3 style="margin-top:14px">Áreas de mejora <small>máximo 2</small></h3>
    <div class="chips">${T().competencias.map(c => `<button type="button" class="chip ${marcadas("mejoras").includes(c.id) ? "on" : ""}" data-action="talChip" data-k="mejoras" data-c="${c.id}">${esc(c.t)}</button>`).join("")}</div>
    <p class="hint">El objetivo del plan de desarrollo se propondrá a partir de la primera que marques.</p></section>`;

  // 4. Riesgo y retención
  h += `<section class="card"><h2>Riesgo de salida e impacto</h2>
    <div class="grid3">
      <label>Riesgo de que se vaya${sel("riesgo", T().niveles, tal.riesgo)}</label>
      <label>Impacto si se va${sel("impacto", T().niveles, tal.impacto)}</label>
      <div><span class="lblmini">Prioridad de retención</span>${r.prioridad ? `<span class="prio p${esc(r.prioridad.replace(/\s/g, ""))}">${esc(r.prioridad)}</span>` : `<span class="muted">—</span>`}</div>
    </div>
    ${r.prioridad === "Actuar ya" || r.prioridad === "Vigilar" ? `<label style="margin-top:12px">Acción de retención a 90 días<textarea rows="2" data-scope="${sc}" data-path="retencion" placeholder="Qué vas a hacer, cuándo y con qué apoyo de RR.HH.">${esc(tal.retencion || "")}</textarea></label>` : ""}</section>`;

  // 5. Movilidad y sucesión
  const otros = t.personas.filter(x => x.id !== p.id).map(x => x.nombre || "Sin nombre");
  h += `<section class="card"><h2>Movilidad y sucesión</h2>
    <div class="grid3">
      <label>¿Movimiento posible?${sel("movilidad", T().movilidad, tal.movilidad)}</label>
      ${tal.movilidad && tal.movilidad !== "No de momento" ? `<label>¿Cuándo estaría preparado/a?${sel("readiness", T().readiness, tal.readiness)}</label>` : `<p class="hint">La disponibilidad geográfica que haya indicado está en su ficha de Desarrollo del Scorecard.</p>`}
      <label>¿Hay sucesor/a para esta tienda?${sel("sucesor", ["Sí", "No", "Todavía no, en preparación"], tal.sucesor)}</label>
    </div>
    ${tal.sucesor === "Sí" ? `<div class="grid3" style="margin-top:12px"><label>¿Quién?<input data-scope="${sc}" data-path="sucesorQuien" value="${esc(tal.sucesorQuien || "")}" list="sucesores" placeholder="Nombre"><datalist id="sucesores">${otros.map(n => `<option>${esc(n)}</option>`).join("")}</datalist></label>
      <label>¿Cuándo estaría listo/a?${sel("sucesorReadiness", T().readiness, tal.sucesorReadiness)}</label></div>` : ""}</section>`;

  // 6. Plan de desarrollo
  const comp = T().competencias.find(c => c.id === (tal.mejoras || [])[0]);
  h += `<section class="card"><h2>Plan de desarrollo</h2>
    <p class="hint">${comp ? `Propuesto a partir del área de mejora marcada: ${esc(comp.t)}. Puedes cambiarlo.` : "Marca un área de mejora y se propondrá un objetivo."}</p>
    <div class="grid2">
      <label>Objetivo${sel("objetivo", T().competencias.map(c => ({ id: c.obj, t: c.obj })), tal.objetivo)}</label>
      <label>Acción${sel("accion", T().acciones, tal.accion)}</label>
      <label class="span2">¿Qué será distinto cuando termine?<textarea rows="2" data-scope="${sc}" data-path="resultado" placeholder="Un resultado observable: qué se podrá comprobar dentro de unos meses.">${esc(tal.resultado || "")}</textarea></label>
      <label>Plazo${sel("plazo", T().plazos, tal.plazo)}</label>
      <label>¿Has hablado del plan con la persona?${sel("hablado", ["Sí", "Todavía no"], tal.hablado)}</label>
      <label class="span2">Contexto que RR.HH. deba conocer<textarea rows="2" data-scope="${sc}" data-path="nota">${esc(tal.nota || "")}</textarea></label>
    </div></section>`;

  h += `</fieldset></div><aside class="ticket" id="talTicket"></aside></div>`;
  return h;
}

function pintarTalTicket() {
  const t = tienda(), p = persona(t), el = document.getElementById("talTicket");
  if (!el || !t || !p) return;
  const r = SC.talent(t, p), tal = r.tal;
  const cajas = [];
  for (let pot = 2; pot >= 0; pot--) for (let per = 0; per < 3; per++) {
    const on = r.perfIdx === per && r.potIdx === pot;
    cajas.push(`<span class="b9 ${on ? "on" : ""}" title="${esc(T().segmentos[pot * 3 + per].t)}"></span>`);
  }
  el.innerHTML = `<p class="t-per">Talent Matrix ${SC.CONFIG.anio}</p>
    <p class="t-lbl">${r.seg ? esc(r.seg.t) : "Sin situar"}</p>
    <div class="box9">${cajas.join("")}</div>
    <p class="t-sub">${r.seg ? esc(r.seg.n) : "Elige banda de desempeño y potencial para situar a la persona en la matriz."}</p>
    <dl class="t-rows">
      <dt>Desempeño</dt><dd>${r.perfIdx >= 0 && r.perfIdx != null ? esc(T().bandasDesempeno[r.perfIdx].t) : "–"}${r.ajustado ? ` <small>ajustado</small>` : ""}</dd>
      <dt>Potencial</dt><dd>${r.potIdx >= 0 ? esc(T().potencial[r.potIdx].t) : "–"}</dd>
      <dt>Retención</dt><dd>${r.prioridad ? esc(r.prioridad) : "–"}</dd>
    </dl>
    ${r.falta.length ? `<ul class="alerts"><li class="aviso">Falta ${esc(r.falta.join(", "))}.</li></ul>` : ""}
    ${tal.hablado === "Todavía no" ? `<ul class="alerts"><li class="aviso">Plan pendiente de comentar con la persona.</li></ul>` : ""}
    ${r.cerrado ? `<p class="closed">Ficha cerrada el ${fechaES(tal.cerrado.fecha)}${tal.cerrado.por ? " por " + esc(tal.cerrado.por) : ""}</p><button class="btn" data-action="talReabrir">Reabrir ficha</button>`
      : `<button class="btn primary block" data-action="talCerrar">Cerrar ficha</button>`}`;
}

/* ---------------- Mapa de talento (RR.HH.) ---------------- */
function filasTalent() {
  const out = [];
  S.tiendas.forEach(t => t.personas.forEach(p => {
    const rp = perfil(t.rm_id);
    out.push({ t, p, rm: rp ? rp.nombre : "Sin asignar", zona: rp ? rp.zona || "" : "", r: SC.talent(t, p) });
  }));
  return out;
}
function pintarMapaTalento() {
  const f = S.f, todas = filasTalent();
  const rms = [...new Set(todas.map(x => x.rm))].sort();
  const rows = todas.filter(x => (!f.rm || x.rm === f.rm) && (!f.puesto || x.p.puesto === f.puesto));
  S.filasTalCsv = rows;
  const situadas = rows.filter(x => x.r.seg);
  const cerradas = rows.filter(x => x.r.cerrado);
  let h = `<div class="page"><div class="page-h"><h1>Mapa de talento</h1><button class="btn" data-action="talCsv">Exportar CSV</button></div>
  <div class="filters">
    <label>Regional Manager<select data-f="rm"><option value="">Todos</option>${rms.map(r => `<option ${f.rm === r ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></label>
    <label>Puesto<select data-f="puesto"><option value="">Todos</option>${Object.entries(SC.CONFIG.bonus).map(([k, b]) => `<option value="${k}" ${f.puesto === k ? "selected" : ""}>${esc(b.nombre)}</option>`).join("")}</select></label></div>`;
  if (!rows.length) { $("vista").innerHTML = h + `<div class="empty big"><p>Todavía no hay personas en las tiendas.</p></div></div>`; return; }

  // 9-box
  h += `<section class="card"><div class="card-h"><h2>Matriz 9-Box</h2><span class="muted">${situadas.length} de ${rows.length} personas situadas</span></div>
  <div class="grid9">`;
  for (let pot = 2; pot >= 0; pot--) {
    h += `<div class="ejeY">${esc(T().potencial[pot].t)}</div>`;
    for (let per = 0; per < 3; per++) {
      const seg = T().segmentos[pot * 3 + per];
      const gente = situadas.filter(x => x.r.perfIdx === per && x.r.potIdx === pot);
      h += `<div class="c9 n${pot * 3 + per}"><div class="c9h"><b>${esc(seg.t)}</b><span class="num">${gente.length}</span></div>
        <ul>${gente.map(x => `<li><button data-action="talAbrir" data-t="${x.t.id}" data-p="${x.p.id}">${esc(x.p.nombre || "Sin nombre")}<small>${esc(x.t.nombre)}</small></button></li>`).join("")}</ul></div>`;
    }
  }
  h += `<div class="ejeY"></div>${T().bandasDesempeno.map(b => `<div class="ejeX">${esc(b.t)}</div>`).join("")}</div></section>`;

  // Distribución vs guardarraíles
  const g = T().guardarrailes, tot = situadas.length || 1;
  const dist = [0, 1, 2].map(i => situadas.filter(x => x.r.perfIdx === i).length);
  h += `<div class="grid2"><section class="card"><h2>Distribución de desempeño</h2>
    <p class="hint">Referencia orientativa de la compañía: ${SC.pct(g.alto, 0)} destacado, ${SC.pct(g.solido, 0)} sólido, ${SC.pct(g.bajo, 0)} por debajo.</p>
    <div class="tablewrap"><table class="mini"><tbody>${[2, 1, 0].map(i => {
      const ref = [g.bajo, g.solido, g.alto][i], real = dist[i] / tot, desv = real - ref;
      return `<tr><td>${esc(T().bandasDesempeno[i].t)}</td><td class="n">${dist[i]}</td><td class="n">${SC.pct(real, 0)}</td>
        <td class="n"><span class="dev ${Math.abs(desv) >= 0.1 ? "alta" : ""} ${desv > 0 ? "pos" : desv < 0 ? "neg" : ""}">${desv > 0 ? "+" : ""}${SC.pct(desv, 0)}</span></td></tr>`;
    }).join("")}</tbody></table></div></section>
  <section class="card"><h2>Riesgo de salida por impacto</h2>
    <div class="tablewrap"><table class="mini"><thead><tr><th></th>${T().niveles.map(n => `<th class="n">Impacto ${esc(n.toLowerCase())}</th>`).join("")}</tr></thead><tbody>
    ${T().niveles.map(rg => `<tr><td>Riesgo ${esc(rg.toLowerCase())}</td>${T().niveles.map(im => {
      const n = rows.filter(x => x.r.tal.riesgo === rg && x.r.tal.impacto === im).length;
      const pr = SC.prioridadRetencion(rg, im);
      return `<td class="n"><span class="prio p${esc(pr.replace(/\s/g, ""))} mini">${n}</span></td>`;
    }).join("")}</tr>`).join("")}</tbody></table></div></section></div>`;

  // Prioridades de retención y sucesión
  const urgentes = rows.filter(x => x.r.prioridad === "Actuar ya");
  const sinSucesor = rows.filter(x => x.p.puesto === "SM" && x.r.tal.sucesor && x.r.tal.sucesor !== "Sí");
  h += `<div class="grid2"><section class="card"><div class="card-h"><h2>Actuar ya</h2><span class="muted">${urgentes.length} personas</span></div>
    ${urgentes.length ? `<div class="tablewrap"><table><thead><tr><th>Persona</th><th>Tienda</th><th>Segmento</th><th>Acción registrada</th></tr></thead><tbody>
    ${urgentes.map(x => `<tr class="click" data-action="talAbrir" data-t="${x.t.id}" data-p="${x.p.id}"><td>${esc(x.p.nombre)}</td><td>${esc(x.t.nombre)}</td><td>${x.r.seg ? esc(x.r.seg.t) : "–"}</td>
      <td>${x.r.tal.retencion ? esc(x.r.tal.retencion) : `<span class="flag">Sin acción de retención</span>`}</td></tr>`).join("")}</tbody></table></div>`
    : `<p class="empty">Ninguna persona con riesgo e impacto altos.</p>`}</section>
  <section class="card"><div class="card-h"><h2>Tiendas sin sucesor/a</h2><span class="muted">${sinSucesor.length} tiendas</span></div>
    ${sinSucesor.length ? `<table class="mini"><tbody>${sinSucesor.map(x => `<tr><td>${esc(x.t.nombre)}</td><td>${esc(x.p.nombre)}</td><td class="n muted">${esc(x.r.tal.sucesor)}</td></tr>`).join("")}</tbody></table>`
    : `<p class="empty">Todas las tiendas evaluadas tienen sucesor/a identificado.</p>`}</section></div>`;

  // Calibración
  h += `<section class="card"><div class="card-h"><h2>Calibración entre Regional Managers</h2><span class="muted">${cerradas.length} fichas cerradas de ${rows.length}</span></div>
    <p class="hint">Reparto del potencial y del desempeño por zona. Sirve para la sesión de calibración, no para corregir a nadie por sistema.</p>
    <div class="tablewrap"><table><thead><tr><th>Regional Manager</th><th class="n">Fichas</th><th class="n">Situadas</th><th class="n">Potencial alto</th><th class="n">Desempeño destacado</th><th class="n">Actuar ya</th><th class="n">Cerradas</th></tr></thead><tbody>
    ${rms.map(rm => {
      const xs = todas.filter(x => x.rm === rm), st = xs.filter(x => x.r.seg);
      const pc = n => st.length ? SC.pct(n / st.length, 0) : "–";
      return `<tr><td>${esc(rm)}</td><td class="n">${xs.length}</td><td class="n">${st.length}</td>
        <td class="n">${pc(st.filter(x => x.r.potIdx === 2).length)}</td><td class="n">${pc(st.filter(x => x.r.perfIdx === 2).length)}</td>
        <td class="n">${xs.filter(x => x.r.prioridad === "Actuar ya").length}</td><td class="n">${xs.filter(x => x.r.cerrado).length}</td></tr>`;
    }).join("")}</tbody></table></div></section>`;

  // Detalle
  h += `<section class="card"><h2>Detalle por persona</h2><div class="tablewrap"><table><thead><tr><th>RM</th><th>Tienda</th><th>Persona</th><th>Puesto</th><th>Estado</th><th>Segmento</th><th>Retención</th><th>Plan</th></tr></thead><tbody>
    ${rows.map(x => `<tr class="click" data-action="talAbrir" data-t="${x.t.id}" data-p="${x.p.id}"><td>${esc(x.rm)}</td><td>${esc(x.t.nombre)}</td><td>${esc(x.p.nombre || "Sin nombre")}</td><td>${esc(x.p.puesto)}</td>
      <td><span class="st ${x.r.estado.replace(" ", "")}">${esc(x.r.estado)}</span></td><td>${x.r.seg ? esc(x.r.seg.t) : "–"}</td>
      <td>${x.r.prioridad ? esc(x.r.prioridad) : "–"}</td><td>${x.r.tal.objetivo ? esc(x.r.tal.objetivo) : `<span class="flag">Sin plan</span>`}</td></tr>`).join("")}
    </tbody></table></div></section></div>`;
  $("vista").innerHTML = h;
}
function talCsv() {
  const rows = S.filasTalCsv || []; if (!rows.length) return;
  const cab = ["Año", "Regional Manager", "Zona", "Tienda", "Persona", "Puesto", "Estado", "Nota Scorecard", "Banda desempeño", "Potencial", "Segmento 9-Box", "Evidencias", "Competencia estrella", "Áreas de mejora", "Riesgo", "Impacto", "Prioridad retención", "Acción retención", "Movilidad", "Readiness", "Sucesor", "Quién", "Readiness sucesor", "Objetivo", "Acción", "Resultado esperado", "Plazo", "Hablado con la persona", "Contexto"];
  const comp = id => (T().competencias.find(c => c.id === id) || {}).t || "";
  const lin = rows.map(x => { const r = x.r, t = r.tal; return [SC.CONFIG.anio, x.rm, x.zona, x.t.nombre, x.p.nombre, x.p.puesto, r.estado,
    r.notaScorecard == null ? "" : SC.fmt(r.notaScorecard, 2), r.perfIdx >= 0 && r.perfIdx != null ? T().bandasDesempeno[r.perfIdx].t : "",
    r.potIdx >= 0 ? T().potencial[r.potIdx].t : "", r.seg ? r.seg.t : "", t.evidencia || "", comp(t.estrella), (t.mejoras || []).map(comp).join(" | "),
    t.riesgo || "", t.impacto || "", r.prioridad || "", t.retencion || "", t.movilidad || "", t.readiness || "", t.sucesor || "", t.sucesorQuien || "", t.sucesorReadiness || "",
    t.objetivo || "", t.accion || "", t.resultado || "", t.plazo || "", t.hablado || "", t.nota || ""]; });
  const q = v => { v = String(v == null ? "" : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const txt = "\ufeff" + [cab, ...lin].map(r => r.map(q).join(";")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
  a.download = `talent_matrix_${SC.CONFIG.anio}_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------------- Acciones ---------------- */
const ACCIONES_TALENT = {
  talChip(b, t) {
    const p = persona(t), tal = talFicha(p), k = b.dataset.k, c = b.dataset.c;
    const lista = tal[k] = tal[k] || [];
    const i = lista.indexOf(c);
    if (i >= 0) lista.splice(i, 1);
    else { if (lista.length >= 2) { toast("Máximo 2 áreas de mejora: quita una antes de añadir otra."); return false; } lista.push(c); }
    if (k === "mejoras" && lista.length && !tal.objetivo) {
      const comp = T().competencias.find(x => x.id === lista[0]);
      if (comp) { tal.objetivo = comp.obj; if (!tal.accion) tal.accion = comp.acc; }
    }
    guardar(t);
  },
  talCerrar(b, t) {
    const p = persona(t), r = SC.talent(t, p);
    if (!p.nombre) { alert("Pon el nombre de la persona antes de cerrar la ficha."); return false; }
    if (r.falta.length) { alert("Para cerrar falta: " + r.falta.join(", ") + "."); return false; }
    if (r.ajustado && !(r.tal.motivoAjuste || "").trim()) { alert("Has ajustado la banda de desempeño: explica por qué antes de cerrar."); return false; }
    r.tal.cerrado = { fecha: new Date().toISOString(), por: S.me.nombre };
    log(`Ficha de talento cerrada: ${p.nombre} (${t.nombre})`, t); guardar(t); toast("Ficha de talento cerrada");
  },
  talReabrir(b, t) {
    const p = persona(t);
    if (!confirm("La ficha volverá a ser editable. La reapertura queda registrada.")) return false;
    delete talFicha(p).cerrado; log(`Ficha de talento reabierta: ${p.nombre} (${t.nombre})`, t); guardar(t);
  },
  talAbrir(b) { S.modulo = "talent"; S.vista = "eval"; S.ui = { t: b.dataset.t, p: b.dataset.p, fase: "talent" }; },
  talCsv() { talCsv(); return false; }
};
