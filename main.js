const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// ============================================================================
// 1. AUTOMATICKÁ DETEKCE A OPRAVA VYKRESLOVÁNÍ
// ============================================================================
app.commandLine.appendSwitch('disable-dev-shm-usage');

const isRaspberryPi = process.arch === 'arm' || process.arch === 'arm64' || fs.existsSync('/boot/config.txt');

if (isRaspberryPi) {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu');
    // Vynutíme softwarové překreslování, aby okno nezůstalo černé/bílé
    app.commandLine.appendSwitch('disable-software-rasterizer', 'false');
    app.commandLine.appendSwitch('no-sandbox');
    console.log("Detekováno Raspberry Pi: Používám safe-mode softwarové grafiky.");
} else {
    console.log("Detekován klasický počítač/notebook: Spouštím v plném výkonu.");
}

function checkAndInstallUdevRules() {
    if (process.platform !== 'linux') return;

    const rulePath = '/etc/udev/rules.d/99-wacom.rules';
    
    if (!fs.existsSync(rulePath)) {
        const ruleContent = 'SUBSYSTEM=="usb", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"\\nSUBSYSTEM=="hidraw", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"';
        const cmd = `pkexec bash -c "echo -e '${ruleContent}' > ${rulePath} && udevadm control --reload-rules && udevadm trigger"`;
        
        exec(cmd, (error) => {
            if (error) console.error("Instalace udev pravidel zrušena.");
            else console.log("Udev pravidla úspěšně zapsána!");
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

    // KLÍČOVÁ OPRAVA: Použití absolutní cesty. Teď už Electron index.html najde na 100 % kdekoliv
    win.loadFile(path.join(__dirname, 'index.html'));

    // POKUD BY OKNO BYLO STÁLE PRÁZDNÉ, odkomentuj řádek níže. 
    // Otevře to vývojářskou konzoli (DevTools), kde hned uvidíme přesnou chybu:
    // win.webContents.openDevTools();

    // ============================================================================
    // AUTOMATICKÉ PÁROVÁNÍ WEBHID
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
