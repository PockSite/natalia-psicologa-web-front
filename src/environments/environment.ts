export const environment = {
  production: false,
  productsApiUrl: 'https://devnataliaproductsapi.pocksite.com/api/v1',
  reservationsApiUrl: 'https://devnataliaressapi.pocksite.com/api/v1',
  notificationsApiUrl: 'https://devnatalianotificationsapi.pocksite.com/api/v1',
  clientsApiUrl: 'https://devnataliaclientsapi.pocksite.com/api/v1',
  paymentsApiUrl: 'https://devnataliapayapi.pocksite.com/api/v1',
  psychologistsApiUrl: 'https://devnataliapsychologistsapi.pocksite.com/api/v1',

  /* Chatbot — pendiente de desplegar.
     Se puede llenar aquí o inyectar en runtime con CHATBOT_API_URL (config.json).
     Vacío = el chat funciona pero avisa que aún no está conectado.
     Ojo: todo lo que va aquí viaja al navegador, así que la llave debe ser pública. */
  chatbotApiUrl: '',
  chatbotApiKey: '',
};
