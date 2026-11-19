// ===================================================================
// enviar-invitacion · Pippole
//
// Envía por correo los códigos de acceso, desde la dirección de la
// plataforma. Vive en Supabase (Edge Function) porque la web es un sitio
// estático: no puede enviar nada por sí misma, y la clave del proveedor
// de correo no puede estar en el navegador.
//
// Cómo decide a quién puede escribir:
//   1. Lee las invitaciones CON LA SESIÓN DE QUIEN LLAMA, así que las
//      políticas de la base de datos ya filtran: un Regional Manager
//      solo ve las de sus tiendas.
//   2. Si alguna de las que pide no le sale, no envía ninguna.
//   3. Solo después, con permisos de servicio, marca la fecha de envío.
//
// Cuatro modos, con la misma puerta de entrada (?codigo=):
//   { ids }                         invitaciones con nombre (clima nominal,
//                                   formaciones, pruebas…). El correo está
//                                   guardado en la invitación.
//   { anonimos: [{ id, email }] }   encuestas anónimas: la invitación NO
//                                   tiene nombre ni correo; la dirección
//                                   solo pasa por aquí para enviar y no se
//                                   guarda en ninguna tabla. Cada código se
//                                   envía una sola vez.
//   { recordatorio: { campana_id, emails } }
//                                   recordatorio general de una anónima,
//                                   sin código (no se sabe quién tiene cuál).
//   { tipo: "desarrollo", ids }     responsables del Talent Review.
//   Opcional en todos: info = { <campana_id>: { min, n, umbral, cert } },
//   datos de la plantilla (que vive en el navegador) para el texto.
//
// El texto y el aspecto cambian según el tipo (clima, formación, prueba,
// incorporación, salida, mystery, Talent Review) y según si es el primer
// envío o un recordatorio. Están en ../_shared/correo.js, que también usa
// la web para la vista previa. Lo que RR.HH. cambia en esa vista previa
// (asunto, texto, nota, firma) se guarda en campanas.config.correo o
// dr_ciclos.config.correo y se aplica aquí.
//
// Se envía con la API por lotes del proveedor (hasta 100 por petición):
// así una campaña grande no choca con el límite de peticiones por segundo.
//
// Variables que hay que configurar en el proyecto (Secrets):
//   RESEND_API_KEY   clave del proveedor de correo
//   CORREO_DE        remitente, p. ej. "Pippole <no-responder@pippole.es>"
//   CORREO_RESPONDER opcional, dirección a la que responde la gente
//   URL_PLATAFORMA   p. ej. "https://www.pippole.es/"
// ===================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
// Plantilla compartida con la web: script que deja sus funciones en
// globalThis.CORREO (ver ../_shared/correo.js).
import "../_shared/correo.js";
// deno-lint-ignore no-explicit-any
const { prepararCorreo } = (globalThis as any).CORREO;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const MAIL = /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/;
const MAX = 100;

type Info = { min?: number; n?: number; umbral?: number; cert?: boolean; primera?: { id: string; t: string } };
type Item = {
  id: string; codigo: string; nombre: string; email: string; titulo: string;
  modo: "clima" | "anonima" | "formacion" | "psico" | "onboarding" | "offboarding" | "mystery" | "desarrollo" | "recordatorio";
  repite: boolean; info: Info; motivo?: string; limite?: string | null; personas?: number;
  // deno-lint-ignore no-explicit-any
  aj?: any;
};
// deno-lint-ignore no-explicit-any
const ajustes = (cfg: any) => (cfg && typeof cfg === "object" && cfg.correo && typeof cfg.correo === "object" ? cfg.correo : {});

