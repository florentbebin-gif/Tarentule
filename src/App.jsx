// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import './pages/Login.css'; 
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import RapportForm from './pages/RapportForm';
import './styles.css';
import ManagerReports from './pages/ManagerReports';


// Icônes SVG
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

export default function App() {
  const [session, setSession] = useState(null);
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    bureau: '',
  });
  const [lastSave, setLastSave] = useState(null);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('user');
  const [userRole, setUserRole] = useState('conseiller');
  const [resetRapportKey, setResetRapportKey] = useState(0);
  
  // Récupère la session actuelle
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Charge les infos user + dernière sauvegarde
  useEffect(() => {
    const loadUserInfo = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

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

    // Charge le rôle de l'utilisateur (admin / manager / user)
  useEffect(() => {
    const loadRole = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        setUserRole('conseiller');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = String(profile?.role || 'conseiller').toLowerCase();
      setUserRole(role);
    };

    loadRole();
  }, [session]);

  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isRecoveryMode = window.location.hash.includes('type=recovery');
  const path = window.location.pathname;
  const isSimRoute = path.startsWith('/sim');
  const isSettingsRoute = path.startsWith('/settings');
  const isManagerLike = userRole === 'manager' || userRole === 'admin';
  const isManagerDetailRoute = path.startsWith('/rapport/') && isManagerLike;
  const isOwnRapportRoute = path === '/rapport';
  const isManagerRoute = path.startsWith('/manager');
   const isForgotPasswordRoute = path.startsWith('/forgot-password');
  const isSignupRoute = path.startsWith('/signup');

  const handleClearRapport = () => {
    // On incrémente juste une clé qui sera observée par RapportForm
    setResetRapportKey((k) => k + 1);
    // Optionnel : on peut aussi remettre la "dernière sauvegarde" à vide
    // setLastSave(null);
  };
  
  const isManagerLike =
    userRole === 'manager' || userRole === 'admin';

  const isPublicRoute =
    path === '/login' || path === '/signup' || path === '/forgot-password';

  // Redirection si non connecté
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

              {isManagerDetailRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => navigate('/manager')}
                  title="Retour synthèse manager"
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
  element={
    <Login
      onLogin={async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const role = String(
          profile?.role || user.user_metadata?.role || 'user'
        ).toLowerCase();

        if (role === 'admin' || role === 'manager') {
          navigate('/manager');
        } else {
          navigate('/rapport');
        }
      }}
    />
  }
/>

        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/manager" element={<ManagerReports />} />

        {/* Rapport conseiller (pour soi) */}
        <Route
          path="/rapport"
          element={<RapportForm onSaved={(date) => setLastSave(date)} />}
        />

        {/* Rapport d'un conseiller ciblé (pour manager/admin) */}
        <Route
          path="/rapport/:userId"
          element={<RapportForm onSaved={(date) => setLastSave(date)} />}
        />

        {/* Paramètres */}
        <Route path="/settings" element={<Settings />} />

      </Routes>
    </>
  );
}
