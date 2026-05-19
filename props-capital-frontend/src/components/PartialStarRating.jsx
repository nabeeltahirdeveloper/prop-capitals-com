import React from 'react';

const PartialStarRating = ({ rating, size = 24 }) => {
  const gap = 4;
  const totalWidth = size * 5 + gap * 4;
  const r = size / 2;
  const outerR = r * 0.9;
  const innerR = r * 0.38;

  const getStarPath = (offsetX) => {
    const cx = offsetX + r;
    const cy = r;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
    }
    return `M${pts.join('L')}Z`;
  };

  return (
    <svg
      width={totalWidth}
      height={size}
      viewBox={`0 0 ${totalWidth} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const x = i * (size + gap);
          const fillWidth = size * Math.min(1, Math.max(0, rating - i));
          return (
            <clipPath key={i} id={`tp-clip-${i}`}>
              <rect x={x} y={0} width={fillWidth} height={size} />
            </clipPath>
          );
        })}
      </defs>
      {[0, 1, 2, 3, 4].map((i) => {
        const x = i * (size + gap);
        const d = getStarPath(x);
        return (
          <g key={i}>
            <path d={d} fill="#d1d5db" />
            <path d={d} fill="#00b67a" clipPath={`url(#tp-clip-${i})`} />
          </g>
        );
      })}
    </svg>
  );
};

export default PartialStarRating;
