"use strict";
/* ===================== FORMACIÓN DE IA · el curso =====================
   El curso de inteligencia artificial que viene de «Vigente», dentro de
   Pippole y con el mismo sistema de códigos que las encuestas:
   - RR.HH. lo envía desde Formación de IA → Enviar (campaña con códigos).
   - La persona entra con su código, hace los módulos y el examen final.
   - Cada módulo se cierra al acertar sus tres preguntas; si falla, ve las
     explicaciones y corrige. El examen se abre con los nueve módulos del
     Reglamento hechos. Se aprueba con 9 de 12.
   - Al enviar el examen, la nota llega a RR.HH. (Seguimiento) y la persona
     puede imprimir su certificado.
   El avance de los módulos se guarda en el dispositivo, por código, para
   que pueda dejarlo a medias y volver.
   ====================================================================== */
const IA_CURSO = "ia";
let iaModo = "int";           // "int": vista previa de RR.HH.; "inv": persona con código
const IA = { vista: "inicio", mod: 0, sel: {}, corr: {}, ex: {}, exRes: null };
const iaClave = () => "pp-ia-" + (iaModo === "inv" ? INV.codigo : "previa");
function iaProg() {
  try { return Object.assign({ hechos: [] }, JSON.parse(localStorage.getItem(iaClave()) || "{}")); } catch (e) { return { hechos: [] }; }
}
function iaGuardar(p) { try { localStorage.setItem(iaClave(), JSON.stringify(p)); } catch (e) { } }
const iaNucleo = () => IA_DATOS.modulos.map((m, i) => (m.itin === "nucleo" ? i : -1)).filter(i => i >= 0);
const iaExamenListo = p => iaNucleo().every(i => p.hechos.includes(i));
const iaPregunta = id => { const [i, j] = id.split("-").map(Number); return IA_DATOS.modulos[i].p[j]; };

/* Plantilla de la campaña: las 12 preguntas del examen. Así la nota se
   calcula y se sigue igual que en el resto de formaciones. */
(function () {
  if (typeof SC === "undefined" || typeof IA_DATOS === "undefined") return;
  const m = IA_DATOS.meta;
  SC.CONFIG.plantillas.push({
    id: "form-" + IA_CURSO, tipo: "formacion", anonima: false, curso: IA_CURSO, ia: true, umbral: m.aprobado / m.nExamen,
    nombre: { es: "Formación: Inteligencia artificial en el trabajo", en: "Training: Artificial intelligence at work", fr: "Formation : l'intelligence artificielle au travail" },
    intro: { es: `Nueve módulos sobre el Reglamento europeo de IA y un examen final de ${m.nExamen} preguntas. Se aprueba con ${m.aprobado}.`, en: "", fr: "" },
    aviso: { es: "Puedes dejarlo a medias y volver con el mismo código desde este dispositivo.", en: "", fr: "" },
    preguntas: IA_DATOS.examen.map((id, k) => { const q = iaPregunta(id); return { id: "e" + (k + 1), t: q.q, por: q.e, o: q.o.map((t, j) => ({ t, v: j === q.c ? 1 : 0 })) }; })
  });
})();

/* ---------- pintado ---------- */
function iaPintar(html) {
  if (iaModo === "inv") {
    $("app").innerHTML = `<div class="guest wide"><div class="guest-card wide ia">${html}</div></div>`;
  } else $("vista").innerHTML = `<div class="page ia">${html}</div>`;
  window.scrollTo(0, 0);
}
function iaRepintar() {
  if (IA.vista === "mod") return iaPintarModulo();
  if (IA.vista === "examen") return iaPintarExamen();
  return iaPintarInicio();
}
function pintarIA() { iaModo = "int"; iaRepintar(); }
function pintarIAInvitado() { iaModo = "inv"; iaRepintar(); }

