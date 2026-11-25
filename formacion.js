"use strict";
/* ===================== FORMACIONES =====================
   Catálogo de formaciones: cada curso es un recorrido por paradas con un
   test final. El de IA tiene su propio reproductor (ia.js); el resto viven
   en cursos.js.
   ======================================================= */

/* Desde la 0.28 el bloque es «Formación de IA»: los cursos de tienda siguen
   en el código (las campañas antiguas los necesitan), marcados como
   ocultos. Para volver a enseñarlos basta con quitar «oculto». */
const CURSOS = [
  { id: "ia", t: "Inteligencia artificial en el trabajo", estado: "activo", min: 60, ia: true,
    d: "El Reglamento europeo de IA para el día a día: qué está prohibido, qué hay que avisar y qué cambia en el empleo. Nueve módulos y examen final.",
    quien: "Toda la plantilla" },
  { id: "kpis", oculto: true, t: "KPIs Retail", estado: "activo", min: 20,
    d: "Conversión, ticket medio, unidades por ticket, margen y productividad: qué mide cada uno y qué hacer cuando bajan.", quien: "SM y ASM" },
  { id: "visual", oculto: true, t: "Visual Merchandising", estado: "activo", min: 20,
    d: "Recorrido del cliente, escaparate según el plan comercial, lineal, precio y la rutina diaria de diez minutos.", quien: "Todo el equipo" },
  { id: "pyl", oculto: true, t: "P&L", estado: "activo", min: 25,
    d: "La cuenta de resultados de una tienda: qué líneas dependen de ti, cuáles no, y cómo leerla cada mes.", quien: "SM" },
  { id: "equipos", oculto: true, t: "Gestión de equipos", estado: "activo", min: 25,
    d: "Horarios, feedback, reconocimiento, conversaciones difíciles y la acogida de quien entra.", quien: "SM y ASM" }
];
function cursoDe(id) { return CURSOS.find(c => c.id === id); }
const cursosVisibles = () => CURSOS.filter(c => !c.oculto);
function pasosDe(id) { return ((typeof CURSOS_CONTENIDO !== "undefined" && CURSOS_CONTENIDO[id]) || {}).pasos || []; }
function testDe(id) { return ((typeof CURSOS_CONTENIDO !== "undefined" && CURSOS_CONTENIDO[id]) || {}).test || null; }

/* ---------------- Progreso ---------------- */
function claveProgreso() { return "sc-formacion-" + (S.me ? S.me.id : "anon"); }
function progreso() {
  try { return JSON.parse(localStorage.getItem(claveProgreso())) || {}; } catch (e) { return {}; }
}
function guardarProgreso(p) { try { localStorage.setItem(claveProgreso(), JSON.stringify(p)); } catch (e) {} }
/* El progreso se guarda por curso, con la misma clave que su id. */
function progresoCurso(id) { return progreso()[id || S.curso] || {}; }
function vistos(id) { return progresoCurso(id).vistos || []; }
function marcarVisto(paso) {
  const cid = S.curso, p = progreso(); p[cid] = p[cid] || { vistos: [] };
  p[cid].vistos = p[cid].vistos || [];
  if (!p[cid].vistos.includes(paso)) p[cid].vistos.push(paso);
  p[cid].ultimo = paso;
  if (p[cid].vistos.length === pasosDe(cid).length && !p[cid].completado) {
    p[cid].completado = new Date().toISOString();
    log("Formación completada: " + cursoDe(cid).t);
  }
  guardarProgreso(p);
}
function cursosCompletados() { return cursosVisibles().filter(c => progresoCurso(c.id).completado).length; }

