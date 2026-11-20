/* =====================================================================
   Pippole · Copiloto del manager (0.38.0)

   Prepara la conversación de evaluación del Scorecard: resumen, lo que va
   bien, temas para hablar, preguntas y un borrador de plan.

   Versión SIN IA: el borrador sale de reglas fijas sobre los datos que ya
   hay en Pippole (valoraciones, evidencias, KPIs y clima de la tienda).
   No valora ni puntúa a nadie: solo ordena lo que existe. Cuando el DPO dé
   el visto bueno, la redacción podrá hacerla un modelo de IA con las
   mismas fuentes; las reglas seguirán decidiendo QUÉ datos entran.

   No usa: bajas, respuestas individuales de encuestas, comentarios con
   nombre ni datos de otras tiendas. El clima solo entra si la tienda
   tiene al menos CL.MIN respuestas en una encuesta.
   ===================================================================== */

/* Clima de la tienda: la encuesta más reciente con respuestas suficientes. */
function copClima(t) {
  if (typeof clDatos !== "function") return null;
  const cs = (S.campanas || []).filter(c => c.tipo === "clima" && (typeof clEsV2 !== "function" || clEsV2(c)))
    .sort((a, b) => (a.creado < b.creado ? 1 : -1));
  for (const c of cs) {
    const D = clDatos(c);
    const n = D.resp.filter(i => i.tienda_id === t.id).length;
    if (n < CL.MIN) continue;
    const A = clResumen(D, i => i.tienda_id === t.id);
    const dims = A.dims.filter(x => x.fav != null).sort((a, b) => a.fav - b.fav);
    if (!dims.length) continue;
    return { titulo: c.titulo, n, fav: A.fav, peor: dims[0], mejor: dims[dims.length - 1] };
  }
  return null;
}

