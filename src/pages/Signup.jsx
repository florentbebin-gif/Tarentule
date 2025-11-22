// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function Signup() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    // 1) Création du compte dans Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || 'Erreur lors de la création du compte.');
      setLoading(false);
      return;
    }

    // 👉 À ce stade le compte est créé dans Supabase.
    // Si la confirmation par email est activée, l'utilisateur doit cliquer sur le lien reçu.

    setLoading(false);
    setInfo(
      "Votre compte a été créé. Merci de vérifier votre boîte email et de confirmer votre adresse avant de vous connecter."
    );

    // Option : on peut rediriger vers /login après quelques secondes
    // setTimeout(() => navigate('/login'), 4000);
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg" />
      <div className="login-overlay" />
      <div className="login-grid">
        <div className="login-title">
          <h1 className="login-brand">TARENTULE</h1>
        </div>
        <div className="login-card">
          <h2 className="card-title">Création de compte</h2>

          {error && <div className="alert error">{error}</div>}
          {info && <div className="alert success">{info}</div>}

          <form className="form-grid" onSubmit={handleSignup}>
            <label>Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <label>Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <button
            className="btn-link"
            type="button"
            onClick={() => navigate('/login')}
          >
            Déjà un compte ? Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
