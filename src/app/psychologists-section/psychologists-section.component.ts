import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { Psychologist } from '../models/psychologist.model';
import { PsychologistService } from '../services/psychologist.service';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const SLIDE_MS = 600;
/** Cada cuánto avanza el carrusel solo. */
const AUTOPLAY_MS = 7000;
/** Resolución de la barra de progreso del autoplay. */
const TICK_MS = 100;

@Component({
  selector: 'app-psychologists-section',
  templateUrl: './psychologists-section.component.html',
  styleUrls: ['./psychologists-section.component.css'],
  animations: [
    /* La foto entra en vertical: hacia arriba al avanzar, hacia abajo al retroceder.
       El contador (slideCounter) sube con "siguiente" y baja con "anterior", así
       :increment / :decrement resuelven la dirección sin estado extra. */
    trigger('photoStage', [
      transition(':increment', [
        query(':enter', [style({ opacity: 0, transform: 'translateY(100%)' })], { optional: true }),
        group([
          query(':leave', [animate(`${SLIDE_MS}ms ${EASE}`, style({ opacity: 0, transform: 'translateY(-100%)' }))], { optional: true }),
          query(':enter', [animate(`${SLIDE_MS}ms ${EASE}`, style({ opacity: 1, transform: 'translateY(0)' }))], { optional: true }),
        ]),
      ]),
      transition(':decrement', [
        query(':enter', [style({ opacity: 0, transform: 'translateY(-100%)' })], { optional: true }),
        group([
          query(':leave', [animate(`${SLIDE_MS}ms ${EASE}`, style({ opacity: 0, transform: 'translateY(100%)' }))], { optional: true }),
          query(':enter', [animate(`${SLIDE_MS}ms ${EASE}`, style({ opacity: 1, transform: 'translateY(0)' }))], { optional: true }),
        ]),
      ]),
    ]),

    /* El texto acompaña en horizontal, con un pequeño desfase para que no se sienta rígido. */
    trigger('textStage', [
      transition(':increment', [
        query(':enter', [style({ opacity: 0, transform: 'translateX(45px)' })], { optional: true }),
        group([
          query(':leave', [animate(`${SLIDE_MS * 0.6}ms ${EASE}`, style({ opacity: 0, transform: 'translateX(-45px)' }))], { optional: true }),
          query(':enter', [animate(`${SLIDE_MS}ms ${EASE}`, style({ opacity: 1, transform: 'translateX(0)' }))], { optional: true }),
        ]),
      ]),
      transition(':decrement', [
        query(':enter', [style({ opacity: 0, transform: 'translateX(-45px)' })], { optional: true }),
        group([
          query(':leave', [animate(`${SLIDE_MS * 0.6}ms ${EASE}`, style({ opacity: 0, transform: 'translateX(45px)' }))], { optional: true }),
          query(':enter', [animate(`${SLIDE_MS}ms ${EASE}`, style({ opacity: 1, transform: 'translateX(0)' }))], { optional: true }),
        ]),
      ]),
    ]),
  ],
})
export class PsychologistsSectionComponent implements OnInit, OnDestroy {

  psychologists: Psychologist[] = [];
  currentIndex = 0;
  isLoading = true;

  /** Contador monótono que alimenta las animaciones (sube = siguiente, baja = anterior). */
  slideCounter = 0;

  /** Entrada de la sección al hacer scroll, igual que el resto del sitio. */
  isVisible = false;

  /* ── Autoplay ── */
  /** Intención del usuario (botón reproducir/pausar). */
  isPlaying = true;
  /** Pausa temporal por hover o foco dentro del carrusel. */
  private isHeld = false;
  /** La sección no está a la vista: no tiene sentido gastar ciclos avanzando. */
  private isOffscreen = true;
  private timer: ReturnType<typeof setInterval> | null = null;
  private elapsed = 0;
  progress = 0;

  /** Se consulta desde la plantilla para desactivar las animaciones del carrusel. */
  prefersReducedMotion = false;

  private observer?: IntersectionObserver;
  private sub?: Subscription;

