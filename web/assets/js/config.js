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
  SUPABASE_URL: 'https://api.neura.com.py',

  // Ejemplo: 'eyJhbGciOiJIUzI1NiIs...'  (anon public key, Settings → API)
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc0MTAxNDYxLCJleHAiOjE5MzE3ODE0NjF9.7_wAph8IolPMXtgfpezSwS5XR62IdD__qhqCywLDp3Q',

  // Schema del ERP de STZ AutoPartes. Debe estar en Settings → API → Exposed schemas.
  SUPABASE_SCHEMA: 'stzautoparteserp',

  // Bucket público de fotos de productos.
  PRODUCTOS_BUCKET: 'productos-imagenes',

  // Bucket público de fotos del módulo Desarme.
  DESARME_BUCKET: 'desarme-imagenes',
};
