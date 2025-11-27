// src/pages/CPSocial.jsx
import React from 'react';
import './Login.css'; // pour réutiliser les styles de cartes / inputs

export default function CPSocial() {
  return (
    <div className="credit-panel rapport-layout">
      {/* Colonne principale */}
      <div className="rapport-main">
        <div className="section-card">
          <div className="section-title strong-title">
            Espace CP Social
          </div>
          <p>
            Cette page est dédiée aux CP Social. 
            Elle sera complétée avec les indicateurs et sections spécifiques.
          </p>
        </div>
      </div>

      {/* Colonne droite – comme les radars / board dans le rapport */}
      <div className="rapport-charts">
        <div className="section-card">
          <div className="section-title">
            Board CP Social
          </div>
          <p>
            Zone réservée aux futurs graphiques / tableaux pour les CP Social.
          </p>
        </div>
      </div>
    </div>
  );
}
