// Símbolos estelares em traço fino, no mesmo espírito de um painel de missão.
// O traço herda a cor do texto (currentColor).
const GLYPHS = {
  // Arco de voo com o ponto de chegada
  trajectory: (
    <>
      <path d="M3 19c4-11 10-14 18-15" />
      <path d="M15.5 3.2 21 4l-1.4 5.3" />
      <circle cx="3.6" cy="18.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  // Planeta com órbita
  orbit: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)" />
      <circle cx="20.4" cy="7.4" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  // Antena transmitindo
  signal: (
    <>
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6" />
      <path d="M5.2 5.2a9.6 9.6 0 0 0 0 13.6M18.8 5.2a9.6 9.6 0 0 1 0 13.6" />
    </>
  ),
  // Mira de sondagem
  scan: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  // Constelação: pontos ligados
  link: (
    <>
      <path d="M4.5 16.5 10 7l6.5 6 3.5-8.5" />
      <circle cx="4.5" cy="16.5" r="1.5" />
      <circle cx="10" cy="7" r="1.5" />
      <circle cx="16.5" cy="13" r="1.5" />
      <circle cx="20" cy="4.5" r="1.5" />
    </>
  ),
  // Galáxia espiral
  galaxy: (
    <>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 6.5c4.5 0 7 2.6 7 5.5M12 17.5c-4.5 0-7-2.6-7-5.5" />
      <path d="M12 3c6.5.3 10 4 10 9M12 21c-6.5-.3-10-4-10-9" opacity=".55" />
    </>
  ),
  // Estrela de quatro pontas: o ápice
  star: <path d="M12 2.5c.7 5.6 3.2 8.4 9.5 9.5-6.3 1.1-8.800 3.900-9.500 9.500-.700-5.600-3.200-8.400-9.500-9.500 6.300-1.100 8.800-3.900 9.500-9.500Z" />,
};

export default function StellarGlyph({ name, size = 24, strokeWidth = 1.3 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {GLYPHS[name] ?? GLYPHS.star}
    </svg>
  );
}
