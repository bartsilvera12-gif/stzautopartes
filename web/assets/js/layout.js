/* ============================================================
   STZ AUTOPARTES · layout compartido, carrito y utilidades
   ============================================================ */

/* ---------- utilidades ---------- */
const $  = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

function gs(n){ return '₲ ' + Math.round(n).toLocaleString('es-PY').replace(/,/g,'.'); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function waLink(text){ return 'https://wa.me/' + STZ_WHATSAPP + '?text=' + encodeURIComponent(text); }
function getProduct(id){ return STZ_PRODUCTS.find(p => p.id === id); }

/* <img> de foto real; si falta el archivo queda el marcador gris con la descripción */
function photo(file, alt){
  return file ? `<img class="photo" src="${imgSrc(file)}" alt="${esc(alt)}" loading="lazy">` : '';
}
function photoBox(file, alt, cls){
  return `<div class="ph ${cls || ''}" data-ph="${esc(alt)}">${photo(file, alt)}</div>`;
}
function getUnit(code){ return STZ_UNITS.find(u => u.code === code); }

/* ---------- compartir ---------- */
function shareIconSVG(){
  return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
       +   '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>'
       +   '<path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'
       + '</svg>';
}
function wireShareButton(btn, title, url){
  if (!btn) return;
  const href = url || location.href;
  btn.addEventListener('click', async (e) => {
    e.preventDefault(); e.stopPropagation();
    const data = { title: title || document.title, text: title || document.title, url: href };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch(_){ /* usuario canceló */ return; }
    try {
      await navigator.clipboard.writeText(href);
      toast('Enlace copiado');
    } catch(_){
      /* último fallback: abrir en WhatsApp */
      window.open('https://wa.me/?text=' + encodeURIComponent((title ? title + ' — ' : '') + href), '_blank', 'noopener');
    }
  });
}

/* ---------- carrito (localStorage) ---------- */
const CART_KEY = 'stz_cart_v1';

function cartRead(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch(e){ return {}; }
}
function cartWrite(c){
  try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch(e){}
  cartRefresh();
  document.dispatchEvent(new CustomEvent('cart:change'));
}
function cartAdd(id, qty){
  const c = cartRead();
  c[id] = (c[id] || 0) + (qty || 1);
  cartWrite(c);
  toast('Agregado al carrito · ' + id);
}
function cartSet(id, qty){
  const c = cartRead();
  if (qty <= 0) delete c[id]; else c[id] = qty;
  cartWrite(c);
}
function cartRemove(id){ cartSet(id, 0); }
function cartCount(){ return Object.values(cartRead()).reduce((a,b) => a + b, 0); }
function cartItems(){
  const c = cartRead();
  return Object.keys(c).map(id => ({ product: getProduct(id), qty: c[id] })).filter(x => x.product);
}
function cartTotal(){ return cartItems().reduce((a,i) => a + i.product.price * i.qty, 0); }

function cartRefresh(){
  const n = cartCount();
  $$('[data-cart-count]').forEach(el => { el.textContent = String(n).padStart(2,'0'); });
  $$('[data-cart-total]').forEach(el => { el.textContent = gs(cartTotal()); });
}

/* observador del alto del header (ver renderHeader) — vive acá para que no lo recolecten */
let headerRO = null;

/* ---------- toast ---------- */
let toastTimer;
function toast(msg){
  let t = $('#stz-toast');
  if (!t){
    t = document.createElement('div');
    t.id = 'stz-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);background:#111;color:#fff;' +
      'padding:12px 20px;font-family:var(--mono);font-size:12px;letter-spacing:.08em;z-index:300;' +
      'border-left:3px solid #E10600;opacity:0;transition:opacity .2s;pointer-events:none;max-width:90vw;text-align:center';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}

/* ---------- marca ---------- */
/* SVG del carrito — línea de 1.7 px, coherente con el sistema técnico */
const CART_SVG = `<svg class="cart-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" ` +
                 `fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="miter">` +
                 `<path d="M3 4h2.2l2.5 11h11l2.3-8H6.5"/>` +
                 `<circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>`;

/* logo real (PNG con fondo transparente) para superficies claras: header y barra móvil */
const LOGO_IMG = `<img class="logo-img logo-oscuro" src="assets/img/logo-stz.png" alt="STZ AutoPartes" width="535" height="296">` +
                 `<img class="logo-img logo-claro" src="assets/img/logo-stz-light.png" alt="" aria-hidden="true" width="535" height="296">`;

/* marca vectorial para superficies oscuras (menú lateral y pie) */
const LOGO_SVG = (light) => `
<svg width="40" height="27" viewBox="0 0 42 28" aria-hidden="true">
  <path d="M2 22 L16 6 L20 6 L14 14 L22 14 L18 22 Z" fill="#E10600"/>
  <path d="M22 22 L36 6 L40 6 L34 14 L42 14 L38 22 Z" fill="${light ? '#fff' : '#111'}" transform="translate(-2,0)"/>
</svg>`;

const NAV = [
  { href:'index.html',    label:'Inicio',               key:'home' },
  { href:'catalogo.html', label:'Repuestos',            key:'catalogo' },
  { href:'desarme.html',  label:'Vehículos en desarme', key:'desarme' },
  { href:'index.html#confianza', label:'Nosotros',      key:'nosotros' },
  { href:'index.html#contacto',  label:'Contacto',      key:'contacto' }
];

/* ---------- header ---------- */
function renderHeader(){
  const host = $('#site-header');
  if (!host) return;
  const page = document.body.dataset.page || '';

  host.innerHTML = `
  <header class="site-header">
    <div class="header-inner">
      <a class="logo" href="index.html" aria-label="STZ AutoPartes · inicio">${LOGO_IMG}</a>
      <nav class="main-nav">
        ${NAV.map(n => `<a href="${n.href}" class="${n.key === page ? 'active' : ''}">${n.label}</a>`).join('')}
      </nav>
      <div class="header-actions">
        <a class="icon-btn" href="${waLink('Hola STZ, quiero hacer una consulta.')}" target="_blank" rel="noopener">
          <span class="dot dot-green"></span>WhatsApp
        </a>
        <a class="cart-btn" href="carrito.html">${CART_SVG}<span>Carrito</span><span class="cart-count" data-cart-count>00</span></a>
      </div>
    </div>

    <div class="mobile-bar">
      <a class="logo" href="index.html" aria-label="STZ AutoPartes · inicio">${LOGO_IMG}</a>
      <div class="mobile-icons">
        <button type="button" onclick="location.href='carrito.html'" aria-label="Carrito">${CART_SVG}<span class="badge" data-cart-count>00</span></button>
        <button class="mobile-hamb" type="button" data-open-menu aria-label="Menú">
          <svg viewBox="0 0 26 26" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M4 8h18M4 13h18M4 18h18"/>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <div class="drawer" id="drawer" aria-hidden="true">
    <div class="drawer-head">
      <a class="logo" href="index.html" aria-label="STZ AutoPartes · inicio">
        <img class="drawer-logo" src="assets/img/logo-stz-light.png" alt="STZ AutoPartes" width="535" height="296">
      </a>
      <button class="drawer-close" type="button" data-close-menu aria-label="Cerrar menú">×</button>
    </div>
    <div class="drawer-body">
      <form class="drawer-search" action="catalogo.html">
        <span class="mono" style="color:var(--dark-text)">/</span>
        <input name="q" placeholder="Buscá pieza, vehículo, OEM…" aria-label="Buscar">
      </form>
      <nav>
        ${NAV.map(n => `<a href="${n.href}" class="${n.key === 'vender' ? 'hl' : ''}">${n.label}<span>→</span></a>`).join('')}
      </nav>
      <div class="drawer-cta">
        <a class="btn btn-wa" href="${waLink('Hola STZ, quiero hacer una consulta.')}" target="_blank" rel="noopener"><span class="dot" style="background:#fff"></span>Abrir WhatsApp</a>
        <a class="btn btn-red" href="carrito.html">Carrito · <span data-cart-total>₲ 0</span></a>
      </div>
      <div class="drawer-foot">
        PRESIDENTE FRANCO · ALTO PARANÁ<br>LUN-VIE 07:30–17:30 · SÁB 07:30–12:30
      </div>
    </div>
  </div>

  <div class="tabbar">
    <a href="index.html" class="${page === 'home' ? 'on' : ''}"><i>◆</i>INICIO</a>
    <a href="catalogo.html" class="${page === 'catalogo' ? 'on' : ''}"><i>◐</i>BUSCAR</a>
    <a href="carrito.html" class="${page === 'carrito' ? 'on' : ''}">${CART_SVG}<span>CARRITO</span></a>
    <button type="button" data-open-menu><i>☰</i>MENÚ</button>
  </div>`;

  const drawer = $('#drawer');
  const openMenu  = () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden'; };
  const closeMenu = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; };
  $$('[data-open-menu]').forEach(b => b.addEventListener('click', openMenu));
  $$('[data-close-menu]').forEach(b => b.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* mientras el hero pase por detrás, el header va sin fondo y en blanco;
     al dejarlo atrás vuelve a ser una barra sólida sobre el contenido claro */
  const hero = $('.hero'), barra = $('.site-header');
  if (barra){
    /* --header-h alimenta el margen negativo del hero. Si no coincide con el alto
       real, queda una franja arriba sin foto y se ve un canto horizontal.
       ResizeObserver lo cubre todo: carga del logo, tipografías, breakpoints y zoom
       (escuchar 'resize' o fonts.ready sueltos dejaba pasar casos). */
    const medir = () => document.documentElement.style.setProperty('--header-h', barra.offsetHeight + 'px');
    medir();
    if (window.ResizeObserver){
      /* hay que guardar la referencia: un ResizeObserver sin nadie que lo apunte
         puede ser recolectado y deja de avisar */
      headerRO = new ResizeObserver(medir);
      headerRO.observe(barra);
    }
    addEventListener('resize', medir);
    addEventListener('load', medir);
    /* el logo es lo que más tarda en fijar el alto del header */
    $$('.site-header .logo-img').forEach(im => { if (!im.complete) im.addEventListener('load', medir, { once:true }); });
  }
  if (hero && barra){
    const sync = () => barra.classList.toggle('at-top',
      hero.getBoundingClientRect().bottom > barra.offsetHeight);
    sync();
    addEventListener('scroll', sync, { passive:true });
    addEventListener('resize', () => { sync(); });
  }
}

/* ---------- custom select (estiliza selects nativos) ----------
   Envuelve un <select> real, lo oculta y muestra una lista custom.
   El <select> sigue siendo la fuente de verdad: valor y eventos change.
   Uso: enhanceSelect(document.querySelector('#mi-select'), {theme:'dark'})
   O batch: enhanceSelectsIn(document.querySelector('.contenedor'))
*/
function enhanceSelect(sel, opts){
  if (!sel || sel.dataset.stzSelectDone === '1') return;
  opts = opts || {};
  const theme = opts.theme || 'dark';

  sel.dataset.stzSelectDone = '1';

  const wrap = document.createElement('div');
  wrap.className = 'stz-select stz-select--' + theme;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'stz-select__trigger';
  trigger.setAttribute('aria-haspopup','listbox');
  trigger.setAttribute('aria-expanded','false');
  trigger.innerHTML = '<span class="stz-select__label"></span>' +
    '<svg class="stz-select__chev" viewBox="0 0 12 8" width="10" height="8" aria-hidden="true">' +
    '<path d="M1 1.5 L6 6.5 L11 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const menu = document.createElement('div');
  menu.className = 'stz-select__menu';
  menu.setAttribute('role','listbox');
  menu.hidden = true;

  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(trigger);
  wrap.appendChild(menu);
  wrap.appendChild(sel);
  sel.classList.add('stz-select__native');

  const labelEl = trigger.querySelector('.stz-select__label');

  const rebuild = () => {
    menu.innerHTML = '';
    Array.from(sel.options).forEach((o, i) => {
      const li = document.createElement('div');
      li.className = 'stz-select__opt' + (o.selected ? ' is-selected' : '');
      li.setAttribute('role','option');
      li.setAttribute('aria-selected', o.selected ? 'true' : 'false');
      li.dataset.value = o.value;
      li.dataset.idx = String(i);
      li.textContent = o.textContent;
      menu.appendChild(li);
    });
    syncLabel();
  };
  const syncLabel = () => {
    const opt = sel.options[sel.selectedIndex];
    labelEl.textContent = opt ? opt.textContent : '';
  };

  let open = false;
  let highlight = -1;
  const openMenu = () => {
    if (open) return;
    open = true;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded','true');
    wrap.classList.add('is-open');
    highlight = Math.max(0, sel.selectedIndex);
    updateHighlight();
    /* posicionar hacia arriba si no cabe abajo */
    const rect = wrap.getBoundingClientRect();
    const menuH = menu.offsetHeight;
    wrap.classList.toggle('open-up', rect.bottom + menuH + 8 > innerHeight && rect.top > menuH + 8);
    document.addEventListener('click', onDocClick, true);
  };
  const closeMenu = () => {
    if (!open) return;
    open = false;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded','false');
    wrap.classList.remove('is-open','open-up');
    document.removeEventListener('click', onDocClick, true);
  };
  const onDocClick = (e) => { if (!wrap.contains(e.target)) closeMenu(); };

  const updateHighlight = () => {
    Array.from(menu.children).forEach((el, i) => {
      el.classList.toggle('is-hl', i === highlight);
      if (i === highlight) el.scrollIntoView({ block:'nearest' });
    });
  };

  const chooseIdx = (idx) => {
    if (idx < 0 || idx >= sel.options.length) return;
    sel.selectedIndex = idx;
    sel.dispatchEvent(new Event('input',  { bubbles:true }));
    sel.dispatchEvent(new Event('change', { bubbles:true }));
    rebuild();
    closeMenu();
    trigger.focus();
  };

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    open ? closeMenu() : openMenu();
  });

  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.stz-select__opt');
    if (!opt) return;
    chooseIdx(parseInt(opt.dataset.idx, 10));
  });

  trigger.addEventListener('keydown', (e) => {
    if (['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){
      e.preventDefault();
      if (!open){ openMenu(); return; }
    }
    if (!open){
      if (e.key === 'ArrowDown') chooseIdx(Math.min(sel.options.length - 1, sel.selectedIndex + 1));
      else if (e.key === 'ArrowUp') chooseIdx(Math.max(0, sel.selectedIndex - 1));
      return;
    }
    if (e.key === 'ArrowDown'){ highlight = Math.min(sel.options.length - 1, highlight + 1); updateHighlight(); }
    else if (e.key === 'ArrowUp'){ highlight = Math.max(0, highlight - 1); updateHighlight(); }
    else if (e.key === 'Home'){ highlight = 0; updateHighlight(); }
    else if (e.key === 'End'){ highlight = sel.options.length - 1; updateHighlight(); }
    else if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); chooseIdx(highlight); }
    else if (e.key === 'Escape'){ closeMenu(); }
  });

  /* si el <select> cambia externamente, re-render */
  sel.addEventListener('stz:refresh', rebuild);

  /* observar cambios en las opciones (útil cuando fillOpts corre después) */
  if ('MutationObserver' in window){
    const mo = new MutationObserver(rebuild);
    mo.observe(sel, { childList:true });
  }

  rebuild();
}

