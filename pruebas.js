"use strict";
/* ===================== PRUEBAS E INVITACIONES =====================
   Un mismo circuito para Psicotécnicos, Mystery Shopper y Encuesta de Clima:
   RR.HH. o el RM crean una campaña, generan códigos y los envían. Quien recibe
   el código entra sin usuario, responde y el resultado vuelve a la plataforma.
   ================================================================== */

/* ---------- Acceso de invitado (sin usuario) ---------- */
const INV = { codigo: "", datos: null, respuestas: {}, enviado: false, error: "" };

async function abrirInvitacion(codigo) {
  INV.codigo = (codigo || "").trim().toUpperCase();
  INV.error = "";
  if (!INV.codigo) { INV.datos = null; return pintarInvitado(); }
  const { data, error } = await sb.rpc("invitacion_abrir", { p_codigo: INV.codigo });
  if (error) { INV.error = traducirError(error); INV.datos = null; }
  else if (!data) { INV.error = "Ese código no existe o ya ha caducado. Revisa que lo has copiado entero."; INV.datos = null; }
  else { INV.datos = data; INV.respuestas = data.respuestas || {}; }
  pintarInvitado();
}
function pintarInvitado() {
  const d = INV.datos, pl = d ? SC.plantilla(d.plantilla) : null;
  let h = `<div class="guest"><div class="esquina"><span class="chipseb">${logoSEB(34)}</span></div><div class="guest-card">${selectorIdioma()}${logo(64)}`;
  if (!d) {
    h += `<h1>${t("accesoCodigo")}</h1><p class="sub">${t("codigoSub")}</p>
      <form id="codeForm"><label>${t("codigo")}<input id="codeIn" value="${esc(INV.codigo)}" placeholder="XXXX-XXXX" autocomplete="off" autocapitalize="characters" required></label>
      <p class="login-err">${esc(INV.error)}</p>
      <button class="btn primary block" type="submit">${t("entrar")}</button></form>
      <p class="hint" style="text-align:center">${t("soyRRHH")} <a href="#" data-action="irLogin">${t("entraUsuario")}</a></p>`;
  } else if (d.estado === "respondida" || INV.enviado) {
    h += `<h1>${t("gracias")}</h1><p class="sub">${pl && pl.anonima ? t("graciasAnon") : t("graciasNom")}</p>
      <p class="hint" style="text-align:center">${t("cerrarVentana")}</p>`;
  } else if (d.campana_estado === "cerrada") {
    h += `<h1>${t("campanaCerrada")}</h1><p class="sub">${t("campanaCerradaTxt")}</p>`;
  } else {
    const r = SC.puntuar(pl, INV.respuestas);
    h = `<div class="guest wide"><div class="esquina"><span class="chipseb">${logoSEB(32)}</span></div><div class="guest-card wide">${selectorIdioma()}
      <div class="guest-h">${logo(56)}<div><h1>${esc(d.titulo)}</h1>
        <p class="sub">${esc(d.tienda || "")}${d.destinatario ? " · " + esc(d.destinatario) : ""}</p></div></div>
      <p class="intro">${esc(SC.txt(pl.intro))}</p><p class="aviso">${esc(SC.txt(pl.aviso))}</p>
      <div class="qlist">${pl.preguntas.map((q, i) => pregunta(q, i, pl)).join("")}</div>
      <div class="guest-f"><span class="muted num">${r.contestadas} ${t("respondidas")} ${r.puntuables}</span>
        <button class="btn primary" data-action="invEnviar" ${r.completa ? "" : "disabled"}>${t("enviar")}</button></div>
      ${r.completa ? "" : `<p class="hint">${t("faltanPreguntas")}</p>`}
      </div>${bandaMarcas()}</div>`;
    $("app").innerHTML = h; return;
  }
  $("app").innerHTML = h + `</div>${bandaMarcas()}</div>`;
  const f = $("codeForm");
  if (f) f.addEventListener("submit", ev => { ev.preventDefault(); abrirInvitacion($("codeIn").value); });
}
function pregunta(q, i, pl) {
  const v = INV.respuestas[q.id];
  let cuerpo;
  if (q.tipo === "texto") cuerpo = `<textarea rows="3" data-inv="${q.id}" placeholder="${t("opcional")}">${esc(v || "")}</textarea>`;
  else if (q.tipo === "nps") cuerpo = `<div class="nps">${Array.from({ length: 11 }, (_, k) => `<button type="button" class="np ${v === k ? "on" : ""} ${k <= 6 ? "d" : k <= 8 ? "p" : "g"}" data-action="invResp" data-q="${q.id}" data-v="${k}">${k}</button>`).join("")}</div>`;
  else if (q.tipo === "likert") cuerpo = `<div class="likert l${SC.txt2(pl.escala).length}">${SC.txt2(pl.escala).map((x, k) => `<button type="button" class="lk ${v === k ? "on" : ""}" data-action="invResp" data-q="${q.id}" data-v="${k}">${esc(x)}</button>`).join("")}</div>`;
  else cuerpo = `<div class="opts">${q.o.map((o, k) => `<button type="button" class="opt ${v === k ? "on" : ""}" data-action="invResp" data-q="${q.id}" data-v="${k}">${esc(SC.txt(o.t))}</button>`).join("")}</div>`;
  return `<section class="q"><p class="qt"><span class="qn">${i + 1}</span>${esc(SC.txt(q.t))}</p>${cuerpo}</section>`;
}
const ACCIONES_INVITADO = {
  invResp(b) { const v = Number(b.dataset.v); INV.respuestas[b.dataset.q] = INV.respuestas[b.dataset.q] === v ? undefined : v; if (INV.respuestas[b.dataset.q] === undefined) delete INV.respuestas[b.dataset.q]; pintarInvitado(); },
  async invEnviar() {
    const { error } = await sb.rpc("invitacion_responder", { p_codigo: INV.codigo, p_respuestas: INV.respuestas });
    if (error) { alert("No se han podido enviar las respuestas: " + traducirError(error)); return; }
    INV.enviado = true; pintarInvitado();
  },
  irLogin() { history.replaceState(null, "", location.pathname); location.reload(); }
};

