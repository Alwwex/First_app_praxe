const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

function checkAndInstallUdevRules(callback) {
    if (process.platform !== 'linux') {
        callback();
        return;
    }

    const rulePath = '/etc/udev/rules.d/99-wacom.rules';
    
    if (!fs.existsSync(rulePath)) {
        const ruleContent = 'SUBSYSTEM=="usb", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"\\nSUBSYSTEM=="hidraw", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"';
        const cmd = `pkexec bash -c "echo -e '${ruleContent}' > ${rulePath} && udevadm control --reload-rules && udevadm trigger && chmod 666 /dev/hidraw* || true"`;

        exec(cmd, () => {
            callback(); 
        });
        return;
    }

    callback();
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

    win.loadFile(path.join(__dirname, 'index.html'));

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
    checkAndInstallUdevRules(() => {
        createWindow();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
