// ===================================================================
// Plantilla del correo de Pippole (0.34.0)
//
// Un solo sitio para el texto y el aspecto de los correos:
//   - la función enviar-invitacion la importa para enviar;
//   - la web la carga como módulo para la vista previa antes de enviar
//     (publicar-pages.yml copia este fichero a la misma ruta del sitio).
// JavaScript sin tipos y SIN «export», a propósito: es un script normal
// que deja todo en globalThis.CORREO. Así lo carga el navegador con una
// etiqueta <script> como el resto de la web (los módulos fallaban en
// algunos navegadores) y la función lo importa por su efecto en Deno.
//
// it = { codigo, nombre, titulo, modo, repite, info: {min, n, umbral,
//        cert, primera}, limite, personas }
// aj = lo que RR.HH. cambia en la vista previa: { asunto, intro, extra,
//      firma, cargo }. Vacío = el texto de siempre.
// ===================================================================
(function () {
"use strict";
const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* Párrafos: una línea en blanco separa párrafos; un salto simple, línea */
const parrafos = (t) => String(t || "").split(/\n\s*\n/).map((p) => esc(p.trim()).replace(/\n/g, "<br>")).filter(Boolean);

/* ---------- Textos por tipo ---------- */
function textosCorreo(it, firma, aj) {
  aj = aj || {};
  const t = it.titulo, min = it.info.min, i = it.info;
  const dur = !min ? "" : min >= 55 && min <= 70 ? "Alrededor de 1 hora" : min > 70 ? `Alrededor de ${Math.round(min / 30) / 2} horas`.replace(".5", " y media") : `Unos ${min} minutos`;
  const limite = it.limite ? new Date(it.limite + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : "";
  const T = {
    clima: {
      eti: "Encuesta de clima", asunto: `${t}: tu opinión cuenta`,
      intro: `Queremos saber cómo vives tu trabajo: qué funciona y qué cambiarías. Esta encuesta va con tu nombre y sirve para decidir mejoras, nunca para evaluarte.`,
      datos: [["Duración", dur || "Pocos minutos"], ["Preguntas", i.n ? String(i.n) : "—"], ["Respuestas", "Con tu nombre"]],
      boton: "Responder la encuesta", nota: "El código es personal y sirve una sola vez. No lo reenvíes."
    },
    anonima: {
      eti: "Encuesta de clima · anónima", asunto: `${t}: tu opinión cuenta, y es anónima`,
      intro: `Queremos saber cómo vives tu trabajo: qué funciona y qué cambiarías. Es anónima: el código no lleva tu nombre y la plataforma no guarda a quién se ha enviado cada uno.`,
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
  /* Lo que RR.HH. ha cambiado en la vista previa (campanas.config.correo o
     dr_ciclos.config.correo). El recordatorio general de una anónima
     conserva su texto, que explica que se use el código anterior. */
  const limpio = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const asunto = limpio(aj.asunto, 150), intro = limpio(aj.intro, 1500), extra = limpio(aj.extra, 400);
  if (asunto) x.asunto = it.modo === "recordatorio" ? "Recordatorio: " + asunto : asunto;
  if (intro && it.modo !== "recordatorio") x.intro = intro;
  if (it.repite && it.modo !== "recordatorio") {
    x.asunto = "Recordatorio · " + x.asunto;
    x.intro = (it.modo === "desarrollo" ? "Todavía no consta el envío de tus valoraciones. " : "Todavía no consta como hecho. ") + x.intro;
  }
  return { ...x, extra, firma: limpio(aj.firma, 80) || firma, cargo: limpio(aj.cargo, 80), limite };
}

/* ---------- Correo ----------
   Maquetado con tablas, que es lo único que Outlook pinta igual que el
   resto. Sin imágenes remotas: la mayoría de los clientes las bloquean
   por defecto. La marca se construye con tipografía y color. */
const R = "#5B3FD9", R2 = "#EFEAFE", TINTA = "#231A3D", GRIS = "#5A5170", LINEA = "#E7DFF3", FONDO = "#FBF7FF";
const SANS = "'Segoe UI',system-ui,-apple-system,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

function montarCorreo(it, x, URL_APP, cargo) {
  cargo = x.cargo || cargo;
  const pila = (() => {
    const n = (it.nombre || "").trim(); if (!n || it.modo === "anonima" || it.modo === "recordatorio") return "";
    const p = n.includes(",") ? n.split(",")[1].trim().split(" ")[0] : n.split(" ")[0];
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  })();
  const conCodigo = it.modo !== "recordatorio";
  const primera = conCodigo && (it.modo === "anonima" || it.modo === "clima") && it.info.primera ? it.info.primera : null;
  const ESCALA = ["Casi nunca", "Pocas veces", "A veces", "A menudo", "Casi siempre"];
  const enlace = `${URL_APP}?codigo=`;
  // El botón ya lleva el código: la persona no tiene que escribirlo
  const directo = conCodigo ? enlace + encodeURIComponent(it.codigo) : URL_APP;
  const pasos = it.modo === "desarrollo"
    ? ["Pulsa el botón: tu código ya va incluido.", "Completa la ficha de cada persona.", "Pulsa «Enviar a RR.HH.» al terminar."]
    : it.modo === "formacion"
      ? ["Pulsa el botón: tu código ya va incluido.", "Repasa los módulos a tu ritmo.", "Haz el examen final y envíalo."]
      : ["Pulsa el botón: tu código ya va incluido.", "Responde las preguntas.", "Pulsa enviar al terminar."];

  const texto = [
    pila ? `Hola ${pila},` : "Hola,", "", x.intro, "", x.extra || null, x.extra ? "" : null,
    ...x.datos.map(([k, v]) => `${k}: ${v}`), x.datos.length ? "" : null,
    primera ? `Empieza aquí. Primera pregunta: ${primera.t} Respóndela en ${enlace}${it.codigo}` : null, primera ? "" : null,
    `Enlace: ${directo}`, conCodigo ? `Código, por si el enlace no funciona: ${it.codigo}` : null, "",
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
    ${parrafos(x.intro).map((p, k, a) => `<p style="margin:${k < a.length - 1 ? "0 0 12px" : "0"};font:400 16px/1.6 ${SANS};color:${TINTA}">${p}</p>`).join("")}
    ${x.extra ? `<p style="margin:14px 0 0;padding:11px 14px;background:${FONDO};border-left:3px solid ${R};border-radius:0 8px 8px 0;font:600 15px/1.5 ${SANS};color:${TINTA}">${esc(x.extra)}</p>` : ""}
  </td></tr>

  ${x.datos.length ? `<tr><td class="pad" style="padding:22px 38px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${LINEA};border-radius:12px"><tr>
      ${celdas}
    </tr></table>
  </td></tr>` : ""}

  ${primera ? `<tr><td class="pad" style="padding:22px 38px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO};border:1px solid #DCD2F7;border-radius:12px">
      <tr><td style="padding:18px 18px 6px">
        <div style="font:700 10.5px/1.3 ${SANS};color:${R};letter-spacing:.11em;text-transform:uppercase">Empieza aquí, con un clic · pregunta 1${it.info.n ? " de " + it.info.n : ""}</div>
        <div style="font:700 18px/1.35 ${SANS};color:${TINTA};padding-top:10px">${esc(primera.t)}</div>
        <div style="font:400 13px/1.4 ${SANS};color:${GRIS};padding-top:6px">¿Hasta qué punto es verdad?</div>
      </td></tr>
      <tr><td style="padding:8px 14px 6px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          ${ESCALA.map((e, k) => `<td width="20%" style="padding:0 3px"><a href="${esc(enlace + encodeURIComponent(it.codigo) + "&r=" + primera.id + ":" + k)}" style="display:block;text-decoration:none;background:#ffffff;border:1.5px solid ${LINEA};border-radius:10px;padding:10px 2px;text-align:center">
            <span style="display:block;font:700 16px/1.2 ${SANS};color:${R}">${k + 1}</span><span style="display:block;font:400 11.5px/1.25 ${SANS};color:${TINTA};padding-top:3px">${e}</span></a></td>`).join("")}
        </tr></table>
      </td></tr>
      <tr><td style="padding:6px 18px 16px;font:400 12.5px/1.5 ${SANS};color:${GRIS}">Al pulsar, se abre la encuesta con esta respuesta ya guardada y sigues por la pregunta 2.</td></tr>
    </table>
  </td></tr>` : ""}

  ${conCodigo ? `<tr><td class="pad" style="padding:22px 38px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FONDO};border:1px dashed #C9BCF5;border-radius:12px">
      <tr><td align="center" style="padding:20px 18px 21px">
        <div style="font:600 10.5px/1 ${SANS};color:${GRIS};letter-spacing:.11em;text-transform:uppercase">Tu código · por si el botón no funciona</div>
        <div class="cod" style="font:700 30px/1.2 ${MONO};color:${TINTA};letter-spacing:.1em;padding-top:10px">${esc(it.codigo)}</div>
      </td></tr>
    </table>
  </td></tr>` : ""}

  <tr><td class="pad" align="center" style="padding:24px 38px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="${R}" style="border-radius:10px">
        <a href="${esc(directo)}" style="display:inline-block;padding:15px 36px;font:600 16px/1 ${SANS};color:#ffffff;text-decoration:none;border-radius:10px">${esc(x.boton)} &rarr;</a>
      </td>
    </tr></table>
    <p style="margin:12px 0 0;font:400 12.5px/1.5 ${SANS};color:${GRIS}">o copia esta dirección: <span style="color:${TINTA};word-break:break-all">${esc(directo)}</span></p>
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

/* Para la vista previa y la función: todo en uno */
function prepararCorreo(it, firma, cargo, URL_APP, aj) {
  return montarCorreo(it, textosCorreo(it, firma, aj), URL_APP, cargo);
}
globalThis.CORREO = { esc, textosCorreo, montarCorreo, prepararCorreo };
})();
