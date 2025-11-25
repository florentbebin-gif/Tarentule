    // src/pages/RapportForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';
import RadarChart from '../components/RadarChart';
import PerformanceChart from '../components/PerformanceChart';
import { useParams } from 'react-router-dom';

export default function RapportForm({ onSaved, resetKey }) {
  const [period, setPeriod] = useState('');
  const [error, setError] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const { userId: routeUserId } = useParams(); // id du conseiller si /rapport/:userId
  const [currentUserRole, setCurrentUserRole] = useState('user');
  const [viewedUserId, setViewedUserId] = useState(null); // id du rapport affiché
  const [advisorName, setAdvisorName] = useState({ firstName: '', lastName: '' });

  const initialForm = {
    bienEtre: {
      notesCgp: ['', '', '', ''],
      notesManager: ['', '', '', ''],
      commentaires: '',
      strategie: '',
    },
    partenariat: {
      objectifs: ['', '', ''],
      realises: ['', '', ''],
      notesCgp: ['', '', ''],
      notesManager: ['', '', ''],
      commentaires: '',
      strategie: '',
    },
    resultats: {
      objectifs: Array(8).fill(''),
      realises: Array(8).fill(''),
      potentiel3m: Array(8).fill(''),
      potentiel12m: Array(8).fill(''),
      notesCgp: Array(8).fill(''),
      notesManager: Array(8).fill(''),
      commentaires: '',
      strategie: '',
    },
    technique: {
      notesCgp: ['', '', '', '', ''],
      notesManager: ['', '', '', '', ''],
      commentaires: '',
      strategie: '',
    },
  };

  const [form, setForm] = useState(initialForm);

  // AUTOSAVE à la sortie de champ
  const handleAutoSave = async () => {
    if (!viewedUserId) return;

    setError('');
    const { error: insertError } = await supabase.from('reports').insert({
      user_id: viewedUserId,
      period,
      global_score: null,
      comment: '',
      data: form,
    });

    if (insertError) {
      setError(insertError.message || "Erreur lors de l'enregistrement.");
      return;
    }

    if (onSaved) {
      onSaved(new Date());
    }
  };

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
    '1 - Équilibre / gestion du stress',
    '2 - Motivation',
    '3 - Niveau d’intégration dans l’équipe et l’entreprise',
    '4 - Satisfaction et épanouissement au travail',
  ];

  const techniqueLabels = [
    '1 - Commerciale : techniques de vente et relation client',
    '2 - Civile : compétences techniques sur les aspects civils / juridiques',
    '3 - Société : détention, structuration et problématiques',
    '4 - Outils : Big, Hubspot, SIO2, Intranet, Power BI, AP, Capacité d\'épargne, SER1',
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
    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      // on récupère le rôle dans profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = String(
        profile?.role || user.user_metadata?.role || 'user'
      ).toLowerCase();

      setCurrentUserRole(role);

      // si manager / admin ET un userId est présent dans l'URL → on affiche ce user
      if ((role === 'manager' || role === 'admin') && routeUserId) {
        setViewedUserId(routeUserId);
      } else {
        setViewedUserId(user.id);
      }

      setLoadingUser(false);
    };

    initUser();
  }, [routeUserId]);

  // Charge le dernier rapport sauvegardé pour l'utilisateur "vu" (viewedUserId)
  useEffect(() => {
    const loadLastReport = async () => {
      if (!viewedUserId) return;

      const { data, error } = await supabase
        .from('reports')
        .select('data, period')
        .eq('user_id', viewedUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        if (data.data) {
          setForm((prev) => ({
            ...prev,
            ...data.data,
          }));
        }
        if (data.period) {
          setPeriod(data.period);
        }
      }
    };

    if (!loadingUser) {
      loadLastReport();
    }
  }, [loadingUser, viewedUserId]);

  // Charge le profil du conseiller affiché (pour afficher son nom)
  useEffect(() => {
    const loadAdvisorProfile = async () => {
      if (!viewedUserId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', viewedUserId)
        .maybeSingle();

      if (!error && data) {
        setAdvisorName({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
        });
      }
    };

    loadAdvisorProfile();
  }, [viewedUserId]);

  // RESET complet du rapport lorsque resetKey change (icône Trash)
  // On ignore la valeur initiale (0)
  useEffect(() => {
    if (resetKey === undefined || resetKey === 0) return;

    const ok = window.confirm('Voulez-vous vraiment vider votre rapport ?');
    if (!ok) return;

    setForm(initialForm);
    setPeriod('');
    setError('');
  }, [resetKey]);

  const clampNote = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return '';
    if (n < 0) return '0';
    if (n > 10) return '10';
    return String(n);
  };

  const updateArrayField = (section, field, index, value) => {
    setForm((prev) => {
      const prevSection = prev[section] || {};
      const prevArray = prevSection[field] || [];
      const nextArray = [...prevArray];

      // Si l'index demandé dépasse la longueur actuelle, on agrandit le tableau
      if (index >= nextArray.length) {
        nextArray.length = index + 1;
      }

      nextArray[index] = value;

      return {
        ...prev,
        [section]: {
          ...prevSection,
          [field]: nextArray,
        },
      };
    });
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

  // Données pour les radars
  const resultatsRadarLabels = [
    'Financier',
    'PE',
    'Immobilier',
    'Honoraire',
    'Arbitrages',
    'PER',
    'Divers',
  ];
  const resultatsCgpRadar = [1, 2, 3, 4, 5, 6, 7].map((i) =>
    Number(form.resultats.notesCgp[i] || 0)
  );
  const resultatsManagerRadar = [1, 2, 3, 4, 5, 6, 7].map((i) =>
  Number(form.resultats.notesManager?.[i] || 0)
);

  const partenariatRadarLabels = ['Clubs Experts', 'Animation', 'Prospection'];
  const partenariatCgpRadar = [0, 1, 2].map((i) =>
    Number(form.partenariat.notesCgp[i] || 0)
  );
  const partenariatManagerRadar = [0, 1, 2].map((i) =>
  Number(form.partenariat.notesManager?.[i] || 0)
);

  const techniqueRadarLabels = [
    'Commercial',
    'Civil',
    'Société',
    'Outils',
    'Process',
  ];
  const techniqueCgpRadar = [0, 1, 2, 3, 4].map((i) =>
    Number(form.technique.notesCgp[i] || 0)
  );
  const techniqueManagerRadar = [0, 1, 2, 3, 4].map((i) =>
  Number(form.technique.notesManager?.[i] || 0)
);

  const bienEtreRadarLabels = [
    'Stress',
    'Motivation',
    'Intégration',
    'Satisfaction',
  ];
  const bienEtreCgpRadar = [0, 1, 2, 3].map((i) =>
    Number(form.bienEtre.notesCgp[i] || 0)
  );
  const bienEtreManagerRadar = [0, 1, 2, 3].map((i) =>
  Number(form.bienEtre.notesManager?.[i] || 0)
);

  if (loadingUser) {
    return <p>Chargement…</p>;
  }

  return (
    <div className="credit-panel rapport-layout">
      {/* Colonne gauche : formulaires */}
      <div className="rapport-main">
        {/* 1. RÉSULTATS */}
        <div className="section-card section-card--with-chart">
          <div className="section-header">
            <div className="section-title strong-title">Résultats</div>
            <div className="conseiller-label">
              Conseiller : {advisorName.lastName || '—'} {advisorName.firstName}
            </div>
          </div>

          <div className="rapport-section-table">
            <div className="rapport-table-header-top">
              <span className="col-libelle"></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span
                className="note-group-header"
                title="Positionnement : faculté à se sentir à l'aise avec la thématique"
              >
              Positionnement*
              </span>

            </div>

            <div className="rapport-table-header-sub">
              <span className="col-libelle">Libellés</span>
              <span>Objectifs</span>
              <span>Réalisés</span>
              <span className="col-potentiel-header">%</span>
              <span className="col-potentiel-header">Potentiel 31/12</span>
              <span>CGP</span>
              <span>N+1</span>
            </div>

            {Array.from({ length: 8 }).map((_, i) => {
              const isTotalRow = i === 0;
              const isCampaignRow = i === 7;
              const label = resultatsLabels[i];

              return (
                <div className="rapport-table-row" key={i}>
                  <span className="col-libelle">
                    {isTotalRow ? <strong>{label}</strong> : label}
                  </span>

                  {/* Objectifs */}
                  {isCampaignRow ? (
                    <span></span>
                  ) : isTotalRow ? (
                    <input
                      className="rapport-input manager-cell total-cell"
                      type="text"
                      value={euroFromNumber(totals.objectifs)}
                      readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                    />
                  ) : (
                    <input
                      className="rapport-input manager-cell"
                      type="text"
                      value={form.resultats.objectifs[i]}
                      readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                      onChange={(e2) =>
                        updateArrayField('resultats','objectifs', i, e2.target.value)
                      }
                      onBlur={() => {
                        formatEuroField('objectifs', i);
                        handleAutoSave();
                      }}
                      placeholder="—"
                    />

                  )}

                  {/* Réalisé */}
                  {isCampaignRow ? (
                    <span></span>
                  ) : isTotalRow ? (
                    <input
                      className="rapport-input manager-cell total-cell"
                      type="text"
                      value={euroFromNumber(totals.realises)}
                      readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                    />
                  ) : (
                    <input
                      className="rapport-input"
                      type="text"
                      value={form.resultats.realises[i]}
                      onChange={(e2) =>
                        updateArrayField(
                          'resultats',
                          'realises',
                          i,
                          e2.target.value
                        )
                      }
                      onBlur={() => {
                        formatEuroField('realises', i);
                        handleAutoSave();
                      }}
                    />
                  )}

                  {/* % de réalisation auto (Réalisés / Objectifs) */}
                  {(() => {
                    if (isCampaignRow) {
                      // Ligne "Campagnes diverses" : on ne met rien
                      return <span></span>;
                    }

                    let objectifsValue;
                    let realisesValue;

                    if (isTotalRow) {
                      // Ligne 1 : on utilise les totaux déjà calculés
                      objectifsValue = totals.objectifs;
                      realisesValue = totals.realises;
                    } else {
                      // Lignes 2 à 7 : on lit les valeurs de la ligne
                      objectifsValue = parseEuro(form.resultats.objectifs[i]);
                      realisesValue = parseEuro(form.resultats.realises[i]);
                    }

                    const percent =
                      objectifsValue > 0
                        ? Math.round((realisesValue / objectifsValue) * 100)
                        : 0;

                    const display = `${percent} %`;

                    return (
                      <input
                        className={`rapport-input rapport-input-percent manager-cell${
                          isTotalRow ? ' total-cell' : ''
                        }`}
                        type="text"
                        value={display}
                        readOnly
                      />
                    );
                  })()}

                  {/* Potentiel */}
                  {isCampaignRow ? (
                    <span></span>
                  ) : isTotalRow ? (
                    <input
                      className="rapport-input rapport-input-potentiel manager-cell total-cell"
                      type="text"
                      value={euroFromNumber(totals.potentiel12m)}
                      readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                    />
                  ) : (
                    <input
                      className="rapport-input rapport-input-potentiel"
                      type="text"
                      value={form.resultats.potentiel12m[i]}
                      onChange={(e2) =>
                        updateArrayField(
                          'resultats',
                          'potentiel12m',
                          i,
                          e2.target.value
                        )
                      }
                      onBlur={() => {
                        formatEuroField('potentiel12m', i);
                        handleAutoSave();
                      }}
                    />
                  )}

                  {/* Notes */}
                  {isTotalRow ? (
                    <>
                      <span></span>
                      <span></span>
                    </>
                  ) : (
                    <>
                      <input
                        className="rapport-input rapport-input-note"
                        type="number"
                        min="0"
                        max="10"
                        value={form.resultats.notesCgp[i]}
                        onChange={(e2) =>
                          updateArrayField(
                            'resultats',
                            'notesCgp',
                            i,
                            clampNote(e2.target.value)
                          )
                        }
                        onBlur={handleAutoSave}
                      />
                      <input
                        className="rapport-input rapport-input-note manager-cell"
                        type="number"
                        min="0"
                        max="10"
                        readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                        value={form.resultats.notesManager?.[i] || ''}
                        onChange={(e2) =>
                        updateArrayField('resultats', 'notesManager', i, clampNote(e2.target.value))
                         }
                        onBlur={handleAutoSave}
                        placeholder="—"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

            <label>Stratégie d’amélioration (manager)</label>
            <textarea
              className="rapport-strategie-manager"
              value={form.resultats.strategie}
              readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
              onChange={(e2) =>
              updateField('resultats','strategie', e2.target.value)
              }
              onBlur={handleAutoSave}
              placeholder="Renseigné par le manager"
            />

          </div>

          {error && (
            <div className="alert error" style={{ marginTop: '8px' }}>
              {error}
            </div>
          )}
        
        {/* 2. PARTENARIAT */}
        <div className="section-card">
          <div className="section-title strong-title">Partenariat</div>

          <div className="rapport-section-table rapport-section-table--part">
            <div className="rapport-table-header-top rapport-table-header-top--part">
              <span className="col-libelle"></span>
              <span></span>
              <span
                className="note-group-header"
                title="Positionnement : faculté à se sentir à l'aise avec la thématique"
              >
              Positionnement*
              </span>

            </div>

            <div className="rapport-table-header-sub rapport-table-header-sub--part">
              <span className="col-libelle">Libellés</span>
              <span>Objectifs N (nb)</span>
              <span>Réalisés N (nb)</span>
              <span>CGP</span>
              <span>N+1</span>
            </div>

            {partenariatLabels.map((label, i) => (
              <div
                className="rapport-table-row rapport-table-row--part"
                key={i}
              >
                <span className="col-libelle">{label}</span>

                {/* Objectifs (nb) – manager (lecture seule pour CGP) */}
                  <input
                    className="rapport-input rapport-input-narrow manager-cell"
                    type="number"
                    value={form.partenariat.objectifs[i] || ''}
                    readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                    onChange={(e2) =>
                      updateArrayField('partenariat','objectifs', i, e2.target.value)
                    }
                  onBlur={handleAutoSave}
                  placeholder="—"
                  />


                {/* Réalisé (nb) – conseiller */}
                <input
                  className="rapport-input rapport-input-narrow"
                  type="number"
                  value={form.partenariat.realises[i]}
                  onChange={(e2) =>
                    updateArrayField(
                      'partenariat',
                      'realises',
                      i,
                      e2.target.value
                    )
                  }
                  onBlur={handleAutoSave}
                />

                {/* Note CGP */}
                <input
                  className="rapport-input rapport-input-note rapport-input-narrow"
                  type="number"
                  min="0"
                  max="10"
                  value={form.partenariat.notesCgp[i]}
                  onChange={(e2) =>
                    updateArrayField(
                      'partenariat',
                      'notesCgp',
                      i,
                      clampNote(e2.target.value)
                    )
                  }
                  onBlur={handleAutoSave}
                />

                {/* Note N+1 – lecture seule */}
                    <input
                    className="rapport-input rapport-input-note manager-cell"
                    type="number"
                    min="0"
                    max="10"
                    value={form.partenariat.notesManager?.[i] || ''}
                    readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                    onChange={(e2) =>
                    updateArrayField(
                    'partenariat',
                    'notesManager',
                      i,
                    clampNote(e2.target.value)
                      )
                    }
                    onBlur={handleAutoSave}
                    placeholder="—"
                    />

              </div>
            ))}
          </div>

            <label>Stratégie d’amélioration (manager)</label>
                <textarea
                  className="rapport-strategie-manager"
                  value={form.partenariat.strategie}
                  readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                  onChange={(e2) =>
                  updateField('partenariat', 'strategie', e2.target.value)
                    }
                  onBlur={handleAutoSave}
                  placeholder="Renseigné par le manager"
                />

          </div>

        {/* 3. TECHNIQUE */}
        <div className="section-card">
          <div className="section-title strong-title">Technique</div>

          <div className="rapport-section-table rapport-section-table--simple">
            <div className="rapport-table-header-top rapport-table-header-top--simple">
              <span className="col-libelle"></span>
              <span
              className="note-group-header"
              title="Positionnement : faculté à se sentir à l'aise avec la thématique"
              >
              Positionnement*
              </span>

            </div>

            <div className="rapport-table-header-sub rapport-table-header-sub--simple">
              <span className="col-libelle">Libellés</span>
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
                  min="0"
                  max="10"
                  value={form.technique.notesCgp[i]}
                  onChange={(e2) =>
                    updateArrayField(
                      'technique',
                      'notesCgp',
                      i,
                      clampNote(e2.target.value)
                    )
                  }
                  onBlur={handleAutoSave}
                />

                  <input
                    className="rapport-input rapport-input-note manager-cell"
                    type="number"
                    min="0"
                    max="10"
                    value={form.technique.notesManager?.[i] || ''}
                    readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                    onChange={(e2) =>
                    updateArrayField(
                    'technique',
                    'notesManager',
                      i,
                    clampNote(e2.target.value)
                    )
                    }
                    onBlur={handleAutoSave}
                    placeholder="—"
                  />

              </div>
            ))}
          </div>

            <label>Stratégie d’amélioration (manager)</label>
              <textarea
                className="rapport-strategie-manager"
                value={form.technique.strategie}
                readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                onChange={(e2) =>
                updateField('technique', 'strategie', e2.target.value)
                }
                onBlur={handleAutoSave}
                placeholder="Renseigné par le manager"
              />

          </div>


        {/* 4. BIEN-ÊTRE */}
        <div className="section-card">
          <div className="section-title strong-title">Bien-être</div>

          <div className="rapport-section-table rapport-section-table--simple">
            <div className="rapport-table-header-top rapport-table-header-top--simple">
              <span className="col-libelle"></span>
              <span
              className="note-group-header"
              title="Positionnement : faculté à se sentir à l'aise avec la thématique"
              >
              Positionnement*
              </span>

            </div>

            <div className="rapport-table-header-sub rapport-table-header-sub--simple">
              <span className="col-libelle">Libellés</span>
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
                  min="0"
                  max="10"
                  value={form.bienEtre.notesCgp[i]}
                  onChange={(e2) =>
                    updateArrayField(
                      'bienEtre',
                      'notesCgp',
                      i,
                      clampNote(e2.target.value)
                    )
                  }
                  onBlur={handleAutoSave}
                />

                  <input
                    className="rapport-input rapport-input-note manager-cell"
                    type="number"
                    min="0"
                    max="10"
                    value={form.bienEtre.notesManager?.[i] || ''}
                    readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                    onChange={(e2) =>
                    updateArrayField(
                      'bienEtre',
                      'notesManager',
                      i,
                    clampNote(e2.target.value)
                    )
                    }
                    onBlur={handleAutoSave}
                    placeholder="—"
                  />

              </div>
            ))}
          </div>

            <label>Stratégie d’amélioration (manager)</label>
              <textarea
                className="rapport-strategie-manager"
                value={form.bienEtre.strategie}
                readOnly={currentUserRole !== 'manager' && currentUserRole !== 'admin'}
                onChange={(e2) =>
                updateField('bienEtre', 'strategie', e2.target.value)
                }
                onBlur={handleAutoSave}
                placeholder="Renseigné par le manager"
              />

          </div>
        </div>

      {/* Colonne droite : graphiques */}
      <div className="rapport-charts">
        {/* Performance globale */}
        <div className="section-card radar-card radar-card--perf">
          <div className="radar-title">Performance globale</div>
          <PerformanceChart
            objectif={totals.objectifs}
            realise={totals.realises}
          />
        </div>

        {/* Notes Résultats */}
        <div className="section-card radar-card radar-card--resultats">
          <div className="radar-title">Position Résultats</div>
          <RadarChart
            labels={resultatsRadarLabels}
            cgpValues={resultatsCgpRadar}
            managerValues={resultatsManagerRadar}
          />
        </div>

        {/* Notes Partenariats */}
        <div className="section-card radar-card radar-card--partenariat">
          <div className="radar-title">Position Partenariats</div>
          <RadarChart
            labels={partenariatRadarLabels}
            cgpValues={partenariatCgpRadar}
            managerValues={partenariatManagerRadar}
          />
        </div>

        {/* Notes Techniques */}
        <div className="section-card radar-card radar-card--technique">
          <div className="radar-title">Position Techniques</div>
          <RadarChart
            labels={techniqueRadarLabels}
            cgpValues={techniqueCgpRadar}
            managerValues={techniqueManagerRadar}
          />
        </div>

        {/* Notes Bien-être */}
        <div className="section-card radar-card radar-card--bienetre">
          <div className="radar-title">Position Bien-être</div>
          <RadarChart
            labels={bienEtreRadarLabels}
            cgpValues={bienEtreCgpRadar}
            managerValues={bienEtreManagerRadar}
          />
        </div>
      </div>
    </div>
  );
}
