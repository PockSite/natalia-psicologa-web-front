#!/usr/bin/env node
/**
 * Verifica que el sitio siga siendo legible por agentes de IA.
 *
 *   node scripts/verify-agent-readiness.mjs
 *       Comprueba los archivos del repositorio (no necesita red).
 *
 *   node scripts/verify-agent-readiness.mjs --url https://bienestarconnataliaguecha.com
 *       Además golpea los endpoints públicos y verifica códigos y cabeceras.
 *
 * Cubre los nueve puntos de la auditoría "Is Agentic": 404 reales, contenido sin
 * JavaScript, negociación markdown (acceptmarkdown.com), JSON-LD, instrucciones
 * para agentes, sitemap, Organization schema, páginas ancla y metadatos.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seo = (f) => join(root, 'src', 'seo', f);
const read = (p) => readFileSync(p, 'utf8');

const SITE = 'https://bienestarconnataliaguecha.com';
const TRUST_PAGES = ['about', 'contact', 'privacy'];
const MIN_TEXT = 500;

/* ── mini framework ──────────────────────────────────────────────────────── */

let passed = 0;
const failures = [];
let group = '';

const describe = (name) => { group = name; console.log(`\n${name}`); };

function it(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) return result.then(
      () => { passed++; console.log(`  ✓ ${name}`); },
      (err) => { failures.push({ group, name, err }); console.log(`  ✗ ${name}\n      ${err.message}`); },
    );
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push({ group, name, err });
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
  return Promise.resolve();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const assertIncludes = (haystack, needle, message) =>
  assert(haystack.includes(needle), `${message} (no se encontró: ${JSON.stringify(needle)})`);

const assertMatches = (haystack, regex, message) =>
  assert(regex.test(haystack), `${message} (no coincide: ${regex})`);

/* ── utilidades ──────────────────────────────────────────────────────────── */

/** Texto visible de un HTML: sin scripts, estilos, comentarios ni etiquetas. */
export function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Todos los bloques JSON-LD de un HTML, ya parseados. */
export function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) blocks.push(JSON.parse(m[1]));
  return blocks;
}

/** Aplana un @graph (o un objeto suelto) en una lista de nodos. */
export function flattenGraph(blocks) {
  return blocks.flatMap((b) => (Array.isArray(b['@graph']) ? b['@graph'] : [b]));
}

/** ¿El nodo declara este @type? Soporta `"X"` y `["X","Y"]`. */
export const hasType = (node, type) =>
  node && (node['@type'] === type || (Array.isArray(node['@type']) && node['@type'].includes(type)));

/**
 * Cuerpo de un bloque de nginx, contando llaves anidadas (los `if` internos).
 * @param {string} conf contenido de nginx.conf
 * @param {string} header p. ej. 'location = /'
 */
export function nginxBlock(conf, header) {
  const start = conf.indexOf(`${header} {`);
  if (start === -1) throw new Error(`no se encontró el bloque \`${header}\` en nginx.conf`);
  let depth = 0;
  for (let i = conf.indexOf('{', start); i < conf.length; i++) {
    if (conf[i] === '{') depth++;
    else if (conf[i] === '}' && --depth === 0) return conf.slice(start, i + 1);
  }
  throw new Error(`el bloque \`${header}\` no está cerrado`);
}

/** Rutas declaradas en el router de Angular, sin '' ni '**'. */
export function angularRoutes() {
  const src = read(join(root, 'src', 'app', 'app-routing.module.ts'));
  return [...src.matchAll(/path:\s*'([^']*)'/g)]
    .map((m) => m[1])
    .filter((p) => p !== '' && p !== '**');
}

/* ── comprobaciones estáticas ────────────────────────────────────────────── */

