// src/pages/RapportForm.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function RapportForm() {
  const [period, setPeriod] = useState('')
  const [globalScore, setGlobalScore] = useState('')
  const [comment, setComment] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    // On vérifie que l'utilisateur est connecté
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
      } else {
        setLoadingUser(false)
      }
    }
    checkUser()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Vous devez être connecté.')
      return
    }

    // Exemple de données supplémentaires basées sur ton Excel
    const dataDetails = {
      // Tu pourras ajouter ici des champs plus détaillés
      // ex: objectifs, indicateurs, etc.
    }

    const { error: insertError } = await supabase.from('reports').insert({
      user_id: user.id,
      period,
      global_score: globalScore ? Number(globalScore) : null,
      comment,
      data: dataDetails,
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSaved(true)
    setPeriod('')
    setGlobalScore('')
    setComment('')
  }

  if (loadingUser) {
    return <p>Chargement…</p>
  }

  return (
    <div className="page rapport">
      <h1>Remplir un rapport</h1>

      <form onSubmit={handleSubmit} className="simple-form">
        <label>
          Période (ex : T1 2025)
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
          />
        </label>

        <label>
          Score global (1 à 10)
          <input
            type="number"
            min="1"
            max="10"
            value={globalScore}
            onChange={(e) => setGlobalScore(e.target.value)}
          />
        </label>

        <label>
          Commentaires
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>

        {error && <p className="error-text">{error}</p>}
        {saved && <p className="success-text">Rapport enregistré.</p>}

        <button className="btn" type="submit">
          Enregistrer le rapport
        </button>
      </form>
    </div>
  )
}
