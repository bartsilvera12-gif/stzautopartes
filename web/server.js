/* Servidor estático mínimo para ver el sitio en local.
   Uso:  node server.js     →  http://localhost:5173  */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5173;

const TYPES = {
  '.html':'text/html; charset=utf-8',
  '.css' :'text/css; charset=utf-8',
  '.js'  :'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png' :'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.svg' :'image/svg+xml', '.webp':'image/webp', '.ico':'image/x-icon',
  '.woff2':'font/woff2', '.pdf':'application/pdf'
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const file = path.join(ROOT, path.normalize(rel).replace(/^[\\/]+/, ''));

  if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'}).end('<h1>404</h1>'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      /* servidor de desarrollo: nunca cachear, o los cambios de CSS/JS no se ven */
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(buf);
  });
}).listen(PORT, () => console.log('STZ AutoPartes → http://localhost:' + PORT));
