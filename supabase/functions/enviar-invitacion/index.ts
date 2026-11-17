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
// envío o un recordatorio.
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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MAIL = /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/;
const MAX = 100;

type Info = { min?: number; n?: number; umbral?: number; cert?: boolean };
type Item = {
  id: string; codigo: string; nombre: string; email: string; titulo: string;
  modo: "clima" | "anonima" | "formacion" | "psico" | "onboarding" | "offboarding" | "mystery" | "desarrollo" | "recordatorio";
  repite: boolean; info: Info; motivo?: string; limite?: string | null; personas?: number;
};

/* ---------- Textos por tipo ---------- */
function textos(it: Item, firma: string) {
  const t = it.titulo, min = it.info.min, i = it.info;
  const dur = !min ? "" : min >= 55 && min <= 70 ? "Alrededor de 1 hora" : min > 70 ? `Alrededor de ${Math.round(min / 30) / 2} horas`.replace(".5", " y media") : `Unos ${min} minutos`;
  const limite = it.limite ? new Date(it.limite + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : "";
  const T: Record<Item["modo"], { eti: string; asunto: string; intro: string; datos: [string, string][]; boton: string; nota: string }> = {
    clima: {
      eti: "Encuesta de clima", asunto: `${t}: tu opinión cuenta`,
      intro: `Queremos saber cómo vives el trabajo en tu tienda: qué funciona y qué cambiarías. Tus respuestas sirven para decidir mejoras, nunca para evaluarte.`,
      datos: [["Duración", dur || "Pocos minutos"], ["Preguntas", i.n ? String(i.n) : "—"], ["Respuestas", "Con tu nombre"]],
      boton: "Responder la encuesta", nota: "El código es personal y sirve una sola vez. No lo reenvíes."
    },
    anonima: {
      eti: "Encuesta de clima · anónima", asunto: `${t}: tu opinión cuenta, y es anónima`,
      intro: `Queremos saber cómo vives el trabajo en tu tienda: qué funciona y qué cambiarías. Es anónima: el código no lleva tu nombre y la plataforma no guarda a quién se ha enviado cada uno.`,
      datos: [["Duración", dur || "Pocos minutos"], ["Preguntas", i.n ? String(i.n) : "—"], ["Respuestas", "Anónimas"]],
      boton: "Responder la encuesta", nota: "El código sirve una sola vez. Si no quieres que nadie vea tu respuesta, contéstala cuando estés a solas."
    },
    formacion: {
      eti: "Formación", asunto: `Formación: ${t}`,
      intro: `Tienes asignada la formación ${"«" + t + "»"}. Puedes hacerla a tu ritmo, desde el móvil o el ordenador; el avance se guarda en el dispositivo donde la empieces.`,
      datos: [["Duración", dur || "A tu ritmo"], ["Para aprobar", i.umbral ? `${Math.round(i.umbral * 100)} % del examen` : "Completarla"], [i.cert ? "Al aprobar" : "Formato", i.cert ? "Certificado" : "En línea"]],
      boton: "Empezar la formación", nota: "El código es personal. Sirve para entrar las veces que necesites hasta que entregues el examen."
    },
    psico: {
      eti: "Prueba", asunto: `${t}: tu código de acceso`,
      intro: `Te invitamos a hacer ${"«" + t + "»"}. Son situaciones reales del día a día: elige lo que harías tú. No hay preguntas con truco.`,
      datos: [["Duración", dur || "Unos 10 minutos"], ["Preguntas", i.n ? String(i.n) : "—"], ["Intentos", "Uno"]],
      boton: "Empezar la prueba", nota: "Busca un momento tranquilo: una vez enviada, no se puede repetir."
    },
    onboarding: {
      eti: "Tus primeras semanas", asunto: `${t}: ¿cómo han ido tus primeras semanas?`,
      intro: `Queremos saber cómo ha sido tu incorporación: qué te ha ayudado y qué echaste en falta. Nos sirve para recibir mejor a quien llegue después.`,
      datos: [["Duración", dur || "Unos 5 minutos"], ["Preguntas", i.n ? String(i.n) : "—"], ["Respuestas", "Con tu nombre"]],
      boton: "Responder", nota: "El código es personal y sirve una sola vez."
    },
    offboarding: {
      eti: "Antes de tu salida", asunto: `${t}: nos gustaría conocer tu experiencia`,
      intro: `Gracias por el tiempo que has estado con nosotros. Antes de irte, nos ayudaría mucho saber cómo ha sido tu experiencia y qué mejorarías.`,
      datos: [["Duración", dur || "Unos 5 minutos"], ["Preguntas", i.n ? String(i.n) : "—"], ["Respuestas", "Con tu nombre"]],
      boton: "Responder", nota: "El código es personal y sirve una sola vez."
    },
    mystery: {
      eti: "Mystery Shopper", asunto: `${t}: acceso a la evaluación`,
      intro: `Tienes asignada la evaluación ${"«" + t + "»"}. Ábrela después de la visita y registra lo que has observado.`,
      datos: [["Duración", dur || "Unos 10 minutos"], ["Puntos", i.n ? String(i.n) : "—"], ["Cuándo", "Tras la visita"]],
      boton: "Abrir la evaluación", nota: "El código sirve para una sola evaluación."
    },
    desarrollo: {
      eti: "Talent Review", asunto: `${t}: valora a tu equipo`,
      intro: `Te toca valorar a tu equipo en ${"«" + t + "»"}: desempeño, potencial y plan de desarrollo de cada persona. Se guarda solo y puedes dejarlo a medias.`,
      datos: [["Personas", it.personas ? String(it.personas) : "Tu equipo"], ["Tiempo", "Unos 10 min por persona"], ["Fecha límite", limite || "La que indique RR.HH."]],
      boton: "Valorar a mi equipo", nota: "El código es solo tuyo. Sirve hasta que envíes tus valoraciones a RR.HH."
    },
    recordatorio: {
      eti: "Recordatorio", asunto: `Recordatorio: ${t}`,
      intro: `Si todavía no has respondido ${"«" + t + "»"}, aún estás a tiempo. Usa el código que te llegó en el correo anterior. Si ya la has hecho, gracias: puedes ignorar este mensaje.`,
      datos: [], boton: "Ir a la encuesta", nota: "Por anonimato no te reenviamos el código: la plataforma no sabe cuál es el tuyo. Si lo has perdido, pídele uno a tu responsable."
    }
  };
  const x = T[it.modo];
  if (it.repite && it.modo !== "recordatorio") {
    x.asunto = "Recordatorio · " + x.asunto;
    x.intro = (it.modo === "desarrollo" ? "Todavía no consta el envío de tus valoraciones. " : "Todavía no consta como hecho. ") + x.intro;
  }
  return { ...x, firma, limite };
}

/* ---------- Correo ----------
   Maquetado con tablas, que es lo único que Outlook pinta igual que el
   resto. Sin imágenes remotas: la mayoría de los clientes las bloquean
   por defecto. La marca se construye con tipografía y color. */
const R = "#5B3FD9", R2 = "#EFEAFE", TINTA = "#231A3D", GRIS = "#5A5170", LINEA = "#E7DFF3", FONDO = "#FBF7FF";
const SANS = "'Segoe UI',system-ui,-apple-system,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

function correo(it: Item, x: ReturnType<typeof textos>, URL_APP: string, cargo: string) {
  const pila = (() => {
    const n = (it.nombre || "").trim(); if (!n || it.modo === "anonima" || it.modo === "recordatorio") return "";
    const p = n.includes(",") ? n.split(",")[1].trim().split(" ")[0] : n.split(" ")[0];
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  })();
  const conCodigo = it.modo !== "recordatorio";
  const enlace = `${URL_APP}?codigo=`;
  const pasos = it.modo === "desarrollo"
    ? ["Abre el enlace y escribe tu código.", "Completa la ficha de cada persona.", "Pulsa «Enviar a RR.HH.» al terminar."]
    : it.modo === "formacion"
      ? ["Abre el enlace y escribe tu código.", "Repasa los módulos a tu ritmo.", "Haz el examen final y envíalo."]
      : ["Abre el enlace y escribe tu código.", "Responde las preguntas.", "Pulsa enviar al terminar."];

  const texto = [
    pila ? `Hola ${pila},` : "Hola,", "", x.intro, "",
    ...x.datos.map(([k, v]) => `${k}: ${v}`), x.datos.length ? "" : null,
    `Enlace: ${enlace}`, conCodigo ? `Código: ${it.codigo}` : null, "",
    conCodigo ? "Cómo funciona:\n" + pasos.map((p, k) => `${k + 1}. ${p}`).join("\n") + "\n" : null,
    x.nota, "", "Gracias,", x.firma, cargo
  ].filter((l) => l !== null).join("\n");

  const celdas = x.datos.map(([k, v], n) => `<td class="dato${n ? "" : " dato1"}" width="${Math.floor(100 / x.datos.length)}%" valign="top" style="padding:14px 14px 13px;${n ? `border-left:1px solid ${LINEA};` : ""}">
      <div style="font:600 10px/1.3 ${SANS};color:${GRIS};letter-spacing:.1em;text-transform:uppercase">${esc(k)}</div>
      <div style="font:600 14.5px/1.35 ${SANS};color:${TINTA};padding-top:5px">${esc(v)}</div></td>`).join("");

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(x.asunto)}</title>
<style>
@media only screen and (max-width:600px){
  .caja{width:100%!important;border-radius:0!important}
  .pad{padding-left:22px!important;padding-right:22px!important}
  .cod{font-size:26px!important;letter-spacing:.06em!important}
  .dato{display:block!important;width:100%!important;box-sizing:border-box!important;border-left:0!important;border-top:1px solid ${LINEA}!important}
  .dato1{border-top:0!important}
  h1{font-size:23px!important}
}
</style></head>
<body style="margin:0;padding:0;background:${FONDO};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(conCodigo ? `${x.eti}. Tu código: ${it.codigo}` : x.intro.slice(0, 110))}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO}">
<tr><td align="center" style="padding:28px 10px 34px">

<table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" class="caja" style="width:580px;max-width:100%">
  <tr><td class="pad" style="padding:0 6px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font:700 20px/1 ${SANS};color:${TINTA};letter-spacing:-.01em"><span style="color:${R};font-size:22px">&#960;</span>&nbsp;pippole</td>
      <td align="right" style="font:600 10.5px/1 ${SANS};color:${GRIS};letter-spacing:.1em;text-transform:uppercase">Recursos Humanos</td>
    </tr></table>
  </td></tr>
</table>

<table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" class="caja" style="width:580px;max-width:100%;background:#ffffff;border:1px solid ${LINEA};border-radius:16px">

  <tr><td class="pad" style="padding:30px 38px 0;border-top:5px solid ${R};border-radius:16px 16px 0 0">
    <div style="display:inline-block;background:${R2};color:${R};font:700 10.5px/1 ${SANS};letter-spacing:.1em;text-transform:uppercase;padding:7px 10px;border-radius:999px">${esc(x.eti)}</div>
    <h1 style="margin:16px 0 0;font:700 26px/1.2 ${SANS};color:${TINTA};letter-spacing:-.02em">${esc(it.titulo)}</h1>
  </td></tr>

  <tr><td class="pad" style="padding:20px 38px 0">
    <p style="margin:0 0 12px;font:400 16px/1.6 ${SANS};color:${TINTA}">${pila ? `Hola ${esc(pila)},` : "Hola,"}</p>
    <p style="margin:0;font:400 16px/1.6 ${SANS};color:${TINTA}">${esc(x.intro)}</p>
  </td></tr>

  ${x.datos.length ? `<tr><td class="pad" style="padding:22px 38px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${LINEA};border-radius:12px"><tr>
      ${celdas}
    </tr></table>
  </td></tr>` : ""}

  ${conCodigo ? `<tr><td class="pad" style="padding:22px 38px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO};border:1px dashed #C9BCF5;border-radius:12px">
      <tr><td align="center" style="padding:20px 18px 21px">
        <div style="font:600 10.5px/1 ${SANS};color:${GRIS};letter-spacing:.11em;text-transform:uppercase">Tu código de acceso</div>
        <div class="cod" style="font:700 30px/1.2 ${MONO};color:${TINTA};letter-spacing:.1em;padding-top:10px">${esc(it.codigo)}</div>
      </td></tr>
    </table>
  </td></tr>` : ""}

  <tr><td class="pad" align="center" style="padding:24px 38px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="${R}" style="border-radius:10px">
        <a href="${esc(enlace)}" style="display:inline-block;padding:15px 36px;font:600 16px/1 ${SANS};color:#ffffff;text-decoration:none;border-radius:10px">${esc(x.boton)} &rarr;</a>
      </td>
    </tr></table>
    <p style="margin:12px 0 0;font:400 12.5px/1.5 ${SANS};color:${GRIS}">o copia esta dirección: <span style="color:${TINTA};word-break:break-all">${esc(enlace)}</span></p>
  </td></tr>

  ${conCodigo ? `<tr><td class="pad" style="padding:26px 38px 0">
    <div style="font:600 10.5px/1 ${SANS};color:${GRIS};letter-spacing:.11em;text-transform:uppercase;padding-bottom:10px">Cómo funciona</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${pasos.map((p, k) => `<tr><td width="30" valign="top" style="padding:0 0 9px"><div style="width:22px;height:22px;border-radius:11px;background:${R2};color:${R};font:700 12px/22px ${SANS};text-align:center">${k + 1}</div></td>
        <td valign="top" style="padding:2px 0 9px;font:400 14.5px/1.45 ${SANS};color:${TINTA}">${esc(p)}</td></tr>`).join("")}
    </table>
  </td></tr>` : ""}

  <tr><td class="pad" style="padding:16px 38px 30px">
    <p style="margin:0 0 20px;font:400 13.5px/1.6 ${SANS};color:${GRIS}">${esc(x.nota)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${LINEA};padding-top:18px">
      <p style="margin:0;font:400 15px/1.55 ${SANS};color:${TINTA}">Gracias,<br><strong style="font-weight:600">${esc(x.firma)}</strong><br><span style="color:${GRIS};font-size:13.5px">${esc(cargo)}</span></p>
    </td></tr></table>
  </td></tr>
</table>

<table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" class="caja" style="width:580px;max-width:100%">
  <tr><td class="pad" style="padding:18px 8px 0;font:400 12px/1.6 ${SANS};color:${GRIS}">
    Recibes este correo porque tu empresa usa Pippole para sus procesos de personas. Si crees que no es para ti, responde a este mensaje y lo revisamos.<br>
    <span style="color:${TINTA};font-weight:600">Pippole</span> &middot; pippole.es
  </td></tr>
</table>

</td></tr></table></body></html>`;
  return { asunto: x.asunto, html, texto };
}

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
      umbral: Number(o.umbral) > 0 && Number(o.umbral) <= 1 ? Number(o.umbral) : undefined, cert: o.cert === true };
  }
  const total = ids.length + anon.length + (rec ? rec.emails.length : 0);
  if (!total) return json({ error: "No se ha indicado ningún envío" }, 400);
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

  const items: Item[] = [];
  if (desarrollo) {
    const { data: evs, error: e1 } = await suyo.from("dr_evaluadores").select("id, codigo, nombre, email, entregado, enviado, ciclo_id").in("id", ids);
    if (e1) return json({ error: e1.message }, 400);
    if (!evs || evs.length !== ids.length) return json({ error: "Algún responsable no existe o no tienes permiso" }, 403);
    const { data: ciclos } = await suyo.from("dr_ciclos").select("id, nombre, estado, fecha_limite").in("id", [...new Set(evs.map((e) => e.ciclo_id))]);
    const { data: pers } = await suyo.from("dr_personas").select("evaluador_id").in("evaluador_id", ids);
    for (const e of evs) {
      const c = (ciclos || []).find((x) => x.id === e.ciclo_id);
      items.push({ id: e.id, codigo: e.codigo, nombre: e.nombre || "", email: e.email || "", titulo: c ? c.nombre : "Talent Review",
        modo: "desarrollo", repite: !!e.enviado, info: {}, limite: c ? c.fecha_limite : null,
        personas: (pers || []).filter((p) => p.evaluador_id === e.id).length,
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
    const { data: camps } = await suyo.from("campanas").select("id, titulo, estado, tipo").in("id", campIds);
    const camp = (id: string) => (camps || []).find((x) => x.id === id);
    const motivoInv = (inv: typeof invs[number], c: ReturnType<typeof camp>) =>
      !c ? "Campaña no encontrada" : c.estado !== "abierta" ? "La campaña está cerrada" : inv.estado === "respondida" ? "Ya ha respondido" : undefined;
    for (const id of ids) {
      const inv = invs.find((x) => x.id === id)!, c = camp(inv.campana_id);
      const modo = (c && ["clima", "formacion", "psico", "onboarding", "offboarding", "mystery"].includes(c.tipo) ? c.tipo : "psico") as Item["modo"];
      items.push({ id, codigo: inv.codigo, nombre: inv.destinatario || "", email: inv.email || "", titulo: c ? c.titulo : "", modo,
        repite: !!inv.enviado, info: info[inv.campana_id] || {}, motivo: motivoInv(inv, c) });
    }
    // Anónimas: la invitación no puede tener nombre ni correo, y el código
    // se envía una sola vez. La dirección no se guarda en ninguna tabla.
    for (const a of anon) {
      const inv = invs.find((x) => x.id === a.id)!, c = camp(inv.campana_id);
      items.push({ id: a.id, codigo: inv.codigo, nombre: "", email: a.email, titulo: c ? c.titulo : "", modo: "anonima", repite: false,
        info: info[inv.campana_id] || {},
        motivo: motivoInv(inv, c) || (inv.destinatario || inv.email ? "Esta invitación lleva nombre: no es anónima" : inv.enviado ? "Este código ya se envió" : undefined) });
    }
    if (rec) {
      const c = camp(rec.campana_id);
      if (!c) return json({ error: "Campaña no encontrada o no tienes permiso" }, 403);
      rec.emails.forEach((e, k) => items.push({ id: "rec-" + k, codigo: "", nombre: "", email: e, titulo: c.titulo, modo: "recordatorio", repite: false, info: {},
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
    const m = correo(it, textos(it, quien.nombre), URL_APP, cargo);
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
