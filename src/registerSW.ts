export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceworker
        .register('/sw.js')
        .then((reg) => {
          console.log('ServiceWorker registrado con éxito: ', reg.scope)
        })
        .catch((err) => {
          console.warn('Fallo al registrar ServiceWorker: ', err)
        })
    })
  }
}
