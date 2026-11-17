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
    dr_ciclos: () => rol() === "admin", dr_evaluadores: () => rol() === "admin", dr_personas: () => rol() === "admin", dr_decisiones: () => rol() === "admin",
    invitaciones: r => {
      if (rol() === "admin") return true;
      if (rol() === "marketing") { const c = db.campanas.find(x => x.id === r.campana_id); return !!(c && c.tipo === "mystery"); }
      const t = db.tiendas.find(x => x.id === r.tienda_id); return !!(t && db.sesion && t.rm_id === db.sesion.user.id); }
  };
  const err = m => ({ data: null, error: { message: m } });

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
          if (this.t === "perfiles") { if (db.perfiles.some(p => p.usuario === r.usuario)) throw new Error("dup"); Object.assign(r, { activo: r.activo !== false, creado: new Date().toISOString() }); }
          return r;
        });
        T.push(...rows); out = rows;
      } else if (this.op === "update") {
        if ((this.t === "perfiles" || this.t === "documentos") && rol() !== "admin") return err("Sin permiso");
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
        if (fn === "invitacion_abrir") {
          const i = db.invitaciones.find(x => x.codigo === String(a.p_codigo || "").trim().toUpperCase());
          if (!i) return r({ data: null, error: null });
          const c = db.campanas.find(x => x.id === i.campana_id), t = db.tiendas.find(x => x.id === i.tienda_id);
          if (i.estado === "pendiente" && c.estado === "abierta") { i.estado = "abierta"; i.abierto = new Date().toISOString(); save(); }
          return r({ data: { titulo: c.titulo, plantilla: c.plantilla, tipo: c.tipo, campana_estado: c.estado, estado: i.estado,
            destinatario: i.destinatario, tienda: t ? t.nombre : null,
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
