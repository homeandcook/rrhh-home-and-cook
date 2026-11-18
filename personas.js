"use strict";
/* =====================================================================
   Personas (0.33.0): la base de empleados de la empresa.
   No son usuarios de la plataforma: reciben encuestas, Talent Review y
   formaciones por correo con un código. RR.HH. da de alta, edita e
   importa; un Regional Manager ve a las personas de sus tiendas.
   Tabla empleados (migracion_0.33.sql). Si la migración no se ha
   ejecutado, S.emp es null y el resto de la plataforma sigue usando
   los equipos guardados dentro de cada tienda.
   ===================================================================== */
const EMP_CAMPOS = ["nombre", "apellidos", "correo", "puesto", "tipologia", "ubicacion", "tienda_id", "departamento", "fecha_alta"];
const empNombre = e => (e ? `${e.nombre || ""} ${e.apellidos || ""}`.trim() : "");
const empPorId = id => (Array.isArray(S.emp) ? S.emp.find(e => e.id === id) : null);
const empActivos = () => (Array.isArray(S.emp) ? S.emp.filter(e => e.activo) : []);
function empTiendaNombre(e) { const t = e && e.tienda_id && (S.todas || []).find(x => x.id === e.tienda_id); return t ? t.nombre : ""; }

async function cargarEmpleados() {
  S.empFalta = false;
  if (esMarketing() && !S.real) { S.emp = []; return; }
  const r = await sb.from("empleados").select("*").order("nombre");
  if (r.error) {
    S.emp = null;
    S.empFalta = /empleados|relation|does not exist|schema cache|42P01/i.test((r.error.message || "") + (r.error.code || ""));
    if (!S.empFalta) toast("No se han podido cargar las personas: " + traducirError(r.error));
    return;
  }
  S.emp = (r.data || []).sort((a, b) => empNombre(a).localeCompare(empNombre(b), "es"));
  if (S.real && S.me.rol === "rm") { const mias = new Set(S.tiendas.map(t => t.id)); S.emp = S.emp.filter(e => mias.has(e.tienda_id)); }
}
function pfil() { if (!S.pf) S.pf = { tip: "", ub: "", est: "activos" }; return S.pf; }

