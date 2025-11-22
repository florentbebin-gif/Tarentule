// src/pages/SettingsNav.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SETTINGS_TABS = [
  { key: 'general', label: 'Généraux', path: '/settings' },
  { key: 'impots', label: 'Impôts', path: '/settings/impots' },
  { key: 'prelevements', label: 'Prélèvements sociaux', path: '/settings/prelevements-sociaux' },
  { key: 'fiscalites', label: 'Fiscalités contrats', path: '/settings/fiscalites-contrats' },
  { key: 'base-contrat', label: 'Base contrats', path: '/settings/base-contrat' },
  { key: 'table-mortalite', label: 'Table de mortalité', path: '/settings/table-mortalite' },
];

export default function SettingsNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  let activeKey = 'general';
  if (path.startsWith('/settings/impots')) activeKey = 'impots';
  else if (path.startsWith('/settings/prelevements-sociaux')) activeKey = 'prelevements';
  else if (path.startsWith('/settings/fiscalites-contrats')) activeKey = 'fiscalites';
  else if (path.startsWith('/settings/base-contrat')) activeKey = 'base-contrat';
  else if (path.startsWith('/settings/table-mortalite')) activeKey = 'table-mortalite';

  return (
    <div className="settings-nav">
      {SETTINGS_TABS.map((tab) => {
        const isActive = tab.key === activeKey;

        const handleClick = () => {
          // ⛔ Si la pilule est déjà active, on ne fait rien
          if (isActive) return;
          navigate(tab.path);
        };

        return (
          <button
            key={tab.key}
            type="button"
            className={`settings-pill${isActive ? ' is-active' : ''}`}
            onClick={handleClick}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
