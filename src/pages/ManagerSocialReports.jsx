// src/pages/ManagerSocialReports.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ManagerSocialReports() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2024');

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  return (
    <div className="credit-panel">
      {/* Header identique à ManagerReports */}
      <div
        className="reports-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        {/* Années */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select value={selectedYear} onChange={handleYearChange}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>

          <span>
            Année sélectionnée : <strong>{selectedYear}</strong>
          </span>
        </div>

        {/* Boutons navigation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="chip"
            onClick={() => navigate('/manager')}
          >
            Patrimonial
          </button>

          <button className="chip active">
            Social
          </button>
        </div>
      </div>

      {/* Contenu vide pour le moment */}
      <div className="section-card">
        <div className="section-title strong-title">
          Reporting Social – Manager
        </div>

        <p>
          Cette page accueillera les rapports sociaux des conseillers.
        </p>
      </div>
    </div>
  );
}