function pintarPersonas() {
  const admin = esAdmin(), F = pfil();
  if (!Array.isArray(S.emp)) {
    $("vista").innerHTML = `<div class="page pp"><div class="page-h"><div><h1>Personas</h1></div></div>
      <div class="cl-vacio"><b>Falta un paso en la base de datos</b>
      <p>${S.empFalta ? "Para usar Personas hay que ejecutar <code>supabase/migracion_0.33.sql</code> en el SQL Editor de Supabase (después de la 0.32). Copia los equipos que ya había en cada tienda." : "No se han podido cargar las personas. Vuelve a cargar la página."}</p></div></div>`;
    return;
  }
  const todos = S.emp, act = todos.filter(e => e.activo);
  const cuenta = k => act.filter(e => e.tipologia === k).length;
  let ls = todos.filter(e => (F.est === "todos" ? true : F.est === "bajas" ? !e.activo : e.activo));
  if (F.tip) ls = ls.filter(e => e.tipologia === F.tip);
  const ubs = [...new Set(ls.map(e => e.ubicacion).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  if (F.ub && !ubs.includes(F.ub)) F.ub = "";
  if (F.ub) ls = ls.filter(e => e.ubicacion === F.ub);
  const sinMail = act.filter(e => !e.correo).length;
  const cifra = (k, n, t) => `<button class="pp-cifra ${F.tip === k ? "on" : ""}" data-action="pTip" data-v="${k}" aria-pressed="${F.tip === k}"><b>${n}</b><small>${t}</small></button>`;
  $("vista").innerHTML = `<div class="page pp">
    <div class="page-h"><div><h1>Personas</h1><p class="muted">${admin ? "La plantilla de la empresa. No entran en la plataforma: reciben encuestas, Talent Review y formaciones por correo, con un código." : "Las personas de tus tiendas. Las altas y los cambios los hace RR.HH."}</p></div>
      ${admin ? `<div class="page-h-b"><button class="btn" data-action="pCsv" ${todos.length ? "" : "disabled"}>Descargar CSV</button><button class="btn" data-action="pAnadir">Añadir persona</button><button class="btn primary" data-action="pImportar">Importar archivo</button></div>` : ""}</div>
    ${S.pe ? empFormulario() : ""}
    ${todos.length ? `<div class="pp-cifras">${cifra("", act.length, act.length === 1 ? "activa" : "activas")}${Object.entries(IMP_TIPOS).map(([k, n]) => cifra(k, cuenta(k), n)).join("")}
      <div class="pp-cifra fija ${sinMail ? "aviso" : ""}"><b>${sinMail}</b><small>sin correo</small></div></div>
    <div class="pp-filtros">
      <label class="pp-busca"><span class="sr">Buscar</span><input id="pBusca" type="search" placeholder="Buscar por nombre, correo o puesto" autocomplete="off"></label>
      <label>Ubicación<select data-pf="ub"><option value="">Todas</option>${ubs.map(u => `<option ${F.ub === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select></label>
      <label>Estado<select data-pf="est"><option value="activos" ${F.est === "activos" ? "selected" : ""}>Activas</option><option value="bajas" ${F.est === "bajas" ? "selected" : ""}>De baja</option><option value="todos" ${F.est === "todos" ? "selected" : ""}>Todas</option></select></label>
      <span class="muted" id="pCuenta">${ls.length} ${ls.length === 1 ? "persona" : "personas"}</span></div>
    ${ls.length ? `<div class="tablewrap card pp-tabla"><table><thead><tr><th>Nombre</th><th>Puesto</th><th>Tipología</th><th>Ubicación</th><th>Responsable</th>${admin ? "<th></th>" : ""}</tr></thead><tbody>
      ${ls.map(e => {
        const r = empPorId(e.responsable_id), q = impNorm([empNombre(e), e.correo, e.puesto, e.ubicacion, e.departamento].join(" "));
        return `<tr data-q="${esc(q)}" class="${e.activo ? "" : "fila-off"}"><td><b>${esc(empNombre(e))}</b><small class="pp-sub">${e.correo ? esc(e.correo) : `<span class="pp-sin">Sin correo · papeleta</span>`}</small></td>
          <td>${esc(e.puesto || "–")}</td><td>${esc(IMP_TIPOS[e.tipologia] || e.tipologia)}</td>
          <td>${esc(e.ubicacion || "–")}${e.departamento ? `<small class="pp-sub">${esc(e.departamento)}</small>` : ""}${e.tipologia === "tiendas" && e.ubicacion && !e.tienda_id ? `<small class="pp-sub pp-sin">No coincide con ninguna tienda</small>` : ""}</td>
          <td>${r ? esc(empNombre(r)) : `<span class="muted">–</span>`}</td>
          ${admin ? `<td class="n"><button class="btn small ghost" data-action="pEditar" data-id="${e.id}">Editar</button></td>` : ""}</tr>`;
      }).join("")}</tbody></table></div>` : `<p class="empty">No hay nadie con estos filtros.</p>`}`
    : `<div class="cl-vacio"><b>Todavía no hay nadie</b><p>${admin ? "Importa el Excel de plantilla (o un CSV, o una tabla de Word) y revisa lo que se ha entendido antes de guardar. También puedes añadir a una persona a mano." : "RR.HH. todavía no ha dado de alta a las personas de tus tiendas."}</p>
      ${admin ? `<div class="page-h-b" style="justify-content:center"><button class="btn primary" data-action="pImportar">Importar archivo</button><button class="btn" data-action="pAnadir">Añadir persona</button></div>` : ""}</div>`}
    <p class="hint">Solo se guarda lo necesario para estas herramientas: nombre, correo, puesto, ubicación y responsable. Nada de DNI, nóminas ni datos de salud. Antes de cargar datos reales, confírmalo con IT y con el responsable de protección de datos.</p>
  </div>`;
  const fe = $("formEmp"); if (fe) fe.addEventListener("submit", empGuardarForm);
}
function empFormulario() {
  const p = S.pe, nuevo = !p.id, act = empActivos().filter(e => e.id !== p.id);
  const lista = (id, vals) => `<datalist id="${id}">${[...new Set(vals.filter(Boolean))].sort().map(v => `<option value="${esc(v)}">`).join("")}</datalist>`;
  return `<section class="card pp-form" id="ppForm"><div class="card-h"><h2>${nuevo ? "Añadir persona" : "Editar a " + esc(empNombre(p))}</h2></div>
    <form id="formEmp" class="pp-campos">
      <label>Nombre<input name="nombre" required value="${esc(p.nombre || "")}"></label>
      <label>Apellidos<input name="apellidos" value="${esc(p.apellidos || "")}"></label>
      <label>Correo<input name="correo" type="email" value="${esc(p.correo || "")}" placeholder="nombre@empresa.com"></label>
      <label>Puesto<input name="puesto" list="ppPuestos" value="${esc(p.puesto || "")}"></label>${lista("ppPuestos", S.emp.map(e => e.puesto).concat(PUESTOS_EQUIPO))}
      <label>Tipología<select name="tipologia">${Object.entries(IMP_TIPOS).map(([k, n]) => `<option value="${k}" ${(p.tipologia || "tiendas") === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>Ubicación<input name="ubicacion" list="ppUbs" value="${esc(p.ubicacion || "")}" placeholder="Tienda, oficina, zona o córner"></label>${lista("ppUbs", (S.todas || []).map(t => t.nombre).concat(S.emp.map(e => e.ubicacion)))}
      <label>Departamento<input name="departamento" list="ppDeps" value="${esc(p.departamento || "")}" placeholder="En oficinas"></label>${lista("ppDeps", S.emp.map(e => e.departamento))}
      <label>Responsable directo<select name="responsable_id"><option value="">Sin responsable</option>${act.map(e => `<option value="${e.id}" ${p.responsable_id === e.id ? "selected" : ""}>${esc(empNombre(e))}${e.puesto ? " · " + esc(e.puesto) : ""}</option>`).join("")}</select></label>
      <label>Fecha de alta<input name="fecha_alta" type="date" value="${esc(p.fecha_alta || "")}"></label>
      ${nuevo ? "" : `<label>Fecha de baja<input name="fecha_baja" type="date" value="${esc(p.fecha_baja || "")}"></label>`}
      <div class="pp-acc"><button class="btn primary" type="submit">${nuevo ? "Añadir" : "Guardar cambios"}</button><button class="btn" type="button" data-action="pCancelar">Cancelar</button>
        ${nuevo ? "" : `<span class="spacer"></span><button class="btn ghost" type="button" data-action="pBaja" data-id="${p.id}">${p.activo ? "Dar de baja" : "Reactivar"}</button><button class="btn ghost danger" type="button" data-action="pBorrar" data-id="${p.id}">Borrar</button>`}</div>
    </form>
    <p class="hint">En tiendas, si la ubicación coincide con una tienda de la plataforma, la persona aparece en esa tienda (envíos, Desarrollo y resultados por tienda). Sin responsable directo, en tiendas se toma al Store Manager, y para el Store Manager, a su Regional Manager.</p></section>`;
}
function empFilaDesde(v) {
  const t = v.tipologia === "tiendas" ? impTiendaDe(v.ubicacion) : null;
  return { nombre: (v.nombre || "").trim(), apellidos: (v.apellidos || "").trim(), correo: (v.correo || "").trim().toLowerCase() || null,
    puesto: (v.puesto || "").trim(), tipologia: v.tipologia || "tiendas", ubicacion: t ? t.nombre : (v.ubicacion || "").trim(), tienda_id: t ? t.id : null,
    departamento: (v.departamento || "").trim(), fecha_alta: v.fecha_alta || null };
}
async function empGuardarForm(ev) {
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target)), p = S.pe;
  const fila = Object.assign(empFilaDesde(f), { responsable_id: f.responsable_id || null });
  if (fila.correo && !impMail(fila.correo)) return alert("El correo no es válido.");
  if (fila.correo && S.emp.some(e => e.correo === fila.correo && e.id !== p.id)) return alert("Ya hay otra persona con ese correo.");
  if (p.id) { fila.fecha_baja = f.fecha_baja || null; fila.activo = !f.fecha_baja; }
  const btn = ev.target.querySelector("[type=submit]"); btn.disabled = true;
  const r = p.id ? await sb.from("empleados").update(fila).eq("id", p.id).select() : await sb.from("empleados").insert(fila).select();
  if (r.error) { btn.disabled = false; return alert("No se ha podido guardar: " + traducirError(r.error)); }
  log(`${p.id ? "Cambios en" : "Alta de"} ${fila.nombre} ${fila.apellidos} (Personas)`);
  S.pe = null; await cargarEmpleados(); pintar(); toast(p.id ? "Cambios guardados" : "Persona añadida");
}
/* Guarda lo que viene del importador: altas nuevas, cambios en quien ya
   estaba (solo lo que el archivo trae relleno) y, al final, responsables. */
async function empGuardarImportados(F) {
  const ins = [], upd = [];
  F.forEach(f => {
    const fila = empFilaDesde(f.v);
    if (!impMail(fila.correo)) fila.correo = null;
    if (f.ya) {
      const c = {};
      EMP_CAMPOS.forEach(k => { if (fila[k] && fila[k] !== f.ya[k]) c[k] = fila[k]; });
      if (!f.ya.activo) { c.activo = true; c.fecha_baja = null; }
      f._id = f.ya.id;
      if (Object.keys(c).length) upd.push([f.ya.id, c]);
    } else ins.push([fila, f]);
  });
  let nuevos = 0, cambiados = 0;
  for (let i = 0; i < ins.length; i += 200) {
    const trozo = ins.slice(i, i + 200);
    const r = await sb.from("empleados").insert(trozo.map(x => x[0])).select();
    if (r.error) throw r.error;
    (r.data || []).forEach((row, k) => { trozo[k][1]._id = row.id; });
    nuevos += (r.data || []).length;
  }
  for (let i = 0; i < upd.length; i += 10) {
    const rs = await Promise.all(upd.slice(i, i + 10).map(([id, c]) => sb.from("empleados").update(c).eq("id", id)));
    const e = rs.find(x => x.error); if (e) throw e.error;
    cambiados += rs.length;
  }
  const resp = [];
  F.forEach(f => {
    const destino = f.resp ? f.resp.id : f.respF ? f.respF._id : null;
    if (destino && f._id && destino !== f._id && (!f.ya || f.ya.responsable_id !== destino)) resp.push([f._id, destino]);
  });
  for (let i = 0; i < resp.length; i += 10) await Promise.all(resp.slice(i, i + 10).map(([id, r]) => sb.from("empleados").update({ responsable_id: r }).eq("id", id)));
  log(`Importación en Personas: ${nuevos} altas y ${cambiados} cambios`);
  await cargarEmpleados(); pintar();
  toast(`${nuevos} ${nuevos === 1 ? "alta" : "altas"} y ${cambiados} ${cambiados === 1 ? "cambio" : "cambios"} guardados`);
  return { nuevos, cambiados };
}

const ACCIONES_PERSONAS = {
  pTip(b) { const F = pfil(); F.tip = F.tip === b.dataset.v ? "" : b.dataset.v; F.ub = ""; },
  pAnadir() { if (!esAdmin()) return false; S.pe = { tipologia: pfil().tip || "tiendas", activo: true }; window.scrollTo(0, 0); },
  pEditar(b) { const e = empPorId(b.dataset.id); if (!e || !esAdmin()) return false; S.pe = Object.assign({}, e); window.scrollTo(0, 0); },
  pCancelar() { S.pe = null; },
  pImportar() { if (!esAdmin()) return false; abrirImportador("base", { tipDef: pfil().tip || "tiendas" }); return false; },
  async pBaja(b) {
    const e = empPorId(b.dataset.id); if (!e) return false;
    const c = e.activo ? { activo: false, fecha_baja: new Date().toISOString().slice(0, 10) } : { activo: true, fecha_baja: null };
    const r = await sb.from("empleados").update(c).eq("id", e.id);
    if (r.error) { alert(traducirError(r.error)); return false; }
    log(`${e.activo ? "Baja" : "Reactivación"} de ${empNombre(e)} (Personas)`);
    S.pe = null; await cargarEmpleados(); toast(e.activo ? "Dada de baja" : "Reactivada");
  },
  async pBorrar(b) {
    const e = empPorId(b.dataset.id); if (!e) return false;
    const ok = await confirmar({ titulo: `Borrar a ${empNombre(e)}`, ok: "Borrar", peligro: true,
      texto: "Se borra de Personas. Las encuestas que ya ha recibido no cambian. Si solo deja la empresa, mejor «Dar de baja»: se conserva el historial." });
    if (!ok) return false;
    const r = await sb.from("empleados").delete().eq("id", e.id);
    if (r.error) { alert(traducirError(r.error)); return false; }
    log(`Borrado de ${empNombre(e)} (Personas)`);
    S.pe = null; await cargarEmpleados(); toast("Borrada");
  },
  pCsv() {
    const filas = [["Nombre", "Apellidos", "Correo", "Puesto", "Tipología", "Ubicación", "Departamento", "Responsable", "Fecha de alta", "Fecha de baja"]]
      .concat(S.emp.map(e => [e.nombre, e.apellidos, e.correo || "", e.puesto, IMP_TIPOS[e.tipologia] || e.tipologia, e.ubicacion, e.departamento, empNombre(empPorId(e.responsable_id)), e.fecha_alta || "", e.fecha_baja || ""]));
    const csv = "﻿" + filas.map(f => f.map(x => `"${String(x == null ? "" : x).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "personas.csv"; document.body.appendChild(a); a.click(); a.remove();
    return false;
  }
};
document.addEventListener("change", e => {
  const k = e.target && e.target.dataset && e.target.dataset.pf;
  if (!k) return;
  pfil()[k] = e.target.value; pintar();
});
/* Búsqueda sin repintar: se ocultan las filas que no coinciden */
document.addEventListener("input", e => {
  if (e.target.id !== "pBusca") return;
  const q = impNorm(e.target.value); let n = 0;
  document.querySelectorAll(".pp-tabla tbody tr").forEach(tr => { const si = !q || tr.dataset.q.includes(q); tr.hidden = !si; if (si) n++; });
  const c = $("pCuenta"); if (c) c.textContent = `${n} ${n === 1 ? "persona" : "personas"}`;
});
