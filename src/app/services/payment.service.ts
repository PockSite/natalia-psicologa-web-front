import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckoutPayload {
  productId: string;
  clientFullName: string;
  clientEmail: string;
  clientWhatsappNumber: string;
  document: string;
  documentType: string;
  startTime?: Date;
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
      client_whatsapp_number: payload.clientWhatsappNumber,
      document: payload.document,
      document_type: payload.documentType,
      start_time: payload.startTime ? payload.startTime.toISOString() : null,
    };
    return this.http.post<CheckoutResponse>(`${this.apiUrl}/payments/checkout`, body);
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
      // El WAF de Wompi bloquea (403) redirect-url apuntando a localhost/127.0.0.1.
      // En dev lo omitimos: el resultado del pago llega igual por el callback.
      if (redirectUrl && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(redirectUrl)) {
        config.redirectUrl = redirectUrl;
      }
      const widget = new WidgetCheckout(config);
      widget.open((result: any) => resolve(result));
    });
  }
}
