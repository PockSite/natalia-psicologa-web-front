#!/bin/sh
set -e

# Genera assets/config.json en runtime a partir de las variables de entorno.
# Valores por defecto (vacío) para no romper el JSON si falta alguna.
: "${PRODUCTION:=true}"
: "${PRODUCTS_API_URL:=}"
: "${RESERVATIONS_API_URL:=}"
: "${NOTIFICATIONS_API_URL:=}"
: "${CLIENTS_API_URL:=}"
: "${PAYMENTS_API_URL:=}"
: "${PSYCHOLOGISTS_API_URL:=}"

export PRODUCTION PRODUCTS_API_URL RESERVATIONS_API_URL NOTIFICATIONS_API_URL \
       CLIENTS_API_URL PAYMENTS_API_URL PSYCHOLOGISTS_API_URL

TEMPLATE=/usr/share/nginx/html/assets/config.template.json
OUTPUT=/usr/share/nginx/html/assets/config.json

envsubst < "$TEMPLATE" > "$OUTPUT"

echo "[entrypoint] config.json generado:"
cat "$OUTPUT"
