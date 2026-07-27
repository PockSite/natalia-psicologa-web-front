FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

# Variables de entorno de build (Dokploy las inyecta como build args)
ARG PRODUCTION=false
ARG PRODUCTS_API_URL
ARG RESERVATIONS_API_URL
ARG NOTIFICATIONS_API_URL
ARG CLIENTS_API_URL
ARG PAYMENTS_API_URL
ARG PSYCHOLOGISTS_API_URL

ENV PRODUCTION=$PRODUCTION \
    PRODUCTS_API_URL=$PRODUCTS_API_URL \
    RESERVATIONS_API_URL=$RESERVATIONS_API_URL \
    NOTIFICATIONS_API_URL=$NOTIFICATIONS_API_URL \
    CLIENTS_API_URL=$CLIENTS_API_URL \
    PAYMENTS_API_URL=$PAYMENTS_API_URL \
    PSYCHOLOGISTS_API_URL=$PSYCHOLOGISTS_API_URL

RUN npm run build -- --configuration development

FROM nginx:alpine
COPY --from=builder /app/dist/my-landing /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
