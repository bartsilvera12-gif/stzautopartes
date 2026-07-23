/* ============================================================
   STZ AUTOPARTES · Configuración
   ------------------------------------------------------------
   Rellenar con los valores del proyecto Supabase de STZ.
   La anon key es pública por diseño (RLS + vistas restringen
   lo que se puede leer). Igual conviene NO commitear el archivo
   con placeholders vacíos si el sitio ya está deployado.
   ============================================================ */

window.STZ_CONFIG = {
  // Ejemplo: 'https://abcdefg.supabase.co'
  SUPABASE_URL: '__RELLENAR__',

  // Ejemplo: 'eyJhbGciOiJIUzI1NiIs...'  (anon public key, Settings → API)
  SUPABASE_ANON_KEY: '__RELLENAR__',

  // Schema del ERP de STZ AutoPartes. Debe estar en Settings → API → Exposed schemas.
  SUPABASE_SCHEMA: 'stzautoparteserp',

  // Bucket público de fotos de productos.
  PRODUCTOS_BUCKET: 'productos-imagenes',

  // Bucket público de fotos del módulo Desarme.
  DESARME_BUCKET: 'desarme-imagenes',
};
