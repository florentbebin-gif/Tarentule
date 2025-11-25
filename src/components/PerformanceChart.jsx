// src/components/PerformanceChart.jsx
import React from 'react';

function formatShortEuro(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);

  let unit = '€';
  let divisor = 1;

  if (abs >= 1_000_000) {
    unit = 'M€';
    divisor = 1_000_000;
  } else if (abs >= 1_000) {
    unit = 'K€';
    divisor = 1_000;
  }

  const short = (n / divisor).toLocaleString('fr-FR', {
    maximumFractionDigits: 1,
  });

  return `${short} ${unit}`;
}

export default function PerformanceChart({ objectif, realise }) {
  const width = 190;
  const height = 70;

  // on laisse un peu plus de marge à droite pour que le texte ne soit pas coupé
  const innerWidth = width - 80;

  const safeObj = Number(objectif) || 0;
  const safeReal = Number(realise) || 0;

  const max = Math.max(safeObj, safeReal, 1);

  const objectifWidth = (safeObj / max) * innerWidth;
  const realiseWidth = (safeReal / max) * innerWidth;

  const percent =
    safeObj > 0 ? Math.round((safeReal / safeObj) * 100) : 0;

  return (
    <svg width={width} height={height}>
      {/* Objectifs */}
      <text x="0" y="20" fontSize="11" fill="#111827">
        Objectifs
      </text>
      <rect
        x="60"
        y="10"
        width={objectifWidth}
        height="10"
        rx="3"
        fill="#CFDED8"
      />
      <text
        x={60 + objectifWidth + 4}
        y="19"
        fontSize="10"
        fill="#4b5563"
      >
        {formatShortEuro(safeObj)}
      </text>

      {/* Réalisé */}
      <text x="0" y="46" fontSize="11" fill="#111827">
        Réalisé
      </text>
      <rect
        x="60"
        y="36"
        width={realiseWidth}
        height="10"
        rx="3"
        fill="#2B3E37"
      />
      <text
        x={60 + realiseWidth + 4}
        y="45"
        fontSize="10"
        fill="#4b5563"
      >
        {percent} %
      </text>
    </svg>
  );
}
