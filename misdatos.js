/* =====================================================================
   Pippole · «Tus datos» (0.38.0)

   Cada persona de la plantilla puede ver, con un código personal, lo que
   Pippole guarda sobre ella, quién lo ve y quién ha abierto su ficha.
   Solo lectura. Base de datos: migracion_0.38.sql (mis_datos,
   datos_codigo_nuevo, registrar_acceso, tabla accesos_ficha).

   - El código lo genera la base de datos y solo se guarda su huella: se
     enseña una vez para enviarlo por correo (enviar-invitacion, tipo
     «datos») y nadie puede recuperarlo después. Si se pierde, se pide otro.
   - Se entra por la misma puerta que las encuestas («Entrar con un código»).
   - Las encuestas anónimas no aparecen: no se guarda quién respondió.
   - Quién abre la ficha de alguien (Personas, Scorecard) queda en
     accesos_ficha mediante registrarAcceso().
   ===================================================================== */

const MD = { datos: null };

/* ---------- Lado de la persona (invitado) ---------- */
async function abrirMisDatos(codigo) {
  const { data, error } = await sb.rpc("mis_datos", { p_codigo: codigo });
  if (error || !data) return false;
  MD.datos = data; MD.codigo = codigo;
  pintarMisDatos();
  return true;
}

function mdFecha(x) { return x ? new Date(x).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""; }
function mdChip(t, tipo) { return `<span class="md-chip ${tipo || ""}">${esc(t)}</span>`; }
function mdQuien(xs) { return `<p class="md-quien"><b>Lo ven:</b> ${esc(xs.filter(Boolean).join(", "))}.</p>`; }

