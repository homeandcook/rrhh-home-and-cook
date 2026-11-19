"use strict";
/* =====================================================================
   Importar personas desde un archivo (0.33.0)
   Lee Excel (.xlsx), CSV o texto, una tabla de Word (.docx) o una lista
   pegada. Todo se lee en el navegador: el archivo no sale a ningún sitio.
   Reconoce las columnas por su título y enseña una pantalla de revisión
   antes de guardar nada.
   Tres usos:
   - "base": altas en Personas (tabla empleados).
   - "encuesta": lista solo para una encuesta; no se guarda en la base.
   - "usuarios": cuentas con acceso a la plataforma (0.33.1), con
     usuario y contraseña inicial generados si no vienen.
   La lectura con IA (PDF, fotos, texto libre) queda preparada pero
   apagada hasta que lo apruebe el responsable de protección de datos.
   ===================================================================== */
const IMP_LIB = {
  xlsx: { url: "https://cdn.jsdelivr.net/npm/read-excel-file@9.3.17/bundle/read-excel-file.min.js", global: "readXlsxFile" },
  docx: { url: "https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js", global: "mammoth" }
};
const IMP_TIPOS = { tiendas: "Tiendas", oficinas: "Oficinas", comerciales: "Comerciales", demostradores: "Demostradores" };
const IMP_CAMPOS = {
  completo: "Nombre y apellidos", nombre: "Nombre", apellidos: "Apellidos", correo: "Correo", puesto: "Puesto",
  tipologia: "Tipología", ubicacion: "Ubicación", departamento: "Departamento", responsable: "Responsable", fecha_alta: "Fecha de alta",
  usuario: "Usuario", rol: "Rol", zona: "Zona", password: "Contraseña inicial"
};
const IMP_CAMPOS_USU = ["completo", "nombre", "apellidos", "correo", "usuario", "rol", "zona", "password"];
const IMP_ROLES = { admin: "Administrador", rm: "Regional Manager", marketing: "Retail Marketing" };
const IMP_CAMPOS_ENC = ["completo", "nombre", "apellidos", "correo", "ubicacion", "departamento", "responsable"];
/* Títulos de columna habituales (sin tildes ni mayúsculas). El orden importa:
   «nombre del responsable» es responsable, no nombre. */
const IMP_SIN = [
  ["correo", ["correo", "email", "e mail", "mail", "correo electronico", "direccion de correo", "courriel"]],
  ["responsable", ["responsable", "manager", "jefe", "jefa", "superior", "responsable directo", "mando", "supervisor", "supervisora", "reporta a", "n 1", "n+1", "line manager"]],
  ["fecha_alta", ["fecha alta", "fecha de alta", "alta", "antiguedad", "fecha antiguedad", "fecha de antiguedad", "fecha incorporacion", "fecha de incorporacion", "incorporacion", "start date", "hire date"]],
  ["completo", ["nombre y apellidos", "nombre completo", "apellidos y nombre", "apellidos nombre", "empleado", "empleada", "persona", "trabajador", "trabajadora", "colaborador", "colaboradora", "full name", "nom complet", "nome completo"]],
  ["apellidos", ["apellidos", "apellido", "apellido 1", "apellido 2", "primer apellido", "segundo apellido", "last name", "surname", "nom de famille", "apelidos", "apelido"]],
  ["departamento", ["departamento", "depto", "dpto", "dept", "area", "department", "seccion", "servicio", "direccion"]],
  ["ubicacion", ["ubicacion", "centro", "centro de trabajo", "tienda", "oficina", "sede", "zona", "localizacion", "location", "site", "punto de venta", "corner", "delegacion", "store", "loja", "magasin", "pdv"]],
  ["tipologia", ["tipologia", "tipo", "colectivo", "canal", "segmento", "tipo de empleado", "tipo de centro"]],
  ["usuario", ["usuario", "user", "username", "login", "nombre de usuario", "id de usuario"]],
  ["password", ["contrasena", "contrasena inicial", "password", "clave", "clave inicial"]],
  ["rol", ["rol", "role", "perfil", "perfil de acceso", "acceso", "tipo de usuario"]],
  ["puesto", ["puesto", "cargo", "posicion", "position", "job title", "job", "categoria", "categoria profesional", "funcion", "poste", "funcao"]],
  ["nombre", ["nombre", "name", "first name", "nom", "nome", "prenom", "nombre de pila"]]
];
const impNorm = x => String(x == null ? "" : x).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9@.+]+/g, " ").trim();
const impMail = e => /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]{2,}$/.test(e || "");
const IMP = { abierto: false };

