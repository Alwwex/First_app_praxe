const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// ============================================================================
// NASTAVENÍ PRO ELECTRON 30 (Chromium 124+)
// ============================================================================
// Vypneme HW akceleraci, ale NEZAKAZUJEME kompozici, kterou Electron 30 nutně vyžaduje
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-sandbox'); // Klíčové pro gbm_wrapper na ARMu
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage'); // Řeší paměť /dev/shm na notebooku
app.commandLine.appendSwitch('ozone-platform', 'x11');     // Vynutí stabilní X11 rozhraní

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

    // Načtení HTML souboru přes absolutní cestu
    win.loadFile(path.join(__dirname, 'index.html'));

    // Otevře DevTools, v záložce Console uvidíš případné chyby samotného HTML/JS
    win.webContents.openDevTools();

    // DIAGNOSTIKA PRO ELECTRON 30: Pokud by renderer přesto spadl, vypíše to do terminálu důvod
    win.webContents.on('render-process-gone', (event, details) => {
        console.log(`Renderer crash detekován! Důvod: ${details.reason}, Kód: ${details.exitCode}`);
    });

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
