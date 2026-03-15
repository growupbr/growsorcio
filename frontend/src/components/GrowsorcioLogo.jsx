/**
 * Logo oficial GrowSorcio
 * Ícone: seta diagonal (⬈) em bloco laranja arredondado
 * Fonte: Nunito 900 (arredondada, fiel à marca)
 * Props:
 *   height     — altura total (default 36)
 *   textColor  — cor do texto (default #ffffff)
 */
export default function GrowsorcioLogo({ height = 36, textColor = '#ffffff' }) {
  const iconSize = height;
  const fontSize = height * 0.56;
  const gap = height * 0.30;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {/* Ícone: seta ⬈ em quadrado laranja */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Fundo laranja com bordas bem arredondadas */}
        <rect width="100" height="100" rx="22" fill="#FF4500" />

        {/*
          Seta diagonal ⬈ (nordeste):
          Dois degraus retangulares + ponta triangular
          Degrau inferior-esquerdo: col 16–42, linha 56–82
          Degrau superior-direito: col 42–68, linha 30–56
          Ponta da seta: triângulo 54–84 / 8–38
          Preenchimento diagonal entre degrau superior e ponta
        */}
        {/* Degrau 1 — base inferior-esquerda */}
        <path d="M16 82 L16 56 L42 56 L42 82 Z" fill="white" />

        {/* Degrau 2 — meio */}
        <path d="M42 56 L42 30 L68 30 L68 56 Z" fill="white" />

        {/* Ponta da seta — triângulo superior-direito */}
        <polygon points="54,8 84,8 84,38" fill="white" />

        {/* Preenchimento que une o degrau 2 à ponta */}
        <path d="M42 56 L68 30 L84 8 L84 38 L68 56 Z" fill="white" />
      </svg>

      {/* Texto — Nunito 900 (arredondado, fiel à marca) */}
      <span
        style={{
          fontFamily: "'Nunito', 'Space Grotesk', 'Inter', sans-serif",
          fontWeight: 900,
          fontSize,
          color: textColor,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        Growsorcio
      </span>
    </span>
  );
}
