/* ============================================================
   STZ AUTOPARTES · lógica por página
   ============================================================ */

const BRANDS = [...new Set(STZ_PRODUCTS.map(p => p.brand))].sort();
const MODELS = [...new Set(STZ_PRODUCTS.map(p => p.model))].sort();
const YEARS  = (() => {
  const s = new Set();
  STZ_PRODUCTS.forEach(p => { for (let y = p.yearFrom; y <= p.yearTo; y++) s.add(y); });
  return [...s].sort((a,b) => b - a);
})();

function fillSelect(el, values, keepFirst){
  if (!el) return;
  const first = keepFirst === false ? '' : el.innerHTML;
  el.innerHTML = first + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
}

/* Mosaico editorial de categorías: renderiza a partir de STZ_CATEGORIES
   con el orden y el layout definidos por el diseño. La cantidad viene
   del ERP (campo `count` de la categoría). */
const CAT_LAYOUT = [
  { id:'faros',     variant:'hero' },
  { id:'motores',   variant:'w4'   },
  { id:'bombas',    variant:'w3'   },
  { id:'electrico', variant:'w4'   },
  { id:'burletes',  variant:'w3'   },
  { id:'comandos',  variant:'w3'   },
  { id:'interior',  variant:'w3'   },
  { id:'frisos',    variant:'w3'   },
  { id:'__cta',     variant:'w3'   }  // tarjeta final roja
];
const CAT_ARROW = '<svg class="cat-card__arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 14L14 6M14 6H7M14 6v7"/></svg>';

function renderCategorias(){
  const root = $('#cat-mosaic');
  if (!root) return;
  const counts = STZ_PRODUCTS.reduce((m, p) => (m[p.category] = (m[p.category] || 0) + 1, m), {});
  const html = CAT_LAYOUT.map(slot => {
    if (slot.id === '__cta'){
      return `<a class="cat-card cat-card--cta cat-card--${slot.variant}" href="catalogo.html">
        ${CAT_ARROW}
        <div class="cat-card__body">
          <h3 class="cat-card__title">¿No encontrás<br>tu categoría?</h3>
          <span class="cat-card__count">Explorá todas las autopartes</span>
        </div>
      </a>`;
    }
    const c = STZ_CATEGORIES.find(x => x.id === slot.id);
    if (!c) return '';
    const n = counts[c.id] || 0;
    const label = n === 1 ? '1 pieza disponible' : `${n} piezas disponibles`;
    return `<a class="cat-card cat-card--${slot.variant}" href="catalogo.html?cat=${c.id}">
      <img class="cat-card__img" src="assets/img/fotos/${c.img}" alt="${esc(c.ph || c.name)}" loading="lazy" decoding="async" width="800" height="500">
      <span class="cat-card__overlay"></span>
      ${CAT_ARROW}
      <div class="cat-card__body">
        <h3 class="cat-card__title">${esc(c.name)}</h3>
        <span class="cat-card__count">${label}</span>
      </div>
    </a>`;
  }).join('');
  root.innerHTML = html;
}

function revealCategorias(){
  const head = $('.cat-head');
  const cards = $$('.cat-mosaic .cat-card');
  if (!head || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  head.setAttribute('data-reveal','');
  cards.forEach((c, i) => {
    c.setAttribute('data-reveal','');
    c.style.setProperty('--d', (i * 70) + 'ms');
  });

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting){
        en.target.classList.add('in');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });

  io.observe(head);
  cards.forEach(c => io.observe(c));
}

/* Reemplaza visualmente un <select> con un combobox custom.
   Deja el <select> oculto en el DOM para que el form siga funcionando y sea accesible. */
function enhanceCombo(select){
  if (!select || select.dataset.enhanced === '1') return;
  select.dataset.enhanced = '1';

  const wrap = document.createElement('div');
  wrap.className = 'combo';
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add('js-hidden');
  select.setAttribute('tabindex','-1');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'combo__btn';
  btn.setAttribute('aria-haspopup','listbox');
  btn.setAttribute('aria-expanded','false');
  wrap.appendChild(btn);

  const list = document.createElement('ul');
  list.className = 'combo__list';
  list.setAttribute('role','listbox');
  list.tabIndex = -1;
  wrap.appendChild(list);

  const render = () => {
    list.innerHTML = '';
    Array.from(select.options).forEach((op, i) => {
      const li = document.createElement('li');
      li.className = 'combo__opt';
      li.setAttribute('role','option');
      li.dataset.value = op.value;
      li.textContent = op.textContent;
      if (op.value === '') li.dataset.placeholder = '1';
      if (op.selected) li.classList.add('is-selected');
      li.addEventListener('mouseenter', () => setActive(i));
      li.addEventListener('click', () => { pick(i); close(); btn.focus(); });
      list.appendChild(li);
    });
    syncBtn();
  };

  const syncBtn = () => {
    const op = select.options[select.selectedIndex] || select.options[0];
    btn.textContent = op ? op.textContent : '';
    btn.dataset.empty = (!select.value) ? '1' : '';
  };

  let activeIdx = -1;
  const setActive = i => {
    activeIdx = i;
    [...list.children].forEach((el, idx) => el.classList.toggle('is-active', idx === i));
    const el = list.children[i];
    if (el) el.scrollIntoView({block:'nearest'});
  };
  const pick = i => {
    select.selectedIndex = i;
    select.dispatchEvent(new Event('change', {bubbles:true}));
    [...list.children].forEach((el, idx) => el.classList.toggle('is-selected', idx === i));
    syncBtn();
  };

  const open = () => {
    wrap.classList.add('is-open');
    btn.setAttribute('aria-expanded','true');
    setActive(Math.max(0, select.selectedIndex));
    document.addEventListener('click', onDoc);
  };
  const close = () => {
    wrap.classList.remove('is-open');
    btn.setAttribute('aria-expanded','false');
    document.removeEventListener('click', onDoc);
  };
  const onDoc = e => { if (!wrap.contains(e.target)) close(); };

  btn.addEventListener('click', e => {
    e.stopPropagation();
    wrap.classList.contains('is-open') ? close() : open();
  });
  btn.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      if (!wrap.classList.contains('is-open')) open();
      else setActive(Math.min(activeIdx + 1, select.options.length - 1));
    } else if (e.key === 'ArrowUp' && wrap.classList.contains('is-open')){
      e.preventDefault(); setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === 'Escape'){ close(); }
    else if (wrap.classList.contains('is-open') && (e.key === 'Enter' || e.key === ' ')){
      e.preventDefault(); if (activeIdx >= 0){ pick(activeIdx); close(); }
    }
  });

  /* si algo externo cambia el <select> (p.ej. reset del form), sincronizar */
  select.addEventListener('change', syncBtn);
  select._comboRender = render;
  render();
}

/* Posiciona el callout dentro de un .diagram: lo coloca por encima del
   hotspot activo, sin superponerse, y ajusta el tail vertical. */
const STZ_REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STZ_CALLOUT_TIMERS = new WeakMap();

function placeCallout(diag, opts){
  if (!diag) return;
  const call = diag.querySelector('.callout');
  const hs   = diag.querySelector('.hotspot.on');
  if (!call || !hs) return;
  const wantAnimate = !(opts && opts.animate === false);
  const apply = (animate) => {
    const dr = diag.getBoundingClientRect();
    if (!dr.height) return;
    const hr = hs.getBoundingClientRect();
    const callW = call.offsetWidth  || 240;
    const callH = call.offsetHeight || 100;
    const gapH = 60, gapV = 40;
    const hsCX = hr.left + hr.width / 2 - dr.left;
    const hsTop = hr.top - dr.top;

    const goRight = hsCX < dr.width * 0.55;
    const topPx = Math.max(20, hsTop - callH - gapV);
    const leftPx = goRight
      ? Math.min(dr.width - callW - 20, hsCX + gapH)
      : Math.max(20, hsCX - gapH - callW);

    call.style.top  = (topPx  / dr.height * 100).toFixed(2) + '%';
    call.style.left = (leftPx / dr.width  * 100).toFixed(2) + '%';
    call.style.transform = 'none';
    call.style.visibility = '';

    /* Prepara el callout oculto y dibuja el conector; después se hace fade-up */
    const prev = STZ_CALLOUT_TIMERS.get(diag);
    if (prev) clearTimeout(prev);
    if (animate && !STZ_REDUCED_MOTION){
      call.classList.remove('is-drawn');
      call.classList.add('is-drawing');
      drawConnector(diag, true);
      const t = setTimeout(() => {
        call.classList.add('is-drawn');
        STZ_CALLOUT_TIMERS.delete(diag);
      }, 450);
      STZ_CALLOUT_TIMERS.set(diag, t);
    } else {
      call.classList.remove('is-drawing');
      call.classList.add('is-drawn');
      drawConnector(diag, false);
    }
  };
  apply(wantAnimate);
}

/* Dibuja una polilínea SVG de 3 segmentos con la MISMA pendiente en las dos
   diagonales, para que se vea como una sola línea quebrada.
   1) diagonal desde el borde inferior del callout hacia el lado del hotspot
   2) vertical
   3) diagonal contraria que aterriza en el hotspot */
function drawConnector(diag, animate){
  const call = diag.querySelector('.callout');
  const hs   = diag.querySelector('.hotspot.on');
  if (!call || !hs) return;
  const dr = diag.getBoundingClientRect();
  const cr = call.getBoundingClientRect();
  const hr = hs.getBoundingClientRect();
  const w = dr.width, h = dr.height;
  if (!w || !h) return;

  const hsCX = hr.left + hr.width / 2 - dr.left;
  const hsCY = hr.top  + hr.height / 2 - dr.top;
  const callLeftPx  = cr.left  - dr.left;
  const callRightPx = cr.right - dr.left;
  const callBotPx   = cr.bottom - dr.top;

  /* El primer punto debe TOCAR el lateral inferior del callout — en el borde
     que da hacia el hotspot (izquierdo si el callout va a la derecha del
     hotspot; derecho en caso contrario) */
  const goRight = callLeftPx > hsCX;
  const anchorX = goRight ? callLeftPx : callRightPx;
  const dx  = Math.abs(anchorX - hsCX);
  const gap = hsCY - callBotPx;
  if (gap < 8 || dx < 4) return;

  const L2x = 14;
  const L1x = dx + L2x;
  const diagsTotalY = Math.max(20, gap * 0.65);
  const slope = diagsTotalY / (L1x + L2x);
  const L1y = slope * L1x;
  const L2y = slope * L2x;

  const p1x = anchorX;
  const p1y = callBotPx;
  const p2x = goRight ? p1x - L1x : p1x + L1x;
  const p2y = p1y + L1y;
  const p3x = p2x;
  const p3y = hsCY - L2y;
  const p4x = hsCX;
  const p4y = hsCY;

  const f = n => n.toFixed(1);
  const points = `${f(p1x)},${f(p1y)} ${f(p2x)},${f(p2y)} ${f(p3x)},${f(p3y)} ${f(p4x)},${f(p4y)}`;

  const NS = 'http://www.w3.org/2000/svg';
  let svg = diag.querySelector('.diagram-connector');
  if (!svg){
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'diagram-connector');
    svg.setAttribute('preserveAspectRatio', 'none');
    const poly = document.createElementNS(NS, 'polyline');
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', 'rgba(255,255,255,.7)');
    poly.setAttribute('stroke-width', '1');
    poly.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(poly);
    diag.insertBefore(svg, diag.firstChild); /* detrás del callout y los hotspots */
  }
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const poly = svg.querySelector('polyline');
  poly.setAttribute('points', points);

  /* Animación de dibujo con stroke-dasharray / stroke-dashoffset via Web Animations API */
  const len = Math.hypot(p2x-p1x, p2y-p1y) + Math.hypot(p3x-p2x, p3y-p2y) + Math.hypot(p4x-p3x, p4y-p3y);
  poly.setAttribute('stroke-dasharray', len);
  if (poly._stzAnim){ try { poly._stzAnim.cancel(); } catch(e){} poly._stzAnim = null; }
  if (animate && !STZ_REDUCED_MOTION && typeof poly.animate === 'function'){
    poly.setAttribute('stroke-dashoffset', '0');
    svg.classList.add('is-drawing');
    poly._stzAnim = poly.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: 450, easing: 'cubic-bezier(.22,.8,.25,1)', fill: 'forwards' }
    );
  } else {
    svg.classList.remove('is-drawing');
    poly.setAttribute('stroke-dashoffset', '0');
  }
}

