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

// Calcule les totaux Objectifs / Réalisé / Potentiels à partir du JSON du rapport
function computeTotalsFromReport(data) {
  if (!data || !data.resultats) {
    return {
      objectifs: 0,
      realises: 0,
      potentiel3m: 0,
      potentiel12m: 0,
    };
  }

  const {
    objectifs = [],
    realises = [],
    potentiel3m = [],
    potentiel12m = [],
  } = data.resultats;

  const totals = {
    objectifs: 0,
    realises: 0,
    potentiel3m: 0,
    potentiel12m: 0,
  };

  // On somme les lignes 2 à 8 (index 1 à 7)
  for (let i = 1; i < 8; i += 1) {
    totals.objectifs += parseEuro(objectifs[i] || 0);
    totals.realises += parseEuro(realises[i] || 0);
    totals.potentiel3m += parseEuro(potentiel3m[i] || 0);
    totals.potentiel12m += parseEuro(potentiel12m[i] || 0);
  }

  return totals;
}

export default function ManagerReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rows, setRows] = useState([]); // lignes conseillers
  const [agencies, setAgencies] = useState([]); // liste des agences distinctes
  const [selectedAgencies, setSelectedAgencies] = useState([]); // filtres agences

  const [sortKey, setSortKey] = useState('bureau'); // 'bureau' | 'name' | 'objectifs' | 'realises' | ...
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const navigate = useNavigate();

  // Charge les données pour le manager
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
          .select('role')
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

        // 4. Charger tous les rapports (RLS doit autoriser manager/admin à lire)
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

        // 5. Garder le dernier rapport par conseiller
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

  // On exclut seulement les admins, on affiche tout le reste (conseiller, manager, etc.)
  if (role === 'admin') {
    return;
  }

  const bureau = p.bureau || '—';
  agencySet.add(bureau);

  const rep = latestByUser[p.id] || null;
  let totals = {
    objectifs: 0,
    realises: 0,
    potentiel3m: 0,
    potentiel12m: 0,
  };
  let period = '';

  if (rep) {
    totals = computeTotalsFromReport(rep.data);
    period = rep.period || '';
  }

  rowsData.push({
    userId: p.id,
    firstName: p.first_name || '',
    lastName: p.last_name || '',
    bureau,
    objectifs: totals.objectifs,
    realises: totals.realises,
    potentiel3m: totals.potentiel3m,
    potentiel12m: totals.potentiel12m,
    period,
  });
});


        const agenciesList = Array.from(agencySet).sort((a, b) =>
          a.localeCompare(b, 'fr')
        );

        setRows(rowsData);
        setAgencies(agenciesList);
        setSelectedAgencies(agenciesList); // par défaut toutes sélectionnées
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError('Erreur inattendue lors du chargement.');
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // Gestion du filtre Agences
  const toggleAgency = (bureau) => {
    setSelectedAgencies((prev) => {
      if (prev.includes(bureau)) {
        return prev.filter((b) => b !== bureau);
      }
      return [...prev, bureau];
    });
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

  return (
    <div className="credit-panel">
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
                <th onClick={() => handleSort('bureau')}>
                  Agence
                  {sortKey === 'bureau' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th onClick={() => handleSort('name')}>
                  Nom / Prénom
                  {sortKey === 'name' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th onClick={() => handleSort('objectifs')}>
                  Objectifs
                  {sortKey === 'objectifs' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th onClick={() => handleSort('realises')}>
                  Réalisé
                  {sortKey === 'realises' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th onClick={() => handleSort('potentiel3m')}>
                  Signature 1 mois
                  {sortKey === 'potentiel3m' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th onClick={() => handleSort('potentiel12m')}>
                  Potentiel
                  {sortKey === 'potentiel12m' &&
                    (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th>Période</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '16px' }}>
                    Aucun conseiller trouvé pour les agences sélectionnées.
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
                  <td>{formatEuro(row.potentiel3m)}</td>
                  <td>{formatEuro(row.potentiel12m)}</td>
                  <td>{row.period || '—'}</td>
                </tr>
              ))}
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
