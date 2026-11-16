"use strict";
/* ============ DESARROLLO · ficha del responsable ============
   El responsable (manager de oficina, Regional Manager o Store Manager)
   entra con su código «TR-…», sin usuario. Ve solo a su equipo, valora a
   cada persona en cuatro pasos y lo envía a RR.HH. Cada cambio se guarda
   en el servidor con dr_guardar; RR.HH. lo cuenta cuando se envía.
   Reproduce la ficha del Talent Review v1.0 con la identidad de Pippole.
   ============================================================ */
const TRE = { codigo: "", ciclo: null, ev: null, personas: [], sel: null, paso: "perf", q: 0, dlg: "portada",
  banda: {}, mapa: false, guardado: "", err: "", enviando: false, encuesta: { t: "", sobra: "", falta: "" }, motivo: "", aviso: "" };
const PASOS_TR = [["perf", "Desempeño y potencial"], ["comp", "Competencias"], ["fut", "Futuro y riesgo"], ["plan", "Plan de desarrollo"]];

async function abrirTalent(codigo) {
  TRE.codigo = codigo.trim().toUpperCase();
  const { data, error } = await sb.rpc("dr_abrir", { p_codigo: TRE.codigo });
  if (error || !data) {
    INV.codigo = TRE.codigo;
    INV.error = error ? traducirError(error) : "Ese código no existe. Revisa que lo has copiado entero.";
    INV.datos = null; return pintarInvitado();
  }
  TRE.ciclo = data.ciclo; TRE.ev = data.evaluador;
  TRE.personas = (data.personas || []).map(p => Object.assign(p, { datos: Object.assign(TR.vacio(), p.datos || {}) }));
  TRE.sel = null; TRE.dlg = "portada"; TRE.paso = "perf"; TRE.q = 0; TRE.banda = {}; TRE.mapa = false;
  trePintar();
}

