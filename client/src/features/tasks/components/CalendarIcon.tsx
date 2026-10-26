import { useId } from "react";

export function CalendarIcon() {
  const headerGradientId = useId();
  const paperGradientId = useId();
  const bindingGradientId = useId();
  const shadowId = useId();

  return (
    <span className="calendar-icon" aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <defs>
          <linearGradient id={headerGradientId} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#ff6464" />
            <stop offset="45%" stopColor="#ff414c" />
            <stop offset="100%" stopColor="#ed233b" />
          </linearGradient>
          <linearGradient id={paperGradientId} x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eeeeef" />
          </linearGradient>
          <linearGradient id={bindingGradientId} x1="0" y1="0" x2="1" y2="0.7">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fafafa" />
            <stop offset="100%" stopColor="#d3d6da" />
          </linearGradient>
          <filter id={shadowId} x="-40%" y="-30%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.5" floodColor="#263141" floodOpacity="0.22" />
          </filter>
        </defs>
        <g filter={`url(#${shadowId})`}>
          <rect x="11" y="18" width="42" height="39" rx="10" fill={`url(#${paperGradientId})`} />
          <path d="M21 18h22a10 10 0 0 1 10 10v4H11v-4a10 10 0 0 1 10-10Z" fill={`url(#${headerGradientId})`} />
          <path d="M13 26a9 9 0 0 1 9-6h20" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="22" cy="22" r="3.5" fill="#d82231" />
          <circle cx="42" cy="22" r="3.5" fill="#d82231" />
          <rect x="19.5" y="12" width="5" height="11" rx="2.5" fill={`url(#${bindingGradientId})`} />
          <rect x="39.5" y="12" width="5" height="11" rx="2.5" fill={`url(#${bindingGradientId})`} />
          <rect x="18.5" y="37" width="6.5" height="5.8" rx="1.8" fill="#d2d5d9" />
          <rect x="28.8" y="37" width="6.5" height="5.8" rx="1.8" fill="#d2d5d9" />
          <rect x="39" y="37" width="6.5" height="5.8" rx="1.8" fill="#d2d5d9" />
          <rect x="18.5" y="46" width="6.5" height="5.8" rx="1.8" fill="#cdd1d6" />
          <rect x="28.8" y="46" width="6.5" height="5.8" rx="1.8" fill={`url(#${headerGradientId})`} />
          <rect x="39" y="46" width="6.5" height="5.8" rx="1.8" fill="#cdd1d6" />
        </g>
      </svg>
    </span>
  );
}
