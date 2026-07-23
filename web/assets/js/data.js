/* ============================================================
   STZ AUTOPARTES · Datos
   ------------------------------------------------------------
   Los arrays STZ_CATEGORIES / STZ_PRODUCTS / STZ_UNITS los
   llena boot.js con datos del ERP (Supabase). Este archivo
   sólo declara los bindings vacíos y las constantes estáticas
   de UI (etiquetas, WhatsApp).
   ============================================================ */

/* Número de WhatsApp de la tienda (formato internacional, sin +) */
const STZ_WHATSAPP = '595973738238';

/* Etiquetas de condición usadas por el catálogo. */
const STZ_CONDITION_LABEL = { nuevo:'Nuevo', usado:'Usado original', recuperado:'Recuperado verificado' };
const STZ_CONDITION_SHORT = { nuevo:'NUEVO', usado:'USADO ORIGINAL', recuperado:'RECUPERADO VERIF.' };

/* Populados por boot.js desde el ERP. `let` para que boot pueda reasignarlos.
   Los classic scripts comparten scope, así que app.js/layout.js los ven. */
let STZ_CATEGORIES = [];
let STZ_PRODUCTS = [];
let STZ_UNITS = [];
