# STZ AutoPartes · sitio web

Sitio estático construido a partir del documento de diseño `STZ AutoPartes.dc.html`
(7 pantallas). Sin dependencias ni build: HTML + CSS + JS.

## Cómo verlo en local

```bash
node web/server.js
# → http://localhost:5173
```

También se puede abrir `web/index.html` directamente con doble clic
(todo funciona por rutas relativas, sin `fetch`).

## Páginas

| Archivo          | Pantalla del diseño                  |
|------------------|--------------------------------------|
| `index.html`     | 01 · Home                            |
| `catalogo.html`  | 02 · Catálogo (filtros funcionando)  |
| `producto.html`  | 03 · Producto (`?id=P-024`)          |
| `desarme.html`   | 04 · Vehículos en desarme            |
| `vender.html`    | 05 · Vendé tu vehículo               |
| `carrito.html`   | 06 · Carrito                         |
| —                | 07 · Móvil → aplicado como responsive |

La pantalla 07 no es una página aparte: sus decisiones (menú lateral a pantalla
completa, barra inferior de 4 accesos, hero apilado, categorías en 2 columnas,
CTA fija en la ficha de producto) están aplicadas por media queries a partir de
760 px. Entre 760 y 980 px el header pasa al menú lateral pero el contenido
mantiene el layout de escritorio.

## Archivos

```
web/
├─ index.html · catalogo.html · producto.html · desarme.html · vender.html · carrito.html
├─ server.js                  servidor estático mínimo (node)
└─ assets/
   ├─ img/logo-stz.png        logo con fondo transparente, recortado (535×296, 99 KB)
   ├─ css/styles.css          sistema visual completo + responsive
   └─ js/
      ├─ data.js              catálogo, categorías y unidades de desarme (demo)
      ├─ layout.js            header, menú, footer, carrito (localStorage), tarjeta de producto
      └─ app.js               lógica de cada página
```

## Qué funciona de verdad

- Búsqueda y filtros del catálogo (texto, categoría, marca, año, condición, precio, stock, orden).
- Ficha de producto por URL (`producto.html?id=P-024`), galería, cantidad y relacionados.
- Carrito real en `localStorage`: agregar, cambiar cantidades, eliminar, elegir entrega, total.
- Explorador de desarme: selección de unidad, zonas interactivas y piezas por zona.
- Formularios de "Vendé tu vehículo" (validación + estado de envío simulado).

## Pendientes antes de publicar

1. **WhatsApp**: en `assets/js/data.js`, reemplazar `STZ_WHATSAPP = '595000000000'`
   por el número real (formato internacional, sin `+`).
2. **Fotos**: las 18 imágenes de `assets/img/fotos/` son de banco (Pexels,
   licencia libre, sin atribución) y corresponden al rubro de cada pieza, no a
   la unidad real de STZ. Para poner las propias basta con cambiar el nombre de
   archivo en `img` y `photos` dentro de `data.js` — no hay que tocar el HTML.
   El diseño promete «fotografía real de cada pieza», así que esto es lo
   primero a reemplazar antes de publicar.
3. **Datos**: `data.js` es una muestra. Conectar con el ERP (endpoint JSON con la
   misma forma de objeto) para stock y precios en vivo.
4. **Formularios**: hoy no envían a ningún lado. Falta el endpoint de destino
   para los leads de compra de vehículos y la confirmación de pedidos.