/* Textos y maqueta: ../_shared/correo.js (los comparte con la vista previa de la web) */
/* ---------- Petición ---------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const API = Deno.env.get("RESEND_API_KEY");
  const DE = Deno.env.get("CORREO_DE");
  const RESPONDER = Deno.env.get("CORREO_RESPONDER") || "";
  const URL_APP = (Deno.env.get("URL_PLATAFORMA") || "").replace(/\/+$/, "") + "/";
  if (!API || !DE) return json({ error: "Falta configurar RESEND_API_KEY o CORREO_DE en los Secrets del proyecto." }, 500);

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Sin sesión" }, 401);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Petición no válida" }, 400); }
  const desarrollo = body?.tipo === "desarrollo";
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
  const anon: { id: string; email: string }[] = Array.isArray(body?.anonimos)
    ? body.anonimos.filter((x: { id?: unknown; email?: unknown }) => x && typeof x.id === "string" && typeof x.email === "string") : [];
  const rec = body?.recordatorio && typeof body.recordatorio.campana_id === "string" && Array.isArray(body.recordatorio.emails)
    ? { campana_id: body.recordatorio.campana_id as string, emails: (body.recordatorio.emails as unknown[]).filter((x) => typeof x === "string") as string[] } : null;
  const info: Record<string, Info> = {};
  if (body?.info && typeof body.info === "object") for (const [k, v] of Object.entries(body.info)) {
    // deno-lint-ignore no-explicit-any
    const o = v as any; if (!o || typeof o !== "object") continue;
    info[k] = { min: Number(o.min) > 0 && Number(o.min) < 600 ? Math.round(Number(o.min)) : undefined,
      n: Number(o.n) > 0 && Number(o.n) < 500 ? Math.round(Number(o.n)) : undefined,
      umbral: Number(o.umbral) > 0 && Number(o.umbral) <= 1 ? Number(o.umbral) : undefined, cert: o.cert === true,
      primera: o.primera && typeof o.primera.id === "string" && /^[a-z0-9_]{1,12}$/.test(o.primera.id) && typeof o.primera.t === "string"
        ? { id: o.primera.id, t: o.primera.t.slice(0, 300) } : undefined };
  }
  const total = ids.length + anon.length + (rec ? rec.emails.length : 0);
  const vista = body?.vista_previa && typeof body.vista_previa === "object" ? body.vista_previa : null;
  if (!total && !vista) return json({ error: "No se ha indicado ningún envío" }, 400);
  if (total > MAX) return json({ error: `Máximo ${MAX} envíos por llamada` }, 400);

  const URL_SB = Deno.env.get("SUPABASE_URL")!;
  // Cliente con la sesión de quien llama: las políticas de la base de datos
  // deciden qué puede ver, y por tanto a quién puede escribir.
  const suyo = createClient(URL_SB, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: usuario } = await suyo.auth.getUser();
  if (!usuario?.user) return json({ error: "Sin sesión" }, 401);
  const { data: quien } = await suyo.from("perfiles").select("nombre, rol").eq("id", usuario.user.id).maybeSingle();
  if (!quien) return json({ error: "Tu usuario no tiene perfil en la plataforma" }, 403);
  const cargo = quien.rol === "rm" ? "Regional Manager" : "Recursos Humanos";

  // Vista previa (0.34.3): devuelve el correo montado, sin enviar nada ni
  // leer datos de nadie. La web la usa si no puede cargar la plantilla.
  if (vista) {
    const MODOS = ["clima", "anonima", "formacion", "psico", "onboarding", "offboarding", "mystery", "desarrollo", "recordatorio"];
    const v = vista.it || {};
    const texto = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");
    // deno-lint-ignore no-explicit-any
    const o: any = v.info && typeof v.info === "object" ? v.info : {};
    const it: Item = {
      id: "vista", codigo: "ABCD-2345", email: "", nombre: texto(v.nombre, 100), titulo: texto(v.titulo, 200),
      modo: (MODOS.includes(v.modo) ? v.modo : "psico") as Item["modo"], repite: false,
      info: { min: Number(o.min) > 0 && Number(o.min) < 600 ? Math.round(Number(o.min)) : undefined,
        n: Number(o.n) > 0 && Number(o.n) < 500 ? Math.round(Number(o.n)) : undefined,
        umbral: Number(o.umbral) > 0 && Number(o.umbral) <= 1 ? Number(o.umbral) : undefined, cert: o.cert === true,
        primera: o.primera && typeof o.primera.id === "string" && /^[a-z0-9_]{1,12}$/.test(o.primera.id) && typeof o.primera.t === "string"
          ? { id: o.primera.id, t: o.primera.t.slice(0, 300) } : undefined },
      limite: typeof v.limite === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.limite) ? v.limite : null,
      personas: Number(v.personas) > 0 && Number(v.personas) < 1000 ? Math.round(Number(v.personas)) : 0
    };
    // deno-lint-ignore no-explicit-any
    const C = (globalThis as any).CORREO;
    const base = C.textosCorreo(it, quien.nombre, {});
    const m = prepararCorreo(it, quien.nombre, cargo, URL_APP, vista.aj && typeof vista.aj === "object" ? vista.aj : {});
    return json({ asunto: m.asunto, html: m.html, base: { asunto: base.asunto, intro: base.intro }, firma: quien.nombre, cargo });
  }

  const items: Item[] = [];
  if (desarrollo) {
    const { data: evs, error: e1 } = await suyo.from("dr_evaluadores").select("id, codigo, nombre, email, entregado, enviado, ciclo_id").in("id", ids);
    if (e1) return json({ error: e1.message }, 400);
    if (!evs || evs.length !== ids.length) return json({ error: "Algún responsable no existe o no tienes permiso" }, 403);
    const { data: ciclos } = await suyo.from("dr_ciclos").select("id, nombre, estado, fecha_limite, config").in("id", [...new Set(evs.map((e) => e.ciclo_id))]);
    const { data: pers } = await suyo.from("dr_personas").select("evaluador_id").in("evaluador_id", ids);
    for (const e of evs) {
      const c = (ciclos || []).find((x) => x.id === e.ciclo_id);
      items.push({ id: e.id, codigo: e.codigo, nombre: e.nombre || "", email: e.email || "", titulo: c ? c.nombre : "Talent Review",
        modo: "desarrollo", repite: !!e.enviado, info: {}, limite: c ? c.fecha_limite : null,
        personas: (pers || []).filter((p) => p.evaluador_id === e.id).length, aj: ajustes(c && c.config),
        motivo: !c ? "Ciclo no encontrado" : c.estado !== "abierto" ? "El ciclo está cerrado" : e.entregado ? "Ya ha enviado sus valoraciones" : undefined });
    }
  } else {
    const pedir = [...ids, ...anon.map((a) => a.id)];
    let invs: { id: string; codigo: string; destinatario: string | null; email: string | null; estado: string; campana_id: string; enviado: string | null }[] = [];
    if (pedir.length) {
      const r = await suyo.from("invitaciones").select("id, codigo, destinatario, email, estado, campana_id, enviado").in("id", pedir);
      if (r.error) return json({ error: r.error.message }, 400);
      invs = r.data || [];
      if (invs.length !== new Set(pedir).size) return json({ error: "Alguna de las invitaciones no existe o no es tuya" }, 403);
    }
    const campIds = [...new Set([...invs.map((i) => i.campana_id), ...(rec ? [rec.campana_id] : [])])];
    const { data: camps } = await suyo.from("campanas").select("id, titulo, estado, tipo, config").in("id", campIds);
    const camp = (id: string) => (camps || []).find((x) => x.id === id);
    const motivoInv = (inv: typeof invs[number], c: ReturnType<typeof camp>) =>
      !c ? "Campaña no encontrada" : c.estado !== "abierta" ? "La campaña está cerrada" : inv.estado === "respondida" ? "Ya ha respondido" : undefined;
    for (const id of ids) {
      const inv = invs.find((x) => x.id === id)!, c = camp(inv.campana_id);
      const modo = (c && ["clima", "formacion", "psico", "onboarding", "offboarding", "mystery"].includes(c.tipo) ? c.tipo : "psico") as Item["modo"];
      items.push({ id, codigo: inv.codigo, nombre: inv.destinatario || "", email: inv.email || "", titulo: c ? c.titulo : "", modo,
        repite: !!inv.enviado, info: info[inv.campana_id] || {}, aj: ajustes(c && c.config), motivo: motivoInv(inv, c) });
    }
    // Anónimas: la invitación no puede tener nombre ni correo, y el código
    // se envía una sola vez. La dirección no se guarda en ninguna tabla.
    for (const a of anon) {
      const inv = invs.find((x) => x.id === a.id)!, c = camp(inv.campana_id);
      items.push({ id: a.id, codigo: inv.codigo, nombre: "", email: a.email, titulo: c ? c.titulo : "", modo: "anonima", repite: false,
        info: info[inv.campana_id] || {}, aj: ajustes(c && c.config),
        motivo: motivoInv(inv, c) || (inv.destinatario || inv.email ? "Esta invitación lleva nombre: no es anónima" : inv.enviado ? "Este código ya se envió" : undefined) });
    }
    if (rec) {
      const c = camp(rec.campana_id);
      if (!c) return json({ error: "Campaña no encontrada o no tienes permiso" }, 403);
      rec.emails.forEach((e, k) => items.push({ id: "rec-" + k, codigo: "", nombre: "", email: e, titulo: c.titulo, modo: "recordatorio", repite: false, info: {}, aj: ajustes(c.config),
        motivo: c.estado !== "abierta" ? "La campaña está cerrada" : undefined }));
    }
  }

  /* Prepara los correos; los que no pueden salir se informan sin enviar */
  const resultados: { id: string; ok: boolean; motivo?: string }[] = [];
  const cola: { it: Item; mail: Record<string, unknown> }[] = [];
  for (const it of items) {
    if (it.motivo) { resultados.push({ id: it.id, ok: false, motivo: it.motivo }); continue; }
    const to = (it.email || "").trim().toLowerCase();
    if (!MAIL.test(to)) { resultados.push({ id: it.id, ok: false, motivo: "Sin correo válido" }); continue; }
    const m = prepararCorreo(it, quien.nombre, cargo, URL_APP, it.aj);
    cola.push({ it, mail: { from: DE, to: [to], subject: m.asunto, html: m.html, text: m.texto, ...(RESPONDER ? { reply_to: RESPONDER } : {}) } });
  }

  /* Envío por lotes: una petición para todo (máximo 100) */
  const enviados: string[] = [];
  if (cola.length) {
    try {
      const r = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${API}`, "Content-Type": "application/json" },
        body: JSON.stringify(cola.map((c) => c.mail))
      });
      if (!r.ok) {
        const t = await r.text();
        const cupo = r.status === 429 && /quota|daily|limit/i.test(t);
        const motivo = cupo ? "LIMITE_DIARIO" : `El proveedor devolvió ${r.status}: ${t.slice(0, 160)}`;
        cola.forEach((c) => resultados.push({ id: c.it.id, ok: false, motivo }));
      } else {
        cola.forEach((c) => { resultados.push({ id: c.it.id, ok: true }); if (!c.it.id.startsWith("rec-")) enviados.push(c.it.id); });
      }
    } catch (err) {
      cola.forEach((c) => resultados.push({ id: c.it.id, ok: false, motivo: String(err).slice(0, 160) }));
    }
  }

  // La fecha de envío se escribe con permisos de servicio: la plataforma no
  // tiene política de UPDATE sobre invitaciones. En las anónimas solo se
  // marca la fecha, nunca la dirección.
  if (enviados.length) {
    const servicio = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await servicio.from(desarrollo ? "dr_evaluadores" : "invitaciones").update({ enviado: new Date().toISOString() }).in("id", enviados);
  }

  // En las anónimas la respuesta no devuelve direcciones, solo ids y estado.
  return json({ enviados: resultados.filter((x) => x.ok).length, total: items.length, resultados });
});
