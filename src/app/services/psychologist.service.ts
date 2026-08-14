import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Psychologist } from '../models/psychologist.model';

/** Shape que devuelve la API de psicólogas (snake_case), antes de mapear al modelo del front. */
interface ApiPsychologist {
  id: string;
  full_name: string;
  email?: string;
  whatsapp_country_code?: string;
  whatsapp_number?: string;
  photo?: string;
  headline?: string;
  years_experience?: number;
}

/**
 * Datos de muestra para poder ver la sección mientras la API de psicólogas
 * (environment.psychologistsApiUrl) todavía no responde.
 *
 * TODO: eliminar esta constante y el `catchError` que la usa cuando el endpoint
 * esté configurado. Es lo único que hay que borrar para quedarse solo con la API.
 */
export const FALLBACK_PSYCHOLOGISTS: Psychologist[] = [
  {
    id: 'demo-1',
    fullName: 'Natalia Güechá',
    headline: 'Psicóloga clínica · Intervención en crisis',
    yearsExperience: 8,
    photo: 'assets/images/fotografia1.jpeg',
    whatsappCountryCode: '+57',
    whatsappNumber: '3104671284',
  },
  {
    id: 'demo-2',
    fullName: 'Nombre de la profesional',
    headline: 'Psicóloga clínica · Terapia de pareja',
    yearsExperience: 6,
    photo: 'assets/images/fotografia3.jpeg',
  },
  {
    id: 'demo-3',
    fullName: 'Nombre de la profesional',
    headline: 'Psicóloga clínica · Infancia y adolescencia',
    yearsExperience: 5,
    photo: 'assets/images/fotografia4.jpeg',
  },
];

@Injectable({ providedIn: 'root' })
export class PsychologistService {

  private readonly apiUrl = environment.psychologistsApiUrl;

  /** Se cachea para que la sección no vuelva a pedir la lista en cada render. */
  private psychologists$: Observable<Psychologist[]> | null = null;

  constructor(private http: HttpClient) { }

  /** Equipo completo del consultorio. */
  getPsychologists(): Observable<Psychologist[]> {
    if (!this.psychologists$) {
      this.psychologists$ = this.http
        .get<ApiPsychologist[]>(`${this.apiUrl}/psychologists/`)
        .pipe(
          map(list => (list ?? []).map(p => this.toPsychologist(p))),
          // Un 200 con lista vacía dejaría la sección en blanco: se trata como "sin datos aún".
          map(list => list.length ? list : this.withFallback('respuesta vacía')),
          catchError(() => of(this.withFallback('la API no respondió'))),
          shareReplay(1)
        );
    }
    return this.psychologists$;
  }

  /** Psicóloga puntual por id. */
  getPsychologistById(id: string): Observable<Psychologist | undefined> {
    return this.getPsychologists().pipe(
      map(list => list.find(p => p.id === id))
    );
  }

  /* ── Mapeo API → modelo del front ── */

  private toPsychologist(p: ApiPsychologist): Psychologist {
    return {
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      whatsappCountryCode: p.whatsapp_country_code,
      whatsappNumber: p.whatsapp_number,
      photo: p.photo,
      headline: p.headline,
      yearsExperience: p.years_experience,
    };
  }

  /** TODO: borrar junto con FALLBACK_PSYCHOLOGISTS al conectar la API. */
  private withFallback(reason: string): Psychologist[] {
    console.warn(`[PsychologistService] ${reason}; mostrando datos de muestra.`);
    return FALLBACK_PSYCHOLOGISTS;
  }
}
