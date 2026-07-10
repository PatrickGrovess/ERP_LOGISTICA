FROM php:8.2-fpm-alpine

# Instalar extensiones del sistema y de PHP necesarias para MySQL
RUN apk add --no-cache libpng-dev libjpeg-turbo-dev freetype-dev zip libzip-dev unzip git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd zip

# Instalar Composer (El gestor de dependencias de PHP) de manera global
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html