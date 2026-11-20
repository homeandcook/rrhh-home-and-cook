/* =====================================================================
   Pippole · «¿De dónde sale?» (0.38.0)

   Cada cifra importante lleva un botón que abre su cálculo paso a paso
   y el origen de los datos. Hoy: bonus y nota del Scorecard, y % favorable
   de clima (total y por dimensión).

   Todo se calcula con las mismas funciones que la pantalla (SC.calcular,
   clDatos, clResumen): la explicación no puede contradecir la cifra.
   Overlay #exOv fuera de #app, con sus acciones en ACCIONES_EXPLICA.
   ===================================================================== */

function abrirExplica(titulo, sub, cuerpo) {
  cerrarExplica();
  const ov = document.createElement("div");
  ov.id = "exOv"; ov.className = "ex-ov";
  ov.innerHTML = `<div class="ex-caja" role="dialog" aria-modal="true" aria-labelledby="exTit">
    <div class="ex-h"><div><h2 id="exTit">${esc(titulo)}</h2>${sub ? `<p class="muted">${esc(sub)}</p>` : ""}</div>
    <button class="btn ghost" data-action="exCerrar" aria-label="Cerrar">Cerrar</button></div>
    <div class="ex-b">${cuerpo}</div></div>`;
  ov.addEventListener("click", e => { if (e.target === ov) cerrarExplica(); });
  ov.addEventListener("keydown", e => { if (e.key === "Escape") cerrarExplica(); });
  document.body.appendChild(ov);
  const b = ov.querySelector("[data-action=exCerrar]"); if (b) b.focus();
}
function cerrarExplica() { const o = $("exOv"); if (o) o.remove(); }

const exPaso = (n, tit, html, oscuro) => `<li class="ex-paso"><span class="ex-n${oscuro ? " os" : ""}">${n}</span><div><b>${tit}</b>${html}</div></li>`;
const exChip = (ok, t) => `<span class="ex-chip ${ok ? "ok" : "ko"}">${esc(t)}</span>`;

