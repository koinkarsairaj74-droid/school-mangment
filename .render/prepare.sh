#!/bin/sh
set -eu
cd /var/www/html
# Stop anonymous account creation on public demo.
sed -i 's/Auth::routes();/Auth::routes(["register" => false]);/' routes/web.php
# Forwarded HTTPS links/assets behind Render's reverse proxy (demo-only).
sed -i "s/protected \\\$proxies;/protected \\\$proxies = '*';/" app/Http/Middleware/TrustProxies.php
# The legacy migration adds foreign keys after table creation, unsupported on
# SQLite without a rebuilt table. Demo skips only these FK alterations.
sed -i "/Schema::table('lgas'/i\\        if (config('database.default') === 'sqlite') { return; }" database/migrations/2019_09_22_142514_create_fks.php
composer install --no-dev --prefer-dist --no-progress --no-interaction --optimize-autoloader
php -l routes/web.php
php -l database/migrations/2019_09_22_142514_create_fks.php
php -l database/seeders/RenderDemoSeeder.php
