// src/pages/UsersAdmin.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const BUREAUX = [
  'Aix en Provence',
  'Angers',
  'Annecy',
  'Bordeaux',
  'Bourges',
  'Brest',
  'Caen',
  'Cambrai',
  'Caraïbes',
  'Cholet',
  'Clermont',
  'Client Direct',
  'Dijon',
  'Gap',
  'Grenoble',
  'International',
  'La rochelle',
  'Le Mans',
  'Licorne',
  'Lille',
  'Lyon',
  'Marseille',
  'Montargis',
  'Montpellier',
  'Mulhouse',
  'Nantes',
  'Nice',
  'Paris',
  'Perpignan',
  'Rennes',
  'Rouen',
  'Réunion',
  'Saint Brieuc',
  'Sport',
  'St Remy de Provence',
  'Strasbourg',
  'Toulon',
  'Toulouse',
  'Tours',
  'Valence',
  'Vannes',
];

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');

  // Formulaire création
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bureau, setBureau] = useState('');
  const [poste, setPoste] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [info, setInfo] = useState('');

  const loadUsers = async () => {
    setLoadingList(true);
    setError('');
    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, bureau, poste, role, created_at')
      .order('created_at', { ascending: true });

    if (profilesError) {
      setError(profilesError.message || "Erreur lors du chargement des utilisateurs.");
      setLoadingList(false);
      return;
    }

    setUsers(data || []);
    setLoadingList(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setCreating(true);

    if (!firstName || !lastName || !email || !bureau || !poste) {
      setError('Merci de remplir tous les champs.');
      setCreating(false);
      return;
    }

    // Mot de passe temporaire : l'utilisateur utilisera "Mot de passe oublié"
    const tempPassword = Math.random().toString(36).slice(-10);

    // IMPORTANT : pour que cela se fasse SANS mail de validation,
    // il faut désactiver la confirmation d'email dans Supabase Auth.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          bureau,
          poste,
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        setError('Un compte existe déjà avec cet email.');
      } else {
        setError(signUpError.message || "Erreur lors de la création de l'utilisateur.");
      }
      setCreating(false);
      return;
    }

    if (data?.user) {
      // On force le rôle "conseiller"
      await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          bureau,
          poste,
          role: 'conseiller',
        })
        .eq('id', data.user.id);
    }

    setInfo(
      "Utilisateur créé. Il pourra utiliser 'Mot de passe oublié' pour définir son mot de passe."
    );

    // Reset formulaire
    setFirstName('');
    setLastName('');
    setEmail('');
    setBureau('');
    setPoste('');

    // Recharger la liste
    await loadUsers();
    setCreating(false);
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h2 className="section-title strong-title">Gestion des utilisateurs</h2>

        {error && <div className="alert error">{error}</div>}
        {info && <div className="alert success">{info}</div>}

        {/* Formulaire de création */}
        <h3 style={{ marginTop: 0, fontSize: 18 }}>Créer un nouveau conseiller</h3>
        <form
          onSubmit={handleCreateUser}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div className="settings-field">
            <label className="settings-label">Prénom</label>
            <input
              className="rapport-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">Nom</label>
            <input
              className="rapport-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">Email</label>
            <input
              className="rapport-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">Bureau</label>
            <select
              className="rapport-input"
              value={bureau}
              onChange={(e) => setBureau(e.target.value)}
              required
            >
              <option value="">Sélectionner un bureau</option>
              {BUREAUX.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-field">
            <label className="settings-label">Poste occupé</label>
            <select
              className="rapport-input"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              required
            >
              <option value="">Sélectionner un poste</option>
              <option value="CGP">CGP</option>
              <option value="CPSocial">CPSocial</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              marginTop: 4,
            }}
          >
            <button className="btn" type="submit" disabled={creating}>
              {creating ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>

        {/* Liste des utilisateurs */}
        <h3 style={{ fontSize: 18 }}>Comptes existants</h3>
        {loadingList ? (
          <p>Chargement…</p>
        ) : users.length === 0 ? (
          <p>Aucun utilisateur pour le moment.</p>
        ) : (
          <div className="manager-table-wrap">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Bureau</th>
                  <th>Poste</th>
                  <th>Rôle</th>
                  <th>Créé le</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.last_name || u.lastName}</td>
                    <td>{u.first_name || u.firstName}</td>
                    <td>{u.bureau || '—'}</td>
                    <td>{u.poste || '—'}</td>
                    <td>{u.role}</td>
                    <td>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
