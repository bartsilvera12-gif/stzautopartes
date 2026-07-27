<?php
/**
 * Config del lado del servidor para generar las vistas previas (Open Graph).
 *
 * Son los mismos valores que assets/js/config.js. La anon key es pública por
 * diseño: RLS y las vistas `*_publicas` limitan lo que se puede leer. Si
 * cambian en config.js, hay que cambiarlos también acá.
 */

define('STZ_SUPABASE_URL', 'https://api.neura.com.py');
define('STZ_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc0MTAxNDYxLCJleHAiOjE5MzE3ODE0NjF9.7_wAph8IolPMXtgfpezSwS5XR62IdD__qhqCywLDp3Q');
define('STZ_SUPABASE_SCHEMA', 'stzautoparteserp');

/** Sin barra final. Se usa para armar og:url y la imagen de respaldo. */
define('STZ_SITE_URL', 'https://stzautopartes.com');