function impCampoDeTitulo(t) {
  const n = impNorm(t); if (!n) return "";
  for (const [campo, ls] of IMP_SIN) if (ls.includes(n)) return campo;
  for (const [campo, ls] of IMP_SIN) if (ls.some(l => l.length > 3 && (n.startsWith(l + " ") || n.endsWith(" " + l) || n.includes(" " + l + " ")))) return campo;
  return "";
}
function impTipologia(v) {
  const n = impNorm(v); if (!n) return "";
  if (/^(tienda|tiendas|retail|store|stores|loja|lojas|magasin|outlet|punto de venta|pdv)/.test(n)) return "tiendas";
  if (/^(oficina|oficinas|office|central|sede|corporativo|headquarters|hq|servicios centrales|bureau)/.test(n)) return "oficinas";
  if (/^(comercial|comerciales|campo|ventas|fuerza de ventas|field|kam|key account|delegado|sales)/.test(n)) return "comerciales";
  if (/^(demostrador|demostradora|demostradores|demo|promotor|promotora|promotores|animador|animadora)/.test(n)) return "demostradores";
  return "";
}
/* Nombre de tienda reconocible: sin la marca de la red delante */
const impClaveTienda = x => impNorm(x).replace(/\b(home and cook|home cook|h c|hc|tienda|outlet|store)\b/g, " ").replace(/\s+/g, " ").trim();
function impTiendaDe(ub) {
  const k = impClaveTienda(ub); if (!k) return null;
  const ts = S.todas && S.todas.length ? S.todas : S.tiendas;
  return ts.find(t => impNorm(t.codigo) === impNorm(ub) && t.codigo)
    || ts.find(t => impClaveTienda(t.nombre) === k)
    || (k.length >= 4 ? ts.find(t => { const kt = impClaveTienda(t.nombre); return kt.length >= 4 && (kt.includes(k) || k.includes(kt)); }) : null)
    || null;
}
function impFecha(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  return "";
}
const impCelda = v => (v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).replace(/\s+/g, " ").trim());

