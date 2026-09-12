import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild, Renderer2, HostListener } from '@angular/core';

@Component({
  selector: 'app-aboutme',
  templateUrl: './aboutme.component.html',
  styleUrls: ['./aboutme.component.css']
})
export class AboutmeComponent implements OnInit, AfterViewInit, OnDestroy {
  isVisible = false;
  observer!: IntersectionObserver;
  @ViewChild('achievementsViewport', { static: false }) achievementsViewport!: ElementRef;
  @ViewChild('achievementsTrack', { static: false }) achievementsTrack!: ElementRef;
  @ViewChild('aboutContainer', { static: false }) aboutContainer!: ElementRef;
  @ViewChild('aboutLeft', { static: false }) aboutLeft!: ElementRef;
  @ViewChild('aboutRight', { static: false }) aboutRight!: ElementRef;
  private resizeTimeout: ReturnType<typeof setTimeout> | undefined;

  // Las tarjetas miden 260px como máximo: 560px de lado largo cubre pantallas retina.
  logros = [
    { image: 'assets/images/fotografia1-w560.webp', alt: 'Natalia Güechá Nieto, psicóloga clínica, sonriendo en su consultorio' },
    { image: 'assets/images/fotografia2-w560.webp', alt: 'Natalia Güechá durante una sesión de terapia psicológica' },
    { image: 'assets/images/fotografia3-w560.webp', alt: 'Retrato de Natalia Güechá, magíster en psicología clínica' },
    { image: 'assets/images/fotografia4-w560.webp', alt: 'Natalia Güechá, psicóloga clínica en Bogotá, Colombia' },
    { image: 'assets/images/fotografia5-w560.webp', alt: 'Natalia Güechá atendiendo terapia online desde Bogotá' },
  ];

  logrosDuplicados: { image: string; alt: string }[] = [];

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.logrosDuplicados = [...this.logros, ...this.logros];
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isVisible = true;   // activa animación
        } else {
          this.isVisible = false;  // pausa animación
        }
      });
    }, { threshold: 0.2 });

    this.observer.observe(this.el.nativeElement);
  }

  ngAfterViewInit() {
    // initial adjustment for desktop to avoid cutting cards
    setTimeout(() => this.adjustViewportHeight(), 50);
  }

  @HostListener('window:resize')
  onWindowResize() {
    // debounce resize
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.adjustViewportHeight(), 120);
  }

  private adjustViewportHeight() {
    try {
      const viewportEl = this.achievementsViewport?.nativeElement as HTMLElement | undefined;
      const trackEl = this.achievementsTrack?.nativeElement as HTMLElement | undefined;
      const aboutLeftEl = this.aboutLeft?.nativeElement as HTMLElement | undefined;
      const aboutRightEl = this.aboutRight?.nativeElement as HTMLElement | undefined;
      if (!viewportEl || !trackEl) return;

      // On desktop (where we use vertical scrolling) ensure viewport height matches tallest card.
      // A partir de 1025px es donde el CSS aplica el layout de dos columnas.
      const desktop = window.innerWidth > 1024;
      if (!desktop) {
        // remove any explicit height on smaller screens
        this.renderer.removeStyle(viewportEl, 'height');
        if (aboutRightEl) this.renderer.removeStyle(aboutRightEl, 'height');
        return;
      }

      const cards = trackEl.querySelectorAll('.achievement-card');
      let maxH = 0;
      cards.forEach((c: Element) => {
        const el = c as HTMLElement;
        const h = el.offsetHeight;
        if (h > maxH) maxH = h;
      });

      // If we can measure left column, make right column height match it so the carousel
      // fills the component vertically and cards are fully visible.
      if (aboutLeftEl && aboutRightEl) {
        const leftH = aboutLeftEl.offsetHeight;
        if (leftH > 0) {
          this.renderer.setStyle(aboutRightEl, 'height', `${leftH}px`);
          // set viewport to match available height (subtract small gaps if needed)
          const finalH = leftH; // keep equal; CSS gap handled by internal layout
          this.renderer.setStyle(viewportEl, 'height', `${finalH}px`);
          return;
        }
      }

      if (maxH > 0) {
        // fallback: use tallest card height
        const finalH = maxH + 20;
        this.renderer.setStyle(viewportEl, 'height', `${finalH}px`);
      }
    } catch (err) {
      // fail silently
      console.warn('adjustViewportHeight error', err);
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
