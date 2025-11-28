    // src/pages/RapportForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';
import './CPSocial.css';
import { useParams } from 'react-router-dom';

export default function CPSocial({ onSaved, resetKey }) {
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear];
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [error, setError] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const { userId: routeUserId } = useParams(); // id du conseiller si /rapport/:userId
  const [currentUserRole, setCurrentUserRole] = useState('user');
  const [viewedUserId, setViewedUserId] = useState(null); // id du rapport affiché
  const [advisorName, setAdvisorName] = useState({ firstName: '', lastName: '' });
    const [collecteAll, setCollecteAll] = useState(false);

// Libellés des lignes (CP Social)
const resultatsLabels = [
  '1 - Performance globale : Collecte',
  '2 - Collecte épargne retraite',
  '3 - Collecte épargne salariale',
];

const RESULT_ROWS = resultatsLabels.length;

    
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
      // Bureaux
      objectifsBureaux: Array(RESULT_ROWS).fill(''),
      realisesBureaux: Array(RESULT_ROWS).fill(''),
      // Accompagnement
      objectifs: Array(RESULT_ROWS).fill(''),
      realises: Array(RESULT_ROWS).fill(''),
      potentiel3m: Array(RESULT_ROWS).fill(''), // pas utilisé à l'écran, mais conservé
      potentiel12m: Array(RESULT_ROWS).fill(''),
      // Positionnement
      notesCgp: Array(RESULT_ROWS).fill(''),
      notesManager: Array(RESULT_ROWS).fill(''),
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

  const [selectedTheme, setSelectedTheme] = useState(
    themeOptions[0].value
  );

    
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

      // Moyenne sécurisée (évite division par zéro)
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

// Totaux pour la ligne 1 (somme des lignes 2 et 3)
const totals = {
  objectifsBureaux: 0,
  realisesBureaux: 0,
  objectifsAccompagnement: 0,
  realisesAccompagnement: 0,
  potentiel12m: 0,
};

for (let i = 1; i < RESULT_ROWS; i += 1) {
  totals.objectifsBureaux += parseEuro(
    form.resultats.objectifsBureaux[i]
  );
  totals.realisesBureaux += parseEuro(
    form.resultats.realisesBureaux[i]
  );
  totals.objectifsAccompagnement += parseEuro(
    form.resultats.objectifs[i]
  );
  totals.realisesAccompagnement += parseEuro(
    form.resultats.realises[i]
  );
  totals.potentiel12m += parseEuro(
    form.resultats.potentiel12m[i]
  );
}

    // Garantit qu'on a bien un tableau de longueur RESULT_ROWS
const ensureResultArray = (arr, length) => {
  const safe = Array.isArray(arr) ? arr : [];
  const result = [];
  for (let i = 0; i < length; i += 1) {
    result[i] = safe[i] ?? '';
  }
  return result;
};


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

      // On repart d'un formulaire vierge pour cette année
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
    setForm((prev) => {
      const incoming = data.data || {};
      const incomingResultats = incoming.resultats || {};

      return {
        ...prev,
        ...incoming,
        // On fusionne la section resultats en gardant nos nouveaux champs
        resultats: {
          ...prev.resultats,
          ...incomingResultats,
          objectifsBureaux: ensureResultArray(
            incomingResultats.objectifsBureaux ?? prev.resultats.objectifsBureaux,
            RESULT_ROWS
          ),
          realisesBureaux: ensureResultArray(
            incomingResultats.realisesBureaux ?? prev.resultats.realisesBureaux,
            RESULT_ROWS
          ),
          objectifs: ensureResultArray(
            incomingResultats.objectifs ?? prev.resultats.objectifs,
            RESULT_ROWS
          ),
          realises: ensureResultArray(
            incomingResultats.realises ?? prev.resultats.realises,
            RESULT_ROWS
          ),
          potentiel12m: ensureResultArray(
            incomingResultats.potentiel12m ?? prev.resultats.potentiel12m,
            RESULT_ROWS
          ),
          notesCgp: ensureResultArray(
            incomingResultats.notesCgp ?? prev.resultats.notesCgp,
            RESULT_ROWS
          ),
          notesManager: ensureResultArray(
            incomingResultats.notesManager ?? prev.resultats.notesManager,
            RESULT_ROWS
          ),
        },
      };
    });
  }

    };

    if (!loadingUser) {
      loadLastReport();
    }
  }, [loadingUser, viewedUserId, selectedYear]);


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

    const hasMountedReset = useRef(false);
