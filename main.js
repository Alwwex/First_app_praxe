const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// ============================================================================
// 1. AUTOMATICKÁ OPRAVA SDÍLENÉ PAMĚTI (Řeší pád na notebooku i Pi)
// ============================================================================
app.commandLine.appendSwitch('disable-dev-shm-usage'); // Přesměruje paměť do /tmp, řeší chybu permision na /dev/shm

// Pro Raspberry Pi ponecháme softwarové vykreslování bezpečně zapnuté
if (process.arch === 'arm' || process.arch === 'arm64') {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu');
}

// ============================================================================
// 2. AUTOMATICKÁ INSTALACE USB PRÁV (Udev) BEZ TERMINÁLU
// ============================================================================
function checkAndInstallUdevRules() {
    if (process.platform !== 'linux') return; // Na Windows/macOS udev neexistuje

    const rulePath = '/etc/udev/rules.d/99-wacom.rules';
    
    // Pokud pravidlo ještě neexistuje, nainstalujeme ho pomocí grafického sudo (pkexec)
    if (!fs.existsSync(rulePath)) {
        console.log("Udev pravidlo chybí. Spouštím automatickou instalaci přes systémové okno...");
        
        const ruleContent = 'SUBSYSTEM=="usb", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"\\nSUBSYSTEM=="hidraw", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"';
        
        // pkexec vyvolá nativní systémové okno pro zadání hesla (žádný terminál!)
        const cmd = `pkexec bash -c "echo -e '${ruleContent}' > ${rulePath} && udevadm control --reload-rules && udevadm trigger"`;
        
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error("Uživatel zrušil instalaci USB práv nebo zadal špatné heslo:", error);
            } else {
                console.log("USB udev pravidla byla úspěšně zapsána na pozadí!");
            }
        });
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 700,
        height: 600,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile('index.html');

    // ============================================================================
    // 3. AUTOMATICKÉ PÁROVÁNÍ WEBHID (Už žádné vyskakovací okno Chromia)
    // ============================================================================
    win.webContents.session.on('select-hid-device', (event, details, callback) => {
        event.preventDefault();
        const device = details.deviceList.find((d) => d.vendorId === 1386 && d.productId === 164);
        if (device) {
            callback(device.deviceId);
        } else {
            callback();
        }
    });

    win.webContents.session.setPermissionCheckHandler((webContents, permission) => {
        return permission === 'hid';
    });

    win.webContents.session.setDevicePermissionHandler((details) => {
        return details.deviceType === 'hid' && details.device.vendorId === 1386 && details.device.productId === 164;
    });
}

// Inicializace aplikace
app.whenReady().then(() => {
    checkAndInstallUdevRules(); // Zkontroluje a případně graficky doinstaluje USB udev pravidla
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});