/* ---------- utilidades ---------- */
const treAmb = () => TRC.AMBITO[TRE.ciclo.ambito];
const treP = () => TRE.personas.find(p => p.id === TRE.sel);
const treActivas = () => TRE.personas.filter(p => !p.datos.baja);
const treHechas = () => treActivas().filter(p => TR.completa(p.datos));
const treCerrado = () => TRE.ciclo.estado !== "abierto";
const anios = v => (v == null || v === "" ? "—" : `${String(Math.round(v * 10) / 10).replace(".", ",")} a`);
const trOpts = (lista, val, vacio) => `${vacio === false ? "" : `<option value="">${vacio || "—"}</option>`}${lista.map(o => `<option ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("")}`;
const trFecha = iso => (iso ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "");

/* ---------- guardado en el servidor ---------- */
const treTimers = {};
function treGuardar(p, ya) {
  clearTimeout(treTimers[p.id]);
  TRE.guardado = "Guardando…"; treEstadoGuardado();
  treTimers[p.id] = setTimeout(async () => {
    const { error } = await sb.rpc("dr_guardar", { p_codigo: TRE.codigo, p_persona: p.id, p_datos: p.datos });
    TRE.guardado = error ? "No se ha podido guardar: " + traducirError(error) : "Guardado";
    treEstadoGuardado();
  }, ya ? 0 : 700);
}
function treEstadoGuardado() { const el = $("trGuardado"); if (el) { el.textContent = TRE.guardado; el.className = "tr-guardado" + (/No se ha/.test(TRE.guardado) ? " ko" : ""); } }

/* ---------- autoplan: el área de mejora propone objetivo y acción ---------- */
function treAutoplan(e) {
  [["A", 0], ["B", 1]].forEach(([k, i]) => {
    const c = TRC.comp((e.imp || [])[i]); if (!c) return;
    if (!e["obj" + k]) e["obj" + k] = c.obj;
    if (!e["acc" + k]) e["acc" + k] = c.acc;
  });
}

/* =================== pintado =================== */
function trePintar() {
  const amb = treAmb(), act = treActivas(), hechas = treHechas(), n = act.length;
  const pct = n ? Math.round(hechas.length / n * 100) : 0, todo = n && hechas.length === n;
  const ro = treCerrado();
  $("app").innerHTML = `<div class="tr tr-ev${ro ? " ro" : ""}">
  <header class="tr-top"><div class="tr-marca">${simboloPippole(30)}<span>pippole</span></div>
    <div class="tr-tit"><span class="tr-eyebrow">Ciclo ${esc(TRE.ciclo.anio)} · ${esc(amb.nombre)}</span><h1>Talent Review y plan de desarrollo</h1></div>
    <div class="tr-para"><span class="k">Equipo de</span><span class="v">${esc(TRE.ev.nombre)}</span><span id="trGuardado" class="tr-guardado">${esc(TRE.guardado)}</span></div></header>
  <div class="tr-notice"><span><b>Confidencial.</b> Solo contiene a tu equipo. Se guarda solo y RR.HH. no lo recibe hasta que pulses «Enviar a RR.HH.».</span>
    <div class="tr-notice-b"><button class="tr-mini" data-tr="dlg" data-v="guia">Cómo funciona</button>
    ${ro ? "" : `<button class="tr-mini dark${todo ? "" : " pend"}" data-tr="enviar" id="trBtnEnviar">${TRE.ev.entregado ? "Volver a enviar" : "Enviar a RR.HH."} ${todo ? "✓" : `(${hechas.length}/${n})`}</button>`}
    <details class="tr-mas"><summary class="tr-mini">Más ▾</summary><div class="tr-menu">
      <button data-tr="dlg" data-v="portada">Portada, calendario y datos</button>
      <button data-tr="imprimirTodo">Imprimir todas las fichas</button>
      <button data-tr="csv">Exportar CSV <small>copia en hoja de cálculo</small></button>
      <hr><button data-tr="salir">Salir</button></div></details></div></div>
  ${TRE.ev.entregado ? `<div class="tr-banda ok">Enviado a RR.HH. el ${esc(trFecha(TRE.ev.entregado))}. ${ro ? "" : "Puedes seguir corrigiendo mientras el ciclo esté abierto: los cambios llegan solos."}</div>` : ""}
  ${ro ? `<div class="tr-banda">El ciclo está cerrado. Puedes consultar tus fichas, pero ya no se pueden cambiar.</div>` : ""}
  <main class="tr-wrap">
    ${treMapa(todo)}
    ${treFlags()}
    <div class="tr-cols">
      <aside class="tr-card tr-roster"><span class="tr-eyebrow">Mi equipo</span>
        <div class="tr-rh"><b>${n} ${n === 1 ? "persona" : "personas"}</b>${TRE.personas.length - n ? ` · ${TRE.personas.length - n} ${TRE.personas.length - n === 1 ? "salida" : "salidas"}` : ""}
          ${ro ? "" : `<button class="tr-mas-p" data-tr="dlg" data-v="alta" title="Añadir a alguien que no aparece" aria-label="Añadir a alguien que no aparece">＋</button>`}</div>
        <div class="tr-prog"><span id="trProgTxt">${hechas.length} de ${n} listas</span><b id="trProgPct">${pct}%</b></div>
        <div class="tr-bar"><i id="trProgBar" style="width:${pct}%"></i></div>
        ${TRE.ciclo.fecha_limite ? `<p class="tr-hint">Fecha límite: ${esc(trFecha(TRE.ciclo.fecha_limite))}</p>` : ""}
        <ul class="tr-lista">${TRE.personas.map(p => {
          const e = p.datos, st = e.baja ? "" : TR.completa(e) ? "done" : TR.tocada(e) ? "part" : "";
          return `<li><button class="${p.id === TRE.sel ? "on" : ""}${e.baja ? " baja" : ""}" data-tr="sel" data-id="${p.id}"><i class="tr-dot ${st}" data-dot="${p.id}"></i>
            <span><b>${esc(p.nombre)}</b><small>${e.baja ? `Salida · ${esc(e.bajaFecha || "")}` : esc(p.puesto || "") + (p.manual ? " · alta manual" : "")}</small></span></button></li>`;
        }).join("")}</ul></aside>
      <section class="tr-card tr-detail" id="trDetail">${treFicha()}</section>
    </div>
  </main>
  <footer class="tr-foot">pippole · Talent Review ${esc(TRE.ciclo.anio)} · ${esc(amb.nombre)}</footer>
  ${treDialogo()}
  </div>`;
}

function treMapa(todo) {
  const act = treActivas(), n = act.length;
  if (!todo) return `<details class="tr-card tr-boards"><summary><span><span class="tr-eyebrow">Al completar las fichas</span><h2>Mapa del equipo</h2></span><span class="tr-cnt">${treHechas().length} / ${n} fichas listas</span></summary>
    <div class="tr-locked"><span class="tr-eyebrow">Aún no disponible</span><p>El mapa de tu equipo se abre cuando las ${n} fichas están completas. Se muestra al final a propósito: el objetivo es que valores a cada persona por lo que has observado, no por dónde la coloca la rejilla.</p><p class="tr-hint">Llevas ${treHechas().length} de ${n}.</p></div></details>`;
  const sit = act.filter(p => !p.datos.noEval && TRC.segIdx(p.datos.perf, p.datos.pot) >= 0);
  return `<details class="tr-card tr-boards" ${TRE.mapa ? "open" : ""} id="trMapa"><summary><span><span class="tr-eyebrow">Al completar las fichas</span><h2>Mapa del equipo</h2></span><span class="tr-cnt">${sit.length} situadas</span></summary>
    <div class="tr-bd"><span class="tr-eyebrow">Tu equipo por desempeño y potencial</span>${treRejilla(sit, p => TRC.segIdx(p.datos.perf, p.datos.pot), p => `<button class="tr-chip" data-tr="sel" data-id="${p.id}">${esc(TR.apellidos(p.nombre))}</button>`)}
    <p class="tr-hint">Cada casilla indica <b>qué hacer</b>, no una etiqueta para la persona. Bandas 1-10: bajo 1-4 · medio 5-7 · alto 8-10. Pulsa un nombre para abrir su ficha.</p></div></details>`;
}
/* Rejilla 9-Box: filas de potencial alto a bajo, columnas de desempeño bajo a alto */
function treRejilla(lista, idx, chip, extra) {
  const filas = [[6, 7, 8], [3, 4, 5], [0, 1, 2]], fl = ["Potencial alto", "Potencial medio", "Potencial bajo"];
  return `<div class="tr-9"><div class="tr-9y">${fl.map(x => `<span>${x}</span>`).join("")}</div><div class="tr-9g">${filas.flat().map(i => {
    const ps = lista.filter(p => idx(p) === i), [nom, nota, c] = TRC.SEG[i];
    return `<div class="tr-cell ${c}" ${extra ? extra(i) : ""}><span class="tr-cn">${esc(nom)}</span><small>${esc(nota)}</small><b>${ps.length}</b><div>${chip ? ps.map(chip).join("") : ""}</div></div>`;
  }).join("")}</div><div></div><div class="tr-9x"><span>Desempeño bajo</span><span>Desempeño medio</span><span>Desempeño alto</span></div></div>`;
}
function treFlags() {
  const act = treActivas().filter(p => !p.datos.noEval), hot = act.filter(p => TR.hot(p.datos));
  let h = hot.length ? `<div class="tr-flag bad"><b>Prioridad de retención: ${hot.length} ${hot.length === 1 ? "persona" : "personas"}.</b> ${esc(hot.map(p => TR.apellidos(p.nombre)).join(", "))}. Cada una necesita una acción concreta y con fecha registrada en su ficha.</div>` : "";
  const ev = act.filter(p => p.datos.perf > 0), alto = ev.filter(p => p.datos.perf >= 8).length, bajo = ev.filter(p => p.datos.perf <= 4).length;
  if (ev.length >= 4) {
    if (alto / ev.length >= 0.6) h += `<div class="tr-flag warn"><b>Revisa tu distribución.</b> Has situado a ${alto} de ${ev.length} personas en banda alta de desempeño (${Math.round(alto / ev.length * 100)} %). Puede ser cierto, pero conviene comprobar que la escala se está usando entera: un equipo entero por encima de 8 hace que las diferencias reales dejen de verse.</div>`;
    else if (bajo / ev.length >= 0.5) h += `<div class="tr-flag warn"><b>Revisa tu distribución.</b> Has situado a ${bajo} de ${ev.length} personas en banda baja de desempeño. Si es así, conviene hablarlo con RR.HH. antes de cerrar el ejercicio.</div>`;
    else if (new Set(ev.map(p => p.datos.perf)).size === 1) h += `<div class="tr-flag warn"><b>Todas tus valoraciones de desempeño son iguales (${ev[0].datos.perf}).</b> Si tu equipo es realmente homogéneo, adelante; si no, la escala pierde su utilidad.</div>`;
  }
  return h;
}

/* ---------- la ficha ---------- */
function treFicha() {
  const p = treP();
  if (!p) return `<div class="tr-empty">Selecciona a alguien de tu equipo.</div>`;
  const e = p.datos, amb = treAmb();
  const cab = `<div class="tr-dh"><div><span class="tr-eyebrow">${esc(p.puesto || "")}${p.departamento ? " · " + esc(p.departamento) : ""}</span>
      <h2 class="${e.baja ? "tach" : ""}">${esc(p.nombre)}</h2><i class="tr-rule"></i></div>
      <span class="tr-badge ${e.baja ? "" : p.estado === "enviada" ? "ok" : ""}">${e.baja ? "Salida" : p.estado === "enviada" ? "Enviada" : "Borrador"}</span></div>`;
  if (e.baja) return cab + `<div class="tr-tip"><b>Marcada como salida el ${esc(e.bajaFecha)}.</b> ${esc(e.bajaMotivo || "Sin motivo indicado.")}<br>No cuenta para el progreso ni para el mapa, pero la información llega a RR.HH. al enviar. Su evaluación, si la había, se conserva.</div>
    ${treCerrado() ? "" : `<div class="tr-acc"><button class="tr-btn ghost" data-tr="reactivar">Reactivar en mi equipo</button></div>`}`;
  const si = TRC.segIdx(e.perf, e.pot);
  let h = cab + `<div class="tr-meta"><span><small>Antig. compañía</small>${anios(p.ant_compania)}</span><span><small>Antig. puesto</small>${anios(p.ant_puesto)}</span><span><small>Categoría</small>${esc(p.categoria || "—")}</span>
      ${si >= 0 && !e.noEval ? `<span><small>Recomendación</small>${esc(TRC.SEG[si][1])}</span>` : ""}</div>`;
  if (typeof p.ant_puesto === "number" && p.ant_puesto < 1 && !e.noEval) h += `<div class="tr-tip"><b>Lleva ${String(p.ant_puesto).replace(".", ",")} años en el puesto.</b> Con menos de un año de recorrido, el desempeño observado puede no ser representativo. Valora con cautela o márcala como no evaluable en este ciclo.</div>`;
  h += `<fieldset class="tr-fs" ${treCerrado() ? "disabled" : ""}>
    <label class="tr-check"><input type="checkbox" data-trf="noEval" ${e.noEval ? "checked" : ""}> No evaluable en este ciclo</label>
    ${e.noEval ? `<textarea data-trf="noEvalWhy" placeholder="Motivo: incorporación reciente, baja prolongada, cambio de rol…">${esc(e.noEvalWhy)}</textarea>` : ""}`;
  if (!e.noEval) {
    h += `<nav class="tr-steps">${PASOS_TR.map(([id, t], i) => {
      const ok = TR.pasoHecho(e, id);
      return `<button class="${TRE.paso === id ? "on" : ""}${ok ? " ok" : ""}" data-tr="paso" data-v="${id}" data-paso="${id}"><i>${ok ? "✓" : i + 1}</i>${t}</button>`;
    }).join("")}</nav>`;
    h += TRE.paso === "perf" ? trePaso1(e, amb) : TRE.paso === "comp" ? trePaso2(e) : TRE.paso === "fut" ? trePaso3(e, p, amb) : trePaso4(e);
  }
  h += `</fieldset><div class="tr-nav">
      ${!e.noEval && TRE.paso !== "perf" ? `<button class="tr-btn ghost" data-tr="ant">← Anterior</button>` : ""}
      ${!e.noEval && TRE.paso !== "plan" ? `<button class="tr-btn" data-tr="sig">Siguiente →</button>` : ""}
      <span class="tr-sp"></span>
      <button class="tr-btn ghost sm" data-tr="imprimir">Imprimir esta ficha</button>
      ${treCerrado() ? "" : `<button class="tr-btn ghost sm" data-tr="dlg" data-v="vaciar">Vaciar esta ficha</button><button class="tr-btn ghost sm" data-tr="dlg" data-v="salida">Marcar salida…</button>`}</div>
    <div id="trFalta">${treFalta(p)}</div>`;
  return h;
}
function treFalta(p) {
  const e = p.datos, f = TR.faltan(e);
  if (f.length) return `<p class="tr-missing">Para poder enviar falta: ${esc(f.join(", "))}.</p>`;
  const pend = treActivas().filter(x => !TR.completa(x.datos));
  if (pend.length) return `<div class="tr-done"><b>✓ Ficha de ${esc(TR.apellidos(p.nombre))} completa</b><span>Te ${pend.length === 1 ? "queda 1" : "quedan " + pend.length} por completar.</span>
    <button class="tr-btn" data-tr="sel" data-id="${pend[0].id}">Siguiente pendiente: ${esc(TR.apellidos(pend[0].nombre))} →</button></div>`;
  const n = treActivas().length;
  return `<div class="tr-done"><b>✓ Has completado a todo tu equipo</b><span>${n === 1 ? "La ficha está lista." : `Las ${n} fichas están listas.`} Revisa el mapa de tu equipo, arriba, y cuando quieras envíalo a RR.HH.</span>
    ${treCerrado() ? "" : `<button class="tr-btn" data-tr="enviar">Finalizar y enviar a RR.HH. →</button>`}</div>`;
}

/* Paso 1 · Desempeño y potencial */
function trePaso1(e, amb) {
  return `<p class="tr-privacy">Escribe <b>hechos observables</b>: resultados, entregas, comportamientos concretos. No incluyas información sobre salud o bajas, situación familiar, edad, actividad sindical, origen o creencias.</p>
    ${treValor(e, "perf", amb)}${treValor(e, "pot", amb)}`;
}
function treValor(e, k, amb) {
  const perf = k === "perf", v = e[k], esc10 = perf ? TRC.PERF : TRC.POT, pid = TRE.sel + k;
  const b = TRE.banda[pid] || TRC.band(v), bandas = TRC.BANDAS[k], ev = perf ? "evP" : "evO", ju = perf ? "justP" : "justO";
  const rangos = [[1, 4], [5, 7], [8, 10]];
  let h = `<div class="tr-rate ${perf ? "perf" : "pot"}"><div class="tr-rh2"><span class="tr-sq">${perf ? "A" : "B"}</span><div><span class="tr-eyebrow">${perf ? "Valoración A · qué ha entregado" : "Valoración B · hacia dónde puede crecer"}</span>
    <h3>${perf ? "Desempeño de los últimos 12 meses" : "Potencial de crecimiento"}</h3></div></div>
    <div class="tr-bandsel">${bandas.map(([n, r, d], i) => `<button class="${b === i + 1 ? "on" : ""}" data-tr="banda" data-k="${k}" data-b="${i + 1}"><b>${n} <span>${r}</span></b><small>${d}</small></button>`).join("")}</div>
    <p class="tr-popref">${TRC.POPREF[k]}</p>`;
  if (b) {
    const [a, z] = rangos[b - 1];
    h += `<span class="tr-eyebrow">Afina dentro de la banda ${["baja", "media", "alta"][b - 1]}</span><div class="tr-numsel">${Array.from({ length: z - a + 1 }, (_, i) => a + i).map(n => `<button class="${v === n ? "on" : ""}" data-tr="nota" data-k="${k}" data-n="${n}">${n}</button>`).join("")}</div>`;
  }
  if (v) h += `<div class="tr-chosen"><b>${v}</b><span><strong>${esc(esc10[v][0])}</strong>${esc(esc10[v][1])}</span></div>`;
  if (v >= 8) h += `<div class="tr-justify"><label>Has situado a esta persona en la banda alta. ¿Qué hizo que otra persona en su mismo puesto no habría hecho?
    <textarea data-trf="${ju}" placeholder="Un hecho que lo distinga de alguien que simplemente hace bien su trabajo.">${esc(e[ju])}</textarea></label><small>Obligatorio a partir de 8. Sirve para sostener la valoración en la sesión de calibración.</small></div>`;
  h += `<label class="tr-lbl">${perf ? "Evidencias de desempeño" : "Evidencias de potencial"}<textarea class="big" data-trf="${ev}" placeholder="${esc(amb.evidencia[k])}">${esc(e[ev])}</textarea></label>
    <div data-aviso="${ev}">${treAvisos(e[ev], true)}</div>
    <details class="tr-ejp"><summary>Ver un ejemplo</summary><div class="si"><b>Así sí</b>${esc(perf ? amb.evidencia.siPerf : amb.evidencia.siPot)}</div><div class="no"><b>Así no</b>${esc(TRC.ASI_NO)}</div>
      <p class="tr-hint">${perf ? "Estructura: qué hizo · la cifra · el periodo · qué parte es atribuible a ella." : "Estructura: ante qué situación nueva · cómo reaccionó · qué aprendió o asumió sin que se lo pidieran."}</p></details></div>`;
  return h;
}
function treAvisos(txt, cifra) {
  const s = TRC.sensibles(txt);
  let h = s.length ? `<p class="tr-pwarn">Parece que mencionas <b>${esc(s.join(", "))}</b>. Este campo forma parte de un expediente de la compañía: limítalo a hechos de desempeño observables.</p>` : "";
  if (cifra && (txt || "").trim().length >= TRC.EVMIN && !TRC.CIFRA.test(txt)) h += `<p class="tr-pnudge">No aparece ninguna cifra ni ningún periodo. ¿Puedes añadir cuánto y cuándo? Una evidencia con número es mucho más fácil de sostener en la calibración.</p>`;
  return h;
}

/* Paso 2 · Competencias */
function treSelComp(campo, i, val, usadas, etiqueta) {
  const fams = [...new Set(TRC.COMPS.map(c => c.fam))];
  return `<label class="tr-lbl">${etiqueta}<select data-trc="${campo}" data-i="${i}"><option value="">—</option>${fams.map(f => `<optgroup label="${esc(f)}">${TRC.COMPS.filter(c => c.fam === f && (c.n === val || !usadas.includes(c.n))).map(c => `<option ${c.n === val ? "selected" : ""}>${esc(c.n)}</option>`).join("")}</optgroup>`).join("")}</select></label>
    ${val ? `<p class="tr-cdef">${esc(TRC.comp(val).def)}</p>` : ""}`;
}
function trePaso2(e) {
  const usadas = [e.star, ...(e.str || []), ...(e.imp || [])].filter(Boolean);
  const Q = [
    ["Competencia estrella", "La que mejor define a esta persona. Solo una.", e.star ? [e.star] : [],
      () => treSelComp("star", 0, e.star, usadas, "Competencia estrella")],
    ["Puntos fuertes", "Hasta dos. Distintas de la estrella.", e.str || [],
      () => treSelComp("str", 0, (e.str || [])[0], usadas, "Punto fuerte 1") + treSelComp("str", 1, (e.str || [])[1], usadas, "Punto fuerte 2 <small>(opcional)</small>") + ((e.str || []).length ? `<button class="tr-btn sm" data-tr="q" data-i="2">Continuar</button>` : "")],
    ["Áreas de mejora", "Hasta dos. Definirán el objetivo del plan de desarrollo.", e.imp || [],
      () => treSelComp("imp", 0, (e.imp || [])[0], usadas, "Área de mejora 1") + treSelComp("imp", 1, (e.imp || [])[1], usadas, "Área de mejora 2 <small>(opcional)</small>") + ((e.imp || []).length ? `<button class="tr-btn sm" data-tr="q" data-i="-1">Listo</button>` : "")]];
  const fams = [...new Set(TRC.COMPS.map(c => c.fam))];
  return Q.map(([t, ayuda, resp, cuerpo], i) => TRE.q === i
      ? `<div class="tr-qcard on"><div class="tr-qh"><b>${i + 1} · ${t}</b><small>${ayuda}</small></div>${cuerpo()}</div>`
      : `<div class="tr-qcard"><button class="tr-qh" data-tr="q" data-i="${i}"><b>${i + 1} · ${t}</b>${resp.length ? `<span>${esc(resp.join(" · "))}</span><em>Cambiar</em>` : `<small>${ayuda}</small>`}</button></div>`).join("")
    + `<details class="tr-ejp"><summary>Ver las 13 definiciones</summary>${fams.map(f => `<h4>${esc(f)}</h4><dl>${TRC.COMPS.filter(c => c.fam === f).map(c => `<dt>${esc(c.n)}</dt><dd>${esc(c.def)}</dd>`).join("")}</dl>`).join("")}</details>
    <p class="tr-hint">Una competencia no puede ser a la vez fortaleza y área de mejora: desaparece de la otra lista automáticamente.</p>`;
}

/* Paso 3 · Futuro y riesgo */
function trePaso3(e, p, amb) {
  const hot = TR.hot(e), suc = TR.necesitaSucesor(e, p, TRE.ciclo.ambito);
  const promoOk = ["Sí, de promoción", "Sí, de ambas"].includes(e.promo), horizOk = ["Sí, de movimiento horizontal", "Sí, de ambas"].includes(e.promo);
  const amb5 = TRC.AMBICION.find(a => a[0] === e.ambicion);
  const companeros = TRE.personas.filter(x => x.id !== p.id && !x.datos.baja).map(x => x.nombre);
  return `<div class="tr-section${hot ? " attn" : ""}"><div class="tr-sh"><span class="tr-eyebrow">Retención</span><h3>Riesgo de salida</h3>
      <p>¿Qué probabilidad hay de perder a esta persona y cuánto costaría su marcha? Son dos cosas distintas: alguien clave con bajo riesgo no es una urgencia; alguien reemplazable a punto de irse, tampoco.</p></div>
    <div class="tr-g2"><label class="tr-lbl">Riesgo de salida<select data-trf="riesgo">${trOpts(TRC.NIVEL3, e.riesgo)}</select><small>${esc(TRC.RIESGO[e.riesgo || ""])}</small></label>
      <label class="tr-lbl">Impacto de su salida<select data-trf="impacto">${trOpts(TRC.NIVEL3, e.impacto)}</select><small>${esc(TRC.IMPACTO[e.impacto || ""])}</small></label></div>
    ${hot ? `<div class="tr-retact"><b>Acción de retención — prioridad</b><p>Riesgo e impacto altos. Registra una medida concreta y con fecha antes de enviar; RR.HH. la verá como prioridad del ciclo.</p>
      <textarea data-trf="retencion" placeholder="Ej.: conversación de carrera con dirección antes del 30/09 y propuesta de revisión en el ciclo de octubre.">${esc(e.retencion)}</textarea></div>` : ""}</div>
  <div class="tr-section"><div class="tr-sh"><span class="tr-eyebrow">Trayectoria</span><h3>Movimiento y aspiraciones</h3><p>Hacia dónde <b>puede</b> ir la persona y hacia dónde <b>quiere</b> ir. No siempre coinciden, y ambas cosas importan.</p></div>
    <label class="tr-lbl">¿Tiene posibilidades de promoción o de movimiento horizontal?<select data-trf="promo">${trOpts(TRC.PROMO, e.promo)}</select></label>
    <div class="tr-g2"><label class="tr-lbl${promoOk ? "" : " off"}">Promoción a<input data-trf="promoPos" value="${esc(e.promoPos)}" placeholder="Puesto" ${promoOk ? "" : "disabled"}></label>
      <label class="tr-lbl${promoOk ? "" : " off"}">Readiness<select data-trf="promoRdy" ${promoOk ? "" : "disabled"}>${trOpts(TRC.READY, e.promoRdy)}</select></label>
      <label class="tr-lbl${horizOk ? "" : " off"}">Movimiento horizontal a<input data-trf="horizPos" value="${esc(e.horizPos)}" placeholder="Puesto" ${horizOk ? "" : "disabled"}></label>
      <label class="tr-lbl${horizOk ? "" : " off"}">Readiness<select data-trf="horizRdy" ${horizOk ? "" : "disabled"}>${trOpts(TRC.READY, e.horizRdy)}</select></label></div>
    <div class="tr-g2"><label class="tr-lbl">Ambición profesional <small>(según lo que te ha transmitido)</small><select data-trf="ambicion">${trOpts(TRC.AMBICION.map(a => a[0]), e.ambicion)}</select>${amb5 ? `<small>${esc(amb5[1])}</small>` : ""}</label>
      <label class="tr-lbl">Preferencia de crecimiento<select data-trf="carrera">${trOpts(TRC.CARRERA, e.carrera)}</select></label></div></div>
  <div class="tr-section"><div class="tr-sh"><span class="tr-eyebrow">La silla</span><h3>Criticidad y sucesión del puesto</h3><p>Se valora el <b>puesto</b>, no a la persona: su impacto en la operativa, los clientes o los ingresos, y si conviene tener a alguien preparado para relevarlo.</p></div>
    <label class="tr-lbl">Criticidad del puesto<select data-trf="critRole">${trOpts(TRC.NIVEL3, e.critRole)}</select><small><b>«Alto»:</b> puesto que desde el minuto 1 genera una pérdida inmediata en ventas o un bloqueo en la correcta operativa del negocio.</small></label>
    ${suc ? `<div class="tr-g3"><label class="tr-lbl">¿Hay sucesor/a identificado?<select data-trf="sucExiste">${trOpts(["Sí", "No"], e.sucExiste)}</select><small>Se pide en puestos críticos y de mando.</small></label>
      ${e.sucExiste === "Sí" ? `<label class="tr-lbl">¿Quién?<input data-trf="sucQuien" list="trCompas" value="${esc(e.sucQuien)}" placeholder="De tu equipo o de otra área"><datalist id="trCompas">${companeros.map(c => `<option value="${esc(c)}">`).join("")}</datalist></label>
      <label class="tr-lbl">Readiness<select data-trf="sucRdy">${trOpts(TRC.READY, e.sucRdy)}</select></label>` : ""}</div>`
      : `<p class="tr-hint"><b>Sucesión.</b> Solo se pide en puestos críticos o de mando. Si crees que lo es, marca la criticidad como <b>Alta</b>.</p>`}</div>`;
}

/* Paso 4 · Plan de desarrollo */
function trePlan(e, k) {
  const a = k === "A";
  return `<div class="tr-section ${a ? "primary" : "soft"}"><div class="tr-sh"><span class="tr-eyebrow">${a ? "Desarrollo · principal" : "Desarrollo · secundario"}${a ? "" : ` <em class="tr-pill">Opcional</em>`}</span><h3>Plan ${k}</h3>
      <p>${a ? "La palanca principal de crecimiento para los próximos meses. Un objetivo, una acción y un resultado que se pueda comprobar." : "Solo si hay una segunda palanca que aporte de verdad. Es mejor un plan bien hecho que dos a medias."}</p></div>
    <div class="tr-g2"><label class="tr-lbl">Objetivo<select data-trf="obj${k}">${trOpts(TRC.OBJETIVOS, e["obj" + k])}</select></label>
      <label class="tr-lbl">Acción<select data-trf="acc${k}">${trOpts(TRC.ACCIONES.map(x => x[0]), e["acc" + k])}</select>${e["acc" + k] ? `<small>${esc((TRC.ACCIONES.find(x => x[0] === e["acc" + k]) || [])[1] || "")}</small>` : ""}</label></div>
    <label class="tr-lbl tr-key">¿Qué será distinto cuando termine?<textarea data-trf="res${k}" placeholder="${a ? "Un resultado observable. Ej.: presentará el plan al comité sin apoyo y defenderá la propuesta con datos." : "Un resultado observable, como en el plan A."}">${esc(e["res" + k])}</textarea>
      ${a ? `<small>Es el ancla del plan: sin un resultado observable, en el próximo ciclo no habrá forma de saber si funcionó.</small>` : ""}</label>
    <div class="tr-g3"><label class="tr-lbl">Plazo<select data-trf="tim${k}">${trOpts(TRC.PLAZOS, e["tim" + k])}</select></label>
      <label class="tr-lbl">Prioridad<select data-trf="pri${k}">${trOpts(TRC.PRIOS, e["pri" + k])}</select></label>
      <label class="tr-lbl">Presupuesto<select data-trf="bud${k}">${trOpts(TRC.PRESUP, e["bud" + k])}</select></label></div></div>`;
}
function trePaso4(e) {
  const o = (e.imp || []).map(n => TRC.comp(n)).filter(Boolean).map(c => `<b>${esc(c.obj)}</b>`);
  return `<p class="tr-hint">${o.length ? `Objetivo derivado del área de mejora que has marcado: ${o.join(" y ")}. Puedes cambiarlo.` : "Marca primero un área de mejora en el paso 2 y el objetivo se propondrá solo."}</p>
    ${trePlan(e, "A")}${trePlan(e, "B")}
    <div class="tr-section"><div class="tr-sh"><span class="tr-eyebrow">Cierre</span><h3>Conversación y contexto</h3><p>El plan cobra sentido cuando la persona lo conoce. Y si hay algo que RR.HH. deba tener en cuenta al leer esta ficha, este es el sitio.</p></div>
      <div class="tr-g2"><label class="tr-lbl">¿Has hablado de este plan con la persona?<select data-trf="talked">${trOpts(["Sí", "No"], e.talked)}</select>
        <small>Si aún no, no pasa nada: quedará como valoración pendiente de conversar. Lo que no vale es darlo por hablado sin haberlo hecho.</small></label>
        <label class="tr-lbl${e.talked === "Sí" ? "" : " off"}">Fecha<input type="date" data-trf="talkedDate" value="${esc(e.talkedDate)}" ${e.talked === "Sí" ? "" : "disabled"}></label></div>
      <label class="tr-lbl">Contexto que RR.HH. deba conocer <small>(opcional)</small><textarea data-trf="note" placeholder="Incorporación reciente, cambio de rol, reorganización del área…">${esc(e.note)}</textarea></label>
      <div data-aviso="note">${treAvisos(e.note, false)}</div></div>`;
}

/* ---------- diálogos ---------- */
function treDialogo() {
  const d = TRE.dlg; if (!d) return "";
  const caja = (eyebrow, titulo, cuerpo, pie) => `<div class="tr-ov" data-tr="cerrarFondo"><div class="tr-dlg" role="dialog" aria-modal="true"><span class="tr-eyebrow">${eyebrow}</span><h3>${titulo}</h3><i class="tr-rule"></i>${cuerpo}<div class="tr-dlg-b">${pie}</div></div></div>`;
  const p = treP(), n = treActivas().length;
  if (d === "portada") {
    const hitos = TRC.CALENDARIO;
    return `<div class="tr-ov cover"><div class="tr-cover"><span class="tr-eyebrow">RR.HH. · Ciclo ${esc(TRE.ciclo.anio)} · ${esc(treAmb().nombre)}</span><h1>Talent Review y<br>plan de desarrollo</h1>
      <p>Para <b>${esc(TRE.ev.nombre)}</b> · ${n} ${n === 1 ? "persona a evaluar" : "personas a evaluar"} · unos 10 minutos por persona.</p>
      <span class="tr-eyebrow">Calendario del proceso</span><div class="tr-hitos">${hitos.map(([t, d2], i) => `<div class="${i === 0 ? "now" : ""}"><b>${i + 1} · ${t}</b><small>${i === 0 && TRE.ciclo.fecha_limite ? `Hasta el ${esc(trFecha(TRE.ciclo.fecha_limite))}` : esc(d2)}</small></div>`).join("")}</div>
      <p class="tr-hint">Fechas orientativas: la convocatoria oficial de RR.HH. prevalece.</p>
      <details class="tr-ejp"><summary>Información sobre el tratamiento de datos</summary><p>Las valoraciones son datos personales de tu equipo. Su finalidad es el desarrollo profesional, la planificación de la sucesión y las necesidades de formación del ciclo. Acceden a ellas tú y RR.HH.; no se comparten con terceros. No se toman decisiones automatizadas. Las personas pueden ejercer sus derechos de acceso, rectificación, supresión, oposición y limitación ante RR.HH. Limítate a hechos profesionales observables.</p></details>
      <div class="tr-dlg-b"><button class="tr-btn" data-tr="dlg" data-v="">Empezar</button><button class="tr-btn ghost" data-tr="dlg" data-v="guia">Ver cómo funciona</button></div></div></div>`;
  }
  if (d === "guia") return caja("Guía", "Cómo funciona, en seis pasos", `<p class="tr-hint">Unos 10 minutos por persona.</p><ol class="tr-como">${TRC.COMO.map(([t, x]) => `<li><b>${esc(t)}</b><span>${esc(x)}</span></li>`).join("")}</ol>
      <span class="tr-eyebrow">Dudas frecuentes</span>${TRC.FAQ.map(([q, r]) => `<details class="tr-faq"><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join("")}`, `<button class="tr-btn" data-tr="dlg" data-v="">Cerrar</button>`);
  if (d === "pend") {
    const pend = treActivas().filter(x => !TR.completa(x.datos));
    return caja("Aún no puedes enviar", `Falta completar ${pend.length} ${pend.length === 1 ? "ficha" : "fichas"}`, `<p>Para enviar, cada persona de tu equipo necesita sus cuatro apartados completos. Esto es lo que queda:</p>
      ${pend.map(x => `<div class="tr-pcard"><div><b>${esc(x.nombre)}</b><small>Falta: ${esc(TR.faltan(x.datos).join(", "))}.</small></div><button class="tr-btn sm" data-tr="sel" data-id="${x.id}">Ir a esta ficha →</button></div>`).join("")}`,
      `<button class="tr-btn ghost" data-tr="dlg" data-v="">Cerrar</button>`);
  }
  if (d === "enviar") {
    const E = TRE.encuesta;
    return caja("Paso final", "Enviar a RR.HH.", `<p>Al pulsar <b>Enviar a RR.HH.</b>, las ${n} ${n === 1 ? "valoración llega" : "valoraciones llegan"} a RR.HH. Después puedes seguir corrigiendo mientras el ciclo esté abierto.</p>
      ${TRE.ev.entregado ? "" : `<details class="tr-ejp" open><summary>Opcional · 30 segundos: ¿cómo ha ido?</summary>
        <label class="tr-lbl">¿Cuánto te ha llevado por persona?<select data-tre="t">${trOpts(["Menos de 5 minutos", "Entre 5 y 10", "Entre 10 y 20", "Más de 20"], E.t)}</select></label>
        <label class="tr-lbl">¿Qué te ha sobrado?<textarea data-tre="sobra" placeholder="Campos, pasos o textos que quitarías.">${esc(E.sobra)}</textarea></label>
        <label class="tr-lbl">¿Qué te ha faltado?<textarea data-tre="falta" placeholder="Algo que necesitabas y no estaba.">${esc(E.falta)}</textarea></label></details>`}
      ${TRE.err ? `<p class="tr-missing">${esc(TRE.err)}</p>` : ""}`,
      `<button class="tr-btn" data-tr="entregar" ${TRE.enviando ? "disabled" : ""}>${TRE.enviando ? "Enviando…" : "Enviar a RR.HH."}</button><button class="tr-btn ghost" data-tr="dlg" data-v="">Cerrar</button>`);
  }
  if (d === "enviado") return caja("Hecho", "✓ Enviado a RR.HH.", `<p>RR.HH. ya tiene tus ${n} ${n === 1 ? "valoración" : "valoraciones"}. Gracias. Si cambias algo mientras el ciclo esté abierto, el cambio llega solo.</p>`, `<button class="tr-btn" data-tr="dlg" data-v="">Cerrar</button>`);
  if (d === "alta") {
    const amb = treAmb();
    return caja("Alta manual", "Añadir a alguien que no aparece", `<p>Para incorporaciones o cambios recientes que aún no están en el listado de RR.HH. La ficha llegará marcada como <b>alta manual</b> para que RR.HH. la revise.</p>
      <form id="trAlta" class="tr-form"><label class="tr-lbl">Apellidos, Nombre *<input name="nombre" required placeholder="APELLIDOS, NOMBRE"></label>
      <label class="tr-lbl">Posición *<input name="puesto" required></label>
      <label class="tr-lbl">${esc(amb.unidad)}<input name="departamento" value="${esc(TRE.ev.unidad || "")}"></label>
      <label class="tr-lbl">Categoría<select name="categoria">${trOpts(amb.categorias, "")}</select></label>
      <label class="tr-check"><input type="checkbox" name="nuevo"> Lleva menos de un año en el puesto</label>
      ${TRE.err ? `<p class="tr-missing">${esc(TRE.err)}</p>` : ""}
      <div class="tr-dlg-b"><button class="tr-btn" type="submit">Añadir a mi equipo</button><button class="tr-btn ghost" type="button" data-tr="dlg" data-v="">Cancelar</button></div></form>`, "");
  }
  if (d === "salida" && p) return caja("Salida o traslado", `Marcar a ${esc(TR.apellidos(p.nombre))} como salida`, `<p>No cuenta para el progreso ni para el mapa. Su evaluación, si la había, se conserva y llega a RR.HH.</p>
      <label class="tr-lbl">Motivo <small>(opcional; lo verá RR.HH.)</small><textarea data-tre="motivo">${esc(TRE.motivo)}</textarea></label>`,
      `<button class="tr-btn" data-tr="salida">Marcar salida</button><button class="tr-btn ghost" data-tr="dlg" data-v="">Cancelar</button>`);
  if (d === "vaciar" && p) return caja("Vaciar esta ficha", `¿Vaciar la ficha de ${esc(TR.apellidos(p.nombre))}?`, `<p>Se vaciará por completo. El resto del equipo no se toca.</p>`,
      `<button class="tr-btn peligro" data-tr="vaciar">Vaciar ficha</button><button class="tr-btn ghost" data-tr="dlg" data-v="">Cancelar</button>`);
  return "";
}

