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

  // ── Helpers de mapping ───────────────────────────────────────
  const publicUrlFor = (bucket, path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${window.STZ_CONFIG.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  };

  const productImg = (row) => {
    if (row.imagen_url) return row.imagen_url;
    return publicUrlFor(window.STZ_CONFIG.PRODUCTOS_BUCKET, row.imagen_path);
  };
  const desarmeImg = (row, kind) => {
    const url = row[`${kind}_url`];
    if (url) return url;
    return publicUrlFor(window.STZ_CONFIG.DESARME_BUCKET, row[`${kind}_path`]);
  };

  function mapCategoria(row, i, productos) {
    const categoryKey = row.codigo ? row.codigo.toLowerCase() : row.id;
    const count = productos.filter((p) => p.categoria_principal_id === row.id).length;
    return {
      id: categoryKey,
      _uuid: row.id,
      code: 'CAT · ' + String(i + 1).padStart(2, '0'),
      name: row.nombre,
      count,
      img: row.imagen_url || null,
      ph: row.nombre,
      visible_index: row.visible_index === true,
    };
  }

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
    return {
      id: row.id,
      oem: null,
      internal: row.sku,
      name: row.nombre,
      category: categoryKey,
      brand: null,
      model: null,
      yearFrom: null,
      yearTo: null,
      condition: 'usado',
      price: row.precio_venta != null ? Number(row.precio_venta) : null,
      stock: null,
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

  function mapUnidad(row, piezasPorUnidad) {
    const piezas = piezasPorUnidad.get(row.id) || [];
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
      img: desarmeImg(row, 'foto_principal'),
      ph: [row.marca, row.modelo, row.anio].filter(Boolean).join(' '),
      descripcion: row.descripcion || '',
      featured: row.destacado_web === true,
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

    const mappedProductos = (prods.data || []).map((p) =>
      mapProducto(p, categoriasByUuid, galeriaPorProducto)
    );
    const mappedCategorias = (cats.data || []).map((c, i) => mapCategoria(c, i, prods.data || []));
    const mappedUnidades = (unidades.data || []).map((u) => mapUnidad(u, piezasPorUnidad));
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
