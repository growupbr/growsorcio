// Singleton da janela popup do WhatsApp — compartilhado entre Navbar e LeadPerfil
// No mobile, popups com parâmetros de tamanho são bloqueados. Abre em _blank.
let _win = null;

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function abrirWhatsApp(url = 'https://wa.me/') {
  if (isMobile()) {
    // Mobile: _blank sem parâmetros — respeita o app nativo do WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer');
    return null;
  }
  // Desktop: popup singleton reutilizável
  if (_win && !_win.closed) {
    _win.location.href = url;
    _win.focus();
  } else {
    _win = window.open(url, 'whatsapp', 'width=480,height=700,left=800,top=100');
  }
  return _win;
}

export function isWaOpen() {
  return Boolean(_win && !_win.closed);
}
