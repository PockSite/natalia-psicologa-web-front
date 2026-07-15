import { Component, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-myprofile',
  templateUrl: './myprofile.component.html',
  styleUrls: ['./myprofile.component.css']
})
export class MyprofileComponent implements OnInit, OnDestroy, AfterViewInit {
  

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
  private wordIntervalId: ReturnType<typeof setInterval> | null = null;
  private fadeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  showFloatingBtn: boolean = false;
  private consultationBtnObserver: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.startWordAnimation();
  }

  ngAfterViewInit(): void {
    const consultationBtn = document.querySelector('.consultation-btn');
    if (consultationBtn) {
      this.consultationBtnObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.showFloatingBtn = !entry.isIntersecting;
          });
        },
        { threshold: 0.1 }
      );
      this.consultationBtnObserver.observe(consultationBtn);
    }
  }

  /**
   * 🔥 Animación fluida de palabras (fade-out → cambio → fade-in)
   */
  startWordAnimation() {
    this.wordIntervalId = setInterval(() => {
      const highlightEl = document.querySelector('.highlight');
      if (!highlightEl) return;

      highlightEl.classList.add('fade-out');

      this.fadeTimeoutId = setTimeout(() => {
        this.wordIndex = (this.wordIndex + 1) % this.words.length;
        this.currentWord = this.words[this.wordIndex];
        highlightEl.classList.remove('fade-out');
        highlightEl.classList.add('fade-in');
        setTimeout(() => highlightEl.classList.remove('fade-in'), 800);
      }, 600);
    }, 3500);
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

  ngOnDestroy(): void {
    clearInterval(this.wordIntervalId!);
    clearTimeout(this.fadeTimeoutId!);
    this.consultationBtnObserver?.disconnect();
  }

  /**
   * 💬 Abrir WhatsApp con número de contacto
   */
  openWhatsApp(): void {
    const phoneNumber = '573104671284'; // Reemplaza con el número de Natalia
    const message = 'Hola vi tu sitio web y me gustaría agendar una consulta contigo.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
}
