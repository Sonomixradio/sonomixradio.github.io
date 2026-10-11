/* One installation controller for the website and its player. */
(function () {
  'use strict';
  const scriptURL = new URL(document.currentScript.src);
  const baseURL = new URL('./', scriptURL);
  const appURL = new URL('app/', baseURL).href;
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const mobile = navigator.userAgentData?.mobile === true || /Android/i.test(navigator.userAgent) || ios;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let installed = standalone();
  let deferredPrompt = null;
  let prompting = false;
  let supportsPrompt = 'onbeforeinstallprompt' in window;
  let registrationFailed = false;
  let dialog = null;
  let previousFocus = null;
  let fallbackTimer = null;

  function refreshControls() {
    document.querySelectorAll('[data-app-install-control]').forEach(control => {
      control.hidden = !mobile || installed || standalone();
    });
  }

  function closeDialog() {
    clearTimeout(fallbackTimer);
    if (dialog?.open) dialog.close();
    previousFocus?.focus?.({ preventScroll: true });
  }

  function createDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'sonomix-install-dialog';
    dialog.setAttribute('aria-labelledby', 'sonomix-install-title');
    dialog.setAttribute('aria-describedby', 'sonomix-install-message');
    dialog.innerHTML = '<button type="button" class="sonomix-install-close" aria-label="Cerrar">×</button>' +
      '<img class="sonomix-install-logo" alt="Logo de Sonomix Radio">' +
      '<h2 id="sonomix-install-title">Instalar aplicación</h2>' +
      '<p id="sonomix-install-message" role="status" aria-live="polite"></p>' +
      '<div class="sonomix-install-actions"><button type="button" class="sonomix-install-confirm">Instalar aplicación</button>' +
      '<a class="sonomix-install-open" target="_self">Abrir reproductor</a></div>';
    dialog.querySelector('img').src = new URL('app/icons/icon-192.png', baseURL).href;
    dialog.querySelector('.sonomix-install-open').href = appURL;
    dialog.querySelector('.sonomix-install-close').addEventListener('click', closeDialog);
    dialog.querySelector('.sonomix-install-confirm').addEventListener('click', requestInstall);
    dialog.addEventListener('cancel', closeDialog);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
      }
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  function updateDialog(mode) {
    if (!dialog) return;
    const confirm = dialog.querySelector('.sonomix-install-confirm');
    const message = dialog.querySelector('#sonomix-install-message');
    confirm.hidden = ios || !supportsPrompt;
    confirm.disabled = !deferredPrompt || prompting;
    if (mode === 'accepted') {
      confirm.hidden = true;
      message.textContent = 'Aceptaste la instalación. El navegador está agregando Sonomix Radio a tu celular.';
    } else if (mode === 'error') {
      message.textContent = 'El navegador no pudo abrir la instalación. Volvé a tocar el botón cuando esté disponible o abrí el reproductor.';
    } else if (ios) {
      message.textContent = 'En iPhone o iPad, abrí esta página en Safari, tocá Compartir y elegí “Agregar a pantalla de inicio”. iOS no permite abrir ese cuadro desde un botón de la web.';
    } else if (deferredPrompt) {
      message.textContent = 'La app está lista. Tocá “Instalar aplicación” y confirmá en el cuadro de tu navegador.';
    } else if (registrationFailed || !supportsPrompt || mode === 'waiting') {
      message.textContent = 'La instalación aún no está disponible en este navegador. En Chrome para Android, esperá unos segundos y volvé a intentar. Si ya la instalaste, abrila desde su ícono. También podés escuchar ahora con “Abrir reproductor”.';
    } else {
      message.textContent = 'Preparando la instalación… El botón se habilitará cuando tu navegador esté listo.';
    }
  }

  function showDialog() {
    const modal = createDialog();
    previousFocus = document.activeElement;
    updateDialog();
    if (!modal.open) modal.showModal();
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => { if (modal.open && !deferredPrompt) updateDialog('waiting'); }, 8000);
  }

  function requestInstall() {
    if (installed || standalone()) {
      window.location.assign(appURL);
      return;
    }
    if (prompting) return;
    if (!deferredPrompt) {
      showDialog();
      return;
    }
    const pending = deferredPrompt;
    deferredPrompt = null;
    prompting = true;
    closeDialog();
    let result;
    try {
      // Call synchronously within the user's click. Do not wait for SW/network first.
      result = pending.prompt();
    } catch (error) {
      prompting = false;
      deferredPrompt = pending;
      showDialog();
      updateDialog('error');
      return;
    }
    Promise.resolve(result).then(() => pending.userChoice).then(choice => {
      if (choice?.outcome === 'accepted' && !installed) {
        showDialog();
        clearTimeout(fallbackTimer);
        updateDialog('accepted');
      }
    }).catch(() => {
      deferredPrompt = pending;
      showDialog();
      updateDialog('error');
    }).finally(() => {
      prompting = false;
      if (dialog) dialog.querySelector('.sonomix-install-confirm').disabled = !deferredPrompt;
    });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    supportsPrompt = true;
    deferredPrompt = event;
    refreshControls();
    if (dialog?.open) updateDialog();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    prompting = false;
    closeDialog();
    refreshControls();
  });
  document.addEventListener('click', event => {
    const control = event.target.closest?.('[data-app-install]');
    if (!control || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    // Desktop uses the original link and opens the player in another tab.
    if (!mobile) return;
    event.preventDefault();
    requestInstall();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshControls);
  else refreshControls();

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register(new URL('sw.js', baseURL).href, { scope: baseURL.pathname, updateViaCache: 'none' }).catch(() => {
      registrationFailed = true;
      if (dialog?.open) updateDialog();
    });
  } else {
    registrationFailed = true;
  }
})();
