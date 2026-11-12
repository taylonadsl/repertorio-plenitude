// Equalizador: a marca visual do site. "live" anima as barras (só na tela de entrada).
const LEVELS = [38, 62, 84, 55, 92, 70, 46, 78, 100, 66, 52, 88, 74, 40, 58, 96, 68, 48, 82, 60, 36, 72, 90, 54];

export function Equalizer({ live = false, count = 24 }) {
  return (
    <div className={`eq ${live ? 'live' : ''}`} aria-hidden="true">
      {LEVELS.slice(0, count).map((h, i) => (
        <span key={i} style={{ '--h': `${h}%`, '--d': `${(i * 137) % 900}ms` }} />
      ))}
    </div>
  );
}

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <linearGradient id="lm" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="9" fill="url(#lm)" />
      {[[7, 11, 6], [11.5, 7, 14], [16, 9, 10], [20.5, 12, 4]].map(([x, y, h], i) => (
        <rect key={i} x={x - 1.1} y={y} width="2.2" height={h} rx="1.1" fill="#fff" />
      ))}
    </svg>
  );
}
