import { contextBridge, ipcRenderer } from 'electron'

export interface VendoraDesktopAPI {
  // Base de Datos
  db: {
    getProductos: (negocioId?: string) => Promise<any[]>
    getProductoById: (id: string) => Promise<any>
    getProductoByBarcode: (barcode: string) => Promise<any>
    saveProducto: (prod: any) => Promise<any>
    deleteProducto: (id: string) => Promise<any>
    smartLookupBarcodeOffline: (barcode: string) => Promise<any>

    registrarVenta: (payload: { venta: any; detalles: any[] }) => Promise<any>
    getVentas: (limit?: number) => Promise<any[]>
    getDetallesVenta: (ventaId: string) => Promise<any[]>

    getArqueoActivo: (negocioId?: string) => Promise<any>
    getHistorialArqueos: (limit?: number) => Promise<any[]>
    abrirCaja: (payload: any) => Promise<any>
    cerrarCaja: (payload: any) => Promise<any>

    getProveedores: () => Promise<any[]>
    saveProveedor: (prov: any) => Promise<any>
    deleteProveedor: (id: string) => Promise<any>

    getSesionesAuditoria: () => Promise<any[]>
    createSesionAuditoria: (sesion: any) => Promise<any>
    saveDetallesAuditoria: (sesionId: string, items: any[]) => Promise<any>
    getDetallesAuditoria: (sesionId: string) => Promise<any[]>

    getClientes: () => Promise<any[]>
    saveCliente: (cliente: any) => Promise<any>

    getConfiguracion: (negocioId?: string) => Promise<any>
    saveConfiguracion: (cfg: any) => Promise<any>
  }

  // Respaldo y Restauración
  backup: {
    export: () => Promise<{ success: boolean; filePath?: string; error?: string }>
    restore: () => Promise<{ success: boolean; manifest?: any; error?: string }>
  }

  // Escáner Móvil en Red Local
  scanner: {
    getServerInfo: () => Promise<{ localIp: string; port: number; url: string }>
    onCodeReceived: (callback: (code: string) => void) => () => void
  }

  // Información del Sistema
  system: {
    isElectron: boolean
    platform: string
    getDatabasePath: () => Promise<string>
  }
}

const api: VendoraDesktopAPI = {
  db: {
    getProductos: (negocioId) => ipcRenderer.invoke('db:getProductos', negocioId),
    getProductoById: (id) => ipcRenderer.invoke('db:getProductoById', id),
    getProductoByBarcode: (barcode) => ipcRenderer.invoke('db:getProductoByBarcode', barcode),
    saveProducto: (prod) => ipcRenderer.invoke('db:saveProducto', prod),
    deleteProducto: (id) => ipcRenderer.invoke('db:deleteProducto', id),
    smartLookupBarcodeOffline: (barcode) => ipcRenderer.invoke('db:smartLookupBarcodeOffline', barcode),

    registrarVenta: (payload) => ipcRenderer.invoke('db:registrarVenta', payload),
    getVentas: (limit) => ipcRenderer.invoke('db:getVentas', limit),
    getDetallesVenta: (ventaId) => ipcRenderer.invoke('db:getDetallesVenta', ventaId),

    getArqueoActivo: (negocioId) => ipcRenderer.invoke('db:getArqueoActivo', negocioId),
    getHistorialArqueos: (limit) => ipcRenderer.invoke('db:getHistorialArqueos', limit),
    abrirCaja: (payload) => ipcRenderer.invoke('db:abrirCaja', payload),
    cerrarCaja: (payload) => ipcRenderer.invoke('db:cerrarCaja', payload),

    getProveedores: () => ipcRenderer.invoke('db:getProveedores'),
    saveProveedor: (prov) => ipcRenderer.invoke('db:saveProveedor', prov),
    deleteProveedor: (id) => ipcRenderer.invoke('db:deleteProveedor', id),

    getSesionesAuditoria: () => ipcRenderer.invoke('db:getSesionesAuditoria'),
    createSesionAuditoria: (sesion) => ipcRenderer.invoke('db:createSesionAuditoria', sesion),
    saveDetallesAuditoria: (sesionId, items) => ipcRenderer.invoke('db:saveDetallesAuditoria', sesionId, items),
    getDetallesAuditoria: (sesionId) => ipcRenderer.invoke('db:getDetallesAuditoria', sesionId),

    getClientes: () => ipcRenderer.invoke('db:getClientes'),
    saveCliente: (cliente) => ipcRenderer.invoke('db:saveCliente', cliente),

    getConfiguracion: (negocioId) => ipcRenderer.invoke('db:getConfiguracion', negocioId),
    saveConfiguracion: (cfg) => ipcRenderer.invoke('db:saveConfiguracion', cfg)
  },

  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    restore: () => ipcRenderer.invoke('backup:restore')
  },

  scanner: {
    getServerInfo: () => ipcRenderer.invoke('scanner:getServerInfo'),
    onCodeReceived: (callback) => {
      const handler = (_event: any, code: string) => callback(code)
      ipcRenderer.on('scanner:code-received', handler)
      return () => {
        ipcRenderer.removeListener('scanner:code-received', handler)
      }
    }
  },

  system: {
    isElectron: true,
    platform: process.platform,
    getDatabasePath: () => ipcRenderer.invoke('system:getDatabasePath')
  }
}

contextBridge.exposeInMainWorld('vendoraDesktop', api)
