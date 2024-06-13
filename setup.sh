#!/bin/bash

############## Server setup ##########################

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Update package lists
sudo apt-get update

# Install Nginx
sudo apt install -y nginx

# Backup original nginx.conf
if [ ! -f /etc/nginx/nginx.conf.backup ]; then
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
fi

# Backup original default site config
if [ ! -f /etc/nginx/sites-available/default.backup ]; then
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
fi

# Create symlink to the new config
sudo ln -sf "$SCRIPT_DIR/nginx/nginx.conf" /etc/nginx/sites-available/default

# Add the current user to the www-data group
sudo usermod -aG www-data $USER

# Ensure the current user can edit files and directories
sudo chown -R $USER:www-data "$SCRIPT_DIR/www/html"
sudo chmod -R 775 "$SCRIPT_DIR/www/html"

# Set execute permissions on necessary directories
sudo chmod o+x $HOME
sudo chmod o+x $SCRIPT_DIR

# Restart Nginx to apply changes
sudo systemctl restart nginx

############## Back-end setup ##########################
# Navigate to the back-end directory
cd "$SCRIPT_DIR/back-end"

# Install Node.js and npm
sudo apt-get install -y nodejs npm

# Initialize a new Node.js project if not already done
if [ ! -f package.json ]; then
  npm init -y
fi

# Install required npm packages
npm install express body-parser

# Ensure any existing node server is stopped
# Find the process ID of node server.js and kill it if running
NODE_PID=$(pgrep -f "node server.js")
if [ -n "$NODE_PID" ]; then
    echo "Stopping existing node server.js process (PID: $NODE_PID)"
    kill -9 $NODE_PID
fi

# Start the server
echo "Starting node server.js"
node server.js &

# Disown the background process to avoid hangups
disown