/* ---------- Scorecard: bonus y nota ---------- */
function explicaBonus(t, p, per) {
  const r = SC.calcular(t, p, per), P = C.periodos[per], e = (p.evals || {})[per] || {};
  const b = C.bonus[p.puesto];
  if (!b) return `<p>Este puesto no tiene bonus configurado, así que no hay nada que calcular.</p>`;
  const pr = SC.num(p.prorrata), prT = pr != null && pr !== 100 ? ` × ${SC.fmt(pr, 0)} % del periodo trabajado` : "";
  const ref = C.referenciaBonus === "maximo" ? C.puntuacionMaxima : 1;
  let h = `<ol class="ex-pasos">`;

  h += exPaso(1, `Base: ${SC.eur(r.base)}`,
    `<p>El bonus de ${esc(b.nombre)} es de ${SC.eur(b.importe, 0)} con la puntuación máxima (${SC.fmt(ref, 0)} en todo). La base es lo que corresponde a tenerlo todo «en línea» (1): ${SC.eur(b.importe, 0)} ÷ ${SC.fmt(ref, 0)}${prT}.</p>`);

  // Cualitativo
  if (!r.cualCompleto) {
    h += exPaso(2, "Valoración cualitativa: pendiente", `<p>Faltan ${r.nItems - r.nValorados} de ${r.nItems} valoraciones. Hasta tenerlas todas no se calcula.</p>`);
  } else {
    const cumple = r.ptsCual >= C.umbralCualitativo - 1e-12;
    const val = e.val || {};
    const bloques = C.bloques.map(bl => {
      const peso = bl.items.reduce((s, i) => s + i.peso, 0);
      const media = bl.items.reduce((s, i) => s + i.peso * (val[i.id] || 0), 0) / peso;
      return `<tr><td>${esc(bl.nombre)}</td><td class="num">${SC.pct(peso, 0)}</td><td class="num">${SC.fmt(media, 2)}</td></tr>`;
    }).join("");
    h += exPaso(2, `Valoración cualitativa: ${SC.eur(r.bonusCual)}`,
      `<p>Media ponderada de las ${r.nItems} valoraciones: ${SC.fmt(r.sumCual, 2)}. Pesa el ${SC.pct(C.pesoCualitativo, 0)}: ${SC.fmt(C.pesoCualitativo, 2)} × ${SC.fmt(r.sumCual, 2)} = ${SC.fmt(r.ptsCual, 3)}. Mínimo para cobrar este bloque: ${SC.fmt(C.umbralCualitativo, 2)}.</p>
      <div class="tablewrap"><table class="ex-t"><thead><tr><th>Bloque</th><th class="num">Peso</th><th class="num">Media</th></tr></thead><tbody>${bloques}</tbody></table></div>
      <p class="ex-linea">${exChip(cumple, cumple ? "Cumple el mínimo" : "No llega al mínimo")}<span>${cumple ? `${SC.eur(r.base)} × ${SC.fmt(r.ptsCual, 3)} = ${SC.eur(r.bonusCual)}` : "Este bloque da 0 €."}</span></p>`);
  }

  // Cuantitativo
  if (!r.cuantCompleto) {
    const faltan = r.kpis.filter(x => !x.completo).map(x => x.kpi.nombre);
    h += exPaso(3, "Resultados de tienda: pendiente", `<p>Faltan datos de ${esc(faltan.join(", "))}. Hasta tenerlos todos no se calcula.</p>`);
  } else {
    const cumple = r.ptsCuant >= C.umbralCuantitativo - 1e-12;
    const desde1 = (C.escaladoKPI.find(([, f]) => f >= 1) || [1])[0];
    const filas = r.kpis.map(x => `<tr><td>${esc(x.kpi.nombre)}</td><td class="num">${x.kpi.tipo === "inventario" ? SC.pct(x.pct, 3) + " de falta" : SC.pct(x.pct, 1)}</td><td class="num">${SC.pct(x.kpi.peso, 0)} × ${SC.fmt(x.factor, 3)}</td><td class="num">${SC.fmt(x.kpi.peso * x.factor, 4)}</td></tr>`).join("");
    const restan = r.kpis.filter(x => x.kpi.tipo !== "inventario" && x.factor < 1).map(x => x.kpi.nombre);
    h += exPaso(3, `Resultados de tienda: ${SC.eur(r.bonusCuant)}`,
      `<p>Cada indicador da un factor según su consecución. Pesan el ${SC.pct(C.pesoCuantitativo, 0)}: ${SC.fmt(C.pesoCuantitativo, 2)} × ${SC.fmt(r.sumCuant, 4)} = ${SC.fmt(r.ptsCuant, 3)}. Mínimo: ${SC.fmt(C.umbralCuantitativo, 2)}.</p>
      <div class="tablewrap"><table class="ex-t"><thead><tr><th>Indicador</th><th class="num">Consecución</th><th class="num">Peso × factor</th><th class="num">Aporta</th></tr></thead>
      <tbody>${filas}<tr class="tot"><td colspan="3">Total ponderado</td><td class="num">${SC.fmt(r.sumCuant, 4)}</td></tr></tbody></table></div>
      <p class="ex-linea">${exChip(cumple, cumple ? "Cumple el mínimo" : "No llega al mínimo")}<span>${cumple ? `${SC.eur(r.base)} × ${SC.fmt(r.ptsCuant, 3)} = ${SC.eur(r.bonusCuant)}` : "Este bloque da 0 €."}</span></p>
      ${restan.length ? `<p class="ex-nota">Por debajo del ${SC.pct(desde1, 0)} el factor baja de 1: ${esc(restan.join(", "))}.</p>` : ""}`);
  }

  if (r.completo) {
    h += exPaso("=", `${SC.eur(r.bonusCual)} + ${SC.eur(r.bonusCuant)} = ${SC.eur(r.bonus)}`,
      `<p>Nota sobre ${SC.fmt(r.notaMax, 0)}: (${SC.fmt(r.ptsCual, 3)} + ${SC.fmt(r.ptsCuant, 3)}) × ${SC.fmt(C.multiplicadorNota, 0)} = ${SC.fmt(r.nota, 2)}.${per === "s1" ? " Es orientativo: lo que se paga sale del cierre anual." : ""}</p>`, true);
  }
  h += `</ol>`;

  // Origen de los datos: solo lo que Pippole registra de verdad.
  const ov = t.objetivosValidados;
  const ori = [
    ["Objetivos", ov ? `Validados${ov.por ? " por " + esc(ov.por) : ""} el ${fechaES(ov.fecha)}` : "Sin validar todavía"],
    ["Valoraciones", `${esc(e.evaluador == null ? rmNombre(t) || "Sin evaluador" : e.evaluador || "Sin evaluador")}${e.fecha ? `, reunión del ${fechaES(e.fecha)}` : ""} · ${Object.values(e.evid || {}).filter(x => String(x || "").trim()).length} evidencias`],
    ["Estado", e.cerrado ? `Cerrada el ${fechaES(e.cerrado.fecha)}${e.cerrado.por ? " por " + esc(e.cerrado.por) : ""}` : "Abierta"]
  ];
  h += `<div class="ex-ori"><b>De dónde vienen los datos</b><dl>${ori.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></div>`;
  return h;
}

