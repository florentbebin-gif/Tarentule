// src/pages/Signup.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './Login.css'

export default function Signup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1) Création du compte dans Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const user = data.user

    // 2) Création du profil associé
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      role: 'conseiller', // par défaut
    })

    setLoading(false)

    if (profileError) {
      setError(profileError.message)
      return
    }

    // Redirection vers la page login
    window.location.href = '/login'
  }

  return (
    <div className="login-wrapper">
      <div className="login-bg" />
      <div className="login-card">
        <h1 className="login-title">Tarentule</h1>
        <p className="login-subtitle">Créer un compte</p>

        <form className="login-form" onSubmit={handleSignup}>
          <label className="form-label">
            Prénom
            <input
              className="form-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Nom
            <input
              className="form-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/login" className="btn-link">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
