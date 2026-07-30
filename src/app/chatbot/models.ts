export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
}

export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}
