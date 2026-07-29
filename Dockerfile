FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration development

FROM nginx:alpine
COPY --from=builder /app/dist/my-landing /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Config runtime: template + script que genera assets/config.json al arrancar
COPY config.template.json /usr/share/nginx/html/assets/config.template.json
COPY docker-entrypoint.d/40-envsubst-config.sh /docker-entrypoint.d/40-envsubst-config.sh
RUN chmod +x /docker-entrypoint.d/40-envsubst-config.sh

EXPOSE 80
