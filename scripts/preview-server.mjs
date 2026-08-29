#!/usr/bin/env node
/**
 * Sirve dist/my-landing aplicando las mismas reglas que nginx.conf.
 *
 *   node scripts/preview-server.mjs [--port 4300] [--root dist/my-landing]
 *
 * Para qué sirve: probar en local (y en CI, sin Docker) el comportamiento que
 * pide la auditoría —404 reales, negociación markdown, cabeceras Vary, páginas
 * ancla— contra los archivos que realmente produce `ng build`.
 *
 * Ojo: es un espejo de nginx.conf, no nginx. Las comprobaciones estáticas de
 * scripts/verify-agent-readiness.mjs son las que garantizan que nginx.conf
 * declara estas mismas reglas; para validar la sintaxis real de nginx usa
 * `npm run test:nginx` (necesita Docker).
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, '..');

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : fallback;
};

const PORT = Number(arg('--port', 4300));
const ROOT = join(projectRoot, arg('--root', join('dist', 'my-landing')));

const TRUST_PAGES = ['about', 'contact', 'privacy'];

const SPANISH_ALIASES = {
  '/sobre-mi': '/about',
  '/contacto': '/contact',
  '/privacidad': '/privacy',
};

const MD_CANONICAL = {
  '/index.md': 'https://bienestarconnataliaguecha.com/',
  '/about.md': 'https://bienestarconnataliaguecha.com/about',
  '/contact.md': 'https://bienestarconnataliaguecha.com/contact',
  '/privacy.md': 'https://bienestarconnataliaguecha.com/privacy',
};

/** Tipos MIME equivalentes a los de nginx (mime.types + el bloque de markdown). */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'text/xml; charset=utf-8',
  '.json': 'application/json',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

const VARY_NEGOTIATED = 'Accept, Accept-Encoding';
const VARY_PLAIN = 'Accept-Encoding';

const wantsMarkdown = (req) => /text\/markdown/i.test(req.headers.accept ?? '');
const wantsHtml = (req) => /text\/html/i.test(req.headers.accept ?? '');

const contentType = (file) => TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';

/** Ruta absoluta segura dentro de ROOT, o null si se sale del directorio. */
function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  const full = join(ROOT, clean);
  return full.startsWith(ROOT) ? full : null;
}

const isFile = (p) => p !== null && existsSync(p) && statSync(p).isFile();

function send(res, status, file, headers = {}) {
  const body = readFileSync(file);
  res.writeHead(status, { 'Content-Type': contentType(file), 'Content-Length': body.length, ...headers });
  res.end(body);
}

/** error_page 404 $not_found_body — markdown por defecto, HTML para navegadores. */
function notFound(req, res) {
  const file = join(ROOT, wantsHtml(req) ? '404.html' : '404.md');
  const headers = { Vary: VARY_NEGOTIATED, 'X-Robots-Tag': 'noindex' };

  if (!isFile(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
    res.end('404\n');
    return;
  }
  send(res, 404, file, headers);
}

/** Página negociable: HTML por defecto, markdown si el cliente lo pide. */
function serveNegotiated(req, res, htmlFile, mdName) {
  if (wantsMarkdown(req)) {
    const md = join(ROOT, mdName);
    if (!isFile(md)) return notFound(req, res);

    const headers = { Vary: VARY_NEGOTIATED };
    const canonical = MD_CANONICAL[`/${mdName}`];
    if (canonical) headers.Link = `<${canonical}>; rel="canonical"`;

    return send(res, 200, md, headers);
  }

  const html = join(ROOT, htmlFile);
  if (!isFile(html)) return notFound(req, res);
  return send(res, 200, html, {
    Vary: VARY_NEGOTIATED,
    Link: `</${mdName}>; rel="alternate"; type="text/markdown"`,
  });
}

const redirect = (res, location) => {
  res.writeHead(301, { Location: location });
  res.end();
};

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  // Los cuerpos de error son `internal` en nginx: no se sirven directamente.
  if (pathname === '/404.md' || pathname === '/404.html') return notFound(req, res);

  if (pathname === '/') return serveNegotiated(req, res, 'index.html', 'index.md');

  for (const page of TRUST_PAGES) {
    if (pathname === `/${page}`) return serveNegotiated(req, res, `${page}.html`, `${page}.md`);
    if (pathname === `/${page}/`) return redirect(res, `/${page}`);
  }

  if (SPANISH_ALIASES[pathname]) return redirect(res, SPANISH_ALIASES[pathname]);

  if (pathname === '/pago-resultado') {
    return send(res, 200, join(ROOT, 'index.html'), {
      Vary: VARY_PLAIN,
      'X-Robots-Tag': 'noindex, nofollow',
    });
  }

  if (/^\/producto\/[^/]+\/?$/.test(pathname)) {
    return send(res, 200, join(ROOT, 'index.html'), { Vary: VARY_PLAIN });
  }

  if (pathname.endsWith('.md')) {
    const file = resolve(pathname);
    if (!isFile(file)) return notFound(req, res);
    const headers = { Vary: VARY_NEGOTIATED };
    if (MD_CANONICAL[pathname]) headers.Link = `<${MD_CANONICAL[pathname]}>; rel="canonical"`;
    return send(res, 200, file, headers);
  }

  if (['/llms.txt', '/llms-full.txt', '/robots.txt', '/sitemap.xml'].includes(pathname)) {
    const file = resolve(pathname);
    if (!isFile(file)) return notFound(req, res);
    return send(res, 200, file, { Vary: VARY_PLAIN, 'Cache-Control': 'public, max-age=3600' });
  }

  // Catch-all: archivo real (o directorio con index.html) o 404 real.
  const file = resolve(pathname);
  if (isFile(file)) return send(res, 200, file, { Vary: VARY_PLAIN });

  const indexed = file && join(file, 'index.html');
  if (isFile(indexed)) return send(res, 200, indexed, { Vary: VARY_PLAIN });

  return notFound(req, res);
});

if (!existsSync(ROOT)) {
  console.error(`✗ No existe ${ROOT}. Ejecuta primero: npm run build -- --configuration development`);
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`Sirviendo ${ROOT} en http://localhost:${PORT} con las reglas de nginx.conf`);
});
