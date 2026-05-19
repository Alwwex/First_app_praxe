const { app, BrowserWindow } = require('electron');
const path = require('path');

// ============================================================================
// OPRAVA PRO RASPBERRY PI OS 12 BOOKWORM (64-BIT)
// Tyto proměnné musíme nastavit JEŠTĚ PŘED inicializací Electronu
// ============================================================================
process.env.ELECTRON_OZONE_PLATFORM_HINT = 'x11'; // Vynutí starý spolehlivý X11 režim místo Waylandu
process.env.LIBGL_ALWAYS_SOFTWARE = '1';          // Odřízne grafiku už na úrovni Linuxu

// Bezpečné vypnutí problematických částí Chromia
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('no-sandbox');

// POZOR: Úmyslně jsme smazali 'disable-dev-shm-usage', protože to na novém OS způsobovalo chybu s /tmp
app.commandLine.appendSwitch('ozone-platform', 'x11');

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

    // ============================================================================
    // AUTOMATICKÉ PÁROVÁNÍ WEBHID PRO WACOM STU-430
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