/* Vincula un select de marca con uno de modelo: al elegir marca, el
   select de modelo se repuebla sólo con los modelos de esa marca. */
function linkBrandModel(brandSel, modelSel){
  if (!brandSel || !modelSel) return;
  const refresh = () => {
    const brand = brandSel.value;
    const models = brand
      ? [...new Set(STZ_PRODUCTS.filter(p => p.brand === brand).map(p => p.model))].sort()
      : [...new Set(STZ_PRODUCTS.map(p => p.model))].sort();
    const prev = modelSel.value;
    modelSel.innerHTML = '<option value="">Seleccionar modelo</option>' +
      models.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if (models.includes(prev)) modelSel.value = prev;
    if (modelSel._comboRender) modelSel._comboRender();
    modelSel.dispatchEvent(new Event('change', {bubbles:true}));
  };
  brandSel.addEventListener('change', refresh);
}

/* ============================================================
   DESTACADOS · acordeón fotográfico (Selección del taller)
   4 paneles contiguos. El activo se expande al 50 %. Hover / focus activa.
   Sin autoplay: el usuario controla. Al mouseleave se conserva el último elegido.
   Móvil: carrusel horizontal con swipe nativo.
   ============================================================ */
function initTaller(){
  const root     = $('#taller');
  if (!root) return;

  const filts    = $('#home-filters');
  const live     = $('#taller-live');
  const countE   = $('#taller-count');
  const totalE   = $('#taller-total');
  const progrBar = $('#taller-progress-bar');
  const pagesBox = $('#taller-pages');
  const pageE    = $('#taller-page');
  const pageTotE = $('#taller-page-total');
  const navPrev  = pagesBox && pagesBox.querySelector('[data-nav="prev"]');
  const navNext  = pagesBox && pagesBox.querySelector('[data-nav="next"]');

  const isMobile = () => matchMedia('(max-width:760px)').matches;
  const reduced  = () => matchMedia('(prefers-reduced-motion:reduce)').matches;

  const PAGE_SIZE  = 4;                         /* paneles visibles por página */
  const CLASS_COND = { nuevo:'is-nuevo', usado:'', recuperado:'is-recuperado' };

  const state = { cond:'', pool:[], page:0, active:0, animating:false };
  const pageCount = () => Math.max(1, Math.ceil(state.pool.length / PAGE_SIZE));
  const pageItems = () => state.pool.slice(state.page * PAGE_SIZE, state.page * PAGE_SIZE + PAGE_SIZE);

  function poolFor(cond){
    /* mantenemos el pool completo; la paginación hace los cortes de a 4 */
    const base = STZ_PRODUCTS.filter(p => !cond || p.condition === cond);
    const fav  = base.filter(p => p.featured);
    return fav.length >= PAGE_SIZE ? fav : base;
  }
  const stockInfo = p => {
    if (p.stock === null) return { cls:'is-ask', txt:'Consultar disponibilidad', canBuy:false };
    if (p.stock === 1)    return { cls:'is-low', txt:'Última unidad', canBuy:true };
    return { cls:'is-ok', txt:'En stock · ' + p.stock, canBuy:true };
  };
  const waHref = p => `https://wa.me/${STZ_WHATSAPP}?text=` +
    encodeURIComponent(`Hola STZ, consulto por ${p.id} — ${p.name}`);
  const goLabel = s => s.canBuy ? 'Ver repuesto' : 'Consultar stock';

  function panelHTML(p, i){
    const s = stockInfo(p);
    const tCls = CLASS_COND[p.condition] || '';
    const n = String(i + 1).padStart(2, '0');
    const cond = STZ_CONDITION_SHORT[p.condition];
    return `
      <button class="taller__panel" role="tab" data-idx="${i}" data-id="${esc(p.id)}"
              aria-selected="false" aria-label="${esc(cond)} · ${esc(p.name)}">
        <img class="taller__img" src="assets/img/fotos/${esc(p.img)}" alt="${esc(p.name)}"
             width="1200" height="700" decoding="async">
        <span class="taller__scrim"></span>

        <!-- rótulo vertical: se ve cuando el panel está cerrado -->
        <span class="taller__vertical" aria-hidden="true">
          <span class="cond">${esc(cond)}</span>
          <span class="name">${esc(p.name)}</span>
        </span>

        <!-- contenido completo, visible cuando el panel está activo -->
        <div class="taller__content">
          <div class="taller__pos">
            <span>${n}</span>
            <b>·</b>
            <span class="taller__pos-cond">${esc(cond)}</span>
          </div>
          <h3 class="taller__title">${esc(p.name)}</h3>
          <div class="taller__fit">${esc(p.brand)} ${esc(p.model)} · ${p.yearFrom}–${p.yearTo}</div>
          <div class="taller__price-row">
            <div class="taller__price">${gs(p.price)}</div>
            <div class="taller__stock ${s.cls}">${esc(s.txt)}</div>
          </div>
          <div class="taller__cta">
            <a class="taller__go" href="producto.html?id=${encodeURIComponent(p.id)}">
              ${esc(goLabel(s))}
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>
            </a>
            <a class="taller__wa" href="${waHref(p)}" target="_blank" rel="noopener"
               aria-label="Consultar por WhatsApp">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5v-.5l-.8-1.9c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-.9 2.5a7 7 0 0 0 1.5 3.1 9.4 9.4 0 0 0 4.6 3.3c1.1.4 1.9.4 2.5.3.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
            </a>
          </div>
        </div>
      </button>`;
  }

  function renderPanels(){
    const items = pageItems();
    if (!items.length){
      root.innerHTML = '<div class="taller--empty">No hay piezas destacadas para este filtro.</div>';
      totalE.textContent = '00';
      countE.textContent = '00';
      if (progrBar) progrBar.style.width = '0%';
      updatePageUI();
      return;
    }
    root.innerHTML = items.map((p, i) => panelHTML(p, i)).join('');
    totalE.textContent = String(state.pool.length).padStart(2, '0');
    updatePageUI();
  }

  function updatePageUI(){
    if (!pagesBox) return;
    const total = pageCount();
    if (total > 1){
      pagesBox.hidden = false;
      pageE.textContent  = String(state.page + 1);
      pageTotE.textContent = String(total);
      navPrev.disabled = state.page === 0;
      navNext.disabled = state.page >= total - 1;
    } else {
      pagesBox.hidden = true;
    }
  }

  function paintActive(source){
    const panels = $$('.taller__panel', root);
    if (!panels.length) return;
    panels.forEach((el, i) => {
      const on = i === state.active;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
      el.setAttribute('tabindex', on ? '0' : '-1');
    });
    /* contador global (pool completo, no solo la página actual) */
    const globalIdx = state.page * PAGE_SIZE + state.active;
    countE.textContent = String(globalIdx + 1).padStart(2, '0');

    /* barra de progreso: ancho 1/N, posición según índice global */
    if (progrBar){
      const w = 100 / state.pool.length;
      progrBar.style.width = w + '%';
      progrBar.style.transform = `translateX(${globalIdx * 100}%)`;
    }

    if (source === 'user' && live){
      const p = pageItems()[state.active];
      if (!p) return;
      const s = stockInfo(p);
      live.textContent = `${p.name}. ${STZ_CONDITION_LABEL[p.condition]}. ${gs(p.price)}. ${s.txt}.`;
    }
  }

  function setActive(i, source){
    const items = pageItems();
    if (!items.length) return;
    const n = items.length;
    const clamped = Math.max(0, Math.min(n - 1, i));
    if (clamped === state.active) return;
    state.active = clamped;
    paintActive(source);
  }

  /* cambia de página con animación de desplazamiento */
  function goToPage(target, dir){
    if (state.animating) return;
    const total = pageCount();
    target = Math.max(0, Math.min(total - 1, target));
    if (target === state.page) return;

    const flip = () => {
      state.page = target;
      state.active = 0;
      renderPanels();
      paintActive();
    };
    if (reduced()){ flip(); return; }

    state.animating = true;
    root.classList.remove('is-in-right','is-in-left','is-out-left','is-out-right');
    root.classList.add(dir === 'next' ? 'is-out-left' : 'is-out-right');

    const onOut = () => {
      root.removeEventListener('animationend', onOut);
      root.classList.remove('is-out-left','is-out-right');
      flip();
      /* al re-renderizar los paneles nuevos, otra animación de entrada */
      root.classList.add(dir === 'next' ? 'is-in-right' : 'is-in-left');
      const onIn = () => {
        root.removeEventListener('animationend', onIn);
        root.classList.remove('is-in-right','is-in-left');
        state.animating = false;
      };
      root.addEventListener('animationend', onIn);
    };
    root.addEventListener('animationend', onOut);
    /* seguro por si animationend no dispara (paneles vacíos o navegador quisquilloso) */
    setTimeout(() => {
      if (!state.animating) return;
      root.removeEventListener('animationend', onOut);
      root.classList.remove('is-out-left','is-out-right','is-in-right','is-in-left');
      flip();
      state.animating = false;
    }, 900);
  }

  function applyCond(cond){
    state.cond = cond;
    state.pool = poolFor(cond);
    state.page = 0;
    state.active = 0;
    renderPanels();
    paintActive();
  }

  /* ---------- listeners ---------- */
  filts.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    $$('.chip', filts).forEach(c => {
      const on = c === b;
      c.classList.toggle('on', on);
      c.setAttribute('aria-selected', String(on));
    });
    applyCond(b.dataset.cond || '');
  });

  /* hover / focus activa el panel. Delegación: evita registrar N listeners al filtrar */
  root.addEventListener('mouseover', e => {
    if (isMobile() || reduced()) return;
    const p = e.target.closest('.taller__panel');
    if (!p || !root.contains(p)) return;
    setActive(Number(p.dataset.idx), 'user');
  });
  root.addEventListener('focusin', e => {
    const p = e.target.closest('.taller__panel');
    if (!p || !root.contains(p)) return;
    setActive(Number(p.dataset.idx), 'user');
  });

  /* click en un panel cerrado (o teclado en móvil) también lo activa */
  root.addEventListener('click', e => {
    const p = e.target.closest('.taller__panel');
    if (!p) return;
    /* si el click cayó en un enlace interno (Ver repuesto, WhatsApp), no interceptamos */
    if (e.target.closest('a,button:not(.taller__panel)')) return;
    setActive(Number(p.dataset.idx), 'user');
  });

  /* teclado global cuando hay foco dentro del bloque.
     Al llegar al borde de la página, salta a la anterior/siguiente si existe. */
  root.addEventListener('keydown', e => {
    if (!state.pool.length) return;
    const nInPage = pageItems().length;
    if (e.key === 'ArrowLeft'){
      e.preventDefault();
      if (state.active === 0 && state.page > 0){
        goToPage(state.page - 1, 'prev');
        setTimeout(() => setActive(pageItems().length - 1, 'user'), 380);
      } else setActive(state.active - 1, 'user');
    } else if (e.key === 'ArrowRight'){
      e.preventDefault();
      if (state.active === nInPage - 1 && state.page < pageCount() - 1){
        goToPage(state.page + 1, 'next');
      } else setActive(state.active + 1, 'user');
    } else if (e.key === 'Home'){ e.preventDefault(); setActive(0, 'user'); }
    else if (e.key === 'End'){ e.preventDefault(); setActive(nInPage - 1, 'user'); }
    const active = root.querySelector('.taller__panel.is-active');
    if (active && (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End')) active.focus();
  });

  /* flechas de página en el pie */
  if (navPrev) navPrev.addEventListener('click', () => goToPage(state.page - 1, 'prev'));
  if (navNext) navNext.addEventListener('click', () => goToPage(state.page + 1, 'next'));

  applyCond('');
}

function initPage(){
  linkWhatsApp();
  if ($('.hero')) initHome();
  if ($('#results-grid')) initCatalog();
  if ($('#pd')) initProduct();
  const desarmeDetail = $('#desarme-detail');
  const desarmeList   = $('#desarme-list');
  if (desarmeDetail && !desarmeDetail.hidden && $('#udet')) initUnidadDetail();
  else if (desarmeDetail && !desarmeDetail.hidden && $('#unit-tabs')) initDesarme();
  else if (desarmeList && !desarmeList.hidden) initDesarmeList();
  if ($('#cart-root')) initCart();
  if ($('#sell-form')) initSellPage();
  initPills();
}

function linkWhatsApp(){
  const map = {
    'wa-motor':'Hola STZ, no conozco el motor de mi vehículo y necesito ayuda para identificar una pieza.',
    'wa-contacto':'Hola STZ, quiero hacer una consulta.',
    'hero-wa':'Hola STZ, busco un repuesto. Mi vehículo es: ',
    'wa-help':'Hola STZ, no encuentro la pieza que busco. Mi vehículo es: ',
    'wa-sell':'Hola STZ, quiero vender mi vehículo para desarme.'
  };
  Object.keys(map).forEach(id => { const el = $('#' + id); if (el) el.href = waLink(map[id]); });
}

/* ---------- pills (estado del vehículo) ---------- */
function initPills(){
  $$('[data-pills]').forEach(group => {
    group.addEventListener('click', e => {
      const b = e.target.closest('.pill');
      if (!b) return;
      $$('.pill', group).forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    });
  });
}

/* ============================================================
   HOME
   ============================================================ */
/* ============================================================
   DESARME (home) · carrusel "Últimos ingresos al patio"
   ============================================================ */
function initDesarmeHome(){
  const bento    = $('#dh-bento');
  const hero     = $('#dh-hero');
  const heroImg  = $('#dh-hero-img');
  const heroCode = $('#dh-hero-code');
  const heroBadge= $('#dh-hero-badge');
  const heroKick = $('#dh-hero-kicker');
  const heroTit  = $('#dh-hero-title');
  const heroMono = $('#dh-hero-mono');
  const heroPcs  = $('#dh-hero-pieces');
  const heroYear = $('#dh-hero-year');
  const thumbs   = $('#dh-thumbs');
  const sideCnt  = $('#dh-side-cnt');
  const countEl  = $('#dh-count-active');
  const curEl    = $('#dh-page-current');
  const totEl    = $('#dh-page-total');
  const barEl    = $('#dh-progress-bar');
  const prevBtn  = $('#dh-prev');
  const nextBtn  = $('#dh-next');
  if (!bento || !hero || !thumbs) return;

  const units = (typeof STZ_UNITS !== 'undefined' ? STZ_UNITS : []).slice();
  const total = units.length;

  countEl.textContent = total + (total === 1 ? ' unidad activa' : ' unidades activas');
  totEl.textContent   = String(Math.max(total, 1)).padStart(2, '0');
  sideCnt.textContent = String(total).padStart(2, '0');

  if (!total){
    thumbs.innerHTML = '<li style="padding:32px 12px;color:#7A7A80;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-align:center">Sin unidades activas</li>';
    heroTit.textContent = 'Sin unidades activas';
    heroKick.textContent = '—';
    heroMono.textContent = '';
    prevBtn.disabled = nextBtn.disabled = true;
    barEl.style.width = '0%';
    return;
  }

  const FALLBACK_IMG = 'assets/img/fotos/unidad-lateral.jpg';
  const STATUS_LABEL = { ok:'Disponible', low:'Últimas piezas', off:'Reservado' };
  const STATUS_CLASS = { ok:'', low:'is-low', off:'is-off' };

  /* Precarga suave */
  units.forEach(u => { if (u.img){ const im = new Image(); im.src = 'assets/img/fotos/' + u.img; } });

  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let active = 0;

  const thumbHTML = (u, i) => {
    const img = u.img ? ('assets/img/fotos/' + u.img) : FALLBACK_IMG;
    return `
      <li>
        <a class="dh-thumb${i === 0 ? ' is-active' : ''}" data-idx="${i}"
           href="desarme.html?u=${encodeURIComponent(u.code)}"
           role="option" aria-selected="${i === 0 ? 'true' : 'false'}"
           aria-label="${esc(u.name)} ${u.year}, código ${esc(u.code)}">
          <span class="dh-thumb__img">
            <img src="${img}" alt="" loading="lazy" decoding="async"
                 onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
          </span>
          <span class="dh-thumb__info">
            <span class="dh-thumb__code">${esc(u.code)}</span>
            <span class="dh-thumb__name">${esc(u.name)} · ${u.year}</span>
            <span class="dh-thumb__meta">Motor ${esc(u.engine)}</span>
          </span>
        </a>
      </li>`;
  };

  thumbs.innerHTML = units.map(thumbHTML).join('');
  const thumbEls = [...thumbs.querySelectorAll('.dh-thumb')];

  const updateChrome = () => {
    curEl.textContent = String(active + 1).padStart(2, '0');
    barEl.style.width = (((active + 1) / total) * 100).toFixed(2) + '%';
    prevBtn.disabled = active === 0;
    nextBtn.disabled = active >= total - 1;
  };

  const renderHero = (u, i) => {
    const src = u.img ? ('assets/img/fotos/' + u.img) : FALLBACK_IMG;
    const status = STATUS_LABEL[u.status] || 'Disponible';
    const badgeClass = STATUS_CLASS[u.status] || '';

    hero.setAttribute('href', 'desarme.html?u=' + encodeURIComponent(u.code));
    hero.setAttribute('aria-label', u.name + ' ' + u.year + ', código ' + u.code);

    heroCode.textContent  = 'UNIDAD ' + u.code;
    heroBadge.className   = 'dh-hero__badge ' + badgeClass;
    heroBadge.textContent = status;
    heroKick.textContent  = String(i + 1).padStart(2,'0') + ' · Recién ingresado';
    heroTit.textContent   = u.name + ' · ' + u.year;
    heroMono.textContent  = 'Motor ' + u.engine + ' · Caja ' + u.gearbox;
    heroPcs.textContent   = u.pieces;
    heroYear.textContent  = u.year;

    if (reduced || heroImg.getAttribute('src') === src){
      heroImg.setAttribute('src', src);
      heroImg.setAttribute('alt', u.ph || u.name);
      return;
    }
    heroImg.classList.add('is-swapping');
    const swap = () => {
      heroImg.setAttribute('src', src);
      heroImg.setAttribute('alt', u.ph || u.name);
      requestAnimationFrame(() => heroImg.classList.remove('is-swapping'));
    };
    setTimeout(swap, 200);
  };

  const setActive = (idx) => {
    idx = Math.max(0, Math.min(total - 1, idx));
    if (idx === active && heroImg.getAttribute('src')) return;
    thumbEls[active] && thumbEls[active].classList.remove('is-active');
    thumbEls[active] && thumbEls[active].setAttribute('aria-selected','false');
    active = idx;
    const t = thumbEls[active];
    if (t){
      t.classList.add('is-active');
      t.setAttribute('aria-selected','true');
      /* scroll thumb en vista si hay overflow */
      try {
        t.scrollIntoView({ block:'nearest', inline:'nearest', behavior: reduced ? 'auto' : 'smooth' });
      } catch(_){}
    }
    renderHero(units[active], active);
    updateChrome();
  };

  /* Click en miniatura: activa en vez de navegar (excepto si ya es la activa) */
  thumbEls.forEach((el, i) => {
    el.addEventListener('click', (e) => {
      if (i !== active){ e.preventDefault(); setActive(i); }
    });
  });

  /* Flechas */
  prevBtn.addEventListener('click', () => setActive(active - 1));
  nextBtn.addEventListener('click', () => setActive(active + 1));

  /* Teclado global del bento */
  bento.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Home'){ e.preventDefault(); setActive(0); }
    else if (e.key === 'End'){ e.preventDefault(); setActive(total - 1); }
  });

  /* ---------- Auto-rotación ---------- */
  const AUTO_MS = 3000;
  let autoTimer = 0;
  let paused = false;
  const progressBox = barEl.parentElement;
  progressBox.style.setProperty('--dh-cycle-ms', AUTO_MS + 'ms');

  const stopAuto = () => {
    clearTimeout(autoTimer); autoTimer = 0;
    progressBox.classList.remove('is-cycling');
    barEl.style.width = (((active + 1) / total) * 100).toFixed(2) + '%';
  };
  const tickAuto = () => {
    stopAuto();
    if (paused || reduced || total < 2) return;
    /* forzar reflow para reiniciar la transición */
    void progressBox.offsetWidth;
    progressBox.classList.add('is-cycling');
    autoTimer = setTimeout(() => {
      setActive((active + 1) % total);
      tickAuto();
    }, AUTO_MS);
  };

  const pauseAuto = () => { paused = true; stopAuto(); };
  const resumeAuto = () => { paused = false; tickAuto(); };

  /* Pausa en hover y foco */
  bento.addEventListener('mouseenter', pauseAuto);
  bento.addEventListener('mouseleave', resumeAuto);
  bento.addEventListener('focusin', pauseAuto);
  bento.addEventListener('focusout', resumeAuto);

  /* Pausa cuando la sección no está visible */
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => en.isIntersecting ? resumeAuto() : pauseAuto());
    }, { threshold: 0.25 });
    io.observe(bento);
  } else {
    tickAuto();
  }

  /* Cualquier interacción manual reinicia el timer */
  const resetAuto = () => { if (!paused) tickAuto(); };
  prevBtn.addEventListener('click', resetAuto);
  nextBtn.addEventListener('click', resetAuto);
  thumbEls.forEach(el => el.addEventListener('click', resetAuto));

  /* Estado inicial */
  renderHero(units[0], 0);
  updateChrome();
}