/* ---------- impresión y CSV ---------- */
function treFichaImpresa(p) {
  const e = p.datos, si = TRC.segIdx(e.perf, e.pot), fila = (k, v) => v ? `<tr><th>${k}</th><td>${esc(v)}</td></tr>` : "";
  const sec = (t, filas) => filas.trim() ? `<h4>${t}</h4><table>${filas}</table>` : "";
  return `<section class="tr-pp"><header><div><h2>${esc(p.nombre)}</h2><p>${esc([p.puesto, p.departamento, p.categoria].filter(Boolean).join(" · "))}</p></div>
    <p>Talent Review ${esc(TRE.ciclo.anio)}<br>${esc(TRE.ev.nombre)}<br>${new Date().toLocaleDateString("es-ES")}</p></header>
    ${e.baja ? `<p>Salida (${esc(e.bajaFecha)}). ${esc(e.bajaMotivo || "")}</p>` : e.noEval ? `<p>No evaluable en este ciclo. Motivo: ${esc(e.noEvalWhy)}</p>` : `
    ${sec("Desempeño y potencial", fila("Desempeño", e.perf ? `${e.perf} · ${TRC.PERF[e.perf][0]}` : "") + fila("Evidencias", e.evP) + fila("Qué le distingue", e.justP) + fila("Potencial", e.pot ? `${e.pot} · ${TRC.POT[e.pot][0]}` : "") + fila("Evidencias", e.evO) + fila("Qué le distingue", e.justO) + fila("9-Box", si >= 0 ? `${TRC.SEG[si][0]} · ${TRC.SEG[si][1]}` : ""))}
    ${sec("Competencias", fila("Estrella", e.star) + fila("Puntos fuertes", (e.str || []).join(" · ")) + fila("Áreas de mejora", (e.imp || []).join(" · ")))}
    ${sec("Futuro y riesgo", fila("Riesgo de salida", e.riesgo) + fila("Impacto de salida", e.impacto) + fila("Acción de retención", e.retencion) + fila("Promoción / movimiento", e.promo) + fila("Promoción a", [e.promoPos, e.promoRdy].filter(Boolean).join(" · ")) + fila("Movimiento horizontal a", [e.horizPos, e.horizRdy].filter(Boolean).join(" · ")) + fila("Ambición", e.ambicion) + fila("Preferencia", e.carrera) + fila("Criticidad del puesto", e.critRole) + fila("Sucesor/a", [e.sucExiste, e.sucQuien, e.sucRdy].filter(Boolean).join(" · ")))}
    ${sec("Plan de desarrollo", fila("Plan A", [e.objA, e.accA, e.timA, e.priA && "Prioridad " + e.priA, e.budA].filter(Boolean).join(" · ")) + fila("Qué será distinto", e.resA) + fila("Plan B", [e.objB, e.accB, e.timB, e.priB && "Prioridad " + e.priB, e.budB].filter(Boolean).join(" · ")) + fila("Qué será distinto", e.resB) + fila("Hablado con la persona", [e.talked, e.talkedDate].filter(Boolean).join(" · ")) + fila("Contexto", e.note))}`}</section>`;
}
function trImprimir(html) {
  let a = $("trPrint"); if (!a) { a = document.createElement("div"); a.id = "trPrint"; document.body.appendChild(a); }
  a.innerHTML = html; document.body.classList.add("tr-imprimiendo");
  setTimeout(() => { window.print(); document.body.classList.remove("tr-imprimiendo"); }, 50);
}
const TR_CSV_COLS = [["Nombre", p => p.nombre], ["Posicion", p => p.puesto], ["Unidad", p => p.departamento], ["Categoria", p => p.categoria], ["AltaManual", p => (p.manual ? "Sí" : "No")],
  ["Salida", (p, e) => (e.baja ? `Sí (${e.bajaFecha})` : "No")], ["MotivoSalida", (p, e) => e.bajaMotivo], ["NoEvaluable", (p, e) => (e.noEval ? "Sí" : "No")], ["MotivoNoEval", (p, e) => e.noEvalWhy],
  ["Desempeno", (p, e) => e.perf || ""], ["Potencial", (p, e) => e.pot || ""], ["Segmento9Box", (p, e) => { const i = TRC.segIdx(e.perf, e.pot); return i >= 0 && !e.noEval ? TRC.SEG[i][0] : ""; }],
  ["EvidenciasDesempeno", (p, e) => e.evP], ["JustificacionDesempeno", (p, e) => e.justP], ["EvidenciasPotencial", (p, e) => e.evO], ["JustificacionPotencial", (p, e) => e.justO],
  ["CompetenciaEstrella", (p, e) => e.star], ["PuntosFuertes", (p, e) => (e.str || []).join(" | ")], ["AreasMejora", (p, e) => (e.imp || []).join(" | ")],
  ["CriticidadPuesto", (p, e) => e.critRole], ["Riesgo", (p, e) => e.riesgo], ["Impacto", (p, e) => e.impacto], ["AccionRetencion", (p, e) => e.retencion],
  ["Promocion", (p, e) => e.promo], ["PromocionA", (p, e) => e.promoPos], ["ReadinessPromo", (p, e) => e.promoRdy], ["MovHorizontalA", (p, e) => e.horizPos], ["ReadinessHoriz", (p, e) => e.horizRdy],
  ["Ambicion", (p, e) => e.ambicion], ["PreferenciaCarrera", (p, e) => e.carrera], ["SucesorExiste", (p, e) => e.sucExiste], ["Sucesor", (p, e) => e.sucQuien], ["SucesorReadiness", (p, e) => e.sucRdy],
  ["ObjetivoA", (p, e) => e.objA], ["AccionA", (p, e) => e.accA], ["ResultadoA", (p, e) => e.resA], ["PlazoA", (p, e) => e.timA], ["PrioridadA", (p, e) => e.priA], ["PresupuestoA", (p, e) => e.budA],
  ["ObjetivoB", (p, e) => e.objB], ["AccionB", (p, e) => e.accB], ["ResultadoB", (p, e) => e.resB], ["PlazoB", (p, e) => e.timB], ["PrioridadB", (p, e) => e.priB], ["PresupuestoB", (p, e) => e.budB],
  ["HabladoConPersona", (p, e) => e.talked], ["FechaConversacion", (p, e) => e.talkedDate], ["Contexto", (p, e) => e.note]];
