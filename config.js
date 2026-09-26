// Datos de tu proyecto de Supabase (Project Settings > API Keys, o el botón Connect).
// Usa la clave PUBLICABLE (empieza por sb_publishable_). En proyectos antiguos se
// llamaba "anon" y también vale. Es pública por diseño: la seguridad la ponen las
// reglas de la base de datos (supabase/schema.sql).
// NUNCA pongas aquí una clave secreta (sb_secret_ o service_role).
window.APP_CONFIG = {
  supabaseUrl: "https://hrybclllymcsbujancuw.supabase.co",
  supabaseAnonKey: "sb_publishable_f3punkQZ6WiowP4xIrc8VQ_8BoVB-Sp",
  // Los usuarios entran con un nombre (p. ej. "rm.sur"). Internamente se
  // convierte en rm.sur@<dominio>. No se envía ningún correo.
  dominioUsuarios: "homeandcook.app",
  // Herramientas internas que se abren en una pestaña nueva (solo con la VPN conectada).
  // Deja la url vacía para que no aparezca la tarjeta.
  enlaces: {
    hometime: "http://sw86t882/timetableplanner/login"
  }
};
