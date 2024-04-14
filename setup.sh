#!/usr/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
echo $SCRIPT_DIR

sudo apt install -y nginx

# Backup original nginx.conf
if [ ! -f /etc/nginx/nginx.conf.backup ]; then
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
fi

# Backup original default site config
if [ ! -f /etc/nginx/sites-available/default.backup ]; then
    sudo mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
fi

# Create symlink to the new config
sudo ln -sf "$SCRIPT_DIR"/nginx/nginx.conf /etc/nginx/sites-available/default

# Add the current user to the www-data group
sudo usermod -aG www-data $USER

# Ensure the current user can edit files and directories
sudo chown -R $USER:www-data "$SCRIPT_DIR"/www/html
sudo chmod -R 775 "$SCRIPT_DIR"/www/html

# Set execute permissions on necessary directories
sudo chmod o+x $HOME
sudo chmod o+x $SCRIPT_DIR

# Restart nginx to apply changes
sudo systemctl restart nginx
