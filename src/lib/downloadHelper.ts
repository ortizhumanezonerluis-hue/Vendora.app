import { toast } from '../components/ui/Toaster'

export function triggerDirectDownload() {
  toast('🚀 Iniciando descarga de Vendora POS para Windows (.exe)...', { type: 'success' })

  // Direct download link from GitHub Releases (tag v2)
  const releaseUrl = 'https://github.com/ortizhumanezonerluis-hue/Vendora.app/releases/download/v2/Vendora.POS.Setup.1.0.0.exe'

  const link = document.createElement('a')
  link.href = releaseUrl
  link.download = 'Vendora.POS.Setup.1.0.0.exe'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

