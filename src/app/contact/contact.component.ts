import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {

  // 🌟 Contacto

  contactMethods = [
    { icon: 'fas fa-envelope', title: 'Email', value: 'psicologanataliagnieto@gmail.com' },
    { icon: 'fas fa-phone', title: 'Teléfono', value: '+57 316 2538804' },
    { icon: 'fas fa-map-marker-alt', title: 'Ubicación', value: 'Bogotá, Colombia' },
    { icon: 'fas fa-calendar', title: 'Disponibilidad', value: 'Lun - Vie, 9AM - 6PM' }
  ];

  socialLinks = [
    { icon: 'fab fa-linkedin', url: 'https://www.linkedin.com/in/daniel-felipe-leon-perez-055061336' },
    { icon: 'fab fa-github', url: 'https://github.com/danieleon08' },
    { icon: 'fab fa-google', url: 'mailto:psicologanataliagnieto@gmail.com' },
    { icon: 'fab fa-instagram', url: 'https://www.instagram.com/psicologa.nataliaguecha/' }
  ];
}
