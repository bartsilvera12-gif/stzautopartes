<?php
/**
 * Vista previa (Open Graph) de la ficha de producto.
 *
 * WhatsApp, Facebook y Telegram NO ejecutan JavaScript: piden la URL, leen el
 * HTML crudo y buscan las etiquetas <meta property="og:*">. Como producto.html
 * arma la ficha desde el navegador (boot.js → Supabase), el crawler solo veía
 * una página vacía y por eso el link salía sin foto ni título.
 *
 * Este archivo NO duplica la página: lee producto.html, le inyecta las meta
 * etiquetas del producto pedido y lo devuelve tal cual. El .htaccess manda
 * /producto.html acá, así que la URL que se comparte no cambia.
 *
 * Si algo falla (sin PHP, sin red, id inválido) se devuelve el HTML original:
 * la página sigue funcionando, solo se pierde la miniatura.
 */

require __DIR__ . '/og-config.php';

$html = @file_get_contents(__DIR__ . '/producto.html');
if ($html === false) {
    http_response_code(500);
    exit('No se pudo cargar la ficha.');
}

/** GET contra PostgREST. cURL primero; file_get_contents si no está disponible. */
function stz_fetch_json($url, $headers)
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body === false || $code < 200 || $code >= 300) return null;
        return json_decode($body, true);
    }

    $ctx = stream_context_create([
        'http' => ['method' => 'GET', 'header' => implode("\r\n", $headers), 'timeout' => 6],
    ]);
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false) return null;
    return json_decode($body, true);
}

$producto = null;
$id = isset($_GET['id']) ? trim($_GET['id']) : '';

// Solo UUID: evita mandar basura al backend y cachear páginas inútiles.
if (preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $id)) {
    $url = STZ_SUPABASE_URL . '/rest/v1/productos_publicos'
         . '?id=eq.' . rawurlencode($id)
         . '&select=nombre,sku,descripcion,precio_venta,imagen_url,marca_vehiculo,modelo_vehiculo,anio_desde,anio_hasta,condicion'
         . '&limit=1';

    $data = stz_fetch_json($url, [
        'apikey: ' . STZ_SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . STZ_SUPABASE_ANON_KEY,
        'Accept-Profile: ' . STZ_SUPABASE_SCHEMA,
        'Accept: application/json',
    ]);

    if (is_array($data) && isset($data[0])) $producto = $data[0];
}

/** Escapa para usar dentro de un atributo HTML. */
function stz_attr($v)
{
    return htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function stz_gs($n)
{
    if ($n === null || $n === '') return '';
    return '₲ ' . number_format((float) $n, 0, ',', '.');
}

if ($producto) {
    $titulo = $producto['nombre'] ?? 'Repuesto';
    if (!empty($producto['sku'])) $titulo .= ' · ' . $producto['sku'];

    // Descripción: compatibilidad + precio, que es lo que se mira en el chat.
    $partes = [];
    $vehiculo = trim(($producto['marca_vehiculo'] ?? '') . ' ' . ($producto['modelo_vehiculo'] ?? ''));
    if ($vehiculo !== '') {
        $anios = '';
        if (!empty($producto['anio_desde']) && !empty($producto['anio_hasta'])) {
            $anios = $producto['anio_desde'] == $producto['anio_hasta']
                ? ' ' . $producto['anio_desde']
                : ' ' . $producto['anio_desde'] . '–' . $producto['anio_hasta'];
        }
        $partes[] = $vehiculo . $anios;
    }
    $condiciones = ['nuevo' => 'Nuevo', 'usado' => 'Usado original', 'recuperado' => 'Recuperado verificado'];
    if (!empty($producto['condicion']) && isset($condiciones[$producto['condicion']])) {
        $partes[] = $condiciones[$producto['condicion']];
    }
    $precio = stz_gs($producto['precio_venta'] ?? null);
    if ($precio !== '') $partes[] = $precio;

    $descripcion = implode(' · ', $partes);
    if ($descripcion === '') {
        $descripcion = trim((string) ($producto['descripcion'] ?? 'Repuesto disponible en STZ AutoPartes.'));
    }
    // mbstring no siempre está compilado; sin él se recorta por bytes.
    if (function_exists('mb_strlen')) {
        if (mb_strlen($descripcion, 'UTF-8') > 200) {
            $descripcion = mb_substr($descripcion, 0, 197, 'UTF-8') . '…';
        }
    } elseif (strlen($descripcion) > 200) {
        $descripcion = substr($descripcion, 0, 197) . '…';
    }

    $imagen = $producto['imagen_url'] ?? '';
    if ($imagen === '') $imagen = STZ_SITE_URL . '/assets/img/logo-stz.png';

    $canonica = STZ_SITE_URL . '/producto.html?id=' . rawurlencode($id);

    $meta  = "\n<!-- Open Graph generado en el servidor para la vista previa en WhatsApp -->\n";
    $meta .= '<meta property="og:type" content="product">' . "\n";
    $meta .= '<meta property="og:site_name" content="STZ AutoPartes">' . "\n";
    $meta .= '<meta property="og:title" content="' . stz_attr($titulo) . '">' . "\n";
    $meta .= '<meta property="og:description" content="' . stz_attr($descripcion) . '">' . "\n";
    $meta .= '<meta property="og:image" content="' . stz_attr($imagen) . '">' . "\n";
    $meta .= '<meta property="og:image:alt" content="' . stz_attr($producto['nombre'] ?? '') . '">' . "\n";
    $meta .= '<meta property="og:url" content="' . stz_attr($canonica) . '">' . "\n";
    $meta .= '<meta name="twitter:card" content="summary_large_image">' . "\n";
    $meta .= '<meta name="twitter:title" content="' . stz_attr($titulo) . '">' . "\n";
    $meta .= '<meta name="twitter:description" content="' . stz_attr($descripcion) . '">' . "\n";
    $meta .= '<meta name="twitter:image" content="' . stz_attr($imagen) . '">' . "\n";

    // La <meta name="description"> estática de producto.html se reemplaza por la
    // del producto; el resto del <head> queda intacto.
    $html = preg_replace('/<meta\s+name="description"[^>]*>/i', '', $html, 1);

    $pos = stripos($html, '</head>');
    if ($pos !== false) {
        $meta .= '<meta name="description" content="' . stz_attr($descripcion) . '">' . "\n";
        $html = substr($html, 0, $pos) . $meta . substr($html, $pos);
    }
}

header('Content-Type: text/html; charset=UTF-8');
/**
 * Sin caché a propósito.
 *
 * Delante del sitio hay un CDN (`Server: hcdn`). Con una respuesta cacheable
 * llegó a quedar guardado el ARCHIVO PHP EN CRUDO en algunos nodos —los
 * pedidos alternaban entre el HTML correcto y el código fuente—, así que el
 * crawler recibía basura y no mostraba miniatura.
 *
 * A esta ruta solo entran bots de vista previa: no cachearla no cuesta nada.
 */
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
echo $html;
