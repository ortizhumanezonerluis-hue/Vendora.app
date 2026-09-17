"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    db: {
        getProductos: (negocioId) => electron_1.ipcRenderer.invoke('db:getProductos', negocioId),
        getProductoById: (id) => electron_1.ipcRenderer.invoke('db:getProductoById', id),
        getProductoByBarcode: (barcode) => electron_1.ipcRenderer.invoke('db:getProductoByBarcode', barcode),
        saveProducto: (prod) => electron_1.ipcRenderer.invoke('db:saveProducto', prod),
        deleteProducto: (id) => electron_1.ipcRenderer.invoke('db:deleteProducto', id),
        smartLookupBarcodeOffline: (barcode) => electron_1.ipcRenderer.invoke('db:smartLookupBarcodeOffline', barcode),
        registrarVenta: (payload) => electron_1.ipcRenderer.invoke('db:registrarVenta', payload),
        getVentas: (limit) => electron_1.ipcRenderer.invoke('db:getVentas', limit),
        getDetallesVenta: (ventaId) => electron_1.ipcRenderer.invoke('db:getDetallesVenta', ventaId),
        getArqueoActivo: (negocioId) => electron_1.ipcRenderer.invoke('db:getArqueoActivo', negocioId),
        getHistorialArqueos: (limit) => electron_1.ipcRenderer.invoke('db:getHistorialArqueos', limit),
        abrirCaja: (payload) => electron_1.ipcRenderer.invoke('db:abrirCaja', payload),
        cerrarCaja: (payload) => electron_1.ipcRenderer.invoke('db:cerrarCaja', payload),
        getProveedores: () => electron_1.ipcRenderer.invoke('db:getProveedores'),
        saveProveedor: (prov) => electron_1.ipcRenderer.invoke('db:saveProveedor', prov),
        deleteProveedor: (id) => electron_1.ipcRenderer.invoke('db:deleteProveedor', id),
        getSesionesAuditoria: () => electron_1.ipcRenderer.invoke('db:getSesionesAuditoria'),
        createSesionAuditoria: (sesion) => electron_1.ipcRenderer.invoke('db:createSesionAuditoria', sesion),
        saveDetallesAuditoria: (sesionId, items) => electron_1.ipcRenderer.invoke('db:saveDetallesAuditoria', sesionId, items),
        getDetallesAuditoria: (sesionId) => electron_1.ipcRenderer.invoke('db:getDetallesAuditoria', sesionId),
        getClientes: () => electron_1.ipcRenderer.invoke('db:getClientes'),
        saveCliente: (cliente) => electron_1.ipcRenderer.invoke('db:saveCliente', cliente),
        getConfiguracion: (negocioId) => electron_1.ipcRenderer.invoke('db:getConfiguracion', negocioId),
        saveConfiguracion: (cfg) => electron_1.ipcRenderer.invoke('db:saveConfiguracion', cfg)
    },
    backup: {
        export: () => electron_1.ipcRenderer.invoke('backup:export'),
        restore: () => electron_1.ipcRenderer.invoke('backup:restore')
    },
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
        platform: process.platform,
        getDatabasePath: () => electron_1.ipcRenderer.invoke('system:getDatabasePath')
    }
};
electron_1.contextBridge.exposeInMainWorld('vendoraDesktop', api);
