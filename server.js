/**
 * server.js
 * Минимальный статический сервер для production (Railway).
 * Без зависимостей. Слушает 0.0.0.0:$PORT, отдаёт dist/, SPA-фолбэк на index.html.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
const DIST = join(process.cwd(), 'dist');
const INDEX = join(DIST, 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const candidate = normalize(join(DIST, urlPath));
    const hasExt = extname(urlPath) !== '';

    // Безопасность от path traversal + SPA-фолбэк на index.html
    const filePath =
      hasExt && candidate.startsWith(DIST) && existsSync(candidate)
        ? candidate
        : INDEX;

    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': filePath === INDEX ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
