import { Component, AfterViewInit, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.model';

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

  projects: Product[] = [];
  selectedProject: Product | null = null;
  isLoading = true;

  constructor(
    private el: ElementRef,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: products => {
        // Mostrar primero las citas (consultas), conservando el orden dentro de cada grupo
        const ordered = [...products].sort(
          (a, b) => (a.type?.code === 'consulta' ? 0 : 1) - (b.type?.code === 'consulta' ? 0 : 1)
        );
        this.projects = ordered;
        this.selectedProject = ordered[0] ?? null;
        this.isLoading = false;
        // Las cards se renderizan después de la respuesta del servicio,
        // por eso el observer se conecta en el siguiente ciclo.
        setTimeout(() => this.observeCards());
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.observeCards();
  }

  private observeCards(): void {
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
      { threshold: 0.2 }
    );

    const sections = this.el.nativeElement.querySelectorAll('.project-card');
    sections.forEach((section: Element) => observer.observe(section));
  }

  selectProject(project: Product): void {
    this.selectedProject = project;
  }

  goToProjectSection(project: Product): void {
    this.selectedProject = project;
    const section = document.getElementById('titulo-proyecto');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Navegar a la vista de detalle del producto / servicio
  viewProductDetail(product: Product, event: Event): void {
    event.preventDefault();
    this.router.navigate(['/producto', product.id]);
  }

  getWhatsappLink(project: Product): string {
    const message = `Hola, me interesa ${project.name}`;
    const encoded = encodeURIComponent(message);
    return `https://wa.me/573104671284?text=${encoded}`;
  }
}