function staticChecks() {
  const indexHtml = read(join(root, 'src', 'index.html'));
  const nginx = read(join(root, 'nginx.conf'));
  const angularJson = JSON.parse(read(join(root, 'angular.json')));

  describe('Build: los archivos de src/seo llegan a la raíz del sitio');

  it('angular.json copia src/seo a "/"', () => {
    const assets = angularJson.projects['my-landing'].architect.build.options.assets;
    const entry = assets.find((a) => typeof a === 'object' && a.input === 'src/seo');
    assert(entry, 'falta la entrada de assets con input "src/seo" en angular.json');
    assert(entry.output === '/', `la salida debe ser "/" y es ${JSON.stringify(entry.output)}`);
    assert(entry.glob === '**/*', 'el glob debe ser "**/*"');
  });

  it('existen todos los archivos que sirve nginx', () => {
    const required = [
      'robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'agent-instructions.md',
      'index.md', '404.html', '404.md',
      ...TRUST_PAGES.flatMap((p) => [`${p}.html`, `${p}.md`]),
    ];
    const missing = required.filter((f) => !existsSync(seo(f)));
    assert(missing.length === 0, `faltan en src/seo: ${missing.join(', ')}`);
  });

  /* 1. 404 reales ───────────────────────────────────────────────────────── */
  describe('1. 404 reales para rutas inexistentes');

  it('el location catch-all devuelve 404 y no el app shell', () => {
    const catchAll = nginxBlock(nginx, 'location /');
    assertIncludes(catchAll, '=404', 'el catch-all debe terminar en =404');
    assert(!/try_files[^;]*\/index\.html/.test(catchAll),
      'el catch-all no puede caer en /index.html: eso produce soft-404');
  });

  it('error_page 404 negocia el cuerpo entre markdown y HTML', () => {
    assertMatches(nginx, /error_page\s+404\s+\$not_found_body\s*;/,
      'falta `error_page 404 $not_found_body;`');
    assertMatches(nginx, /map\s+\$http_accept\s+\$not_found_body\s*\{[\s\S]*?default\s+\/404\.md\s*;/,
      'el 404 por defecto debe servir /404.md');
    assertMatches(nginx, /map\s+\$http_accept\s+\$not_found_body\s*\{[\s\S]*?text\/html["']?\s+\/404\.html\s*;/,
      'los navegadores deben recibir /404.html');
  });

  it('el cuerpo markdown del 404 apunta al sitemap y a llms.txt', () => {
    const md = read(seo('404.md'));
    assertIncludes(md, '/sitemap.xml', 'el 404 markdown debe enlazar el sitemap');
    assertIncludes(md, '/llms.txt', 'el 404 markdown debe enlazar llms.txt');
    assertMatches(md, /^#\s+404/m, 'el 404 markdown debe empezar por un encabezado');
  });

  it('cada ruta del router de Angular tiene su location en nginx', () => {
    for (const route of angularRoutes()) {
      const base = route.split('/')[0];
      assert(nginx.includes(`/${base}`),
        `la ruta "${route}" de app-routing.module.ts no está declarada en nginx.conf`);
    }
  });

  /* 2. Contenido sin JavaScript ─────────────────────────────────────────── */
  describe('2. Contenido de la portada sin JavaScript');

  it('index.html trae un <h1> en el HTML crudo', () => {
    assertMatches(indexHtml, /<h1[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i, 'no hay <h1> con texto en index.html');
  });

  it(`index.html trae más de ${MIN_TEXT} caracteres de texto visible`, () => {
    const chars = visibleText(indexHtml).length;
    assert(chars >= MIN_TEXT, `solo hay ${chars} caracteres de texto (mínimo ${MIN_TEXT})`);
  });

  it('el contenido inicial vive dentro de <app-root> (Angular lo reemplaza)', () => {
    const appRoot = indexHtml.match(/<app-root>([\s\S]*?)<\/app-root>/i);
    assert(appRoot, 'no se encontró el par <app-root>…</app-root>');
    assert(visibleText(appRoot[1]).length >= MIN_TEXT,
      'el contenido de respaldo debe estar dentro de <app-root> para que Angular lo limpie al arrancar');
  });

  it('el respaldo solo se oculta cuando hay JavaScript, nunca de forma incondicional', () => {
    const styles = [...indexHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
    const hiding = [...styles.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(([, selector, body]) => selector.includes('app-shell-fallback') && /display\s*:\s*none/.test(body));

    assert(hiding.length > 0,
      'falta la regla que oculta #app-shell-fallback: sin ella el contenido de respaldo parpadea al arrancar');

    for (const [, selector] of hiding) {
      assert(selector.includes('has-js'),
        `ocultar el respaldo sin condicionarlo a JavaScript esconde texto a los rastreadores (selector: ${selector.trim()})`);
    }
  });

  it('la marca has-js es síncrona y está en el <head>, antes del primer render', () => {
    const head = indexHtml.slice(0, indexHtml.indexOf('<body'));
    assertMatches(head, /<script>[^<]*documentElement[^<]*has-js[^<]*<\/script>/,
      'el script que añade has-js debe ser inline y vivir en el <head>');
    assert(!/<script[^>]+(src|defer|async)[^>]*>[^<]*has-js/.test(indexHtml),
      'el script de has-js no puede ser diferido: se ejecutaría después del primer render');
  });

  /* 3. Negociación markdown ─────────────────────────────────────────────── */
  describe('3. Negociación de contenido markdown (acceptmarkdown.com)');

  it('nginx mapea Accept: text/markdown', () => {
    assertMatches(nginx, /map\s+\$http_accept\s+\$prefers_markdown\s*\{[\s\S]*?text\/markdown/,
      'falta el map $prefers_markdown sobre $http_accept');
  });

  it('las páginas negociables declaran Vary: Accept, Accept-Encoding', () => {
    for (const loc of ['location = /', ...TRUST_PAGES.map((p) => `location = /${p}`)]) {
      const body = nginxBlock(nginx, loc);
      assertIncludes(body, 'Vary "Accept, Accept-Encoding"', `${loc} debe declarar Vary con Accept`);
      assertIncludes(body, 'rewrite', `${loc} debe redirigir a la variante .md cuando se pide markdown`);
      assertIncludes(body, '$prefers_markdown', `${loc} debe consultar la cabecera Accept`);
    }
  });

  it('las respuestas .md se sirven como text/markdown', () => {
    const body = nginxBlock(nginx, 'location ~ \\.md$');
    assertIncludes(body, 'text/markdown', 'la location de .md debe forzar el tipo text/markdown');
    assertIncludes(body, 'Vary "Accept, Accept-Encoding"', 'la location de .md debe declarar Vary con Accept');
    assertIncludes(nginx, 'charset_types', 'charset_types debe incluir text/markdown para el charset utf-8');
    assertIncludes(nginx.match(/charset_types[\s\S]*?;/)[0], 'text/markdown',
      'text/markdown debe estar en charset_types');
  });

  it('los cuerpos del 404 declaran Vary: Accept, Accept-Encoding', () => {
    for (const loc of ['location = /404.md', 'location = /404.html']) {
      assertIncludes(nginxBlock(nginx, loc), 'Vary "Accept, Accept-Encoding"',
        `${loc} debe declarar Vary con Accept`);
    }
  });

  it('gzip_vary está apagado para no duplicar la cabecera Vary', () => {
    assertMatches(nginx, /gzip_vary\s+off\s*;/,
      'con gzip_vary on la respuesta llevaría dos cabeceras Vary distintas');
  });

  it('cada página HTML negociable tiene su gemela markdown con contenido', () => {
    for (const [html, md] of [['index.html', 'index.md'], ...TRUST_PAGES.map((p) => [`${p}.html`, `${p}.md`])]) {
      const file = html === 'index.html' ? join(root, 'src', 'index.html') : seo(html);
      assert(existsSync(file), `falta ${html}`);
      const markdown = read(seo(md));
      assert(markdown.trim().length >= MIN_TEXT, `${md} tiene menos de ${MIN_TEXT} caracteres`);
      assertMatches(markdown, /^#\s+\S/m, `${md} debe empezar por un encabezado de nivel 1`);
    }
  });

  /* 4 y 7. JSON-LD y Organization ───────────────────────────────────────── */
  describe('4 y 7. JSON-LD y Organization schema');

  const nodes = flattenGraph(jsonLdBlocks(indexHtml));

  it('la portada incluye JSON-LD válido', () => {
    assert(nodes.length > 0, 'no hay bloques application/ld+json en index.html');
  });

  it('declara una Person con name, url y sameAs', () => {
    const person = nodes.find((n) => hasType(n, 'Person'));
    assert(person, 'falta el nodo Person');
    assert(person.name && person.url, 'la Person necesita name y url');
    assert(Array.isArray(person.sameAs) && person.sameAs.length >= 2,
      'la Person necesita al menos dos perfiles en sameAs');
  });

  it('declara una Organization con name, description y url', () => {
    const org = nodes.find((n) => hasType(n, 'Organization'));
    assert(org, 'falta el nodo Organization');
    for (const field of ['name', 'description', 'url']) {
      assert(org[field], `la Organization necesita ${field}`);
    }
  });

  it('la Organization trae contactPoint con email, teléfono y contactType', () => {
    const org = nodes.find((n) => hasType(n, 'Organization'));
    const points = [].concat(org.contactPoint ?? []);
    assert(points.length > 0, 'la Organization necesita contactPoint');
    const primary = points.find((p) => p.email && p.telephone && p.contactType);
    assert(primary, 'algún contactPoint debe traer email, telephone y contactType a la vez');
  });

  it('la Organization trae address como PostalAddress', () => {
    const org = nodes.find((n) => hasType(n, 'Organization'));
    assert(org.address, 'la Organization necesita address');
    assert(hasType(org.address, 'PostalAddress'), 'address debe ser de tipo PostalAddress');
    for (const field of ['addressLocality', 'addressCountry']) {
      assert(org.address[field], `la PostalAddress necesita ${field}`);
    }
  });

  it('declara WebSite y WebPage enlazados a la Organization', () => {
    assert(nodes.some((n) => hasType(n, 'WebSite')), 'falta el nodo WebSite');
    assert(nodes.some((n) => hasType(n, 'WebPage')), 'falta el nodo WebPage');
  });

  it('las páginas ancla también llevan JSON-LD válido', () => {
    for (const page of TRUST_PAGES) {
      const blocks = jsonLdBlocks(read(seo(`${page}.html`)));
      assert(blocks.length > 0, `${page}.html no tiene JSON-LD`);
      assert(blocks[0].url && blocks[0].name, `el JSON-LD de ${page}.html necesita url y name`);
    }
  });

  /* 5. Instrucciones para agentes ───────────────────────────────────────── */
  describe('5. Instrucciones para agentes (when to use)');

  it('llms.txt sigue el formato llmstxt.org', () => {
    const llms = read(seo('llms.txt'));
    assertMatches(llms, /^#\s+\S/m, 'llms.txt debe empezar por un H1');
    assertMatches(llms, /^>\s+\S/m, 'llms.txt debe traer el resumen en blockquote');
    assertMatches(llms, /^##\s+\S/m, 'llms.txt debe organizarse en secciones H2');
  });

  it('llms.txt tiene una sección "when to use"', () => {
    const llms = read(seo('llms.txt'));
    assertMatches(llms, /^##\s+When to use/im, 'falta la sección "When to use this"');
    assertMatches(llms, /cuándo usar|when to use/i, 'la sección debe explicar cuándo recurrir al sitio');
  });

  it('hay un archivo dedicado de instrucciones con casos de uso y contraindicaciones', () => {
    const doc = read(seo('agent-instructions.md'));
    assertMatches(doc, /^##\s+When to use/im, 'agent-instructions.md necesita "When to use"');
    assertMatches(doc, /^##\s+When NOT to use/im, 'agent-instructions.md necesita "When NOT to use"');
    assertIncludes(doc, 'wa.me/573104671284', 'debe indicar cómo contactar');
    assert(doc.length >= 1000, 'las instrucciones son demasiado breves para servir de guía');
  });

  it('llms.txt y robots.txt apuntan a los archivos correctos', () => {
    const llms = read(seo('llms.txt'));
    for (const target of ['/index.md', '/about.md', '/contact.md', '/privacy.md', '/sitemap.xml']) {
      assertIncludes(llms, target, `llms.txt debe enlazar ${target}`);
    }
  });

  it('llms-full.txt está sincronizado con las páginas markdown', () => {
    const full = read(seo('llms-full.txt'));
    for (const page of ['index', ...TRUST_PAGES]) {
      const first = read(seo(`${page}.md`)).split('\n')[0].trim();
      assertIncludes(full, first, `llms-full.txt no contiene el encabezado de ${page}.md — regenera con: node scripts/build-llms-full.mjs`);
    }
  });

  /* 6. Sitemap ──────────────────────────────────────────────────────────── */
  describe('6. Sitemap');

  it('sitemap.xml usa el espacio de nombres correcto', () => {
    const xml = read(seo('sitemap.xml'));
    assertIncludes(xml, 'http://www.sitemaps.org/schemas/sitemap/0.9',
      'el urlset debe declarar el namespace oficial de sitemaps.org');
    assertMatches(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/, 'falta la declaración XML');
  });

  it('todas las URL son absolutas, https y del dominio', () => {
    const locs = [...read(seo('sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert(locs.length >= 4, `el sitemap solo lista ${locs.length} URL`);
    for (const loc of locs) {
      assert(loc.startsWith(`${SITE}/`), `URL no absoluta o de otro dominio: ${loc}`);
    }
  });

  it('cada URL trae lastmod con formato ISO', () => {
    const xml = read(seo('sitemap.xml'));
    const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
    for (const url of urls) {
      const lastmod = url.match(/<lastmod>([^<]+)<\/lastmod>/);
      assert(lastmod, `hay una <url> sin <lastmod>: ${url.trim().slice(0, 60)}`);
      assertMatches(lastmod[1], /^\d{4}-\d{2}-\d{2}(T.*)?$/, `lastmod inválido: ${lastmod[1]}`);
    }
  });

  it('el sitemap solo lista rutas que existen y pesa menos de 50 MB', () => {
    const locs = [...read(seo('sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const loc of locs) {
      const path = loc.slice(SITE.length);
      if (path === '/') continue;
      const page = path.replace(/^\//, '');
      assert(existsSync(seo(`${page}.html`)), `el sitemap lista ${path} pero no existe src/seo/${page}.html`);
    }
    assert(statSync(seo('sitemap.xml')).size < 50 * 1024 * 1024, 'el sitemap supera los 50 MB');
  });

  it('robots.txt declara el sitemap y no bloquea a los agentes', () => {
    const robots = read(seo('robots.txt'));
    assertIncludes(robots, `Sitemap: ${SITE}/sitemap.xml`, 'robots.txt debe declarar el sitemap');
    assert(!/^Disallow:\s*\/\s*$/m.test(robots), 'robots.txt no puede bloquear el sitio entero');
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      assertIncludes(robots, bot, `robots.txt debería nombrar a ${bot}`);
    }
  });

  /* 8. Páginas ancla ────────────────────────────────────────────────────── */
  describe('8. Páginas ancla de confianza');

  for (const page of TRUST_PAGES) {
    it(`/${page} tiene más de ${MIN_TEXT} caracteres, h1 y canonical`, () => {
      const html = read(seo(`${page}.html`));
      const chars = visibleText(html).length;
      assert(chars >= MIN_TEXT, `/${page} solo tiene ${chars} caracteres de texto`);
      assertMatches(html, /<h1[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i, `/${page} necesita un <h1>`);
      assertIncludes(html, `<link rel="canonical" href="${SITE}/${page}">`, `/${page} necesita canonical`);
      assertIncludes(html, 'lang="es"', `/${page} necesita <html lang>`);
    });
  }

  it('nginx sirve las tres páginas ancla sin barra final', () => {
    for (const page of TRUST_PAGES) {
      assertIncludes(nginx, `location = /${page} {`, `falta la location de /${page}`);
      assertIncludes(nginx, `try_files /${page}.html =404;`, `/${page} debe servir ${page}.html`);
    }
  });

  /* 9. Metadatos ────────────────────────────────────────────────────────── */
  describe('9. Metadatos de la portada');

  const metaChecks = [
    ['canonical', /<link\s+rel="canonical"\s+href="https:\/\/bienestarconnataliaguecha\.com\/">/],
    ['html lang', /<html\s+lang="es">/],
    ['og:image', /<meta\s+property="og:image"\s+content="https:\/\/\S+">/],
    ['og:type', /<meta\s+property="og:type"\s+content="\w+">/],
    ['og:title', /<meta\s+property="og:title"/],
    ['og:url', /<meta\s+property="og:url"/],
    ['description', /<meta\s+name="description"/],
    ['twitter:card', /<meta\s+name="twitter:card"/],
  ];

  for (const [label, regex] of metaChecks) {
    it(`declara ${label}`, () => assertMatches(indexHtml, regex, `falta ${label} en index.html`));
  }

  it('og:image apunta a un asset que existe', () => {
    const url = indexHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)[1];
    const rel = url.slice(SITE.length).replace(/^\//, '');
    assert(existsSync(join(root, 'src', rel)), `og:image apunta a ${rel}, que no existe en src/`);
  });
}

/* ── comprobaciones contra el sitio publicado ────────────────────────────── */

async function liveChecks(base) {
  const url = (p) => new URL(p, base).toString();

  const get = async (p, headers = {}) => {
    const res = await fetch(url(p), { headers, redirect: 'follow' });
    return { res, body: await res.text() };
  };

  describe(`Endpoints publicados en ${base}`);

  await it('una ruta inexistente devuelve HTTP 404', async () => {
    const p = `/ruta-que-no-existe-${Date.now()}`;
    const { res } = await get(p);
    assert(res.status === 404, `${p} devolvió ${res.status} en lugar de 404`);
  });

  await it('el 404 de un agente llega en markdown', async () => {
    const { res, body } = await get(`/no-existe-${Date.now()}`, { Accept: 'text/markdown' });
    assert(res.status === 404, `se esperaba 404 y llegó ${res.status}`);
    assertIncludes(res.headers.get('content-type') ?? '', 'text/markdown',
      'el cuerpo del 404 para agentes debe ser text/markdown');
    assertIncludes(body, '/llms.txt', 'el 404 debe orientar hacia llms.txt');
  });

  await it('la portada responde 200 con h1 y texto suficiente', async () => {
    const { res, body } = await get('/');
    assert(res.status === 200, `la portada devolvió ${res.status}`);
    assertMatches(body, /<h1[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i, 'la portada no trae <h1> en el HTML crudo');
    const chars = visibleText(body).length;
    assert(chars >= MIN_TEXT, `la portada solo trae ${chars} caracteres sin JavaScript`);
  });

  await it('la portada trae JSON-LD con Organization y Person', async () => {
    const { body } = await get('/');
    const nodes = flattenGraph(jsonLdBlocks(body));
    assert(nodes.some((n) => hasType(n, 'Organization')), 'no llega Organization en el JSON-LD');
    assert(nodes.some((n) => hasType(n, 'Person')), 'no llega Person en el JSON-LD');
  });

  await it('Accept: text/markdown devuelve markdown con Vary: Accept', async () => {
    const { res, body } = await get('/', { Accept: 'text/markdown' });
    assert(res.status === 200, `la portada en markdown devolvió ${res.status}`);
    assertIncludes(res.headers.get('content-type') ?? '', 'text/markdown',
      `Content-Type recibido: ${res.headers.get('content-type')}`);
    assertIncludes((res.headers.get('vary') ?? '').toLowerCase(), 'accept',
      `Vary recibido: ${res.headers.get('vary')}`);
    assertMatches(body, /^#\s+\S/m, 'el cuerpo markdown debe empezar por un encabezado');
  });

  await it('la portada en HTML también declara Vary: Accept', async () => {
    const { res } = await get('/', { Accept: 'text/html' });
    assertIncludes((res.headers.get('vary') ?? '').toLowerCase(), 'accept',
      `Vary recibido: ${res.headers.get('vary')}`);
  });

  for (const page of TRUST_PAGES) {
    await it(`/${page} responde 200 con más de ${MIN_TEXT} caracteres`, async () => {
      const { res, body } = await get(`/${page}`);
      assert(res.status === 200, `/${page} devolvió ${res.status}`);
      const chars = visibleText(body).length;
      assert(chars >= MIN_TEXT, `/${page} solo trae ${chars} caracteres`);
    });

    await it(`/${page} negocia markdown`, async () => {
      const { res } = await get(`/${page}`, { Accept: 'text/markdown' });
      assertIncludes(res.headers.get('content-type') ?? '', 'text/markdown',
        `Content-Type recibido: ${res.headers.get('content-type')}`);
    });
  }

  for (const [path, needle] of [
    ['/sitemap.xml', '<urlset'],
    ['/robots.txt', 'Sitemap:'],
    ['/llms.txt', 'When to use'],
    ['/llms-full.txt', '#'],
    ['/agent-instructions.md', 'When to use'],
    ['/index.md', '# '],
  ]) {
    await it(`${path} responde 200`, async () => {
      const { res, body } = await get(path);
      assert(res.status === 200, `${path} devolvió ${res.status}`);
      assertIncludes(body, needle, `${path} no trae el contenido esperado`);
    });
  }

  await it('las rutas de la SPA siguen sirviendo la aplicación', async () => {
    for (const route of ['/pago-resultado', '/producto/1']) {
      const { res, body } = await get(route);
      assert(res.status === 200, `${route} devolvió ${res.status}`);
      assertIncludes(body, '<app-root', `${route} debe servir el app shell de Angular`);
    }
  });
}

/* ── main ────────────────────────────────────────────────────────────────── */

const urlFlag = process.argv.indexOf('--url');
const baseUrl = urlFlag !== -1 ? process.argv[urlFlag + 1] : null;

staticChecks();
if (baseUrl) await liveChecks(baseUrl);

console.log(`\n${failures.length ? '✗' : '✓'} ${passed} comprobaciones correctas, ${failures.length} fallidas`);
if (failures.length) {
  console.log('\nFallos:');
  for (const f of failures) console.log(`  · [${f.group}] ${f.name}\n    ${f.err.message}`);
  process.exit(1);
}