function enhanceSelectsIn(root, opts){
  (root || document).querySelectorAll('select:not([data-stz-select-done="1"])').forEach(s => enhanceSelect(s, opts));
}

/* ---------- footer ---------- */
function renderFooter(){
  const host = $('#site-footer');
  if (!host) return;
  host.innerHTML = `
  <footer class="site-footer">
    <div class="footer-grid">
      <div>
        <a class="logo footer-logo" href="index.html" aria-label="STZ AutoPartes · inicio">
          <img src="assets/img/logo-stz-light.png" alt="STZ AutoPartes" width="535" height="296">
        </a>
        <p>Autopartes nuevas, usadas originales y recuperadas. Presidente Franco, Alto Paraná — Paraguay.</p>
      </div>
      <div class="footer-col">
        <h4>Tienda</h4>
        <div>
          <a href="catalogo.html">Repuestos</a>
          <a href="desarme.html">Vehículos en desarme</a>
          <a href="catalogo.html">Categorías</a>
          <a href="index.html#destacados">Novedades</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>STZ</h4>
        <div>
          <a href="index.html#confianza">Nosotros</a>
          <a href="index.html#contacto">Envíos</a>
          <a href="index.html#contacto">Contacto</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Newsletter</h4>
        <form class="news" onsubmit="event.preventDefault();this.reset();toast('¡Listo! Te vamos a escribir.');">
          <input type="email" placeholder="tu@correo.com" required aria-label="Correo electrónico">
          <button type="submit" aria-label="Suscribirse">→</button>
        </form>
        <div class="mono" style="font-size:10px;color:var(--dark-text);margin-top:12px;letter-spacing:.06em">Repuestos nuevos, unidades y ofertas.</div>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2026 STZ AUTOPARTES · TODOS LOS DERECHOS RESERVADOS</div>
      <div class="footer-bottom__links">
        <a href="privacidad.html">Política de privacidad</a>
        <span class="footer-bottom__sep">·</span>
        <span>Desarrollado por <a href="https://neura.com.py" target="_blank" rel="noopener">Neura</a></span>
      </div>
    </div>
  </footer>`;
}

