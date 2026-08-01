export const environment = {
  production: true,
  productsApiUrl: 'https://nataliaproductsapi.pocksite.com/api/v1',
  reservationsApiUrl: 'https://nataliareservationsapi.pocksite.com/api/v1',
  notificationsApiUrl: 'https://natalianotificationsapi.pocksite.com/api/v1',
  clientsApiUrl: 'https://nataliaclientsapi.pocksite.com/api/v1',
  paymentsApiUrl: 'https://nataliapaymentsapi.pocksite.com/api/v1',
  psychologistsApiUrl: 'https://nataliapsychologistsapi.pocksite.com/api/v1',

  /* Chatbot — en producción se inyecta en runtime con CHATBOT_API_URL (Dokploy).
     Vacío = el widget de chat queda desactivado.
     El endpoint no usa API key: se protege con CORS + rate limit por IP. */
  chatbotApiUrl: 'https://nataliachatbotapi.pocksite.com/api/v1',
};
