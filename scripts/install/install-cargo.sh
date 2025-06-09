#!/bin/bash

# Update package lists
sudo apt update

# Install prerequisites
sudo apt install -y curl build-essential

# Download and run the Rust installation script
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Source the environment to make cargo available in the current session
source "$HOME/.cargo/env"

# Verify installation
cargo --version

# Install prerequisites for building native Node.js modules
sudo apt-get install libasound2-dev pkg-config

echo "Cargo has been installed successfully!"