function iaCabecera(volver) {
  const quien = iaModo === "inv" && INV.datos ? `${esc(INV.datos.destinatario || "")}` : "Vista previa de RR.HH. · el avance se guarda solo en este navegador";
  const atras = volver ? `<button class="btn small ghost" data-action="iaInicio">← El curso</button>` : (iaModo === "int" ? `<button class="btn small ghost" data-action="volverCursos">← Formaciones</button>` : "");
  return `<div class="ia-h">${atras}<span class="ia-eyebrow">Formación de IA · versión ${esc(IA_DATOS.meta.version)}</span><p class="muted">${quien}</p></div>`;
}
function iaPintarInicio() {
  const p = iaProg(), M = IA_DATOS.modulos, nuc = iaNucleo(), tra = M.map((m, i) => (m.itin === "trabajo" ? i : -1)).filter(i => i >= 0);
  const hechosNuc = nuc.filter(i => p.hechos.includes(i)).length, listo = iaExamenListo(p);
  const tarjeta = i => { const m = M[i], ok = p.hechos.includes(i);
    return `<button class="ia-mod${ok ? " ok" : ""}" data-action="iaAbrir" data-i="${i}"><span class="ia-ord">Módulo ${i + 1}</span><b>${esc(m.t)}</b><small>${esc(m.vig)}</small><span class="ia-pie">${ok ? "✓ Completado" : `${m.min} min`}</span></button>`; };
  const enviado = iaModo === "inv" && (INV.enviado || (INV.datos && INV.datos.estado === "respondida"));
  iaPintar(`${iaCabecera(false)}
    <h1>Inteligencia artificial en el trabajo</h1>
    <p class="ia-lead">El Reglamento europeo de IA explicado para el día a día: qué está prohibido, qué hay que avisar, qué cambia en el empleo y qué derechos tienes. Nueve módulos cortos, cada uno con tres preguntas, y un examen final.</p>
    <div class="ia-kpis"><div><b>${hechosNuc}/${nuc.length}</b><span>módulos del Reglamento</span></div><div><b>${tra.filter(i => p.hechos.includes(i)).length}/${tra.length}</b><span>IA en el trabajo · opcional</span></div>
      <div><b>${IA_DATOS.meta.aprobado}/${IA_DATOS.meta.nExamen}</b><span>para aprobar el examen</span></div></div>
    <div class="ia-bar"><i style="width:${Math.round(hechosNuc / nuc.length * 100)}%"></i></div>
    ${listo && !enviado ? `<div class="ia-siguiente"><div><b>Has completado los nueve módulos.</b><span>Ya puedes hacer el examen final.</span></div><button class="btn primary" data-action="iaExamen">Hacer el examen</button></div>` : ""}
    <h2>El Reglamento <small>obligatorio para el examen</small></h2><div class="ia-mods">${nuc.map(tarjeta).join("")}</div>
    <h2>IA en el trabajo <small>opcional: el comité, el derecho individual, igualdad y Portugal</small></h2><div class="ia-mods">${tra.map(tarjeta).join("")}</div>
    ${listo ? "" : `<p class="hint">El examen se abre al completar los nueve módulos del Reglamento.</p>`}
    <p class="ia-pie-v">Contenido verificado a ${esc(IA_DATOS.meta.verificado)}. Es formación general: no sustituye al asesoramiento jurídico.</p>`);
}
function iaPintarModulo() {
  const i = IA.mod, m = IA_DATOS.modulos[i], p = iaProg(), ok = p.hechos.includes(i), corr = IA.corr[i];
  const sig = IA_DATOS.modulos.findIndex((x, k) => k > i && x.itin === m.itin && !p.hechos.includes(k));
  iaPintar(`${iaCabecera(true)}
    <article class="ia-leccion"><span class="ia-eyebrow">Módulo ${i + 1} · ${m.itin === "trabajo" ? "IA en el trabajo" : "El Reglamento"}${ok ? " · completado" : ""} · ${m.min} min</span>
      <h1>${esc(m.t)}</h1><span class="ia-vig">${esc(m.vig)}</span>
      <div class="ia-cuerpo">${m.c}</div>
      <h3>Comprobación</h3>
      ${m.p.map((q, j) => { const el = (IA.sel[i] || {})[j], c = corr && corr[j];
        return `<fieldset class="ia-preg"><legend>${esc(q.q)}</legend>${q.o.map((t, k) => `<label class="ia-op${c ? (k === q.c ? " bien" : k === el ? " mal" : "") : ""}"><input type="radio" name="ia${i}-${j}" data-ia="${i}-${j}" value="${k}" ${el === k ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}
          ${c && el !== q.c ? `<p class="ia-expl"><b>Por qué</b>${esc(q.e)}</p>` : ""}</fieldset>`; }).join("")}
      <div id="iaRes">${corr ? (corr.todo ? `<div class="ia-ok"><b>Módulo completado.</b> 3 de 3.<div class="ia-btns">${sig >= 0 ? `<button class="btn primary" data-action="iaAbrir" data-i="${sig}">Siguiente módulo</button>` : iaExamenListo(p) && !(iaModo === "inv" && INV.enviado) ? `<button class="btn primary" data-action="iaExamen">Ir al examen</button>` : ""}<button class="btn" data-action="iaInicio">Volver al curso</button></div></div>`
        : `<div class="ia-ko"><b>${corr.aciertos} de 3.</b> Hay que acertar las tres. Lee las explicaciones y corrige.</div>`) : ""}</div>
      <div class="ia-btns"><button class="btn primary" data-action="iaCorregir">Corregir</button></div>
    </article>`);
}
function iaPintarExamen() {
  const ids = IA_DATOS.examen, r = IA.exRes, n = Object.keys(IA.ex).length;
  iaPintar(`${iaCabecera(true)}
    <h1>Examen final</h1><p class="ia-lead">${ids.length} preguntas sobre los nueve módulos del Reglamento. Se aprueba con ${IA_DATOS.meta.aprobado}. ${iaModo === "inv" ? "Al enviarlo, la nota llega a RR.HH." : "Vista previa: no se envía a nadie."}</p>
    ${ids.map((id, k) => { const q = iaPregunta(id), el = IA.ex[k];
      return `<fieldset class="ia-preg"><legend><span class="ia-n">${k + 1}</span>${esc(q.q)}</legend>${q.o.map((t, j) => `<label class="ia-op${r ? (j === q.c ? " bien" : j === el ? " mal" : "") : ""}"><input type="radio" name="iaex${k}" data-iaex="${k}" value="${j}" ${el === j ? "checked" : ""} ${r ? "disabled" : ""}><span>${esc(t)}</span></label>`).join("")}
        ${r && el !== q.c ? `<p class="ia-expl"><b>Por qué</b>${esc(q.e)}</p>` : ""}</fieldset>`; }).join("")}
    ${r ? `<div class="${r.ok ? "ia-ok" : "ia-ko"}"><b>${r.aciertos} de ${ids.length}.</b> ${r.ok ? "Aprobado." : `Hacen falta ${IA_DATOS.meta.aprobado}. Repasa los módulos y vuelve a intentarlo.`}<div class="ia-btns">${r.ok ? `<button class="btn primary" data-action="iaCertificado">Ver el certificado</button>` : `<button class="btn primary" data-action="iaReintentar">Volver a intentarlo</button>`}</div></div>`
      : `<div class="ia-btns"><span class="muted num">${n} de ${ids.length} contestadas</span><button class="btn primary" data-action="iaEnviarExamen" ${n === ids.length ? "" : "disabled"}>${iaModo === "inv" ? "Enviar el examen" : "Corregir"}</button></div>`}`);
}
/* Certificado imprimible. El código de verificación es el de la invitación:
   RR.HH. lo encuentra en Seguimiento. */
function iaCertificadoHtml(nombre, aciertos, fecha, codigo) {
  return `<section class="ia-cert"><div class="ia-cert-in">${simboloPippole(54)}<span class="ia-eyebrow">Certificado de formación</span>
    <h1>${esc(nombre || "—")}</h1><p>ha completado la formación</p><h2>Inteligencia artificial en el trabajo</h2>
    <p>Reglamento (UE) 2024/1689 de inteligencia artificial: nueve módulos y examen final superado con <b>${aciertos} de ${IA_DATOS.meta.nExamen}</b>.</p>
    <p class="ia-cert-pie">${esc(fecha)} · Contenido versión ${esc(IA_DATOS.meta.version)}${codigo ? ` · Código ${esc(codigo)}` : ""}</p></div></section>`;
}
function iaImprimirCertificado(nombre, aciertos, codigo) {
  if (typeof trImprimir === "function") trImprimir(iaCertificadoHtml(nombre, aciertos, new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }), codigo));
}

/* ---------- acciones (se repintan solas) ---------- */
const ACCIONES_IA = {
  iaInicio() { IA.vista = "inicio"; iaRepintar(); return false; },
  iaAbrir(b) { IA.vista = "mod"; IA.mod = +b.dataset.i; iaRepintar(); return false; },
  iaCorregir() {
    const i = IA.mod, m = IA_DATOS.modulos[i], s = IA.sel[i] || {};
    if (m.p.some((q, j) => s[j] == null)) { const r = $("iaRes"); if (r) r.innerHTML = `<div class="ia-ko">Faltan respuestas.</div>`; return false; }
    const aciertos = m.p.filter((q, j) => s[j] === q.c).length, todo = aciertos === m.p.length;
    IA.corr[i] = Object.assign({ aciertos, todo }, Object.fromEntries(m.p.map((q, j) => [j, true])));
    if (todo) { const p = iaProg(); if (!p.hechos.includes(i)) { p.hechos.push(i); iaGuardar(p); } }
    iaRepintar(); const r = $("iaRes"); if (r) r.scrollIntoView({ block: "center" });
    return false;
  },
  iaExamen() { if (!iaExamenListo(iaProg())) return false; IA.vista = "examen"; IA.exRes = null; iaRepintar(); return false; },
  iaReintentar() { IA.ex = {}; IA.exRes = null; iaRepintar(); return false; },
  async iaEnviarExamen() {
    const ids = IA_DATOS.examen; if (Object.keys(IA.ex).length < ids.length) return false;
    const aciertos = ids.filter((id, k) => IA.ex[k] === iaPregunta(id).c).length;
    if (iaModo === "inv") {
      INV.respuestas = Object.fromEntries(ids.map((id, k) => ["e" + (k + 1), IA.ex[k]]));
      await ACCIONES_INVITADO.invEnviar();       // la pantalla de resultado la pinta pruebas.js
      return false;
    }
    IA.exRes = { aciertos, ok: aciertos >= IA_DATOS.meta.aprobado }; iaRepintar(); return false;
  },
  iaCertificado() { iaImprimirCertificado("Vista previa", IA.exRes ? IA.exRes.aciertos : 0, ""); return false; },
  iaCertInv() {
    const pl = SC.plantilla("form-" + IA_CURSO), n = SC.puntuar(pl, INV.respuestas);
    iaImprimirCertificado((INV.datos || {}).destinatario, n.obt, INV.codigo); return false;
  }
};
document.addEventListener("change", ev => {
  const t = ev.target;
  if (t.dataset.ia) { const [i, j] = t.dataset.ia.split("-").map(Number); IA.sel[i] = IA.sel[i] || {}; IA.sel[i][j] = +t.value; if (IA.corr[i]) { delete IA.corr[i]; iaRepintar(); } }
  else if (t.dataset.iaex != null && t.dataset.iaex !== undefined) {
    IA.ex[+t.dataset.iaex] = +t.value;
    const b = document.querySelector('[data-action="iaEnviarExamen"]'), n = Object.keys(IA.ex).length;
    if (b) b.disabled = n < IA_DATOS.examen.length;
    const c = document.querySelector(".ia-btns .num"); if (c) c.textContent = `${n} de ${IA_DATOS.examen.length} contestadas`;
  }
});
if (typeof ACCIONES_INVITADO !== "undefined") Object.assign(ACCIONES_INVITADO, ACCIONES_IA);
