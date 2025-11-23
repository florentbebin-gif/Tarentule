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
  // Libellés des lignes
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
    const partenariatLabels = [
    '1 - Clubs Experts : gestion des invitations, relances et animation',
    '2 - Animation : entretien du réseau, suivi, régularité des visites',
    '3 - Prospection : actions pour développer le réseau',
  ];

  const bienEtreLabels = [
    '1 - Équilibre psychologique / gestion du stress',
    '2 - Motivation',
    '3 - Niveau d’intégration dans l’équipe et l’entreprise',
    '4 - Satisfaction et épanouissement au travail',
  ];

  const techniqueLabels = [
    '1 - Commerciale : techniques de vente et relation client',
    '2 - Civile : compétences techniques sur les aspects civils / juridiques',
    '3 - Société : montages et problématiques',
    '4 - Outils : Big, Hubspot, SIO2, Extranet, Power BI',
    '5 - Process interne : organisation Relation Middle',
  ];


  // Conversion "1 000 €" -> 1000
  const parseEuro = (value) => {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[^\d-]/g, '');
    const n = Number(cleaned);
    if (Number.isNaN(n)) return 0;
    return n;
  };

  // Conversion 1000 -> "1 000 €"
  const euroFromNumber = (n) => {
    const safe = Number.isNaN(n) ? 0 : n;
    return safe.toLocaleString('fr-FR') + ' €';
  };

  // Formattage d’un champ montant au blur
  const formatEuroField = (field, index) => {
    setForm((prev) => {
      const current = prev.resultats[field][index];
      const number = parseEuro(current);
      const formatted = euroFromNumber(number);

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

  // Totaux pour la ligne 1 (somme des lignes 2 à 8)
  const totals = {
    objectifs: 0,
    realises: 0,
    potentiel3m: 0,
    potentiel12m: 0,
  };

  for (let i = 1; i < 8; i += 1) {
    totals.objectifs += parseEuro(form.resultats.objectifs[i]);
    totals.realises += parseEuro(form.resultats.realises[i]);
    totals.potentiel3m += parseEuro(form.resultats.potentiel3m[i]);
    totals.potentiel12m += parseEuro(form.resultats.potentiel12m[i]);
  }


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
      
      {/* 1. RÉSULTATS */}
      <div className="section-card">
        <div className="section-title strong-title">Résultats</div>

        <div className="rapport-section-table">
          {/* 1ère ligne d'en-tête : "Note" au-dessus de CGP + N+1 */}
          <div className="rapport-table-header-top">
            <span className="col-libelle"></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span className="note-group-header">Note</span>
          </div>

          {/* 2ème ligne d'en-tête : titres des colonnes */}
          <div className="rapport-table-header-sub">
            <span className="col-libelle">Libellé</span>
            <span>Objectif</span>
            <span>Réalisé</span>
            <span className="col-potentiel-header">Potentiel 1 mois</span>
            <span className="col-potentiel-header">Potentiel 6 mois</span>
            <span>CGP</span>
            <span>N+1</span>
          </div>

          {/* 8 lignes de données */}
          {Array.from({ length: 8 }).map((_, i) => {
            const isTotalRow = i === 0;    // ligne 1 = total
            const isCampaignRow = i === 7; // ligne 8 = campagnes (uniquement notes)
            const label = resultatsLabels[i];

            return (
              <div className="rapport-table-row" key={i}>
                {/* Libellé : gras pour la ligne 1 */}
                <span className="col-libelle">
                  {isTotalRow ? <strong>{label}</strong> : label}
                </span>

                {/* OBJECTIF */}
                {isCampaignRow ? (
                  <span></span>
                ) : isTotalRow ? (
                  <input
                    className="rapport-input manager-cell total-cell"
                    type="text"
                    value={euroFromNumber(totals.objectifs)}
                    readOnly
                  />
                ) : (
                  <input
                    className="rapport-input manager-cell"
                    type="text"
                    value={form.resultats.objectifs[i]}
                    readOnly
                    placeholder="—"
                  />
                )}

                {/* RÉALISÉ */}
                {isCampaignRow ? (
                  <span></span>
                ) : isTotalRow ? (
                  <input
                    className="rapport-input total-cell"
                    type="text"
                    value={euroFromNumber(totals.realises)}
                    readOnly
                  />
                ) : (
                  <input
                    className="rapport-input"
                    type="text"
                    value={form.resultats.realises[i]}
                    onChange={(e) =>
                      updateArrayField(
                        'resultats',
                        'realises',
                        i,
                        e.target.value
                      )
                    }
                    onBlur={() => formatEuroField('realises', i)}
                  />
                )}

                                {/* POTENTIEL 1 MOIS */}
                {isCampaignRow ? (
                  <span></span>
                ) : isTotalRow ? (
                  <input
                    className="rapport-input rapport-input-potentiel total-cell"
                    type="text"
                    value={euroFromNumber(totals.potentiel3m)}
                    readOnly
                  />
                ) : (
                  <input
                    className="rapport-input rapport-input-potentiel"
                    type="text"
                    value={form.resultats.potentiel3m[i]}
                    onChange={(e) =>
                      updateArrayField(
                        'resultats',
                        'potentiel3m',
                        i,
                        e.target.value
                      )
                    }
                    onBlur={() => formatEuroField('potentiel3m', i)}
                  />
                )}

                {/* POTENTIEL 6 MOIS */}
                {isCampaignRow ? (
                  <span></span>
                ) : isTotalRow ? (
                  <input
                    className="rapport-input rapport-input-potentiel total-cell"
                    type="text"
                    value={euroFromNumber(totals.potentiel12m)}
                    readOnly
                  />
                ) : (
                  <input
                    className="rapport-input rapport-input-potentiel"
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
                    onBlur={() => formatEuroField('potentiel12m', i)}
                  />
                )}


                {/* NOTE CGP : saisissable partout */}
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

                {/* NOTE N+1 : même largeur, lecture seule côté conseiller */}
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

        <div className="rapport-section-table rapport-section-table--part">
          <div className="rapport-table-header-top rapport-table-header-top--part">
            <span className="col-libelle"></span>
            <span></span>
            <span className="note-group-header">Note</span>
          </div>

          <div className="rapport-table-header-sub rapport-table-header-sub--part">
            <span className="col-libelle">Libellé</span>
            <span>Réalisé (nb)</span>
            <span>CGP</span>
            <span>N+1</span>
          </div>

          {partenariatLabels.map((label, i) => (
            <div
              className="rapport-table-row rapport-table-row--part"
              key={i}
            >
              <span className="col-libelle">{label}</span>

              <input
                className="rapport-input"
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
                className="rapport-input rapport-input-note"
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

              <input
                className="rapport-input rapport-input-note manager-cell"
                type="number"
                min="1"
                max="10"
                readOnly
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div className="rapport-comments-block">
          <label>Commentaires</label>
          <textarea
            value={form.partenariat.commentaires}
            onChange={(e) =>
              updateField('partenariat', 'commentaires', e.target.value)
            }
          />

          <label>Stratégie d’amélioration (manager)</label>
          <textarea
            className="rapport-strategie-manager"
            value={form.partenariat.strategie}
            readOnly
            placeholder="Renseigné par le manager"
          />
        </div>
      </div>

       {/* 3. TECHNIQUE */}
      <div className="section-card">
        <div className="section-title strong-title">Technique</div>

        <div className="rapport-section-table rapport-section-table--simple">
          <div className="rapport-table-header-top rapport-table-header-top--simple">
            <span className="col-libelle"></span>
            <span className="note-group-header">Note</span>
          </div>

          <div className="rapport-table-header-sub rapport-table-header-sub--simple">
            <span className="col-libelle">Libellé</span>
            <span>CGP</span>
            <span>N+1</span>
          </div>

          {techniqueLabels.map((label, i) => (
            <div
              className="rapport-table-row rapport-table-row--simple"
              key={i}
            >
              <span className="col-libelle">{label}</span>

              <input
                className="rapport-input rapport-input-note"
                type="number"
                min="1"
                max="10"
                value={form.technique.notesCgp[i]}
                onChange={(e) =>
                  updateArrayField(
                    'technique',
                    'notesCgp',
                    i,
                    e.target.value
                  )
                }
              />

              <input
                className="rapport-input rapport-input-note manager-cell"
                type="number"
                min="1"
                max="10"
                readOnly
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div className="rapport-comments-block">
          <label>Commentaires</label>
          <textarea
            value={form.technique.commentaires}
            onChange={(e) =>
              updateField('technique', 'commentaires', e.target.value)
            }
          />

          <label>Stratégie d’amélioration (manager)</label>
          <textarea
            className="rapport-strategie-manager"
            value={form.technique.strategie}
            readOnly
            placeholder="Renseigné par le manager"
          />
        </div>
      </div>


       {/* 4. BIEN-ÊTRE */}
      <div className="section-card">
        <div className="section-title strong-title">Bien-être</div>

        <div className="rapport-section-table rapport-section-table--simple">
          <div className="rapport-table-header-top rapport-table-header-top--simple">
            <span className="col-libelle"></span>
            <span className="note-group-header">Note</span>
          </div>

          <div className="rapport-table-header-sub rapport-table-header-sub--simple">
            <span className="col-libelle">Libellé</span>
            <span>CGP</span>
            <span>N+1</span>
          </div>

          {bienEtreLabels.map((label, i) => (
            <div
              className="rapport-table-row rapport-table-row--simple"
              key={i}
            >
              <span className="col-libelle">{label}</span>

              <input
                className="rapport-input rapport-input-note"
                type="number"
                min="1"
                max="10"
                value={form.bienEtre.notesCgp[i]}
                onChange={(e) =>
                  updateArrayField(
                    'bienEtre',
                    'notesCgp',
                    i,
                    e.target.value
                  )
                }
              />

              <input
                className="rapport-input rapport-input-note manager-cell"
                type="number"
                min="1"
                max="10"
                readOnly
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div className="rapport-comments-block">
          <label>Commentaires</label>
          <textarea
            value={form.bienEtre.commentaires}
            onChange={(e) =>
              updateField('bienEtre', 'commentaires', e.target.value)
            }
          />

          <label>Stratégie d’amélioration (manager)</label>
          <textarea
            className="rapport-strategie-manager"
            value={form.bienEtre.strategie}
            readOnly
            placeholder="Renseigné par le manager"
          />
        </div>
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
