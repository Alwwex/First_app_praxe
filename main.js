const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');  
const { ipcMain } = require('electron');
const mysql = require('mysql2/promise');

// Nastavení připojení k tvé databázi
const dbConfig = {
    host: '127.0.0.1', // Pokud databáze běží na stejném PC. Jinak IP adresa serveru.
    user: 'lintech',      // Výchozí XAMPP uživatel
    password: '123456',      // Výchozí XAMPP heslo (prázdné)
    database: 'evidence_navstev'
};

// Funkce pro vyhledávání lidí (Našeptávač)
ipcMain.handle('hledej-osobu', async (event, jmeno) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT jmeno, email, spolecnost, telefon FROM navstevy WHERE jmeno LIKE ? GROUP BY email LIMIT 5',
            [`%${jmeno}%`]
        );
        await connection.end();
        return rows;
    } catch (error) {
        console.error("Chyba DB (hledání):", error);
        return [];
    }
});

// Funkce pro uložení nové návštěvy
ipcMain.handle('uloz-navstevu', async (event, data) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO navstevy (jmeno, email, spolecnost, telefon, podpis_base64) VALUES (?, ?, ?, ?, ?)',
            [data.jmeno, data.email, data.spolecnost, data.telefon, data.podpis]
        );
        await connection.end();
        return { success: true };
    } catch (error) {
        console.error("Chyba DB (ukládání):", error);
        return { success: false, error: error.message };
    }
});

function checkAndInstallUdevRules(callback) {
    if (process.platform !== 'linux') {
        callback();
        return;
    }

    const rulePath = '/etc/udev/rules.d/99-wacom.rules';
    
    // Krok 1: Pokud pravidla v systemu nejsou, vyzadame si heslo a zapiseme je
    if (!fs.existsSync(rulePath)) {
        const ruleContent = 'SUBSYSTEM=="usb", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"\\nSUBSYSTEM=="hidraw", ATTRS{idVendor}=="056a", ATTRS{idProduct}=="00a4", MODE="0666"';
        const cmd = `pkexec bash -c "echo -e '${ruleContent}' > ${rulePath} && udevadm control --reload-rules && udevadm trigger && chmod 666 /dev/hidraw* && chmod -R 666 /dev/bus/usb/ || true"`;

        exec(cmd, () => {
            callback(); 
        });
        return;
    }

    // Krok 2: Pokud pravidla uz existuji, jen potichu odemkneme aktualni USB porty
    exec('sudo chmod 666 /dev/hidraw* && sudo chmod -R 666 /dev/bus/usb/ || true', () => {
        callback();
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 700,
        height: 600,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
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