/* ============================================================
   DESARME · Catálogo editorial ("El origen de cada pieza")
   ============================================================ */
function initDesarmeList(){
  const rows      = $('#dv-rows');
  const countEl   = $('#dv-count-total');
  const footEl    = $('#dv-foot-count');
  const tabsEl    = $('#dv-tabs');
  const qEl       = $('#dv-q');
  const marcaEl   = $('#dv-marca');
  const anioEl    = $('#dv-anio');
  const motorEl   = $('#dv-motor');
  const cajaEl    = $('#dv-caja');
  const sortEl    = $('#dv-sort');
  const form      = $('#dv-filters');
  if (!rows || typeof STZ_UNITS === 'undefined') return;

  const FALLBACK_IMG = 'assets/img/fotos/unidad-lateral.jpg';
  const STATUS_LABEL = { ok:'Activo · piezas disponibles', low:'Pocas piezas', off:'Reservado' };
  const brandOf = u => (u.name || '').split(' ')[0] || '';

  /* Fuente única: STZ_UNITS (mismo array que usa el resto del sitio) */
  const units = STZ_UNITS.slice();
  const total = units.length;

  countEl.textContent = String(total).padStart(2, '0');

  if (!total){
    rows.setAttribute('aria-busy', 'false');
    rows.innerHTML = '<div class="dv-state dv-state--empty">No hay unidades activas por el momento.</div>';
    footEl.textContent = 'Mostrando 0 de 0 unidades';
    return;
  }

  /* Opciones derivadas de la data (no hardcodeadas) */
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const fillOpts = (sel, items, sort = true) => {
    const opts = sort ? items.slice().sort() : items.slice();
    sel.insertAdjacentHTML('beforeend', opts.map(v => `<option value="${esc(String(v))}">${esc(String(v))}</option>`).join(''));
  };
  fillOpts(marcaEl, uniq(units.map(brandOf)));
  fillOpts(anioEl,  uniq(units.map(u => u.year)).sort((a,b) => b - a), false);
  fillOpts(motorEl, uniq(units.map(u => u.engine)));
  fillOpts(cajaEl,  uniq(units.map(u => u.gearbox)));

  /* Brand tabs: "Todos" + marcas únicas en orden de aparición */
  const brandsOrdered = uniq(units.map(brandOf));
  tabsEl.innerHTML =
    `<button class="dv-tab on" type="button" data-brand="" role="tab" aria-selected="true">Todos</button>` +
    brandsOrdered.map(b => `<button class="dv-tab" type="button" data-brand="${esc(b)}" role="tab" aria-selected="false">${esc(b)}</button>`).join('');

  const state = { q:'', marca:'', anio:'', motor:'', caja:'', sort:'recent' };

  const rowHTML = (u, i) => {
    const img = u.img ? ('assets/img/fotos/' + u.img) : FALLBACK_IMG;
    const status = STATUS_LABEL[u.status] || STATUS_LABEL.ok;
    const wa = waLink(`Hola STZ, quiero consultar por la unidad ${u.code} (${u.name} ${u.year}).`);
    return `
    <article class="dv-row" data-code="${esc(u.code)}" data-idx="${i}"
             data-href="desarme.html?u=${encodeURIComponent(u.code)}"
             tabindex="0" role="link"
             aria-label="Explorar ${esc(u.name)} ${u.year}">
      <div class="dv-row__img">
        <div class="dv-row__badge"><b>${i === 0 ? 'Recién ingresado' : 'Activo'}</b><span>Cod. ${esc(u.code)}</span></div>
        <img src="${img}" alt="${esc(u.ph || u.name)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
      </div>
      <div class="dv-row__info">
        <div class="dv-row__num">${String(i + 1).padStart(2,'0')}</div>
        <div class="dv-row__body">
          <div class="dv-row__kicker">Unidad ${esc(u.code)}</div>
          <h3 class="dv-row__title">${esc(u.name)} · ${u.year}</h3>
          <div class="dv-row__mono">Motor ${esc(u.engine)} · Caja ${esc(u.gearbox)}</div>
          <div class="dv-row__count ${u.status === 'low' ? 'low' : ''}">${u.pieces} piezas disponibles</div>
          <p class="dv-row__desc">${esc(status)}. Fotografía real y piezas identificadas y trazables desde el ERP.</p>
        </div>
        <div class="dv-row__actions">
          <span class="dv-row__cta">Explorar vehículo
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M12 5l5 5-5 5"/></svg>
          </span>
          <a class="dv-row__wa" href="${wa}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M20 12a8 8 0 1 1-3.9-6.9L20 4l-1.1 3.9A8 8 0 0 1 20 12Z"/></svg>
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </article>`;
  };

  /* Observer para revelar filas al entrar en pantalla */
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let io = null;
  const disposeObserver = () => { if (io){ io.disconnect(); io = null; } };
  const observeRows = () => {
    disposeObserver();
    const els = rows.querySelectorAll('.dv-row');
    if (reduced || !('IntersectionObserver' in window)){
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting){
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold:.18, rootMargin:'0px 0px -60px 0px' });
    els.forEach(el => io.observe(el));
  };

  const filtered = () => {
    const q = state.q.trim().toLowerCase();
    let list = units.filter(u => {
      if (state.marca && brandOf(u) !== state.marca) return false;
      if (state.anio  && String(u.year) !== state.anio) return false;
      if (state.motor && u.engine !== state.motor) return false;
      if (state.caja  && u.gearbox !== state.caja) return false;
      if (q){
        const hay = (u.name + ' ' + u.code + ' ' + u.engine + ' ' + u.gearbox + ' ' + u.year).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    switch (state.sort){
      case 'pieces':    list.sort((a,b) => b.pieces - a.pieces); break;
      case 'year-desc': list.sort((a,b) => b.year   - a.year);   break;
      case 'year-asc':  list.sort((a,b) => a.year   - b.year);   break;
      default: break; /* 'recent' = orden original */
    }
    return list;
  };

  const render = () => {
    rows.setAttribute('aria-busy', 'true');
    const list = filtered();
    if (!list.length){
      rows.innerHTML = '<div class="dv-state dv-state--empty">No encontramos unidades con esos filtros. Probá con otra búsqueda.</div>';
      footEl.textContent = 'Mostrando 0 de ' + total + ' unidades';
      disposeObserver();
    } else {
      rows.innerHTML = list.map((u, i) => rowHTML(u, i)).join('');
      footEl.textContent = 'Mostrando ' + list.length + ' de ' + total + ' unidades';
      observeRows();
    }
    rows.setAttribute('aria-busy', 'false');
  };

  /* Wiring */
  const bindInput = (el, key) => {
    el.addEventListener('input', () => { state[key] = el.value; render(); });
    el.addEventListener('change', () => { state[key] = el.value; render(); });
  };
  bindInput(qEl, 'q');
  bindInput(marcaEl, 'marca');
  bindInput(anioEl, 'anio');
  bindInput(motorEl, 'motor');
  bindInput(cajaEl, 'caja');
  sortEl.addEventListener('change', () => { state.sort = sortEl.value; render(); });

  form.addEventListener('submit', (e) => { e.preventDefault(); render(); });

  /* Toda la card navega al detalle salvo que el click sea sobre el link de WhatsApp */
  rows.addEventListener('click', (e) => {
    if (e.target.closest('.dv-row__wa')) return;
    const card = e.target.closest('.dv-row');
    if (!card || !card.dataset.href) return;
    location.href = card.dataset.href;
  });
  rows.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.dv-row');
    if (!card || !card.dataset.href) return;
    if (e.target.closest('.dv-row__wa')) return;
    e.preventDefault();
    location.href = card.dataset.href;
  });

  tabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.dv-tab');
    if (!b) return;
    tabsEl.querySelectorAll('.dv-tab').forEach(t => {
      t.classList.remove('on'); t.setAttribute('aria-selected','false');
    });
    b.classList.add('on');
    b.setAttribute('aria-selected','true');
    state.marca = b.dataset.brand || '';
    marcaEl.value = state.marca;
    render();
  });

  addEventListener('beforeunload', disposeObserver);

  render();
}

