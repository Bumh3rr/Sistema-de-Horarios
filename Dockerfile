FROM php:8.2-apache

# Instalar extensiones de PHP necesarias
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Habilitar mod_rewrite de Apache (si lo necesitas)
RUN a2enmod rewrite

# Copiar archivos del proyecto
COPY . /var/www/html/

# Establecer permisos
RUN chown -R www-data:www-data /var/www/html

# Exponer el puerto
EXPOSE 80

# Comando por defecto
CMD ["apache2-foreground"]