/* ---------------- Catálogo ---------------- */
function pintarFormaciones() {
  if (S.curso) return pintarCurso();
  const pie = c => {
    const p = progresoCurso(c.id), v = (p.vistos || []).length, n = pasosDe(c.id).length;
    const extra = [];
    if (p.test) extra.push(`test ${p.test.aciertos} de ${p.test.total}`);
    const base = p.completado ? "Completada el " + fechaES(p.completado) : (v ? `${v} de ${n} pasos vistos` : "Sin empezar");
    return [base].concat(extra).join(" · ");
  };
  const hechos = cursosCompletados();
  $("vista").innerHTML = `<div class="page">
    <div class="page-h"><h1>Formación de IA</h1><span class="muted num">${hechos} de ${cursosVisibles().length} completadas</span></div>
    <p class="lead">Ábrelo para verlo como lo verá la plantilla. Para que lo haga alguien, envíale un código desde «Enviar»: entra sin usuario y su nota llega a Seguimiento.</p>
    <div class="cards">${cursosVisibles().map(c => { if (c.ia) { const p = typeof iaProg === "function" ? (iaModo = "int", iaProg()) : { hechos: [] };
      return `<button class="mod curso-card" data-action="abrirCurso" data-c="${c.id}"><span class="mod-t">${esc(c.t)}</span><span class="mod-d">${esc(c.d)}</span>
        <span class="curso-meta">${esc(c.quien)} · unos ${c.min} min · 9 módulos + 4 opcionales + examen</span><span class="mod-f">${p.hechos.length ? `${p.hechos.length} módulos vistos en tu vista previa` : "Sin empezar"}</span></button>`; }
      const p = progresoCurso(c.id), n = pasosDe(c.id).length, v = (p.vistos || []).length;
      return `<button class="mod curso-card ${p.completado ? "hecho" : ""}" data-action="abrirCurso" data-c="${c.id}">
      <span class="mod-t">${esc(c.t)}${p.completado ? `<span class="badge ok">Completada</span>` : ""}</span>
      <span class="mod-d">${esc(c.d)}</span>
      <span class="curso-meta">${esc(c.quien)} · ${c.min} min · ${n} paradas${testDe(c.id) ? " + test" : " + práctica con IA"}</span>
      <i class="prog mini" aria-hidden="true"><span style="width:${n ? Math.round(v / n * 100) : 0}%"></span></i>
      <span class="mod-f">${esc(pie(c))}</span></button>`; }).join("")}</div></div>`;
}

