import { writeFileSync } from 'fs';

const content = `export const environment = {
  production: ${process.env.PRODUCTION || 'false'},
  productsApiUrl: '${process.env.PRODUCTS_API_URL || ''}',
  reservationsApiUrl: '${process.env.RESERVATIONS_API_URL || ''}',
  notificationsApiUrl: '${process.env.NOTIFICATIONS_API_URL || ''}',
  clientsApiUrl: '${process.env.CLIENTS_API_URL || ''}',
  paymentsApiUrl: '${process.env.PAYMENTS_API_URL || ''}',
  psychologistsApiUrl: '${process.env.PSYCHOLOGISTS_API_URL || ''}',
};
`;

writeFileSync('./src/environments/environment.ts', content);
console.log('environment.ts generado correctamente');
