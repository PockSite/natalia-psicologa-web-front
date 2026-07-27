import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (!environment.production) {
  console.log('[ENV] Configuración de entorno (develop):', environment);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
