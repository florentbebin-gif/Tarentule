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
  const resultatsLabels = [
    '1 - Performance globale : atteinte des objectifs',
    '2 - Produits financiers : assurances vie / Capi',
    '3 - Private Equity',
    '4 - Produits immobiliers : directs et indirects',
    '5 - Honoraires : production / chiffre d’affaires généré',
    '6 - Arbitrages : gestion pilotée, structurés, Pams',
    '7 - PER : dispositifs d’épargne retraite',
    '8 - Campagnes diverses : participation et efficacité',
  ];
  // Formattage des montants en "1 000 €"
  const formatEuro = (raw) => {
    if (!raw) return '';
    const cleaned = raw.toString().replace(/[^\d]/g, '');
    if (!cleaned) return '';
    const number = Number(cleaned);
    if (Number.isNaN(number)) return '';
    return number.toLocaleString('fr-FR') + ' €';
  };

  const formatEuroField = (field, index) => {
    setForm((prev) => {
      const current = prev.resultats[field][index] || '';
      const formatted = formatEuro(current);
      return {
        ...prev,
        resultats: {
          ...prev.resultats,
          [field]: prev.resultats[field].map((v, i) =>
            i === index ? formatted : v
          ),
        },
      };
    });
  };

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
    <div className="credit-panel">
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

        <div className="rapport-section-table">
          {/* PLUS DE TEXTE "Objectifs, réalisés..." ici, demandé supprimé */}

          {/* 1ère ligne d'en-tête : "Note" au-dessus de CGP et N+1 */}
          <div className="rapport-table-header-top">
            <span className="col-libelle"></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span className="note-group-header">Note</span>
          </div>

          {/* 2ème ligne d'en-tête : titres de colonnes */}
          <div className="rapport-table-header-sub">
            <span className="col-libelle">Libellé</span>
            <span>Objectif</span>
            <span>Réalisé</span>
            <span>Potentiel 3 mois</span>
            <span>Potentiel 12 mois</span>
            <span>CGP</span>
            <span>N+1</span>
          </div>

          {/* 8 lignes correspondantes aux 8 items */}
          {Array.from({ length: 8 }).map((_, i) => {
            const isTotalRow = i === 0; // ligne 1 = total, lecture seule pour les montants
            const label = resultatsLabels[i];

            return (
              <div className="rapport-table-row" key={i}>
                <span className="col-libelle">
                  {isTotalRow ? <strong>{label}</strong> : label}
                </span>

                {/* Objectif : lecture seule pour tous profils */}
                <input
                  className="rapport-input"
                  type="text"
                  value={form.resultats.objectifs[i]}
                  readOnly
                />

                {/* Réalisé */}
                <input
                  className="rapport-input"
                  type="text"
                  value={form.resultats.realises[i]}
                  onChange={(e) =>
                    !isTotalRow &&
                    updateArrayField(
                      'resultats',
                      'realises',
                      i,
                      e.target.value
                    )
                  }
                  onBlur={() => !isTotalRow && formatEuroField('realises', i)}
                  readOnly={isTotalRow}
                />

                {/* Potentiel 3 mois */}
                <input
                  className="rapport-input"
                  type="text"
                  value={form.resultats.potentiel3m[i]}
                  onChange={(e) =>
                    !isTotalRow &&
                    updateArrayField(
                      'resultats',
                      'potentiel3m',
                      i,
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    !isTotalRow && formatEuroField('potentiel3m', i)
                  }
                  readOnly={isTotalRow}
                />

                {/* Potentiel 12 mois */}
                <input
                  className="rapport-input"
                  type="text"
                  value={form.resultats.potentiel12m[i]}
                  onChange={(e) =>
                    !isTotalRow &&
                    updateArrayField(
                      'resultats',
                      'potentiel12m',
                      i,
                      e.target.value
                    )
                  }
                  readOnly={isTotalRow}
                />

                {/* Note CGP : saisissable pour tous (y compris ligne 1) */}
                <input
                  className="rapport-input rapport-input-note"
                  type="number"
                  min="1"
                  max="10"
                  value={form.resultats.notesCgp[i]}
                  onChange={(e) =>
                    updateArrayField(
                      'resultats',
                      'notesCgp',
                      i,
                      e.target.value
                    )
                  }
                />

                {/* Note N+1 : même largeur, lecture seule côté conseiller */}
                <input
                  className="rapport-input rapport-input-note manager-cell"
                  type="number"
                  min="1"
                  max="10"
                  readOnly
                  placeholder="—"
                />
              </div>
            );
          })}
        </div>

        {/* Commentaires + stratégie sur toute la largeur */}
        <div className="rapport-comments-block">
          <label>Commentaires</label>
          <textarea
            value={form.resultats.commentaires}
            onChange={(e) =>
              updateField('resultats', 'commentaires', e.target.value)
            }
          />

          <label>Stratégie d’amélioration (manager)</label>
          <textarea
            className="rapport-strategie-manager"
            value={form.resultats.strategie}
            readOnly
            placeholder="Renseigné par le manager"
          />
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
