/* ============================================================
   STZ AUTOPARTES · Boot
   ------------------------------------------------------------
   Orquesta el arranque:
     1) Carga el CDN de Supabase.
     2) Consulta las vistas públicas del ERP (schema stzautoparteserp).
     3) Mapea los rows al shape que espera el sitio (STZ_PRODUCTS,
        STZ_CATEGORIES, STZ_UNITS).
     4) Inyecta layout.js y app.js (en ese orden) una vez listo.

   Este archivo se carga después de config.js y data.js. Espera
   que exista window.STZ_CONFIG.
   ============================================================ */

(function () {
  const CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  function showFatal(msg) {
    console.error('[STZ boot] ' + msg);
    const banner = document.createElement('div');
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:9999;background:#7f1d1d;color:#fff;' +
      'padding:12px 16px;font:14px/1.4 system-ui;text-align:center';
    banner.textContent = 'No se pudieron cargar los datos del catálogo. ' + msg;
    document.addEventListener('DOMContentLoaded', () => document.body.prepend(banner));
  }

  // ── Fallbacks locales (si el ERP no manda imagen) ────────────
  // Las categorias usan la imagen historica del sitio segun el codigo. Si el
  // codigo no matchea, cae a un generico. `otras.jpg` es el fallback global.
  const CATEGORIA_FALLBACK_IMG = {
    burletes: 'assets/img/fotos/cat-burletes.jpg',
    faros: 'assets/img/fotos/faro-delantero.jpg',
    comandos: 'assets/img/fotos/comandos.jpg',
    electrico: 'assets/img/fotos/cat-electrico.jpg',
    interior: 'assets/img/fotos/cat-interior.jpg',
    bombas: 'assets/img/fotos/cat-bombas.jpg',
    frisos: 'assets/img/fotos/cabina-techo.jpg',
    motores: 'assets/img/fotos/cat-motores.jpg',
    otras: 'assets/img/fotos/otras.jpg',
  };
  const CATEGORIA_FALLBACK_DEFAULT = 'assets/img/fotos/otras.jpg';

  // Las unidades de desarme rotan entre las fotos de vehiculos ya subidas al
  // repo. Se asigna por hash del id de la unidad para que cada unidad muestre
  // siempre la misma placeholder entre reloads.
  const UNIDAD_FALLBACK_IMGS = [
    'assets/img/fotos/unidades/toyota-voxy-2010.jpg',
    'assets/img/fotos/unidades/toyota-wish-2010.jpg',
    'assets/img/fotos/unidades/toyota-premio-2012.jpg',
    'assets/img/fotos/unidades/toyota-auris-2010.jpg',
    'assets/img/fotos/unidades/toyota-axio-2005.jpg',
    'assets/img/fotos/unidades/toyota-vitz-2005.jpg',
    'assets/img/fotos/unidades/toyota-vitz-rs-2005-2007.jpg',
    'assets/img/fotos/unidades/toyota-duet-2003.jpg',
    'assets/img/fotos/unidades/toyota-mr-s-1999.jpg',
    'assets/img/fotos/unidades/kia-rio-2014.jpg',
  ];
  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  const unidadFallbackImg = (id) => UNIDAD_FALLBACK_IMGS[hashStr(String(id || '')) % UNIDAD_FALLBACK_IMGS.length];

  // ── Helpers de mapping ───────────────────────────────────────
  // raw.githubusercontent.com sirve las imagenes con CSP sandbox, lo que hace
  // que muchos browsers no las rendericen dentro de <img>. Reescribimos a
  // jsDelivr en cliente para que funcione sin depender de un UPDATE en la DB.
  const rewriteGithubRaw = (url) => {
    if (!url) return url;
    return url.replace(
      /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\//,
      'https://cdn.jsdelivr.net/gh/$1/$2@$3/'
    );
  };

  const publicUrlFor = (bucket, path) => {
    if (!path) return null;
    if (path.startsWith('http')) return rewriteGithubRaw(path);
    return `${window.STZ_CONFIG.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  };

  const productImg = (row) => {
    if (row.imagen_url) return rewriteGithubRaw(row.imagen_url);
    return publicUrlFor(window.STZ_CONFIG.PRODUCTOS_BUCKET, row.imagen_path);
  };
  const desarmeImg = (row, kind) => {
    const url = row[`${kind}_url`];
    if (url) return rewriteGithubRaw(url);
    return publicUrlFor(window.STZ_CONFIG.DESARME_BUCKET, row[`${kind}_path`]);
  };

  function mapCategoria(row, i, productos) {
    const categoryKey = row.codigo ? row.codigo.toLowerCase() : row.id;
    const count = productos.filter((p) => p.categoria_principal_id === row.id).length;
    const fallback = CATEGORIA_FALLBACK_IMG[categoryKey] || CATEGORIA_FALLBACK_DEFAULT;
    return {
      id: categoryKey,
      _uuid: row.id,
      code: 'CAT · ' + String(i + 1).padStart(2, '0'),
      name: row.nombre,
      count,
      img: rewriteGithubRaw(row.imagen_url) || fallback,
      ph: row.nombre,
      visible_index: row.visible_index === true,
    };
  }

  // ── Promociones ───────────────────────────────────────────────
  // Aplica descuento por porcentaje o monto respetando ventana de fechas.
  // Devuelve { hasPromo, original, final, discountLabel } con precio final.
  window.stzPromo = function stzPromo(p) {
    const original = p && p.price != null ? Number(p.price) : null;
    if (original == null || !p) return { hasPromo: false, original, final: original, discountLabel: '' };
    const type = p.discount_type;
    const value = p.discount_value;
    if (!type || value == null || !(value > 0)) return { hasPromo: false, original, final: original, discountLabel: '' };
    const now = Date.now();
    const startOk = !p.discount_starts_at || new Date(p.discount_starts_at).getTime() <= now;
    const endOk = !p.discount_ends_at || new Date(p.discount_ends_at).getTime() >= now;
    if (!startOk || !endOk) return { hasPromo: false, original, final: original, discountLabel: '' };
    let final = original;
    let label = '';
    if (type === 'percent' || type === 'porcentaje' || type === '%') {
      final = original * (1 - value / 100);
      label = '-' + Math.round(value) + '%';
    } else if (type === 'amount' || type === 'monto' || type === 'fijo') {
      final = original - value;
      label = '-₲ ' + Math.round(value).toLocaleString('es-PY').replace(/,/g, '.');
    }
    if (!(final < original) || final < 0) return { hasPromo: false, original, final: original, discountLabel: '' };
    return { hasPromo: true, original, final: Math.round(final), discountLabel: label };
  };

  function mapProducto(row, categoriasByUuid, galeriaPorProducto) {
    const cat = categoriasByUuid.get(row.categoria_principal_id);
    const categoryKey = cat ? (cat.codigo ? cat.codigo.toLowerCase() : cat.id) : 'otras';
    const galeria = galeriaPorProducto.get(row.id) || [];
    const principalUrl = productImg(row);
    const photos = [];
    if (principalUrl) photos.push([principalUrl, row.nombre]);
    galeria.forEach((g) => {
      const url = g.url || publicUrlFor(window.STZ_CONFIG.PRODUCTOS_BUCKET, g.path);
      if (url && url !== principalUrl) photos.push([url, row.nombre]);
    });
    const anioD = row.anio_desde != null ? Number(row.anio_desde) : null;
    const anioH = row.anio_hasta != null ? Number(row.anio_hasta) : null;
    return {
      id: row.id,
      oem: row.oem || null,
      internal: row.sku,
      name: row.nombre,
      category: categoryKey,
      brand: row.marca_vehiculo || null,
      model: row.modelo_vehiculo || null,
      yearFrom: anioD,
      yearTo: anioH != null ? anioH : anioD,
      condition: 'usado',
      price: row.precio_venta != null ? Number(row.precio_venta) : null,
      // Semantica de stock para la web:
      //   controla_stock=false  -> null -> 'Consultar disponibilidad'
      //   controla_stock=true   -> stock_actual (0 = agotado, 1 = ultima, N = ok)
      stock: row.controla_stock === false
        ? null
        : (row.stock_actual != null ? Math.max(0, Math.floor(Number(row.stock_actual))) : null),
      side: null,
      unit: null,
      img: principalUrl,
      ph: row.nombre,
      notes: row.descripcion || '',
      compat: [],
      photos: photos.length > 0 ? photos : [[principalUrl || '', row.nombre]],
      featured: row.destacado_web === true,
      discount_type: row.discount_type,
      discount_value: row.discount_value != null ? Number(row.discount_value) : null,
      discount_starts_at: row.discount_starts_at,
      discount_ends_at: row.discount_ends_at,
    };
  }

  function mapUnidad(row, piezasPorUnidad, galeriaPorUnidad) {
    const piezas = piezasPorUnidad.get(row.id) || [];
    const principalUrl = desarmeImg(row, 'foto_principal') || unidadFallbackImg(row.id);
    const galeria = galeriaPorUnidad.get(row.id) || [];
    // photos: [[url, epigrafe], ...] — la primera es la principal
    const photos = [];
    if (principalUrl) photos.push([principalUrl, [row.marca, row.modelo].filter(Boolean).join(' ')]);
    galeria.forEach((g) => {
      const url = g.url || publicUrlFor(window.STZ_CONFIG.DESARME_BUCKET, g.path);
      if (url && url !== principalUrl) photos.push([url, [row.marca, row.modelo].filter(Boolean).join(' ')]);
    });
    return {
      id: row.id,
      code: row.codigo || row.id.slice(0, 8),
      name: [row.marca, row.modelo].filter(Boolean).join(' '),
      year: row.anio,
      engine: row.motor,
      gearbox: row.caja,
      fuel: row.combustible,
      pieces: piezas.length,
      status: row.estado === 'agotada' ? 'low' : 'ok',
      img: principalUrl,
      ph: [row.marca, row.modelo, row.anio].filter(Boolean).join(' '),
      descripcion: row.descripcion || '',
      featured: row.destacado_web === true,
      photos,
      imgs: photos.slice(1).map(([u]) => u),
      partsList: piezas.map((p) => ({
        id: p.id,
        name: p.nombre,
        descripcion: p.descripcion || '',
        price: p.precio != null ? Number(p.precio) : null,
        img: p.imagen_url || publicUrlFor(window.STZ_CONFIG.DESARME_BUCKET, p.imagen_path),
      })),
      zones: [],
    };
  }

  // ── Fetch ────────────────────────────────────────────────────
  async function fetchAll(sb) {
    const [cats, prods, imgs, unidades, unidadImgs, piezas] = await Promise.all([
      sb.from('categorias_publicas').select('*'),
      sb.from('productos_publicos').select('*'),
      sb.from('producto_imagenes_publicas').select('*'),
      sb.from('desarme_unidades_publicas').select('*'),
      sb.from('desarme_unidad_imagenes_publicas').select('*'),
      sb.from('desarme_piezas_publicas').select('*'),
    ]);
    const anyErr = [cats, prods, imgs, unidades, unidadImgs, piezas].find((r) => r.error);
    if (anyErr) throw new Error(anyErr.error.message);

    const categoriasByUuid = new Map((cats.data || []).map((c) => [c.id, c]));
    const galeriaPorProducto = new Map();
    (imgs.data || []).forEach((g) => {
      const arr = galeriaPorProducto.get(g.producto_id) || [];
      arr.push(g);
      arr.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      galeriaPorProducto.set(g.producto_id, arr);
    });
    const piezasPorUnidad = new Map();
    (piezas.data || []).forEach((p) => {
      const arr = piezasPorUnidad.get(p.unidad_id) || [];
      arr.push(p);
      piezasPorUnidad.set(p.unidad_id, arr);
    });
    const galeriaPorUnidad = new Map();
    (unidadImgs.data || []).forEach((g) => {
      const arr = galeriaPorUnidad.get(g.unidad_id) || [];
      arr.push(g);
      arr.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      galeriaPorUnidad.set(g.unidad_id, arr);
    });

    const mappedProductos = (prods.data || []).map((p) =>
      mapProducto(p, categoriasByUuid, galeriaPorProducto)
    );
    const mappedCategorias = (cats.data || []).map((c, i) => mapCategoria(c, i, prods.data || []));
    const mappedUnidades = (unidades.data || []).map((u) => mapUnidad(u, piezasPorUnidad, galeriaPorUnidad));
    return { categorias: mappedCategorias, productos: mappedProductos, unidades: mappedUnidades };
  }

  // ── Main ─────────────────────────────────────────────────────
  async function main() {
    if (!window.STZ_CONFIG || window.STZ_CONFIG.SUPABASE_URL === '__RELLENAR__') {
      showFatal('Falta configurar Supabase en assets/js/config.js.');
      return;
    }
    try {
      await loadScript(CDN_URL);
    } catch (e) {
      showFatal('No se pudo cargar el SDK de Supabase. ¿Hay conexión?');
      return;
    }

    const supabase = window.supabase.createClient(
      window.STZ_CONFIG.SUPABASE_URL,
      window.STZ_CONFIG.SUPABASE_ANON_KEY,
      { db: { schema: window.STZ_CONFIG.SUPABASE_SCHEMA } }
    );

    try {
      const { categorias, productos, unidades } = await fetchAll(supabase);
      STZ_CATEGORIES = categorias;
      STZ_PRODUCTS = productos;
      STZ_UNITS = unidades;
      window.STZ_CATEGORIES = STZ_CATEGORIES;
      window.STZ_PRODUCTS = STZ_PRODUCTS;
      window.STZ_UNITS = STZ_UNITS;
    } catch (e) {
      console.error('[STZ boot] fetch error', e);
      showFatal('Error al leer el catálogo: ' + (e && e.message ? e.message : e));
      // Igual seguimos cargando layout/app para que la maquetación aparezca vacía.
    }

    try {
      await loadScript('assets/js/layout.js');
      await loadScript('assets/js/app.js');
      // layout.js y app.js registran su init con DOMContentLoaded. Como boot
      // los inyecta despues (ya se disparo el evento del documento), les
      // avisamos manualmente para que corran el init.
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        document.dispatchEvent(new Event('DOMContentLoaded'));
      }
    } catch (e) {
      showFatal('No se pudo cargar la interfaz.');
    }
  }

  main();
})();
