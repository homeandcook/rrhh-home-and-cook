"use strict";
/* ===================== ENVÍOS: a muchas personas a la vez =====================
   Se apoya en lo que ya hay: el equipo de cada tienda (Usuarios y tiendas),
   las invitaciones con código y la función de correo enviar-invitacion.

   Tres alcances, como pidió RR.HH.: todas las tiendas, las tiendas que se
   marquen, o persona a persona (lo de siempre, más abajo en la campaña).

   - Encuesta con nombre, formación o prueba: crea los códigos que falten
     (uno por persona con correo) y envía los que aún no han salido.
   - Encuesta anónima: crea códigos SIN nombre ni correo y se los envía a
     cada persona. La plataforma no guarda qué dirección recibió cada código:
     la pareja solo existe en memoria durante el envío. Para no repetir,
     este navegador recuerda a qué direcciones ya se ha enviado (no qué
     código). Los recordatorios son generales y sin código.

   La función manda hasta 100 correos por llamada. El plan gratuito del
   proveedor permite 100 al día: si se llega al tope, lo que falta se queda
   pendiente y se envía otro día con el mismo botón.
   ============================================================================ */
const LOTE = 100;
const LIMITE_GRATIS = 100;

/* Datos de la plantilla para el texto del correo (duración, preguntas…) */
function infoCampana(c) {
  const pl = SC.plantilla(c.plantilla) || {}, n = (pl.preguntas || []).length;
  const curso = pl.curso && typeof cursoDe === "function" ? cursoDe(pl.curso) : null;
  const aviso = SC.txt(pl.aviso || "") || "";
  const m = aviso.match(/(\d+)\s*minutos/);
  const min = pl.min || (curso && curso.min) || (m ? +m[1] : /dos minutos/i.test(aviso) ? 2 : Math.max(2, Math.round(n * 0.35)));
  return { min, n: pl.ia ? (typeof IA_DATOS !== "undefined" ? IA_DATOS.modulos.length : n) : n, umbral: pl.umbral || (c.tipo === "formacion" ? 0.6 : undefined), cert: !!pl.ia };
}
function infoDe(ids) {
  const out = {};
  ids.forEach(id => { const i = (S.invitaciones || []).find(x => x.id === id); const c = i && (S.campanas || []).find(x => x.id === i.campana_id); if (c) out[c.id] = infoCampana(c); });
  return out;
}
const motivoLegible = m => (m === "LIMITE_DIARIO" ? "se ha llegado al límite diario de correos del proveedor" : m);

/* Envía en lotes de 100 con aviso de progreso. Devuelve {bien, fallos, tope} */
async function enviarEnLotes(lotes, rotulo) {
  let bien = 0, tope = false; const fallos = [];
  for (let k = 0; k < lotes.length; k++) {
    if (lotes.length > 1) toast(`${rotulo}: lote ${k + 1} de ${lotes.length}…`);
    try {
      const r = await lotes[k]();
      bien += r.enviados || 0;
      (r.resultados || []).filter(x => !x.ok).forEach(x => { if (x.motivo === "LIMITE_DIARIO") tope = true; fallos.push(x); });
      if (tope) break;
    } catch (e) { fallos.push({ motivo: e.message }); break; }
  }
  return { bien, fallos, tope };
}

/* ---------- Quién entra en el envío ---------- */
function misTiendasEnvio() { return esAdmin() ? S.tiendas : S.tiendas.filter(t => t.rm_id === S.me.id); }
function masivo() { return (S.masivo = S.masivo || { modo: "todas", sel: [] }); }
function tiendasMasivo() {
  const M = masivo(), ts = misTiendasEnvio();
  return M.modo === "todas" ? ts : ts.filter(t => M.sel.includes(t.id));
}
const normMail = e => (e || "").trim().toLowerCase();
const mailOk = e => /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/.test(normMail(e));

/* Registro local de direcciones ya enviadas en una anónima (no guarda códigos) */
const claveAnon = id => "pp-anon-" + id;
function anonEnviados(id) { try { return JSON.parse(localStorage.getItem(claveAnon(id)) || "[]"); } catch (e) { return []; } }
function anonGuardar(id, mails) { try { localStorage.setItem(claveAnon(id), JSON.stringify([...new Set(anonEnviados(id).concat(mails))])); } catch (e) {} }

