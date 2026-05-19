const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    hledejOsobu: (jmeno) => ipcRenderer.invoke('hledej-osobu', jmeno),
    ulozNavstevnika: (data) => ipcRenderer.invoke('uloz-navstevnika', data),
    zaznamenejPrichod: (data) => ipcRenderer.invoke('zaznamenej-prichod', data),
    nactiAktivni: () => ipcRenderer.invoke('nacti-aktivni'),
    zaznamenejOdchod: (dochazkaId) => ipcRenderer.invoke('zaznamenej-odchod', dochazkaId),
    
    nactiPravidla: () => ipcRenderer.invoke('nacti-pravidla'),
    nactiVsechnyCleny: () => ipcRenderer.invoke('nacti-vsechny-cleny'),
    ulozPravidlo: (obsah, poradi) => ipcRenderer.invoke('uloz-pravidlo', obsah, poradi),
    smazPravidla: () => ipcRenderer.invoke('smaz-pravidla'),
    
    // Nová funkce pro opravu USB
    opravUsb: () => ipcRenderer.invoke('oprav-usb')
});
