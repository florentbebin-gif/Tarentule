// src/pages/Login.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      // Une fois connecté : on envoie l'utilisateur vers le formulaire de rapport
      window.location.href = '/rapport'
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-bg" />
      <div className="login-card">
        <h1 className="login-title">Tarentule</h1>
        <p className="login-subtitle">Connexion</p>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="form-label">
            Email
            <input
              className="form-input"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Mot de passe
            <input
              className="form-input"
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/mot-de-passe-oublie" className="btn-link">
            Mot de passe oublié ?
          </Link>
          <Link to="/signup" className="btn-link">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}