function planMasivo(c, pl) {
  const invs = invitacionesDe(c.id), ts = tiendasMasivo();
  const p = { tiendas: ts.length, personas: 0, sinCorreo: 0, nuevos: [], enviar: [], yaEnviados: 0, respondidos: 0 };
  if (pl.anonima) {
    const ya = new Set(anonEnviados(c.id));
    ts.forEach(t => equipoDe(t).forEach(x => {
      p.personas++;
      if (!mailOk(x.email)) { p.sinCorreo++; return; }
      if (ya.has(normMail(x.email))) { p.yaEnviados++; return; }
      p.nuevos.push({ t, email: normMail(x.email) });
    }));
    return p;
  }
  ts.forEach(t => equipoDe(t).forEach(x => {
    p.personas++;
    const inv = invs.find(i => i.tienda_id === t.id && ((x.email && normMail(i.email) === normMail(x.email)) || (i.destinatario || "").trim().toLowerCase() === (x.nombre || "").trim().toLowerCase()));
    if (inv) {
      if (inv.estado === "respondida") p.respondidos++;
      else if (!inv.email) p.sinCorreo++;
      else if (inv.enviado) p.yaEnviados++;
      else p.enviar.push(inv.id);
      return;
    }
    if (!mailOk(x.email)) { p.sinCorreo++; return; }
    p.nuevos.push({ t, x });
  }));
  return p;
}

/* ---------- Bloque de la campaña ---------- */
function bloqueMasivo(c, pl) {
  if (c.estado !== "abierta") return "";
  const M = masivo(), ts = misTiendasEnvio();
  if (!ts.length) return "";
  M.sel = M.sel.filter(id => ts.some(t => t.id === id));
  const p = planMasivo(c, pl), total = pl.anonima ? p.nuevos.length : p.nuevos.length + p.enviar.length;
  const directo = envioDirecto();
  const cuentaT = t => { const eq = equipoDe(t); return `${eq.filter(x => mailOk(x.email)).length}/${eq.length}`; };
  const recAnon = pl.anonima ? anonEnviados(c.id).length : 0;
  return `<section class="card env-m"><div class="card-h"><h2>Enviar a muchas personas a la vez</h2><span class="muted">por correo, a quien tenga correo en su ficha de equipo</span></div>
    <div class="env-alc" role="radiogroup" aria-label="A quién se envía">
      <button class="env-op ${M.modo === "todas" ? "on" : ""}" data-action="masivoModo" data-v="todas" role="radio" aria-checked="${M.modo === "todas"}"><b>${esAdmin() ? "Todas las tiendas" : "Todas mis tiendas"}</b><small>${ts.length} tiendas</small></button>
      <button class="env-op ${M.modo === "elegir" ? "on" : ""}" data-action="masivoModo" data-v="elegir" role="radio" aria-checked="${M.modo === "elegir"}"><b>Elegir tiendas</b><small>${M.sel.length ? `${M.sel.length} marcadas` : "una o varias"}</small></button>
      <a class="env-op" href="#envPersona" data-action="masivoPersona"><b>Persona a persona</b><small>más abajo, como hasta ahora</small></a>
    </div>
    ${M.modo === "elegir" ? `<div class="env-ts">${ts.map(t => `<label class="env-t"><input type="checkbox" class="chk" data-action="masivoTienda" data-id="${t.id}" ${M.sel.includes(t.id) ? "checked" : ""}><span>${esc(t.nombre)}</span><small title="con correo / en el equipo">${cuentaT(t)}</small></label>`).join("")}</div>
      <div class="env-ts-b"><button class="btn small ghost" data-action="masivoMarcar" data-v="1">Marcar todas</button><button class="btn small ghost" data-action="masivoMarcar" data-v="0">Ninguna</button></div>` : ""}
    <div class="env-res">
      <div><b>${p.personas}</b><small>personas en ${p.tiendas} ${p.tiendas === 1 ? "tienda" : "tiendas"}</small></div>
      <div class="ok"><b>${total}</b><small>${pl.anonima ? "recibirán un código anónimo" : "recibirán su código"}</small></div>
      <div><b>${p.yaEnviados}</b><small>ya lo recibieron</small></div>
      ${pl.anonima ? "" : `<div><b>${p.respondidos}</b><small>ya han respondido</small></div>`}
      <div class="${p.sinCorreo ? "warn" : ""}"><b>${p.sinCorreo}</b><small>sin correo: papeleta en tienda</small></div>
    </div>
    ${total > LIMITE_GRATIS ? `<p class="env-aviso">Son más de ${LIMITE_GRATIS} correos. Con el plan gratuito del proveedor de correo solo salen ${LIMITE_GRATIS} al día: los demás quedarán pendientes y podrás enviarlos mañana con este mismo botón. Con un plan de pago no hay límite diario.</p>` : ""}
    ${pl.anonima ? `<p class="hint">Anónima: cada persona recibe un código sin su nombre. Pippole no guarda qué dirección recibió cada código, así que nadie puede saber quién ha respondido qué. Este navegador recuerda a qué direcciones ya se ha enviado, para no repetir.</p>` : ""}
    ${sb.demo ? `<p class="hint">Demostración: no sale ningún correo, el envío se simula.</p>` : ""}
    <div class="actions" style="justify-content:flex-start">
      <button class="btn primary" data-action="masivoEnviar" ${total && directo ? "" : "disabled"}>${total ? (pl.anonima ? `Enviar ${total} ${total === 1 ? "código anónimo" : "códigos anónimos"}` : `${p.nuevos.length ? `Crear ${p.nuevos.length} ${p.nuevos.length === 1 ? "código" : "códigos"} y enviar` : "Enviar"} a ${total} ${total === 1 ? "persona" : "personas"}`) : "No hay nadie más a quien enviar"}</button>
      ${pl.anonima && recAnon ? `<button class="btn" data-action="masivoRecordar">Recordatorio general a ${recAnon}</button>` : ""}
    </div>
    ${!directo ? `<p class="hint">El envío directo no está activado en esta instalación (config.js → correoDirecto).</p>` : ""}
  </section>`;
}

