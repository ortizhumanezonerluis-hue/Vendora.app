import { toast } from '../components/ui/Toaster'

export function triggerDirectDownload() {
  toast('🚀 Iniciando descarga de Vendora POS para Windows (.exe)...', { type: 'success' })

  // Trigger download directly from local static downloads bundle or fallback
  const downloadUrl = '/downloads/Vendora-POS-Setup.exe'

  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = 'Vendora-POS-Setup.exe'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
