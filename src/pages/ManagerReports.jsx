// src/pages/ManagerReports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

// Utilitaires pour les montants
const parseEuro = (value) => {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^\d-]/g, '');
  const n = Number(cleaned);
  if (Number.isNaN(n)) return 0;
  return n;
};

const formatEuro = (n) =>
  (Number.isNaN(n) ? 0 : n).toLocaleString('fr-FR') + ' €';

function computeTotalsFromReport(data) {
  if (!data || !data.resultats) {
    return {
      objectifs: 0,
      realises: 0,
      potentiel12m: 0,
    };
  }

  const {
    objectifs = [],
    realises = [],
    potentiel12m = [],
  } = data.resultats;

  const totals = {
    objectifs: 0,
    realises: 0,
    potentiel12m: 0,
  };

  // On somme les lignes 2 à 8 (index 1 à 7)
  for (let i = 1; i < 8; i += 1) {
    totals.objectifs += parseEuro(objectifs[i] || 0);
    totals.realises += parseEuro(realises[i] || 0);
    totals.potentiel12m += parseEuro(potentiel12m[i] || 0);
  }

  return totals;
}

// Moyenne sécurisée (évite division par zéro)
const average = (arr) => {
  const nums = arr.map((v) => Number(v) || 0).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

// Retourne une date formatée JJ/MM/AA
const formatShortDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
};

// Vérifie si la date est > 15 jours
const isOlderThan15Days = (iso) => {
  if (!iso) return false;
  const now = new Date();
  const d = new Date(iso);
  const diff = now - d;
  return diff > 15 * 24 * 60 * 60 * 1000;
};