function pintarMisDatos() {
  const d = MD.datos, f = d.ficha || {}, q = d.quien || {};
  const nombre = [f.nombre, f.apellidos].filter(Boolean).join(" ");
  const ven = ["RR.HH.", q.rm ? `${q.rm} (Regional Manager)` : "", q.responsable ? `${q.responsable} (tu responsable)` : ""];
  const fila = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : "";
  const TIPO = { formacion: "Formación", clima: "Encuesta de clima con nombre", psico: "Prueba", onboarding: "Encuesta de incorporación", offboarding: "Encuesta de salida", mystery: "Evaluación" };
  const ESTADO = { pendiente: ["Sin empezar", "aviso"], abierta: ["Empezada", "aviso"], respondida: ["Completada", "ok"] };

  let h = `<div class="guest md"><div class="esquina"><span class="chipsimbolo">${simboloPippole(34)}</span></div><div class="guest-card md-card">${logo(48)}
    <h1>Hola, ${esc(f.nombre || "")}</h1>
    <p class="sub">Esto es todo lo que Pippole guarda sobre ti y quién puede verlo. Solo es para consultar.</p>`;

  h += `<section class="md-s"><div class="md-h"><h2>Tu ficha</h2></div>
    <dl class="md-dl">${fila("Nombre", nombre)}${fila("Puesto", f.puesto)}${fila("Tienda", f.tienda)}${fila("Ubicación", f.tienda ? "" : f.ubicacion)}${fila("Departamento", f.departamento)}${fila("Responsable", f.responsable)}${fila("Correo", f.correo)}${fila("Fecha de alta", mdFecha(f.fecha_alta))}</dl>
    ${mdQuien(ven)}</section>`;

  (d.scorecard || []).forEach(s => {
    const per = (C.periodos[s.periodo] || {}).nombre || s.periodo;
    h += `<section class="md-s"><div class="md-h"><h2>Scorecard · ${esc(per)} ${esc(s.anio)}</h2>${mdChip("Cerrada", "ok")}</div>
      <p>Cerrada el ${mdFecha(s.fecha)}${s.por ? ` por ${esc(s.por)}` : ""}.${s.nota != null ? ` Nota ${SC.fmt(s.nota, 2)} sobre ${SC.fmt(C.puntuacionMaxima * C.multiplicadorNota, 0)}.` : ""}${s.bonus != null ? ` Bonus ${s.periodo === "s1" ? "orientativo" : "calculado"}: ${SC.eur(s.bonus)}.` : ""}</p>
      ${mdQuien(["tú", "RR.HH.", q.rm ? `${q.rm} (Regional Manager)` : ""])}</section>`;
  });

  (d.desarrollo || []).forEach(x => {
    h += `<section class="md-s"><div class="md-h"><h2>${esc(x.ciclo)}</h2>${x.estado === "enviada" ? mdChip("Entregada a RR.HH.", "ok") : mdChip("En curso", "aviso")}</div>
      <p>${x.estado === "enviada" ? `${esc(x.evaluador)} ya ha entregado su valoración.` : `La está preparando ${esc(x.evaluador)}.`} La verás con tu responsable en la conversación de desarrollo.</p>
      ${mdQuien([x.evaluador, "RR.HH."])}</section>`;
  });

  (d.invitaciones || []).forEach(x => {
    const [et, cl] = ESTADO[x.estado] || [x.estado, ""];
    h += `<section class="md-s"><div class="md-h"><h2>${esc(x.titulo)}</h2>${mdChip(et, cl)}</div>
      <p>${esc(TIPO[x.tipo] || "Invitación")}${x.respondido ? ` · ${mdFecha(x.respondido)}` : ""}.</p>
      ${mdQuien(["RR.HH.", q.rm ? `${q.rm} (Regional Manager)` : ""])}</section>`;
  });

  h += `<section class="md-s md-anon"><div class="md-h"><h2>Encuestas anónimas</h2></div>
    <p>No aparecen aquí porque Pippole no guarda quién las respondió: tus respuestas no llevan tu nombre ni tu correo, y nadie, tampoco RR.HH., puede saber qué contestaste. Solo se ven resultados de grupos de 5 personas o más.</p></section>`;

  const acc = d.accesos || [];
  h += `<section class="md-s"><div class="md-h"><h2>Quién ha abierto tu ficha</h2></div>
    ${acc.length ? `<ul class="md-acc">${acc.map(a => `<li><span>${esc(a.rol === "admin" ? "RR.HH." : a.nombre || "Usuario")}</span><span>${mdFecha(a.cuando)}</span></li>`).join("")}</ul>` : `<p>Nadie en los últimos 90 días.</p>`}
    <p class="md-quien">Últimos 90 días.</p></section>`;

  h += `<section class="md-s md-plano"><h2>Lo que Pippole no guarda</h2><p>Salud ni motivos de baja, nóminas, cuentas bancarias, DNI ni tu ubicación.</p></section>
    <div class="md-acc-b">
      <button class="btn primary block" data-action="mdDescargar">Descargar todos mis datos</button>
      <a class="btn block" href="privacidad.html" target="_blank" rel="noopener">Privacidad y tus derechos</a>
      <button class="btn ghost block" data-action="mdSalir">Salir</button>
    </div></div></div>`;
  $("app").innerHTML = h;
  window.scrollTo(0, 0);
}

/* Acciones del invitado: no necesitan sesión (van por ACCIONES_INVITADO). */
const ACCIONES_MISDATOS = {
  mdDescargar() {
    if (!MD.datos) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(MD.datos, null, 2)], { type: "application/json" }));
    a.download = "mis-datos-pippole.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  mdSalir() { MD.datos = null; MD.codigo = null; history.replaceState(null, "", location.pathname + (location.search.includes("demo") ? "?demo" : "")); INV.codigo = ""; INV.datos = null; pintarInvitado(); }
};

/* ---------- Lado de RR.HH. ---------- */
const ACC_VISTOS = new Set();
/* Deja constancia de que el usuario real ha abierto la ficha de una persona.
   Una vez por persona y apartado en cada sesión; sin la migración, no hace nada. */
function registrarAcceso(empId, donde) {
  if (!empId || !sb || !S.me) return;
  const k = empId + "|" + donde; if (ACC_VISTOS.has(k)) return; ACC_VISTOS.add(k);
  sb.rpc("registrar_acceso", { p_empleado: empId, p_donde: donde }).then(() => {}, () => {});
}