/* ---------- Lectura ---------- */
function impCargarLib(k) {
  const L = IMP_LIB[k];
  if (window[L.global]) return Promise.resolve(window[L.global]);
  return new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = L.url; s.async = true;
    s.onload = () => (window[L.global] ? ok(window[L.global]) : mal(new Error("No se ha podido cargar el lector")));
    s.onerror = () => mal(new Error("No se ha podido cargar el lector. Revisa la conexión y vuelve a intentarlo."));
    document.head.appendChild(s);
  });
}
/* CSV o texto pegado: separador ; , o tabulador; respeta las comillas */
function impTexto(txt) {
  const lineas = String(txt || "").replace(/^﻿/, "").split(/\r?\n/).filter(l => l.trim());
  if (!lineas.length) return [];
  const muestra = lineas.slice(0, 12).join("\n");
  const cuenta = c => (muestra.match(new RegExp(c === "\t" ? "\\t" : "\\" + c, "g")) || []).length;
  const sep = ["\t", ";", ","].sort((a, b) => cuenta(b) - cuenta(a))[0];
  const una = cuenta(sep) ? sep : null;
  return lineas.map(l => {
    if (!una) return [l.trim()];
    const out = []; let cur = "", q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"' && !cur.trim()) q = true;
      else if (ch === una) { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    out.push(cur.trim()); return out;
  });
}
async function impLeerArchivo(f) {
  const nom = (f.name || "").toLowerCase(), ext = nom.split(".").pop();
  if (ext === "xlsx" || ext === "xlsm") {
    const leer = await impCargarLib("xlsx");
    let filas = await leer(f);
    if (filas && !Array.isArray(filas[0]) && Array.isArray(filas) && filas[0] && filas[0].data) filas = filas[0].data;
    return (filas || []).map(r => (r || []).map(impCelda));
  }
  if (ext === "xls") throw new Error("Los Excel antiguos (.xls) no se pueden leer aquí. Ábrelo en Excel y guárdalo como .xlsx o .csv.");
  if (ext === "csv" || ext === "txt" || ext === "tsv") return impTexto(await f.text());
  if (ext === "docx") {
    const m = await impCargarLib("docx"), buf = await f.arrayBuffer();
    const { value } = await m.convertToHtml({ arrayBuffer: buf });
    const doc = new DOMParser().parseFromString(value || "", "text/html");
    const tablas = [...doc.querySelectorAll("table")].map(t => [...t.querySelectorAll("tr")].map(tr => [...tr.children].map(td => impCelda(td.textContent))));
    if (tablas.length) return tablas.sort((a, b) => b.length - a.length)[0];
    const txt = (await m.extractRawText({ arrayBuffer: buf })).value;
    const filas = impTexto(txt);
    if (filas.some(r => r.length > 1)) return filas;
    throw new Error("El Word no tiene ninguna tabla. Pon la lista en una tabla (una persona por fila) o cópiala y pégala aquí.");
  }
  if (ext === "doc") throw new Error("Los Word antiguos (.doc) no se pueden leer aquí. Guárdalo como .docx o copia la tabla y pégala.");
  if (ext === "pdf" || /^(png|jpe?g|heic|webp|gif)$/.test(ext)) throw new Error("Los PDF y las fotos necesitan la lectura con IA, que todavía no está activada. Mientras tanto, copia la tabla y pégala aquí, o pásala a Excel.");
  throw new Error("Este tipo de archivo no se puede leer. Usa Excel (.xlsx), CSV, Word (.docx) o pega la lista.");
}

/* ---------- Interpretación ---------- */
/* Fila de títulos: la primera de las 10 primeras con 2 o más títulos conocidos */
function impPrepararTabla(filas) {
  filas = filas.filter(r => r.some(c => c));
  const ancho = Math.max(0, ...filas.map(r => r.length));
  filas = filas.map(r => Array.from({ length: ancho }, (_, i) => r[i] || ""));
  let h = -1, mejor = 1;
  filas.slice(0, 10).forEach((r, i) => { const n = r.filter(c => impCampoDeTitulo(c)).length; if (n > mejor) { mejor = n; h = i; } });
  let map;
  if (h >= 0) {
    map = filas[h].map(impCampoDeTitulo);
    // Si «nombre» viene solo y no hay apellidos, suele ser el nombre completo
    if (map.includes("nombre") && !map.includes("apellidos") && !map.includes("completo")) {
      const i = map.indexOf("nombre"), datos = filas.slice(h + 1, h + 30).map(r => r[i]).filter(Boolean);
      if (datos.length && datos.filter(x => x.split(" ").length >= 2).length / datos.length > 0.6) map[i] = "completo";
    }
  } else {
    // Sin títulos: correo donde haya @ y nombre completo en la primera columna de texto
    map = Array.from({ length: ancho }, () => "");
    const col = i => filas.slice(0, 30).map(r => r[i]).filter(Boolean);
    for (let i = 0; i < ancho; i++) if (col(i).filter(x => x.includes("@")).length > col(i).length / 2) { map[i] = "correo"; break; }
    for (let i = 0; i < ancho; i++) if (!map[i] && col(i).length && col(i).every(x => !/\d|@/.test(x))) { map[i] = "completo"; break; }
  }
  return { filas, h, map, titulos: h >= 0 ? filas[h] : Array.from({ length: ancho }, (_, i) => "Columna " + (i + 1)) };
}
function impValoresFila(i) {
  const r = IMP.tabla.filas[i], v = {};
  IMP.map.forEach((campo, c) => {
    if (!campo || !r[c]) return;
    if (campo === "correo") { if (!v.correo) v.correo = r[c]; }
    else v[campo] = v[campo] ? v[campo] + " " + r[c] : r[c];
  });
  if (v.completo && !v.nombre) {
    const s = v.completo.trim();
    if (s.includes(",")) { const [ap, no] = s.split(","); v.nombre = no.trim(); v.apellidos = v.apellidos || ap.trim(); }
    else { const p = s.split(/\s+/); v.nombre = p.shift(); v.apellidos = v.apellidos || p.join(" "); }
  }
  const out = {
    nombre: (v.nombre || "").trim(), apellidos: (v.apellidos || "").trim(),
    correo: (v.correo || "").replace(/^mailto:/i, "").replace(/[<>]/g, "").trim().toLowerCase(),
    puesto: (v.puesto || "").trim(), tipologia: impTipologia(v.tipologia), ubicacion: (v.ubicacion || "").trim(),
    departamento: (v.departamento || "").trim(), responsable: (v.responsable || "").trim(), fecha_alta: impFecha(v.fecha_alta),
    usuario: (v.usuario || "").trim().toLowerCase(), rol: v.rol || "", zona: (v.zona || "").trim(), password: (v.password || "").trim()
  };
  return Object.assign(out, IMP.edit[i] || {});
}
/* Lo que se va a guardar y los avisos de cada fila */
function impFilas() {
  if (IMP.modo === "usuarios") return impFilasUsu();
  const T = IMP.tabla; if (!T) return [];
  const base = Array.isArray(S.emp) ? S.emp : [];
  const porMail = new Map(base.filter(e => e.correo).map(e => [e.correo, e]));
  const porNombre = new Map(base.map(e => [impNorm(e.nombre + " " + e.apellidos), e]));
  const vistos = new Set(), out = [];
  for (let i = T.h + 1; i < T.filas.length; i++) {
    const v = impValoresFila(i), avisos = [];
    if (!v.nombre && !v.correo && !v.apellidos) continue;
    if (!v.tipologia) v.tipologia = impTiendaDe(v.ubicacion) ? "tiendas" : v.departamento ? "oficinas" : IMP.tipDef;
    const t = v.tipologia === "tiendas" ? impTiendaDe(v.ubicacion) : null;
    v.tienda_id = t ? t.id : null;
    if (t && !IMP.edit[i]?.ubicacion) v.ubicacion = t.nombre;
    let error = "";
    if (!v.nombre) error = "Falta el nombre";
    if (v.correo && !impMail(v.correo)) { avisos.push("Correo no válido: no recibirá correos"); v.correoMal = true; }
    if (!v.correo) avisos.push("Sin correo: recibirá papeleta");
    if (v.correo && impMail(v.correo)) { if (vistos.has(v.correo)) error = error || "Correo repetido en el archivo"; vistos.add(v.correo); }
    if (IMP.modo === "base") {
      if (!v.ubicacion) avisos.push("Sin ubicación");
      if (v.tipologia === "tiendas" && v.ubicacion && !t) avisos.push("No coincide con ninguna tienda");
      if (v.tipologia === "oficinas" && !v.departamento) avisos.push("Sin departamento");
    }
    const ya = (v.correo && porMail.get(v.correo)) || (!v.correo && porNombre.get(impNorm(v.nombre + " " + v.apellidos))) || null;
    out.push({ i, v, avisos, error, ya });
  }
  // Responsables: se buscan en la base y en el propio archivo
  const enArchivo = new Map();
  out.forEach(f => { if (f.v.correo) enArchivo.set(f.v.correo, f); enArchivo.set(impNorm(f.v.nombre + " " + f.v.apellidos), f); });
  out.forEach(f => {
    const r = f.v.responsable; if (!r) return;
    const k = r.includes("@") ? r.toLowerCase() : impNorm(r);
    f.resp = porMail.get(k) || porNombre.get(k) || null;
    f.respF = f.resp ? null : enArchivo.get(k) || null;
    if (IMP.modo === "base" && !f.resp && !f.respF) f.avisos.push("Responsable no encontrado");
  });
  return out;
}

/* ---------- Usuarios ---------- */
function impRol(v) {
  const n = impNorm(v).replace(/[.+@]/g, " ").replace(/\s+/g, " ").trim(); if (!n) return "";
  if (IMP_ROLES[n]) return n;
  if (/admin|rr ?hh|r r h h|recursos humanos|^hr\b|people|talento/.test(n)) return "admin";
  if (/regional|^rm$|area manager|jefe de zona|zona/.test(n)) return "rm";
  if (/marketing/.test(n)) return "marketing";
  return "";
}
const impUsuarioOk = u => /^[a-z0-9._-]{3,}$/.test(u || "");
function impUsuarioDe(v) {
  const base = v.correo && v.correo.includes("@") ? v.correo.split("@")[0] : [v.nombre, (v.apellidos || "").split(/\s+/)[0]].filter(Boolean).join(".");
  return impNorm(base).replace(/[^a-z0-9._-]+/g, ".").replace(/\.+/g, ".").replace(/^\.|\.$/g, "");
}
function impClave() {
  const A = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", b = new Uint32Array(12);
  crypto.getRandomValues(b);
  return [...b].map(x => A[x % A.length]).join("");
}
function impFilasUsu() {
  const T = IMP.tabla; if (!T) return [];
  const hay = new Set((S.perfiles || []).map(p => p.usuario)), usados = new Set(), out = [];
  for (let i = T.h + 1; i < T.filas.length; i++) {
    const v = impValoresFila(i), avisos = [];
    if (!v.nombre && !v.apellidos && !v.usuario && !v.correo) continue;
    let error = "";
    if (!v.nombre) error = "Falta el nombre";
    const rolLeido = impRol(v.rol);
    v.rol = rolLeido || IMP.rolDef;
    if (v.rol !== "rm") v.zona = v.zona || "";
    if (!rolLeido && !(IMP.edit[i] || {}).rol) avisos.push(`Rol ${v.rol ? "por defecto" : "sin indicar"}: ${IMP_ROLES[v.rol]}`);
    let u = v.usuario || impUsuarioDe(v), auto = !v.usuario;
    if (auto && u) { let k = 2, b = u; while (hay.has(u) || usados.has(u)) u = b + k++; }
    v.usuario = u;
    if (!impUsuarioOk(u)) error = error || "Usuario no válido (minúsculas, números, punto o guion; 3 o más)";
    else if (hay.has(u)) error = error || "Ya existe ese usuario";
    else if (usados.has(u)) error = error || "Usuario repetido en el archivo";
    usados.add(u);
    if (v.password && v.password.length < 8) avisos.push("Contraseña de menos de 8: se genera otra");
    if (!v.password || v.password.length < 8) { IMP.pw[i] = IMP.pw[i] || impClave(); v.password = IMP.pw[i]; v.pwAuto = true; }
    out.push({ i, v, avisos, error, auto });
  }
  return out;
}
function impRevisionUsu() {
  const F = impFilas(), van = F.filter(f => !f.error && !IMP.fuera.has(f.i)), conAviso = F.filter(f => f.error || f.avisos.length).length;
  const ver = IMP.ver === "avisos" ? F.filter(f => f.error || f.avisos.length) : F;
  const celda = (f, k, w) => `<input data-imp-e="${f.i}:${k}" value="${esc(f.v[k] || "")}" style="min-width:${w}px" aria-label="${IMP_CAMPOS[k]}">`;
  return `<div class="imp-h"><div><h2>Revisa los usuarios antes de crearlos</h2>
      <p class="muted">${esc(IMP.nombre || "Lista pegada")} · ${F.length} ${F.length === 1 ? "usuario" : "usuarios"}${conAviso ? ` · ${conAviso} con avisos` : ""}</p></div>
    <button class="btn ghost" data-imp="cerrar">Cerrar</button></div>
  ${impMapa(IMP_CAMPOS_USU)}
  <label class="imp-def">Si no viene el rol o no se entiende:
    <select data-imp-roldef>${Object.entries(IMP_ROLES).map(([k, n]) => `<option value="${k}" ${IMP.rolDef === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
  <div class="imp-barra"><div class="imp-filtro">
      <button class="${IMP.ver === "todas" ? "on" : ""}" data-imp="ver" data-v="todas">Todos · ${F.length}</button>
      <button class="${IMP.ver === "avisos" ? "on" : ""}" data-imp="ver" data-v="avisos">Con avisos · ${conAviso}</button></div>
    <span class="muted">Si no viene, el usuario se forma con el nombre y el primer apellido (o con el correo) y la contraseña se genera.</span></div>
  ${F.length ? `<div class="tablewrap imp-tabla"><table><thead><tr><th><span class="sr">Incluir</span></th><th>Estado</th><th>Nombre</th><th>Apellidos</th><th>Usuario</th><th>Rol</th><th>Zona</th></tr></thead><tbody>
    ${ver.map(f => `<tr class="${!f.error && !IMP.fuera.has(f.i) ? "" : "fila-off"}">
      <td><input type="checkbox" class="chk" data-imp-inc="${f.i}" ${!f.error && !IMP.fuera.has(f.i) ? "checked" : ""} ${f.error ? "disabled" : ""} aria-label="Incluir"></td>
      <td class="imp-est">${f.error ? `<span class="badge err">${esc(f.error)}</span>` : `<span class="badge ok">Nuevo</span>`}${f.avisos.map(a => `<small class="imp-av">${esc(a)}</small>`).join("")}</td>
      <td>${celda(f, "nombre", 90)}</td><td>${celda(f, "apellidos", 120)}</td><td>${celda(f, "usuario", 130)}</td>
      <td><select data-imp-e="${f.i}:rol" aria-label="Rol" style="min-width:150px">${Object.entries(IMP_ROLES).map(([k, n]) => `<option value="${k}" ${f.v.rol === k ? "selected" : ""}>${n}</option>`).join("")}</select></td>
      <td>${celda(f, "zona", 110)}</td></tr>`).join("")}
  </tbody></table></div>` : `<p class="cl-vacio"><b>No se ha encontrado a nadie</b><span class="muted">Elige en «Qué hay en cada columna» dónde está el nombre.</span></p>`}
  <p class="hint">Las tiendas de cada Regional Manager se asignan después, en la tabla de tiendas. Las contraseñas se enseñan una sola vez, al terminar.</p>
  <div class="imp-pie"><button class="btn" data-imp="volver">Elegir otro archivo</button>
    <button class="btn primary" data-imp="usar" ${van.length && !IMP.guardando ? "" : "disabled"}>${IMP.guardando ? `Creando ${IMP.hechos || 0} de ${van.length}…` : `Crear ${van.length} ${van.length === 1 ? "usuario" : "usuarios"}`}</button></div>`;
}
/* Se crean de uno en uno: el sistema de acceso de Supabase limita las altas
   seguidas. Si salta el límite, se para y se dice cuántos faltan. */
async function impCrearUsuarios(F) {
  const cli = sb.demo ? sb : window.supabase.createClient(K.supabaseUrl, K.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false, storageKey: "sc-alta-lote-" + Date.now() } });
  const res = []; let parado = "";
  IMP.hechos = 0;
  for (const f of F) {
    const v = f.v, nombre = `${v.nombre} ${v.apellidos}`.trim();
    if (parado) { res.push({ v, nombre, estado: "Sin crear: " + parado }); continue; }
    try {
      const { data, error } = await cli.auth.signUp({ email: emailDe(v.usuario), password: v.password });
      if (error) throw error;
      if (!data.user || (data.user.identities && !data.user.identities.length)) throw new Error("Ese usuario ya existe en el sistema de acceso.");
      const r = await sb.from("perfiles").insert({ id: data.user.id, usuario: v.usuario, nombre, rol: v.rol, zona: v.rol === "rm" ? v.zona || null : null });
      if (r.error) throw r.error;
      res.push({ v, nombre, ok: true, estado: "Creado" });
    } catch (e) {
      const m = (e && (e.message || e)) + "";
      if (/rate limit|too many|429/i.test(m) || (e && e.status === 429)) { parado = "el sistema de acceso ha puesto un límite de altas seguidas. Espera una hora y vuelve a importar el archivo: los ya creados saldrán como existentes."; res.push({ v, nombre, estado: "Sin crear: " + parado }); }
      else res.push({ v, nombre, estado: "Error: " + traducirError(e) });
    }
    IMP.hechos++; impPintar();
  }
  const n = res.filter(r => r.ok).length;
  if (n) log(`Alta de ${n} usuarios desde un archivo`);
  return res;
}
function impResultadoUsu() {
  const R = IMP.res || [], ok = R.filter(r => r.ok);
  return `<div class="imp-h"><div><h2>${ok.length} ${ok.length === 1 ? "usuario creado" : "usuarios creados"}${R.length > ok.length ? ` · ${R.length - ok.length} sin crear` : ""}</h2>
      <p class="muted">Las contraseñas solo se ven ahora. Descárgalas, comunícalas a cada persona por un canal privado y borra el archivo. Cada uno puede cambiar la suya desde su nombre, arriba a la derecha.</p></div></div>
  <div class="tablewrap imp-tabla"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Contraseña inicial</th><th>Estado</th></tr></thead><tbody>
    ${R.map(r => `<tr class="${r.ok ? "" : "fila-off"}"><td>${esc(r.nombre)}</td><td><code>${esc(r.v.usuario)}</code></td><td>${esc(IMP_ROLES[r.v.rol])}</td>
      <td>${r.ok ? `<code>${esc(r.v.password)}</code>` : "–"}</td><td>${r.ok ? `<span class="badge ok">Creado</span>` : `<small class="imp-av">${esc(r.estado)}</small>`}</td></tr>`).join("")}
  </tbody></table></div>
  <div class="imp-pie"><button class="btn" data-imp="descUsu" ${ok.length ? "" : "disabled"}>Descargar usuarios y contraseñas</button>
    <button class="btn primary" data-imp="terminar">Terminar</button></div>`;
}
function impDescargarUsu() {
  const filas = [["Nombre", "Usuario", "Rol", "Contraseña inicial"]].concat((IMP.res || []).filter(r => r.ok).map(r => [r.nombre, r.v.usuario, IMP_ROLES[r.v.rol], r.v.password]));
  const csv = "\uFEFF" + filas.map(f => f.map(x => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = "usuarios-pippole.csv"; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- Pantalla ---------- */
function impMapa(campos) {
  const T = IMP.tabla;
  return `<section class="imp-map"><h3>Qué hay en cada columna</h3>
    <div class="imp-cols">${T.titulos.map((t, c) => {
      const ej = T.filas.slice(T.h + 1).map(r => r[c]).find(Boolean) || "";
      const ocultar = IMP.modo === "usuarios" && IMP.map[c] === "password";
      return `<label><span>${esc(t || "Columna " + (c + 1))}</span><small>${ocultar ? "••••••" : esc(ej.slice(0, 32))}</small>
        <select data-imp-col="${c}"><option value="">No usar</option>${campos.map(k => `<option value="${k}" ${IMP.map[c] === k ? "selected" : ""}>${IMP_CAMPOS[k]}</option>`).join("")}</select></label>`;
    }).join("")}</div></section>`;
}
function abrirImportador(modo, op) {
  Object.assign(IMP, { abierto: true, modo, op: op || {}, paso: "origen", tabla: null, map: [], edit: {}, fuera: new Set(),
    tipDef: (op && op.tipDef) || "tiendas", rolDef: "rm", pw: {}, res: null, hechos: 0, ver: "todas", nombre: "", error: "", leyendo: false, guardando: false, pegado: "" });
  impPintar();
}
function impCerrar() { IMP.abierto = false; const o = document.getElementById("impOv"); if (o) o.remove(); document.body.classList.remove("imp-on"); }
function impPintar() {
  if (!IMP.abierto) return;
  let o = document.getElementById("impOv");
  if (!o) {
    o = document.createElement("div"); o.id = "impOv"; o.className = "imp-ov"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
    document.body.appendChild(o); document.body.classList.add("imp-on");
    o.addEventListener("click", impClic); o.addEventListener("change", impCambio); o.addEventListener("input", impEscribe);
    o.addEventListener("dragover", e => { if (IMP.paso !== "origen") return; e.preventDefault(); const z = o.querySelector(".imp-zona"); if (z) z.classList.add("on"); });
    o.addEventListener("dragleave", e => { const z = o.querySelector(".imp-zona"); if (z && !z.contains(e.relatedTarget)) z.classList.remove("on"); });
    o.addEventListener("drop", e => { if (IMP.paso !== "origen") return; e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) impDesdeArchivo(f); });
  }
  const y = o.scrollTop, act = document.activeElement, k = act && act.dataset && (act.dataset.impE || act.dataset.impInc || act.dataset.impCol);
  const tw = o.querySelector(".imp-tabla"), x = tw ? tw.scrollLeft : 0;
  o.innerHTML = `<div class="imp">${IMP.paso === "origen" ? impOrigen() : IMP.paso === "hecho" ? impResultadoUsu() : IMP.modo === "usuarios" ? impRevisionUsu() : impRevision()}</div>`;
  o.scrollTop = y;
  const tw2 = o.querySelector(".imp-tabla"); if (tw2) tw2.scrollLeft = x;
  if (k) { const n = o.querySelector(`[data-imp-e="${k}"],[data-imp-inc="${k}"],[data-imp-col="${k}"]`); if (n) n.focus({ preventScroll: true }); }
}
function impOrigen() {
  const base = IMP.modo === "base", usu = IMP.modo === "usuarios";
  return `<div class="imp-h"><div><h2>${usu ? "Importar usuarios" : base ? "Importar personas" : "Lista para esta encuesta"}</h2>
      <p class="muted">${usu ? "Crea de una vez las cuentas de quienes entran en la plataforma: nombre, usuario, rol y zona. Si el archivo no trae usuario o contraseña, se generan. Antes de crear nada verás la lista y podrás corregirla." : base ? "Se añaden a Personas. Antes de guardar verás lo que se ha entendido de cada columna y podrás corregirlo." : "Solo se usa para esta encuesta: no se guarda en Personas. Del correo se guarda que se le ha invitado, nunca qué código recibió."}</p></div>
    <button class="btn ghost" data-imp="cerrar" aria-label="Cerrar">Cerrar</button></div>
  <label class="imp-zona${IMP.leyendo ? " leyendo" : ""}">
    <input type="file" id="impFile" accept=".xlsx,.xlsm,.xls,.csv,.txt,.tsv,.docx,.doc,.pdf,image/*" hidden>
    <b>${IMP.leyendo ? "Leyendo el archivo…" : "Arrastra aquí el archivo o pulsa para elegirlo"}</b>
    <small>Excel (.xlsx), CSV o Word (.docx) con una tabla. Una persona por fila; con títulos de columna, mejor.</small>
  </label>
  ${IMP.error ? `<p class="hint aviso" role="alert">${esc(IMP.error)}</p>` : ""}
  <div class="imp-pegar"><label>O pega la lista copiada desde Excel
    <textarea id="impPega" rows="5" placeholder="${usu ? "Nombre;Apellidos;Rol;Zona\nAna;Ortega Lozano;Regional Manager;Norte" : "Nombre;Apellidos;Correo;Puesto;Ubicación\nAna;Ortega Lozano;ana.ortega@empresa.com;Store Manager;Tienda Málaga"}">${esc(IMP.pegado)}</textarea></label>
    <button class="btn" data-imp="pegado">Leer lo pegado</button></div>
  <div class="imp-ia"><button class="btn" disabled aria-describedby="impIaT">Leer cualquier documento con IA</button>
    <small id="impIaT">PDF, fotos o texto sin tabla. Se activará cuando el responsable de protección de datos lo apruebe: el documento tendría que salir a un servicio externo.</small></div>
  ${base || usu ? `<p class="hint">¿No tienes plantilla? <a href="#" data-imp="modelo">Descarga el modelo</a> con las columnas que reconoce Pippole.</p>` : ""}`;
}
function impRevision() {
  const base = IMP.modo === "base", T = IMP.tabla, F = impFilas();
  const incluida = f => !f.error && !IMP.fuera.has(f.i);
  const van = F.filter(incluida), nuevos = van.filter(f => !f.ya).length, act = van.length - nuevos;
  const conAviso = F.filter(f => f.error || f.avisos.length).length;
  const campos = base ? Object.keys(IMP_CAMPOS).filter(k => !IMP_CAMPOS_USU.includes(k) || ["completo", "nombre", "apellidos", "correo"].includes(k)) : IMP_CAMPOS_ENC;
  const ver = IMP.ver === "avisos" ? F.filter(f => f.error || f.avisos.length) : F;
  const max = 300, vistas = ver.slice(0, max);
  const sinTip = !IMP.map.includes("tipologia");
  const celda = (f, k, w) => `<input data-imp-e="${f.i}:${k}" value="${esc(f.v[k] || "")}" ${w ? `style="min-width:${w}px"` : ""} aria-label="${IMP_CAMPOS[k]}">`;
  return `<div class="imp-h"><div><h2>Revisa antes de ${base ? "guardar" : "usarla"}</h2>
      <p class="muted">${esc(IMP.nombre || "Lista pegada")} · ${F.length} ${F.length === 1 ? "persona" : "personas"}${conAviso ? ` · ${conAviso} con avisos` : ""}</p></div>
    <button class="btn ghost" data-imp="cerrar">Cerrar</button></div>
  ${impMapa(campos)}
  ${base && sinTip ? `<section class="imp-map"><label class="imp-def">Si no viene la tipología, la ubicación no es una tienda y no hay departamento:
      <select data-imp-tipdef>${Object.entries(IMP_TIPOS).map(([k, n]) => `<option value="${k}" ${IMP.tipDef === k ? "selected" : ""}>${n}</option>`).join("")}</select></label></section>` : ""}
  <div class="imp-barra"><div class="imp-filtro">
      <button class="${IMP.ver === "todas" ? "on" : ""}" data-imp="ver" data-v="todas">Todas · ${F.length}</button>
      <button class="${IMP.ver === "avisos" ? "on" : ""}" data-imp="ver" data-v="avisos">Con avisos · ${conAviso}</button></div>
    <span class="muted">${base ? `${nuevos} ${nuevos === 1 ? "nueva" : "nuevas"} · ${act} ${act === 1 ? "ya estaba" : "ya estaban"}${act ? " (se actualiza lo que cambie)" : ""}` : `${van.filter(f => impMail(f.v.correo)).length} con correo · ${van.filter(f => !impMail(f.v.correo)).length} papeleta`}</span></div>
  ${F.length ? `<div class="tablewrap imp-tabla"><table><thead><tr><th><span class="sr">Incluir</span></th><th>Estado</th><th>Nombre</th><th>Apellidos</th><th>Correo</th>${base ? "<th>Puesto</th><th>Tipología</th>" : ""}<th>Ubicación</th><th>Departamento</th><th>Responsable</th></tr></thead><tbody>
    ${vistas.map(f => `<tr class="${incluida(f) ? "" : "fila-off"}">
      <td><input type="checkbox" class="chk" data-imp-inc="${f.i}" ${incluida(f) ? "checked" : ""} ${f.error ? "disabled" : ""} aria-label="Incluir"></td>
      <td class="imp-est">${f.error ? `<span class="badge err">${esc(f.error)}</span>` : base ? (f.ya ? `<span class="badge">Ya está</span>` : `<span class="badge ok">Nueva</span>`) : `<span class="badge ok">${impMail(f.v.correo) ? "Correo" : "Papeleta"}</span>`}
        ${f.avisos.filter(a => base || !/^Sin correo/.test(a)).map(a => `<small class="imp-av">${esc(a)}</small>`).join("")}</td>
      <td>${celda(f, "nombre", 90)}</td><td>${celda(f, "apellidos", 120)}</td><td>${celda(f, "correo", 190)}</td>
      ${base ? `<td>${celda(f, "puesto", 120)}</td><td><select data-imp-e="${f.i}:tipologia" aria-label="Tipología" style="min-width:130px">${Object.entries(IMP_TIPOS).map(([k, n]) => `<option value="${k}" ${f.v.tipologia === k ? "selected" : ""}>${n}</option>`).join("")}</select></td>` : ""}
      <td>${celda(f, "ubicacion", 130)}</td><td>${celda(f, "departamento", 110)}</td><td>${celda(f, "responsable", 130)}</td></tr>`).join("")}
  </tbody></table></div>${ver.length > max ? `<p class="hint">Se muestran las ${max} primeras de ${ver.length}. Se ${base ? "guardan" : "usan"} todas las marcadas.</p>` : ""}`
    : `<p class="cl-vacio"><b>No se ha encontrado a nadie</b><span class="muted">Elige en «Qué hay en cada columna» dónde está el nombre.</span></p>`}
  <div class="imp-pie">
    <button class="btn" data-imp="volver">Elegir otro archivo</button>
    <button class="btn primary" data-imp="usar" ${van.length && !IMP.guardando ? "" : "disabled"}>${IMP.guardando ? "Guardando…" : base ? `Guardar ${van.length} ${van.length === 1 ? "persona" : "personas"}` : `Usar ${van.length} ${van.length === 1 ? "persona" : "personas"}`}</button>
  </div>`;
}

async function impDesdeArchivo(f) {
  IMP.leyendo = true; IMP.error = ""; impPintar();
  try {
    const filas = await impLeerArchivo(f);
    impConTabla(filas, f.name);
  } catch (e) { IMP.leyendo = false; IMP.error = (e && e.message) || "No se ha podido leer el archivo."; impPintar(); }
}
function impConTabla(filas, nombre) {
  IMP.leyendo = false;
  const T = impPrepararTabla(filas || []);
  if (!T.filas.length || T.filas.length <= T.h + 1) { IMP.error = "El archivo está vacío o solo tiene títulos."; impPintar(); return; }
  const map = T.map.map(c => {
    if (IMP.modo === "usuarios") {
      if (c === "puesto") return T.map.includes("rol") ? "" : "rol";
      if (c === "ubicacion") return T.map.includes("zona") ? "" : "zona";
      return IMP_CAMPOS_USU.includes(c) ? c : "";
    }
    if (c === "rol") return T.map.includes("puesto") ? "" : "puesto";
    return ["usuario", "password", "zona"].includes(c) ? "" : c;
  });
  Object.assign(IMP, { tabla: T, map, edit: {}, fuera: new Set(), pw: {}, nombre: nombre || "", paso: "revisar", ver: "todas", error: "" });
  impPintar();
}
function impClic(e) {
  const b = e.target.closest("[data-imp]"); if (!b || b.disabled) return;
  e.preventDefault();
  const a = b.dataset.imp;
  if (a === "cerrar") return impCerrar();
  if (a === "pegado") { const v = (document.getElementById("impPega") || {}).value || ""; IMP.pegado = v; if (!v.trim()) { IMP.error = "Pega primero la lista."; return impPintar(); } return impConTabla(impTexto(v), "Lista pegada"); }
  if (a === "volver") { IMP.paso = "origen"; IMP.tabla = null; return impPintar(); }
  if (a === "ver") { IMP.ver = b.dataset.v; return impPintar(); }
  if (a === "modelo") return impModelo();
  if (a === "usar") return impUsar();
  if (a === "descUsu") return impDescargarUsu();
  if (a === "terminar") { impCerrar(); if (typeof recargar === "function") recargar(); return; }
}
function impCambio(e) {
  const el = e.target;
  if (el.id === "impFile") { const f = el.files && el.files[0]; if (f) impDesdeArchivo(f); return; }
  if (el.dataset.impCol !== undefined) { IMP.map[Number(el.dataset.impCol)] = el.value; IMP.edit = {}; return impPintar(); }
  if (el.dataset.impTipdef !== undefined) { IMP.tipDef = el.value; return impPintar(); }
  if (el.dataset.impRoldef !== undefined) { IMP.rolDef = el.value; return impPintar(); }
  if (el.dataset.impInc !== undefined) {
    const i = Number(el.dataset.impInc);
    if (el.checked) IMP.fuera.delete(i); else IMP.fuera.add(i);
    return impPintar();
  }
  if (el.dataset.impE) {
    const [i, k] = el.dataset.impE.split(":");
    IMP.edit[i] = Object.assign({}, IMP.edit[i], { [k]: k === "correo" ? el.value.trim().toLowerCase() : el.value.trim() });
    setTimeout(impPintar, 0); return;
  }
}
function impEscribe(e) { if (e.target.id === "impPega") IMP.pegado = e.target.value; }
function impModelo() {
  const filas = IMP.modo === "usuarios" ? [["Nombre", "Apellidos", "Usuario", "Rol", "Zona"],
    ["Ana", "Ortega Lozano", "", "Regional Manager", "Norte"], ["Marta", "Ruiz Pastor", "marta.ruiz", "Administrador", ""], ["Hugo", "Vidal Campos", "", "Retail Marketing", ""]] : [["Nombre", "Apellidos", "Correo", "Puesto", "Tipología", "Ubicación", "Departamento", "Responsable", "Fecha de alta"],
    ["Ana", "Ortega Lozano", "ana.ortega@empresa.com", "Store Manager", "Tiendas", "Tienda Málaga", "", "", "01/03/2024"],
    ["Hugo", "Vidal Campos", "hugo.vidal@empresa.com", "Vendedor", "Tiendas", "Tienda Málaga", "", "Ana Ortega Lozano", "15/09/2025"],
    ["Marta", "Ruiz Pastor", "marta.ruiz@empresa.com", "Controller", "Oficinas", "Oficina Barcelona", "Finanzas", "", "10/01/2022"]];
  const csv = "﻿" + filas.map(f => f.map(x => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = IMP.modo === "usuarios" ? "modelo-usuarios-pippole.csv" : "modelo-personas-pippole.csv"; document.body.appendChild(a); a.click(); a.remove();
}
async function impUsar() {
  const F = impFilas().filter(f => !f.error && !IMP.fuera.has(f.i));
  if (!F.length) return;
  if (IMP.modo === "usuarios") {
    IMP.guardando = true; IMP.hechos = 0; impPintar();
    IMP.res = await impCrearUsuarios(F);
    IMP.guardando = false; IMP.paso = "hecho"; impPintar();
    return;
  }
  if (IMP.modo === "encuesta") {
    const lista = F.map(f => ({ nombre: (f.v.nombre + " " + f.v.apellidos).trim(), e: impMail(f.v.correo) ? f.v.correo : "", t: f.v.tienda_id || (impTiendaDe(f.v.ubicacion) || {}).id || null,
      g: f.v.departamento || f.v.ubicacion || null, r: f.v.responsable || null }));
    const cb = IMP.op.alUsar, nombre = IMP.nombre; impCerrar();
    if (cb) cb(lista, nombre);
    return;
  }
  IMP.guardando = true; impPintar();
  try {
    const r = await empGuardarImportados(F);
    impCerrar();
    if (IMP.op.alUsar) IMP.op.alUsar(r);
  } catch (e) { IMP.guardando = false; IMP.error = ""; impPintar(); alert("No se ha podido guardar: " + traducirError(e)); }
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && IMP.abierto && !IMP.guardando && IMP.paso !== "hecho") impCerrar(); });
