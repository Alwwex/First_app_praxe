#!/bin/bash

# 1. Zjistíme, kde přesně se složka s aplikací nachází
APP_DIR=$(pwd)
HTML_PATH="$APP_DIR/index.html"

echo "Instaluji podpisovou aplikaci Wacom..."

# 2. Nastavení USB práv (Udev) - vyžádá si heslo
if [ ! -f "/etc/udev/rules.d/99-wacom.rules" ]; then
    echo "Nastavuji přístup k USB tabletu. Prosím, zadej heslo:"
    echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"' | sudo tee /etc/udev/rules.d/99-wacom.rules
    echo 'SUBSYSTEM=="hidraw", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"' | sudo tee -a /etc/udev/rules.d/99-wacom.rules
    sudo udevadm control --reload-rules && sudo udevadm trigger
fi

# 3. Vytvoření ikony (Zástupce) na ploše
DESKTOP_FILE="$HOME/Desktop/Wacom-Podpis.desktop"

echo "[Desktop Entry]
Version=1.0
Name=Wacom Podpis
Comment=Aplikace pro tablet STU-430
Exec=chromium-browser --app=file://$HTML_PATH --window-size=750,650
Terminal=false
Type=Application
Categories=Utility;
" > "$DESKTOP_FILE"

# Dáme ikoně právo ke spuštění
chmod +x "$DESKTOP_FILE"

echo "HOTOVO! Na ploše máš novou ikonu 'Wacom Podpis'."