// RESET complet du rapport lorsque resetKey change (icône Trash)
// On ignore le premier passage (au montage) pour éviter la popup à l'ouverture
useEffect(() => {
  // Première exécution de l'effet : on ne fait rien, on marque juste comme "monté"
  if (!hasMountedReset.current) {
    hasMountedReset.current = true;
    return;
  }

  // Si resetKey est vide / 0, on ne fait rien
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

  // ---- Totaux Board Conseiller (avec Collecte All) ----
  const boardTotals = (() => {
    const objectifs = form.resultats.objectifs || [];
    const realises = form.resultats.realises || [];
    const potentiel12m = form.resultats.potentiel12m || [];

    let obj = 0;
    let rea = 0;
    let pot12 = 0;

  // lignes 2 et 3 => index 1 à RESULT_ROWS-1
  for (let i = 1; i < RESULT_ROWS; i += 1) {
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

  // 1) Résultats : sans PER (7) ni VP (8) -> index 1 à 5
  const coreResultats = notesResultats.slice(1, 6);
  const noteRes = average(coreResultats) * 10;

  // 2) Partenariats
  const notePart = average(notesPart) * 10;

  // 3) Technique : sans la ligne 7 "Social" (index 6) -> index 0 à 5
  const coreTechnique = notesTechArr.slice(0, 6);
  const noteTech = average(coreTechnique) * 10;

  // 4) Bien-être
  const noteBien = average(notesBienArr) * 10;

  // 5) Social = PER (7) + VP (8) + Technique Social (7)
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
    <div className="credit-panel cpsocial-layout">
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

          {/* CP Social à droite */}
          <div style={{ marginLeft: 'auto' }} className="conseiller-label">
            CP Social : {advisorName.lastName || '—'} {advisorName.firstName}
          </div>
        </div>

        {/* Carte Board CP Social (sans graphiques) */}
        <div className="section-card">
          <div className="section-title strong-title">Board CP Social</div>
          {/* Tu pourras rajouter du contenu plus tard si tu veux */}
        </div>

        {/* Carte Résultats uniquement */}
        <div className="section-card" style={{ marginTop: '24px' }}>
          {/* 1. RÉSULTATS */}
          <div className="section-header">
            <div className="section-title strong-title">Résultats</div>
          </div>


            <div className="rapport-section-table">
 {/* Ligne d'en-tête groupée : Bureaux / Accompagnement / Positionnement */}
<div className="rapport-table-header-top">
  {/* 1. Libellés */}
  <span className="col-libelle" />

  {/* Bureaux (colonnes 2 à 4) */}
  <span className="group-header group-bureaux">Bureaux</span>

  {/* Accompagnement (colonnes 5 à 8) */}
  <span className="group-header group-accompagnement">Accompagnement</span>

  {/* Positionnement* (colonnes 9 à 10) */}
  <span
    className="group-header group-positionnement"
    title="Positionnement : faculté à se sentir à l'aise avec la thématique"
  >
    Positionnement*
  </span>
</div>


  {/* Ligne d'en-tête détaillée */}
  <div className="rapport-table-header-sub">
    <span className="col-libelle">Libellés</span>

    {/* Bureaux */}
    <span className="group-bureaux sub-header">Objectifs</span>
    <span className="group-bureaux sub-header">Réalisé</span>
    <span className="group-bureaux sub-header">%</span>

    {/* Accompagnement */}
    <span className="group-accompagnement sub-header">Objectifs</span>
    <span className="group-accompagnement sub-header">Réalisé</span>
    <span className="group-accompagnement sub-header">%</span>
    <span className="group-accompagnement sub-header col-potentiel-header">
      Potentiel 31/12
    </span>

    {/* Positionnement */}
    <span className="group-positionnement sub-header">CPS</span>
    <span className="group-positionnement sub-header">N+1</span>
  </div>    
            

            {resultatsLabels.map((label, i) => {
              const isTotalRow = i === 0;

              // Valeurs Bureaux
              const objectifsBureauxValue = isTotalRow
                ? totals.objectifsBureaux
                : parseEuro(form.resultats.objectifsBureaux[i]);
              const realisesBureauxValue = isTotalRow
                ? totals.realisesBureaux
                : parseEuro(form.resultats.realisesBureaux[i]);
              const percentBureaux =
                objectifsBureauxValue > 0
                  ? Math.round(
                      (realisesBureauxValue / objectifsBureauxValue) * 100
                    )
                  : 0;

              // Valeurs Accompagnement
              const objectifsAccValue = isTotalRow
                ? totals.objectifsAccompagnement
                : parseEuro(form.resultats.objectifs[i]);
              const realisesAccValue = isTotalRow
                ? totals.realisesAccompagnement
                : parseEuro(form.resultats.realises[i]);
              const percentAcc =
                objectifsAccValue > 0
                  ? Math.round(
                      (realisesAccValue / objectifsAccValue) * 100
                    )
                  : 0;

              return (
                <div className="rapport-table-row" key={i}>
                  <span className="col-libelle">
                    {isTotalRow ? <strong>{label}</strong> : label}
                  </span>

                  {/* Objectifs Bureaux (manager/admin seulement, ligne 1 = total auto) */}
                  {isTotalRow ? (
                    <input
                      className="rapport-input manager-cell total-cell"
                      type="text"
                      value={euroFromNumber(totals.objectifsBureaux)}
                      readOnly
                    />
                  ) : (
                    <input
                      className="rapport-input manager-cell"
                      type="text"
                      value={form.resultats.objectifsBureaux[i]}
                      readOnly={
                        currentUserRole !== 'manager' &&
                        currentUserRole !== 'admin'
                      }
                      onChange={(e2) =>
                        updateArrayField(
                          'resultats',
                          'objectifsBureaux',
                          i,
                          e2.target.value
                        )
                      }
                      onBlur={() => {
                        formatEuroField('objectifsBureaux', i);
                        handleAutoSave();
                      }}
                      placeholder="—"
                    />
                  )}

                  {/* Réalisé Bureaux (non saisissable pour tous, ligne 1 = total) */}
                  {isTotalRow ? (
                    <input
                      className="rapport-input manager-cell total-cell"
                      type="text"
                      value={euroFromNumber(totals.realisesBureaux)}
                      readOnly
                    />
                  ) : (
                    <input
                      className="rapport-input manager-cell"
                      type="text"
                      value={form.resultats.realisesBureaux[i]}
                      readOnly
                      placeholder="—"
                    />
                  )}

                  {/* % Bureaux (auto) */}
                  <input
                    className={`rapport-input rapport-input-percent manager-cell${
                      isTotalRow ? ' total-cell' : ''
                    }`}
                    type="text"
                    value={`${percentBureaux} %`}
                    readOnly
                    style={{ maxWidth: 60, textAlign: 'center' }}
                  />

                  {/* Objectifs Accompagnement (manager/admin seulement, total auto) */}
                  {isTotalRow ? (
                    <input
                      className="rapport-input manager-cell total-cell"
                      type="text"
                      value={euroFromNumber(
                        totals.objectifsAccompagnement
                      )}
                      readOnly
                    />
                  ) : (
                    <input
                      className="rapport-input manager-cell"
                      type="text"
                      value={form.resultats.objectifs[i]}
                      readOnly={
                        currentUserRole !== 'manager' &&
                        currentUserRole !== 'admin'
                      }
                      onChange={(e2) =>
                        updateArrayField(
                          'resultats',
                          'objectifs',
                          i,
                          e2.target.value
                        )
                      }
                      onBlur={() => {
                        formatEuroField('objectifs', i);
                        handleAutoSave();
                      }}
                      placeholder="—"
                    />
                  )}

                  {/* Réalisé Accompagnement (saisissable par le CP Social uniquement) */}
                  {isTotalRow ? (
                    <input
                      className="rapport-input manager-cell total-cell"
                      type="text"
                      value={euroFromNumber(
                        totals.realisesAccompagnement
                      )}
                      readOnly
                    />
                  ) : (
                    <input
                      className="rapport-input"
                      type="text"
                      value={form.resultats.realises[i]}
                      readOnly={
                        currentUserRole === 'manager' ||
                        currentUserRole === 'admin'
                      }
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

                  {/* % Accompagnement (auto) */}
                  <input
                    className={`rapport-input rapport-input-percent manager-cell${
                      isTotalRow ? ' total-cell' : ''
                    }`}
                    type="text"
                    value={`${percentAcc} %`}
                    readOnly
                    style={{ maxWidth: 60, textAlign: 'center' }}
                  />

                  {/* Potentiel 31/12 (Accompagnement) – saisissable par le CP Social */}
                  {isTotalRow ? (
                    <input
                      className="rapport-input rapport-input-potentiel manager-cell total-cell"
                      type="text"
                      value={euroFromNumber(totals.potentiel12m)}
                      readOnly
                    />
                  ) : (
                    <input
                      className="rapport-input rapport-input-potentiel"
                      type="text"
                      value={form.resultats.potentiel12m[i]}
                      readOnly={
                        currentUserRole === 'manager' ||
                        currentUserRole === 'admin'
                      }
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

                  {/* Positionnement CPS / N+1 */}
                  {isTotalRow ? (
                    <>
                      <span />
                      <span />
                    </>
                  ) : (
                    <>
                      {/* Positionnement CPS (CP Social) */}
                      <input
                        className="rapport-input rapport-input-note"
                        type="number"
                        min="0"
                        max="10"
                        value={form.resultats.notesCgp[i]}
                        readOnly={
                          currentUserRole === 'manager' ||
                          currentUserRole === 'admin'
                        }
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

                      {/* N+1 (manager/admin) */}
                      <input
                        className="rapport-input rapport-input-note manager-cell"
                        type="number"
                        min="0"
                        max="10"
                        value={form.resultats.notesManager?.[i] || ''}
                        readOnly={
                          currentUserRole !== 'manager' &&
                          currentUserRole !== 'admin'
                        }
                        onChange={(e2) =>
                          updateArrayField(
                            'resultats',
                            'notesManager',
                            i,
                            clampNote(e2.target.value)
                          )
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
            readOnly={
              currentUserRole !== 'manager' &&
              currentUserRole !== 'admin'
            }
            onChange={(e2) =>
              updateField('resultats', 'strategie', e2.target.value)
            }
            onBlur={handleAutoSave}
            placeholder="Renseigné par le manager"
          />

          {error && (
            <div className="alert error" style={{ marginTop: '8px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
