import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-header-top',
  templateUrl: './header-top.component.html',
  styleUrls: ['./header-top.component.css']
})
export class HeaderTopComponent implements OnInit, OnDestroy {

  navItems = [
    { name: 'Portada', url: '#', icon: 'fas fa-home' },
    { name: 'Identidad', url: '#servicios', icon: 'fas fa-user' },
    { name: 'Sobre mi', url: '#sobre-mi', icon: 'fas fa-graduation-cap' },
    { name: 'Testimonios', url: '#cursos', icon: 'fas fa-briefcase' },
    { name: 'Servicios', url: 'proyectos', icon: 'fas fa-blog' },
    { name: 'Contacto', url: '#contacto', icon: 'fas fa-envelope' }
  ];

  activeTab = 'Portada';
  isMobile = false;
  leftNavItems: { name: string; url: string; icon: string }[] = [];
  rightNavItems: { name: string; url: string; icon: string }[] = [];
  private sectionElements: (HTMLElement | null)[] | null = null;
  private onResize = () => this.updateNavItems();

  ngOnInit() {
    this.updateNavItems();
    window.addEventListener('resize', this.onResize);
    this.onWindowScroll();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  private updateNavItems() {
    this.isMobile = window.innerWidth < 768;
    this.leftNavItems = this.isMobile
      ? this.navItems.slice(1, 3)
      : this.navItems.slice(0, 3);
    this.rightNavItems = this.isMobile
      ? this.navItems.slice(3, 5)
      : this.navItems.slice(3);
  }

  goHome(event: Event) {
    event.preventDefault();
    this.activeTab = 'Portada';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setActiveTab(name: string, event: Event) {
    event.preventDefault();
    this.activeTab = name;
    const item = this.navItems.find(i => i.name === name);
    if (item) {
      const id = item.url.replace('#', '');
      if (id === '') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }
    }
  }

  lastScrollTop = 0;
  isHidden = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const st = window.pageYOffset || document.documentElement.scrollTop;

    if (st > this.lastScrollTop && st > 100) {
      this.isHidden = true;
    } else {
      this.isHidden = false;
    }
    this.lastScrollTop = st <= 0 ? 0 : st;

    if (!this.sectionElements || this.sectionElements.includes(null)) {
      this.sectionElements = this.navItems.map(item => {
        const id = item.url.replace('#', '');
        if (id === '') return document.body;
        return document.getElementById(id);
      });
    }

    const scrollPosition = window.scrollY + 100;
    for (let i = this.sectionElements.length - 1; i >= 0; i--) {
      const section = this.sectionElements[i];
      if (section && scrollPosition >= section.offsetTop) {
        this.activeTab = this.navItems[i].name;
        break;
      }
    }
  }
}
