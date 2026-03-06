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
  showFloatingBtn: boolean = false;
  private consultationBtnObserver: IntersectionObserver | null = null;

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

    // 🔵 Observar botón de consulta original para mostrar/ocultar botón flotante
    setTimeout(() => {
      const consultationBtn = document.querySelector('.consultation-btn');
      if (consultationBtn) {
        this.consultationBtnObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              // Mostrar botón flotante cuando el botón original NO está visible
              this.showFloatingBtn = !entry.isIntersecting;
            });
          },
          { threshold: 0.1 }
        );
        this.consultationBtnObserver.observe(consultationBtn);
      }
    }, 100);
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
    if (this.consultationBtnObserver) {
      this.consultationBtnObserver.disconnect();
    }
  }

  /**
   * 💬 Abrir WhatsApp con número de contacto
   */
  openWhatsApp(): void {
    const phoneNumber = '573017486316'; // Reemplaza con el número de Natalia
    const message = 'Hola, me gustaría agendar una consulta';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
}