/* ============================================================
   DESARME · Ficha de unidad (detalle tipo producto.html)
   ============================================================ */
function initUnidadDetail(){
  const root      = $('#udet');
  const crumbsEl  = $('#udet-crumbs');
  const relatedEl = $('#udet-related');
  if (!root || typeof STZ_UNITS === 'undefined' || !STZ_UNITS.length) return;

  const params = new URLSearchParams(location.search);
  const code = params.get('u') || STZ_UNITS[0].code;
  const u = getUnit(code) || STZ_UNITS[0];

  const FALLBACK_IMG = 'assets/img/fotos/unidad-lateral.jpg';
  const STATUS_LABEL = { ok:'Activo · piezas disponibles', low:'Pocas piezas', off:'Reservado' };
  const brandOf = x => (x.name || '').split(' ')[0] || '';
  /* Galería: foto principal + extras opcionales en u.imgs[] */
  const gallery = [u.img, ...(Array.isArray(u.imgs) ? u.imgs : [])]
    .filter(Boolean)
    .map(f => 'assets/img/fotos/' + f);
  if (!gallery.length) gallery.push(FALLBACK_IMG);
  const primaryImg = gallery[0];

  document.title = u.name + ' · ' + u.year + ' · Unidad ' + u.code + ' · STZ AutoPartes';

  crumbsEl.innerHTML = `<div>Home · <a href="desarme.html">Vehículos en desarme</a> · <b>Unidad ${esc(u.code)} — ${esc(u.name)} ${u.year}</b></div>`;

  const brand = brandOf(u);
  const catalogoHref = 'catalogo.html?' + new URLSearchParams({ marca: brand, anio: String(u.year) }).toString();
  const wa = waLink(`Hola STZ, quiero consultar por la unidad ${u.code} (${u.name} ${u.year}).`);
  const status = STATUS_LABEL[u.status] || STATUS_LABEL.ok;

  const multi = gallery.length > 1;
  root.className = 'pd udet';
  root.innerHTML = `
    <div class="pd-gallery">
      <div class="pd-main udet-gallery${multi ? ' udet-gallery--multi' : ''}"
           tabindex="0" role="region" aria-label="Fotos de la unidad ${esc(u.code)}"
           data-count="${gallery.length}">
        <div class="udet-badge"><b>Unidad ${esc(u.code)}</b><span>${esc(u.name)} ${u.year}</span></div>

        <div class="udet-gallery__viewport">
          <div class="udet-gallery__track">
            ${gallery.map((src, i) => `
              <div class="udet-gallery__slide">
                <img src="${src}" alt="${esc(u.ph || u.name)} — vista ${i + 1}"
                     ${i > 0 ? 'loading="lazy"' : 'decoding="async"'}
                     onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
              </div>`).join('')}
          </div>
        </div>

        ${multi ? `
          <button class="udet-gallery__nav udet-gallery__nav--prev" type="button" aria-label="Foto anterior">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <button class="udet-gallery__nav udet-gallery__nav--next" type="button" aria-label="Foto siguiente">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          </button>
          <div class="udet-gallery__counter"><span class="udet-gallery__cur">1</span> / ${gallery.length}</div>
          <div class="udet-gallery__dots" role="tablist" aria-label="Fotos">
            ${gallery.map((_, i) => `<button class="udet-gallery__dot ${i === 0 ? 'on' : ''}" type="button" data-idx="${i}" role="tab" aria-selected="${i === 0}" aria-label="Foto ${i + 1}"></button>`).join('')}
          </div>` : ''}
      </div>

    </div>

    <div class="pd-info">
      <div class="udet-head">
        <div>
          <div class="kicker">Vehículo en desarme · ${esc(u.code)}</div>
          <h1>${esc(u.name)} · ${u.year}</h1>
        </div>
        <button type="button" class="share-btn" data-share-title="${esc(u.name + ' · ' + u.year)}" data-share-text="Unidad ${esc(u.code)} — ${esc(u.name)} ${u.year}" aria-label="Compartir">
          ${shareIconSVG()}
        </button>
      </div>

      <div class="udet-simple">
        <div><span>Motor</span><b>${esc(u.engine)}</b></div>
        <div><span>Caja</span><b>${esc(u.gearbox)}</b></div>
        <div><span>Combustible</span><b>${esc(u.fuel || 'Nafta')}</b></div>
      </div>

      <a class="btn btn-wa btn-block" href="${wa}" target="_blank" rel="noopener" style="margin-top:20px">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20 12a8 8 0 1 1-3.9-6.9L20 4l-1.1 3.9A8 8 0 0 1 20 12Z"/></svg>
        Consultar por WhatsApp
      </a>
      <a class="btn btn-ghost btn-block" href="${catalogoHref}" style="margin-top:8px">Ver piezas de esta unidad →</a>

      <div class="pd-meta"><span>Retiro en local · Presidente Franco</span><span>Envío a todo Paraguay</span></div>
    </div>`;

  /* Botón compartir */
  wireShareButton(root.querySelector('.share-btn'), u.name + ' · ' + u.year + ' — Unidad ' + u.code);

  /* Galería: navegación estilo Marketplace (flechas + dots + swipe + teclado) */
  if (multi){
    const gEl    = root.querySelector('.udet-gallery');
    const track  = gEl.querySelector('.udet-gallery__track');
    const dots   = [...gEl.querySelectorAll('.udet-gallery__dot')];
    const curEl  = gEl.querySelector('.udet-gallery__cur');
    const prev   = gEl.querySelector('.udet-gallery__nav--prev');
    const next   = gEl.querySelector('.udet-gallery__nav--next');
    const view   = gEl.querySelector('.udet-gallery__viewport');
    let current  = 0;

    const update = () => {
      track.style.transform = `translateX(${-current * 100}%)`;
      dots.forEach((d, i) => {
        d.classList.toggle('on', i === current);
        d.setAttribute('aria-selected', String(i === current));
      });
      if (curEl) curEl.textContent = String(current + 1);
      prev.disabled = current === 0;
      next.disabled = current === gallery.length - 1;
    };

    const setIdx = (i) => {
      current = Math.max(0, Math.min(gallery.length - 1, i));
      update();
    };

    prev.addEventListener('click', () => setIdx(current - 1));
    next.addEventListener('click', () => setIdx(current + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => setIdx(i)));

    gEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight'){ e.preventDefault(); setIdx(current + 1); }
      else if (e.key === 'ArrowLeft'){ e.preventDefault(); setIdx(current - 1); }
    });

    /* Swipe: pointer events con transform seguido de snap */
    let dragging = false, startX = 0, dx = 0, pid = 0;
    view.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; dx = 0; startX = e.clientX; pid = e.pointerId;
      try { view.setPointerCapture(pid); } catch(_){}
      track.style.transition = 'none';
    });
    view.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      track.style.transform = `translateX(calc(${-current * 100}% + ${dx}px))`;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      const threshold = view.clientWidth * 0.15;
      if (Math.abs(dx) > threshold) setIdx(current + (dx < 0 ? 1 : -1));
      else update();
      dx = 0;
    };
    view.addEventListener('pointerup', endDrag);
    view.addEventListener('pointercancel', endDrag);

    update();
  }

  /* Relacionados: otras unidades — misma marca primero, luego el resto */
  const others = STZ_UNITS.filter(x => x.code !== u.code);
  const sameBrand = others.filter(x => brandOf(x) === brand);
  const rest      = others.filter(x => brandOf(x) !== brand);
  const rel = [...sameBrand, ...rest].slice(0, 3);

  const relCard = (x) => {
    const rimg = x.img ? ('assets/img/fotos/' + x.img) : FALLBACK_IMG;
    return `
    <a class="udet-rel-card" href="desarme.html?u=${encodeURIComponent(x.code)}">
      <div class="udet-rel-card__img">
        <img src="${rimg}" alt="${esc(x.ph || x.name)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
      </div>
      <div class="udet-rel-card__body">
        <div class="udet-rel-card__kicker">Unidad ${esc(x.code)}</div>
        <h3 class="udet-rel-card__title">${esc(x.name)} · ${x.year}</h3>
        <div class="udet-rel-card__mono">Motor ${esc(x.engine)} · ${esc(x.gearbox)}</div>
        <div class="udet-rel-card__count ${x.status === 'low' ? 'low' : ''}">${x.pieces} piezas disponibles</div>
      </div>
    </a>`;
  };

  relatedEl.innerHTML = rel.length ? `
    <div class="eyebrow">Más unidades activas</div>
    <h2>${sameBrand.length ? 'Otras unidades ' + esc(brand) : 'Otras unidades del patio'}</h2>
    <div class="udet-rel-grid">${rel.map(relCard).join('')}</div>` : '';
}

