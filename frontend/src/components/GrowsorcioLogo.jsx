/**
 * Logo oficial GrowSorcio
 * Ícone: seta diagonal em bloco laranja arredondado
 * Props:
 *   height     — altura total (default 36)
 *   textColor  — cor do texto (default #ffffff)
 */
export default function GrowsorcioLogo({ height = 36, textColor = '#ffffff' }) {
  const iconSize = height;
  const fontSize = height * 0.52;
  const gap = height * 0.34;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {/* Ícone: seta diagonal up-right em bloco laranja */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Fundo laranja com bordas arredondadas */}
        <rect width="100" height="100" rx="20" fill="#FF4500" />

        {/*
          Seta estilo "growth arrow":
          - Base quadrada no canto inferior-esquerdo
          - Haste diagonal subindo para a direita
          - Ponta de seta no canto superior-direito
        */}
        <path
          d="M22 78 L22 54 L46 54 L46 78 Z"
          fill="white"
        />
        <path
          d="M46 54 L46 30 L70 30 L70 54 Z"
          fill="white"
        />
        {/* Ponta da seta — triângulo */}
        <polygon
          points="58,14 86,14 86,42"
          fill="white"
        />
        {/* Linha diagonal preenchendo o "degrau" */}
        <path
          d="M46 54 L70 30 L86 14 L86 42 L70 54 Z"
          fill="white"
        />
      </svg>

      {/* Texto */}
      <span
        style={{
          fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          fontWeight: 700,
          fontSize,
          color: textColor,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        Growsorcio
      </span>
    </span>
  );
}