const ACCIONES_ENVIOS = {
  masivoModo(b) { masivo().modo = b.dataset.v; },
  masivoTienda(b) { const M = masivo(), id = b.dataset.id; M.sel = b.checked ? [...new Set(M.sel.concat(id))] : M.sel.filter(x => x !== id); },
  masivoMarcar(b) { masivo().sel = b.dataset.v === "1" ? misTiendasEnvio().map(t => t.id) : []; },
  masivoPersona() { const e = $("envPersona"); if (e) e.scrollIntoView({ behavior: "smooth", block: "start" }); return false; },
  async masivoEnviar(b) {
    const c = S.campanas.find(x => x.id === S.campana), pl = SC.plantilla(c.plantilla), p = planMasivo(c, pl);
    const total = pl.anonima ? p.nuevos.length : p.nuevos.length + p.enviar.length;
    if (!total) return false;
    const ok = await confirmar({ titulo: `Enviar ${total} ${total === 1 ? "correo" : "correos"}`, ok: "Enviar ahora",
      texto: `${pl.anonima ? "Cada persona recibe un código anónimo de" : "Cada persona recibe su código de"} «${c.titulo}» desde no-responder@pippole.es. ${total > LIMITE_GRATIS ? `Con el plan gratuito solo salen ${LIMITE_GRATIS} hoy; el resto quedará pendiente. ` : ""}El correo sale y no se puede deshacer.` });
    if (!ok) return false;
    b.disabled = true; b.textContent = "Enviando…";
    const info = { [c.id]: infoCampana(c) };
    let res;
    if (pl.anonima) {
      // Códigos sin nombre, uno por dirección; la pareja solo vive aquí.
      const filas = p.nuevos.map(n => ({ campana_id: c.id, tienda_id: n.t.id, codigo: SC.codigoInvitacion(), estado: "pendiente", respuestas: {} }));
      const ins = await sb.from("invitaciones").insert(filas).select();
      if (ins.error) { alert("No se han podido crear los códigos: " + traducirError(ins.error)); await recargarPruebas(); pintar(); return false; }
      const libres = {}; (ins.data || []).forEach(r => (libres[r.tienda_id] = libres[r.tienda_id] || []).push(r.id));
      Object.values(libres).forEach(a => a.sort(() => Math.random() - 0.5));
      const pares = p.nuevos.map(n => ({ id: libres[n.t.id].pop(), email: n.email })).sort(() => Math.random() - 0.5);
      const sinSalir = new Set(pares.map(x => x.id));
      const lotes = [];
      for (let i = 0; i < pares.length; i += LOTE) {
        const trozo = pares.slice(i, i + LOTE);
        lotes.push(async () => {
          const r = await enviarPorLaPlataforma(null, null, { anonimos: trozo, info });
          const bienIds = new Set((r.resultados || []).filter(x => x.ok).map(x => x.id));
          anonGuardar(c.id, trozo.filter(x => bienIds.has(x.id)).map(x => x.email));
          bienIds.forEach(id => sinSalir.delete(id));
          return r;
        });
      }
      res = await enviarEnLotes(lotes, "Enviando");
      // Los códigos que no han salido se borran: si no, contarían como
      // invitaciones sin responder y bajarían la participación.
      if (sinSalir.size) await sb.from("invitaciones").delete().in("id", [...sinSalir]);
    } else {
      let ids = p.enviar.slice();
      if (p.nuevos.length) {
        const filas = p.nuevos.map(n => ({ campana_id: c.id, tienda_id: n.t.id, destinatario: n.x.nombre, puesto: n.x.puesto || null,
          email: normMail(n.x.email), codigo: SC.codigoInvitacion(), estado: "pendiente", respuestas: {} }));
        const ins = await sb.from("invitaciones").insert(filas).select();
        if (ins.error) { alert("No se han podido crear los códigos: " + traducirError(ins.error)); await recargarPruebas(); pintar(); return false; }
        ids = ids.concat((ins.data || []).map(r => r.id));
        await recargarPruebas();
      }
      const lotes = [];
      for (let i = 0; i < ids.length; i += LOTE) { const trozo = ids.slice(i, i + LOTE); lotes.push(() => enviarPorLaPlataforma(trozo, null, { info })); }
      res = await enviarEnLotes(lotes, "Enviando");
    }
    log(`${res.bien} correos enviados de ${c.titulo} (envío masivo)`);
    await recargarPruebas(); pintar();
    const pendientes = total - res.bien;
    if (res.tope) alert(`Enviados ${res.bien} de ${total}.\n\nSe ha llegado al límite diario de correos del proveedor (${LIMITE_GRATIS} al día en el plan gratuito). ${pendientes} quedan pendientes: vuelve a pulsar «Enviar» mañana.`);
    else if (res.fallos.length) alert(`Enviados ${res.bien} de ${total}.\n\nNo han salido:\n` + res.fallos.slice(0, 12).map(x => motivoLegible(x.motivo)).join("\n"));
    else toast(res.bien === 1 ? "1 correo enviado" : res.bien + " correos enviados");
    return false;
  },
  async masivoRecordar(b) {
    const c = S.campanas.find(x => x.id === S.campana), mails = anonEnviados(c.id);
    if (!mails.length) return false;
    const ok = await confirmar({ titulo: `Recordatorio a ${mails.length} ${mails.length === 1 ? "persona" : "personas"}`, ok: "Enviar recordatorio",
      texto: "Como la encuesta es anónima, no se sabe quién ha respondido: el recordatorio llega a todas las personas a las que se envió el código, sin código. Quien ya respondió puede ignorarlo." });
    if (!ok) return false;
    b.disabled = true; b.textContent = "Enviando…";
    const lotes = [];
    for (let i = 0; i < mails.length; i += LOTE) { const trozo = mails.slice(i, i + LOTE); lotes.push(() => enviarPorLaPlataforma(null, null, { recordatorio: { campana_id: c.id, emails: trozo } })); }
    const res = await enviarEnLotes(lotes, "Enviando recordatorios");
    log(`${res.bien} recordatorios de ${c.titulo}`);
    pintar();
    if (res.tope) alert(`Enviados ${res.bien} de ${mails.length}. Se ha llegado al límite diario del proveedor; el resto, mañana.`);
    else if (res.fallos.length) alert(`Enviados ${res.bien} de ${mails.length}.\n\n` + res.fallos.slice(0, 8).map(x => motivoLegible(x.motivo)).join("\n"));
    else toast(res.bien === 1 ? "1 recordatorio enviado" : res.bien + " recordatorios enviados");
    return false;
  }
};
if (typeof ACCIONES_PRUEBAS !== "undefined") Object.assign(ACCIONES_PRUEBAS, ACCIONES_ENVIOS);
