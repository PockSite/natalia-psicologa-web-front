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
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
      title: 'Mindfulness y Manejo del Estrés',
      short: 'Encuentra paz y serenidad en tu día a día',
      description: 'Aprende técnicas de meditación mindfulness y manejo del estrés basadas en evidencia científica. Este curso te proporciona herramientas prácticas para reducir la ansiedad, mejorar la concentración y cultivar el bienestar mental. Incluye meditaciones guiadas, ejercicios de respiración y estrategias para mantener el equilibrio emocional en situaciones desafiantes.',
      features: ['Mindfulness', 'Meditación', 'Técnicas de Relajación', 'Bienestar Mental', '5 semanas'],
      repoUrl: '#',
      demoUrl: 'https://wa.me/573001234567'
    },
    {
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      title: 'Comunicación Asertiva y Relaciones Interpersonales',
      short: 'Mejora tus habilidades de comunicación efectiva',
      description: 'Domina el arte de la comunicación asertiva para expresar tus ideas, necesidades y sentimientos de forma clara y respetuosa. Este curso te enseña a establecer límites saludables, resolver conflictos constructivamente y fortalecer tus relaciones personales y profesionales. Incluye práctica de escucha activa, lenguaje no verbal y estrategias de negociación.',
      features: ['Comunicación Asertiva', 'Escucha Activa', 'Resolución de Conflictos', 'Relaciones', '7 semanas'],
      repoUrl: '#',
      demoUrl: 'https://wa.me/573001234567'
    },
    {
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=400&fit=crop',
      title: 'Autoestima y Desarrollo Personal',
      short: 'Construye una imagen positiva de ti mismo',
      description: 'Este curso te guía en un viaje de autoconocimiento y amor propio. Aprenderás a identificar creencias limitantes, fortalecer tu autoestima y desarrollar una mentalidad de crecimiento. Incluye ejercicios prácticos para aumentar tu confianza, superar la vergüenza y el perfeccionismo, y construir una vida alineada con tus valores y metas personales.',
      features: ['Autoestima', 'Amor Propio', 'Mentalidad de Crecimiento', 'Desarrollo Personal', '6 semanas'],
      repoUrl: '#',
      demoUrl: 'https://wa.me/573001234567'
    },
    {
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      title: 'Psicología Familiar y Consejería',
      short: 'Fortalece tus relaciones familiares',
      description: 'Explora la dinámica familiar desde una perspectiva psicológica. Este curso aborda sistemas familiares, patrones de comunicación transmitidos generacionalmente, y técnicas de consejería para mejorar relaciones entre padres e hijos, parejas y hermanos. Aprenderás a reconocer conflictos familiares recurrentes y a implementar estrategias de sanación y conexión emocional.',
      features: ['Dinámica Familiar', 'Consejería', 'Relaciones Parentales', 'Patrones Familiares', '7 semanas'],
      repoUrl: '#',
      demoUrl: 'https://wa.me/573001234567'
    },
    {
      image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=400&fit=crop',
      title: 'Terapia de Aceptación y Compromiso',
      short: 'Vive una vida plena y con propósito',
      description: 'La Terapia de Aceptación y Compromiso (ACT) te enseña a aceptar tus pensamientos y sentimientos difíciles sin dejarte controlar por ellos. Este curso se enfoca en la acción comprometida hacia tus valores personales, aumentando tu capacidad de resiliencia psicológica. Incluye técnicas de mindfulness, clarificación de valores, y compromisos conductuales para una vida significativa y auténtica.',
      features: ['Aceptación', 'Valores Personales', 'Mindfulness', 'Resiliencia', '8 semanas'],
      repoUrl: '#',
      demoUrl: 'https://wa.me/573001234567'
    },
    {
      image: 'https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=600&h=400&fit=crop',
      title: 'Psicología del Comportamiento Humano',
      short: 'Comprende los principios que guían el comportamiento',
      description: 'Exploraremos los fundamentos teóricos y prácticos de por qué los seres humanos actúan de cierta manera. Este curso cubre teorías conductistas, cognitivas y ambientales, aplicadas a la vida cotidiana. Aprenderás a analizar patrones de comportamiento, motivaciones ocultas y cómo el contexto influye en nuestras decisiones y acciones diarias.',
      features: ['Conductismo', 'Cognición', 'Motivación', 'Aprendizaje', '8 semanas'],
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

}
