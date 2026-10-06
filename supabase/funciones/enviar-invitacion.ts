// ===================================================================
// enviar-invitacion · RR.HH. x Home & Cook
//
// Envía por correo el código de una invitación, desde la dirección de
// la empresa. Vive en Supabase (Edge Function) porque la plataforma es
// un sitio estático: no puede enviar nada por sí misma, y la clave del
// proveedor de correo no puede estar en el navegador.
//
// Cómo decide a quién puede escribir:
//   1. Lee las invitaciones CON LA SESIÓN DE QUIEN LLAMA, así que las
//      políticas de la base de datos ya filtran: un Regional Manager
//      solo ve las de sus tiendas.
//   2. Si alguna de las que pide no le sale, no envía ninguna.
//   3. Solo después, con permisos de servicio, marca la fecha de envío.
//
// Variables que hay que configurar en el proyecto (Secrets):
//   RESEND_API_KEY   clave del proveedor de correo
//   CORREO_DE        remitente, p. ej. "RR.HH. Home & Cook <rrhh@tudominio.com>"
//   CORREO_RESPONDER opcional, dirección a la que responde la gente
//   URL_PLATAFORMA   p. ej. "https://people-retail.netlify.app/"
// ===================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

  let ids: string[] = [];
  try {
    const body = await req.json();
    ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
  } catch { return json({ error: "Petición no válida" }, 400); }
  if (!ids.length) return json({ error: "No se ha indicado ninguna invitación" }, 400);
  if (ids.length > 50) return json({ error: "Máximo 50 envíos por llamada" }, 400);

  const URL_SB = Deno.env.get("SUPABASE_URL")!;
  // Cliente con la sesión de quien llama: las políticas de la base de datos
  // deciden qué invitaciones puede ver, y por tanto a quién puede escribir.
  const suyo = createClient(URL_SB, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } }
  });
  const { data: usuario } = await suyo.auth.getUser();
  if (!usuario?.user) return json({ error: "Sin sesión" }, 401);

  const { data: quien } = await suyo.from("perfiles").select("nombre, rol").eq("id", usuario.user.id).maybeSingle();
  if (!quien) return json({ error: "Tu usuario no tiene perfil en la plataforma" }, 403);

  const { data: invs, error: e1 } = await suyo
    .from("invitaciones")
    .select("id, codigo, destinatario, email, estado, campana_id, tienda_id")
    .in("id", ids);
  if (e1) return json({ error: e1.message }, 400);
  if (!invs || invs.length !== ids.length)
    return json({ error: "Alguna de las invitaciones no existe o no es tuya" }, 403);

  const campIds = [...new Set(invs.map((i) => i.campana_id))];
  const { data: camps } = await suyo.from("campanas").select("id, titulo, estado").in("id", campIds);
  const campDe = (id: string) => (camps || []).find((c) => c.id === id);

  const resultados: { id: string; ok: boolean; motivo?: string }[] = [];
  const enviados: string[] = [];

  for (const inv of invs) {
    const c = campDe(inv.campana_id);
    if (!c) { resultados.push({ id: inv.id, ok: false, motivo: "Campaña no encontrada" }); continue; }
    if (c.estado !== "abierta") { resultados.push({ id: inv.id, ok: false, motivo: "La campaña está cerrada" }); continue; }
    if (inv.estado === "respondida") { resultados.push({ id: inv.id, ok: false, motivo: "Ya ha respondido" }); continue; }
    const correo = (inv.email || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { resultados.push({ id: inv.id, ok: false, motivo: "Sin correo válido" }); continue; }

    const nombre = (inv.destinatario || "").trim();
    const saludo = nombre ? `Hola ${esc(nombre.split(" ")[0])},` : "Hola,";
    const texto =
`${nombre ? "Hola " + nombre.split(" ")[0] : "Hola"},

Te envío el acceso a "${c.titulo}". No necesitas usuario ni contraseña: abre el enlace y escribe este código.

Enlace: ${URL_APP}?codigo=
Código: ${inv.codigo}

El código sirve una sola vez y es solo tuyo, no lo reenvíes.

Gracias,
${quien.nombre}`;

    const html =
`<div style="font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.6;color:#1C2733;max-width:520px">
  <p>${saludo}</p>
  <p>Te envío el acceso a <b>${esc(c.titulo)}</b>. No necesitas usuario ni contraseña: abre el enlace y escribe este código.</p>
  <p style="margin:22px 0"><a href="${esc(URL_APP)}?codigo=" style="background:#E52143;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">Abrir</a></p>
  <p style="margin:0 0 4px;color:#5E6B78;font-size:13px">Tu código</p>
  <p style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:26px;font-weight:700;letter-spacing:.08em;margin:0 0 22px">${esc(inv.codigo)}</p>
  <p style="color:#5E6B78;font-size:13px">El código sirve una sola vez y es solo tuyo, no lo reenvíes.</p>
  <p>Gracias,<br>${esc(quien.nombre)}</p>
</div>`;

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${API}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: DE, to: [correo], subject: c.titulo, text: texto, html,
          ...(RESPONDER ? { reply_to: RESPONDER } : {})
        })
      });
      if (!r.ok) {
        const t = await r.text();
        resultados.push({ id: inv.id, ok: false, motivo: `El proveedor devolvió ${r.status}: ${t.slice(0, 160)}` });
        continue;
      }
      resultados.push({ id: inv.id, ok: true });
      enviados.push(inv.id);
    } catch (err) {
      resultados.push({ id: inv.id, ok: false, motivo: String(err).slice(0, 160) });
    }
  }

  // La fecha de envío se escribe con permisos de servicio: la plataforma no
  // tiene política de UPDATE sobre invitaciones, y así sigue sin tenerla.
  if (enviados.length) {
    const servicio = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await servicio.from("invitaciones").update({ enviado: new Date().toISOString() }).in("id", enviados);
  }

  return json({ enviados: enviados.length, total: invs.length, resultados });
});
