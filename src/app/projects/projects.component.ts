import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { trigger, transition, style, animate, query, stagger, keyframes } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  animations: [
    trigger('projectTransition', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0 })
        ], { optional: true }),

        query('.detail-content', [
          style({ opacity: 0, transform: 'translateY(20px)' })
        ], { optional: true }),

        query('img', [
          style({ opacity: 0, transform: 'scale(0.95)' })
        ], { optional: true }),

        query(':leave', [
          animate('200ms ease-out', style({ opacity: 0 }))
        ], { optional: true }),

        query('img', [
          animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
        ], { optional: true }),

        query('.detail-content', [
          animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ], { optional: true }),
      ])
    ])
  ]
})
export class ProjectsComponent implements AfterViewInit {
  projects = [
  {
    type: 'producto',
    image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&h=400&fit=crop',
    title: 'De 0 a 10 en segundos: tu plan personal para frenar una crisis emocional',
    short: 'Workbook práctico para intervenir antes de explotar emocionalmente',
    description: 'Este workbook te ayuda a construir tu propio plan de respuesta emocional...',
    price: '$18.99',
    features: [
      'Termómetro emocional personal',
      'Plan de crisis en 5 pasos',
      'Tarjeta de bolsillo para celular'
    ],
    repoUrl: '#',
    demoUrl: 'https://wa.me/573001234567'
  },
  {
    type: 'producto',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=400&fit=crop',
    title: 'Cuando son las 2am y la cabeza no para: Manual de la noche difícil',
    short: 'Guía práctica para calmar la ansiedad nocturna paso a paso',
    description: 'Este manual está diseñado para ese momento exacto en el que la mente no para por la noche...',
    price: '$18.99',
    features: [
      'PDF optimizado para leer de noche',
      'Protocolo de 6 pasos inmediato',
      'Técnicas de respiración y regulación'
    ],
    repoUrl: '#',
    demoUrl: 'https://wa.me/573001234567'
  },
  {
    type: 'producto',
    image: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=600&h=400&fit=crop',
    title: 'Todo lo que nadie te dijo que ibas a sentir cuando te fuiste: Duelo migratorio',
    short: 'Ebook para comprender y procesar el duelo migratorio',
    description: 'Este ebook explica el duelo migratorio desde una perspectiva emocional realista...',
    price: '$18.99',
    features: [
      'Explica las 5 pérdidas del duelo migratorio',
      'Ejercicio guiado de carta emocional',
      'Primeros pasos para empezar a procesar'
    ],
    repoUrl: '#',
    demoUrl: 'https://wa.me/573001234567'
  },

  {
    type: 'servicio',
    image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=600&h=400&fit=crop',
    title: 'Terapia individual - Consulta virtual',
    short: 'Sesión individual para crisis emocionales o decisiones importantes',
    description: 'Una sesión clínica de 45 a 55 minutos donde evaluamos lo que está pasando...',
    price: '$40',
    features: [
      'Sesión de 45 a 55 minutos',
      'Evaluación clínica personalizada',
      '100% virtual desde cualquier país'
    ],
    repoUrl: '#',
    demoUrl: 'https://wa.me/573001234567'
  },
  {
    type: 'servicio',
    image: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=600&h=400&fit=crop',
    title: 'Terapia de pareja - Consulta virtual',
    short: 'Sesión profesional para resolver conflictos de pareja',
    description: 'Una sesión clínica donde se escucha a ambos miembros de la pareja...',
    price: '$46',
    features: [
      'Sesión de pareja de 60 a 75 minutos',
      'Evaluación del vínculo',
      'Orientación profesional clara'
    ],
    repoUrl: '#',
    demoUrl: 'https://wa.me/573001234567'
  },
  {
    type: 'servicio',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    title: 'Terapia para migrantes - Sesión individual virtual',
    short: 'Sesión especializada para latinos viviendo en el exterior',
    description: 'Una sesión pensada específicamente para migrantes...',
    price: '$40',
    features: [
      'Especializada en duelo migratorio',
      'Sesión individual de 45 a 55 minutos',
      '100% virtual para latinos en el exterior'
    ],
    repoUrl: '#',
    demoUrl: 'https://wa.me/573001234567'
  }
];

  selectedProject: any = this.projects[0];

  constructor(private el: ElementRef) { }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          } else {
            entry.target.classList.remove('in-view');
          }
        });
      },
      { threshold: 0.2 } // Se activa cuando al menos 20% de la sección entra en pantalla
    );

    const sections = this.el.nativeElement.querySelectorAll('.project-card');
    sections.forEach((section: Element) => observer.observe(section));
  }

  selectProject(project: any): void {
    this.selectedProject = project;
  }

  goToProjectSection(project: any): void {
    this.selectedProject = project; // mantiene la lógica que ya tenías
    const section = document.getElementById("titulo-proyecto");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  getWhatsappLink(project: any): string {

    if (project.type === 'servicio') {
      const message = `Hola, me interesa ${project.title}`;
      const encoded = encodeURIComponent(message);

      return `https://wa.me/573104671284?text=${encoded}`;
    }

    return project.demoUrl;
  }

}
