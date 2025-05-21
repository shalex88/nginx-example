#!/bin/bash

############## Server setup ##########################

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
NGINX_CONF_DIR="/usr/local/nginx/conf"
NGINX_CONF="nginx.conf"

configure_nginx() {
    cp "$SCRIPT_DIR/nginx/$NGINX_CONF.template" "$SCRIPT_DIR/nginx/$NGINX_CONF"
    sed -i "s|@path@|$SCRIPT_DIR|g" "$SCRIPT_DIR/nginx/$NGINX_CONF"

    sudo cp "$SCRIPT_DIR/nginx/$NGINX_CONF" "$NGINX_CONF_DIR/$NGINX_CONF"

    # Add the current user to the www-data group
    sudo usermod -aG www-data $USER

    # Ensure the current user can edit files and directories
    sudo chown -R $USER:www-data "$SCRIPT_DIR/www/html"
    sudo chmod -R 775 "$SCRIPT_DIR/www/html"

    # Set execute permissions on necessary directories
    sudo chmod o+x $HOME
    sudo chmod o+x $SCRIPT_DIR
}

install_nginx() {
    cd "$SCRIPT_DIR"

    sudo apt-get install gcc make libpcre3-dev zlib1g-dev libssl-dev

    git clone https://github.com/nginx/nginx.git -b stable-1.26 nginx_src
    cd nginx_src

    auto/configure \
        --conf-path=$NGINX_CONF_DIR/nginx.conf \
        --with-pcre \
        --with-http_ssl_module \
        --with-http_image_filter_module \
        --with-http_v2_module \
        --with-stream \
        --with-http_addition_module \
        --with-http_mp4_module
    make
    sudo make install
    sudo ln -sf /usr/local/nginx/sbin/nginx /usr/local/sbin/nginx
    nginx -V

    sudo systemctl stop nginx
    sudo systemctl disable nginx
}

# Check if Nginx is already installed
if ! [ -x "$(command -v nginx)" ]; then
    install_nginx
fi

configure_nginx

############## Back-end setup ##########################
# Navigate to the back-end directory
cd "$SCRIPT_DIR/back-end"

install_nodejs() {
    sudo apt-get install -y nodejs npm
}

install_nodejs_packages() {
    # Initialize a new Node.js project if not already done
    if [ ! -f package.json ]; then
        npm init -y
    fi
    npm install express body-parser axios multer
}

if [ ! -x "$(command -v node)" ] || [ ! -f "$SCRIPT_DIR/back-end/package.json" ]; then
    install_nodejs
fi

install_nodejs_packages