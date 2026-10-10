let sonomixInstallPrompt;
const installButton = document.getElementById('instalarApp');

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  sonomixInstallPrompt = event;
  if (installButton) installButton.hidden = false;
});

installButton?.addEventListener('click', async event => {
  event.preventDefault();
  if (!sonomixInstallPrompt) {
    alert('Esperá unos segundos y tocá nuevamente. Si no aparece, abrí el menú de Chrome (⋮) y elegí “Instalar aplicación”.');
    return;
  }
  sonomixInstallPrompt.prompt();
  await sonomixInstallPrompt.userChoice;
  sonomixInstallPrompt = null;
});

window.addEventListener('appinstalled', () => {
  if (installButton) installButton.hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw-sonomix-install.js'));
}
