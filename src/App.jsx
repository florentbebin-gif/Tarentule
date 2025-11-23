// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import RapportForm from './pages/RapportForm';
import './styles.css';

// -----------------------
// Icônes SVG
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
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    bureau: '',
  });
  const [lastSave, setLastSave] = useState(null);
  const navigate = useNavigate();

  // Récupérer la session courante
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s)
    );
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Charger les infos user + dernière sauvegarde
  useEffect(() => {
    const loadUserInfo = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserInfo({ firstName: '', lastName: '', bureau: '' });
        setLastSave(null);
        return;
      }

      const meta = user.user_metadata || {};
      setUserInfo({
        firstName: meta.first_name || '',
        lastName: meta.last_name || '',
        bureau: meta.bureau || '',
      });

      const { data: reports, error } = await supabase
        .from('reports')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && reports && reports.length > 0) {
        setLastSave(new Date(reports[0].created_at));
      } else {
        setLastSave(null);
      }
    };

    loadUserInfo();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Infos de route
  const isRecoveryMode = window.location.hash.includes('type=recovery');
  const path = window.location.pathname;
  const isSimRoute = path.startsWith('/sim');
  const isSettingsRoute = path.startsWith('/settings');

  // Routes publiques (sans login)
  const isPublicRoute =
    path === '/login' || path === '/signup' || path === '/forgot-password';

  // Redirection si pas connecté
  useEffect(() => {
    if (!session && !isRecoveryMode && !isPublicRoute) {
      navigate('/login');
    }
  }, [session, isRecoveryMode, isPublicRoute, navigate]);

  return (
    <>
           <div className="topbar">
        {/* Gauche : logo / marque */}
        <div className="brandbar">TARENTULE</div>

        {/* Entre TARENTULE et le centre : Bureau */}
        <div className="topbar-bureau">
          <span className="topbar-label">Bureau :</span>{' '}
          {userInfo.bureau || '—'}
        </div>

        {/* Centre : Nom + Prénom */}
        <div className="topbar-center">
          <div className="topbar-line">
            <span className="topbar-label">Nom :</span>{' '}
            {userInfo.lastName || '—'}
          </div>
          <div className="topbar-line">
            <span className="topbar-label">Prénom :</span>{' '}
            {userInfo.firstName || '—'}
          </div>
        </div>

        {/* Entre le centre et les icônes : Dernière sauvegarde */}
        <div className="topbar-lastsave">
          <span className="topbar-label">Dernière sauvegarde :</span>{' '}
          {lastSave
            ? lastSave.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </div>

        {/* Droite : boutons */}
        <div className="top-actions">
          {session && !isRecoveryMode && (
            <>
              {(isSimRoute || isSettingsRoute) && (
                <button
                  className="chip icon-btn"
                  onClick={() => navigate('/')}
                  title="Retour au rapport"
                >
                  <IconHome className="icon" />
                </button>
              )}

              <button
                className="chip icon-btn"
                onClick={() => navigate('/settings')}
                title="Paramètres"
              >
                <IconSettings className="icon" />
              </button>

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


        <div className="top-actions">
          {session && !isRecoveryMode && (
            <>
              {(isSimRoute || isSettingsRoute) && (
                <button
                  className="chip icon-btn"
                  onClick={() => navigate('/')}
                  title="Retour au rapport"
                >
                  <IconHome className="icon" />
                </button>
              )}

              <button
                className="chip icon-btn"
                onClick={() => navigate('/settings')}
                title="Paramètres"
              >
                <IconSettings className="icon" />
              </button>

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
        {/* Racine → rapport */}
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

        {/* Paramètres */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}
