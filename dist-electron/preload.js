"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    scanner: {
        getServerInfo: () => electron_1.ipcRenderer.invoke('scanner:getServerInfo'),
        onCodeReceived: (callback) => {
            const handler = (_event, code) => callback(code);
            electron_1.ipcRenderer.on('scanner:code-received', handler);
            return () => {
                electron_1.ipcRenderer.removeListener('scanner:code-received', handler);
            };
        }
    },
    system: {
        isElectron: true,
        platform: process.platform
    }
};
electron_1.contextBridge.exposeInMainWorld('vendoraDesktop', api);
