// src/pages/RapportForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function RapportForm() {
  const [period, setPeriod] = useState('');
  const [globalScore, setGlobalScore] = useState('');
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // Vérifie que l'utilisateur est connecté
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
      } else {
        setLoadingUser(false);
      }
    };

    checkUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Vous devez être connecté pour enregistrer un rapport.');
      return;
    }

    // Tu pourras enrichir cet objet plus tard avec les champs détaillés de ton Excel
    const dataDetails = {
      // exemple : objectifs, indicateurs, etc.
    };

    const { error: insertError } = await supabase.from('reports').insert({
      user_id: user.id,
      period,
      global_score: globalScore ? Number(globalScore) : null,
      comment,
      data: dataDetails,
    });

    if (insertError) {
      setError(insertError.message || "Erreur lors de l'enregistrement.");
      return;
    }

    setSaved(true);
    setPeriod('');
    setGlobalScore('');
    setComment('');
  };

  if (loadingUser) {
    return <p>Chargement…</p>;
  }

  return (
    <div className="tiles-wrap">
      <div className="section-card">
        <div className="section-title strong-title">Rapport du conseiller</div>

        {error && <div className="alert error">{error}</div>}
        {saved && (
          <div className="alert success">
            Rapport enregistré avec succès.
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Période (ex : T1 2025)</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
          />

          <label>Score global (1 à 10)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={globalScore}
            onChange={(e) => setGlobalScore(e.target.value)}
          />

          <label>Commentaires</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button className="btn" type="submit">
            Enregistrer le rapport
          </button>
        </form>
      </div>
    </div>
  );
}
