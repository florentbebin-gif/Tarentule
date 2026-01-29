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
import CPSocial from './pages/CPSocial';
import ManagerSocialReports from './pages/ManagerSocialReports';
import Accueil from './pages/Accueil';

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
@@ -313,97 +314,91 @@ const isCPSocial = normalizedPoste === 'cpsocial';
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
<Route
  path="/"
  element={
    <Navigate
      to={
        isManager
          ? '/manager'
          : isCPSocial
          ? '/cpsocial'
          : '/rapport'
        '/accueil'
      }
      replace
    />
  }
/>

<Route
  path="/accueil"
  element={<Accueil />}
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

        const target =
          role === 'admin' || role === 'manager'
            ? '/manager'
            : poste === 'cpsocial'
            ? '/cpsocial'
            : '/rapport';

        navigate(target);
        navigate('/accueil');
      }}
    />
  }
/>


        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
         {/* Espace CP Social */}
         <Route path="/cpsocial" element={<CPSocial />} />

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
         <Route
           path="/manager-social"
           element={<ManagerSocialReports />}
         />
        {/* Gestion utilisateurs (manager/admin uniquement) */}
        <Route
          path="/users"
          element={
            isManager ? <UsersAdmin /> : <Navigate to="/rapport" replace />
          }
        />
         
        {/* Paramètres */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}
