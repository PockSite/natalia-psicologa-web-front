import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatRequest, ChatResponse } from './models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient) { }

  /** Se lee en cada llamada porque config.json puede sobrescribirla en runtime. */
  private get baseUrl(): string {
    return (environment.chatbotApiUrl ?? '').replace(/\/+$/, '');
  }

  /** false mientras no exista la API del chatbot: el componente responde sin llamarla. */
  get isConfigured(): boolean {
    return !!this.baseUrl;
  }

  sendMessage(message: string): Observable<ChatResponse> {

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const body: ChatRequest = { message };

    return this.http.post<ChatResponse>(
      `${this.baseUrl}/chat`,
      body,
      { headers }
    );
  }
}
