/**
 * Electron Bridge Adapter for React Frontend.
 * Automatically detects if running inside Electron desktop environment or browser.
 */

declare global {
  interface Window {
    vendoraDesktop?: import('../../electron/preload').VendoraDesktopAPI
  }
}

export const isElectron = typeof window !== 'undefined' && Boolean(window.vendoraDesktop?.system?.isElectron)

export const desktopDB = isElectron ? window.vendoraDesktop!.db : null
export const desktopBackup = isElectron ? window.vendoraDesktop!.backup : null
export const desktopScanner = isElectron ? window.vendoraDesktop!.scanner : null
export const desktopSystem = isElectron ? window.vendoraDesktop!.system : null
