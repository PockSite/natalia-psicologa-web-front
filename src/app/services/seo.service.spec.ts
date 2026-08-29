import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { DEFAULT_META, ROUTE_META, SITE_ORIGIN, SeoService } from './seo.service';

@Component({ template: '' })
class StubComponent { }

describe('SeoService', () => {

  let service: SeoService;
  let router: Router;

  const canonicalHref = () =>
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href');

  const metaContent = (selector: string) =>
    TestBed.inject(Meta).getTag(selector)?.content;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: StubComponent },
          { path: 'producto/:id', component: StubComponent },
          { path: 'pago-resultado', component: StubComponent },
        ]),
      ],
      declarations: [StubComponent],
    });

    service = TestBed.inject(SeoService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    service.ngOnDestroy();
    document.head.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove());
    const meta = TestBed.inject(Meta);
    ['name="description"', 'name="robots"', 'property="og:url"', 'property="og:title"',
      'property="og:description"'].forEach(selector => meta.removeTag(selector));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('canonicalUrlFor', () => {

    it('keeps the root path as a single slash', () => {
      expect(service.canonicalUrlFor('/')).toBe(`${SITE_ORIGIN}/`);
    });

    it('drops the query string and the fragment', () => {
      expect(service.canonicalUrlFor('/producto/42?ref=ig#agenda'))
        .toBe(`${SITE_ORIGIN}/producto/42`);
    });

    it('drops a trailing slash', () => {
      expect(service.canonicalUrlFor('/pago-resultado/')).toBe(`${SITE_ORIGIN}/pago-resultado`);
    });
  });

  describe('start', () => {

    it('writes the canonical link and og:url for the current route', () => {
      service.start();

      expect(canonicalHref()).toBe(`${SITE_ORIGIN}/`);
      expect(metaContent('property="og:url"')).toBe(`${SITE_ORIGIN}/`);
    });

    it('applies the default title and description on the home route', () => {
      service.start();

      expect(TestBed.inject(Title).getTitle()).toBe(DEFAULT_META.title);
      expect(metaContent('name="description"')).toBe(DEFAULT_META.description);
      expect(metaContent('property="og:title"')).toBe(DEFAULT_META.title);
    });

    it('reuses the existing canonical link instead of adding a second one', () => {
      const existing = document.createElement('link');
      existing.setAttribute('rel', 'canonical');
      existing.setAttribute('href', 'https://example.com/wrong');
      document.head.appendChild(existing);

      service.start();

      expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
      expect(canonicalHref()).toBe(`${SITE_ORIGIN}/`);
    });

    it('updates the metadata on navigation', fakeAsync(() => {
      service.start();

      router.navigateByUrl('/producto/42?ref=ig');
      tick();

      expect(canonicalHref()).toBe(`${SITE_ORIGIN}/producto/42`);
      expect(metaContent('property="og:url"')).toBe(`${SITE_ORIGIN}/producto/42`);
      expect(TestBed.inject(Title).getTitle()).toBe(ROUTE_META['producto'].title);
    }));

    it('marks the payment result route as noindex', fakeAsync(() => {
      service.start();

      router.navigateByUrl('/pago-resultado');
      tick();

      expect(metaContent('name="robots"')).toBe('noindex, nofollow');
    }));

    it('falls back to the default metadata on an unknown segment', fakeAsync(() => {
      service.start();

      router.navigateByUrl('/producto/42');
      tick();
      router.navigateByUrl('/');
      tick();

      expect(TestBed.inject(Title).getTitle()).toBe(DEFAULT_META.title);
      expect(metaContent('name="robots"')).toBe('index, follow, max-image-preview:large, max-snippet:-1');
    }));

    it('does not subscribe twice when started again', fakeAsync(() => {
      service.start();
      service.start();

      router.navigateByUrl('/pago-resultado');
      tick();

      expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    }));
  });
});
