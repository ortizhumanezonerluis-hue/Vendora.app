import { contextBridge, ipcRenderer } from 'electron'

export interface VendoraDesktopAPI {
  // Escáner Móvil en Red Local
  scanner: {
    getServerInfo: () => Promise<{ localIp: string; port: number; url: string }>
    onCodeReceived: (callback: (code: string) => void) => () => void
  }

  // Información del Sistema
  system: {
    isElectron: boolean
    platform: string
  }
}

const api: VendoraDesktopAPI = {
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
    platform: process.platform
  }
}

contextBridge.exposeInMainWorld('vendoraDesktop', api)