function copBorrador(t, p, per) {
  const r = SC.calcular(t, p, per), e = (p.evals || {})[per] || {}, val = e.val || {}, evid = e.evid || {};
  const its = SC.items().filter(i => typeof val[i.id] === "number");
  const desde1 = (C.escaladoKPI.find(([, f]) => f >= 1) || [1])[0];
  const fuentes = [], bien = [], hablar = [], preguntas = [], plan = [];

  fuentes.push([`Scorecard · ${C.periodos[per].corto}`, `${r.nValorados} de ${r.nItems} valoraciones · ${Object.values(evid).filter(x => String(x || "").trim()).length} evidencias`]);
  const kOk = r.kpis.filter(x => x.completo);
  fuentes.push(["Resultados de tienda", `${kOk.length} de ${r.kpis.length} indicadores${t.objetivosValidados ? " frente a objetivos validados" : " (objetivos sin validar)"}`]);
  const cl = copClima(t);
  fuentes.push(["Clima de la tienda", cl ? `${cl.n} respuestas en «${cl.titulo}», solo por dimensión` : `Sin una encuesta con ${CL.MIN} respuestas o más de esta tienda`]);

  // Lo que va bien: valoraciones altas (con su evidencia) y KPIs por encima del 100 %.
  its.filter(i => val[i.id] >= 1.5).sort((a, b) => val[b.id] - val[a.id] || b.peso - a.peso).slice(0, 3).forEach(i => {
    const ev = String(evid[i.id] || "").trim();
    bien.push({ t: `${i.nombre}: ${nivelCorto(val[i.id]).toLowerCase()} (${SC.fmt(val[i.id], 1)})${ev ? `. Evidencia: «${ev.length > 120 ? ev.slice(0, 117) + "…" : ev}»` : ""}.`, f: "Scorecard · " + i.bloque });
  });
  kOk.filter(x => x.kpi.tipo !== "inventario" && x.pct >= 1).forEach(x =>
    bien.push({ t: `${x.kpi.nombre} al ${SC.pct(x.pct, 1)} del objetivo (factor ${SC.fmt(x.factor, 3)}).`, f: "Resultados" }));
  if (cl && cl.mejor && cl.mejor.fav >= 0.7) bien.push({ t: `En el clima de la tienda, «${cl.mejor.d}» es lo mejor valorado: ${clPct(cl.mejor.fav)} favorable.`, f: "Clima" });

  // Para hablar: KPIs bajo factor 1 (con lo que valdría subirlos), valoraciones bajas y el clima más flojo.
  kOk.filter(x => x.kpi.tipo !== "inventario" && x.factor < 1).forEach(x => {
    const gana = r.base * C.pesoCuantitativo * x.kpi.peso * (1 - x.factor);
    hablar.push({ t: `${x.kpi.nombre} al ${SC.pct(x.pct, 1)} del objetivo. Llegar al ${SC.pct(desde1, 0)} subiría el bonus del periodo en ${SC.eur(gana)}.`, f: "Resultados" });
    preguntas.push(`¿Qué está frenando ${x.kpi.nombre.toLowerCase()}? ¿En qué momentos del día se nota más?`);
    plan.push({ a: `Plan concreto para ${x.kpi.nombre.toLowerCase()}`, q: p.nombre || "", c: "" });
  });
  const kInv = kOk.find(x => x.kpi.tipo === "inventario");
  if (kInv && kInv.factor < 1) hablar.push({ t: `Inventario: ${SC.pct(kInv.pct, 3)} de falta, factor ${SC.fmt(kInv.factor, 3)}.`, f: "Resultados" });
  const bajas = its.filter(i => val[i.id] <= 0.5).sort((a, b) => val[a.id] - val[b.id] || b.peso - a.peso);
  const enLinea = its.filter(i => val[i.id] === 1).sort((a, b) => b.peso - a.peso);
  bajas.concat(enLinea).slice(0, Math.max(2, bajas.length)).forEach(i => {
    hablar.push({ t: `${i.nombre}: ${nivelCorto(val[i.id]).toLowerCase()} (${SC.fmt(val[i.id], 1)}), con un peso del ${SC.pct(i.peso, 0)}.`, f: "Scorecard · " + i.bloque });
    if (i.guia && /\?\s*$/.test(i.guia)) preguntas.push(i.guia);
    if (val[i.id] <= 0.5) plan.push({ a: `Mejorar «${i.nombre}»`, q: p.nombre || "", c: "" });
  });
  if (cl && cl.peor) {
    hablar.push({ t: `En el clima de la tienda, «${cl.peor.d}» es la dimensión más baja: ${clPct(cl.peor.fav)} favorable (${cl.n} respuestas).`, f: "Clima" });
    preguntas.push(`El equipo valora «${cl.peor.d}» por debajo del resto. ¿A qué crees que se debe y qué podrías cambiar?`);
    plan.push({ a: `Una acción sobre «${cl.peor.d}» con el equipo`, q: p.nombre || "", c: "" });
  }
  preguntas.push("¿Qué necesitas de mí para el próximo periodo?");
  plan.push({ a: "Revisar juntos estos puntos en la próxima visita", q: e.evaluador == null ? rmNombre(t) : e.evaluador, c: "" });

  // Resumen en dos frases, solo con hechos.
  let res;
  if (!r.completo) res = `La evaluación aún no está completa: ${r.nItems - r.nValorados} valoraciones y ${r.kpis.length - kOk.length} indicadores pendientes. El borrador usa lo que ya hay.`;
  else {
    const cumple = [r.ptsCual >= C.umbralCualitativo - 1e-12, r.ptsCuant >= C.umbralCuantitativo - 1e-12];
    const est = cumple[0] && cumple[1] ? "cumple los mínimos de los dos bloques" : !cumple[0] && !cumple[1] ? "no llega al mínimo de ningún bloque" : `no llega al mínimo del bloque ${cumple[0] ? "de resultados" : "cualitativo"}`;
    res = `${p.nombre || "La persona"} ${est}, con un bonus de ${SC.eur(r.bonus)} y una nota de ${SC.fmt(r.nota, 2)} sobre ${SC.fmt(r.notaMax, 0)}.`;
    if (hablar.length) res += ` Lo primero que conviene tratar: ${hablar[0].t.charAt(0).toLowerCase() + hablar[0].t.slice(1)}`;
  }
  return { res, fuentes, bien, hablar, preguntas: [...new Set(preguntas)].slice(0, 5), plan: plan.slice(0, 5), cerrado: !!e.cerrado };
}