function bloqueMisDatos(p) {
  if (!p || !p.id || !esAdmin()) return "";
  const est = p.datos_enviado ? `Acceso enviado el ${mdFecha(p.datos_enviado)}.` : "Todavía no se le ha enviado.";
  return `<div class="pp-md"><div><b>Tus datos</b><p class="muted">La persona puede consultar con un código qué datos suyos hay, quién los ve y quién ha abierto su ficha. ${est}</p></div>
    <button class="btn" type="button" data-action="mdEnviar" data-id="${p.id}" ${p.correo && p.activo !== false ? "" : "disabled title=\"Hace falta un correo y que esté activa\""}>${p.datos_enviado ? "Enviar un código nuevo" : "Enviar su acceso"}</button></div>`;
}

async function mdEnviarA(lista) {
  let ok = 0; const fallos = [];
  for (let k = 0; k < lista.length; k += 50) {
    const lote = lista.slice(k, k + 50), datos = [];
    for (const e of lote) {
      const r = await sb.rpc("datos_codigo_nuevo", { p_empleado: e.id });
      if (r.error) {
        if (/datos_codigo_nuevo|function|schema cache|42883|PGRST202/i.test((r.error.message || "") + (r.error.code || ""))) {
          await avisar("Falta ejecutar supabase/migracion_0.38.sql en el SQL Editor de Supabase.", "Falta un paso en la base de datos"); return null;
        }
        fallos.push(`${empNombre(e)}: ${traducirError(r.error)}`); continue;
      }
      datos.push({ id: e.id, codigo: r.data });
    }
    if (!datos.length) continue;
    const { data, error } = await sb.functions.invoke("enviar-invitacion", { body: { tipo: "datos", datos } });
    if (error) { fallos.push(traducirError(error)); break; }
    (data.resultados || []).forEach(x => { if (x.ok) ok++; else fallos.push(`${empNombre(empPorId(x.id) || {})}: ${x.motivo === "LIMITE_DIARIO" ? "límite diario de correos alcanzado" : x.motivo}`); });
    if ((data.resultados || []).some(x => x.motivo === "LIMITE_DIARIO")) break;
  }
  log(`Acceso a «Tus datos» enviado a ${ok} ${ok === 1 ? "persona" : "personas"}`);
  return { ok, fallos };
}

const ACCIONES_MISDATOS_ADMIN = {
  async mdEnviar(b) {
    const e = empPorId(b.dataset.id); if (!e || !esAdmin()) return false;
    if (!(await confirmar({ titulo: "Enviar su acceso a «Tus datos»", texto: `${empNombre(e)} recibirá en ${e.correo} un código para consultar sus datos.${e.datos_enviado ? " El código anterior deja de valer." : ""}`, ok: "Enviar" }))) return false;
    const r = await mdEnviarA([e]); if (!r) return false;
    await cargarEmpleados(); if (S.pe && S.pe.id === e.id) S.pe = Object.assign({}, empPorId(e.id));
    if (r.fallos.length) avisar(r.fallos.join("\n"), "No se ha podido enviar"); else toast("Acceso enviado");
  },
  async mdEnviarTodos() {
    if (!esAdmin() || !Array.isArray(S.emp)) return false;
    const lista = S.emp.filter(e => e.activo && e.correo && !e.datos_enviado);
    if (!lista.length) { avisar("Todas las personas activas con correo ya tienen su acceso."); return false; }
    if (!(await confirmar({ titulo: "Enviar el acceso a «Tus datos»", texto: `Se enviará un código personal a ${lista.length} ${lista.length === 1 ? "persona" : "personas"} que aún no lo tienen. El plan gratuito de correo permite 100 al día: si se llega al límite, se para y se puede seguir mañana.`, ok: "Enviar" }))) return false;
    toast("Enviando…");
    const r = await mdEnviarA(lista); if (!r) return false;
    await cargarEmpleados();
    if (r.fallos.length) avisar(`Enviados: ${r.ok}.\n\n${r.fallos.slice(0, 12).join("\n")}${r.fallos.length > 12 ? `\n… y ${r.fallos.length - 12} más` : ""}`, "Envío terminado con avisos");
    else toast(`Acceso enviado a ${r.ok} ${r.ok === 1 ? "persona" : "personas"}`);
  }
};

if (typeof ACCIONES_INVITADO !== "undefined") Object.assign(ACCIONES_INVITADO, ACCIONES_MISDATOS);
