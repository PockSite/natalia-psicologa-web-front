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
  description?: string;
}

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
          catchError(err => {
            console.error('[PsychologistService] No se pudo cargar el equipo', err);
            // Se descarta la caché para reintentar la próxima vez que se pida:
            // con shareReplay, una lista vacía quedaría fijada para siempre.
            this.psychologists$ = null;
            return of([] as Psychologist[]);
          }),
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

  /** Fuerza recargar el equipo en la próxima consulta. */
  refresh(): void {
    this.psychologists$ = null;
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
      description: p.description,
    };
  }
}
