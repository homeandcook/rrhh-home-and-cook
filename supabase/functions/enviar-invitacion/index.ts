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

    /* Correo corporativo, maquetado con tablas: es lo único que Outlook
       renderiza igual que el resto. Sin imágenes remotas, por dos motivos:
       la mayoría de los clientes las bloquean por defecto, y la plataforma
       está en privado, así que un logotipo alojado ahí no cargaría. La
       marca se construye con tipografía y color. */
    const R = "#E52143", TINTA = "#1C2733", GRIS = "#5E6B78", LINEA = "#D9DEE5", FONDO = "#F2F4F7";
    const SANS = "'Segoe UI',system-ui,-apple-system,Helvetica,Arial,sans-serif";
    const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";
    const html =
`<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(c.titulo)}</title>
<style>
@media only screen and (max-width:600px){
  .caja{width:100%!important}
  .pad{padding-left:20px!important;padding-right:20px!important}
  .cod{font-size:25px!important;letter-spacing:.06em!important}
}
</style></head>
<body style="margin:0;padding:0;background:${FONDO};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Tu código de acceso es ${esc(inv.codigo)}. Se tarda unos minutos y el código sirve una sola vez.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO}">
<tr><td align="center" style="padding:32px 12px">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="caja" style="width:560px;max-width:100%;background:#ffffff;border:1px solid ${LINEA};border-radius:14px">

  <tr><td style="height:5px;background:${R};font-size:0;line-height:0;border-radius:13px 13px 0 0">&nbsp;</td></tr>

  <tr><td class="pad" style="padding:30px 36px 0">
    <div style="font:700 21px/1.2 ${SANS};color:${TINTA};letter-spacing:-.01em">RRHH <span style="color:${R}">&#10005;</span> Home&amp;Cook</div>
    <div style="font:600 10.5px/1.4 ${SANS};color:${GRIS};letter-spacing:.11em;text-transform:uppercase;padding-top:7px">Una plataforma de Groupe SEB Ibérica</div>
  </td></tr>

  <tr><td class="pad" style="padding:26px 36px 0">
    <p style="margin:0 0 14px;font:400 16px/1.6 ${SANS};color:${TINTA}">${saludo}</p>
    <p style="margin:0;font:400 16px/1.6 ${SANS};color:${TINTA}">Te envío el acceso a <strong style="font-weight:600">${esc(c.titulo)}</strong>. No necesitas usuario ni contraseña: abre el enlace y escribe el código.</p>
  </td></tr>

  <tr><td class="pad" style="padding:26px 36px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO};border:1px solid ${LINEA};border-radius:10px">
      <tr><td align="center" style="padding:20px 20px 22px">
        <div style="font:600 10.5px/1 ${SANS};color:${GRIS};letter-spacing:.11em;text-transform:uppercase">Tu código</div>
        <div class="cod" style="font:700 29px/1.2 ${MONO};color:${TINTA};letter-spacing:.09em;padding-top:11px">${esc(inv.codigo)}</div>
      </td></tr>
    </table>
  </td></tr>

  <tr><td class="pad" align="center" style="padding:24px 36px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="${R}" style="border-radius:9px">
        <a href="${esc(URL_APP)}?codigo=" style="display:inline-block;padding:14px 34px;font:600 16px/1 ${SANS};color:#ffffff;text-decoration:none;border-radius:9px">Empezar</a>
      </td>
    </tr></table>
    <p style="margin:13px 0 0;font:400 13px/1.5 ${SANS};color:${GRIS}">Si el botón no funciona, copia esta dirección:<br><span style="color:${TINTA};word-break:break-all">${esc(URL_APP)}?codigo=</span></p>
  </td></tr>

  <tr><td class="pad" style="padding:26px 36px 30px">
    <p style="margin:0 0 18px;font:400 14px/1.6 ${SANS};color:${GRIS}">El código sirve una sola vez y es solo tuyo: no lo reenvíes.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${LINEA};padding-top:18px">
      <p style="margin:0;font:400 15px/1.6 ${SANS};color:${TINTA}">Gracias,<br><strong style="font-weight:600">${esc(quien.nombre)}</strong><br><span style="color:${GRIS};font-size:13.5px">Recursos Humanos &middot; Home &amp; Cook</span></p>
    </td></tr></table>
  </td></tr>

  <tr><td class="pad" style="background:${FONDO};border-top:1px solid ${LINEA};border-radius:0 0 13px 13px;padding:16px 36px">
    <p style="margin:0;font:400 12px/1.6 ${SANS};color:${GRIS}">Has recibido este correo porque trabajas en la red de tiendas Home &amp; Cook. Si crees que no es para ti, responde a este mensaje y lo revisamos.</p>
  </td></tr>

</table>

<div style="font:400 11.5px/1.6 ${SANS};color:${GRIS};padding:16px 0 0">Groupe SEB Ibérica &middot; Tefal &middot; Rowenta &middot; Moulinex &middot; Krups &middot; WMF</div>

</td></tr></table></body></html>`;

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
