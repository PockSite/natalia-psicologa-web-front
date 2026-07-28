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
export class ProjectsComponent implements OnInit, AfterViewInit {

  projects: Product[] = [];
  selectedProject: Product | null = null;
  isLoading = true;

  // Paginación de la lista de servicios: 6 tarjetas por página (2 columnas x 3 filas)
  readonly pageSize = 6;
  currentPage = 1;

  private cardObserver?: IntersectionObserver;

  constructor(
    private el: ElementRef,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: products => {
        this.projects = products;
        this.selectedProject = products[0] ?? null;
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
    // Al cambiar de página se renderizan tarjetas nuevas, por eso se
    // descarta el observer anterior antes de volver a conectar.
    this.cardObserver?.disconnect();

    this.cardObserver = new IntersectionObserver(
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
    sections.forEach((section: Element) => this.cardObserver!.observe(section));
  }

  /* ── PAGINACIÓN ─────────────────────────────────────────── */

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.projects.length / this.pageSize));
  }

  // Solo las tarjetas de la página actual
  get pagedProjects(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.projects.slice(start, start + this.pageSize);
  }

  // Ventana de páginas visibles con elipsis cuando hay muchas (1 … 4 5 6 … 12)
  get visiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 3) {
      start = 2;
      end = 4;
    } else if (current >= total - 2) {
      start = total - 3;
      end = total - 1;
    }

    const pages: (number | string)[] = [1];
    if (start > 2) { pages.push('...'); }
    for (let i = start; i <= end; i++) { pages.push(i); }
    if (end < total - 1) { pages.push('...'); }
    pages.push(total);

    return pages;
  }

  goToPage(page: number | string): void {
    const target = Number(page);
    if (!Number.isFinite(target) || target === this.currentPage) { return; }

    this.currentPage = Math.min(Math.max(target, 1), this.totalPages);
    setTimeout(() => this.observeCards());
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  trackByIndex(index: number): number {
    return index;
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
