"use strict";
/* ===================== DESARROLLO · informes =====================
   Dos informes que comparten RR.HH. y quien evalúa (con su código):
   - Informe del equipo: el resumen de un Talent Review (un responsable y
     su equipo): cifras, 9-Box, riesgo × impacto, competencias, tabla por
     persona, planes y sucesión.
   - Informe de la persona: la ficha ejecutiva con todo lo que se ha
     valorado de ella.
   Las funciones solo pintan: reciben un contexto
     cx = { ciclo, amb, ev, personas, mgr(p), ver(p) }
   donde ver(p) devuelve los atributos del botón que abre a una persona,
   distintos en el panel de RR.HH. (data-tra) y en la ficha (data-tr).
   ================================================================= */
const TRI = {
  sets(ps) {
    const activas = ps.filter(p => !TR.d(p).baja);
    const evaluadas = activas.filter(p => { const e = TR.d(p); return !e.noEval && e.perf > 0 && e.pot > 0; });
    return { activas, evaluadas };
  },
  pct: (n, d) => (d ? Math.round(n / d * 100) : 0),
  barras(items, total) {
    if (!items.length) return `<p class="hint">Sin datos.</p>`;
    const max = Math.max(1, ...items.map(x => x[1]));
    return `<div class="tr-barras">${items.map(([t, v, c]) => `<div class="tr-br"><span>${esc(t)}</span><div><i class="${c || ""}" style="width:${(v / (total || max)) * 100}%"></i></div><b>${v}${total ? ` · ${TRI.pct(v, total)}%` : ""}</b></div>`).join("")}</div>`;
  },
  verBtn(cx, p, txt) { return cx.ver ? `<button class="tr-link" ${cx.ver(p)}>${txt || "ver →"}</button>` : ""; },
  /* 9-Box con los apellidos de cada persona en su casilla */
  nueve(cx, ev) {
    const filas = [6, 7, 8, 3, 4, 5, 0, 1, 2];
    return `<div class="tr-9"><div class="tr-9y"><span>Potencial alto</span><span>Potencial medio</span><span>Potencial bajo</span></div><div class="tr-9g">${filas.map(i => {
      const ps = ev.filter(p => { const e = TR.d(p); return TRC.segIdx(e.perf, e.pot) === i; }), [nom, nota, c] = TRC.SEG[i];
      return `<div class="tr-cell ${c}"><span class="tr-cn">${esc(nom)}</span><small>${esc(nota)}</small><b>${ps.length} <em>· ${TRI.pct(ps.length, ev.length)}%</em></b>
        <div>${ps.map(p => cx.ver ? `<button class="tr-chip" ${cx.ver(p)}>${esc(TR.apellidos(p.nombre))}</button>` : `<span class="tr-chip">${esc(TR.apellidos(p.nombre))}</span>`).join("")}</div></div>`;
    }).join("")}</div><div></div><div class="tr-9x"><span>Desempeño bajo</span><span>Desempeño medio</span><span>Desempeño alto</span></div></div>`;
  },
  /* Riesgo × impacto 3×3 (A0–C2) con nombres */
  riesgo(cx, xs) {
    const fondo = ["#EFEAFE", "#D9CFFC", "#B6A6FF", "#8C75F0", "#5B3FD9"];
    return `<div class="tr-9"><div class="tr-9y"><span>Impacto alto</span><span>Impacto medio</span><span>Impacto bajo</span></div><div class="tr-9g">${[2, 1, 0].map(i => ["C", "B", "A"].map((r, ri) => {
      const c = r + i, ps = xs.filter(p => { const e = TR.d(p); return TRC.riesgoCod(e.riesgo, e.impacto) === c; }), sev = ri + i;
      return `<div class="tr-rcell tr-inf-r" style="background:${fondo[sev]};color:${sev >= 3 ? "#fff" : "#231A3D"}"><span class="tr-rc">${c}</span><b>${ps.length || "·"}</b>
        <div>${ps.map(p => `<span class="tr-chip">${esc(TR.apellidos(p.nombre))}</span>`).join("")}</div></div>`; }).join("")).join("")}</div>
      <div></div><div class="tr-9x"><span>Riesgo bajo</span><span>Riesgo medio</span><span>Riesgo alto</span></div></div>`;
  },

  /* ---------- Informe del equipo ---------- */
  equipo(cx) {
    const { activas, evaluadas } = TRI.sets(cx.personas), n = evaluadas.length, ev = cx.ev || {};
    const salidas = cx.personas.filter(p => TR.d(p).baja), noEv = activas.filter(p => TR.d(p).noEval);
    const conRiesgo = activas.filter(p => { const e = TR.d(p); return !e.noEval && e.riesgo && e.impacto; });
    const crit = conRiesgo.filter(p => { const e = TR.d(p); return TRC.riesgoCod(e.riesgo, e.impacto) === "A2"; });
    const planes = []; activas.forEach(p => { const e = TR.d(p); if (e.noEval) return; ["A", "B"].forEach(k => { if (e["obj" + k] || e["acc" + k]) planes.push({ p, k, e }); }); });
    const criticos = activas.filter(p => { const e = TR.d(p); return !e.noEval && TR.necesitaSucesor(e, p, cx.amb); });
    const sinSuc = criticos.filter(p => TR.d(p).sucExiste !== "Sí");
    const cuenta = fn => { const c = {}; evaluadas.forEach(p => fn(TR.d(p)).forEach(x => { if (x) c[x] = (c[x] || 0) + 1; })); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
    const fort = cuenta(e => [e.star, ...(e.str || [])]).map(([k, v]) => [k, v, "g"]), mej = cuenta(e => e.imp || []).map(([k, v]) => [k, v, "b"]);
    const cifra = (v, t, s) => `<div class="tr-cifra"><b>${v}</b><span>${t}</span><small>${s}</small></div>`;
    const pill = v => (v ? `<span class="tr-tag ${v === "Alto" ? "bad" : v === "Medio" ? "mid" : "ok"}">${esc(v)}</span>` : "—");
    let h = `<article class="tr-inf"><header class="tr-card tr-pad tr-inf-h"><span class="tr-eyebrow">Informe del equipo · ${esc(cx.ciclo.nombre || "Talent Review " + cx.ciclo.anio)}</span>
      <h2>Equipo de ${esc(ev.nombre || "—")}</h2>
      <p class="hint">${esc([ev.unidad, `${activas.length} ${activas.length === 1 ? "persona" : "personas"}`, ev.entregado ? `enviado el ${trFecha(ev.entregado)}` : "todavía no enviado a RR.HH."].filter(Boolean).join(" · "))}</p></header>`;
    if (!n) return h + `<p class="empty">Todavía no hay ninguna persona valorada en este equipo.</p></article>`;
    h += `<div class="tr-cifras">${cifra(`${n}<small> / ${activas.length}</small>`, "Personas valoradas", noEv.length ? `${noEv.length} no evaluable${noEv.length === 1 ? "" : "s"} este ciclo` : "todo el equipo activo")}
      ${cifra(TRI.pct(evaluadas.filter(p => TR.d(p).perf >= 8).length, n) + "%", "Desempeño alto", "banda 8-10")}
      ${cifra(TRI.pct(evaluadas.filter(p => TR.d(p).pot >= 8).length, n) + "%", "Potencial alto", "banda 8-10")}
      ${cifra(crit.length, "Retención crítica", "riesgo e impacto de salida altos")}</div>`;
    h += `<div class="tr-g2 tr-inf-2"><section class="tr-card tr-pad"><div class="tr-ch"><h3>9-Box del equipo</h3><span class="hint">cada casilla indica qué hacer</span></div>${TRI.nueve(cx, evaluadas)}</section>
      <section class="tr-card tr-pad"><div class="tr-ch"><h3>Riesgo de salida × impacto</h3><span class="hint">A2 = zona crítica</span></div>${TRI.riesgo(cx, conRiesgo)}</section></div>`;
    h += `<div class="tr-g2 tr-inf-2"><section class="tr-card tr-pad"><div class="tr-ch"><h3>Fortalezas</h3><span class="hint">estrella + punto fuerte</span></div>${TRI.barras(fort.slice(0, 6))}</section>
      <section class="tr-card tr-pad"><div class="tr-ch"><h3>Áreas de mejora</h3><span class="hint">de más a menos</span></div>${TRI.barras(mej.slice(0, 6))}</section></div>`;
    h += `<section class="tr-card tr-pad"><div class="tr-ch"><h3>Resumen por persona</h3><span class="hint">${cx.ver ? "pulsa «ver» para el informe detallado" : ""}</span></div>
      <div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th class="n">Desemp.</th><th class="n">Pot.</th><th>9-Box</th><th>Riesgo</th><th>Impacto</th><th>Siguiente paso</th><th>Plan principal</th><th></th></tr></thead><tbody>
      ${activas.map(p => { const e = TR.d(p), si = TRC.segIdx(e.perf, e.pot);
        if (e.noEval) return `<tr><td><b>${esc(p.nombre)}</b><small>${esc(p.puesto || "")}</small></td><td colspan="7" class="hint">No evaluable: ${esc(e.noEvalWhy || "sin motivo")}</td><td>${TRI.verBtn(cx, p)}</td></tr>`;
        return `<tr><td><b>${esc(p.nombre)}</b><small>${esc(p.puesto || "")}${p.manual ? " · alta manual" : ""}</small></td><td class="n">${e.perf || "—"}</td><td class="n">${e.pot || "—"}</td>
          <td>${si >= 0 ? esc(TRC.SEG[si][0]) : "—"}</td><td>${pill(e.riesgo)}</td><td>${pill(e.impacto)}</td><td>${esc(e.promo || "—")}</td>
          <td>${e.accA ? `${esc(e.accA)}<small>${esc([e.timA, e.priA && "prioridad " + e.priA.toLowerCase()].filter(Boolean).join(" · "))}</small>` : "—"}</td><td>${TRI.verBtn(cx, p)}</td></tr>`; }).join("")}</tbody></table></div></section>`;
    if (crit.length) h += `<section class="tr-card tr-pad tr-inf-alerta"><h3>Prioridad de retención · acción a 90 días</h3><div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Acción de retención</th></tr></thead><tbody>
      ${crit.map(p => { const e = TR.d(p); return `<tr><td>${esc(p.nombre)}</td><td>${e.retencion ? esc(e.retencion) : `<b class="tr-rojo">SIN ACCIÓN</b>`}</td></tr>`; }).join("")}</tbody></table></div></section>`;
    h += `<section class="tr-card tr-pad"><div class="tr-ch"><h3>Planes de desarrollo</h3><span class="hint">${planes.length} ${planes.length === 1 ? "plan" : "planes"} · ${planes.filter(x => x.e["pri" + x.k] === "Alta").length} de prioridad alta · ${planes.filter(x => x.e["bud" + x.k] === "Requiere presupuesto").length} con presupuesto</span></div>
      ${planes.length ? `<div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Objetivo</th><th>Acción</th><th>Plazo</th><th>Prioridad</th><th>Presupuesto</th><th>Qué será distinto</th></tr></thead><tbody>
      ${planes.map(({ p, k, e }) => `<tr><td>${esc(p.nombre)} <small>${k === "A" ? "principal" : "secundario"}</small></td><td>${esc(e["obj" + k] || "—")}</td><td>${esc(e["acc" + k] || "—")}</td><td>${esc(e["tim" + k] || "—")}</td>
        <td>${e["pri" + k] ? `<span class="tr-tag ${e["pri" + k] === "Alta" ? "bad" : e["pri" + k] === "Media" ? "mid" : "ok"}">${esc(e["pri" + k])}</span>` : "—"}</td><td>${e["bud" + k] === "Requiere presupuesto" ? "Sí" : "—"}</td><td>${esc(e["res" + k] || "")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="hint">Sin planes registrados.</p>`}</section>`;
    if (criticos.length) h += `<section class="tr-card tr-pad"><div class="tr-ch"><h3>Puestos críticos y sucesión</h3><span class="hint">${sinSuc.length} sin sucesor de ${criticos.length}</span></div>
      <div class="tablewrap"><table class="tr-t"><thead><tr><th>Persona</th><th>Puesto</th><th>¿Sucesor/a?</th><th>Quién</th><th>Readiness</th></tr></thead><tbody>
      ${criticos.map(p => { const e = TR.d(p); return `<tr><td>${esc(p.nombre)}</td><td>${esc(p.puesto || "—")}</td><td><span class="tr-tag ${e.sucExiste === "Sí" ? "ok" : "bad"}">${e.sucExiste === "Sí" ? "Sí" : "No"}</span></td><td>${esc(e.sucQuien || "—")}</td><td>${esc(e.sucRdy || "—")}</td></tr>`; }).join("")}</tbody></table></div></section>`;
    if (salidas.length) h += `<section class="tr-card tr-pad"><h3>Salidas comunicadas</h3><ul class="tr-ul">${salidas.map(p => { const e = TR.d(p); return `<li><b>${esc(p.nombre)}</b> · ${esc(e.bajaFecha || "")}${e.bajaMotivo ? " · " + esc(e.bajaMotivo) : ""}</li>`; }).join("")}</ul></section>`;
    return h + `<p class="tr-foot">${esc(cx.ciclo.nombre || "")} · Equipo de ${esc(ev.nombre || "")} · Confidencial</p></article>`;
  },

  /* ---------- Informe detallado de una persona (ficha ejecutiva) ---------- */
  persona(cx, p) {
    const e = TR.d(p), si = TRC.segIdx(e.perf, e.pot), c = cx.ciclo;
    const nota = (t, v, esc5) => `<div class="tr-snap"><span class="tr-eyebrow">${t}</span><b>${v || "—"}</b><em class="tr-tag ${["", "bad", "mid", "ok"][TRC.band(v)] || ""}">Banda ${["", "baja", "media", "alta"][TRC.band(v)] || "—"}</em>${v && esc5[v] ? `<small>${esc(esc5[v][0])}</small>` : ""}<div class="tr-bar"><i style="width:${(v || 0) * 10}%"></i></div></div>`;
    const fila = (k, v) => (v ? `<tr><th>${k}</th><td>${esc(v)}</td></tr>` : "");
    const pill = v => `<span class="tr-tag ${v === "Alto" ? "bad" : v === "Medio" ? "mid" : "ok"}">${esc(v || "—")}</span>`;
    const plan = k => (e["obj" + k] || e["acc" + k] ? `<div class="tr-plan"><b>${k === "A" ? "Plan principal" : "Plan secundario"}</b><p>${esc(e["obj" + k])} · ${esc(e["acc" + k])}${e["tim" + k] ? " · " + esc(e["tim" + k]) : ""} <span class="tr-tag">${esc("Prioridad " + (e["pri" + k] || "—"))}</span>${e["bud" + k] === "Requiere presupuesto" ? ` <span class="tr-tag mid">Requiere presupuesto</span>` : ""}</p>${e["res" + k] ? `<div class="tr-key">¿Qué será distinto? ${esc(e["res" + k])}</div>` : ""}</div>` : "");
    return `<article class="tr-card tr-doc tr-inf-p"><span class="tr-eyebrow">Informe de talento · ${esc(c.nombre || "Talent Review " + c.anio)}</span><h2>${esc(p.nombre)}</h2><p class="hint">${esc([p.puesto, p.departamento, p.categoria].filter(Boolean).join(" · "))}</p>
      <p>${p.manual ? `<span class="tr-tag mid">Alta manual</span> ` : ""}${e.baja ? `<span class="tr-tag">Salida · ${esc(e.bajaFecha || "")}</span> ` : ""}${e.noEval ? `<span class="tr-tag">No evaluable: ${esc(e.noEvalWhy)}</span>` : ""}</p>
      <div class="tr-meta"><span><small>Responsable</small>${esc(cx.mgr(p))}</span><span><small>ID</small>${esc(p.id_empleado || "—")}</span><span><small>¿Hablado con la persona?</small>${esc(e.talked || "—")}${e.talkedDate ? " · " + esc(e.talkedDate) : ""}</span></div>
      ${e.baja ? `<p>Salida comunicada el ${esc(e.bajaFecha || "")}. ${esc(e.bajaMotivo || "")}</p>` : ""}
      ${e.noEval ? `<p>No evaluable en este ciclo. Motivo: ${esc(e.noEvalWhy)}.</p>` : `
      <div class="tr-snaps"><div class="tr-snap seg"><span class="tr-eyebrow">Posición 9-Box</span><b>${si >= 0 ? esc(TRC.SEG[si][0]) : "—"}</b><small>Recomendación: ${si >= 0 ? esc(TRC.SEG[si][1]) : "—"}</small></div>${nota("Desempeño", e.perf, TRC.PERF)}${nota("Potencial", e.pot, TRC.POT)}</div>
      <h4>Evidencias</h4><table class="tr-ft">${fila("Evidencias de desempeño", e.evP)}${fila("Qué le distingue (desempeño)", e.justP)}${fila("Evidencias de potencial", e.evO)}${fila("Qué le distingue (potencial)", e.justO)}</table>
      <h4>Competencias</h4><p>${e.star ? `<span class="tr-tag mid">★ ${esc(e.star)}</span> ` : ""}${(e.str || []).map(x => `<span class="tr-tag ok">${esc(x)}</span>`).join(" ")} ${(e.imp || []).map(x => `<span class="tr-tag bad">${esc(x)}</span>`).join(" ")}</p>
      <p class="hint">Verde: puntos fuertes · rojo: áreas de mejora · ★ competencia estrella.</p>
      <h4>Riesgo y retención</h4><p>Riesgo ${pill(e.riesgo)} · Impacto ${pill(e.impacto)} · Criticidad del puesto ${pill(e.critRole)}${e.riesgo && e.impacto ? ` · casilla <b>${esc(TRC.riesgoCod(e.riesgo, e.impacto))}</b>` : ""}</p>${e.retencion ? `<p><b>Acción de retención:</b> ${esc(e.retencion)}</p>` : ""}
      <h4>Trayectoria y aspiraciones</h4><table class="tr-ft">${fila("Promoción / movimiento", e.promo)}${fila("Promoción a", [e.promoPos, e.promoRdy].filter(Boolean).join(" · "))}${fila("Movimiento horizontal a", [e.horizPos, e.horizRdy].filter(Boolean).join(" · "))}${fila("Ambición", e.ambicion)}${fila("Preferencia de carrera", e.carrera)}</table>
      ${TR.necesitaSucesor(e, p, cx.amb) ? `<h4>Sucesión del puesto</h4><p>${esc(e.sucExiste === "Sí" ? `Sí · ${e.sucQuien || ""}${e.sucRdy ? " · " + e.sucRdy : ""}` : "Sin sucesor identificado")}</p>` : ""}
      <h4>Plan de desarrollo</h4>${plan("A") + plan("B") || "<p>Sin plan.</p>"}
      ${e.note ? `<h4>Contexto para RR.HH.</h4><p>${esc(e.note)}</p>` : ""}`}
      <p class="tr-foot">${esc(c.nombre || "")} · Confidencial</p></article>`;
  },
  /* Impresión: siempre en tema claro y con los colores de las casillas */
  imprimir(html) { trImprimir(`<div class="tr tr-impr">${html}</div>`); }
};
