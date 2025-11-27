// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

const BUREAUX = [
  'Aix en Provence',
  'Angers',
  'Annecy',
  'Bordeaux',
  'Bourges',
  'Brest',
  'Caen',
  'Cambrai',
  'Caraïbes',
  'Cholet',
  'Clermont',
  'Client Direct',
  'Dijon',
  'Gap',
  'Grenoble',
  'International',
  'La rochelle',
  'Le Mans',
  'Licorne',
  'Lille',
  'Lyon',
  'Marseille',
  'Montargis',
  'Montpellier',
  'Mulhouse',
  'Nantes',
  'Nice',
  'Paris',
  'Perpignan',
  'Rennes',
  'Rouen',
  'Réunion',
  'Saint Brieuc',
  'Sport',
  'St Remy de Provence',
  'Strasbourg',
  'Toulon',
  'Toulouse',
  'Tours',
  'Valence',
  'Vannes',
];

export default function Signup() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [bureau, setBureau] = useState('');
    const [poste, setPoste] = useState('');


  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    // Petite validation locale
    if (!poste) {
      setError('Merci de sélectionner un poste occupé.');
      setLoading(false);
      return;
    }

    // 1) Création du compte dans Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          bureau,
          poste,
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() || '';

      if (msg.includes('already registered') || msg.includes('user already exists')) {
        setError('Un compte existe déjà avec cet email.');
      } else {
        setError(signUpError.message || 'Erreur lors de la création du compte.');
      }
      setLoading(false);
      return;
    }

    // 2) Mettre à jour le profil (table public.profiles)
    if (data?.user) {
      await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          bureau,
          poste,
        })
        .eq('id', data.user.id);
    }

    setLoading(false);
    setInfo(
      "Votre compte a été créé. Vous pouvez maintenant vous connecter."
    );
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
            
          <label>Bureau</label>
          <select
            value={bureau}
            onChange={(e) => setBureau(e.target.value)}
            required
          >
            <option value="">Sélectionner un bureau</option>
            {BUREAUX.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
            
          </select>
            <label>Poste occupé</label>
            <select
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              required
            >
              <option value="">Sélectionner un poste</option>
              <option value="CGP">CGP</option>
              <option value="CPSocial">CPSocial</option>
            </select>


            
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
