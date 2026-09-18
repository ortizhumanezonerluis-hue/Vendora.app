import { toast } from '../components/ui/Toaster'

export function triggerDirectDownload() {
  toast('🚀 Iniciando descarga de Vendora POS para Windows (.exe)...', { type: 'success' })

  // Direct download link from GitHub Releases (tag v2)
  const releaseUrl = 'https://github.com/ortizhumanezonerluis-hue/Vendora.app/releases/download/v2/Vendora-POS-Setup.exe'

  const link = document.createElement('a')
  link.href = releaseUrl
  link.download = 'Vendora-POS-Setup.exe'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

