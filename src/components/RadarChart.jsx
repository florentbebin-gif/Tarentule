// src/components/RadarChart.jsx
import React from 'react';

const MAX_NOTE = 10;

export default function RadarChart({ labels, cgpValues = [], managerValues = [] }) {
  const size = 140;
  const center = size / 2;
  const radius = size / 2 - 32;
  const angleStep = (Math.PI * 2) / labels.length;

  const toPoint = (value, index, rOverride) => {
    const angle = -Math.PI / 2 + angleStep * index;
    const r =
      rOverride != null
        ? rOverride
        : ((Number(value) || 0) / MAX_NOTE) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return [x, y];
  };

  const buildPath = (values) => {
    if (!values || !values.length) return '';
    const commands = values.map((v, i) => {
      const [x, y] = toPoint(v, i);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return commands.join(' ') + ' Z';
  };

  const gridLevels = [2, 4, 6, 8, 10];

  const hasCgp = cgpValues.some((v) => Number(v) > 0);
  const hasManager = managerValues.some((v) => Number(v) > 0);

  return (
    <svg width={size} height={size} className="radar-chart">
      {/* Grille */}
      {gridLevels.map((lvl, idx) => {
        const r = (lvl / MAX_NOTE) * radius;
        const points = labels
          .map((_, i) => {
            const angle = -Math.PI / 2 + angleStep * i;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={lvl}
            points={points}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={idx === gridLevels.length - 1 ? 1.2 : 0.8}
          />
        );
      })}

      {/* Axes */}
      {labels.map((_, i) => {
        const [x, y] = toPoint(MAX_NOTE, i);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.8"
          />
        );
      })}

      {/* CGP : zone pleine #CFDED8 en fond */}
      {hasCgp && (
        <path
          d={buildPath(cgpValues)}
          fill="#CFDED8"
          fillOpacity="1"
          stroke="#2B3E37"
          strokeWidth="1.2"
        />
      )}

      {/* N+1 : au-dessus, opacité 80%, bord gris clair */}
      {hasManager && (
        <path
          d={buildPath(managerValues)}
          fill="#2B3E37"
          fillOpacity="0.3"
          stroke="#e5e7eb"
          strokeWidth="1.2"
        />
      )}

      {/* Libellés autour */}
      {labels.map((label, i) => {
        const angle = -Math.PI / 2 + angleStep * i;
        const labelRadius = radius + 12; // texte en dehors de la zone notée
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="radar-label"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
