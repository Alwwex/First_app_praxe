const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// ============================================================================
// 1. AUTOMATICKÁ DETEKCE A OPRAVA PROSTŘEDÍ (Notebook vs Raspberry Pi)
// ============================================================================
// Tento příkaz řeší chyby se sdílenou pamětí (/dev/shm) univerzálně všude
app.commandLine.appendSwitch('disable-dev-shm-usage');

// Zjistíme, zda jsme na Raspberry Pi (kontrolou architektury ARM nebo přítomnosti boot souboru)
const isRaspberryPi = process.arch === 'arm' || process.arch === 'arm64' || fs.existsSync('/boot/config.txt');

if (isRaspberryPi) {
    // Pokud kód běží na Malině, zapne specifické opravy pro gbm_wrapper a jádro Linuxu
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('no-sandbox'); // Klíčové pro start na 32-bitovém OS 11
    console.log("Detekováno Raspberry Pi: Používám safe-mode grafiky.");
} else {
    console.log("Detekován klasický počítač/notebook: Spouštím v plném výkonu.");
}

// ============================================================================
// 2. AUTOMATICKÁ INSTALACE USB PRÁV (Udev) BEZ TERMINÁLU
// ============================================================================
function checkAndInstallUdevRules() {
    if (process.platform !== 'linux') return; // Na Windows/macOS udev neexistuje

    const rulePath = '/etc/udev/rules.d/99-wacom.rules';
    
    // Pokud pravidlo pro Wacom chybí, nainstalujeme ho přes systémové okno
    if (!fs.existsSync(rulePath)) {
        const ruleContent = 'SUBSYSTEM=="usb", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"\\nSUBSYSTEM=="hidraw", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"';
        
        // pkexec vyvolá systémové grafické okno pro zadání hesla
        const cmd = `pkexec bash -c "echo -e '${ruleContent}' > ${rulePath} && udevadm control --reload-rules && udevadm trigger"`;
        
        exec(cmd, (error) => {
            if (error) {
                console.error("Instalace práv zrušena uživatelem.");
            } else {
                console.log("USB udev pravidla úspěšně nastavena!");
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

// Spuštění Electronu
app.whenReady().then(() => {
    checkAndInstallUdevRules(); 
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
