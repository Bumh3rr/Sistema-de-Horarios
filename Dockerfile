FROM php:8.2-apache

# Instalar extensiones de PHP necesarias
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Configurar ServerName
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Habilitar mod_rewrite
RUN a2enmod rewrite

# Copiar archivos del proyecto
COPY . /var/www/html/

# Establecer permisos
RUN chown -R www-data:www-data /var/www/html

# Crear script de inicio que configure el puerto dinámicamente
RUN echo '#!/bin/bash' > /usr/local/bin/start-apache.sh && \
    echo 'set -e' >> /usr/local/bin/start-apache.sh && \
    echo 'PORT=${PORT:-8080}' >> /usr/local/bin/start-apache.sh && \
    echo 'sed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf' >> 
/usr/local/bin/start-apache.sh && \
    echo 'sed -i "s/<VirtualHost \*:80>/<VirtualHost *:$PORT>/g" 
/etc/apache2/sites-available/000-default.conf' >> 
/usr/local/bin/start-apache.sh && \
    echo 'exec apache2-foreground' >> /usr/local/bin/start-apache.sh && \
    chmod +x /usr/local/bin/start-apache.sh

EXPOSE 8080

CMD ["/usr/local/bin/start-apache.sh"]
