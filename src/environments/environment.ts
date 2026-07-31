export const environment = {
  production: false,
  productsApiUrl: 'https://devnataliaproductsapi.pocksite.com/api/v1',
  reservationsApiUrl: 'https://devnataliaressapi.pocksite.com/api/v1',
  notificationsApiUrl: 'https://devnatalianotificationsapi.pocksite.com/api/v1',
  clientsApiUrl: 'https://devnataliaclientsapi.pocksite.com/api/v1',
  paymentsApiUrl: 'https://devnataliapayapi.pocksite.com/api/v1',
  psychologistsApiUrl: 'https://devnataliapsychologistsapi.pocksite.com/api/v1',

  /* Chatbot — se puede llenar aquí o inyectar en runtime con CHATBOT_API_URL (config.json).
     Vacío = el widget de chat queda desactivado.
     El endpoint no usa API key: se protege con CORS + rate limit por IP. */
  chatbotApiUrl: 'https://devnataliachatbotapi.pocksite.com/api/v1/chatbot',
};
