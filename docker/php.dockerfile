FROM php:8.2-fpm-alpine

RUN apk add --no-cache libpng-dev libjpeg-turbo-dev freetype-dev zip libzip-dev unzip git oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd zip mbstring

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY backend/ ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

EXPOSE 9000