function trCsv(filas, nombre, extra) {
  const cols = (extra || []).concat(TR_CSV_COLS);
  const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const txt = "﻿" + [cols.map(c => q(c[0])).join(";")].concat(filas.map(p => { const e = TR.d(p); return cols.map(c => q(c[1](p, e))).join(";"); })).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" })); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- acciones ---------- */
const TRE_ACC = {
  dlg(b) { TRE.dlg = b.dataset.v || null; TRE.err = ""; if (TRE.dlg === "salida") TRE.motivo = ""; },
  cerrarFondo(b, ev) { if (ev.target !== b || TRE.dlg === "portada") return false; TRE.dlg = null; },
  sel(b) { TRE.sel = b.dataset.id; TRE.dlg = null; const p = treP(); TRE.paso = "perf"; TRE.q = TR.pasoHecho(p.datos, "comp") ? -1 : !p.datos.star ? 0 : !(p.datos.str || []).length ? 1 : 2; window.scrollTo({ top: 0, behavior: "smooth" }); },
  paso(b) { TRE.paso = b.dataset.v; const e = treP().datos; if (TRE.paso === "comp") TRE.q = !e.star ? 0 : !(e.str || []).length ? 1 : !(e.imp || []).length ? 2 : -1; },
  ant() { const i = PASOS_TR.findIndex(x => x[0] === TRE.paso); TRE.paso = PASOS_TR[Math.max(0, i - 1)][0]; },
  sig() { const i = PASOS_TR.findIndex(x => x[0] === TRE.paso); TRE.paso = PASOS_TR[Math.min(3, i + 1)][0]; const e = treP().datos; if (TRE.paso === "comp") TRE.q = !e.star ? 0 : !(e.str || []).length ? 1 : !(e.imp || []).length ? 2 : -1; },
  q(b) { TRE.q = +b.dataset.i; },
  banda(b) {
    const p = treP(), e = p.datos, k = b.dataset.k, nb = +b.dataset.b;
    TRE.banda[TRE.sel + k] = nb;
    if (TRC.band(e[k]) !== nb) { e[k] = 0; e[k === "perf" ? "justP" : "justO"] = ""; treGuardar(p); }
  },
  nota(b) {
    const p = treP(), e = p.datos, k = b.dataset.k, n = +b.dataset.n;
    e[k] = e[k] === n ? 0 : n; if (e[k] < 8) e[k === "perf" ? "justP" : "justO"] = "";
    treGuardar(p);
  },
  enviar() { TRE.err = ""; TRE.dlg = treActivas().every(p => TR.completa(p.datos)) ? "enviar" : "pend"; },
  async entregar() {
    TRE.enviando = true; trePintar();
    await Promise.all(Object.keys(treTimers).map(id => { clearTimeout(treTimers[id]); const p = TRE.personas.find(x => x.id === id); return p ? sb.rpc("dr_guardar", { p_codigo: TRE.codigo, p_persona: p.id, p_datos: p.datos }) : null; }));
    const enc = Object.fromEntries(Object.entries(TRE.encuesta).filter(([, v]) => (v || "").trim()));
    const { error } = await sb.rpc("dr_entregar", { p_codigo: TRE.codigo, p_encuesta: enc });
    TRE.enviando = false;
    if (error) { TRE.err = "No se ha podido enviar: " + traducirError(error); return; }
    TRE.ev.entregado = new Date().toISOString(); TRE.personas.forEach(p => { p.estado = "enviada"; }); TRE.dlg = "enviado";
  },
  salida() {
    const p = treP(), e = p.datos;
    Object.assign(e, { baja: true, bajaMotivo: (TRE.motivo || "").trim(), bajaFecha: new Date().toLocaleDateString("es-ES") });
    TRE.dlg = null; treGuardar(p, true);
  },
  reactivar() { const p = treP(); Object.assign(p.datos, { baja: false, bajaMotivo: "", bajaFecha: "" }); treGuardar(p, true); },
  vaciar() { const p = treP(); p.datos = TR.vacio(); TRE.banda = {}; TRE.paso = "perf"; TRE.q = 0; TRE.dlg = null; treGuardar(p, true); },
  imprimir() { trImprimir(treFichaImpresa(treP())); return false; },
  imprimirTodo(b) { b.closest("details").open = false; trImprimir(TRE.personas.map(treFichaImpresa).join("")); return false; },
  csv(b) { b.closest("details").open = false; trCsv(TRE.personas, `Talent_Review_${TRE.ciclo.anio}_${TR.apellidos(TRE.ev.nombre).replace(/\W+/g, "_")}.csv`); return false; },
  salir() { TRE.ciclo = null; INV.codigo = ""; INV.datos = null; INV.error = ""; pintarInvitado(); return false; }
};

/* Refresca lo que depende del contenido sin repintar (para no perder el foco al escribir) */
function treRefrescar() {
  const p = treP(); if (!p) return;
  const act = treActivas(), hechas = treHechas(), n = act.length, pct = n ? Math.round(hechas.length / n * 100) : 0;
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  set("trProgTxt", `${hechas.length} de ${n} listas`); set("trProgPct", pct + "%");
  const bar = $("trProgBar"); if (bar) bar.style.width = pct + "%";
  const be = $("trBtnEnviar"); if (be) { const todo = n && hechas.length === n; be.textContent = `${TRE.ev.entregado ? "Volver a enviar" : "Enviar a RR.HH."} ${todo ? "✓" : `(${hechas.length}/${n})`}`; be.classList.toggle("pend", !todo); }
  const dot = document.querySelector(`[data-dot="${p.id}"]`); if (dot) dot.className = "tr-dot " + (TR.completa(p.datos) ? "done" : TR.tocada(p.datos) ? "part" : "");
  document.querySelectorAll("[data-paso]").forEach(b => { const ok = TR.pasoHecho(p.datos, b.dataset.paso); b.classList.toggle("ok", ok); b.querySelector("i").textContent = ok ? "✓" : PASOS_TR.findIndex(x => x[0] === b.dataset.paso) + 1; });
  const f = $("trFalta"); if (f) f.innerHTML = treFalta(p);
}

document.addEventListener("click", async ev => {
  if (!TRE.ciclo || !document.querySelector(".tr-ev")) return;
  const b = ev.target.closest("[data-tr]"); if (!b || b.disabled) return;
  const fn = TRE_ACC[b.dataset.tr]; if (!fn) return;
  if (b.tagName === "A") ev.preventDefault();
  const r = await fn(b, ev);
  if (r !== false && TRE.ciclo) trePintar();
});
document.addEventListener("input", ev => {
  if (!TRE.ciclo || !ev.target.closest(".tr-ev")) return;
  const t = ev.target;
  if (t.dataset.tre) { if (t.dataset.tre === "motivo") TRE.motivo = t.value; else TRE.encuesta[t.dataset.tre] = t.value; return; }
  const k = t.dataset.trf; if (!k || t.tagName === "SELECT" || t.type === "checkbox") return;
  const p = treP(); if (!p) return;
  p.datos[k] = t.value; treGuardar(p);
  const av = document.querySelector(`[data-aviso="${k}"]`); if (av) av.innerHTML = treAvisos(t.value, k !== "note");
  treRefrescar();
});
document.addEventListener("change", ev => {
  if (!TRE.ciclo || !ev.target.closest(".tr-ev")) return;
  const t = ev.target, p = treP();
  if (t.dataset.tre === "t") { TRE.encuesta.t = t.value; return; }
  if (!p) return;
  const e = p.datos;
  if (t.dataset.trc) {
    const c = t.dataset.trc, v = t.value;
    if (c === "star") { e.star = v; e.str = (e.str || []).filter(x => x !== v); e.imp = (e.imp || []).filter(x => x !== v); if (v) TRE.q = 1; }
    else { const arr = (e[c] || []).slice(); arr[+t.dataset.i] = v; e[c] = arr.filter(Boolean); if (c === "str" && e.str.length === 2) TRE.q = 2; }
    treAutoplan(e); treGuardar(p); trePintar(); return;
  }
  const k = t.dataset.trf; if (!k) return;
  if (t.type === "checkbox") e[k] = t.checked;
  else if (t.tagName === "SELECT" || t.type === "date") e[k] = t.value;
  else return;
  if (k === "promo") {
    if (!["Sí, de promoción", "Sí, de ambas"].includes(e.promo)) { e.promoPos = ""; e.promoRdy = ""; }
    if (!["Sí, de movimiento horizontal", "Sí, de ambas"].includes(e.promo)) { e.horizPos = ""; e.horizRdy = ""; }
  }
  if (k === "sucExiste" && e.sucExiste !== "Sí") { e.sucQuien = ""; e.sucRdy = ""; }
  if (k === "talked" && e.talked !== "Sí") e.talkedDate = "";
  treGuardar(p); trePintar();
});
document.addEventListener("submit", async ev => {
  if (ev.target.id !== "trAlta") return;
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  const { data, error } = await sb.rpc("dr_alta", { p_codigo: TRE.codigo, p_nombre: f.nombre, p_puesto: f.puesto, p_departamento: f.departamento || "", p_categoria: f.categoria || "", p_nuevo: !!f.nuevo });
  if (error) { TRE.err = traducirError(error); trePintar(); return; }
  TRE.personas.push({ id: data, nombre: f.nombre.trim(), puesto: f.puesto.trim(), departamento: f.departamento || "", categoria: f.categoria || "", ant_compania: null, ant_puesto: f.nuevo ? 0.5 : null, manual: true, estado: "borrador", datos: TR.vacio() });
  TRE.personas.sort((a, b) => a.nombre.localeCompare(b.nombre));
  TRE.sel = data; TRE.dlg = null; TRE.err = ""; TRE.paso = "perf"; trePintar();
});
document.addEventListener("toggle", ev => { if (ev.target.id === "trMapa") TRE.mapa = ev.target.open; }, true);
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && TRE.ciclo && TRE.dlg && TRE.dlg !== "portada" && document.querySelector(".tr-ev")) { TRE.dlg = null; trePintar(); } });