/* ---------------- Un curso: recorrido por paradas ---------------- */
function pintarCurso() {
  if (S.chuleta) return pintarChuleta();
  if (S.vista === "test") return pintarTest();
  if (S.curso === "ia" && typeof pintarIA === "function") return pintarIA();
  const curso = cursoDe(S.curso), PASOS = pasosDe(S.curso), vis = vistos();
  if (!curso || !PASOS.length) { S.curso = null; return pintarFormaciones(); }
  const i = Math.max(0, PASOS.findIndex(p => p.id === S.paso));
  const p = PASOS[i], ult = i === PASOS.length - 1;
  const prog = progresoCurso(), test = testDe(S.curso);
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverCursos">← Formaciones</button>
      <h1>${esc(curso.t)}</h1></div>
      <div class="curso-acc">
        ${test ? `<button class="btn small" data-action="irTest">Hacer el test</button>` : ""}
        <button class="btn small" data-action="chuleta">Ver la chuleta</button>
        <button class="btn small ghost" data-action="imprimirCurso">Imprimir</button></div></div>

    <div class="ruta" style="--n:${PASOS.length}">
      <div class="ruta-linea"><i style="width:${Math.round(vis.length / PASOS.length * 100)}%"></i></div>
      ${PASOS.map((x, k) => `<button class="parada ${x.id === p.id ? "on" : ""} ${vis.includes(x.id) ? "hecha" : ""}" data-action="irPaso" data-p="${x.id}">
        <span class="bolita">${vis.includes(x.id) ? "✓" : k + 1}</span><span class="parada-t">${esc(x.t)}</span></button>`).join("")}
    </div>

    <section class="card paso">
      <div class="paso-h"><span class="paso-n">${i + 1}</span><div><h2>${esc(p.t)}</h2><p class="muted">${esc(p.sub)} · ${p.min} min</p></div>
        <span class="paso-est ${vis.includes(p.id) ? "ok" : ""}">${vis.includes(p.id) ? "Visto" : "Pendiente"}</span></div>
      <p class="idea">${esc(p.idea)}</p>

      <div class="bloques">
        <div class="bloque"><h3>Qué haces</h3><ul class="lista">${p.haces.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="bloque"><h3>Cuidado con</h3><ul class="lista cuidado">${p.ojo.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>

      <h3 class="tit-frases">Frases que ayudan</h3>
      <div class="frases">${p.dices.map((f, k) => `<blockquote class="frase"><span class="ctx">${esc(f.c)}</span>
        <p>${esc(f.f)}</p><button class="btn small ghost" data-action="copiarFrase" data-i="${i}" data-k="${k}">Copiar</button></blockquote>`).join("")}</div>


      ${ult && test ? `<div class="cta-rp"><div><b>Has llegado al final del curso.</b>
        <p class="hint">Cinco preguntas para comprobar que te lo llevas. Se pueden repetir las veces que quieras; queda la última.</p></div>
        <span><button class="btn primary" data-action="irTest">Hacer el test</button></span></div>` : ""}
      <div class="paso-nav">
        <button class="btn" data-action="pasoAnt" ${i === 0 ? "disabled" : ""}>Anterior</button>
        <span class="muted num">${vis.length} de ${PASOS.length} pasos</span>
        <button class="btn primary" data-action="pasoSig">${ult ? "Marcar y terminar" : "Lo tengo, siguiente"}</button>
      </div>
    </section>

    ${prog.completado ? `<section class="card fin"><h2>Formación completada</h2>
      <p class="hint">Terminada el ${fechaES(prog.completado)}.${prog.test ? ` Test: ${prog.test.aciertos} de ${prog.test.total} aciertos el ${fechaES(prog.test.fecha)}.` : ""} Puedes volver cuando quieras: la chuleta está pensada para repasar en dos minutos antes de abrir.</p>
      <div class="actions"><button class="btn" data-action="chuleta">Ver la chuleta</button>${test ? `<button class="btn" data-action="irTest">${prog.test ? "Repetir el test" : "Hacer el test"}</button>` : ""}<button class="btn ghost" data-action="reiniciarCurso">Empezar de nuevo</button></div></section>` : ""}
  </div>`;
}

/* ---------------- Test final ---------------- */
function testEstado() { S.test = S.test || { resp: {}, corregido: false }; return S.test; }
function pintarTest() {
  const curso = cursoDe(S.curso), test = testDe(S.curso), st = testEstado();
  if (!test) { S.vista = "recorrido"; return pintarCurso(); }
  const n = test.length, contestadas = test.filter((q, i) => typeof st.resp[i] === "number").length;
  const aciertos = test.filter((q, i) => st.resp[i] === q.r).length;
  const prog = progresoCurso();
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverRecorrido">← ${esc(curso.t)}</button>
      <h1>Comprueba lo aprendido</h1></div>
      ${prog.test ? `<span class="muted num">Último resultado: ${prog.test.aciertos} de ${prog.test.total}</span>` : ""}</div>
    ${st.corregido ? `<section class="card test-res ${aciertos >= 4 ? "ok" : ""}">
        <div class="nota-rp"><b class="num">${aciertos}</b><span class="hint">de ${n} aciertos</span></div>
        <p class="test-titular">${aciertos === n ? "Impecable. Te lo llevas entero." : aciertos >= 4 ? "Bien. Repasa la que has fallado y listo." : aciertos >= 3 ? "A medias: vuelve a las paradas que te han fallado antes de repetir." : "Vuelve al recorrido con calma y repite el test después."}</p>
        <div class="actions"><button class="btn" data-action="volverRecorrido">Volver al recorrido</button><button class="btn primary" data-action="testRepetir">Repetir el test</button></div>
      </section>` : ""}
    <div class="qlist test">${test.map((q, i) => {
      const v = st.resp[i], ok = st.corregido && v === q.r;
      return `<section class="q"><p class="qt"><span class="qn">${i + 1}</span>${esc(q.t)}</p>
        <div class="opts">${q.o.map((o, k) => `<button type="button" class="opt ${v === k ? "on" : ""} ${st.corregido ? (k === q.r ? "bien" : (v === k ? "mal" : "")) : ""}" data-action="testResp" data-q="${i}" data-v="${k}" ${st.corregido ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
        ${st.corregido ? `<p class="porque ${ok ? "ok" : ""}"><b>${ok ? "Correcto." : "La correcta era la " + (q.r + 1) + "."}</b> ${esc(q.por)}</p>` : ""}</section>`;
    }).join("")}</div>
    ${st.corregido ? "" : `<div class="guest-f"><span class="muted num">${contestadas} de ${n} respondidas</span>
      <button class="btn primary" data-action="testCorregir" ${contestadas === n ? "" : "disabled"}>Corregir</button></div>`}
  </div>`;
}

function pintarChuleta() {
  const curso = cursoDe(S.curso), PASOS = pasosDe(S.curso);
  $("vista").innerHTML = `<div class="page curso">
    <div class="page-h"><div><button class="btn small ghost" data-action="chuletaNo">← Volver al recorrido</button>
      <h1>${esc(curso.t)} en una pantalla</h1></div>
      <button class="btn small" data-action="imprimirCurso">Imprimir</button></div>
    <div class="chuleta">${PASOS.map((p, k) => `<section class="card"><div class="paso-h"><span class="paso-n">${k + 1}</span><div><h2>${esc(p.t)}</h2><p class="muted">${esc(p.sub)}</p></div></div>
      <ul class="lista">${p.haces.slice(0, 3).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <blockquote class="frase mini"><p>${esc(p.dices[0].f)}</p></blockquote></section>`).join("")}</div></div>`;
}

function informeCurso() {
  const curso = cursoDe(S.curso), PASOS = pasosDe(S.curso);
  return `<div class="pr-head">${logo(56)}<div><h1>${esc(curso.t)}</h1>
    <p class="meta">Pippole${S.me ? " · " + esc(S.me.nombre) : ""}</p></div></div>
    ${PASOS.map((p, k) => `<h2>${k + 1}. ${esc(p.t)} — ${esc(p.sub)}</h2>
      <p><b>${esc(p.idea)}</b></p>
      <p><b>Qué haces:</b></p><ul>${p.haces.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <p><b>Frases que ayudan:</b></p><ul>${p.dices.map(f => `<li><i>${esc(f.c)}:</i> ${esc(f.f)}</li>`).join("")}</ul>
      <p><b>Cuidado con:</b></p><ul>${p.ojo.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`).join("")}`;
}

const ACCIONES_FORMACION = {
  abrirCurso(b) {
    S.curso = b.dataset.c; const PASOS = pasosDe(S.curso);
    S.paso = progresoCurso().ultimo || (PASOS[0] || {}).id; S.chuleta = false; S.vista = "recorrido"; S.test = null;
  },
  volverCursos() { S.curso = null; S.chuleta = false; S.vista = "recorrido"; },
  irPaso(b) { S.paso = b.dataset.p; window.scrollTo(0, 0); },
  pasoAnt() { const P = pasosDe(S.curso), i = P.findIndex(x => x.id === S.paso); if (i > 0) S.paso = P[i - 1].id; window.scrollTo(0, 0); },
  pasoSig() {
    const P = pasosDe(S.curso), i = P.findIndex(x => x.id === S.paso);
    marcarVisto(S.paso);
    if (i < P.length - 1) { S.paso = P[i + 1].id; window.scrollTo(0, 0); }
    else toast("Formación completada");
  },
  chuleta() { S.chuleta = true; S.vista = "recorrido"; window.scrollTo(0, 0); },
  volverRecorrido() { S.vista = "recorrido"; },
  chuletaNo() { S.chuleta = false; },
  async reiniciarCurso() { if (!(await confirmar({ titulo: "Empezar de nuevo", texto: "Se borra tu progreso de esta formación.", ok: "Empezar de nuevo", peligro: true }))) return false; const p = progreso(); delete p[S.curso]; guardarProgreso(p); S.paso = (pasosDe(S.curso)[0] || {}).id; },
  copiarFrase(b) {
    const f = pasosDe(S.curso)[Number(b.dataset.i)].dices[Number(b.dataset.k)].f;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(f).then(() => toast("Frase copiada"), () => toast(f));
    else toast(f);
    return false;
  },
  imprimirCurso() { $("print").innerHTML = informeCurso(); window.print(); return false; },
  /* Test final */
  irTest() { S.vista = "test"; S.chuleta = false; S.test = { resp: {}, corregido: false }; window.scrollTo(0, 0); },
  testResp(b) { const st = testEstado(); if (st.corregido) return false; const q = Number(b.dataset.q), v = Number(b.dataset.v); st.resp[q] = st.resp[q] === v ? undefined : v; if (st.resp[q] === undefined) delete st.resp[q]; },
  testCorregir() {
    const st = testEstado(), test = testDe(S.curso);
    if (test.some((q, i) => typeof st.resp[i] !== "number")) { toast("Responde todas las preguntas antes de corregir."); return false; }
    st.corregido = true;
    const aciertos = test.filter((q, i) => st.resp[i] === q.r).length;
    const p = progreso(); p[S.curso] = p[S.curso] || { vistos: [] };
    p[S.curso].test = { aciertos, total: test.length, fecha: new Date().toISOString() };
    guardarProgreso(p);
    log(`Test de formación: ${cursoDe(S.curso).t} (${aciertos}/${test.length})`);
    window.scrollTo(0, 0);
  },
  testRepetir() { S.test = { resp: {}, corregido: false }; window.scrollTo(0, 0); }
};

/* ============ El curso visto por quien entra con un código ============
   Mismas pantallas que dentro de la plataforma, pero sin menú, sin guardar
   progreso en el navegador (el código solo sirve una vez) y terminando en el
   test. Reutiliza las clases del recorrido interno, así que se ve igual.
   ====================================================================== */
function pasoInvitado(pl) {
  const P = pasosDe(pl.curso), n = P.length;
  const i = Math.min(Math.max(0, INV.paso | 0), n - 1), p = P[i];
  if (!p) { INV.fase = "test"; return ""; }
  const curso = CURSOS.find(c => c.id === pl.curso) || { t: "" };
  return `<div class="guest wide"><div class="esquina"><span class="chipsimbolo">${simboloPippole(32)}</span></div>
    <div class="guest-card wide curso-inv">${selectorIdioma()}
      <div class="guest-h">${logo(56)}<div><h1>${esc(curso.t)}</h1>
        <p class="sub">${esc(INV.datos.tienda || "")}${INV.datos.destinatario ? " · " + esc(INV.datos.destinatario) : ""}</p></div></div>
      <div class="ruta-inv"><div class="ruta-linea"><i style="width:${Math.round((i + 1) / n * 100)}%"></i></div>
        <span class="muted">Pantalla ${i + 1} de ${n}</span></div>
      <section class="paso">
        <div class="paso-h"><span class="paso-n">${i + 1}</span><div><h2>${esc(p.t)}</h2>
          <p class="muted">${esc(p.sub)} · ${p.min} min</p></div></div>
        <p class="idea">${esc(p.idea)}</p>
        <div class="bloques">
          <div class="bloque"><h3>Qué haces</h3><ul class="lista">${p.haces.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
          <div class="bloque"><h3>Cuidado con</h3><ul class="lista cuidado">${p.ojo.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        </div>
        <h3 class="tit-frases">Frases que ayudan</h3>
        <div class="frases">${p.dices.map(f => `<blockquote class="frase"><span class="ctx">${esc(f.c)}</span><p>${esc(f.f)}</p></blockquote>`).join("")}</div>
      </section>
      <div class="guest-f">
        <button class="btn" data-action="invPasoAnt" ${i === 0 ? "disabled" : ""}>Anterior</button>
        <span class="muted num">${i + 1} / ${n}</span>
        <button class="btn primary" data-action="invPasoSig">${i === n - 1 ? "Ir al test" : "Siguiente"}</button>
      </div></div></div>`;
}
const ACCIONES_INV_CURSO = {
  invPasoAnt() { INV.paso = Math.max(0, (INV.paso | 0) - 1); window.scrollTo(0, 0); pintarInvitado(); return false; },
  invPasoSig() {
    const pl = SC.plantilla(INV.datos.plantilla), n = pasosDe(pl.curso).length;
    if ((INV.paso | 0) >= n - 1) INV.fase = "test"; else INV.paso = (INV.paso | 0) + 1;
    window.scrollTo(0, 0); pintarInvitado(); return false;
  },
  invVolverCurso() { INV.fase = "curso"; window.scrollTo(0, 0); pintarInvitado(); return false; }
};

/* ===================== FORMACIONES PARA GENTE SIN CUENTA =====================
   El equipo de tienda no tiene usuario en la plataforma. Para que puedan hacer
   una formación se usa el mismo circuito que la Encuesta de Clima: RR.HH. crea
   una campaña, genera un código por persona y se lo envía. Quien recibe el
   código lee el curso y hace el test; la nota vuelve aquí.

   El test de cada curso se convierte en una plantilla igual que las demás, así
   que todo lo que ya existe (puntuar, resultados por tienda, ficha de
   respuestas, borrar, enviar el correo) funciona sin tocar nada. La opción
   correcta vale 1 punto y las demás 0.
   ============================================================================ */
(function () {
  const C = SC.CONFIG;
  C.tiposPrueba.formacion = { t: { es: "Formación a tienda", en: "Store training", fr: "Formation magasin" } };
  CURSOS.forEach(curso => {
    const test = testDe(curso.id), pasos = pasosDe(curso.id);
    if (!test || !test.length) return;
    C.plantillas.push({
      id: "form-" + curso.id, tipo: "formacion", anonima: false, curso: curso.id,
      nombre: { es: "Formación: " + curso.t, en: "Training: " + curso.t, fr: "Formation : " + curso.t },
      intro: { es: `Primero lee las ${pasos.length} pantallas del curso y después contesta las ${test.length} preguntas. Puedes volver atrás cuando quieras.`,
               en: `First read the ${pasos.length} screens of the course, then answer the ${test.length} questions. You can go back at any time.`,
               fr: `Lisez d'abord les ${pasos.length} écrans du cours, puis répondez aux ${test.length} questions. Vous pouvez revenir en arrière.` },
      aviso: { es: `Se tarda unos ${curso.min} minutos. El código sirve una sola vez, así que termínalo de una sentada.`,
               en: `It takes about ${curso.min} minutes. The code works only once, so finish it in one go.`,
               fr: `Environ ${curso.min} minutes. Le code ne sert qu'une fois : terminez d'une traite.` },
      preguntas: test.map((q, k) => ({ id: "p" + (k + 1), t: q.t, por: q.por,
        o: q.o.map((op, j) => ({ t: op, v: j === q.r ? 1 : 0 })) }))
    });
  });
})();

