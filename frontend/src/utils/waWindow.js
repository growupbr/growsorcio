// Singleton da janela popup do WhatsApp — compartilhado entre Navbar e LeadPerfil
let _win = null;

export function abrirWhatsApp(url = 'https://web.whatsapp.com') {
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
