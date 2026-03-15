import logoSrc from '../assets/logogrowsorcio.webp';

/**
 * Logo oficial GrowSorcio
 * Props:
 *   height — altura da imagem (default 36)
 */
export default function GrowsorcioLogo({ height = 36 }) {
  return (
    <img
      src={logoSrc}
      alt="Growsorcio"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
