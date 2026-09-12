import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/** Origen público del sitio. Debe coincidir con el canonical de src/index.html. */
export const SITE_ORIGIN = 'https://bienestarconnataliaguecha.com';

/** Metadatos que cambian según la ruta activa. */
export interface PageMeta {
  title: string;
  description: string;
  /** Valor de <meta name="robots">. Por defecto, indexable. */
  robots?: string;
}

/** Título ≤ 580px y descripción ≤ 155 caracteres (≈990px): así no se truncan en Google. */
export const DEFAULT_META: PageMeta = {
  title: 'Psicóloga Clínica Online | Natalia Güechá · Bogotá y LATAM',
  description:
    'Psicóloga clínica online en español: terapia individual y de pareja con Natalia Güechá, ' +
    'magíster en psicología clínica. Bogotá, Latinoamérica y España.',
};

/** Metadatos por primer segmento de la URL (ver app-routing.module.ts). */
export const ROUTE_META: Record<string, PageMeta> = {
  '': DEFAULT_META,
  producto: {
    title: 'Servicio — Psicóloga Clínica Natalia Güechá',
    description:
      'Detalle del servicio: qué incluye, precio en pesos colombianos, psicóloga que lo atiende, ' +
      'disponibilidad en calendario y pago en línea.',
  },
  'pago-resultado': {
    title: 'Resultado del pago — Psicóloga Clínica Natalia Güechá',
    description: 'Confirmación de la transacción realizada en bienestarconnataliaguecha.com.',
    robots: 'noindex, nofollow',
  },
};

/**
 * Mantiene canonical, og:url, título y descripción sincronizados con la ruta
 * activa. El HTML estático de src/index.html ya trae los valores de la portada;
 * este servicio los corrige al navegar dentro de la SPA, que es donde un
 * rastreador con JavaScript vería un canonical equivocado.
 */
@Injectable({ providedIn: 'root' })
export class SeoService implements OnDestroy {

  private subscription?: Subscription;

  constructor(
    private router: Router,
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  /** Aplica los metadatos de la ruta actual y los actualiza en cada navegación. */
  start(): void {
    if (this.subscription) return;

    this.apply(this.router.url);
    this.subscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.apply(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }

  /** URL canónica absoluta de una ruta del router: sin query, hash ni barra final. */
  canonicalUrlFor(url: string): string {
    const path = url.split('#')[0].split('?')[0];
    const clean = path === '/' ? '/' : path.replace(/\/+$/, '');
    return `${SITE_ORIGIN}${clean.startsWith('/') ? clean : `/${clean}`}`;
  }

  /** Primer segmento de la ruta, que es lo que decide los metadatos. */
  private segmentOf(url: string): string {
    return url.split('#')[0].split('?')[0].split('/').filter(Boolean)[0] ?? '';
  }

  private apply(url: string): void {
    const canonical = this.canonicalUrlFor(url);
    const page = ROUTE_META[this.segmentOf(url)] ?? DEFAULT_META;

    this.setCanonical(canonical);
    this.titleService.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({
      name: 'robots',
      content: page.robots ?? 'index, follow, max-image-preview:large, max-snippet:-1',
    });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
  }

  private setCanonical(href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }

    link.setAttribute('href', href);
  }
}
