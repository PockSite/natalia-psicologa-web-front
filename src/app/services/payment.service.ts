import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Acompañante de una consulta con varios asistentes (ej. terapia de pareja). */
export interface CheckoutAttendee {
  full_name: string;
  email: string;
  phone_country_code?: string | null;
  whatsapp_number: string;
  document: string;
  document_type: string;
  sex_id?: number | null;
  birth_date?: string | null;
}

export interface CheckoutPayload {
  productId: string;
  clientFullName: string;
  clientEmail: string;
  clientPhoneCountryCode?: string;
  clientWhatsappNumber: string;
  document: string;
  documentType: string;
  sexId?: number | null;
  birthDate?: string;
  startTime?: Date;
  psychologist_id?: string;
  /** Solo los acompañantes; el titular va en los campos client* de arriba. */
  attendees?: CheckoutAttendee[];
}

export interface CheckoutResponse {
  public_key: string;
  reference: string;
  product_id: string;
  product_name: string;
  amount_in_cents: number;
  currency: string;
  signature: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private readonly apiUrl = environment.paymentsApiUrl;

  constructor(private http: HttpClient) { }

  /** Inicia el checkout: el backend crea la referencia/firma de Wompi y deja la compra pendiente del webhook. */
  checkout(payload: CheckoutPayload): Observable<CheckoutResponse> {
    const body = {
      product_id: payload.productId,
      client_full_name: payload.clientFullName,
      client_email: payload.clientEmail,
      client_phone_country_code: payload.clientPhoneCountryCode ?? null,
      client_whatsapp_number: payload.clientWhatsappNumber,
      document: payload.document,
      document_type: payload.documentType,
      sex_id: payload.sexId ?? null,
      birth_date: payload.birthDate ?? null,
      start_time: payload.startTime ? payload.startTime.toISOString() : null,
      psychologist_id: payload.psychologist_id ?? null,
      attendees: payload.attendees ?? [],
    };
    return this.http.post<CheckoutResponse>(`${this.apiUrl}/payments/checkout`, body);
  }

  /** Obtiene el estado de una transacción por su ID. */
  getTransaction(transactionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/transactions/${transactionId}`);
  }

  /** Abre el widget de Wompi con los datos firmados por el backend. */
  openWompiWidget(checkout: CheckoutResponse, redirectUrl?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const WidgetCheckout = (window as any).WidgetCheckout;
      if (!WidgetCheckout) {
        reject(new Error('Widget de Wompi no cargado. Verifica el script en index.html.'));
        return;
      }
      const config: any = {
        currency: checkout.currency,
        amountInCents: checkout.amount_in_cents,
        reference: checkout.reference,
        publicKey: checkout.public_key,
        signature: { integrity: checkout.signature },
      };
      if (redirectUrl) {
        // El WAF de Wompi rechaza (403) redirect-url con localhost/127.0.0.1 y el
        // widget se queda cargando. En dev lo reemplazamos por lvh.me, un dominio
        // público que resuelve a 127.0.0.1, así el redirect vuelve al ng serve local.
        config.redirectUrl = redirectUrl.replace(
          /^(https?:\/\/)(localhost|127\.0\.0\.1)/i,
          '$1lvh.me'
        );
      }
      const widget = new WidgetCheckout(config);
      widget.open((result: any) => resolve(result));
    });
  }
}
