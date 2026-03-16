// ─── Formatação — funções utilitárias compartilhadas ─────────────────────────

export function formatarData(str) {
  if (!str) return '—';
  const [, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}`;
}

export function formatarDataCompleta(str) {
  if (!str) return '—';
  const [ano, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}/${ano}`;
}

export function formatarMoeda(valor) {
  if (valor == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

export function estaVencido(data) {
  if (!data) return false;
  return data.slice(0, 10) < dataHoje();
}
