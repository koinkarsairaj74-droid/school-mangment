# Render Docker runtime — isolated Laravel DEMO ONLY.
# The existing static GitHub Pages demo remains on main.
# The Laravel source is cloned from the user's separate public fork.
# PHP 8.1 and Laravel 8 are unsupported: DO NOT use for real records.
FROM php:8.1-apache
ENV COMPOSER_ALLOW_SUPERUSER=1
WORKDIR /var/www/html
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libzip-dev libsqlite3-dev libpq-dev libonig-dev libxml2-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" pdo_mysql pdo_pgsql pdo_sqlite mbstring zip bcmath gd \
 && a2enmod rewrite headers \
 && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2.8 /usr/bin/composer /usr/local/bin/composer
RUN git clone --depth 1 --branch master https://github.com/sairajkoinkar27-hash/lav_sms.git /tmp/legacy-lav-sms \
 && cp -a /tmp/legacy-lav-sms/. /var/www/html/ \
 && rm -rf /tmp/legacy-lav-sms /var/www/html/.git
COPY .render/prepare.sh /tmp/prepare-lav.sh
COPY .render/start.sh /usr/local/bin/lav-start
COPY .render/apache.conf /etc/apache2/sites-available/000-default.conf
COPY .render/RenderDemoSeeder.php /var/www/html/database/seeders/RenderDemoSeeder.php
RUN sh /tmp/prepare-lav.sh && chmod +x /usr/local/bin/lav-start \
 && mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache
EXPOSE 10000
CMD ["/usr/local/bin/lav-start"]
