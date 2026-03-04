import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

@Component({
  selector: 'app-myprofile',
  templateUrl: './myprofile.component.html',
  styleUrls: ['./myprofile.component.css']
})
export class MyprofileComponent implements OnInit, OnDestroy {
  

  // 🌟 Palabras dinámicas
  words: string[] = [
    'Empatía y Escucha',
    'Conexión Humana',
    'Bienestar Mental',
    'Apoyo Profesional',
    'Conexión Genuina'
  ];
  currentWord: string = this.words[0];
  private wordIndex: number = 0;
  private wordIntervalId: any;

  isMobile: boolean = window.innerWidth <= 768;

  ngOnInit(): void {
    this.startWordAnimation();

    // 🌟 Detectar viewport (animaciones móviles)
    if (this.isMobile) {
      const target = document.querySelector('.myprofile');
      if (target) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                target.classList.add('visible');
              }
            });
          },
          { threshold: 0.3 }
        );
        observer.observe(target);
      }
    }
  }

  /**
   * 🔥 Animación fluida de palabras (fade-out → cambio → fade-in)
   */
  startWordAnimation() {
    this.wordIntervalId = setInterval(() => {
      const highlightEl = document.querySelector('.highlight');
      if (highlightEl) {
        // Fade out
        highlightEl.classList.add('fade-out');

        setTimeout(() => {
          // Cambiar palabra
          this.wordIndex = (this.wordIndex + 1) % this.words.length;
          this.currentWord = this.words[this.wordIndex];

          // Fade in
          highlightEl.classList.remove('fade-out');
          highlightEl.classList.add('fade-in');

          // Quitar clase después de animación
          setTimeout(() => highlightEl.classList.remove('fade-in'), 800);
        }, 600); // tiempo para que termine el fade-out
      }
    }, 3500); // cada 3.5 segundos cambia
  }

  /**
   * 🌊 Efecto de scroll en elemento decorativo
   */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const waveDecoration = document.querySelector('.wave-decoration') as HTMLElement;
    if (waveDecoration) {
      const scrollY = window.scrollY;
      const parallaxSpeed = 0.5;
      waveDecoration.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnDestroy(): void {
    if (this.wordIntervalId) {
      clearInterval(this.wordIntervalId);
    }
  }
}