function initHome(){
  /* auto entra "manejando" cuando la sección de compatibilidad aparece */
  const car = $('.finder-car.enter');
  if (car){
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(en => {
          if (en.isIntersecting){ en.target.classList.add('go'); obs.unobserve(en.target); }
        });
      }, {threshold: .25});
      io.observe(car);
    } else {
      car.classList.add('go');
    }
  }

  /* selects del hero */
  fillSelect($('#h-marca'), BRANDS);
  fillSelect($('#h-modelo'), MODELS);
  fillSelect($('#h-anio'), YEARS);
  const catCombo = $('#h-cat');
  if (catCombo) catCombo.innerHTML += STZ_CATEGORIES.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');

  /* al elegir una marca, el select de modelo muestra sólo los de esa marca */
  linkBrandModel($('#h-marca'), $('#h-modelo'));

  /* mosaico de categorías + animación de aparición */
  renderCategorias();
  revealCategorias();

  /* mapa de contacto */
  initContactMap();

  /* búsqueda avanzada: los filtros existen pero arrancan plegados */
  const advBtn = $('.hero-adv-toggle'), adv = $('#hero-adv');
  if (advBtn && adv) advBtn.addEventListener('click', () => {
    const open = adv.hidden;
    adv.hidden = !open;
    advBtn.setAttribute('aria-expanded', String(open));
    if (open) $('#h-marca').focus();
  });

  /* destacados: producto principal + 3 laterales con rotación automática */
  initTaller();

  /* desarme del home: carrusel "Últimos ingresos al patio" (3 unidades por página) */
  initDesarmeHome();

  /* "guardar búsqueda" en localStorage — solo UI, el ERP lo cierra */
  const save = $('.finder-save');
  if (save) save.addEventListener('click', () => {
    const params = new FormData($('.finder')).entries();
    const q = Object.fromEntries([...params].filter(([,v]) => v));
    try{ const prev = JSON.parse(localStorage.getItem('stz_saved') || '[]');
      prev.unshift({q, ts:Date.now()});
      localStorage.setItem('stz_saved', JSON.stringify(prev.slice(0,10))); }catch(e){}
    toast('Búsqueda guardada');
  });

  /* formulario rápido */
  const qs = $('#quick-sell');
  if (qs) qs.addEventListener('submit', e => {
    e.preventDefault();
    qs.querySelector('.form-ok').classList.add('show');
    qs.reset();
    toast('Solicitud enviada');
  });
}

/* ============================================================
   CATÁLOGO
   ============================================================ */
function initCatalog(){
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    cats: new Set(params.get('cat') ? [params.get('cat')] : []),
    brands: new Set(params.get('marca') ? [params.get('marca')] : []),
    model: params.get('modelo') || '',
    yearFrom: '', yearTo: params.get('anio') || '',
    conds: new Set(params.get('cond') ? [params.get('cond')] : []),
    maxPrice: 5000000,
    stock: new Set(),
    sort: 'rel'
  };
  if (params.get('anio')){ state.yearFrom = params.get('anio'); state.yearTo = params.get('anio'); }

  $('#cat-search').value = state.q;

  /* filtros dinámicos */
  const countBy = (key, value) => STZ_PRODUCTS.filter(p => p[key] === value).length;
  $('#f-categorias').innerHTML = STZ_CATEGORIES
    .filter(c => STZ_PRODUCTS.some(p => p.category === c.id))
    .map(c => `<label><span><input type="checkbox" value="${c.id}" ${state.cats.has(c.id) ? 'checked' : ''}> ${esc(c.name)}</span><span class="n">${STZ_PRODUCTS.filter(p => p.category === c.id).length}</span></label>`).join('');
  $('#f-marcas').innerHTML = BRANDS
    .map(b => `<label><span><input type="checkbox" value="${esc(b)}" ${state.brands.has(b) ? 'checked' : ''}> ${esc(b)}</span><span class="n">${countBy('brand', b)}</span></label>`).join('');
  $$('#f-condicion input').forEach(i => { if (state.conds.has(i.value)) i.checked = true; });
  $('#f-desde').value = state.yearFrom;
  $('#f-hasta').value = state.yearTo;

  const readFilters = () => {
    state.cats   = new Set($$('#f-categorias input:checked').map(i => i.value));
    state.brands = new Set($$('#f-marcas input:checked').map(i => i.value));
    state.conds  = new Set($$('#f-condicion input:checked').map(i => i.value));
    state.stock  = new Set($$('#f-stock input:checked').map(i => i.value));
    state.yearFrom = $('#f-desde').value;
    state.yearTo   = $('#f-hasta').value;
    state.maxPrice = Number($('#f-precio').value);
    state.sort = $('#sort').value;
    state.q = $('#cat-search').value.trim();
    render();
  };

  $('#sidebar').addEventListener('change', readFilters);
  $('#sort').addEventListener('change', readFilters);
  $('#f-precio').addEventListener('input', () => {
    $('#precio-val').textContent = Number($('#f-precio').value).toLocaleString('es-PY').replace(/,/g,'.');
    readFilters();
  });
  $('#cat-form').addEventListener('submit', e => { e.preventDefault(); readFilters(); });
  const searchInput = $('#cat-search');
  const clearBtn = $('#cat-search-clear');
  const syncClear = () => { if (clearBtn) clearBtn.hidden = !searchInput.value; };
  searchInput.addEventListener('input', () => {
    state.q = searchInput.value.trim();
    syncClear();
    render();
  });
  if (clearBtn) clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.q = '';
    syncClear();
    render();
    searchInput.focus();
  });
  syncClear();

  /* botón de filtros en móvil */
  const toggle = $('#filters-toggle');
  const sidebar = $('#sidebar');
  const syncMobile = () => {
    if (window.matchMedia('(max-width:760px)').matches){
      toggle.style.display = 'flex';
      if (!toggle.dataset.init){ sidebar.hidden = true; toggle.dataset.init = '1'; }
    } else {
      toggle.style.display = 'none';
      sidebar.hidden = false;
    }
  };
  toggle.addEventListener('click', () => {
    sidebar.hidden = !sidebar.hidden;
    toggle.querySelector('span').textContent = sidebar.hidden ? '+' : '−';
  });
  window.addEventListener('resize', syncMobile);
  syncMobile();

  function match(p){
    const q = state.q.toLowerCase();
    if (q){
      const hay = [p.name, p.brand, p.model, p.oem, p.internal, p.id, STZ_CONDITION_LABEL[p.condition]]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.cats.size   && !state.cats.has(p.category)) return false;
    if (state.brands.size && !state.brands.has(p.brand))  return false;
    if (state.conds.size  && !state.conds.has(p.condition)) return false;
    if (state.model && p.model !== state.model) return false;
    if (state.yearFrom && p.yearTo   < Number(state.yearFrom)) return false;
    if (state.yearTo   && p.yearFrom > Number(state.yearTo))   return false;
    if (p.price > state.maxPrice) return false;
    if (state.stock.size){
      const inStock = p.stock !== null;
      if (state.stock.has('stock') && !state.stock.has('ask') && !inStock) return false;
      if (state.stock.has('ask') && !state.stock.has('stock') && inStock) return false;
    }
    return true;
  }

  function render(){
    let list = STZ_PRODUCTS.filter(match);
    if (state.sort === 'asc')  list.sort((a,b) => a.price - b.price);
    if (state.sort === 'desc') list.sort((a,b) => b.price - a.price);
    if (state.sort === 'new')  list.sort((a,b) => (b.condition === 'nuevo') - (a.condition === 'nuevo'));

    $('#results-grid').innerHTML = list.length
      ? list.map(p => productCard(p)).join('')
      : `<div class="empty"><b>Sin resultados</b>Probá quitar filtros o consultanos por WhatsApp con los datos de tu vehículo.</div>`;

    $('#result-count').textContent = list.length + (list.length === 1 ? ' resultado' : ' resultados');
    $('#pagination-info').textContent = list.length ? `MOSTRANDO 1–${list.length} DE ${list.length}` : 'SIN RESULTADOS';

    const cat = state.cats.size === 1 ? STZ_CATEGORIES.find(c => c.id === [...state.cats][0]) : null;
    $('#crumb-cat').textContent = cat ? cat.name : 'Todas las categorías';

    /* chips activos */
    const chips = [];
    if (state.q) chips.push(['q', '“' + state.q + '”', '']);
    state.cats.forEach(c => chips.push(['cat:' + c, (STZ_CATEGORIES.find(x => x.id === c) || {}).name || c, '']));
    state.brands.forEach(b => chips.push(['brand:' + b, b, '']));
    state.conds.forEach(c => chips.push(['cond:' + c, STZ_CONDITION_LABEL[c], 'red']));
    if (state.yearFrom || state.yearTo) chips.push(['years', `Años ${state.yearFrom || '…'}–${state.yearTo || '…'}`, '']);
    if (state.maxPrice < 5000000) chips.push(['price', 'Hasta ' + gs(state.maxPrice), '']);

    $('#active-filters').innerHTML =
      chips.map(([k,l,c]) => `<button class="fchip ${c}" data-chip="${esc(k)}">${esc(l)} <span>×</span></button>`).join('');
  }

  /* Limpiar todos los filtros — desde el sidebar o desde cualquier "clear-all" */
  const clearAllFilters = () => {
    $$('#sidebar input[type=checkbox]').forEach(i => i.checked = false);
    $('#f-desde').value = ''; $('#f-hasta').value = '';
    $('#f-precio').value = 5000000; $('#precio-val').textContent = '5.000.000';
    $('#cat-search').value = ''; state.model = '';
    readFilters();
  };
  const clearAllBtn = $('#clear-filters');
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllFilters);

  $('#active-filters').addEventListener('click', e => {
    if (e.target.closest('#clear-all')){ clearAllFilters(); return; }
    const chip = e.target.closest('[data-chip]');
    if (!chip) return;
    const [type, val] = chip.dataset.chip.split(':');
    if (type === 'q'){ $('#cat-search').value = ''; }
    if (type === 'cat')   $$('#f-categorias input').forEach(i => { if (i.value === val) i.checked = false; });
    if (type === 'brand') $$('#f-marcas input').forEach(i => { if (i.value === val) i.checked = false; });
    if (type === 'cond')  $$('#f-condicion input').forEach(i => { if (i.value === val) i.checked = false; });
    if (type === 'years'){ $('#f-desde').value = ''; $('#f-hasta').value = ''; }
    if (type === 'price'){ $('#f-precio').value = 5000000; $('#precio-val').textContent = '5.000.000'; }
    readFilters();
  });

  readFilters();
}

