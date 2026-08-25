export function registerPwaServiceWorker() {
  if (!window.isSecureContext || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => registration.update())
      .catch((error) => {
        // PWA availability must never block invoice, session, or API flows.
        console.warn('[PWA] Service worker tidak dapat didaftarkan.', error);
      });
  });
}
