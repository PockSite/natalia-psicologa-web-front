import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Carga la config en runtime (nginx/envsubst la genera al arrancar el contenedor)
// y la fusiona sobre el objeto environment antes de bootstrapear la app.
fetch('assets/config.json', { cache: 'no-cache' })
  .then(res => (res.ok ? res.json() : {}))
  .then(cfg => Object.assign(environment, cfg))
  .catch(err => console.warn('[ENV] No se pudo cargar config.json, usando valores por defecto', err))
  .finally(() => {
    if (!environment.production) {
      console.log('[ENV] Configuración de entorno (develop):', environment);
    }
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => console.error(err));
  });
