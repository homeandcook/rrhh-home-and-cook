"use strict";
// Modo demostración: imita la parte de Supabase que usa la app, con los datos
// en el navegador (sessionStorage). Aplica las mismas reglas de acceso:
// un RM solo ve y edita sus tiendas; solo el admin gestiona usuarios y tiendas.
window.crearClienteDemo = function () {
  const KEY = "sc-demo-db";
  const uid = () => "u" + Math.random().toString(36).slice(2, 12);
  let db;
  try { db = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
  if (!db) {
    const u = [["admin", "RR.HH. (demo)", "admin", ""], ["rm.es", "RM España (demo)", "rm", "España"],
               ["rm.pt", "RM Portugal y Tui (demo)", "rm", "Portugal y Tui"], ["marketing", "Retail Marketing (demo)", "marketing", ""]]
      .map(([usuario, nombre, rol, zona]) => ({ id: uid(), usuario, nombre, rol, zona, activo: true, creado: new Date().toISOString() }));
    const auth = u.map(p => ({ id: p.id, email: p.usuario + "@demo", password: "demo1234" }));
    const tiendas = SC.CONFIG.red.map(x => ({
      id: uid(), anio: SC.CONFIG.anio, nombre: x.nombre, codigo: x.codigo,
      rm_id: u.find(p => p.usuario === "rm." + x.rm).id,
      version: 1, actualizado: new Date().toISOString(), actualizado_por: null,
      datos: { objetivos: { s1: {}, fy: {} }, resultados: { s1: {}, fy: {} }, objetivosValidados: null, personas: [] } }));
    db = { perfiles: u, auth, tiendas, actividad: [], campanas: [], invitaciones: [], documentos: [], sesion: null, seq: 1 };
  }
  db.documentos = db.documentos || [];
  /* Equipos de ejemplo para probar los envíos (nombres inventados y correos
     en ejemplo.com, que no existe). Una persona por tienda sin correo. */
  if (!db.equiposDemo) {
    const N = ["Lucía", "Hugo", "Martina", "Pablo", "Sofía", "Álvaro", "Carla", "Diego", "Nerea", "Iván", "Paula", "Rubén", "Inês", "Tiago", "Beatriz", "João"];
    const A = ["Ortega", "Vidal", "Campos", "Serrano", "Rey", "Prieto", "Lozano", "Pastor", "Costa", "Silva", "Mora", "Nieto"];
    const P = ["Store Manager", "Assistant Store Manager", "Vendedor/a", "Vendedor/a", "Vendedor/a", "Vendedor/a", "Vendedor/a"];
    const plano = x => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    db.tiendas.forEach((t, k) => {
      const n = 6 + (k % 3);
      t.datos.equipo = Array.from({ length: n }, (_, i) => {
        const nom = N[(k * 3 + i) % N.length], ap = A[(k + i * 5) % A.length];
        return { nombre: `${nom} ${ap}`, puesto: P[Math.min(i, P.length - 1)], email: i === n - 1 ? "" : `${plano(nom)}.${plano(ap)}${k}@ejemplo.com` };
      });
    });
    db.equiposDemo = true;
  }
  ["dr_ciclos", "dr_evaluadores", "dr_personas", "dr_decisiones"].forEach(k => { db[k] = db[k] || []; });
  /* Personas (0.33): los equipos de tienda pasan a la tabla empleados, y se
     añaden oficinas, comerciales y demostradores de ejemplo. Inventados. */
  if (!db.empleados) {
    const ahora = new Date().toISOString(), E = [];
    const alta = (o) => { const r = Object.assign({ id: uid(), empresa_id: "e-demo", apellidos: "", correo: null, puesto: "", tipologia: "tiendas", ubicacion: "", tienda_id: null,
      departamento: "", responsable_id: null, fecha_alta: null, fecha_baja: null, activo: true, creado: ahora, actualizado: ahora }, o); E.push(r); return r; };
    db.tiendas.forEach(t => {
      let sm = null;
      (t.datos.equipo || []).forEach(x => {
        const [n, ...ap] = x.nombre.split(" ");
        const r = alta({ nombre: n, apellidos: ap.join(" "), correo: x.email || null, puesto: x.puesto, ubicacion: t.nombre, tienda_id: t.id });
        if (x.puesto === "Store Manager") sm = r; else if (sm) r.responsable_id = sm.id;
      });
    });
    const dg = alta({ nombre: "Elena", apellidos: "Marín Soto", correo: "elena.marin@ejemplo.com", puesto: "Directora general", tipologia: "oficinas", ubicacion: "Oficina central", departamento: "Dirección" });
    [["Finanzas", "Jorge", "Pardo Gil", ["Controller", "Analista financiera", "Contable"]], ["Marketing", "Irene", "Bravo Ruiz", ["Brand manager", "Diseñador", "Community manager"]],
     ["Recursos Humanos", "Sergio", "Lago Peña", ["Técnica de selección", "Administración de personal"]], ["Operaciones", "Clara", "Fuentes Roca", ["Logística", "Compras", "Atención al cliente"]]]
      .forEach(([dep, n, ap, ps], k) => {
        const jefe = alta({ nombre: n, apellidos: ap, correo: `${n.toLowerCase()}.${ap.split(" ")[0].toLowerCase()}@ejemplo.com`, puesto: "Responsable de " + dep, tipologia: "oficinas", ubicacion: "Oficina central", departamento: dep, responsable_id: dg.id });
        ps.forEach((pu, i) => alta({ nombre: ["Nuria", "Óscar", "Lidia", "Marcos", "Eva", "Raúl", "Alba", "Gonzalo", "Sara", "Iker", "Noelia"][(k * 3 + i) % 11], apellidos: ["Cano", "Rubio", "Vega", "Molina", "Cruz"][(k + i) % 5] + " " + ["Díaz", "Ibáñez", "León"][i % 3],
          correo: i === 2 && k === 3 ? null : `persona.oficina${k}${i}@ejemplo.com`, puesto: pu, tipologia: "oficinas", ubicacion: "Oficina central", departamento: dep, responsable_id: jefe.id }));
      });
    const jv = alta({ nombre: "Tomás", apellidos: "Herrera Cid", correo: "tomas.herrera@ejemplo.com", puesto: "Jefe de ventas", tipologia: "comerciales", ubicacion: "Zona Centro", responsable_id: dg.id });
    [["Zona Norte", "Andrea", "Sanz Ortiz"], ["Zona Sur", "Bruno", "Gallego Mena"], ["Zona Este", "Celia", "Ramos Vila"], ["Zona Centro", "Daniel", "Nieto Paz"], ["Portugal", "Rita", "Lopes Faria"]]
      .forEach(([z, n, ap], i) => alta({ nombre: n, apellidos: ap, correo: `comercial${i}@ejemplo.com`, puesto: "Comercial de zona", tipologia: "comerciales", ubicacion: z, responsable_id: jv.id }));
    const cd = alta({ nombre: "Marina", apellidos: "Ferrer Luna", correo: "marina.ferrer@ejemplo.com", puesto: "Coordinadora de demostradores", tipologia: "demostradores", ubicacion: "Madrid", responsable_id: jv.id });
    [["Córner Castellana", "Lola", "Peña Ríos"], ["Córner Preciados", "Félix", "Romero Gil"], ["Córner Diagonal", "Gema", "Soler Vidal"], ["Córner Nervión", "Héctor", "Lara Mesa"], ["Córner Gran Vía", "Ana", "Pons Rey"], ["Córner Sanchinarro", "Pau", "Mir Bosch"]]
      .forEach(([c, n, ap], i) => alta({ nombre: n, apellidos: ap, correo: i === 5 ? null : `demo${i}@ejemplo.com`, puesto: "Demostrador/a", tipologia: "demostradores", ubicacion: c, responsable_id: cd.id }));
    db.empleados = E;
    db.empresas = [{ id: "e-demo", slug: "principal", nombre: "Empresa de demostración", marca: {}, activa: true, creado: ahora }];
  }
  /* Employer Branding (0.36): algunas tiendas ya vinculadas con Google (inventado) */
  if (!db.resenas_sitios) {
    db.resenas_sitios = db.tiendas.slice(0, 6).map((t, k) => ({ id: uid(), empresa_id: "e-demo", nombre: t.nombre, tipo: "tienda", tienda_id: t.id, place_id: "DEMOplace" + String(k).padStart(6, "0"), direccion: "Calle de ejemplo " + (k + 1), creado: new Date().toISOString() }));
    db.resenas_sitios.push({ id: uid(), empresa_id: "e-demo", nombre: "Oficina central", tipo: "oficina", tienda_id: null, place_id: "DEMOplace000099", direccion: "Avenida de ejemplo 10", creado: new Date().toISOString() });
  }
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(db));
  save();
  const yo = () => db.perfiles.find(p => db.sesion && p.id === db.sesion.user.id && p.activo);
  const rol = () => (yo() || {}).rol || null;
  const clone = x => JSON.parse(JSON.stringify(x));

  const visible = {
    perfiles: r => rol() === "admin" || (db.sesion && r.id === db.sesion.user.id),
    tiendas: r => rol() === "admin" || (rol() === "rm" && r.rm_id === db.sesion.user.id),
    actividad: r => rol() === "admin" || (db.sesion && r.usuario_id === db.sesion.user.id),
    campanas: r => (rol() === "admin" || rol() === "rm") || (rol() === "marketing" && r.tipo === "mystery"),
    documentos: () => !!rol(),
    resenas_sitios: () => rol() === "admin",
    empresas: () => !!rol(),
    empleados: r => rol() === "admin" || (rol() === "rm" && !!db.tiendas.find(t => t.id === r.tienda_id && t.rm_id === db.sesion.user.id)),
    dr_ciclos: () => rol() === "admin", dr_evaluadores: () => rol() === "admin", dr_personas: () => rol() === "admin", dr_decisiones: () => rol() === "admin",
    invitaciones: r => {
      if (rol() === "admin") return true;
      if (rol() === "marketing") { const c = db.campanas.find(x => x.id === r.campana_id); return !!(c && c.tipo === "mystery"); }
      const t = db.tiendas.find(x => x.id === r.tienda_id); return !!(t && db.sesion && t.rm_id === db.sesion.user.id); }
  };
  const err = m => ({ data: null, error: { message: m } });
  const demoNormCod = c => { const v = String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return v.length === 8 ? v.slice(0, 4) + "-" + v.slice(4) : ""; };

  class Q {
    constructor(t) { this.t = t; this.op = "select"; this.f = []; this.ret = false; this.one = null; this.ord = null; this.lim = null; }
    select() { if (this.op !== "select") this.ret = true; return this; }
    insert(v) { this.op = "insert"; this.v = v; return this; }
    update(v) { this.op = "update"; this.v = v; return this; }
    delete() { this.op = "delete"; return this; }
    eq(c, v) { this.f.push(r => r[c] === v); return this; }
    gte(c, v) { this.f.push(r => r[c] >= v); return this; }
    lte(c, v) { this.f.push(r => r[c] <= v); return this; }
    in(c, vs) { this.f.push(r => (vs || []).includes(r[c])); return this; }
    order(c, o) { this.ord = [c, !(o && o.ascending === false)]; return this; }
    limit(n) { this.lim = n; return this; }
    single() { this.one = "single"; return this; }
    maybeSingle() { this.one = "maybe"; return this; }
    then(res, rej) { return new Promise(r => setTimeout(() => r(this.run()), 60)).then(res, rej); }
    run() {
      if (!db.sesion) return err("No autenticado");
      const T = db[this.t], vis = visible[this.t], match = r => vis(r) && this.f.every(fn => fn(r));
      let out;
      if (this.op === "select") {
        out = T.filter(match);
        if (this.ord) { const [c, asc] = this.ord; out.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)); }
        if (this.lim) out = out.slice(0, this.lim);
      } else if (this.op === "insert") {
        if (this.t === "actividad") { if (!rol()) return err("Sin permiso"); }
        else if (this.t === "invitaciones") {
          const ok = (Array.isArray(this.v) ? this.v : [this.v]).every(v => {
            if (rol() === "admin") return true;
            const t = db.tiendas.find(x => x.id === v.tienda_id);
            return !!(t && t.rm_id === db.sesion.user.id);
          });
          if (!ok) return err("new row violates row-level security policy");
        }
        else if (rol() !== "admin") return err("new row violates row-level security policy");
        if (this.t === "empleados") {
          const ms = (Array.isArray(this.v) ? this.v : [this.v]).map(v => (v.correo || "").trim().toLowerCase()).filter(Boolean);
          if (new Set(ms).size < ms.length || ms.some(m => db.empleados.some(e => e.correo === m))) return err('duplicate key value violates unique constraint "empleados_correo"');
        }
        const rows = (Array.isArray(this.v) ? this.v : [this.v]).map(v => {
          const r = clone(v);
          if (this.t === "tiendas") Object.assign(r, { id: r.id || uid(), version: 1, actualizado: new Date().toISOString(), datos: r.datos || {} });
          if (this.t === "actividad") Object.assign(r, { id: db.seq++, fecha: new Date().toISOString(), usuario_id: db.sesion.user.id });
          if (this.t === "campanas" || this.t === "invitaciones") Object.assign(r, { id: r.id || uid(), creado: new Date().toISOString() });
          if (this.t.startsWith("dr_")) {
            const base = { datos: {}, encuesta: {}, config: {}, manual: false,
              estado: this.t === "dr_ciclos" ? "abierto" : this.t === "dr_decisiones" ? "pendiente" : "borrador" };
            const ahora = new Date().toISOString();
            Object.keys(base).forEach(k => { if (r[k] === undefined) r[k] = base[k]; });
            Object.assign(r, { id: r.id || uid(), creado: r.creado || ahora, actualizado: ahora });
          }
          if (this.t === "documentos") Object.assign(r, { actualizado: new Date().toISOString(), actualizado_por: db.sesion.user.id });
          if (this.t === "empleados") {
            r.correo = (r.correo || "").trim().toLowerCase() || null;
            Object.assign(r, Object.assign({ apellidos: "", puesto: "", tipologia: "tiendas", ubicacion: "", tienda_id: null, departamento: "", responsable_id: null, fecha_alta: null, fecha_baja: null, activo: true }, r),
              { id: r.id || uid(), empresa_id: "e-demo", creado: new Date().toISOString(), actualizado: new Date().toISOString() });
          }
          if (this.t === "perfiles") { if (db.perfiles.some(p => p.usuario === r.usuario)) throw new Error("dup"); Object.assign(r, { activo: r.activo !== false, creado: new Date().toISOString() }); }
          return r;
        });
        T.push(...rows); out = rows;
      } else if (this.op === "update") {
        if ((this.t === "perfiles" || this.t === "documentos" || this.t === "empleados") && rol() !== "admin") return err("Sin permiso");
        out = T.filter(match);
        out.forEach(r => {
          const v = clone(this.v);
          if (this.t === "tiendas") { if (rol() === "rm") { delete v.rm_id; delete v.anio; } delete v.version; Object.assign(r, v, { version: r.version + 1, actualizado: new Date().toISOString(), actualizado_por: db.sesion.user.id }); }
          else if (this.t === "documentos") Object.assign(r, v, { actualizado: new Date().toISOString(), actualizado_por: db.sesion.user.id });
          else Object.assign(r, v);
        });
      } else if (this.op === "delete") {
        if (rol() !== "admin") return err("Sin permiso");
        out = T.filter(match); db[this.t] = T.filter(r => !out.includes(r));
      }
      save();
      out = clone(out);
      if (this.one === "single") return out.length === 1 ? { data: out[0], error: null } : err("No se ha encontrado la fila");
      if (this.one === "maybe") return { data: out[0] || null, error: null };
      return { data: this.op === "select" || this.ret ? out : null, error: null };
    }
  }

  return {
    demo: true,
    from: t => new Q(t),
    /* La función de correo, simulada: no sale nada, pero se marca la fecha
       de envío y se devuelve lo mismo que la real. */
    functions: {
      invoke(nombre, { body }) {
        if (nombre === "resenas") return new Promise(r => setTimeout(() => r({ data: demoResenas(body), error: null }), 400));
        if (nombre === "enviar-invitacion" && body && body.tipo === "datos") return new Promise(r => setTimeout(() => {
          const res = (body.datos || []).map(d => {
            const e = (db.empleados || []).find(x => x.id === d.id);
            if (!e) return { id: d.id, ok: false, motivo: "Persona no encontrada" };
            if (e.datos_hash !== "demo:" + demoNormCod(d.codigo)) return { id: d.id, ok: false, motivo: "El código no corresponde a esta persona" };
            if (!e.correo) return { id: d.id, ok: false, motivo: "Sin correo válido" };
            e.datos_enviado = new Date().toISOString(); return { id: d.id, ok: true };
          });
          save(); r({ data: { enviados: res.filter(x => x.ok).length, total: res.length, resultados: res }, error: null });
        }, 250));
        if (nombre === "crear-cuenta") return new Promise(r => setTimeout(() => {
          const e = String(body.email || "").replace(/@.*/, "@demo");
          if (db.auth.some(x => x.email === e)) return r({ data: { error: "EXISTE" }, error: null });
          const id = uid(); db.auth.push({ id, email: e, password: body.password }); save(); r({ data: { id }, error: null });
        }, 200));
        return new Promise(r => setTimeout(() => {
          const ahora = new Date().toISOString(), res = [];
          const tabla = body.tipo === "desarrollo" ? db.dr_evaluadores : db.invitaciones;
          (body.ids || []).forEach(id => {
            const x = (tabla || []).find(y => y.id === id);
            if (!x) return res.push({ id, ok: false, motivo: "No existe" });
            if (!x.email) return res.push({ id, ok: false, motivo: "Sin correo válido" });
            if (x.estado === "respondida" || x.entregado) return res.push({ id, ok: false, motivo: "Ya ha respondido" });
            x.enviado = ahora; res.push({ id, ok: true });
          });
          (body.anonimos || []).forEach(a => {
            const x = db.invitaciones.find(y => y.id === a.id);
            if (!x || x.destinatario || x.email || x.enviado) return res.push({ id: a.id, ok: false, motivo: "No se puede enviar" });
            x.enviado = ahora; res.push({ id: a.id, ok: true });
          });
          if (body.recordatorio) body.recordatorio.emails.forEach((e, k) => res.push({ id: "rec-" + k, ok: true }));
          save();
          r({ data: { enviados: res.filter(x => x.ok).length, total: res.length, resultados: res }, error: null });
        }, 250));
      }
    },
    rpc(fn, a) {
      return new Promise(r => setTimeout(() => {
        // «Tus datos» (0.38): en la demo la «huella» es el propio código con un prefijo.
        if (fn === "datos_codigo_nuevo") {
          if (rol() !== "admin") return r(err("Solo RR.HH. puede crear códigos de consulta"));
          const e = (db.empleados || []).find(x => x.id === a.p_empleado && x.activo);
          if (!e) return r(err("Esa persona no existe o está de baja"));
          const c = SC.codigoInvitacion(); e.datos_hash = "demo:" + c; e.datos_enviado = null; save();
          return r({ data: c, error: null });
        }
        if (fn === "registrar_acceso") {
          if (!rol()) return r({ data: null, error: null });
          db.accesos_ficha = db.accesos_ficha || [];
          const dia = new Date().toISOString().slice(0, 10), u = db.sesion.user.id;
          const x = db.accesos_ficha.find(y => y.empleado_id === a.p_empleado && y.usuario_id === u && y.dia === dia && y.donde === a.p_donde);
          if (x) x.cuando = new Date().toISOString(); else db.accesos_ficha.push({ empleado_id: a.p_empleado, usuario_id: u, dia, donde: a.p_donde, cuando: new Date().toISOString() });
          save(); return r({ data: null, error: null });
        }
        if (fn === "mis_datos") {
          const n = demoNormCod(a.p_codigo);
          const e = n && (db.empleados || []).find(x => x.activo && x.datos_hash === "demo:" + n);
          if (!e) return r({ data: null, error: null });
          const t = db.tiendas.find(x => x.id === e.tienda_id), rmP = t && db.perfiles.find(x => x.id === t.rm_id);
          const resp = e.responsable_id && db.empleados.find(x => x.id === e.responsable_id);
          const scs = [];
          ((t && t.datos.personas) || []).filter(p => p.emp_id === e.id).forEach(p => Object.entries(p.evals || {}).forEach(([k, v]) => {
            if (v && v.cerrado) scs.push({ anio: t.anio, periodo: k, fecha: v.cerrado.fecha, por: v.cerrado.por, nota: v.cerrado.nota, bonus: v.cerrado.bonus });
          }));
          const lim = Date.now() - 90 * 864e5, acc = {};
          (db.accesos_ficha || []).filter(x => x.empleado_id === e.id && Date.parse(x.cuando) > lim).forEach(x => {
            const pf = db.perfiles.find(y => y.id === x.usuario_id); if (!pf) return;
            const k = pf.rol + "|" + pf.nombre; if (!acc[k] || acc[k].cuando < x.cuando) acc[k] = { rol: pf.rol, nombre: pf.nombre, cuando: x.cuando };
          });
          return r({ data: clone({
            ficha: { nombre: e.nombre, apellidos: e.apellidos, correo: e.correo, puesto: e.puesto, tipologia: e.tipologia, ubicacion: e.ubicacion,
              departamento: e.departamento, tienda: t ? t.nombre : null, responsable: resp ? (resp.nombre + " " + (resp.apellidos || "")).trim() : null, fecha_alta: e.fecha_alta || null },
            quien: { rm: rmP ? rmP.nombre : null, responsable: resp ? (resp.nombre + " " + (resp.apellidos || "")).trim() : null },
            scorecard: scs,
            desarrollo: db.dr_personas.filter(p => p.id_empleado === e.id).map(p => { const c = db.dr_ciclos.find(x => x.id === p.ciclo_id), ev = db.dr_evaluadores.find(x => x.id === p.evaluador_id);
              return { ciclo: c ? c.nombre : "", anio: c ? c.anio : null, estado: p.estado, evaluador: ev ? ev.nombre : "" }; }),
            invitaciones: e.correo ? db.invitaciones.filter(i => i.email && i.email.toLowerCase() === e.correo.toLowerCase()).map(i => { const c = db.campanas.find(x => x.id === i.campana_id);
              return { tipo: c ? c.tipo : "", titulo: c ? c.titulo : "", estado: i.estado, respondido: i.respondido || null }; }) : [],
            accesos: Object.values(acc).sort((x, y) => (x.cuando < y.cuando ? 1 : -1))
          }), error: null });
        }
        if (fn === "invitacion_abrir") {
          const i = db.invitaciones.find(x => x.codigo === String(a.p_codigo || "").trim().toUpperCase());
          if (!i) return r({ data: null, error: null });
          const c = db.campanas.find(x => x.id === i.campana_id), t = db.tiendas.find(x => x.id === i.tienda_id);
          if (i.estado === "pendiente" && c.estado === "abierta") { i.estado = "abierta"; i.abierto = new Date().toISOString(); save(); }
          return r({ data: { titulo: c.titulo, plantilla: c.plantilla, tipo: c.tipo, campana_estado: c.estado, estado: i.estado,
            destinatario: i.destinatario, tienda: t ? t.nombre : null,
            config: c.config || {}, responsable: i.responsable || null, grupo: i.grupo || null,
            respuestas: i.estado === "respondida" ? {} : clone(i.respuestas || {}) }, error: null });
        }
        if (fn === "invitacion_responder") {
          const i = db.invitaciones.find(x => x.codigo === String(a.p_codigo || "").trim().toUpperCase());
          if (!i) return r(err("Código no encontrado"));
          const c = db.campanas.find(x => x.id === i.campana_id);
          if (c.estado !== "abierta") return r(err("La campaña está cerrada"));
          if (i.estado === "respondida") return r(err("Este código ya se ha utilizado"));
          i.respuestas = a.p_respuestas || {}; i.estado = "respondida"; i.respondido = new Date().toISOString(); save();
          return r({ data: { ok: true }, error: null });
        }
        if (fn.startsWith("dr_")) {
          const e = db.dr_evaluadores.find(x => x.codigo === String(a.p_codigo || "").trim().toUpperCase());
          if (fn === "dr_abrir") {
            if (!e) return r({ data: null, error: null });
            const c = db.dr_ciclos.find(x => x.id === e.ciclo_id);
            if (!e.abierto) { e.abierto = new Date().toISOString(); save(); }
            return r({ data: clone({ ciclo: { id: c.id, nombre: c.nombre, anio: c.anio, ambito: c.ambito, estado: c.estado, fecha_limite: c.fecha_limite, config: c.config || {} },
              evaluador: { id: e.id, nombre: e.nombre, unidad: e.unidad, entregado: e.entregado || null, encuesta: e.encuesta || {} },
              personas: db.dr_personas.filter(p => p.evaluador_id === e.id).sort((x, y) => x.nombre.localeCompare(y.nombre))
                .map(p => ({ id: p.id, nombre: p.nombre, puesto: p.puesto, departamento: p.departamento, categoria: p.categoria,
                  ant_compania: p.ant_compania, ant_puesto: p.ant_puesto, manual: p.manual, datos: p.datos || {}, estado: p.estado })) }), error: null });
          }
          if (!e) return r(err("Código no encontrado"));
          const c = db.dr_ciclos.find(x => x.id === e.ciclo_id);
          if (c.estado !== "abierto") return r(err("El ciclo está cerrado"));
          if (fn === "dr_guardar") {
            const p = db.dr_personas.find(x => x.id === a.p_persona && x.evaluador_id === e.id);
            if (!p) return r(err("Esa persona no está en tu equipo"));
            p.datos = clone(a.p_datos || {}); p.actualizado = new Date().toISOString(); save();
            return r({ data: { ok: true }, error: null });
          }
          if (fn === "dr_alta") {
            const nom = String(a.p_nombre || "").trim(), pos = String(a.p_puesto || "").trim();
            if (!nom || !pos) return r(err("Nombre y posición son obligatorios."));
            if (db.dr_personas.some(x => x.evaluador_id === e.id && x.nombre.toLowerCase() === nom.toLowerCase())) return r(err("Esa persona ya está en tu equipo."));
            const p = { id: uid(), ciclo_id: e.ciclo_id, evaluador_id: e.id, nombre: nom, puesto: pos, departamento: a.p_departamento || null,
              categoria: a.p_categoria || null, ant_compania: null, ant_puesto: a.p_nuevo ? 0.5 : null, id_empleado: null, manual: true,
              datos: {}, estado: "borrador", actualizado: new Date().toISOString(), creado: new Date().toISOString() };
            db.dr_personas.push(p); save(); return r({ data: p.id, error: null });
          }
          if (fn === "dr_entregar") {
            e.entregado = new Date().toISOString();
            if (a.p_encuesta && Object.keys(a.p_encuesta).length) e.encuesta = clone(a.p_encuesta);
            db.dr_personas.filter(p => p.evaluador_id === e.id).forEach(p => { p.estado = "enviada"; }); save();
            return r({ data: { ok: true }, error: null });
          }
        }
        if (fn === "red_kpis") {
          if (!rol()) return r(err("Sin permiso"));
          const mias = db.tiendas.filter(x => (a.p_anio == null || x.anio === a.p_anio)
            && (rol() !== "rm" || x.rm_id === db.sesion.user.id));
          return r({ data: clone(mias).sort((x, y) => x.nombre.localeCompare(y.nombre))
            .map(x => ({ id: x.id, nombre: x.nombre, codigo: x.codigo, anio: x.anio, kpis: (x.datos || {}).kpis || {} })), error: null });
        }
        if (fn !== "admin_cambiar_password") return r(err("Función desconocida"));
        if (rol() !== "admin") return r(err("Solo un administrador puede cambiar contraseñas de otros usuarios"));
        if (!a.p_password || a.p_password.length < 8) return r(err("La contraseña debe tener al menos 8 caracteres"));
        const u = db.auth.find(x => x.id === a.p_usuario); if (!u) return r(err("Usuario no encontrado"));
        u.password = a.p_password; save(); r({ data: null, error: null });
      }, 60));
    },
    auth: {
      async getSession() { return { data: { session: db.sesion }, error: null }; },
      async signInWithPassword({ email, password }) {
        const u = db.auth.find(x => x.email === email.replace(/@.*/, "@demo") && x.password === password);
        if (!u) return { data: {}, error: { message: "Invalid login credentials" } };
        db.sesion = { user: { id: u.id, email } }; save(); return { data: { session: db.sesion }, error: null };
      },
      async signOut() { db.sesion = null; save(); return { error: null }; },
      async updateUser({ password }) { const u = db.auth.find(x => x.id === db.sesion.user.id); u.password = password; save(); return { data: {}, error: null }; },
      async signUp({ email, password }) {
        const e = email.replace(/@.*/, "@demo");
        if (db.auth.some(x => x.email === e)) return { data: { user: { id: "x", identities: [] } }, error: null };
        const id = uid(); db.auth.push({ id, email: e, password }); save(); return { data: { user: { id, identities: [{}] } }, error: null };
      }
    }
  };
};

