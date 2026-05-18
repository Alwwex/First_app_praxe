const { app, BrowserWindow } = require('electron');
const path = require('path');

// ============================================================================
// OPRAVA DMA_BUF A BÍLÉ OBRAZOVKY PRO RASPBERRY PI (32-bit)
// ============================================================================
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
// ZÁSADNÍ: Přinutí Electron ignorovat dma_buf a vykreslit vše přes SwiftShader (CPU)
app.commandLine.appendSwitch('use-gl', 'swiftshader'); 
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

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

    win.loadFile(path.join(__dirname, 'index.html'));

    // Otevření konzole pro případnou kontrolu chyb (můžeš později smazat)
    win.webContents.openDevTools();

    // ============================================================================
    // AUTOMATICKÉ PÁROVÁNÍ WACCOM TABLETU
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
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
