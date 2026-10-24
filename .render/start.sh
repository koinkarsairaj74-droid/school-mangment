#!/bin/sh
set -eu
cd /var/www/html
: "${APP_KEY:?Set a private APP_KEY in Render Environment}"
: "${DEMO_ADMIN_PASSWORD:?Set a private DEMO_ADMIN_PASSWORD in Render Environment}"
[ "${#DEMO_ADMIN_PASSWORD}" -ge 16 ] || { echo "DEMO_ADMIN_PASSWORD must be 16+ characters" >&2; exit 1; }
export DB_CONNECTION="${DB_CONNECTION:-sqlite}"
if [ "${DB_CONNECTION}" = sqlite ]; then
  export DB_DATABASE="${DB_DATABASE:-/var/www/html/database/demo.sqlite}"
  mkdir -p "$(dirname "$DB_DATABASE")"
  touch "$DB_DATABASE"
  chown www-data:www-data "$(dirname "$DB_DATABASE")" "$DB_DATABASE"
  chmod 775 "$(dirname "$DB_DATABASE")"
  chmod 664 "$DB_DATABASE"
  echo "DEMO SQLite: records are disposable and must be fictional."
fi
PORT="${PORT:-10000}"
printf 'Listen %s\n' "$PORT" > /etc/apache2/ports.conf
sed -i "s|<VirtualHost \*:10000>|<VirtualHost *:${PORT}>|" /etc/apache2/sites-available/000-default.conf
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app/public bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
php artisan migrate --force --no-interaction
php artisan db:seed --class='Database\Seeders\RenderDemoSeeder' --force --no-interaction
exec apache2-foreground
