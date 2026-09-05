/* ============================================================================
   CONFIG — claves y ajustes del despliegue
   ----------------------------------------------------------------------------
   La `anonKey` de Supabase está DISEÑADA para viajar dentro de apps cliente:
   no es secreta, y la protección real son las políticas RLS de la tabla.
   La `service_role` NUNCA va acá ni en ningún archivo del navegador.
   ========================================================================== */

window.CONFIG = {
  // Proyecto de Supabase de Gabriel
  supabaseUrl: "https://qdyssqmggbmwoctfnnoi.supabase.co",

  // PENDIENTE: pegar acá la anon / publishable key.
  // Supabase → Project Settings → API → "anon public"
  supabaseAnonKey: "",

  // identificador del jugador dentro de la tabla `progreso`
  jugadorId: "gabriel",

  version: "1.0.0"
};
