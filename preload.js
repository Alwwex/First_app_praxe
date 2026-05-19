const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    hledejOsobu: (jmeno) => ipcRenderer.invoke('hledej-osobu', jmeno),
    ulozNavstevu: (data) => ipcRenderer.invoke('uloz-navstevu', data)
});