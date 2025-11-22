import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import SettingsImpots from './pages/Sous-Settings/SettingsImpots';
import SettingsPrelevements from './pages/Sous-Settings/SettingsPrelevements';
import SettingsFiscalites from './pages/Sous-Settings/SettingsFiscalites';
import SettingsBaseContrats from './pages/Sous-Settings/SettingsBaseContrats';
import SettingsTableMortalite from './pages/Sous-Settings/SettingsTableMortalite';
import Signup from './pages/Signup';
import RapportForm from './pages/RapportForm';

// -----------------------
// Icônes SVG "maison"
// -----------------------
const IconHome = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 11.5 12 4l8 7.5v7.5a1 1 0 0 1-1 1h-4.5a1 1 0 0 1-1-1v-4h-3v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSave = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 4h10l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 4v4h6V4M9 20v-5h6v5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconFolder = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4.2l1.6 2h8.7a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrash = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLogout = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M15 12H4M11 8l-4 4 4 4M15 4h4v16h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSettings = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a7.6 7.6 0 0 0 .1-6l-2.2-.4a5.8 5.8 0 0 0-1.1-1.9l.4-2.1a7.6 7.6 0 0 0-6 0l.4 2.1a5.8 5.8 0 0 0-1.1 1.9l-2.2.4a7.6 7.6 0 0 0 .1 6l2.2.4a5.8 5.8 0 0 0 1.1 1.9l-.4 2.1a7.6 7.6 0 0 0 6 0l-.4-2.1a5.8 5.8 0 0 0 1.1-1.9z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_event, s) => setSession(s));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

const isRecoveryMode = window.location.hash.includes('type=recovery');
const path = window.location.pathname;
const isSimRoute = path.startsWith('/sim');
const isSettingsRoute = path.startsWith('/settings');

// Routes accessibles sans être connecté
const isPublicRoute =
  path === '/login' ||
  path === '/signup' ||
  path === '/forgot-password';

// Redirection si pas connecté
useEffect(() => {
  if (!session && !isRecoveryMode && !isPublicRoute) {
    navigate('/login');
  }
}, [session, isRecoveryMode, isPublicRoute, navigate]);

  return (
    <>
      <div className="topbar">
        <div className="brandbar">Tarentule</div>

        <div className="top-actions">
          {session && !isRecoveryMode && (
            <>
              {/* HOME */}
              {(isSimRoute || isSettingsRoute) && (
                <button
                  className="chip icon-btn"
                  onClick={() => navigate('/')}
                  title="Retour à l'accueil"
                >
                  <IconHome className="icon" />
                </button>
              )}

              {/* PARAMÈTRES — juste avant Déconnexion */}
              <button
                className="chip icon-btn"
                onClick={() => navigate('/settings')}
                title="Paramètres"
              >
                <IconSettings className="icon" />
              </button>

              {/* DÉCONNEXION */}
              <button
                className="chip icon-btn"
                onClick={handleLogout}
                title="Se déconnecter"
              >
                <IconLogout className="icon" />
              </button>
            </>
          )}
        </div>
      </div>

      <Routes>
        {/* Page racine : on redirige vers /rapport */}
        <Route path="/" element={<Navigate to="/rapport" replace />} />

        {/* Auth */}
        <Route
          path="/login"
          element={<Login onLogin={() => navigate('/rapport')} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />

        {/* Rapport conseiller */}
        <Route path="/rapport" element={<RapportForm />} />

        {/* Paramètres + sous-pages */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/impots" element={<SettingsImpots />} />
        <Route
          path="/settings/prelevements-sociaux"
          element={<SettingsPrelevements />}
        />
        <Route
          path="/settings/fiscalites-contrats"
          element={<SettingsFiscalites />}
        />
        <Route
          path="/settings/base-contrat"
          element={<SettingsBaseContrats />}
        />
        <Route
          path="/settings/table-mortalite"
          element={<SettingsTableMortalite />}
        />
      </Routes>

    </>
  );
}