if (typeof ACCIONES_INVITADO !== "undefined") Object.assign(ACCIONES_INVITADO, ACCIONES_INV_CURSO);

/* ===================== SEGUIMIENTO DE FORMACIONES =====================
   "Enviar a tienda" vive dentro de una campaña: enseña una formación y una
   tanda de códigos. Esto es lo contrario: todas las campañas a la vez, para
   responder a la pregunta que de verdad se hace en una reunión de RR.HH.,
   que es quién de la red ha hecho qué y quién no.
   ====================================================================== */
function campanasForm() { return (S.campanas || []).filter(c => c.tipo === "formacion"); }
/* Una formación de retail vale un año: lo que se hizo en una campaña de un
   año anterior cuenta como caducado y vuelve a aparecer como pendiente. */
function caducada(c) { return c.anio < SC.CONFIG.anio; }
function cursoDeCampana(c) { const pl = SC.plantilla(c.plantilla); return pl && pl.curso ? pl.curso : null; }
function filtroSeg() { return (S.fseg = S.fseg || { tienda: "", curso: "", estado: "" }); }

/* Un registro por persona y curso, con lo que haga falta para la tabla. */
function registrosForm() {
  const out = [];
  campanasForm().forEach(c => {
    const pl = SC.plantilla(c.plantilla); if (!pl) return;
    const curso = cursoDeCampana(c), nom = (cursoDe(curso) || {}).t || curso;
    (S.invitaciones || []).filter(i => i.campana_id === c.id).forEach(i => {
      const t = S.tiendas.find(x => x.id === i.tienda_id);
      if (!esAdmin() && !(t && t.rm_id === S.me.id)) return;
      const hecho = i.estado === "respondida", cad = hecho && caducada(c), umbral = pl.umbral || 0.6;
      const p = hecho ? SC.puntuar(pl, i.respuestas) : null;
      out.push({
        inv: i, campana: c, curso, cursoT: nom, tienda: t, plantilla: pl,
        persona: i.destinatario || "–", puesto: i.puesto || "", email: i.email || "",
        hecho, caducada: cad, anio: c.anio,
        apto: p ? p.pct >= umbral : null, nota: p, fecha: i.respondido || null, enviado: i.enviado || null,
        estado: cad ? "caducada" : hecho ? (p && p.pct >= umbral ? "apto" : "noapto") : i.enviado ? "enviado" : "sinenviar"
      });
    });
  });
  return out.sort((a, b) => (a.tienda ? a.tienda.nombre : "").localeCompare(b.tienda ? b.tienda.nombre : "") || a.persona.localeCompare(b.persona));
}
const ETIQ_SEG = { apto: "Superada", noapto: "No superada", caducada: "Caducada", enviado: "Enviado, sin hacer", sinenviar: "Sin enviar" };