export default function ManagerReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rows, setRows] = useState([]); // lignes conseillers
  const [agencies, setAgencies] = useState([]); // liste agences distinctes
  const [selectedAgencies, setSelectedAgencies] = useState([]); // filtres agences

  const [sortKey, setSortKey] = useState('bureau');
  const [sortDirection, setSortDirection] = useState('asc');

  const navigate = useNavigate();

  // Charge les données pour la synthèse manager
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Vérifier l'utilisateur connecté
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          navigate('/login');
          return;
        }

        // 2. Récupérer le rôle dans profiles
        const { data: meProfile, error: meProfileError } = await supabase
          .from('profiles')
          .select('role, agences_filtrees')
          .eq('id', user.id)
          .maybeSingle();

        if (meProfileError) {
          console.error(meProfileError);
        }

        const myRole = String(meProfile?.role || 'conseiller').toLowerCase();

        // Si ce n'est pas un manager / admin -> on renvoie au rapport classique
        if (myRole !== 'manager' && myRole !== 'admin') {
          navigate('/rapport');
          return;
        }

        // 3. Charger tous les profils
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, bureau, role');

        if (profilesError) {
          console.error(profilesError);
          setError('Erreur lors du chargement des profils.');
          setLoading(false);
          return;
        }

        // 4. Charger tous les rapports (dernier en premier)
        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('id, user_id, period, data, created_at')
          .order('created_at', { ascending: false });

        if (reportsError) {
          console.error(reportsError);
          setError('Erreur lors du chargement des rapports.');
          setLoading(false);
          return;
        }

        // 5. Garder le dernier rapport par utilisateur
        const latestByUser = {};
        (reports || []).forEach((rep) => {
          if (!latestByUser[rep.user_id]) {
            latestByUser[rep.user_id] = rep;
          }
        });

        const rowsData = [];
        const agencySet = new Set();

        (profiles || []).forEach((p) => {
          const role = (p.role || '').toLowerCase();

          // On n'inclut pas les admins dans le tableau
          if (role === 'admin') {
            return;
          }

          const bureau = p.bureau || '—';
          agencySet.add(bureau);

          const rep = latestByUser[p.id] || null;
          let totals = {
            objectifs: 0,
            realises: 0,
            potentiel12m: 0,
          };
          let lastSave = null;
          let noteRes = 0;
          let notePart = 0;
          let noteTech = 0;
          let noteBien = 0;
          let noteSocial = 0;
          let percentRealise = 0;


          if (rep) {
            totals = computeTotalsFromReport(rep.data);
            lastSave = rep.created_at || null;

            const data = rep.data || {};

            const notesResultats = data?.resultats?.notesCgp || [];
            const notesPart = data?.partenariat?.notesCgp || [];
            const notesTechArr = data?.technique?.notesCgp || [];
            const notesBienArr = data?.bienEtre?.notesCgp || [];

            // 1) Moyenne Résultats : sans PER (7) ni VP (8)
            const coreResultats = notesResultats.slice(1, 6); // index 1 à 5
            noteRes = average(coreResultats) * 10;

            // 2) Partenariats : inchangé
            notePart = average(notesPart) * 10;

            // 3) Technique : sans la ligne 6 "Social" (index 5)
            const coreTechnique = notesTechArr.slice(0, 5); // index 0 à 4
            noteTech = average(coreTechnique) * 10;

            // 4) Bien-être : inchangé
            noteBien = average(notesBienArr) * 10;

            // 5) Social = moyenne PER (7) + VP (8) + Technique Social (6)
            const perNote = Number(notesResultats[6] || 0);  // "7 - PER ..."
            const vpNote = Number(notesResultats[7] || 0);   // "8 - VP ..."
            const socialTechNote = Number(notesTechArr[5] || 0); // "6 - Social ..."
            noteSocial = average([perNote, vpNote, socialTechNote]) * 10;


            // % réalisé vs objectifs (sur les totaux)
            if (totals.objectifs > 0) {
              percentRealise = (totals.realises / totals.objectifs) * 100;
            }
          }

          rowsData.push({
            userId: p.id,
            firstName: p.first_name || '',
            lastName: p.last_name || '',
            bureau,
            objectifs: totals.objectifs,
            realises: totals.realises,
            potentiel12m: totals.potentiel12m,
            percentRealise,
            lastSave,
            noteRes,
            notePart,
            noteTech,
            noteBien,
            noteSocial,
            role: role || 'conseiller',
          });
        });

        const agenciesList = Array.from(agencySet).sort((a, b) =>
          a.localeCompare(b, 'fr')
        );

        setRows(rowsData);
        setAgencies(agenciesList);
        // Appliquer filtres sauvegardés ou toutes les agences si vide
        const saved = meProfile?.agences_filtrees;
        if (saved && saved.length > 0) {
          setSelectedAgencies(saved);
        } else {
          setSelectedAgencies(agenciesList);
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError('Erreur inattendue lors du chargement.');
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // Gestion du filtre agences
const toggleAgency = async (bureau) => {
  setSelectedAgencies((prev) => {
    let updated;
    if (prev.includes(bureau)) {
      updated = prev.filter((b) => b !== bureau);
    } else {
      updated = [...prev, bureau];
    }

    // Sauvegarde Supabase
    saveAgencyFilters(updated);
    return updated;
  });
};

const saveAgencyFilters = async (list) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('profiles')
    .update({ agences_filtrees: list })
    .eq('id', user.id);
};


  // Tri + filtrage
  const sortedRows = useMemo(() => {
    let filtered = rows;

    if (selectedAgencies.length > 0) {
      filtered = rows.filter((r) => selectedAgencies.includes(r.bureau));
    }

    const dir = sortDirection === 'asc' ? 1 : -1;

    const compare = (a, b) => {
      const byBureau = a.bureau.localeCompare(b.bureau, 'fr');
      const byName = `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
        'fr'
      );

      if (sortKey === 'bureau') {
        if (byBureau !== 0) return byBureau * dir;
        return byName * dir;
      }

      if (sortKey === 'name') {
        if (byName !== 0) return byName * dir;
        return byBureau * dir;
      }

      // colonnes numériques
      const av = a[sortKey] || 0;
      const bv = b[sortKey] || 0;

      if (av === bv) {
        if (byBureau !== 0) return byBureau * dir;
        return byName * dir;
      }
      return (av < bv ? -1 : 1) * dir;
    };

    return [...filtered].sort(compare);
  }, [rows, selectedAgencies, sortKey, sortDirection]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'bureau' || key === 'name' ? 'asc' : 'desc');
    }
  };

  const handleRowClick = (userId) => {
    // Ouvre le rapport du conseiller ciblé
    navigate(`/rapport/${userId}`);
  };

  if (loading) {
    return (
      <div className="credit-panel">
        <div className="section-card">
          <div className="section-title strong-title">Synthèse Manager</div>
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="credit-panel">
        <div className="section-card">
          <div className="section-title strong-title">Synthèse Manager</div>
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      </div>
    );
  }

  // Totaux / moyennes pour la ligne TOTAL / MOYENNE
  const totalObjectifs = sortedRows.reduce((a, r) => a + (r.objectifs || 0), 0);
  const totalRealises = sortedRows.reduce((a, r) => a + (r.realises || 0), 0);
  const totalPot12 = sortedRows.reduce((a, r) => a + (r.potentiel12m || 0), 0);

  let totalPercent = 0;
  if (totalObjectifs > 0) {
    totalPercent = (totalRealises / totalObjectifs) * 100;
  }

  const avgRes = average(sortedRows.map((r) => r.noteRes || 0));
  const avgPart = average(sortedRows.map((r) => r.notePart || 0));
  const avgTech = average(sortedRows.map((r) => r.noteTech || 0));
  const avgBien = average(sortedRows.map((r) => r.noteBien || 0));
  const avgSocial = average(sortedRows.map((r) => r.noteSocial || 0));

  // ---- Données pour le "Board Manager" ----

  // 1/2. % d'atteinte global (borné entre 0 et 100)
  const attainment = Math.max(0, Math.min(100, totalPercent || 0));

  // 3. Barres empilées (Réalisé + Potentiel / Objectifs)
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

  // 4. Histogramme empilé des notes CGP (base 100)
  const noteLabels = [
    'Résultats',
    'Partenariats',
    'Technique',
    'Bien-être',
    'Social',
  ];
  const noteValues = [avgRes, avgPart, avgTech, avgBien, avgSocial];
  const noteColors = ['#2B3E37', '#788781', '#9fbdb2', '#CFDED8', '#CEC1B6'];

  const sumNotes = noteValues.reduce((a, b) => a + (b || 0), 0);
  const noteSegments =
    sumNotes > 0
      ? noteValues.map((v) => (v / sumNotes) * 100)
      : noteValues.map(() => 0);

  return (
    <div className="credit-panel">
      {/* 1. BOARD MANAGER */}
      <div className="section-card">
        <div className="section-title strong-title">Board Manager</div>

        {/* Filtres agences (mêmes cases que la synthèse) */}
        <div className="manager-filters">
          <div className="manager-filters-label">Agences :</div>
          <div className="manager-filters-list">
            {agencies.map((bureau) => (
              <label key={bureau} className="manager-filter-chip">
                <input
                  type="checkbox"
                  checked={selectedAgencies.includes(bureau)}
                  onChange={() => toggleAgency(bureau)}
                />
                <span>{bureau}</span>
              </label>
            ))}
            {agencies.length === 0 && (
              <span className="manager-filters-empty">
                Aucune agence trouvée.
              </span>
            )}
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
          {/* 1) Total réalisé vs objectifs */}
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
              Total réalisé vs objectifs
            </div>
            <div
              style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}
            >
              Objectifs : {formatEuro(totalObjectifs)}<br />
              Réalisé : {formatEuro(totalRealises)}
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
                    totalObjectifs > 0
                      ? `${Math.min(
                          100,
                          (totalRealises / totalObjectifs) * 100
                        )}%`
                      : '0%',
                  height: '100%',
                  backgroundColor: '#2B3E37',
                }}
              />
            </div>
          </div>

          {/* 2) Camembert : % d'atteinte global */}
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

          {/* 3) Barre empilée : Réalisé + Potentiel 31/12 vs objectifs */}
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
              Objectifs : {formatEuro(totalObjectifs)}<br />
              Réalisé : {formatEuro(totalRealises)}<br />
              Potentiel 31/12 : {formatEuro(totalPot12)}
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
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                fontSize: 11,
                color: '#4b5563',
              }}
            >
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    backgroundColor: '#2B3E37',
                  }}
                />
                Réalisé
              </span>
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    backgroundColor: '#9fbdb2',
                  }}
                />
                Potentiel 31/12
              </span>
            </div>
          </div>

          {/* 4) Histogramme empilé des notes CGP (base 100) */}
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
              Notes CGP (base 100)
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
        </div>
      </div>

      {/* 2. SYNTHÈSE MANAGER (inchangé, juste déplacé en dessous) */}
      <div className="section-card">
        <div className="section-title strong-title">Synthèse Manager</div>

        {/* Filtres agences */}
        <div className="manager-filters">
          <div className="manager-filters-label">Agences :</div>
          <div className="manager-filters-list">
            {agencies.map((bureau) => (
              <label key={bureau} className="manager-filter-chip">
                <input
                  type="checkbox"
                  checked={selectedAgencies.includes(bureau)}
                  onChange={() => toggleAgency(bureau)}
                />
                <span>{bureau}</span>
              </label>
            ))}
            {agencies.length === 0 && (
              <span className="manager-filters-empty">
                Aucune agence trouvée.
              </span>
            )}
          </div>
        </div>

        {/* Tableau de synthèse */}
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th
                  rowSpan="2"
                  onClick={() => handleSort('bureau')}
                  style={{ backgroundColor: '#D9D9D9' }}
                >
                  Agence
                  {sortKey === 'bureau' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th
                  rowSpan="2"
                  onClick={() => handleSort('name')}
                  style={{ backgroundColor: '#D9D9D9' }}
                >
                  Nom / Prénom
                  {sortKey === 'name' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th
                  rowSpan="2"
                  onClick={() => handleSort('objectifs')}
                  style={{ backgroundColor: '#D9D9D9' }}
                >
                  Objectifs
                  {sortKey === 'objectifs' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th
                  rowSpan="2"
                  onClick={() => handleSort('realises')}
                  style={{ backgroundColor: '#D9D9D9' }}
                >
                  Réalisé
                  {sortKey === 'realises' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th
                  rowSpan="2"
                  onClick={() => handleSort('percentRealise')}
                  style={{ backgroundColor: '#D9D9D9' }}
                >
                  %
                  {sortKey === 'percentRealise' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th
                  rowSpan="2"
                  onClick={() => handleSort('potentiel12m')}
                  style={{ backgroundColor: '#D9D9D9' }}
                >
                  Potentiel 31/12
                  {sortKey === 'potentiel12m' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th rowSpan="2" style={{ backgroundColor: '#D9D9D9' }}>
                  Dernière actu.
                </th>
                <th
                  colSpan="5"
                  style={{
                    backgroundColor: '#D9D9D9',
                    textAlign: 'center',
                  }}
                >
                  Notes CGP
                </th>

              </tr>
              <tr>
                <th style={{ backgroundColor: '#F5F3F0' }}>Résultat</th>
                <th style={{ backgroundColor: '#F5F3F0' }}>Part.</th>
                <th style={{ backgroundColor: '#F5F3F0' }}>Tech.</th>
                <th style={{ backgroundColor: '#F5F3F0' }}>Bien-être</th>
                <th style={{ backgroundColor: '#CEC1B6' }}>Social</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    style={{ textAlign: 'center', padding: '16px' }}
                  >
                    Aucun utilisateur trouvé pour les agences sélectionnées.
                  </td>
                </tr>
              )}

              {sortedRows.map((row, idx) => (
                <tr
                  key={row.userId}
                  className="manager-row"
                  onClick={() => handleRowClick(row.userId)}
                >
                  <td>{row.bureau}</td>
                  <td>
                    {idx + 1}. {row.lastName.toUpperCase()} {row.firstName}
                  </td>
                  <td>{formatEuro(row.objectifs)}</td>
                  <td>{formatEuro(row.realises)}</td>
                  <td>
                    {row.percentRealise
                      ? `${Math.round(row.percentRealise)}%`
                      : '—'}
                  </td>
                  <td>{formatEuro(row.potentiel12m)}</td>
                  <td
                    style={{
                      color: isOlderThan15Days(row.lastSave)
                        ? '#b91c1c'
                        : undefined,
                    }}
                  >
                    {formatShortDate(row.lastSave)}
                  </td>
                  <td
                    style={{
                      color: row.noteRes < 50 ? '#b91c1c' : undefined,
                    }}
                  >
                    {row.noteRes ? `${Math.round(row.noteRes)}%` : '—'}
                  </td>
                  <td
                    style={{
                      color: row.notePart < 50 ? '#b91c1c' : undefined,
                    }}
                  >
                    {row.notePart ? `${Math.round(row.notePart)}%` : '—'}
                  </td>
                  <td
                    style={{
                      color: row.noteTech < 50 ? '#b91c1c' : undefined,
                    }}
                  >
                    {row.noteTech ? `${Math.round(row.noteTech)}%` : '—'}
                  </td>
                  <td
                    style={{
                      color: row.noteBien < 50 ? '#b91c1c' : undefined,
                    }}
                  >
                    {row.noteBien ? `${Math.round(row.noteBien)}%` : '—'}
                  </td>
                  <td
                    style={{
                      color: row.noteBien < 50 ? '#b91c1c' : undefined,
                    }}
                  >
                    {row.noteBien ? `${Math.round(row.noteBien)}%` : '—'}
                  </td>
                  <td
                    style={{
                      color: row.noteSocial < 50 ? '#b91c1c' : undefined,
                    }}
                  >
                    {row.noteSocial ? `${Math.round(row.noteSocial)}%` : '—'}
                  </td>
                </tr>
              ))}

              {sortedRows.length > 0 && (
                <tr
                  className="manager-total-row"
                  style={{ backgroundColor: '#D9D9D9', fontWeight: '600' }}
                >
                  <td colSpan={2}>TOTAL / MOYENNE</td>
                  <td>{formatEuro(totalObjectifs)}</td>
                  <td>{formatEuro(totalRealises)}</td>
                  <td>
                    {totalPercent ? `${Math.round(totalPercent)}%` : '—'}
                  </td>
                  <td>{formatEuro(totalPot12)}</td>
                  <td>—</td>
                  <td>{avgRes ? `${Math.round(avgRes)}%` : '—'}</td>
                  <td>{avgPart ? `${Math.round(avgPart)}%` : '—'}</td>
                  <td>{avgTech ? `${Math.round(avgTech)}%` : '—'}</td>
                  <td>{avgBien ? `${Math.round(avgBien)}%` : '—'}</td>
                  <td>{avgBien ? `${Math.round(avgBien)}%` : '—'}</td>
                  <td>{avgSocial ? `${Math.round(avgSocial)}%` : '—'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 12, fontSize: 13, color: '#777' }}>
          Cliquez sur une ligne pour accéder au rapport détaillé du conseiller.
        </p>
      </div>
    </div>
  );

}
