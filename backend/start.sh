#!/bin/sh
set -eu

normalize_bool() {
  value=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  case "$value" in
    1|true|yes|on) echo "true" ;;
    *) echo "false" ;;
  esac
}

echo "[startup] Running migrations..."
python manage.py migrate --noinput

seed_enabled=$(normalize_bool "${SEED_INTEGRATION_DATA:-False}")
seed_reset=$(normalize_bool "${SEED_INTEGRATION_DATA_RESET:-False}")

if [ "$seed_enabled" = "true" ]; then
  if [ "$seed_reset" = "true" ]; then
    echo "[startup] Seeding integration data with reset..."
    python manage.py seed_integration_data --i-understand --reset
  else
    echo "[startup] Seeding integration data..."
    python manage.py seed_integration_data --i-understand
  fi
else
  echo "[startup] Skipping seed. Set SEED_INTEGRATION_DATA=true to enable."
fi

echo "[startup] Starting gunicorn..."
exec gunicorn moneyio.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 60
