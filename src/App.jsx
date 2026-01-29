// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import RapportForm from './pages/RapportForm';
import ManagerReports from './pages/ManagerReports';
import UsersAdmin from './pages/UsersAdmin';
import Home from './pages/Home';

import './pages/Login.css';
import './styles.css';

/* -------------------------------------------------------
   ICÔNES SVG
------------------------------------------------------- */
const IconHome = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
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
  <svg className={className} viewBox="0 0 24 24">
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
  <svg className={className} viewBox="0 0 24 24">
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
  <svg className={className} viewBox="0 0 24 24">
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

const IconDashboard = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrash = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
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

const IconPlus = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M12 5v14M5 12h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


/* -------------------------------------------------------
   APP PRINCIPAL
------------------------------------------------------- */
export default function App() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('conseiller');
  const [userPoste, setUserPoste] = useState('');      // <-- nouveau
  const [resetRapportKey, setResetRapportKey] = useState(0);


  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    bureau: '',
  });

  const [lastSave, setLastSave] = useState(null);

  /* --------------------------
     Récupération session
  -------------------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  /* --------------------------
     Charger infos utilisateur
  -------------------------- */
  useEffect(() => {
         if (!session) return;        // 🔴 NE RIEN FAIRE TANT QU’ON N’A PAS DE SESSION
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) return;

      // Métadonnées
      setUserInfo({
        firstName: user.user_metadata.first_name || '',
        lastName: user.user_metadata.last_name || '',
        bureau: user.user_metadata.bureau || '',
      });

      // Rôle + poste (table profiles)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, poste')
        .eq('id', user.id)
        .maybeSingle();

      setUserRole(profile?.role || 'conseiller');
      setUserPoste(profile?.poste || '');


      // Dernière sauvegarde
      const { data: reports, error: repErr } = await supabase
        .from('reports')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
       if (repErr) {
         console.error('Failed to load reports lastSave', repErr);
           setLastSave(null);
            return;
       }
      if (reports?.length) {
        setLastSave(new Date(reports[0].created_at));
      }
    };

    loadUser();
  }, [session]);

  /* --------------------------
     Déconnexion
  -------------------------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  /* --------------------------
     Actions Rapport
  -------------------------- */
  const handleClearRapport = () => {
    setResetRapportKey((k) => k + 1);
  };

  /* --------------------------
     Routage Topbar
  -------------------------- */
  const path = window.location.pathname;
  const isManager = userRole === 'manager' || userRole === 'admin';
   const isAdmin = userRole === 'admin';
   
  const isOwnRapport = path === '/rapport';
  const isConseillerReport = path === '/rapport' || path.startsWith('/rapport/');

  const isPublicRoute =
    path === '/login' ||
    path === '/signup' ||
    path === '/forgot-password';

  /* --------------------------
     Redirection si non connecté
  -------------------------- */
  useEffect(() => {
    if (!session && !isPublicRoute) {
      navigate('/login');
    }
  }, [session, isPublicRoute, navigate]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <>
      {/* ----------------------------------------------------
           TOPBAR
      ---------------------------------------------------- */}
      {!isPublicRoute && (
        <div className="topbar">

          <div className="brandbar">TARENTULE</div>

          <div className="topbar-bureau">
            <span className="topbar-label">Bureau :</span>{' '}
            {userInfo.bureau || '—'}
          </div>

          <div className="topbar-center">
            <div className="topbar-line">
              <span className="topbar-label">Nom :</span> {userInfo.lastName}
            </div>
            <div className="topbar-line">
              <span className="topbar-label">Prénom :</span> {userInfo.firstName}
            </div>
          </div>

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

          <div className="top-actions">

              {/* HOME : accessible pour tous */}
              {session && (
                <button
                  className="chip icon-btn"
                  title="Accueil"
                  onClick={() => navigate('/home')}
                >
                  <IconHome className="icon" />
                </button>
              )}
    
             {/* Retour manager : uniquement si manager/admin sur un rapport conseiller */}
              {session && isManager && isConseillerReport && (
                <button
                  className="chip icon-btn"
                  title="Retour manager"
                  onClick={() => navigate('/manager')}
                >
                  <IconDashboard className="icon" />
                </button>
              )}

               {/* FOLDER → mon espace (rapport) */}
                  {!isOwnRapport && session && (
                    <button
                      className="chip icon-btn"
                      title="Mon espace"
                      onClick={() => navigate('/rapport')}
                    >
                   <IconFolder className="icon" />
                    </button>
                     )}

            {/* ADD USERS → uniquement admin */}
            {session && isAdmin && (
              <button
                className="chip icon-btn"
                title="Gestion utilisateurs"
                onClick={() => navigate('/users')}
              >
                <IconPlus className="icon" />
              </button>
            )}
             
            {/* TRASH → uniquement si on est sur SON rapport */}
            {isOwnRapport && (
              <button
                className="chip icon-btn"
                title="Vider mon rapport"
                onClick={handleClearRapport}
              >
                <IconTrash className="icon" />
              </button>
            )}

            {/* Paramètres */}
            <button
              className="chip icon-btn"
              onClick={() => navigate('/settings')}
              title="Paramètres"
            >
              <IconSettings className="icon" />
            </button>

            {/* Logout */}
            <button
              className="chip icon-btn"
              onClick={handleLogout}
              title="Déconnexion"
            >
              <IconLogout className="icon" />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
           ROUTES
      ---------------------------------------------------- */}
      <Routes>
        <Route
          path="/"
          element={
            // Redirection vers la nouvelle page d'accueil post-login.
            <Navigate to="/home" replace />
          }
        />

        <Route
          path="/login"
          element={
            <Login
              onLogin={async () => {
                const {
                  data: { user },
                } = await supabase.auth.getUser();

                const { data: profile } = await supabase
                  .from('profiles')
                  .select('role, poste')
                  .eq('id', user.id)
                  .maybeSingle();

                const role = profile?.role || 'conseiller';
                const rawPoste = profile?.poste || user.user_metadata?.poste || '';
                const poste = rawPoste.toLowerCase();

                // on met aussi à jour le state, pour la topbar
                setUserRole(role);
                setUserPoste(poste);

                // Redirection post-login vers l'accueil.
                navigate('/home');
              }}
            />
          }
        />

        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/home"
          element={<Home userRole={userRole} />}
        />
        {/* Rapport conseiller */}
        <Route
          path="/rapport"
          element={
            <RapportForm
              resetKey={resetRapportKey}
              onSaved={(date) => setLastSave(date)}
            />
          }
        />

        {/* Rapport d'un conseiller (manager/admin) */}
        <Route
          path="/rapport/:userId"
          element={
            <RapportForm
              resetKey={resetRapportKey}
              onSaved={(date) => setLastSave(date)}
            />
          }
        />

        {/* Manager */}
        <Route path="/manager" element={<ManagerReports />} />
        {/* Gestion utilisateurs (admin uniquement) */}
        <Route
          path="/users"
          element={
            isAdmin ? <UsersAdmin /> : <Navigate to="/rapport" replace />
          }
        />
         
        {/* Paramètres */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}
