#!/bin/bash

############## Server setup ##########################

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

configure() {
    # Backup original nginx.conf
    if [ ! -f /etc/nginx/nginx.conf.backup ]; then
        cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    fi

    # Backup original default site config
    if [ ! -f /etc/nginx/sites-available/default.backup ]; then
        cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
    fi

    cp "$SCRIPT_DIR/nginx/nginx.conf.template" "$SCRIPT_DIR/nginx/nginx.conf"
    sed -i "s|@path@|$SCRIPT_DIR|g" "$SCRIPT_DIR/nginx/nginx.conf"

    # Create symlink to the new config
    ln -sf "$SCRIPT_DIR/nginx/nginx.conf" /etc/nginx/sites-available/default

    # Add the current user to the www-data group
    usermod -aG www-data $USER

    # Ensure the current user can edit files and directories
    chown -R $USER:www-data "$SCRIPT_DIR/www/html"
    chmod -R 775 "$SCRIPT_DIR/www/html"

    # Set execute permissions on necessary directories
    chmod o+x $HOME
    chmod o+x $SCRIPT_DIR
}

install() {
    apt update
    apt install -y nginx
    systemctl stop nginx
    systemctl disable nginx
}

# Check if Nginx is already installed
if ! [ -x "$(command -v nginx)" ]; then
    install
fi

configure

############## Back-end setup ##########################
# Navigate to the back-end directory
cd "$SCRIPT_DIR/back-end"

install_nodejs() {
    apt-get install -y nodejs npm
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