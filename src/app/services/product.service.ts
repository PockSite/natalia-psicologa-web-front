import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { Psychologist } from '../models/psychologist.model';
import { Agenda, Appointment, Day } from '../models/agenda.model';

/** Shapes devueltas por las APIs (snake_case), antes de mapear a los modelos del front. */
interface ApiProduct {
  id: string;
  psychologist_id: string;
  name: string;
  price: number;
  type: { id: number; code: string; name: string; description?: string };
  image?: string;
  short?: string;
  description?: string;
  features?: string[];
  format?: string;
  category?: string;
  language?: string;
}

interface ApiPsychologist {
  id: string;
  full_name: string;
  email?: string;
  whatsapp_number?: string;
}

interface ApiAppointment {
  id: string;
  day_id: number;
  start_time: string;
}

interface ApiDay {
  id: number;
  agenda_id: string;
  week_day: string;
  appointments: ApiAppointment[];
}

interface ApiAgenda {
  id: string;
  psychologist_id: string;
  google_calendar_id: string;
  days: ApiDay[];
}

interface ApiAvailabilitySlot {
  start_time: string;
  available: boolean;
}

interface ApiAvailability {
  psychologist_id: string;
  date: string;
  slots: ApiAvailabilitySlot[];
}

/** Mapeo de días en español (DB) a número JS (0=domingo…6=sábado) */
const WEEKDAY_ES: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3,
  jueves: 4, viernes: 5, sabado: 6
};

@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly productsApiUrl = environment.productsApiUrl;
  private readonly reservationsApiUrl = environment.reservationsApiUrl;

  constructor(private http: HttpClient) { }

  /** Lista completa de productos y servicios */
  getProducts(): Observable<Product[]> {
    return this.http.get<ApiProduct[]>(`${this.productsApiUrl}/products/`)
      .pipe(map(products => products.map(p => this.toProduct(p))));
  }

  /** Producto puntual por id (lo consume product-detail en su ngOnInit) */
  getProductById(id: string): Observable<Product | undefined> {
    return this.http.get<ApiProduct>(`${this.productsApiUrl}/products/${id}`)
      .pipe(map(p => this.toProduct(p)));
  }

  /** Todas las psicólogas registradas */
  getPsychologists(): Observable<Psychologist[]> {
    return this.http.get<ApiPsychologist[]>(`${this.productsApiUrl}/psychologists/`)
      .pipe(map(list => list.map(p => this.toPsychologist(p))));
  }

  /** Psicóloga puntual por id */
  getPsychologistById(id: string): Observable<Psychologist | undefined> {
    return this.http.get<ApiPsychologist>(`${this.productsApiUrl}/psychologists/${id}`)
      .pipe(map(p => this.toPsychologist(p)));
  }

  /** Psicóloga(s) que ofrecen un producto. Hoy cada producto tiene una sola autora. */
  getPsychologistsByProduct(productId: string): Observable<Psychologist[]> {
    return this.getProductById(productId).pipe(
      switchMap(product => {
        if (!product) { return of([]); }
        return this.getPsychologistById(product.psychologistId).pipe(
          map(psychologist => psychologist ? [psychologist] : [])
        );
      })
    );
  }

  /**
   * Plantilla de agenda: devuelve el conjunto de días de la semana (0-6)
   * en que trabaja la psicóloga, sin consultar disponibilidad real.
   * El componente usa esto para marcar los días clickeables en el calendario.
   */
  getAgendaTemplate(psychologistId: string): Observable<Set<number>> {
    return this.http.get<ApiAgenda>(`${this.reservationsApiUrl}/agendas/psychologist/${psychologistId}`).pipe(
      map(apiAgenda => new Set(
        apiAgenda.days.map(d => WEEKDAY_ES[d.week_day.toLowerCase()] ?? -1).filter(n => n >= 0)
      ))
    );
  }

  getMonthAvailability(psychologistId: string, year: number, month: number): Observable<Map<string, Day>> {
    return this.http.get<{ days: ApiAvailability[] }>(
      `${this.reservationsApiUrl}/reservations/availability/${psychologistId}`,
      { params: { year: String(year), month: String(month) } }
    ).pipe(
      map(response => {
        const map = new Map<string, Day>();
        for (const av of response.days) {
          const date = new Date(av.date + 'T00:00:00');
          map.set(av.date, this.toDay(date, av));
        }
        return map;
      })
    );
  }

  /**
   * Registra la compra de un producto digital.
   * El backend deberá responder con la confirmación de la orden.
   */
  createOrder(payload: unknown): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.productsApiUrl}/orders`, payload);
  }

  /** Reserva una cita (appointment) en la agenda de la psicóloga. */
  bookAppointment(payload: { psychologistId: string; startTime: Date; clientName: string; clientEmail: string; description?: string }): Observable<{ ok: boolean }> {
    const body = {
      psychologist_id: payload.psychologistId,
      client_name: payload.clientName,
      client_email: payload.clientEmail,
      start_time: payload.startTime.toISOString(),
      description: payload.description ?? null,
    };
    return this.http.post(`${this.reservationsApiUrl}/reservations/`, body)
      .pipe(map(() => ({ ok: true })));
  }

  /* ── Mapeo API → modelos del front ── */

  private toProduct(p: ApiProduct): Product {
    return {
      id: p.id,
      psychologistId: p.psychologist_id,
      name: p.name,
      price: p.price,
      type: { id: p.type.id, code: p.type.code, name: p.type.name, description: p.type.description },
      image: p.image ?? '',
      short: p.short ?? '',
      description: p.description ?? '',
      features: p.features ?? [],
      format: p.format,
      category: p.category,
      language: p.language,
    };
  }

  private toPsychologist(p: ApiPsychologist): Psychologist {
    return {
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      whatsappNumber: p.whatsapp_number,
    };
  }

  private toDay(date: Date, availability: ApiAvailability): Day {
    const appointments: Appointment[] = availability.slots.map((slot, i) => {
      const [h, m] = slot.start_time.split(':').map(Number);
      const end = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return {
        id: `${availability.date}-${slot.start_time}-${i}`,
        startTime: slot.start_time,
        endingTime: end,
        available: slot.available,
      };
    });
    return { id: `day-${availability.date}`, date, appointments };
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