/* ---------- Clima: % favorable ---------- */
function explicaClima(c, dim) {
  const D = clDatos(c), A = clResumen(D);
  const likert = D.qs.filter(q => q.tipo === "likert" && q.parte === 1 && q.dim !== "En conjunto" && (!dim || q.dim === dim));
  const vals = likert.flatMap(q => A.R.map(i => (i.respuestas || {})[q.id]).filter(v => typeof v === "number"));
  const fav = vals.filter(v => v >= 3).length;
  const pct = vals.length ? fav / vals.length : null;
  let h = `<ol class="ex-pasos">`;
  h += exPaso(1, `${A.n} personas han respondido`, `<p>${A.n} de ${D.invs.length} invitaciones (${Math.round(A.n / Math.max(D.invs.length, 1) * 100)} % de participación).</p>`);
  h += exPaso(2, `${likert.length} ${likert.length === 1 ? "pregunta cuenta" : "preguntas cuentan"}`, `<p>${dim ? `Las de la dimensión «${esc(dim)}»` : "Todas las de la escala de la parte 1"}, sin las de valoración global. Cada respuesta va de 0 («Casi nunca») a 4 («Casi siempre»).</p>`);
  h += exPaso(3, `${fav} de ${vals.length} respuestas son favorables`, `<p>Favorable es un 3 («A menudo») o un 4 («Casi siempre»).</p>`);
  h += exPaso("=", `${fav} ÷ ${vals.length} = ${clPct(pct)}`, `<p>Redondeado a la unidad.</p>`, true);
  h += `</ol><div class="ex-ori"><b>Anonimato</b><p>Un grupo se enseña solo con ${CL.MIN} respuestas o más. ${clAnon(c) ? "Esta encuesta es anónima: las respuestas no llevan nombre ni correo." : "Esta encuesta va con nombre: lo sabían quienes respondieron."}</p></div>`;
  return h;
}

const ACCIONES_EXPLICA = {
  exBonus() {
    const t = tienda(), p = persona(t), per = S.ui.fase;
    if (!t || !p || !C.periodos[per]) return false;
    abrirExplica(`Cómo sale el bonus de ${p.nombre || "esta persona"}`, `${C.periodos[per].nombre} · ${t.nombre} · reglas de ${C.anio}`, explicaBonus(t, p, per));
    return false;
  },
  exClima(b) {
    const c = (S.campanas || []).find(x => x.id === S.clRes); if (!c) return false;
    const dim = b.dataset.dim || "";
    abrirExplica(dim ? `Cómo sale el % favorable de «${dim}»` : "Cómo sale el clima favorable", c.titulo, explicaClima(c, dim));
    return false;
  },
  exCerrar() { cerrarExplica(); return false; }
};
