import React from 'react';
import SettingsNav from '../SettingsNav';

export default function SettingsBaseContrats() {
  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>
        <SettingsNav />

        <div style={{ marginTop: 24 }}>
          <p>Page Base contrats (contenu à venir).</p>
        </div>
      </div>
    </div>
  );
}