/* ---------- tarjeta de producto (reutilizable) ---------- */
function stockHTML(p){
  if (p.stock === null) return '<div class="stock ask">◐ Consultar disponibilidad</div>';
  if (p.stock === 1)    return '<div class="stock low">● Última unidad</div>';
  return '<div class="stock">● En stock · ' + p.stock + '</div>';
}

function productCard(p, opts){
  opts = opts || {};
  const tagClass = p.condition === 'nuevo' ? 'tag nuevo' : (p.condition === 'recuperado' ? 'tag recuperado' : 'tag');
  const shareUrl = 'producto.html?id=' + encodeURIComponent(p.id);
  const shareTitle = p.name + ' — ' + p.id;
  return `
  <article class="card">
    <a class="card-media ph" data-ph="${esc(p.ph)}" href="producto.html?id=${encodeURIComponent(p.id)}" aria-label="${esc(p.name)}">
      ${photo(p.img, p.name)}
      <span class="card-topbar" aria-hidden="true"></span>
      <span class="${tagClass}">${STZ_CONDITION_SHORT[p.condition]}</span>
      <span class="card-sku">${p.id}</span>
      ${p.note ? `<span class="card-note">${esc(p.note)}</span>` : ''}
      <button type="button" class="card-share" data-share-url="${esc(shareUrl)}" data-share-title="${esc(shareTitle)}" aria-label="Compartir ${esc(p.name)}">
        ${shareIconSVG()}
      </button>
    </a>
    <div class="card-body">
      <div class="card-oem">${p.oem ? 'OEM · ' + p.oem : 'INT · ' + p.internal}</div>
      <a class="card-title" href="producto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
      <div class="card-fit">${esc(p.brand)} ${esc(p.model)} · ${p.yearFrom}–${p.yearTo}</div>
      <div class="card-price-row">
        <div class="price">${gs(p.price)}</div>
        ${stockHTML(p)}
      </div>
      ${opts.compact ? '' : `
      <a class="card-cta" href="producto.html?id=${encodeURIComponent(p.id)}">
        Ver repuesto
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>
      </a>`}
    </div>
  </article>`;
}

/* delega los botones "Agregar" de toda la página */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-add]');
  if (btn){ cartAdd(btn.dataset.add, 1); }
});

/* delega los botones de compartir de las cards. Capturamos en la fase de
   captura para que .stopPropagation() impida que el <a class="card-media">
   contenedor navegue al producto. */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.card-share');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const relUrl = btn.dataset.shareUrl || '';
  const title  = btn.dataset.shareTitle || document.title;
  const url    = new URL(relUrl, location.href).href;
  const data   = { title, text: title, url };
  try {
    if (navigator.share) { await navigator.share(data); return; }
  } catch(_){ return; }
  try {
    await navigator.clipboard.writeText(url);
    toast('Enlace copiado');
  } catch(_){
    window.open('https://wa.me/?text=' + encodeURIComponent(title + ' — ' + url), '_blank', 'noopener');
  }
}, true);

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  cartRefresh();
  if (typeof initPage === 'function') initPage();
});
