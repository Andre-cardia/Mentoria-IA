/**
 * Badges da patente e da nave do aluno, exibidos ao lado do nome no ranking.
 * @param {{ rank: { name: string, badge: string, ship: { name: string, badge: string } } | null, size?: number }} props
 */
export default function RankInsignia({ rank, size = 30 }) {
  if (!rank) return null;
  const imgStyle = { width: `${size}px`, height: `${size}px`, display: 'block', flexShrink: 0 };
  return (
    <span
      role="img"
      aria-label={`Patente ${rank.name}, nave ${rank.ship.name}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}
    >
      <img src={rank.badge} alt="" title={rank.name} width={size} height={size} loading="lazy" style={imgStyle} />
      <img src={rank.ship.badge} alt="" title={rank.ship.name} width={size} height={size} loading="lazy" style={imgStyle} />
    </span>
  );
}
