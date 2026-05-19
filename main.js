const { app, BrowserWindow } = require('electron');
const path = require('path');

// ============================================================================
// OPRAVA PRO 64-BIT RASPBERRY PI OS 12 (WAYLAND / BOOKWORM)
// ============================================================================
// Přinutíme Electron komunikovat s novým grafickým systémem Wayland
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');

// Bezpečné vypnutí problematických grafických bufferů
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Pojistky proti pádům linuxového jádra na Raspberry
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('no-sandbox');

function createWindow() {
    const win = new BrowserWindow({
        width: 700,
        height: 600,
        resizable: false, // Ideální pro stabilní registrační kiosek
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Načtení samotného plátna přes absolutní cestu
    win.loadFile(path.join(__dirname, 'index.html'));

    // Pokud bys potřeboval hledat chyby v HTML/JS, odkomentuj řádek níže:
    // win.webContents.openDevTools();

    // ============================================================================
    // AUTOMATICKÉ PÁROVÁNÍ WEBHID PRO WACOM STU-430
    // ============================================================================
    win.webContents.session.on('select-hid-device', (event, details, callback) => {
        event.preventDefault();
        // Hledáme tablet podle Vendor ID (1386) a Product ID (164)
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

// Inicializace celé aplikace
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Čisté ukončení procesu po zavření okna
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
