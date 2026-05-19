const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const dbConfig = { host: '127.0.0.1', user: 'lintech', password: '123456', database: 'evidence_navstev' };

function ulozObrazekNaDisk(id, typ, base64String) {
    try {
        const dir = path.join(__dirname, 'podpisy');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        const data = base64String.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(path.join(dir, `${id}_${typ}.png`), data, 'base64');
    } catch (err) { console.error("Chyba zápisu:", err); }
}

ipcMain.handle('hledej-osobu', async (e, jmeno) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute(`SELECT n.id, n.jmeno, n.email, n.spolecnost, n.telefon, n.podpis_base64, 
            (SELECT d.stav FROM dochazka d WHERE d.navstevnik_id = n.id ORDER BY d.cas_prichodu DESC LIMIT 1) AS posledni_stavy 
            FROM navstevnici n WHERE n.jmeno LIKE ? LIMIT 5`, [`%${jmeno}%`]);
        await conn.end(); return rows;
    } catch (e) { return []; }
});

ipcMain.handle('uloz-navstevnika', async (e, data) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [res] = await conn.execute('INSERT INTO navstevnici (jmeno, email, telefon, spolecnost, podpis_base64) VALUES (?,?,?,?,?)', 
            [data.jmeno, data.email, data.telefon, data.spolecnost, data.podpis]);
        await conn.end();
        ulozObrazekNaDisk(res.insertId, 'registrace', data.podpis);
        return { success: true, id: res.insertId };
    } catch (e) { return { success: false }; }
});

ipcMain.handle('zaznamenej-prichod', async (e, d) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute('INSERT INTO dochazka (navstevnik_id, stav, podpis_vstup_base64) VALUES (?,?,?)', [d.navstevnikId, 'Uvnitr', d.podpisVstup]);
        await conn.end();
        ulozObrazekNaDisk(d.navstevnikId, 'vstup', d.podpisVstup);
        return { success: true };
    } catch (e) { return { success: false }; }
});

ipcMain.handle('nacti-aktivni', async () => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute(`SELECT d.id AS dochazka_id, n.jmeno, n.spolecnost, n.telefon, DATE_FORMAT(d.cas_prichodu, '%H:%i') as cas FROM dochazka d JOIN navstevnici n ON d.navstevnik_id = n.id WHERE d.stav = 'Uvnitr'`);
        await conn.end(); return rows;
    } catch (e) { return []; }
});

ipcMain.handle('zaznamenej-odchod', async (e, id) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute('UPDATE dochazka SET cas_odchodu = CURRENT_TIMESTAMP, stav = ? WHERE id = ?', ['Odesel', id]);
        await conn.end(); return { success: true };
    } catch (e) { return { success: false }; }
});

// Admin funkce
ipcMain.handle('nacti-vsechny-cleny', async () => {
    try { const conn = await mysql.createConnection(dbConfig); const [rows] = await conn.execute(`SELECT n.*, (SELECT d.podpis_vstup_base64 FROM dochazka d WHERE d.navstevnik_id = n.id ORDER BY d.cas_prichodu DESC LIMIT 1) AS posledni_podpis FROM navstevnici n ORDER BY n.id DESC`); await conn.end(); return rows; } catch (e) { return []; }
});
ipcMain.handle('nacti-pravidla', async () => { try { const conn = await mysql.createConnection(dbConfig); const [rows] = await conn.execute('SELECT * FROM pravidla ORDER BY poradi ASC'); await conn.end(); return rows; } catch (e) { return []; } });
ipcMain.handle('uloz-pravidlo', async (e, o, p) => { try { const conn = await mysql.createConnection(dbConfig); await conn.execute('INSERT INTO pravidla (obsah, poradi) VALUES (?, ?)', [o, p]); await conn.end(); return { success: true }; } catch (e) { return { success: false }; } });
ipcMain.handle('smaz-pravidla', async () => { try { const conn = await mysql.createConnection(dbConfig); await conn.execute('TRUNCATE TABLE pravidla'); await conn.end(); return { success: true }; } catch (e) { return { success: false }; } });

function createWindow() {
    const win = new BrowserWindow({ width: 1280, height: 800, fullscreen: true, autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true } });
    win.removeMenu(); win.loadFile('index.html');
    
    // Auto-schvalování práv pro Wacom (Toto Electronu říká: "Pusť to tam")
    win.webContents.session.on('select-hid-device', (e, d, cb) => { 
        e.preventDefault(); 
        const dev = d.deviceList.find((x) => x.vendorId === 1386 && x.productId === 164); 
        if(dev) cb(dev.deviceId); else cb(); 
    });
    win.webContents.session.setPermissionCheckHandler((wc, perm) => perm === 'hid');
    win.webContents.session.setDevicePermissionHandler((d) => d.deviceType === 'hid' && d.device.vendorId === 1386 && d.device.productId === 164);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
