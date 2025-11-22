// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Signup from './pages/Signup'
import RapportForm from './pages/RapportForm'
import ManagerReports from './pages/ManagerReports'

function App() {
  return (
    <>
      <Routes>
        {/* Page d'accueil : redirige vers /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authentification */}
        <Route path="/login" element={<Login />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />

        {/* Pages protégées (on vérifiera la connexion DANS les pages) */}
        <Route path="/rapport" element={<RapportForm />} />
        <Route path="/manager" element={<ManagerReports />} />

        {/* Route inconnue => retour login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default App
