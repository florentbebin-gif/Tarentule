// src/components/PerformanceChart.jsx
import React from 'react';

export default function PerformanceChart({ objectif, realise }) {
  const width = 180;
  const height = 70;
  const innerWidth = width - 70; // laisse de la place pour les labels
  const max = Math.max(objectif, realise, 1);

  const objectifWidth = (objectif / max) * innerWidth;
  const realiseWidth = (realise / max) * innerWidth;

  const fmt = (n) =>
    (Number.isNaN(n) ? 0 : n).toLocaleString('fr-FR') + ' €';

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
        fill="#CFDED8"        // couleur claire du thème
      />
      <text x={60 + objectifWidth + 4} y="19" fontSize="10" fill="#4b5563">
        {fmt(objectif)}
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
        fill="#2B3E37"        // vert foncé du thème
      />
      <text x={60 + realiseWidth + 4} y="45" fontSize="10" fill="#4b5563">
        {fmt(realise)}
      </text>
    </svg>
  );
}
