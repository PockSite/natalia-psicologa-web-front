#!/usr/bin/env node
/**
 * Valida la sintaxis de nginx.conf con el mismo nginx que usa la imagen de
 * producción (`nginx -t`). Necesita Docker en marcha.
 *
 *   npm run test:nginx
 *
 * Se hace desde Node y no desde el script de npm para que la ruta absoluta del
 * volumen funcione igual en Windows, macOS y Linux.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const conf = join(root, 'nginx.conf');

const result = spawnSync('docker', [
  'run', '--rm',
  '-v', `${conf}:/etc/nginx/conf.d/default.conf:ro`,
  'nginx:alpine', 'nginx', '-t',
], { stdio: 'inherit' });

if (result.error) {
  console.error(`✗ No se pudo ejecutar Docker: ${result.error.message}`);
  console.error('  Arranca Docker y vuelve a intentarlo, o valida nginx.conf en el servidor con `nginx -t`.');
  process.exit(1);
}

process.exit(result.status ?? 1);