function pintarSegForm() {
  const R = registrosForm(), f = filtroSeg();
  if (!R.length) {
    $("vista").innerHTML = `<div class="page"><h1>Seguimiento</h1>
      <div class="empty big"><p>Todavía no has enviado ninguna formación.</p>
      <p class="hint">Ve a <b>Enviar a tienda</b>, crea una campaña con el curso que quieras y genera los códigos. Aquí verás quién la ha hecho.</p></div></div>`;
    return;
  }
  const cursos = [...new Set(R.map(x => x.curso))];
  const tiendas = [...new Set(R.map(x => x.tienda && x.tienda.id).filter(Boolean))]
    .map(id => S.tiendas.find(t => t.id === id)).filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const vis = R.filter(x => (!f.tienda || (x.tienda && x.tienda.id === f.tienda))
    && (!f.curso || x.curso === f.curso) && (!f.estado || x.estado === f.estado));

  const hechos = R.filter(x => x.hecho && !x.caducada), aptos = R.filter(x => x.estado === "apto");
  const media = hechos.length ? hechos.reduce((s, x) => s + x.nota.pct, 0) / hechos.length : null;
  const pendientes = R.filter(x => !x.hecho);
  const caducadas = R.filter(x => x.caducada);

  let h = `<div class="page"><div class="page-h"><h1>Seguimiento</h1>
    <div class="page-h-b">${pendientes.filter(x => x.email).length ? `<button class="btn" data-action="recordarForm">Recordar a los ${pendientes.filter(x => x.email).length} pendientes</button>` : ""}
      <button class="btn" data-action="segCsv">Descargar CSV</button></div></div>

    <div class="kpis"><div><small>Formaciones hechas</small><b>${hechos.length} de ${R.length}</b><small>${SC.pct(hechos.length / R.length, 0)} de lo enviado</small></div>
      <div><small>Superadas</small><b>${aptos.length}</b><small>${hechos.length ? SC.pct(aptos.length / hechos.length, 0) + " de las hechas" : "–"}</small></div>
      <div><small>Nota media</small><b>${media == null ? "–" : SC.pct(media, 0)}</b><small>${(() => { const us = [...new Set(R.map(x => Math.round((x.plantilla.umbral || 0.6) * 100)))]; return us.length === 1 ? `se aprueba con el ${us[0]} %` : "cada curso tiene su nota de corte"; })()}</small></div>
      <div><small>${caducadas.length ? "Caducadas" : "Pendientes"}</small><b>${caducadas.length || pendientes.length}</b><small>${caducadas.length ? "hechas en " + (SC.CONFIG.anio - 1) + ": toca repetirlas" : pendientes.filter(x => !x.enviado).length + " sin enviar todavía"}</small></div></div>`;

  // Matriz tiendas x cursos: la foto que se mira en una reunión
  h += `<section class="card"><div class="card-h"><h2>Por tienda y curso</h2><span class="muted">hechas de enviadas</span></div>
    <div class="tablewrap"><table class="mini"><thead><tr><th>Tienda</th>${cursos.map(c => `<th class="n">${esc((cursoDe(c) || {}).t || c)}</th>`).join("")}<th class="n">Total</th></tr></thead><tbody>
    ${tiendas.map(t => {
      const suyos = R.filter(x => x.tienda && x.tienda.id === t.id);
      return `<tr><td>${esc(t.nombre)}</td>${cursos.map(c => {
        const xs = suyos.filter(x => x.curso === c);
        if (!xs.length) return `<td class="n muted">–</td>`;
        const n = xs.filter(x => x.hecho && !x.caducada).length;
        return `<td class="n"><span class="celda ${n === xs.length ? "ok" : n ? "medio" : "no"}">${n}/${xs.length}</span></td>`;
      }).join("")}<td class="n"><b>${suyos.filter(x => x.hecho && !x.caducada).length}/${suyos.length}</b></td></tr>`;
    }).join("")}</tbody></table></div></section>`;

  // Tabla de personas
  h += `<section class="card"><div class="card-h"><h2>Personas</h2><span class="muted">${vis.length} de ${R.length}</span></div>
    <div class="inline-form" style="border:0;margin:0 0 12px;padding:0">
      <label>Tienda<select data-seg="tienda"><option value="">Todas</option>${tiendas.map(t => `<option value="${t.id}" ${f.tienda === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></label>
      <label>Curso<select data-seg="curso"><option value="">Todos</option>${cursos.map(c => `<option value="${c}" ${f.curso === c ? "selected" : ""}>${esc((cursoDe(c) || {}).t || c)}</option>`).join("")}</select></label>
      <label>Estado<select data-seg="estado"><option value="">Todos</option>${Object.keys(ETIQ_SEG).map(k => `<option value="${k}" ${f.estado === k ? "selected" : ""}>${ETIQ_SEG[k]}</option>`).join("")}</select></label></div>
    ${vis.length ? `<div class="tablewrap"><table><thead><tr><th>Persona</th><th>Tienda</th><th>Formación</th><th>Estado</th><th class="n">Nota</th><th></th></tr></thead><tbody>
      ${vis.map(x => `<tr><td><b>${esc(x.persona)}</b>${x.puesto ? `<br><small>${esc(x.puesto)}</small>` : ""}${x.email ? `<br><small class="mail">${esc(x.email)}</small>` : ""}</td>
        <td>${esc(x.tienda ? x.tienda.nombre : "–")}</td>
        <td>${esc(x.cursoT)}<br><small class="muted">${esc(x.campana.titulo)}</small></td>
        <td><span class="st ${x.estado === "apto" ? "cerrado" : x.estado === "noapto" || x.estado === "caducada" ? "encurso" : "pendiente"}">${ETIQ_SEG[x.estado]}</span>
          ${x.caducada ? `<br><small class="muted">de ${x.anio}</small>` : ""}
          ${x.fecha ? `<br><small class="muted">${new Date(x.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</small>`
            : x.enviado ? `<br><small class="muted">enviado ${new Date(x.enviado).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</small>` : ""}</td>
        <td class="n">${x.nota ? `<b>${x.nota.obt} de ${x.nota.puntuables}</b>` : "–"}</td>
        <td class="n">${x.hecho ? `<button class="btn small ghost" data-action="verRespuestas" data-id="${x.inv.id}">Ver respuestas</button>`
          : x.email ? `<button class="btn small ghost" data-action="${typeof envioDirecto === "function" && envioDirecto() ? "enviarYa" : "enviarInv"}" data-id="${x.inv.id}">${x.enviado ? "Reenviar" : "Enviar"}</button>` : `<span class="muted">Sin correo</span>`}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">Nada con esos filtros.</p>`}</section></div>`;
  $("vista").innerHTML = h;
}

const ACCIONES_SEG = {
  segCsv() {
    const R = registrosForm();
    const filas = [["Tienda", "Persona", "Puesto", "Correo", "Formación", "Campaña", "Año", "Estado", "Aciertos", "Total", "Fecha"]]
      .concat(R.map(x => [x.tienda ? x.tienda.nombre : "", x.persona, x.puesto, x.email, x.cursoT, x.campana.titulo, x.anio,
        ETIQ_SEG[x.estado], x.nota ? x.nota.obt : "", x.nota ? x.nota.puntuables : "",
        x.fecha ? new Date(x.fecha).toLocaleDateString("es-ES") : ""]));
    const csv = "﻿" + filas.map(f => f.map(v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    log(`Exportación del seguimiento de formaciones (${R.length} registros)`);
    a.download = `formaciones-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    return false;
  },
  async recordarForm() {
    const pend = registrosForm().filter(x => !x.hecho && !x.caducada && x.email);
    if (!pend.length) { toast("No hay nadie pendiente con correo"); return false; }
    const directo = typeof envioDirecto === "function" && envioDirecto();
    const ok = await confirmar({ titulo: `Recordar a ${pend.length} ${pend.length === 1 ? "persona" : "personas"}`,
      ok: directo ? "Enviar ahora" : "Abrir el correo",
      texto: directo ? "Se les reenvía su código desde la dirección de la empresa. Son los que aún no han hecho su formación."
                     : "Se abrirá tu programa de correo con un mensaje por persona." });
    if (!ok) return false;
    if (!directo) {
      pend.forEach((x, k) => setTimeout(() => {
        const a = document.createElement("a");
        a.href = `mailto:${encodeURIComponent(x.email)}?subject=${encodeURIComponent(asuntoInvitacion(x.inv))}&body=${encodeURIComponent(mensajeInvitacion(x.inv))}`;
        document.body.appendChild(a); a.click(); a.remove();
      }, k * 700));
      return false;
    }
    toast("Enviando…");
    let bien = 0; const fallos = [];
    for (let i = 0; i < pend.length; i += LOTE) {
      try {
        const r = await enviarPorLaPlataforma(pend.slice(i, i + LOTE).map(x => x.inv.id));
        bien += r.enviados || 0;
        (r.resultados || []).filter(z => !z.ok).forEach(z => fallos.push(motivoLegible(z.motivo)));
      } catch (e) { fallos.push(e.message); break; }
    }
    log(`${bien} recordatorios de formación enviados`);
    await recargarPruebas(); pintar();
    if (fallos.length) avisar(`Enviados ${bien} de ${pend.length}.\n\nNo han salido:\n` + fallos.slice(0, 12).join("\n"));
    else toast(bien === 1 ? "1 recordatorio enviado" : bien + " recordatorios enviados");
    return false;
  }
};
if (typeof ACCIONES_FORMACION !== "undefined") Object.assign(ACCIONES_FORMACION, ACCIONES_SEG);
