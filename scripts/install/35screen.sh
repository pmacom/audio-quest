#!/bin/bash

echo "Waveshare 3.5\" LCD (A) Installation Script for Bookworm System"
echo "================================================================"

# Update system first
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required dependencies
echo "Installing required dependencies..."
sudo apt install libraspberrypi-dev -y
sudo apt-get install unzip -y
sudo apt-get install cmake -y

# Create installation directory
cd ~
mkdir -p installs
cd ~/installs

# Download and install Waveshare driver
echo "Downloading Waveshare 3.5a driver..."
sudo wget https://files.waveshare.com/upload/1/1e/Waveshare35a.zip
sudo unzip ./Waveshare35a.zip
sudo cp waveshare35a.dtbo /boot/overlays/

# Download and compile fbcp
echo "Downloading and compiling fbcp..."
sudo wget https://files.waveshare.com/upload/1/1e/Rpi-fbcp.zip
sudo unzip ./Rpi-fbcp.zip
cd rpi-fbcp/
sudo rm -rf build
sudo mkdir build
cd build
sudo cmake ..
sudo make -j4
sudo install fbcp /usr/local/bin/fbcp

# Configure /boot/firmware/config.txt
echo "Configuring /boot/firmware/config.txt..."

# First, comment out the vc4-kms-v3d line if it exists
sudo sed -i 's/^dtoverlay=vc4-kms-v3d/#dtoverlay=vc4-kms-v3d/' /boot/firmware/config.txt

# Add Waveshare configuration
sudo tee -a /boot/firmware/config.txt > /dev/null << 'EOF'

# Waveshare 3.5" Display Configuration
dtparam=spi=on
dtoverlay=waveshare35a,rotate=270
hdmi_force_hotplug=1
max_usb_current=1
hdmi_group=2
hdmi_mode=1
hdmi_mode=87
hdmi_cvt 480 320 60 6 0 0 0
hdmi_drive=2
display_rotate=2
EOF

# Configure auto-start with .bash_profile
echo "Configuring auto-start..."
sudo tee ~/.bash_profile > /dev/null << 'EOF'
if [ "$(cat /proc/device-tree/model | cut -d ' ' -f 3)" = "5" ]; then
    # rpi 5B configuration
    export FRAMEBUFFER=/dev/fb1
    startx  2> /tmp/xorg_errors
else
    # Non-pi5 configuration
    export FRAMEBUFFER=/dev/fb0
    fbcp &
    startx  2> /tmp/xorg_errors
fi
EOF

# Configure fbturbo if the file exists
if [ -f /usr/share/X11/xorg.conf.d/99-fbturbo.~ ]; then
    echo "Configuring fbturbo..."
    sudo tee /usr/share/X11/xorg.conf.d/99-fbturbo.~ > /dev/null << 'EOF'
Section "Device"
        Identifier      "Allwinner A10/A13 FBDEV"
        Driver          "fbturbo"
        Option          "fbdev" "/dev/fb0"
        Option          "SwapbuffersWait" "true"
EndSection
EOF
fi

# Configure touch support
echo "Configuring touch support..."

# Install touch calibration software
sudo apt-get install xserver-xorg-input-evdev -y
sudo cp -rf /usr/share/X11/xorg.conf.d/10-evdev.conf /usr/share/X11/xorg.conf.d/45-evdev.conf
sudo apt-get install xinput-calibrator -y

# Create display rotation config for X11
sudo tee /usr/share/X11/xorg.conf.d/98-screen-rotation.conf > /dev/null << 'EOF'
Section "Device"
    Identifier "Raspberry Pi FBDEV"
    Driver "fbdev"
    Option "fbdev" "/dev/fb0"
    Option "Rotate" "UD"
EndSection
EOF

# Create touch calibration config (180-degree rotation)
sudo tee /usr/share/X11/xorg.conf.d/99-calibration.conf > /dev/null << 'EOF'
Section "InputClass"
        Identifier      "calibration"
        MatchProduct    "ADS7846 Touchscreen"
        Option  "Calibration"   "300 3932 3801 294"
        Option  "SwapAxes"      "1"
        Option "EmulateThirdButton" "1"
        Option "EmulateThirdButtonTimeout" "1000"
        Option "EmulateThirdButtonMoveThreshold" "300"
EndSection
EOF

# Set CLI auto-login and disable Wayland
echo "Configuring auto-login and display manager..."
sudo raspi-config nonint do_boot_behaviour B2
sudo raspi-config nonint do_wayland W1

echo ""
echo "Installation completed successfully!"
echo "=================================="
echo ""
echo "IMPORTANT NOTES:"
echo "1. Please ensure your Raspberry Pi username is 'pi' for auto-login to work"
echo "2. After reboot, it may take a while for the system to load and SSH to become available"
echo "3. The system will automatically start the desktop environment on the 3.5\" display"
echo ""
echo "The system will now reboot to apply all changes..."
echo "Press Ctrl+C within 10 seconds to cancel automatic reboot..."

# Give user chance to cancel reboot
sleep 10

sudo reboot