/* ============================================================
   PRODUCTO
   ============================================================ */
function initProduct(){
  const id = new URLSearchParams(location.search).get('id') || STZ_PRODUCTS[0].id;
  const p = getProduct(id) || STZ_PRODUCTS[0];
  document.title = p.name + ' · STZ AutoPartes';

  const cat = STZ_CATEGORIES.find(c => c.id === p.category) || { name:'Repuestos' };
  $('#pd-crumbs').innerHTML = `<div>Home · <a href="catalogo.html">Repuestos</a> · <a href="catalogo.html?cat=${p.category}">${esc(cat.name)}</a> · <b>${esc(p.name)}</b></div>`;

  let qty = 1, img = 0;

  const draw = () => {
    $('#pd').innerHTML = `
      <div class="pd-gallery">
        <div class="pd-main ph" data-ph="${esc(p.photos[img][1])}">
          ${photo(p.photos[img][0], p.name + ' — ' + p.photos[img][1])}
          <span class="tag ${p.condition === 'nuevo' ? 'nuevo' : (p.condition === 'recuperado' ? 'recuperado' : '')}">${STZ_CONDITION_SHORT[p.condition]} · ${p.id}</span>
          <button type="button" class="pd-zoom-btn" id="pd-zoom-open" aria-label="Ver imagen ampliada">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="9" cy="9" r="6"/><path d="M14 14l4 4M9 6v6M6 9h6"/>
            </svg>
          </button>
          <span class="pd-caption">${esc(p.photos[img][1])}</span>
        </div>
        <div class="pd-thumbs">
          ${p.photos.map(([f,t],i) => `<button type="button" class="${i === img ? 'on' : ''}" data-img="${i}" aria-label="${esc(t)}">${photoBox(f, t)}</button>`).join('')}
        </div>
        <div class="warn"><b>Antes de comprar, verificá</b> que el código y la compatibilidad correspondan a tu vehículo. Si tenés dudas, consultanos por WhatsApp con la chapa y el año.</div>
      </div>

      <div class="pd-info">
        <div class="udet-head">
          <div>
            <div class="kicker">${esc(cat.name)} · ${p.id}</div>
            <h1>${esc(p.name)}</h1>
          </div>
          <button type="button" class="share-btn" aria-label="Compartir">${shareIconSVG()}</button>
        </div>
        <div class="pd-fit">${esc(p.brand)} ${esc(p.model)} · ${p.yearFrom}–${p.yearTo} · ${esc(p.side)}</div>

        <div class="pd-price">
          <div class="price">${gs(p.price)}</div>
          ${stockHTML(p).replace('<div class="stock', '<div class="stock')}
        </div>

        <dl class="spec">
          <dt>Condición</dt><dd>${STZ_CONDITION_LABEL[p.condition]}</dd>
          ${p.oem ? `<dt>OEM</dt><dd class="mono">${p.oem}</dd>` : ''}
          <dt>Código interno</dt><dd class="mono">${p.internal}</dd>
          <dt>Lado / Posición</dt><dd>${esc(p.side)}</dd>
          <dt>Procedencia</dt><dd>${p.unit ? 'Unidad de desarme ' + p.unit : 'Pieza nueva de proveedor'}</dd>
          <dt>Compatibilidad</dt><dd><div class="compat">${p.compat.map(([t,ok]) => `<span class="${ok ? '' : 'maybe'}">${ok ? '✓' : '?'} ${esc(t)}</span>`).join('')}</div></dd>
        </dl>

        <div style="margin-top:20px">
          <div class="kicker" style="color:var(--ink);font-weight:600">Observaciones de estado</div>
          <p style="font-size:13px;line-height:1.55;color:var(--gray);margin:8px 0 0">${esc(p.notes)}</p>
        </div>

        <div class="pd-cta">
          <div class="qty">
            <button type="button" data-q="-1" aria-label="Restar">−</button>
            <span id="qty">${qty}</span>
            <button type="button" data-q="1" aria-label="Sumar">+</button>
          </div>
          <button class="btn btn-dark" type="button" id="add-cart">Agregar al carrito →</button>
        </div>
        <a class="btn btn-ghost btn-block pd-inline-wa" style="margin-top:8px" href="${waLink('Hola STZ, consulto por ' + p.id + ' — ' + p.name)}" target="_blank" rel="noopener">
          <span class="dot dot-green"></span>Consultar por WhatsApp
        </a>

        <div class="pd-meta"><span>Retiro en local · gratis</span><span>Envío a todo Paraguay</span></div>
      </div>`;

    $$('#pd [data-img]').forEach(b => b.addEventListener('click', () => { img = Number(b.dataset.img); draw(); }));
    $$('#pd [data-q]').forEach(b => b.addEventListener('click', () => {
      qty = Math.max(1, qty + Number(b.dataset.q));
      $('#qty').textContent = qty;
    }));
    $('#add-cart').addEventListener('click', () => cartAdd(p.id, qty));

    /* zoom: hover con lente + panel al costado en desktop; click abre lightbox */
    const main = $('#pd .pd-main');
    const openZoom = () => openPdLightbox(p, img, i => { img = i; draw(); });
    $('#pd-zoom-open').addEventListener('click', e => { e.stopPropagation(); openZoom(); });
    main.addEventListener('click', e => {
      if (e.target.closest('.pd-zoom-btn,.tag,.pd-caption')) return;
      openZoom();
    });
    attachHoverZoom(main);
    wireShareButton($('#pd .share-btn'), p.name + ' — ' + p.id);
  };
  draw();

  /* relacionados: misma unidad de desarme o misma categoría */
  const rel = STZ_PRODUCTS
    .filter(x => x.id !== p.id && (x.unit && x.unit === p.unit || x.category === p.category))
    .slice(0, 4);
  $('#pd-related').innerHTML = `
    <div class="eyebrow">Relacionados · compatibles</div>
    <h2 style="font-size:22px;letter-spacing:-.02em;margin:8px 0 20px">${p.unit ? 'Piezas para la misma unidad' : 'Piezas de la misma familia'}</h2>
    <div class="rel-grid">${rel.map(x => productCard(x, { compact:true })).join('')}</div>`;

  /* animación de aparición al hacer scroll para las cards relacionadas */
  const cards = $$('#pd-related .card');
  if (cards.length && 'IntersectionObserver' in window
      && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    cards.forEach((c, i) => {
      c.setAttribute('data-reveal','');
      c.style.setProperty('--d', (i * 70) + 'ms');
    });
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting){ en.target.classList.add('in'); obs.unobserve(en.target); }
      });
    }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
    cards.forEach(c => io.observe(c));
  }
}

/* Locales de STZ AutoPartes — coordenadas reales para el mapa de contacto.
   Si `coords` es null la ficha se muestra pero no se dibuja el pin en el mapa. */
const STZ_LOCATIONS = [
  {
    id: 'principal',
    name: 'STZ AutoPartes',
    tag: 'Local principal',
    address: 'Presidente Franco 100217 · Alto Paraná',
    coords: [-25.548253, -54.6080614],
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-25.548253,-54.6080614'
  },
  {
    id: 'deposito',
    name: 'STZ AutoPartes · Depósito 2',
    tag: 'Depósito 2',
    address: 'Presidente Franco · Alto Paraná',
    coords: [-25.54835, -54.6307898],
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-25.54835,-54.6307898'
  }
];

/* Mapa de contacto con Leaflet + OpenStreetMap. Se dibuja solo si el
   contenedor existe y la librería cargó. Los locales sin coordenadas
   aparecen como ficha lateral con enlace directo a Google Maps. */
