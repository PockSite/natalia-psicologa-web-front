/**
 * Genera src/seo/llms-full.txt concatenando las variantes markdown del sitio.
 *
 * Se ejecuta automáticamente en `npm run build` (hook `prebuild`) para que el
 * archivo nunca quede desincronizado de las páginas que resume. El resultado se
 * versiona en el repositorio: así el asset existe aunque el build se lance sin
 * pasar por npm.
 *
 * Uso:
 *   node scripts/build-llms-full.mjs          escribe el archivo
 *   node scripts/build-llms-full.mjs --check  falla si el archivo está desfasado
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seoDir = join(root, 'src', 'seo');

export const SITE_URL = 'https://bienestarconnataliaguecha.com';
export const OUTPUT_FILE = join(seoDir, 'llms-full.txt');

/** Orden de las páginas dentro del archivo concatenado. */
export const SOURCES = [
  { file: 'index.md', path: '/' },
  { file: 'about.md', path: '/about' },
  { file: 'contact.md', path: '/contact' },
  { file: 'privacy.md', path: '/privacy' },
];

/**
 * Construye el contenido completo de llms-full.txt.
 * @returns {string}
 */
export function buildLlmsFull() {
  const header = [
    '# Bienestar con Natalia Güechá — contenido completo',
    '',
    '> Todas las páginas de bienestarconnataliaguecha.com en un solo archivo markdown,',
    '> pensado para que un modelo o un agente lo lea de una vez. El índice corto está',
    `> en ${SITE_URL}/llms.txt y las instrucciones de uso en ${SITE_URL}/agent-instructions.md.`,
    '',
    'Generado automáticamente por scripts/build-llms-full.mjs. No editar a mano.',
    '',
  ].join('\n');

  const sections = SOURCES.map(({ file, path }) => {
    const source = join(seoDir, file);
    if (!existsSync(source)) {
      throw new Error(`Falta la fuente ${file} en src/seo/`);
    }
    const body = readFileSync(source, 'utf8').trim();
    return [
      '---',
      '',
      `<!-- Fuente: ${SITE_URL}${path} (${SITE_URL}/${file}) -->`,
      '',
      body,
      '',
    ].join('\n');
  });

  return `${header}\n${sections.join('\n')}`;
}

/** true cuando el archivo en disco coincide con lo que generaría el script. */
export function isLlmsFullUpToDate() {
  const current = existsSync(OUTPUT_FILE) ? readFileSync(OUTPUT_FILE, 'utf8') : '';
  return current === buildLlmsFull();
}

// Solo actúa cuando se ejecuta directamente; al importarlo no escribe nada.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (invokedDirectly) {
  if (process.argv.includes('--check')) {
    if (!isLlmsFullUpToDate()) {
      console.error('✗ src/seo/llms-full.txt está desfasado. Ejecuta: node scripts/build-llms-full.mjs');
      process.exit(1);
    }
    console.log('✓ src/seo/llms-full.txt está al día');
  } else {
    const content = buildLlmsFull();
    writeFileSync(OUTPUT_FILE, content, 'utf8');
    console.log(`✓ Generado ${OUTPUT_FILE} (${content.length} caracteres)`);
  }
}
