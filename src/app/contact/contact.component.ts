import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {

  form = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  enviarWhatsApp() {

    const telefono = '573104671284'; // sin espacios ni +

    const mensaje = `
Hola, soy ${this.form.name}

Correo: ${this.form.email}
Asunto: ${this.form.subject}

Mensaje:
${this.form.message}
    `;

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
  }

  // 🌟 Contacto

  // `href` convierte el dato en enlace (mailto:/tel:), clave en móvil y para el SEO local.
  contactMethods: { icon: string; title: string; value: string; href?: string }[] = [
    { icon: 'fas fa-envelope', title: 'Email', value: 'psicologanataliagnieto@gmail.com', href: 'mailto:psicologanataliagnieto@gmail.com' },
    { icon: 'fas fa-phone', title: 'Teléfono', value: '+57 310 4671284', href: 'tel:+573104671284' },
    { icon: 'fas fa-map-marker-alt', title: 'Ubicación', value: 'Bogotá, Colombia' },
    { icon: 'fas fa-calendar', title: 'Horario de atención', value: 'Lunes a viernes, 9:00 – 18:00 (hora de Bogotá)' }
  ];

  socialLinks = [
    { icon: 'fab fa-linkedin', url: 'https://www.linkedin.com/in/natalia-güechá-nieto-91a636244/' },
    { icon: 'fas fa-at', url: 'mailto:psicologanataliagnieto@gmail.com' },
    { icon: 'fab fa-instagram', url: 'https://www.instagram.com/psicologa.nataliaguecha/' },
    { icon: 'fab fa-tiktok', url: 'https://www.tiktok.com/@psicologa.nataliaguecha' }
  ];
}
