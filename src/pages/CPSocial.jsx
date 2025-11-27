// src/pages/CPSocial.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';
import RadarChart from '../components/RadarChart';
import { useParams } from 'react-router-dom';

export default function CPSocial({ onSaved, resetKey }) {
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear];
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [error, setError] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const { userId: routeUserId } = useParams(); // id du CP Social si /cpsocial/:userId
  const [currentUserRole, setCurrentUserRole] = useState('user');
  const [viewedUserId, setViewedUserId] = useState(null); // id du rapport affiché
  const [advisorName, setAdvisorName] = useState({
    firstName: '',
    lastName: '',
  });
  const [collecteAll, setCollecteAll] = useState(false);

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
      objectifs: Array(9).fill(''),
      realises: Array(9).fill(''),
      potentiel3m: Array(9).fill(''),
      potentiel12m: Array(9).fill(''),
      notesCgp: Array(9).fill(''),
      notesManager: Array(9).fill(''),
      commentaires: '',
      strategie: '',
    },
    technique: {
      notesCgp: ['', '', '', '', '', '', ''],
      notesManager: ['', '', '', '', '', '', ''],
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
      period: selectedYear,
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
    '8 - VP : réalisation/détection de VP PER/prévoyance',
    '9 - Campagnes diverses : participation et efficacité',
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
    '4 - Capacité d’épargne : Analyse et préconisation',
    '5 - Outils : Big, Hubspot, SIO2, Intranet, Power BI, AP, SER1',
    '6 - Process interne : organisation Relation Middle',
    '7 - Social : Retraite, prévoyance, épargne salariale,... / capacité à détecter',
  ];

  const themeOptions = [
    // Résultats
    {
      value: 'produitsFinanciers',
      label: 'Produits financiers',
      section: 'resultats',
      index: 1,
      isEuro: true,
    },
    {
      value: 'privateEquity',
      label: 'Private Equity',
      section: 'resultats',
      index: 2,
      isEuro: true,
    },
    {
      value: 'immobilier',
      label: 'Produits immobiliers',
      section: 'resultats',
      index: 3,
      isEuro: true,
    },
    {
      value: 'honoraires',
      label: 'Honoraires',
      section: 'resultats',
      index: 4,
      isEuro: true,
    },
    {
      value: 'arbitrages',
      label: 'Arbitrages',
      section: 'resultats',
      index: 5,
      isEuro: true,
    },
    {
      value: 'per',
      label: 'PER',
      section: 'resultats',
      index: 6,
      isEuro: true,
    },
    {
      value: 'vp',
      label: 'VP',
      section: 'resultats',
      index: 7,
      isEuro: true,
    },
    // Partenariats
    {
      value: 'clubsExperts',
      label: 'Clubs Experts',
      section: 'partenariat',
      index: 0,
      isEuro: false,
    },
    {
      value: 'animation',
      label: 'Animation',
      section: 'partenariat',
      index: 1,
      isEuro: false,
    },
    {
      value: 'prospection',
      label: 'Prospection',
      section: 'partenariat',
      index: 2,
      isEuro: false,
    },
  ];

  const [selectedTheme, setSelectedTheme] = useState(themeOptions[0].value);

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

  // Moyenne sécurisée
  const average = (arr) => {
    const nums = arr
      .map((v) => Number(v) || 0)
      .filter((n) => !Number.isNaN(n));
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
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

      // rôle dans profiles
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

  // Charge le dernier rapport sauvegardé pour l'utilisateur "vu"
  useEffect(() => {
    const loadLastReport = async () => {
      if (!viewedUserId) return;

      setForm(initialForm);

      const { data, error } = await supabase
        .from('reports')
        .select('data')
        .eq('user_id', viewedUserId)
        .eq('period', selectedYear)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.data) {
        setForm((prev) => ({
          ...prev,
          ...data.data,
        }));
      }
    };

    if (!loadingUser) {
      loadLastReport();
    }
  }, [loadingUser, viewedUserId, selectedYear]);

  // Charge le profil du CP Social affiché (pour afficher son nom)
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

  const hasMountedReset = useRef(false);
  // RESET complet du rapport lorsque resetKey change
  useEffect(() => {
    if (!hasMountedReset.current) {
      hasMountedReset.current = true;
      return;
    }

    if (!resetKey) return;

    const ok = window.confirm('Voulez-vous vraiment vider votre rapport ?');
    if (!ok) return;

    setForm(initialForm);
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
    'Honoraires',
    'Arbitrages',
    'PER',
    'VP',
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
    'Cap épargne',
    'Outils',
    'Process',
    'Social',
  ];
  const techniqueCgpRadar = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    Number(form.technique.notesCgp[i] || 0)
  );
  const techniqueManagerRadar = [0, 1, 2, 3, 4, 5, 6].map((i) =>
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

  // ---- Totaux Board (Collecte All) ----
  const boardTotals = (() => {
    const objectifs = form.resultats.objectifs || [];
    const realises = form.resultats.realises || [];
    const potentiel12m = form.resultats.potentiel12m || [];

    let obj = 0;
    let rea = 0;
    let pot12 = 0;

    for (let i = 1; i < 8; i += 1) {
      if (collecteAll && (i === 4 || i === 5)) continue;
      obj += parseEuro(objectifs[i] || 0);
      rea += parseEuro(realises[i] || 0);
      pot12 += parseEuro(potentiel12m[i] || 0);
    }

    return {
      objectifs: obj,
      realises: rea,
      potentiel12m: pot12,
    };
  })();

  const totalObjectifs = boardTotals.objectifs;
  const totalRealises = boardTotals.realises;
  const totalPot12 = boardTotals.potentiel12m;

  let totalPercent = 0;
  if (totalObjectifs > 0) {
    totalPercent = (totalRealises / totalObjectifs) * 100;
  }

  const attainment = Math.max(0, Math.min(100, totalPercent || 0));

  const realisedRatio =
    totalObjectifs > 0
      ? Math.max(0, Math.min(100, (totalRealises / totalObjectifs) * 100))
      : 0;

  const potentialRatioRaw =
    totalObjectifs > 0 ? (totalPot12 / totalObjectifs) * 100 : 0;

  const potentialRatio = Math.max(
    0,
    Math.min(100 - realisedRatio, potentialRatioRaw)
  );

  const notesResultats = form.resultats.notesCgp || [];
  const notesPart = form.partenariat.notesCgp || [];
  const notesTechArr = form.technique.notesCgp || [];
  const notesBienArr = form.bienEtre.notesCgp || [];

  const coreResultats = notesResultats.slice(1, 6);
  const noteRes = average(coreResultats) * 10;

  const notePart = average(notesPart) * 10;

  const coreTechnique = notesTechArr.slice(0, 6);
  const noteTech = average(coreTechnique) * 10;

  const noteBien = average(notesBienArr) * 10;

  const perNote = Number(notesResultats[6] || 0);
  const vpNote = Number(notesResultats[7] || 0);
  const socialTechNote = Number(notesTechArr[6] || 0);
  const noteSocial = average([perNote, vpNote, socialTechNote]) * 10;

  const noteLabels = [
    'Résultats',
    'Partenariats',
    'Technique',
    'Bien-être',
    'Social',
  ];
  const noteValues = [noteRes, notePart, noteTech, noteBien, noteSocial];
  const noteColors = ['#2B3E37', '#788781', '#9fbdb2', '#CFDED8', '#CEC1B6'];

  const sumNotes = noteValues.reduce((a, b) => a + (b || 0), 0);
  const noteSegments =
    sumNotes > 0
      ? noteValues.map((v) => (v / sumNotes) * 100)
      : noteValues.map(() => 0);

  const currentTheme =
    themeOptions.find((o) => o.value === selectedTheme) || themeOptions[0];

  let themeObjectifs = 0;
  let themeRealises = 0;

  if (currentTheme.section === 'resultats') {
    const objArr = form.resultats.objectifs || [];
    const reaArr = form.resultats.realises || [];
    themeObjectifs = parseEuro(objArr[currentTheme.index] || 0);
    themeRealises = parseEuro(reaArr[currentTheme.index] || 0);
  } else if (currentTheme.section === 'partenariat') {
    const objArr = form.partenariat.objectifs || [];
    const reaArr = form.partenariat.realises || [];
    themeObjectifs = Number(objArr[currentTheme.index] || 0);
    themeRealises = Number(reaArr[currentTheme.index] || 0);
  }

  const themePercent =
    themeObjectifs > 0
      ? Math.round((themeRealises / themeObjectifs) * 100)
      : 0;

  if (loadingUser) {
    return <p>Chargement…</p>;
  }

  return (
    <div className="credit-panel rapport-layout">
      {/* Colonne gauche : Board + tableaux */}
      <div className="rapport-main">
        {/* Header : années + CP Social */}
        <div
          style={{
            marginBottom: '0px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Années + message */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              {availableYears.map((year) => {
                const isActive = selectedYear === String(year);
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(String(year))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 9999,
                      border: '1px solid #9ca3af',
                      backgroundColor: isActive ? '#2B3E37' : '#ffffff',
                      color: isActive ? '#ffffff' : '#111827',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {year}
                  </button>
                );
              })}
            </div>

            <span
              style={{
                fontSize: 12,
                color: '#6b7280',
                fontStyle: 'italic',
              }}
            >
              Année sélectionnée&nbsp;: {selectedYear}
            </span>
          </div>

          {/* CP Social à droite (libellé modifié ici) */}
          <div style={{ marginLeft: 'auto' }} className="conseiller-label">
            CP Social : {advisorName.lastName || '—'} {advisorName.firstName}
          </div>
        </div>

        {/* Board */}
        <div className="section-card">
          <div className="section-title strong-title">Board CP Social</div>

          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              onClick={() => setCollecteAll((prev) => !prev)}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid #9ca3af',
                backgroundColor: collecteAll ? '#ffffff' : '#2B3E37',
                color: collecteAll ? '#111827' : '#ffffff',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Collecte All
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#4b5563' }}>
                Graphique thématique :
              </span>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                }}
              >
                {themeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grille des petits graphiques */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            {/* % d'atteinte global */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '10px 12px',
                backgroundColor: '#fbfbfb',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                  marginBottom: 4,
                }}
              >
                % d&apos;atteinte global
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  marginBottom: 6,
                  alignSelf: 'flex-start',
                }}
              >
                Objectifs : {euroFromNumber(totalObjectifs)}
                <br />
                Réalisé : {euroFromNumber(totalRealises)}
              </div>

              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: `conic-gradient(#2B3E37 0 ${
                    attainment || 0
                  }%, #e5e7eb ${attainment || 0}% 100%)`,
                  position: 'relative',
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '20%',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  {totalObjectifs > 0 ? `${Math.round(attainment)}%` : '—'}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                Réalisé / Objectifs
              </div>
            </div>

            {/* Réalisé + Potentiel vs objectifs */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '10px 12px',
                backgroundColor: '#fbfbfb',
              }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}
              >
                Réalisé + Potentiel vs Objectifs
              </div>
              <div
                style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}
              >
                Objectifs : {euroFromNumber(totalObjectifs)}
                <br />
                Réalisé : {euroFromNumber(totalRealises)}
                <br />
                Potentiel 31/12 : {euroFromNumber(totalPot12)}
              </div>
              <div
                style={{
                  height: 12,
                  borderRadius: 9999,
                  backgroundColor: '#e5e7eb',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${realisedRatio}%`,
                    backgroundColor: '#2B3E37',
                  }}
                />
                <div
                  style={{
                    width: `${potentialRatio}%`,
                    backgroundColor: '#9fbdb2',
                  }}
                />
              </div>
            </div>

            {/* Positionnement CP Social (base 100) */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '10px 12px',
                backgroundColor: '#fbfbfb',
              }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}
              >
                Positionnement CP Social (base 100)
              </div>
              <div
                style={{
                  height: 12,
                  borderRadius: 9999,
                  overflow: 'hidden',
                  display: 'flex',
                  backgroundColor: '#e5e7eb',
                }}
              >
                {noteSegments.map((w, idx) => (
                  <div
                    key={noteLabels[idx]}
                    style={{
                      width: `${w}%`,
                      backgroundColor: noteColors[idx],
                    }}
                  />
                ))}
              </div>
              <ul
                style={{
                  margin: 0,
                  marginTop: 6,
                  padding: 0,
                  listStyle: 'none',
                  fontSize: 11,
                  color: '#374151',
                }}
              >
                {noteLabels.map((label, idx) => (
                  <li
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 9999,
                        backgroundColor: noteColors[idx],
                      }}
                    />
                    <span>
                      {label} :{' '}
                      {noteValues[idx]
                        ? `${Math.round(noteValues[idx])}%`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Graphique thématique */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '10px 12px',
                backgroundColor: '#fbfbfb',
              }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}
              >
                Thématique : {currentTheme.label}
              </div>
              <div
                style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}
              >
                Objectifs :{' '}
                {currentTheme.isEuro
                  ? euroFromNumber(themeObjectifs)
                  : themeObjectifs.toLocaleString('fr-FR')}
                <br />
                Réalisé :{' '}
                {currentTheme.isEuro
                  ? euroFromNumber(themeRealises)
                  : themeRealises.toLocaleString('fr-FR')}
              </div>
              <div
                style={{
                  height: 12,
                  borderRadius: 9999,
                  backgroundColor: '#e5e7eb',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width:
                      themeObjectifs > 0
                        ? `${Math.min(
                            100,
                            (themeRealises / themeObjectifs) * 100
                          )}%`
                        : '0%',
                    height: '100%',
                    backgroundColor: '#2B3E37',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: '#4b5563',
                }}
              >
                {themeObjectifs > 0
                  ? `${themePercent}% d'atteinte`
                  : 'Aucune donnée sur la période.'}
              </div>
            </div>
          </div>
        </div>

        {/* Sections Résultats / Partenariats / Techniques / Bien-être
            → identiques à RapportForm, je les laisse telles quelles */}
        {/* ... (tout le reste du formulaire est inchangé par rapport à RapportForm) ... */}
        {/* Pour garder la réponse lisible, je ne répète pas ici tout le bloc,
            mais dans ton fichier tu conserves bien l'intégralité du code actuel
            de RapportForm à la suite de ce point. */}
      </div>

      {/* Colonne droite : Radars */}
      <div className="rapport-charts">
        <div className="section-card radar-card radar-card--resultats">
          <div className="radar-title">Positions Résultats</div>
          <RadarChart
            labels={resultatsRadarLabels}
            cgpValues={resultatsCgpRadar}
            managerValues={resultatsManagerRadar}
          />
        </div>

        <div className="section-card radar-card radar-card--partenariat">
          <div className="radar-title">Positions Partenariats</div>
          <RadarChart
            labels={partenariatRadarLabels}
            cgpValues={partenariatCgpRadar}
            managerValues={partenariatManagerRadar}
          />
        </div>

        <div className="section-card radar-card radar-card--technique">
          <div className="radar-title">Positions Techniques</div>
          <RadarChart
            labels={techniqueRadarLabels}
            cgpValues={techniqueCgpRadar}
            managerValues={techniqueManagerRadar}
          />
        </div>

        <div className="section-card radar-card radar-card--bienetre">
          <div className="radar-title">Positions Bien-être</div>
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
