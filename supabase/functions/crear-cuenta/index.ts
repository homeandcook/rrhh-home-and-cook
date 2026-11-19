// ===================================================================
// Pippole · alta de cuentas (0.37.0)
//
// Crea la cuenta de acceso de un usuario nuevo. Solo RR.HH. (rol admin)
// puede llamarla. Sustituye al registro público de Supabase, que
// permitía a cualquiera con la clave publicable crearse una cuenta.
// Con esta función, el registro público se puede desactivar en
// Authentication → Sign In / Providers → «Allow new users to sign up».
//
//   { email, password } → { id }   (la cuenta queda confirmada)
//
// El perfil (nombre, rol, zona) lo sigue creando la web con la sesión
// de RR.HH., así que las reglas por fila de «perfiles» siguen mandando.
// Usa la clave de servicio que Supabase pone en las funciones; nunca
// sale de aquí.
// ===================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const URL_SB = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") || "";
  const suyo = createClient(URL_SB, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: usuario } = await suyo.auth.getUser();
  if (!usuario || !usuario.user) return json({ error: "Sesión no válida" }, 401);
  const { data: quien } = await suyo.from("perfiles").select("rol, activo").eq("id", usuario.user.id).maybeSingle();
  if (!quien || quien.activo === false || quien.rol !== "admin") return json({ error: "Solo RR.HH. puede crear usuarios" }, 403);

  // deno-lint-ignore no-explicit-any
  let body: any = {};
  try { body = await req.json(); } catch (_) { return json({ error: "Petición no válida" }, 400); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/.test(email)) return json({ error: "Usuario no válido" }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: "La contraseña debe tener entre 8 y 72 caracteres" }, 400);

  const admin = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    const m = error.message || "";
    if (/already|registered|exists/i.test(m)) return json({ error: "EXISTE" }, 409);
    return json({ error: m || "No se ha podido crear la cuenta" }, 400);
  }
  return json({ id: data.user && data.user.id });
});
