export const environment = {
  production: true,
  productsApiUrl: 'https://nataliaproductsapi.pocksite.com/api/v1',
  reservationsApiUrl: 'https://nataliareservationsapi.pocksite.com/api/v1',
  notificationsApiUrl: 'https://natalianotificationsapi.pocksite.com/api/v1',
  clientsApiUrl: 'https://nataliaclientsapi.pocksite.com/api/v1',
  paymentsApiUrl: 'https://nataliapaymentsapi.pocksite.com/api/v1',
  psychologistsApiUrl: 'https://nataliapsychologistsapi.pocksite.com/api/v1',

  /* Chatbot — pendiente de desplegar.
     En producción se inyecta en runtime con CHATBOT_API_URL / CHATBOT_API_KEY (Dokploy).
     Vacío = el chat funciona pero avisa que aún no está conectado.
     Ojo: todo lo que va aquí viaja al navegador, así que la llave debe ser pública. */
  chatbotApiUrl: '',
  chatbotApiKey: '',
};