/* ---------- Panel de RR.HH. y RM ---------- */
function campanasDe(tipo) { return (S.campanas || []).filter(c => c.tipo === tipo && c.anio === SC.CONFIG.anio); }
function invitacionesDe(id) { return (S.invitaciones || []).filter(i => i.campana_id === id); }
function tiendaDe(id) { return S.tiendas.find(t => t.id === id); }

function pintarPruebas(tipo) {
  const T = SC.CONFIG.tiposPrueba[tipo], cs = campanasDe(tipo);
  const nombreTipo = SC.txt(T.t);
  const sel = cs.find(c => c.id === S.campana) || cs[cs.length - 1];
  if (sel) S.campana = sel.id;
  const plantillas = SC.CONFIG.plantillas.filter(p => p.tipo === tipo);
  let h = `<div class="page"><div class="page-h"><h1>${esc(nombreTipo)}</h1>
    <div class="page-h-b">${esAdmin() && cs.length ? `<button class="btn peligro-g" data-action="borrarCampana">Borrar campaña</button>` : ""}
    ${esAdmin() ? `<button class="btn primary" data-action="nuevaCampana" data-tipo="${tipo}">Nueva campaña</button>` : ""}</div></div>`;
  if (!cs.length) {
    h += `<div class="empty big"><p>${esAdmin() ? "Todavía no hay ninguna campaña. Crea una y genera los códigos que quieras enviar." : "Todavía no hay ninguna campaña abierta. RR.HH. la creará cuando toque."}</p>
      ${esAdmin() ? `<p class="hint">Plantilla disponible: ${plantillas.map(p => esc(SC.txt(p.nombre))).join(", ")}.</p>` : ""}</div></div>`;
    $("vista").innerHTML = h; return;
  }
  h += `<div class="pills">${cs.map(c => `<button class="pill ${c.id === S.campana ? "on" : ""}" data-action="selCampana" data-id="${c.id}">${esc(c.titulo)}<small>${esc(c.estado)}</small></button>`).join("")}</div>`;

  const pl = SC.plantilla(sel.plantilla), invs = invitacionesDe(sel.id);
  const mias = esAdmin() ? invs : invs.filter(i => { const t = tiendaDe(i.tienda_id); return t && t.rm_id === S.me.id; });
  const resp = mias.filter(i => i.estado === "respondida");
  const notas = resp.map(i => SC.puntuar(pl, i.respuestas)).filter(x => x.pct != null);
  const media = notas.length ? notas.reduce((s, x) => s + x.pct, 0) / notas.length : null;

  h += `<div class="kpis"><div><small>Participación</small><b>${mias.length ? SC.pct(resp.length / mias.length, 0) : "–"}</b><small>${resp.length} de ${mias.length} códigos enviados</small></div>
    <div><small>${pl.anonima ? "Clima medio" : "Resultado medio"}</small><b>${media == null ? "–" : SC.pct(media, 0)}</b><small>sobre ${SC.fmt(SC.puntuar(pl, {}).max, 0)} puntos posibles</small></div>
    <div><small>Estado de la campaña</small><b>${esc(sel.estado)}</b>${esAdmin() ? `<small><button class="btn small ghost" data-action="toggleCampana">${sel.estado === "abierta" ? "Cerrar campaña" : "Reabrir"}</button></small>` : ""}</div>
    <div><small>Plantilla</small><b style="font-size:16px">${esc(SC.txt(pl.nombre))}</b><small>${pl.preguntas.length} preguntas${pl.anonima ? ", anónima" : ""}</small></div></div>`;

  // Generar invitaciones
  if (sel.estado === "abierta") {
    const tiendas = esAdmin() ? S.tiendas : S.tiendas.filter(t => t.rm_id === S.me.id);
    h += `<section class="card"><h2>Generar códigos</h2>
      <form class="inline-form" id="formInv" style="border:0;margin:0;padding:0">
        <label>Tienda<select name="tienda_id" required><option value="">Elige tienda</option>${tiendas.map(t => `<option value="${t.id}">${esc(t.nombre)}</option>`).join("")}</select></label>
        ${pl.anonima ? `<label>¿Cuántos códigos?<input name="n" type="number" min="1" max="30" value="6" class="short2"></label>`
          : `<label>Nombre<input name="destinatario" placeholder="Nombre y apellido" required></label>
             <label>Puesto<input name="puesto" placeholder="Store Manager, vendedor/a…"></label>
             <label>Correo<input name="email" type="email" placeholder="nombre@correo.com"></label>`}
        <button class="btn primary" type="submit">Generar</button></form>
      <p class="hint">${pl.anonima ? "Al ser anónima se generan códigos sueltos, sin nombre: se reparten en la tienda y nadie puede asociarlos a una persona." : "Cada código sirve una sola vez y queda asociado a esa persona. No hace falta que sea usuario de la plataforma: con el nombre y el correo basta, y se borra cuando borres la campaña."}</p></section>`;
  }

  // Tabla de invitaciones
  const sinResp = mias.filter(i => i.estado !== "respondida").length;
  h += `<section class="card"><div class="card-h"><h2>Códigos</h2><span class="muted">${mias.length}</span>
    ${esAdmin() && sinResp ? `<button class="btn small ghost danger" data-action="vaciarCodigos">Borrar los ${sinResp} sin responder</button>` : ""}</div>`;
  if (!mias.length) h += `<p class="empty">Todavía no hay códigos generados.</p>`;
  else {
    h += `<div class="tablewrap"><table><thead><tr><th>Código</th><th>Tienda</th>${pl.anonima ? "" : "<th>Para quién</th>"}<th>Estado</th><th class="n">Resultado</th><th></th></tr></thead><tbody>
    ${mias.map(i => {
      const t = tiendaDe(i.tienda_id), p = i.estado === "respondida" ? SC.puntuar(pl, i.respuestas) : null;
      return `<tr><td><code class="cod">${esc(i.codigo)}</code></td><td>${esc(t ? t.nombre : "–")}</td>${pl.anonima ? "" : `<td><b>${esc(i.destinatario || "–")}</b>${i.puesto ? `<br><small>${esc(i.puesto)}</small>` : ""}${i.email ? `<br><small class="mail">${esc(i.email)}</small>` : ""}</td>`}
        <td><span class="st ${i.estado === "respondida" ? "cerrado" : i.estado === "abierta" ? "encurso" : "pendiente"}">${esc(i.estado === "abierta" ? "abierto, sin enviar" : i.estado)}</span></td>
        <td class="n">${p ? `<b>${SC.pct(p.pct, 0)}</b>` : "–"}</td>
        <td class="n"><span class="fila-acc">${i.estado === "respondida"
          ? `<button class="btn small ghost" data-action="verRespuestas" data-id="${i.id}">Ver respuestas</button>`
          : `${i.email ? `<button class="btn small ghost" data-action="enviarInv" data-id="${i.id}">Enviar correo</button>` : ""}
             <button class="btn small ghost" data-action="copiarInv" data-id="${i.id}">Copiar mensaje</button>`}
          ${esAdmin() ? `<button class="btn small ghost danger" data-action="borrarInv" data-id="${i.id}" title="Borrar este código">Borrar</button>` : ""}</span></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  h += `</section>`;

  // Resultados por pregunta y por tienda
  if (resp.length) {
    h += bloqueDimensiones(pl, resp, cs, sel, mias);
    h += `<div class="grid2"><section class="card"><h2>Resultado por pregunta</h2><table class="mini"><tbody>
      ${pl.preguntas.filter(q => q.tipo !== "texto" && q.tipo !== "nps" && !q.sinPuntuar).map(q => {
        const max = q.tipo === "likert" ? SC.txt2(pl.escala).length - 1 : Math.max(...q.o.map(o => o.v));
        const vals = resp.map(i => { const r = (i.respuestas || {})[q.id]; return q.tipo === "likert" ? r : (r != null && q.o[r] ? q.o[r].v : null); }).filter(v => typeof v === "number");
        const m = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length / max : null;
        return `<tr><td>${esc(SC.txt(q.t).length > 80 ? SC.txt(q.t).slice(0, 78) + "…" : SC.txt(q.t))}</td><td class="n" style="width:90px">${m == null ? "–" : SC.pct(m, 0)}</td>
          <td style="width:120px"><span class="bar"><i style="width:${m == null ? 0 : Math.round(m * 100)}%"></i></span></td></tr>`;
      }).join("")}</tbody></table></section>
      <section class="card"><h2>Por tienda</h2><table class="mini"><tbody>
      ${[...new Set(resp.map(i => i.tienda_id))].map(tid => {
        const xs = resp.filter(i => i.tienda_id === tid).map(i => SC.puntuar(pl, i.respuestas)).filter(x => x.pct != null);
        const t = tiendaDe(tid), m = xs.reduce((s, x) => s + x.pct, 0) / xs.length;
        const pocas = pl.anonima && xs.length < 4;
        return `<tr><td>${esc(t ? t.nombre : "–")}</td><td class="n">${xs.length} resp.</td>
          <td class="n">${pocas ? `<span class="muted">Menos de 4</span>` : `<b>${SC.pct(m, 0)}</b>`}</td></tr>`;
      }).join("")}</tbody></table>
      ${pl.anonima ? `<p class="hint">No se muestran resultados de tiendas con menos de 4 respuestas, para que nadie sea identificable.</p>` : ""}</section></div>`;
      pl.preguntas.filter(q => q.sinPuntuar && q.o).forEach(q => {
        const tot = resp.filter(i => typeof (i.respuestas || {})[q.id] === "number").length;
        h += `<section class="card"><h2>${esc(SC.txt(q.t))}</h2><table class="mini"><tbody>
          ${q.o.map((o, k) => {
            const n = resp.filter(i => (i.respuestas || {})[q.id] === k).length;
            return `<tr><td>${esc(SC.txt(o.t))}</td><td class="n" style="width:60px">${n}</td>
              <td class="n" style="width:70px">${tot ? SC.pct(n / tot, 0) : "–"}</td>
              <td style="width:140px"><span class="bar"><i style="width:${tot ? Math.round(n / tot * 100) : 0}%"></i></span></td></tr>`;
          }).join("")}</tbody></table></section>`;
      });
      const textos = pl.preguntas.filter(q => q.tipo === "texto");
      if (textos.length) {
        const coment = resp.flatMap(i => textos.map(q => (i.respuestas || {})[q.id]).filter(x => (x || "").trim()));
        h += `<section class="card"><div class="card-h"><h2>Comentarios</h2><span class="muted">${coment.length}</span></div>
          ${coment.length ? `<ul class="coment">${coment.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : `<p class="empty">Sin comentarios.</p>`}</section>`;
      }
  }
  $("vista").innerHTML = h + `</div>`;
  const f = $("formInv");
  if (f) f.addEventListener("submit", generarInvitaciones);
}

// Resultados por dimensión, eNPS y comparación con la ola anterior
function bloqueDimensiones(pl, resp, cs, sel, todasInv) {
  const dims = [...new Set(pl.preguntas.filter(q => q.dim && q.tipo === "likert").map(q => q.dim))];
  if (!dims.length) return "";
  const nEsc = SC.txt2(pl.escala).length - 1;
  const mediaDim = (lista, dim) => {
    const qs = pl.preguntas.filter(q => q.dim === dim && q.tipo === "likert");
    const v = [];
    lista.forEach(i => qs.forEach(q => { const r = (i.respuestas || {})[q.id]; if (typeof r === "number") v.push(r / nEsc); }));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  // ola anterior: campaña previa con la misma plantilla
  const previas = cs.filter(c => c.plantilla === sel.plantilla && c.creado < sel.creado).sort((a, b) => a.creado < b.creado ? 1 : -1);
  const prev = previas[0];
  const respPrev = prev ? invitacionesDe(prev.id).filter(i => i.estado === "respondida") : [];
  const nps = SC.enps(resp.map(i => i.respuestas || {}));
  const npsPrev = respPrev.length ? SC.enps(respPrev.map(i => i.respuestas || {})) : null;
  return `<div class="grid2"><section class="card"><div class="card-h"><h2>Por dimensión</h2>${prev ? `<span class="muted">Comparado con ${esc(prev.titulo)}</span>` : ""}</div>
    <table class="mini"><tbody>${dims.map(d => {
      const m = mediaDim(resp, d), mp = prev ? mediaDim(respPrev, d) : null;
      const dv = m != null && mp != null ? m - mp : null;
      return `<tr><td>${esc(SC.txt(SC.CONFIG.dimensiones[d] || d))}</td>
        <td class="n" style="width:70px"><b>${m == null ? "–" : SC.pct(m, 0)}</b></td>
        <td style="width:110px"><span class="bar"><i style="width:${m == null ? 0 : Math.round(m * 100)}%"></i></span></td>
        <td class="n" style="width:70px">${dv == null ? "" : `<span class="dev ${dv > 0.005 ? "pos" : dv < -0.005 ? "neg" : ""}">${dv > 0 ? "+" : ""}${SC.pct(dv, 0)}</span>`}</td></tr>`;
    }).join("")}</tbody></table></section>
    <section class="card"><h2>eNPS</h2>
      ${nps ? `<p class="enps ${nps.valor >= 20 ? "ok" : nps.valor < 0 ? "mal" : ""}">${nps.valor > 0 ? "+" : ""}${nps.valor}</p>
        <p class="hint">${nps.promotores} promotores y ${nps.detractores} detractores sobre ${nps.n} respuestas.${npsPrev ? ` Ola anterior: ${npsPrev.valor > 0 ? "+" : ""}${npsPrev.valor}.` : ""}</p>`
        : `<p class="empty">Esta plantilla no incluye la pregunta de recomendación.</p>`}
      <p class="hint">Participación: ${todasInv.length ? SC.pct(resp.length / todasInv.length, 0) : "–"} de los códigos repartidos.</p></section></div>`;
}

async function generarInvitaciones(ev) {
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  const c = (S.campanas || []).find(x => x.id === S.campana), pl = SC.plantilla(c.plantilla);
  const n = pl.anonima ? Math.min(30, Math.max(1, Number(f.n) || 1)) : 1;
  const filas = [];
  for (let i = 0; i < n; i++) filas.push({ campana_id: c.id, tienda_id: f.tienda_id,
    destinatario: pl.anonima ? null : (f.destinatario || "").trim(),
    puesto: pl.anonima ? null : ((f.puesto || "").trim() || null),
    email: pl.anonima ? null : ((f.email || "").trim().toLowerCase() || null),
    codigo: SC.codigoInvitacion(), estado: "pendiente", respuestas: {} });
  const { error } = await sb.from("invitaciones").insert(filas);
  if (error) { alert("No se han podido generar los códigos: " + traducirError(error)); return; }
  log(`${n} código(s) de ${c.titulo} para ${(tiendaDe(f.tienda_id) || {}).nombre || ""}`);
  toast(n === 1 ? "Código generado" : n + " códigos generados");
  await recargarPruebas(); pintar();
}
async function recargarPruebas() {
  const [c, i] = await Promise.all([
    sb.from("campanas").select("*").eq("anio", SC.CONFIG.anio).order("creado"),
    sb.from("invitaciones").select("*").order("creado")
  ]);
  S.campanas = c.data || []; S.invitaciones = i.data || [];
}
function mensajeInvitacion(inv) {
  const c = (S.campanas || []).find(x => x.id === inv.campana_id), pl = SC.plantilla(c.plantilla);
  const url = location.origin + location.pathname + "?codigo=";
  return `Hola${inv.destinatario ? " " + inv.destinatario.split(" ")[0] : ""},

Te envío el acceso a "${c.titulo}". No necesitas usuario ni contraseña: abre el enlace y escribe este código.

Enlace: ${url}
Código: ${inv.codigo}

Son ${pl.preguntas.length} preguntas y se tarda unos ${pl.id === "clima-tienda" ? "5" : "10"} minutos. El código sirve una sola vez y es solo tuyo, no lo reenvíes.

Gracias,
${S.me.nombre}`;
}
function asuntoInvitacion(inv) {
  const c = (S.campanas || []).find(x => x.id === inv.campana_id);
  return c ? c.titulo : "Acceso";
}

const ACCIONES_PRUEBAS = {
  selCampana(b) { S.campana = b.dataset.id; },
  async nuevaCampana(b) {
    const tipo = b.dataset.tipo, pls = SC.CONFIG.plantillas.filter(p => p.tipo === tipo);
    let plantilla = pls[0].id;
    if (pls.length > 1) {
      const op = prompt(`¿Qué plantilla?\n${pls.map((p2, i) => `${i + 1}. ${SC.txt(p2.nombre)}`).join("\n")}\n\nEscribe el número:`, "1");
      if (op == null) return false;
      plantilla = (pls[Number(op) - 1] || pls[0]).id;
    }
    const nom = SC.txt(SC.CONFIG.tiposPrueba[tipo].t);
    const titulo = prompt(`Título de la campaña:`, `${nom} ${SC.CONFIG.anio}`);
    if (!titulo) return false;
    const { error } = await sb.from("campanas").insert({ anio: SC.CONFIG.anio, tipo, plantilla, titulo: titulo.trim(), estado: "abierta", creado_por: S.me.id });
    if (error) { alert("No se ha podido crear: " + traducirError(error)); return false; }
    log(`Campaña creada: ${titulo}`); await recargarPruebas();
    S.campana = (S.campanas.filter(c => c.tipo === tipo).slice(-1)[0] || {}).id;
    toast("Campaña creada");
  },
  async toggleCampana() {
    const c = S.campanas.find(x => x.id === S.campana);
    const nuevo = c.estado === "abierta" ? "cerrada" : "abierta";
    if (nuevo === "cerrada" && !await confirmar({ titulo: "Cerrar la campaña", ok: "Cerrar campaña",
      texto: "Los códigos que nadie haya contestado dejarán de funcionar. Puedes reabrirla después." })) return false;
    const { error } = await sb.from("campanas").update({ estado: nuevo }).eq("id", c.id);
    if (error) { alert(traducirError(error)); return false; }
    log(`Campaña ${nuevo}: ${c.titulo}`); await recargarPruebas();
  },
  async borrarInv(b) {
    const inv = S.invitaciones.find(i => i.id === b.dataset.id); if (!inv) return false;
    const resp = inv.estado === "respondida";
    const ok = await confirmar({ titulo: `Borrar el código ${inv.codigo}`, ok: "Borrar", peligro: true,
      texto: resp ? "Este código ya está respondido. Al borrarlo se pierde esa respuesta y deja de contar en los resultados. No se puede deshacer."
                  : "El código dejará de funcionar. Si ya lo has repartido, quien lo tenga no podrá entrar. No se puede deshacer." });
    if (!ok) return false;
    const { error } = await sb.from("invitaciones").delete().eq("id", inv.id);
    if (error) { alert("No se ha podido borrar: " + traducirError(error)); return false; }
    log(`Código borrado: ${inv.codigo}`); await recargarPruebas(); toast("Código borrado");
  },
  async vaciarCodigos() {
    const c = S.campanas.find(x => x.id === S.campana); if (!c) return false;
    const n = invitacionesDe(c.id).filter(i => i.estado !== "respondida").length;
    if (!n) { toast("No hay códigos sin responder"); return false; }
    const ok = await confirmar({ titulo: `Borrar ${n} ${n === 1 ? "código" : "códigos"} sin responder`, ok: "Borrar", peligro: true,
      texto: "Se borran solo los que nadie ha contestado todavía. Las respuestas ya recibidas se quedan como están. Después puedes volver a generar los que necesites." });
    if (!ok) return false;
    for (const est of ["pendiente", "abierta"]) {
      const { error } = await sb.from("invitaciones").delete().eq("campana_id", c.id).eq("estado", est);
      if (error) { alert("No se ha podido borrar: " + traducirError(error)); return false; }
    }
    log(`Códigos sin responder borrados: ${c.titulo}`); await recargarPruebas(); toast("Códigos borrados");
  },
  async borrarCampana() {
    const c = S.campanas.find(x => x.id === S.campana); if (!c) return false;
    const inv = invitacionesDe(c.id), r = inv.filter(i => i.estado === "respondida").length;
    const ok = await confirmar({ titulo: `Borrar «${c.titulo}»`, ok: "Borrar la campaña", peligro: true, escribe: "BORRAR",
      texto: `Se borra la campaña entera con sus ${inv.length} ${inv.length === 1 ? "código" : "códigos"}${r ? ` y las ${r} ${r === 1 ? "respuesta recibida" : "respuestas recibidas"}` : ""}. No se puede deshacer.` });
    if (!ok) return false;
    const e1 = (await sb.from("invitaciones").delete().eq("campana_id", c.id)).error;
    if (e1) { alert("No se ha podido borrar: " + traducirError(e1)); return false; }
    const { error } = await sb.from("campanas").delete().eq("id", c.id);
    if (error) { alert("No se ha podido borrar: " + traducirError(error)); return false; }
    log(`Campaña borrada: ${c.titulo}`); S.campana = null; await recargarPruebas(); toast("Campaña borrada");
  },
  enviarInv(b) {
    const inv = S.invitaciones.find(i => i.id === b.dataset.id);
    if (!inv || !inv.email) return false;
    const href = `mailto:${encodeURIComponent(inv.email)}?subject=${encodeURIComponent(asuntoInvitacion(inv))}&body=${encodeURIComponent(mensajeInvitacion(inv))}`;
    const a = document.createElement("a"); a.href = href; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    toast("Se abre tu correo con el mensaje listo para enviar");
    return false;
  },
  copiarInv(b) {
    const inv = S.invitaciones.find(i => i.id === b.dataset.id), txt = mensajeInvitacion(inv);
    const mostrar = () => {
      ACCIONES_PRUEBAS.cerrarModal();
      document.body.insertAdjacentHTML("beforeend", `<div class="modal" id="modalResp"><div class="modal-c">
        <div class="card-h"><h2>Mensaje para ${esc(inv.destinatario || "el invitado")}</h2><button class="btn small ghost" data-action="cerrarModal">Cerrar</button></div>
        <p class="hint">Selecciónalo y cópialo en tu correo. El enlace lleva el código ya puesto.</p>
        <textarea rows="12" id="msgInv" readonly>${esc(txt)}</textarea>
        <div class="actions"><button class="btn primary" data-action="copiarCuadro">Copiar</button></div></div></div>`);
      const el = $("msgInv"); if (el) { el.focus(); el.select(); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(txt).then(() => toast("Mensaje copiado, ya puedes pegarlo en el correo"), mostrar);
    else mostrar();
    return false;
  },
  copiarCuadro() {
    const el = $("msgInv"); if (!el) return false;
    el.select();
    try { document.execCommand("copy"); toast("Mensaje copiado"); } catch (e) { toast("Selecciona el texto y cópialo con Ctrl+C"); }
    return false;
  },
  verRespuestas(b) {
    const inv = S.invitaciones.find(i => i.id === b.dataset.id);
    const c = S.campanas.find(x => x.id === inv.campana_id), pl = SC.plantilla(c.plantilla), p = SC.puntuar(pl, inv.respuestas);
    $("print").innerHTML = "";
    /* Cada tipo de pregunta guarda la respuesta de una forma distinta y no
       todas tienen opciones: las de escala van contra pl.escala y la de
       eNPS es un número suelto. Dar por hecho que q.o existe rompía la
       ficha en cuanto la plantilla llevaba un eNPS, como la de clima. */
    const cuerpo = pl.preguntas.map(q => {
      const r = (inv.respuestas || {})[q.id];
      let txt;
      if (q.tipo === "texto") txt = (r || "").trim() || "Sin respuesta";
      else if (q.tipo === "likert") { const e = SC.txt2(pl.escala) || []; txt = e[r] != null ? e[r] : "Sin respuesta"; }
      else if (q.tipo === "nps") txt = typeof r === "number" ? `${r} sobre 10` : "Sin respuesta";
      else { const o = q.o && q.o[r]; txt = o ? `${SC.txt(o.t)}${o.v != null && !q.sinPuntuar ? ` (${o.v} ${o.v === 1 ? "punto" : "puntos"})` : ""}` : "Sin respuesta"; }
      return `<li><b>${esc(SC.txt(q.t))}</b><span>${esc(txt)}</span></li>`;
    }).join("");
    document.body.insertAdjacentHTML("beforeend", `<div class="modal" id="modalResp"><div class="modal-c">
      <div class="card-h"><h2>${esc(pl.anonima ? "Respuesta anónima" : (inv.destinatario || "Respuestas"))}</h2><button class="btn small ghost" data-action="cerrarModal">Cerrar</button></div>
      <p class="hint">${esc(c.titulo)} · ${esc((tiendaDe(inv.tienda_id) || {}).nombre || "")} · Resultado ${SC.pct(p.pct, 0)} (${p.obt} de ${p.max})</p>
      ${pl.anonima ? `<p class="aviso-anon">Esta encuesta es anónima. Se ve lo que contestó este código, pero no quién lo usó: la plataforma no guarda ese dato en ninguna parte.</p>` : ""}
      <ul class="resp">${cuerpo}</ul></div></div>`);
    return false;
  },
  cerrarModal() { const m = $("modalResp"); if (m) m.remove(); return false; }
};