const COP = { plan: [] };
function copLista(xs) {
  return xs.length ? `<ul class="cop-l">${xs.map(x => `<li><span>${esc(x.t)}</span><small>${esc(x.f)}</small></li>`).join("")}</ul>` : `<p class="muted">Nada destacable con los datos que hay.</p>`;
}
function abrirCopiloto() {
  const t = tienda(), p = persona(t), per = S.ui.fase;
  if (!t || !p || !C.periodos[per]) return;
  const B = copBorrador(t, p, per);
  COP.plan = B.plan.map(x => Object.assign({}, x));
  const cuerpo = `<div class="cop-aviso"><b>Borrador hecho con reglas, sin IA.</b> Ordena lo que hay en Pippole y propone por dónde llevar la reunión. No valora ni puntúa: eso lo haces tú. No se guarda nada hasta que lo lleves a la conversación.</div>
    <section><h3>En dos líneas</h3><p>${esc(B.res)}</p></section>
    <section><h3>Lo que va bien</h3>${copLista(B.bien)}</section>
    <section><h3>Para hablar</h3>${copLista(B.hablar)}</section>
    <section><h3>Preguntas para la reunión</h3><ol class="cop-q">${B.preguntas.map(q => `<li>${esc(q)}</li>`).join("")}</ol></section>
    <section><h3>Borrador del plan</h3><p class="muted">Edita, añade o borra filas. Al llevarlo a la conversación se añade al «Plan de mejora acordado».</p>
      <div class="tablewrap"><table class="ex-t cop-plan"><thead><tr><th>Acción</th><th>Quién</th><th>Cuándo</th><th></th></tr></thead><tbody id="copPlan">${copFilas()}</tbody></table></div>
      <button class="btn" data-action="copFila">Añadir una fila</button></section>
    <div class="ex-ori"><b>Lo que he leído</b><dl>${B.fuentes.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <p>No uso bajas ni ausencias, respuestas individuales de encuestas, comentarios con nombre ni datos de otras tiendas.</p></div>
    <div class="cop-acc">${B.cerrado ? `<p class="muted">La evaluación está cerrada: el plan no se puede cambiar.</p>` : `<button class="btn primary" data-action="copLlevar">Llevar el plan a la conversación</button>`}<button class="btn" data-action="exCerrar">Cerrar</button></div>`;
  abrirExplica(`Preparar la conversación con ${p.nombre || "esta persona"}`, `${C.periodos[per].nombre} · ${t.nombre}`, cuerpo);
  const tb = $("copPlan");
  if (tb) tb.addEventListener("input", ev => { const el = ev.target, i = +el.dataset.i, k = el.dataset.k; if (COP.plan[i] && k) COP.plan[i][k] = el.value; });
}
function copFilas() {
  return COP.plan.map((x, i) => `<tr>
    <td><input aria-label="Acción ${i + 1}" data-i="${i}" data-k="a" value="${esc(x.a)}" maxlength="200"></td>
    <td><input aria-label="Quién, fila ${i + 1}" data-i="${i}" data-k="q" value="${esc(x.q)}" maxlength="80"></td>
    <td><input aria-label="Cuándo, fila ${i + 1}" type="date" data-i="${i}" data-k="c" value="${esc(x.c)}"></td>
    <td><button class="btn ghost" data-action="copQuitar" data-i="${i}" aria-label="Quitar la fila ${i + 1}">Quitar</button></td></tr>`).join("");
}
function copRepintarPlan() { const tb = $("copPlan"); if (tb) tb.innerHTML = copFilas(); }

const ACCIONES_COPILOTO = {
  copiloto() { abrirCopiloto(); return false; },
  copFila() { COP.plan.push({ a: "", q: "", c: "" }); copRepintarPlan(); return false; },
  copQuitar(b) { COP.plan.splice(+b.dataset.i, 1); copRepintarPlan(); return false; },
  copLlevar() {
    const t = tienda(), p = persona(t), per = S.ui.fase; if (!t || !p) return false;
    const e = p.evals = p.evals || {}; const ev = e[per] = e[per] || {};
    if (ev.cerrado) return false;
    const filas = COP.plan.filter(x => String(x.a || "").trim());
    if (!filas.length) { avisar("El plan está vacío: añade al menos una acción."); return false; }
    const txt = filas.map(x => `- ${x.a.trim()}${x.q ? ` · ${x.q.trim()}` : ""}${x.c ? ` · ${fechaES(x.c)}` : ""}`).join("\n");
    ev.planMejora = (ev.planMejora ? ev.planMejora.trim() + "\n" : "") + txt;
    log(`Plan del copiloto llevado a la conversación de ${p.nombre} (${C.periodos[per].corto})`, t);
    guardar(t); cerrarExplica(); toast("Plan añadido a la conversación");
  }
};
