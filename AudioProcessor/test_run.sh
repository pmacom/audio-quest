#!/bin/bash

# Test script for AudioProcessor with automatic input selection
echo "Running AudioProcessor with automatic selections..."
echo -e "0\n1\n0" | ./target/release/audio-websocket-server  # Select first audio device, 30Hz, and TUI mode 