function initContactMap(){
  const el = document.getElementById('stz-map');
  const legend = document.getElementById('stz-map-legend');
  if (!el || typeof L === 'undefined') return;

  const withCoords = STZ_LOCATIONS.filter(l => l.coords);
  if (!withCoords.length) return;

  const map = L.map(el, {
    scrollWheelZoom: false,      // no secuestra el scroll de la página
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  /* pin custom: círculo rojo con "S" blanca en el centro, coherente con la marca */
  const pinHtml = `
    <div class="stz-pin">
      <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 11.5 14.4 22.7 15 23.2.6.5 1.4.5 2 0 .6-.5 15-11.7 15-23.2C32 7.16 24.84 0 16 0Z" fill="#C11A1A"/>
        <circle cx="16" cy="15" r="6" fill="#fff"/>
      </svg>
    </div>`;
  const pinIcon = L.divIcon({
    className: 'stz-pin-wrap',
    html: pinHtml,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36]
  });

  const bounds = [];
  withCoords.forEach(loc => {
    const m = L.marker(loc.coords, { icon: pinIcon, title: loc.name }).addTo(map);
    m.bindPopup(`
      <div class="stz-popup">
        <div class="stz-popup__tag">${loc.tag}</div>
        <div class="stz-popup__name">${loc.name}</div>
        <div class="stz-popup__addr">${loc.address}</div>
        <a class="stz-popup__cta" href="${loc.mapsUrl}" target="_blank" rel="noopener">Abrir en Maps →</a>
      </div>
    `);
    bounds.push(loc.coords);
  });

  if (bounds.length === 1){
    map.setView(bounds[0], 16);
  } else {
    map.fitBounds(bounds, { padding: [40, 40] });
  }

  /* leyenda: ficha por local al costado/abajo del mapa */
  if (legend){
    legend.innerHTML = STZ_LOCATIONS.map(loc => `
      <a class="map-legend__item${loc.coords ? '' : ' is-pending'}" href="${loc.mapsUrl}" target="_blank" rel="noopener">
        <div class="map-legend__tag">${loc.tag}</div>
        <div class="map-legend__name">${loc.name}</div>
        <div class="map-legend__addr">${loc.address}</div>
        <span class="map-legend__cta">Abrir en Maps →</span>
      </a>
    `).join('');
  }
}

/* Zoom con lente al hacer hover sobre la foto principal.
   Crea una "lupa" (rectángulo con guía) que sigue al cursor sobre la imagen
   y un panel al costado que muestra la zona ampliada con background-image. */
function attachHoverZoom(main){
  if (!main) return;
  /* en dispositivos táctiles no hay hover: dejamos solo el lightbox (click) */
  if (matchMedia('(hover: none)').matches) return;

  const photo = main.querySelector('.photo');
  if (!photo) return;

  const lens = document.createElement('span');
  lens.className = 'pd-lens';
  main.appendChild(lens);

  const panel = document.createElement('div');
  panel.className = 'pd-zoom-panel';
  main.appendChild(panel);

  const ZOOM = 2.6;

  const off = () => { lens.classList.remove('is-on'); panel.classList.remove('is-on'); };

  const move = e => {
    /* ignorar hover sobre botones/etiquetas encima de la foto */
    if (e.target.closest('.pd-zoom-btn,.tag,.pd-caption')){ off(); return; }
    const r = photo.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height){ off(); return; }

    /* fondo del panel = imagen actual escalada por ZOOM */
    const src = photo.currentSrc || photo.src;
    if (panel.dataset.src !== src){
      panel.style.backgroundImage = `url("${src}")`;
      panel.dataset.src = src;
    }
    panel.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;

    /* tamaño de la lente en proporción al panel visible */
    const pw = panel.offsetWidth || r.width;
    const ph = panel.offsetHeight || r.height;
    const lensW = pw / ZOOM;
    const lensH = ph / ZOOM;
    lens.style.width  = lensW + 'px';
    lens.style.height = lensH + 'px';

    /* clampear la lente dentro de la imagen */
    let lx = Math.max(0, Math.min(r.width  - lensW, x - lensW / 2));
    let ly = Math.max(0, Math.min(r.height - lensH, y - lensH / 2));
    lens.style.left = lx + 'px';
    lens.style.top  = ly + 'px';

    panel.style.backgroundPosition = `-${lx * ZOOM}px -${ly * ZOOM}px`;

    lens.classList.add('is-on');
    panel.classList.add('is-on');
  };

  main.addEventListener('mousemove', move);
  main.addEventListener('mouseleave', off);
}

/* Lightbox para el zoom de la foto principal.
   Recibe el producto, el índice actual y un callback para sincronizar la
   selección de miniaturas si el usuario cambia de foto dentro del zoom. */
function openPdLightbox(p, startIdx, onChange){
  let i = startIdx;
  const total = p.photos.length;

  const el = document.createElement('div');
  el.className = 'pd-lightbox';
  el.setAttribute('role','dialog');
  el.setAttribute('aria-modal','true');
  el.innerHTML = `
    <button type="button" class="pd-lightbox__close" aria-label="Cerrar zoom">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    ${total > 1 ? `
      <button type="button" class="pd-lightbox__nav pd-lightbox__nav--prev" aria-label="Foto anterior">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <button type="button" class="pd-lightbox__nav pd-lightbox__nav--next" aria-label="Foto siguiente">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
      </button>
    ` : ''}
    <figure class="pd-lightbox__stage">
      <img class="pd-lightbox__img" alt="">
      <figcaption class="pd-lightbox__cap"></figcaption>
    </figure>
    <div class="pd-lightbox__counter"></div>
  `;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';

  const img = el.querySelector('.pd-lightbox__img');
  const cap = el.querySelector('.pd-lightbox__cap');
  const counter = el.querySelector('.pd-lightbox__counter');
  const stage = el.querySelector('.pd-lightbox__stage');

  const paint = () => {
    const [f, t] = p.photos[i];
    img.src = 'assets/img/fotos/' + f;
    img.alt = p.name + ' — ' + t;
    cap.textContent = t;
    counter.textContent = String(i + 1).padStart(2,'0') + ' / ' + String(total).padStart(2,'0');
    img.style.transform = '';   // reset zoom pan al cambiar
    stage.classList.remove('is-zoomed');
    if (onChange) onChange(i);
  };
  const go = d => { i = (i + d + total) % total; paint(); };

  /* pan simple al hacer click sobre la imagen — 2x zoom con seguimiento del cursor */
  const toggleZoom = e => {
    const r = img.getBoundingClientRect();
    if (stage.classList.contains('is-zoomed')){
      img.style.transform = '';
      stage.classList.remove('is-zoomed');
    } else {
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top)  / r.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = 'scale(2)';
      stage.classList.add('is-zoomed');
    }
  };

  const onKey = e => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && total > 1) go(1);
    else if (e.key === 'ArrowLeft' && total > 1) go(-1);
  };
  const close = () => {
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = '';
    el.remove();
  };

  el.querySelector('.pd-lightbox__close').addEventListener('click', close);
  el.addEventListener('click', e => { if (e.target === el) close(); });
  img.addEventListener('click', toggleZoom);
  if (total > 1){
    el.querySelector('.pd-lightbox__nav--prev').addEventListener('click', () => go(-1));
    el.querySelector('.pd-lightbox__nav--next').addEventListener('click', () => go(1));
  }
  document.addEventListener('keydown', onKey);

  paint();
  requestAnimationFrame(() => el.classList.add('is-open'));
}

/* ============================================================
   DESARME
   ============================================================ */

/* Iconos por zona (fija por índice: 1=frente, 2=motor, 3=cabina, 4=puertas, 5=cola) */
const ZONE_ICONS = {
  1: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c0-3 2-5 5-5h6a7 7 0 0 1 7 7v1H2v-3z"/><path d="M6 7v-2M10 7v-2"/><circle cx="6" cy="12" r="1"/></svg>',
  2: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h2l1-3h4l1 2h6l2 2h3v6H3z"/><path d="M8 9V6h4v3"/><path d="M17 12v-3"/></svg>',
  3: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.5"/><path d="M12 4v6M4 12h6M20 12h-6M12 20v-6"/></svg>',
  4: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h10v18H6z"/><path d="M13 12h1"/><path d="M9 6h4v3H9z"/></svg>',
  5: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h14l4 4v6H3z"/><circle cx="8" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
};

function initDesarme(){
  const params = new URLSearchParams(location.search);
  let current = params.get('u') || STZ_UNITS[0].code;
  let zone = Number(params.get('z')) || 2;
  let animating = false;
  let animTimer = 0, animExit = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nombre de marca dentro de la unidad → marca canónica del catálogo */
  const BRAND_ALIAS = { 'VW':'Volkswagen', 'Chevy':'Chevrolet' };
  /* Zona → categoría principal del catálogo (aproximación primaria; el usuario
     puede desactivarla desde el sidebar si busca algo de otra familia) */
  const ZONE_TO_CAT = {
    'Frente':  'faros',
    'Motor':   'motores',
    'Cabina':  'interior',
    'Puertas': 'burletes',
    'Cola':    'faros'
  };
  /* Arma URL del catálogo pre-filtrado por vehículo + zona */
  const zoneCatalogUrl = (u, z) => {
    const p = new URLSearchParams();
    const brand = BRAND_ALIAS[u.name.split(' ')[0]] || u.name.split(' ')[0];
    p.set('marca', brand);
    if (u.year) p.set('anio', String(u.year));
    if (z && ZONE_TO_CAT[z.name]) p.set('cat', ZONE_TO_CAT[z.name]);
    return 'catalogo.html?' + p.toString();
  };

  /* Precarga imágenes de todas las unidades para evitar parpadeos */
  STZ_UNITS.forEach(u => { if (u.img){ const im = new Image(); im.src = 'assets/img/fotos/' + u.img; } });

  const renderTabs = () => {
    $('#unit-tabs').innerHTML = STZ_UNITS.map(u => `
      <button class="unit-tab ${u.code === current ? 'on' : ''}" type="button" data-unit="${u.code}" role="tab" aria-selected="${u.code === current}">
        <b>${esc(u.name)} · ${u.year}</b>
        <small>${u.code}</small>
      </button>`).join('');
  };

  const renderSummary = () => {
    const u = getUnit(current);
    if (!u){ $('#unit-summary').innerHTML = ''; return; }
    const z = u.zones.find(x => x.n === zone) || u.zones[0];
    zone = z.n;
    $('#unit-summary').innerHTML = `
      <div class="us-kicker">Unidad ${u.code}</div>
      <div class="us-title">${esc(u.name)} · ${u.year}</div>
      <div class="us-mono">${esc(u.engine)} · ${esc(u.gearbox)}</div>

      <div class="us-divider"></div>

      <div class="us-count"><b>${u.pieces}</b><span>piezas disponibles</span></div>
      <div class="us-status ${u.status === 'low' ? 'low' : 'ok'}">${u.status === 'low' ? 'Pocas piezas' : 'Activo · piezas disponibles'}</div>

      <div class="us-divider"></div>

      <div class="us-zones-title">Zonas del vehículo</div>
      <div class="us-zone-list">
        ${u.zones.map(z2 => `
          <button class="us-zone ${z2.n === zone ? 'on' : ''}" type="button" data-zone="${z2.n}">
            <span class="z-num">${String(z2.n).padStart(2,'0')}</span>
            <span class="z-icon">${ZONE_ICONS[z2.n] || ''}</span>
            <span class="z-name">${esc(z2.name)}</span>
            <span class="z-arrow">›</span>
          </button>`).join('')}
      </div>

      <a class="us-cta" href="#zone-detail">Ver las ${z.count} piezas del ${esc(z.name.toLowerCase())} →</a>
    `;
  };

  const renderDiagram = () => {
    const u = getUnit(current);
    if (!u){ $('#unit-diagram').innerHTML = ''; return; }
    const z = u.zones.find(x => x.n === zone) || u.zones[0];
    zone = z.n;

    /* Posición del callout: centrado horizontalmente sobre el hotspot; el tail se calcula post-render */
    const cx = Math.max(18, Math.min(z.x, 82));

    $('#unit-diagram').innerHTML = `
      ${photoBox(u.img, u.ph)}
      <div class="grid-ovl"></div>
      <div class="corner tl"></div><div class="corner tr"></div>
      <div class="corner bl"></div><div class="corner br"></div>

      ${u.zones.map(z2 => `
        <button class="hotspot ${z2.n === zone ? 'on' : ''}" type="button" data-zone="${z2.n}" style="left:${z2.x}%;top:${z2.y}%" aria-label="Zona ${esc(z2.name)}">${z2.n}</button>
      `).join('')}

      <div class="callout" style="left:${cx}%;top:0;visibility:hidden">
        <div class="kicker">${String(z.n).padStart(2,'0')} · ${esc(z.name.toUpperCase())}</div>
        <b>${z.count} piezas activas</b>
        <a href="#zone-detail">Ver piezas →</a>
      </div>

      <div class="dd-foot">
        <b>${esc(u.name.toUpperCase())} · ${u.year} · CÓD. ${u.code}</b>
        <span class="right">ERP ACTUALIZADO · HOY 14:22</span>
      </div>
    `;
    placeCallout($('#unit-diagram'));
  };

  const renderZoneDetail = () => {
    const u = getUnit(current);
    if (!u){ $('#zone-detail').innerHTML = ''; return; }
    const z = u.zones.find(x => x.n === zone) || u.zones[0];
    const parts = z.parts.map(getProduct).filter(Boolean);
    $('#zone-detail').innerHTML = `
      <div>
        <div class="eyebrow">Zona ${z.n} · ${esc(z.name.toUpperCase())}</div>
        <h3>${z.count} piezas disponibles</h3>
        <p>${esc(z.desc)}</p>
        <div class="zone-specs">
          <div><span class="kicker">Motor</span><b>${esc(u.engine)}</b></div>
          <div><span class="kicker">Caja</span><b>${esc(u.gearbox)}</b></div>
          <div><span class="kicker">Año</span><b>${u.year}</b></div>
        </div>
        <a class="btn btn-ghost btn-block" style="margin-top:20px" href="${waLink('Hola STZ, consulto por piezas de la unidad ' + u.code + ' (' + u.name + ' ' + u.year + '), zona ' + z.name + '.')}" target="_blank" rel="noopener">Consultar esta zona</a>
      </div>
      <div>
        ${parts.length ? `
        <div class="zone-parts">
          ${parts.map(pt => `
            <a class="zpart" href="producto.html?id=${encodeURIComponent(pt.id)}">
              <div class="media">
                ${photoBox(pt.img, pt.ph)}
                <span class="code">${pt.id}</span>
                <span class="zpart__arrow" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l6-6M11 5H6M11 5v5"/></svg>
                </span>
              </div>
              <div class="info">
                <b>${esc(pt.name)}</b>
                <div class="zpart__foot">
                  <span class="zpart__price">${gs(pt.price)}</span>
                  <span class="zpart__cond zpart__cond--${pt.condition}">${esc(STZ_CONDITION_LABEL[pt.condition])}</span>
                </div>
              </div>
            </a>`).join('')}
          ${z.count > parts.length ? `
          <div class="zpart zpart--more">
            <div class="kicker">+ ${z.count - parts.length} piezas más</div>
            <a href="${zoneCatalogUrl(u, z)}">Ver todas
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h11M11 5l5 5-5 5"/></svg>
            </a>
          </div>` : ''}
        </div>` : `
        <div class="zone-empty">
          <div class="zone-empty__num">${String(z.n).padStart(2,'0')}</div>
          <div class="zone-empty__body">
            <div class="kicker">Zona ${z.n} · ${esc(z.name.toUpperCase())} · ${z.count} piezas</div>
            <h4>Todavía no publicamos las fichas de estas piezas.</h4>
            <p>Están cargadas en el ERP pero aún no las mostramos con detalle acá. Consultanos por WhatsApp con la pieza o el código de la unidad ${esc(u.code)} y te pasamos foto, precio y estado al instante.</p>
            <div class="zone-empty__cta">
              <a class="btn btn-red" href="${waLink('Hola STZ, consulto por piezas de la zona ' + z.name + ' de la unidad ' + u.code + ' (' + u.name + ' ' + u.year + ').')}" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5v-.5l-.8-1.9c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-.9 2.5a7 7 0 0 0 1.5 3.1 9.4 9.4 0 0 0 4.6 3.3c1.1.4 1.9.4 2.5.3.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
                Consultar por WhatsApp
              </a>
              <a class="btn btn-ghost" href="${zoneCatalogUrl(u, z)}">Ver piezas de esta unidad →</a>
            </div>
          </div>
        </div>`}
      </div>`;
  };

  const renderAll = () => { renderTabs(); renderSummary(); renderDiagram(); renderZoneDetail(); };

  const switchUnit = (code) => {
    if (animating || code === current) return;

    if (reducedMotion){
      current = code; zone = 2;
      renderAll();
      return;
    }

    const diagram = $('#unit-diagram');
    const tabs    = $('#unit-tabs');
    const summary = $('#unit-summary');
    animating = true;
    tabs.classList.add('is-transitioning');
    diagram.classList.remove('is-entering');
    diagram.classList.add('is-exiting');

    clearTimeout(animExit); clearTimeout(animTimer);
    animExit = setTimeout(() => {
      current = code; zone = 2;
      renderAll();
      const newDiagram = $('#unit-diagram');
      newDiagram.classList.remove('is-exiting');
      newDiagram.querySelectorAll('.hotspot').forEach((h, i) => h.style.setProperty('--i', i));
      void newDiagram.offsetWidth;
      newDiagram.classList.add('is-entering');
      const newSummary = $('#unit-summary');
      if (newSummary) newSummary.classList.add('is-fading-in');

      animTimer = setTimeout(() => {
        newDiagram.classList.remove('is-entering');
        if (newSummary) newSummary.classList.remove('is-fading-in');
        tabs.classList.remove('is-transitioning');
        animating = false;
      }, 2200);
    }, 280);
  };

  const setZone = (n) => {
    if (n === zone) return;
    zone = n;
    renderSummary(); renderDiagram(); renderZoneDetail();
  };

  $('#unit-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-unit]');
    if (!b) return;
    switchUnit(b.dataset.unit);
  });
  $('#unit-diagram').addEventListener('click', e => {
    const b = e.target.closest('[data-zone]');
    if (!b) return;
    setZone(Number(b.dataset.zone));
  });
  $('#unit-summary').addEventListener('click', e => {
    const b = e.target.closest('[data-zone]');
    if (!b) return;
    setZone(Number(b.dataset.zone));
  });

  /* Re-posicionar el conector al redimensionar (sin re-animar) */
  window.addEventListener('resize', () => placeCallout($('#unit-diagram'), {animate:false}));

  renderAll();
}

