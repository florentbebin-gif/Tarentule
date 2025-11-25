import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function RadarChart({ labels, cgpValues, managerValues }) {
  const data = labels.map((label, i) => ({
    label,
    cgp: cgpValues[i] ?? 0,
    manager: managerValues[i] ?? 0,
  }));

  return (
    <RechartsRadarChart
      cx="50%"
      cy="50%"
      outerRadius="80%"
      width={320}
      height={260}
      margin={{ left: 20, right: 40 }}  // empêche que les labels soient coupés
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="label" />
      <PolarRadiusAxis />
      <Tooltip />
      <Legend />

      {/* CGP */}
      <Radar
        name="CGP"
        dataKey="cgp"
        stroke="#2B3E37"
        fill="#2B3E37"
        fillOpacity={0.45}     // légèrement transparent
      />

      {/* Manager */}
      <Radar
        name="Manager"
        dataKey="manager"
        stroke="#FF9900"
        fill="#FF9900"
        fillOpacity={0.25}     // 80% de transparence
      />
    </RechartsRadarChart>
  );
}
