const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: 'lintech',
    password: '123456',
    database: 'evidence_navstev'
};

// Pomocná funkce pro bezpečné uložení obrázku na disk
function ulozObrazekNaDisk(id, typ, base64String) {
    try {
        const dir = path.join(__dirname, 'podpisy');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const čistéBase64 = base64String.replace(/^data:image\/png;base64,/, "");
        const souborCesta = path.join(dir, `${id}_${typ}.png`);
        fs.writeFileSync(souborCesta, čistéBase64, 'base64');
        console.log(`Soubor úspěšně uložen: ${souborCesta}`);
    } catch (err) {
        console.error("Chyba při zápisu souboru na disk:", err);
    }
}

ipcMain.handle('hledej-osobu', async (event, jmeno) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT n.id, n.jmeno, n.email, n.spolecnost, n.telefon, n.podpis_base64,
                (SELECT d.stav FROM dochazka d WHERE d.navstevnik_id = n.id ORDER BY d.cas_prichodu DESC LIMIT 1) AS posledni_stavy
             FROM navstevnici n WHERE n.jmeno LIKE ? LIMIT 5`,
            [`%${jmeno}%`]
        );
        await connection.end();
        return rows;
    } catch (error) { return []; }
});

ipcMain.handle('uloz-navstevnika', async (event, data) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO navstevnici (jmeno, email, spolecnost, telefon, podpis_base64) VALUES (?, ?, ?, ?, ?)',
            [data.jmeno, data.email, data.spolecnost, data.telefon, data.podpis]
        );
        const novyId = result.insertId;
        await connection.end();

        // FYZICKÉ ULOŽENÍ NA DISK
        ulozObrazekNaDisk(novyId, 'registrace', data.podpis);

        return { success: true, id: novyId };
    } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('zaznamenej-prichod', async (event, data) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO dochazka (navstevnik_id, stav, podpis_vstup_base64) VALUES (?, ?, ?)',
            [data.navstevnikId, 'Uvnitr', data.podpisVstup]
        );
        await connection.end();

        // FYZICKÉ ULOŽENÍ NA DISK
        ulozObrazekNaDisk(data.navstevnikId, 'vstup', data.podpisVstup);

        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('nacti-aktivni', async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT d.id AS dochazka_id, n.id AS navstevnik_id, n.jmeno, n.spolecnost, n.telefon, DATE_FORMAT(d.cas_prichodu, '%H:%i') as cas 
             FROM dochazka d JOIN navstevnici n ON d.navstevnik_id = n.id WHERE d.stav = 'Uvnitr'`
        );
        await connection.end();
        return rows;
    } catch (error) { return []; }
});

ipcMain.handle('zaznamenej-odchod', async (event, dochazkaId) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE dochazka SET cas_odchodu = CURRENT_TIMESTAMP, stav = ? WHERE id = ?', ['Odesel', dochazkaId]);
        await connection.end();
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
});

// --- ADMIN HANDLERY ---
ipcMain.handle('nacti-vsechny-cleny', async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT n.id, n.jmeno, n.email, n.spolecnost, n.telefon, n.podpis_base64,
             (SELECT d.podpis_vstup_base64 FROM dochazka d WHERE d.navstevnik_id = n.id ORDER BY d.cas_prichodu DESC LIMIT 1) AS posledni_podpis
             FROM navstevnici n ORDER BY n.id DESC`
        );
        await connection.end();
        return rows;
    } catch (error) { return []; }
});

ipcMain.handle('nacti-pravidla', async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM pravidla ORDER BY poradi ASC');
        await connection.end();
        return rows;
    } catch (error) { return []; }
});

ipcMain.handle('uloz-pravidlo', async (event, obsah, poradi) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO pravidla (obsah, poradi) VALUES (?, ?)', [obsah, poradi]);
        await connection.end();
        return { success: true };
    } catch (error) { return { success: false }; }
});

ipcMain.handle('smaz-pravidla', async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('TRUNCATE TABLE pravidla');
        await connection.end();
        return { success: true };
    } catch (error) { return { success: false }; }
});

// --- OPRAVA USB PRO RASPBERRY PI ---
ipcMain.handle('oprav-usb', async () => {
    return new Promise((resolve) => {
        if (process.platform !== 'linux') {
            resolve({ success: false, msg: "Tato oprava je určena pouze pro Raspberry Pi (Linux)." });
            return;
        }
        
        const rule = 'SUBSYSTEM==\\"usb\\", ATTRS{idVendor}==\\"056a\\", ATTRS{idProduct}==\\"00a4\\", MODE=\\"0666\\"\\nSUBSYSTEM==\\"hidraw\\", ATTRS{idVendor}==\\"056a\\", ATTRS{idProduct}==\\"00a4\\", MODE=\\"0666\\"';
        const cmd = `sudo sh -c "echo -e '${rule}' > /etc/udev/rules.d/99-wacom.rules" && sudo udevadm control --reload-rules && sudo udevadm trigger && sudo chmod 666 /dev/hidraw*`;
        
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, msg: "Nepodařilo se nastavit práva: " + error.message });
            } else {
                resolve({ success: true, msg: "Systémová práva tabletu byla úspěšně nastavena! Nyní fyzicky odpojte a znovu zapojte USB kabel tabletu do Raspberry Pi." });
            }
        });
    });
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1280, height: 800, fullscreen: true, autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
    });
    
    // Povolení všech HID zařízení bez dotazování (na RPi nutnost)
    win.webContents.session.on('select-hid-device', (event, details, callback) => {
        event.preventDefault();
        if (details.deviceList && details.deviceList.length > 0) {
            callback(details.deviceList[0].deviceId);
        } else {
            callback();
        }
    });

    win.webContents.session.setPermissionCheckHandler((webContents, permission) => permission === 'hid');
    win.webContents.session.setDevicePermissionHandler((details) => true); // Povolit vše

    win.removeMenu(); 
    win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
