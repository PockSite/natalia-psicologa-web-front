import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from './service';
import { ChatMessage } from './models';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {

  @ViewChild('messagesArea') private messagesArea?: ElementRef<HTMLElement>;

  isOpen = false;
  userMessage = '';
  isLoading = false;

  messages: ChatMessage[] = [
    {
      text: '¡Hola! 👋 Soy el asistente virtual de Natalia Güechá. ¿En qué puedo ayudarte hoy?',
      sender: 'bot'
    }
  ];

  constructor(private chatService: ChatService) { }

  /** Mientras no exista la API respondemos localmente en vez de fallar. */
  get isConfigured(): boolean {
    return this.chatService.isConfigured;
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) { this.scrollToBottom(); }
  }

  sendMessage(): void {
    const text = this.userMessage.trim();
    if (!text || this.isLoading) { return; }

    this.push({ text, sender: 'user' });
    this.userMessage = '';

    if (!this.isConfigured) {
      this.push({
        text: 'Por ahora estoy en construcción 🛠️ Mientras tanto puedes escribirle a '
            + 'Natalia por WhatsApp con el botón verde y te responde directamente.',
        sender: 'bot'
      });
      return;
    }

    this.isLoading = true;

    this.chatService.sendMessage(text).subscribe({
      next: response => {
        this.isLoading = false;
        this.push({
          text: response?.response?.trim() || 'No pude responder en este momento 😕',
          sender: 'bot'
        });
      },
      error: error => {
        console.error('[Chatbot] Error al consultar la API:', error);
        this.isLoading = false;
        this.push({
          text: 'Lo siento, ocurrió un error al conectar con el servidor. '
              + 'Intenta de nuevo en un momento.',
          sender: 'bot'
        });
      }
    });
  }

  private push(message: ChatMessage): void {
    this.messages.push(message);
    this.scrollToBottom();
  }

  /** setTimeout para leer scrollHeight después de que Angular pinte el mensaje. */
  private scrollToBottom(): void {
    setTimeout(() => {
      const area = this.messagesArea?.nativeElement;
      if (area) { area.scrollTop = area.scrollHeight; }
    });
  }
}
