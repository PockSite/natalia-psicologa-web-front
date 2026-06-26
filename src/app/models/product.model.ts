/**
 * Modelos de dominio basados en el diagrama de clases:
 * psychologist 1 ── 0..* product
 * psychologist 1 ── 1   agenda 1 ── 0..* day 1 ── 0..* appointment
 */

export type ProductType = 'producto' | 'servicio';

export interface Psychologist {
  id: string;
  fullName: string;
  /**
   * Agregación psychologist ◇── 0..* product del UML:
   * ids de los productos / servicios que esta psicóloga ofrece o atiende.
   */
  productIds: string[];
  /* Atributos de presentación (no están en el UML, pero los necesita la UI) */
  photo?: string;
  headline?: string;
  yearsExperience?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  /**
   * Psicóloga creadora / dueña del producto. En los productos digitales es
   * la única que se muestra; en los servicios define la profesional por defecto.
   */
  psychologistId: string;
  /* Atributos de presentación para las vistas de catálogo y detalle */
  type: ProductType;
  image: string;
  short: string;
  description: string;
  features: string[];
  format?: string;
  category?: string;
  rating?: string;
  students?: string;
  language?: string;
  guarantee?: string;
}

export interface Appointment {
  id: string;
  available: boolean;
  /** Hora de inicio en formato HH:mm (necesaria para mostrar los cupos) */
  startTime: string;
  /** Hora de fin en formato HH:mm */
  endingTime: string;
}

export interface Day {
  id: string;
  date: Date;
  appointments: Appointment[];
}

export interface Agenda {
  id: string;
  days: Day[];
}