/* ============================================================
   CARRITO
   ============================================================ */
function initCart(){
  let delivery = 'retiro';

  const draw = () => {
    const items = cartItems();
    const root = $('#cart-root');

    if (!items.length){
      root.innerHTML = `
        <div class="cart-empty">
          <div class="eyebrow">Tu carrito</div>
          <h2>Todavía no agregaste piezas.</h2>
          <p>Buscá por pieza, vehículo o código OEM y agregá lo que necesites.</p>
          <a class="btn btn-red" href="catalogo.html">Ver catálogo →</a>
        </div>`;
      return;
    }

    const total = cartTotal();
    root.innerHTML = `
      <div class="cart-head">
        <div>
          <div class="kicker">Tu carrito</div>
          <h1>${items.length} ${items.length === 1 ? 'pieza lista' : 'piezas listas'} para pedido</h1>
        </div>
        <div class="cart-steps"><span class="on">01 · Carrito</span><span>02 · Entrega</span><span>03 · Confirmación</span></div>
      </div>

      <div class="cart-layout">
        <div>
          ${items.map(({product:p, qty}) => `
            <div class="cart-item">
              <a class="media" href="producto.html?id=${encodeURIComponent(p.id)}">${photoBox(p.img, p.ph)}</a>
              <div>
                <div class="card-oem">${p.oem ? 'OEM ' + p.oem + ' · ' : ''}${p.id}</div>
                <h3><a href="producto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
                <div class="card-fit">${esc(p.brand)} ${esc(p.model)} · ${p.yearFrom}–${p.yearTo} · <b style="color:${p.condition === 'nuevo' ? 'var(--red)' : 'var(--ink)'}">${STZ_CONDITION_LABEL[p.condition]}</b></div>
                <div class="links">
                  <button type="button" data-remove="${p.id}">Eliminar</button>
                  <button type="button" data-save="${p.id}">Guardar para después</button>
                </div>
              </div>
              <div class="col-qty" style="text-align:right">
                <div class="qty-sm">
                  <button type="button" data-qty="${p.id}:-1" aria-label="Restar">−</button>
                  <span>${qty}</span>
                  <button type="button" data-qty="${p.id}:1" aria-label="Sumar">+</button>
                </div>
                <div class="line-total">${gs(p.price * qty)}</div>
              </div>
            </div>`).join('')}

          <div class="delivery">
            <div class="eyebrow">Entrega</div>
            <h2>¿Cómo querés recibirlo?</h2>
            <div class="deliv-opts">
              <button class="deliv ${delivery === 'retiro' ? 'on' : ''}" type="button" data-deliv="retiro">
                <span class="top"><span class="kicker" style="color:${delivery === 'retiro' ? 'var(--red)' : 'var(--gray)'}">Opción 01</span><span class="radio"></span></span>
                <b>Retiro en local</b>
                <small>Presidente Franco · sin costo · listo en 24 h</small>
              </button>
              <button class="deliv ${delivery === 'envio' ? 'on' : ''}" type="button" data-deliv="envio">
                <span class="top"><span class="kicker" style="color:${delivery === 'envio' ? 'var(--red)' : 'var(--gray)'}">Opción 02</span><span class="radio"></span></span>
                <b>Envío a todo Paraguay</b>
                <small>Coordinamos con vos por WhatsApp</small>
              </button>
            </div>
          </div>
        </div>

        <aside class="summary">
          <div class="kicker">Resumen de compra</div>
          <div class="sum-rows">
            <div><span>Subtotal (${items.reduce((a,i) => a + i.qty, 0)} piezas)</span><b>${gs(total)}</b></div>
            <div><span>${delivery === 'retiro' ? 'Retiro en local' : 'Envío'}</span><b style="color:${delivery === 'retiro' ? 'var(--green)' : 'var(--ink)'}">${delivery === 'retiro' ? 'Gratis' : 'A coordinar'}</b></div>
            <div><span>Impuestos incluidos</span><b>—</b></div>
          </div>
          <div class="sum-total"><span style="font-weight:700;font-size:14px">TOTAL</span><b>${gs(total)}</b></div>
          <a class="btn btn-wa btn-block" href="${waLink(waCartText(items, total, delivery))}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20 12a8 8 0 1 1-3.9-6.9L20 4l-1.1 3.9A8 8 0 0 1 20 12Z"/></svg>
            Cerrar pedido por WhatsApp
          </a>
          <div class="erp-note"><b style="color:var(--ink)">Confirmación por WhatsApp</b> — te contactamos para cerrar la compra y coordinar la entrega.</div>
          <div class="kicker" style="margin-top:16px;line-height:1.6">Métodos de pago<br>Transferencia · Tarjeta · Efectivo en local</div>
        </aside>
      </div>`;

    $$('[data-qty]').forEach(b => b.addEventListener('click', () => {
      const [id, d] = b.dataset.qty.split(':');
      const c = cartRead();
      cartSet(id, (c[id] || 0) + Number(d));
      draw();
    }));
    $$('[data-remove]').forEach(b => b.addEventListener('click', () => { cartRemove(b.dataset.remove); draw(); toast('Pieza eliminada'); }));
    $$('[data-save]').forEach(b => b.addEventListener('click', () => { cartRemove(b.dataset.save); draw(); toast('Guardado para después'); }));
    $$('[data-deliv]').forEach(b => b.addEventListener('click', () => { delivery = b.dataset.deliv; draw(); }));
  };

  draw();
}

function waCartText(items, total, delivery){
  return 'Hola STZ, quiero cerrar este pedido:\n' +
    items.map(({product:p, qty}) => `• ${qty} × ${p.id} — ${p.name} (${gs(p.price * qty)})`).join('\n') +
    `\nTotal: ${gs(total)}\nEntrega: ${delivery === 'retiro' ? 'Retiro en local' : 'Envío'}`;
}

/* ============================================================
   VENDER (página completa)
   ============================================================ */
function initSellPage(){
  const form = $('#sell-form');

  /* halo rojo que sigue al cursor en TODO el main de la página vender */
  const stage = document.querySelector('body[data-page="vender"] main');
  if (stage && !matchMedia('(hover: none)').matches
      && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    let raf = 0, tx = 50, ty = 20;
    const update = () => {
      raf = 0;
      stage.style.setProperty('--mx', tx + '%');
      stage.style.setProperty('--my', ty + '%');
    };
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top)  / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(update);
    });
    stage.addEventListener('mouseenter', () => stage.style.setProperty('--glow','1'));
    stage.addEventListener('mouseleave', () => stage.style.setProperty('--glow','0'));
  }

  $$('#uploads .slot').forEach(slot => {
    const input = slot.querySelector('input');
    input.addEventListener('change', () => {
      if (input.files && input.files.length){
        slot.classList.add('filled');
        slot.querySelector('i').textContent = '✓';
      }
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    $$('.wizard span').forEach(s => s.classList.add('on'));
    form.querySelector('.form-ok').classList.add('show');
    form.querySelector('.form-ok').scrollIntoView({ behavior:'smooth', block:'center' });
    toast('Solicitud enviada');
  });
}
