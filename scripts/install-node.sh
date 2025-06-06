#!/bin/bash

# Exit on any error
set -e

echo "Starting installation of Node.js, pnpm, and Next.js dependencies..."

# Update package lists
sudo apt update

# Install prerequisites
sudo apt install -y curl build-essential git

# Install Node.js (LTS version) using NodeSource
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js and npm installation
node --version
npm --version

# Update npm to the latest version to avoid potential issues
echo "Updating npm..."
sudo npm install -g npm@latest
npm --version

# Install pnpm globally with sudo to avoid permission issues
echo "Installing pnpm..."
sudo npm install -g pnpm
pnpm --version

# Install create-next-app globally with sudo
echo "Installing create-next-app..."
sudo pnpm install -g create-next-app

# Verify create-next-app
create-next-app --version

# Install additional dependencies for Next.js (e.g., for native modules or image processing)
echo "Installing additional dependencies..."
sudo apt install -y libpng-dev libjpeg-dev

echo "Installation and setup complete! You can now use 'cd my-next-app' and 'pnpm dev' to start your Next.js app."