/* ============================================================================
   CONFIG — claves y ajustes del despliegue
   ----------------------------------------------------------------------------
   La `anonKey` de Supabase está DISEÑADA para viajar dentro de apps cliente:
   no es secreta, y la protección real son las políticas RLS de la tabla.
   La `service_role` NUNCA va acá ni en ningún archivo del navegador.
   ========================================================================== */

window.CONFIG = {
  // Proyecto de Supabase de Gabriel
  supabaseUrl: "https://mcoyqnnfmvzeirwbxuzo.supabase.co",

  // Publishable key (formato nuevo de Supabase). Es la que reemplaza a la
  // vieja `anon public` y cumple el mismo rol: identifica al proyecto y actúa
  // como el rol `anon`. Va dentro del navegador a propósito; quien protege los
  // datos son las políticas RLS de la tabla `progreso`, no esta clave.
  supabaseAnonKey: "sb_publishable_JAQkKNw1dIiiJ4tgPEjCUg_P4OWJvTk",

  // identificador del jugador dentro de la tabla `progreso`
  jugadorId: "gabriel",

  version: "1.0.0"
};
