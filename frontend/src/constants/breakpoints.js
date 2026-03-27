/**
 * Breakpoints Tailwind CSS — referência centralizada.
 * Usar em lógica JS (useMediaQuery, resize handlers).
 * No CSS, sempre preferir classes Tailwind diretamente (sm:, md:, lg:, xl:).
 */
export const BREAKPOINTS = {
  SM: 640,   // sm: — tablet pequeno / landscape mobile
  MD: 768,   // md: — tablet / navegação desktop ativa abaixo disso = bottom nav mobile
  LG: 1024,  // lg: — desktop compacto
  XL: 1280,  // xl: — desktop largo (grid de 6 colunas de métricas)
};

/**
 * Retorna o nome do breakpoint ativo com base na largura atual da janela.
 * Usado apenas em ambiente de desenvolvimento para debug visual.
 */
export function getActiveBreakpoint(width = window.innerWidth) {
  if (width >= BREAKPOINTS.XL) return 'xl';
  if (width >= BREAKPOINTS.LG) return 'lg';
  if (width >= BREAKPOINTS.MD) return 'md';
  if (width >= BREAKPOINTS.SM) return 'sm';
  return 'xs';
}
