import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() forceSidebar: boolean = false; // nuevo input

  // La tarjeta usa el mismo marcado en todos los tamaños; el diseño
  // responsive se resuelve por CSS, sin cambiar de plantilla.
  menuOpen: boolean = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
