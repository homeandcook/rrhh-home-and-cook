// ===================================================================
// Pippole · reseñas de Google (Employer Branding, 0.36.0)
//
// Lee de la API de Google Places (New), con la clave guardada en el
// secreto GOOGLE_PLACES_KEY. Solo RR.HH. (rol admin) puede llamarla.
//   { buscar: "texto" }        → sitios candidatos (id, nombre, dirección)
//   { sitios: ["place_id", …] } → nota, número de reseñas, enlace y hasta
//                                 5 reseñas de cada sitio (límite de Google)
// No guarda nada: las condiciones de Google no permiten almacenar el
// contenido de Places (salvo el place_id). Cada consulta se hace en vivo.
// Coste: Place Details con reseñas es un SKU «Enterprise + Atmosphere»,
// con 1.000 consultas gratis al mes; la web limita la actualización
// automática a una vez al día por persona.
// ===================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const BASE = "https://places.googleapis.com/v1";
const MAX_SITIOS = 40;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const KEY = Deno.env.get("GOOGLE_PLACES_KEY");
  if (!KEY) return json({ error: "FALTA_CLAVE" }, 503);

  const auth = req.headers.get("Authorization") || "";
  const suyo = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: usuario } = await suyo.auth.getUser();
  if (!usuario || !usuario.user) return json({ error: "Sesión no válida" }, 401);
  const { data: quien } = await suyo.from("perfiles").select("rol, activo").eq("id", usuario.user.id).maybeSingle();
  if (!quien || quien.activo === false || quien.rol !== "admin") return json({ error: "Solo RR.HH. puede consultar las reseñas" }, 403);

  // deno-lint-ignore no-explicit-any
  let body: any = {};
  try { body = await req.json(); } catch (_) { return json({ error: "Petición no válida" }, 400); }
  const idioma = typeof body.idioma === "string" && /^[a-z]{2}$/.test(body.idioma) ? body.idioma : "es";

  if (typeof body.buscar === "string") {
    const q = body.buscar.trim().slice(0, 120);
    if (q.length < 3) return json({ error: "Escribe al menos 3 letras" }, 400);
    const r = await fetch(`${BASE}/places:searchText`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress" },
      body: JSON.stringify({ textQuery: q, languageCode: idioma, maxResultCount: 8 })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: "GOOGLE", detalle: (d && d.error && d.error.message) || r.status }, 502);
    // deno-lint-ignore no-explicit-any
    return json({ sitios: (d.places || []).map((p: any) => ({ id: p.id, nombre: p.displayName && p.displayName.text, direccion: p.formattedAddress })) });
  }

  if (Array.isArray(body.sitios)) {
    const ids = [...new Set(body.sitios.filter((x: unknown) => typeof x === "string" && /^[A-Za-z0-9_-]{10,300}$/.test(x as string)))].slice(0, MAX_SITIOS) as string[];
    const campos = "id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,reviews";
    const res = await Promise.all(ids.map(async (id) => {
      try {
        const r = await fetch(`${BASE}/places/${encodeURIComponent(id)}?languageCode=${idioma}`, { headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": campos } });
        const p = await r.json().catch(() => ({}));
        if (!r.ok) return { id, error: (p && p.error && p.error.message) || String(r.status) };
        return {
          id, nombre: p.displayName && p.displayName.text, direccion: p.formattedAddress, nota: p.rating ?? null, total: p.userRatingCount ?? 0, enlace: p.googleMapsUri || null,
          // deno-lint-ignore no-explicit-any
          resenas: (p.reviews || []).map((v: any) => ({
            id: v.name, nota: v.rating, texto: (v.text && v.text.text) || (v.originalText && v.originalText.text) || "",
            hace: v.relativePublishTimeDescription || "", fecha: v.publishTime || null, enlace: v.googleMapsUri || null,
            autor: v.authorAttribution ? { nombre: v.authorAttribution.displayName, uri: v.authorAttribution.uri, foto: v.authorAttribution.photoUri } : null
          }))
        };
      } catch (e) { return { id, error: String(e) }; }
    }));
    return json({ sitios: res, consultado: new Date().toISOString() });
  }
  return json({ error: "No se ha indicado qué consultar" }, 400);
});