/* Reseñas inventadas para el modo demostración (Employer Branding). El total
   sube un poco en cada consulta para que se vean «nuevas». */
function demoResenas(body) {
  const frases = [[5, "Me atendieron muy bien y me explicaron las diferencias entre modelos sin prisa."], [4, "Buen trato. Había cola en caja pero se organizaron rápido."],
    [2, "Tardaron mucho en atenderme y no supieron decirme si había stock."], [5, "El equipo es encantador, volveré."], [3, "Correcto, aunque la tienda estaba algo desordenada."],
    [1, "Nadie me atendió en veinte minutos."], [4, "Me ayudaron con una devolución sin problema."], [5, "Muy buenos consejos para elegir regalo."]];
  const nombres = ["Laura M.", "Javier R.", "Carmen T.", "Pablo S.", "Lucía G.", "Andrés P.", "Marta V.", "Sergio L."];
  if (body.buscar) return { sitios: [1, 2, 3].map(k => ({ id: "DEMObusca" + k + String(body.buscar.length).padStart(4, "0"), nombre: body.buscar + (k > 1 ? " (" + k + ")" : ""), direccion: "Resultado de ejemplo " + k + ", Madrid" })) };
  const n = (Number(sessionStorage.getItem("demo-eb-n") || 0) + 1); sessionStorage.setItem("demo-eb-n", n);
  return { consultado: new Date().toISOString(), sitios: (body.sitios || []).map((id, k) => {
    const h = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) + k;
    const total = 40 + (h % 260) + (n > 1 && k % 3 === 0 ? n : 0);
    const rs = [0, 1, 2, 3, 4].map(j => { const f = frases[(h + j * 3) % frases.length]; const dias = j * 9 + (h % 5) - (n > 1 && k % 3 === 0 && j === 0 ? 30 : 0);
      return { id: id + "/r" + j, nota: f[0], texto: f[1], hace: dias <= 0 ? "hace unas horas" : "hace " + dias + " días", fecha: new Date(Date.now() - Math.max(0, dias) * 864e5 - 36e5).toISOString(), enlace: null,
        autor: { nombre: nombres[(h + j) % nombres.length], uri: null } }; });
    const nota = Math.round((3.6 + (h % 13) / 10) * 10) / 10;
    return { id, nombre: "Sitio " + (k + 1), direccion: "Dirección de ejemplo", nota: Math.min(4.9, nota), total, enlace: "https://maps.google.com/", resenas: rs };
  }) };
}
