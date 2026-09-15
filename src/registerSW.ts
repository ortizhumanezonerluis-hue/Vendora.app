export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Registrado con éxito:', reg.scope)
          // Force update immediately so it activates without waiting next reload
          reg.update()
        })
        .catch((err) => {
          console.warn('[SW] Fallo al registrar:', err)
        })
    })
  }
}

