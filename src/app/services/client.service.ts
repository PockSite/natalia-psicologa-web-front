import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

export const COUNTRY_CODES: CountryCode[] = [
  // ── Latinoamérica (primero) ─────────────────────────────
  { flag: '🇨🇴', name: 'Colombia',            dialCode: '+57'  },
  { flag: '🇦🇷', name: 'Argentina',           dialCode: '+54'  },
  { flag: '🇧🇴', name: 'Bolivia',             dialCode: '+591' },
  { flag: '🇧🇷', name: 'Brasil',              dialCode: '+55'  },
  { flag: '🇨🇱', name: 'Chile',               dialCode: '+56'  },
  { flag: '🇨🇷', name: 'Costa Rica',          dialCode: '+506' },
  { flag: '🇨🇺', name: 'Cuba',                dialCode: '+53'  },
  { flag: '🇩🇴', name: 'Rep. Dominicana',     dialCode: '+1809'},
  { flag: '🇪🇨', name: 'Ecuador',             dialCode: '+593' },
  { flag: '🇸🇻', name: 'El Salvador',         dialCode: '+503' },
  { flag: '🇬🇹', name: 'Guatemala',           dialCode: '+502' },
  { flag: '🇭🇳', name: 'Honduras',            dialCode: '+504' },
  { flag: '🇲🇽', name: 'México',              dialCode: '+52'  },
  { flag: '🇳🇮', name: 'Nicaragua',           dialCode: '+505' },
  { flag: '🇵🇦', name: 'Panamá',              dialCode: '+507' },
  { flag: '🇵🇾', name: 'Paraguay',            dialCode: '+595' },
  { flag: '🇵🇪', name: 'Perú',                dialCode: '+51'  },
  { flag: '🇵🇷', name: 'Puerto Rico',         dialCode: '+1787'},
  { flag: '🇺🇾', name: 'Uruguay',             dialCode: '+598' },
  { flag: '🇻🇪', name: 'Venezuela',           dialCode: '+58'  },
  // ── Resto del mundo ─────────────────────────────────────
  { flag: '🇩🇪', name: 'Alemania',            dialCode: '+49'  },
  { flag: '🇦🇺', name: 'Australia',           dialCode: '+61'  },
  { flag: '🇧🇪', name: 'Bélgica',             dialCode: '+32'  },
  { flag: '🇨🇦', name: 'Canadá',              dialCode: '+1'   },
  { flag: '🇰🇷', name: 'Corea del Sur',       dialCode: '+82'  },
  { flag: '🇪🇸', name: 'España',              dialCode: '+34'  },
  { flag: '🇺🇸', name: 'Estados Unidos',      dialCode: '+1'   },
  { flag: '🇫🇷', name: 'Francia',             dialCode: '+33'  },
  { flag: '🇳🇱', name: 'Holanda',             dialCode: '+31'  },
  { flag: '🇮🇳', name: 'India',               dialCode: '+91'  },
  { flag: '🇮🇹', name: 'Italia',              dialCode: '+39'  },
  { flag: '🇯🇵', name: 'Japón',               dialCode: '+81'  },
  { flag: '🇲🇦', name: 'Marruecos',           dialCode: '+212' },
  { flag: '🇵🇹', name: 'Portugal',            dialCode: '+351' },
  { flag: '🇬🇧', name: 'Reino Unido',         dialCode: '+44'  },
  { flag: '🇷🇺', name: 'Rusia',               dialCode: '+7'   },
  { flag: '🇨🇭', name: 'Suiza',               dialCode: '+41'  },
  { flag: '🇹🇷', name: 'Turquía',             dialCode: '+90'  },
];
import { environment } from '../../environments/environment';

export interface ClientData {
  id: string;
  fullName: string;
  documentTypeId: number;
  document: string;
  sexId?: number;
  birthDate?: string;
  email?: string;
  phoneCountryCode?: string;
  whatsappNumber?: string;
}

export interface DocumentType {
  id: number;
  code: string;
  name: string;
}

export interface SexType {
  id: number;
  code: string;
  name: string;
}

export interface CountryCode {
  flag: string;
  name: string;
  dialCode: string;
}

@Injectable({ providedIn: 'root' })
export class ClientService {

  private readonly apiUrl = environment.clientsApiUrl;

  private documentTypes$: Observable<DocumentType[]> | null = null;
  private sexTypes$: Observable<SexType[]> | null = null;
  private countryCodes$: Observable<CountryCode[]> | null = null;

  constructor(private http: HttpClient) {}

  getDocumentTypes(): Observable<DocumentType[]> {
    if (!this.documentTypes$) {
      this.documentTypes$ = this.http
        .get<DocumentType[]>(`${this.apiUrl}/clients/document-types`)
        .pipe(
          catchError(() => of([])),
          shareReplay(1)
        );
    }
    return this.documentTypes$;
  }

  getSexTypes(): Observable<SexType[]> {
    if (!this.sexTypes$) {
      this.sexTypes$ = this.http
        .get<SexType[]>(`${this.apiUrl}/clients/sexes`)
        .pipe(catchError(() => of([])), shareReplay(1));
    }
    return this.sexTypes$;
  }

  getCountryCodes(): Observable<CountryCode[]> {
    if (!this.countryCodes$) {
      this.countryCodes$ = of(COUNTRY_CODES);
    }
    return this.countryCodes$;
  }

  /** Busca un cliente por código de tipo de documento y número.
   *  Devuelve null si no existe (404) en vez de lanzar error. */
  findByDocument(documentTypeCode: string, document: string): Observable<ClientData | null> {
    return this.getDocumentTypes().pipe(
      switchMap(types => {
        const type = types.find(t => t.code === documentTypeCode);
        if (!type) { return of(null); }
        return this.http
          .get<any>(`${this.apiUrl}/clients/by-document/${type.id}/${document}`)
          .pipe(
            map(c => ({
              id: c.id,
              fullName: c.full_name,
              documentTypeId: c.document_type_id,
              document: c.document,
              sexId: c.sex_id ?? undefined,
              birthDate: c.birth_date ?? undefined,
              email: c.email ?? undefined,
              phoneCountryCode: c.phone_country_code ?? undefined,
              whatsappNumber: c.whatsapp_number ?? undefined,
            })),
            catchError(() => of(null))
          );
      })
    );
  }
}