  constructor(
    private psychologistService: PsychologistService,
    private host: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void {
    this.prefersReducedMotion =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.prefersReducedMotion) {
      this.isPlaying = false;
    }

    this.sub = this.psychologistService.getPsychologists().subscribe({
      next: list => {
        this.psychologists = list;
        this.isLoading = false;
        this.syncTimer();
      },
      error: () => {
        // El servicio ya degrada a datos de muestra; esto cubre un fallo inesperado.
        this.psychologists = [];
        this.isLoading = false;
      },
    });

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { this.isVisible = true; }
          // El autoplay solo corre mientras la sección está a la vista.
          this.isOffscreen = !entry.isIntersecting;
          this.syncTimer();
        });
      }, { threshold: 0.25 });
      this.observer.observe(this.host.nativeElement);
    } else {
      this.isVisible = true;
      this.isOffscreen = false;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.observer?.disconnect();
    this.sub?.unsubscribe();
  }

  /* ── Datos derivados ── */

  get active(): Psychologist | undefined {
    return this.psychologists[this.currentIndex];
  }

  get total(): number {
    return this.psychologists.length;
  }

  get hasMultiple(): boolean {
    return this.total > 1;
  }

  /** Miniaturas: el resto del equipo en orden cíclico a partir de la actual. */
  get thumbnails(): Psychologist[] {
    if (!this.hasMultiple) { return []; }
    const rest: Psychologist[] = [];
    for (let i = 1; i < this.total; i++) {
      rest.push(this.psychologists[(this.currentIndex + i) % this.total]);
    }
    return rest.slice(0, 4);
  }

  /** Lista de un solo elemento: al cambiar de id, *ngFor dispara :leave y :enter. */
  get activeAsList(): Psychologist[] {
    return this.active ? [this.active] : [];
  }

  pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  trackById(_index: number, psychologist: Psychologist): string {
    return psychologist.id;
  }

  /** Iniciales para cuando la psicóloga aún no tiene foto cargada. */
  initials(psychologist: Psychologist): string {
    return psychologist.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  whatsappLink(psychologist: Psychologist): string | null {
    if (!psychologist.whatsappNumber) { return null; }
    const code = (psychologist.whatsappCountryCode ?? '+57').replace(/\D/g, '');
    const number = psychologist.whatsappNumber.replace(/\D/g, '');
    const message = `Hola ${psychologist.fullName}, vi tu perfil en la web y me gustaría agendar una consulta.`;
    return `https://wa.me/${code}${number}?text=${encodeURIComponent(message)}`;
  }

  mailtoLink(psychologist: Psychologist): string | null {
    return psychologist.email ? `mailto:${psychologist.email}` : null;
  }

  /* ── Navegación ── */

  next(): void {
    if (!this.hasMultiple) { return; }
    this.currentIndex = (this.currentIndex + 1) % this.total;
    this.slideCounter++;
    this.resetProgress();
  }

  prev(): void {
    if (!this.hasMultiple) { return; }
    this.currentIndex = (this.currentIndex - 1 + this.total) % this.total;
    this.slideCounter--;
    this.resetProgress();
  }

  goTo(index: number): void {
    if (index === this.currentIndex || index < 0 || index >= this.total) { return; }
    // La dirección de la animación sigue al orden visual de la lista.
    this.slideCounter += index > this.currentIndex ? 1 : -1;
    this.currentIndex = index;
    this.resetProgress();
  }

  goToPsychologist(psychologist: Psychologist): void {
    this.goTo(this.psychologists.findIndex(p => p.id === psychologist.id));
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  /* ── Autoplay ── */

  toggleAutoplay(): void {
    this.isPlaying = !this.isPlaying;
    this.resetProgress();
  }

  /** Hover o foco dentro del carrusel: se detiene el avance automático. */
  hold(): void {
    this.isHeld = true;
    this.syncTimer();
  }

  release(): void {
    this.isHeld = false;
    this.syncTimer();
  }

  private resetProgress(): void {
    this.elapsed = 0;
    this.progress = 0;
    this.syncTimer();
  }

  private syncTimer(): void {
    const shouldRun =
      this.isPlaying && !this.isHeld && !this.isOffscreen &&
      this.hasMultiple && !this.prefersReducedMotion;

    if (shouldRun && !this.timer) {
      this.timer = setInterval(() => this.tick(), TICK_MS);
    } else if (!shouldRun && this.timer) {
      this.stopTimer();
    }
  }

  private tick(): void {
    this.elapsed += TICK_MS;
    this.progress = Math.min(100, (this.elapsed / AUTOPLAY_MS) * 100);
    if (this.elapsed >= AUTOPLAY_MS) {
      this.next();
    }
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
