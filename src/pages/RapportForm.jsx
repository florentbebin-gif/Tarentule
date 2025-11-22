// src/pages/RapportForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function RapportForm() {
  const [period, setPeriod] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);

  const [form, setForm] = useState({
    bienEtre: {
      notesCgp: ['', '', '', ''],
      commentaires: '',
      strategie: '', // rempli par le manager
    },
    partenariat: {
      objectifs: ['', '', ''],
      realises: ['', '', ''],
      notesCgp: ['', '', ''],
      commentaires: '',
      strategie: '', // manager
    },
    resultats: {
      objectifs: Array(8).fill(''),
      realises: Array(8).fill(''),
      potentiel3m: Array(8).fill(''),
      potentiel12m: Array(8).fill(''),
      notesCgp: Array(8).fill(''),
      commentaires: '',
      strategie: '', // manager
    },
    technique: {
      notesCgp: ['', '', '', '', ''],
      commentaires: '',
      strategie: '', // manager
    },
  });

  // Vérifie que l'utilisateur est connecté
  useEffect(() => {
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

  const updateArrayField = (section, field, index, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].map((v, i) =>
          i === index ? value : v
        ),
      },
    }));
  };

  const updateField = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

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

    const { error: insertError } = await supabase.from('reports').insert({
      user_id: user.id,
      period,
      global_score: null,
      comment: '',
      data: form,
    });

    if (insertError) {
      setError(insertError.message || "Erreur lors de l'enregistrement.");
      return;
    }

    setSaved(true);
  };

  if (loadingUser) {
    return <p>Chargement…</p>;
  }

  return (
    <div className="rapport-wrap">
      {/* En-tête rapport */}
      <div className="section-card">
        <div className="section-title strong-title">
          Rapport du conseiller
        </div>

        {error && <div className="alert error">{error}</div>}
        {saved && (
          <div className="alert success">
            Rapport enregistré avec succès.
          </div>
        )}

        <label>Période du rapport (ex : T1 2025)</label>
        <input
          type="text"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          required
        />
      </div>

      {/* 1. RÉSULTATS */}
      <div className="section-card">
        <div className="section-title strong-title">Résultats</div>

        <ul className="section-list">
          <li>Performance globale : atteinte des objectifs</li>
          <li>Produits financiers : assurances vie / Capi</li>
          <li>Private Equity</li>
          <li>Produits immobiliers : directs et indirects</li>
          <li>Honoraires : production / chiffre d’affaires généré</li>
          <li>Arbitrages : gestion pilotée, structurés, Pams</li>
          <li>PER : dispositifs d’épargne retraite</li>
          <li>
            Campagnes diverses : participation et efficacité dans les campagnes
          </li>
        </ul>

        <div className="rapport-section-table">
          <div className="rapport-section-title-row">
            Objectifs, réalisés &amp; potentiel (conseiller)
          </div>

          {/* Ligne d’en-tête */}
          <div className="rapport-table-header">
            <span className="col-ligne">Ligne</span>
            <span>Objectif</span>
            <span>Réalisé</span>
            <span>Potentiel 3 mois</span>
            <span>Potentiel 12 mois</span>
            <span>Note CGP</span>
            <span>Manager</span>
          </div>

          {/* 8 lignes comme dans ton Excel */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="rapport-table-row" key={i}>
              <span className="col-ligne">{i + 1}</span>

              <input
                className="rapport-input"
                type="text"
                value={form.resultats.objectifs[i]}
                onChange={(e) =>
                  updateArrayField('resultats', 'objectifs', i, e.target.value)
                }
              />
              <input
                className="rapport-input"
                type="text"
                value={form.resultats.realises[i]}
                onChange={(e) =>
                  updateArrayField('resultats', 'realises', i, e.target.value)
                }
              />
              <input
                className="rapport-input"
                type="text"
                value={form.resultats.potentiel3m[i]}
                onChange={(e) =>
                  updateArrayField('resultats', 'potentiel3m', i, e.target.value)
                }
              />
              <input
                className="rapport-input"
                type="text"
                value={form.resultats.potentiel12m[i]}
                onChange={(e) =>
                  updateArrayField(
                    'resultats',
                    'potentiel12m',
                    i,
                    e.target.value
                  )
                }
              />
              <input
                className="rapport-input rapport-input-note"
                type="number"
                min="1"
                max="10"
                value={form.resultats.notesCgp[i]}
                onChange={(e) =>
                  updateArrayField('resultats', 'notesCgp', i, e.target.value)
                }
              />

              {/* zone manager en lecture seule */}
              <input
                className="rapport-input manager-cell"
                type="text"
                disabled
                placeholder="Manager"
              />
            </div>
          ))}
        </div>

        <div className="rapport-comments-block">
          <div className="rapport-comments-column">
            <label>Commentaires</label>
            <textarea
              value={form.resultats.commentaires}
              onChange={(e) =>
                updateField('resultats', 'commentaires', e.target.value)
              }
            />
          </div>

          <div className="rapport-comments-column">
            <label>Stratégie d’amélioration (manager)</label>
            <textarea
              value={form.resultats.strategie}
              readOnly
              placeholder="Renseigné par le manager"
            />
          </div>
        </div>
      </div>


      {/* 2. PARTENARIAT */}
      <div className="section-card">
        <div className="section-title strong-title">Partenariat</div>
        <ul className="section-list">
          <li>
            Clubs Experts : gestion des invitations, relances et animation
          </li>
          <li>
            Animation : entretien du réseau, suivi, régularité des visites
          </li>
          <li>Prospection : actions pour développer le réseau</li>
        </ul>

        <div className="sub-section">
          <div className="sub-section-title">
            Objectifs & réalisés (conseiller)
          </div>
          <div className="notes-table">
            <div className="notes-header">
              <span>Ligne</span>
              <span>Objectif (nb)</span>
              <span>Réalisé (nb)</span>
              <span>Note CGP (1 à 10)</span>
              <span>Manager</span>
            </div>
            {[0, 1, 2].map((i) => (
              <div className="notes-row" key={i}>
                <span>{i + 1}</span>
                <input
                  type="number"
                  value={form.partenariat.objectifs[i]}
                  onChange={(e) =>
                    updateArrayField(
                      'partenariat',
                      'objectifs',
                      i,
                      e.target.value
                    )
                  }
                />
                <input
                  type="number"
                  value={form.partenariat.realises[i]}
                  onChange={(e) =>
                    updateArrayField(
                      'partenariat',
                      'realises',
                      i,
                      e.target.value
                    )
                  }
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.partenariat.notesCgp[i]}
                  onChange={(e) =>
                    updateArrayField(
                      'partenariat',
                      'notesCgp',
                      i,
                      e.target.value
                    )
                  }
                />
                <input type="text" disabled placeholder="Manager" />
              </div>
            ))}
          </div>
        </div>

        <label>Commentaires</label>
        <textarea
          value={form.partenariat.commentaires}
          onChange={(e) =>
            updateField('partenariat', 'commentaires', e.target.value)
          }
        />

        <label>Stratégie d’amélioration (manager)</label>
        <textarea
          value={form.partenariat.strategie}
          readOnly
          placeholder="Renseigné par le manager"
        />
      </div>

      {/* 3. TECHNIQUE */}
      <div className="section-card">
        <div className="section-title strong-title">Technique</div>
        <ul className="section-list">
          <li>Commerciale : techniques de vente et relation client</li>
          <li>
            Civile : compétences techniques sur les aspects civils / juridiques
          </li>
          <li>Société : montages et problématiques</li>
          <li>Outils : Big, Hubspot, SIO2, Extranet, Power BI</li>
          <li>Process interne : organisation Relation Middle</li>
        </ul>

        <div className="sub-section">
          <div className="sub-section-title">Notes CGP (1 à 10)</div>
          <div className="notes-grid">
            {form.technique.notesCgp.map((val, i) => (
              <div key={i} className="note-cell">
                <span>{i + 1}</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={val}
                  onChange={(e) =>
                    updateArrayField(
                      'technique',
                      'notesCgp',
                      i,
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <label>Commentaires</label>
        <textarea
          value={form.technique.commentaires}
          onChange={(e) =>
            updateField('technique', 'commentaires', e.target.value)
          }
        />

        <label>Stratégie d’amélioration (manager)</label>
        <textarea
          value={form.technique.strategie}
          readOnly
          placeholder="Renseigné par le manager"
        />
      </div>

      {/* 4. BIEN-ÊTRE */}
      <div className="section-card">
        <div className="section-title strong-title">Bien-être</div>
        <ul className="section-list">
          <li>Équilibre psychologique / gestion du stress</li>
          <li>Motivation</li>
          <li>Niveau d’intégration dans l’équipe et l’entreprise</li>
          <li>Satisfaction et épanouissement au travail</li>
        </ul>

        <div className="sub-section">
          <div className="sub-section-title">Notes CGP (1 à 10)</div>
          <div className="notes-grid">
            {form.bienEtre.notesCgp.map((val, i) => (
              <div key={i} className="note-cell">
                <span>{i + 1}</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={val}
                  onChange={(e) =>
                    updateArrayField(
                      'bienEtre',
                      'notesCgp',
                      i,
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <label>Commentaires</label>
        <textarea
          value={form.bienEtre.commentaires}
          onChange={(e) =>
            updateField('bienEtre', 'commentaires', e.target.value)
          }
        />

        <label>Stratégie d’amélioration (manager)</label>
        <textarea
          value={form.bienEtre.strategie}
          readOnly
          placeholder="Renseigné par le manager"
        />
      </div>

      {/* Bouton global */}
      <div className="section-card">
        <button className="btn" onClick={handleSubmit}>
          Enregistrer le rapport complet
        </button>
      </div>
    </div>
  );
}
