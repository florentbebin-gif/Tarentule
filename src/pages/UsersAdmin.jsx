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

const ALLOWED_DOMAIN = '@laplace-groupe.com';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');

  // Formulaire création
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bureau, setBureau] = useState('');
  const [poste, setPoste] = useState('');
  const [role, setRole] = useState('conseiller');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [info, setInfo] = useState('');

  // Filtre d'affichage des comptes : tous / CGP / CPSocial
  const [posteFilter, setPosteFilter] = useState('all'); // 'all' | 'CGP' | 'CPSocial' | 'GP'
  const [sortDirection, setSortDirection] = useState(null); // 'asc' | 'desc' | null

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    bureau: '',
    poste: '',
    role: 'conseiller',
  });

  const loadUsers = async () => {
    setLoadingList(true);
    setError('');
    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select(
        'id, first_name, last_name, bureau, poste, role, created_at, is_active'
      )
      .eq('is_active', true) // on n'affiche que les comptes actifs
      .order('created_at', { ascending: true });


    if (profilesError) {
      setError(
        profilesError.message ||
          'Erreur lors du chargement des utilisateurs.'
      );
      setLoadingList(false);
      return;
    }

    setUsers(data || []);
    setLoadingList(false);
  };

  // Désactivation (soft delete) d'un compte
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Confirmer la suppression de ce compte ?')) return;

    setError('');
    setInfo('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId);

    if (updateError) {
      setError(
        updateError.message ||
          'Erreur lors de la suppression du compte.'
      );
      return;
    }

    setInfo('Compte désactivé.');
    await loadUsers();
  };

    useEffect(() => {
    const checkAccess = async () => {
      setCheckingAccess(true);
      setAccessDenied(false);
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        setAccessDenied(true);
        setCheckingAccess(false);
        setLoadingList(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const roleValue = profile?.role || user.user_metadata?.role;
      const isAdmin = roleValue === 'admin';

      if (!isAdmin) {
        setAccessDenied(true);
        setCheckingAccess(false);
        setLoadingList(false);
        return;
      }

      await loadUsers();
      setCheckingAccess(false);
    };;

  
    checkAccess();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setCreating(true);

    if (!firstName || !lastName || !email || !bureau || !poste || !role) {
      setError('Merci de remplir tous les champs.');
      setCreating(false);
      return;
    }

    // Normaliser l'email
    const normalizedEmail = email.trim().toLowerCase();

    // Vérification du domaine autorisé
    if (!normalizedEmail.endsWith(ALLOWED_DOMAIN)) {
      setError(
        "La création de compte est réservée aux adresses professionnelles @laplace-groupe.com"
      );
      setCreating(false);
      return;
    }

    // Mot de passe temporaire : l'utilisateur utilisera "Mot de passe oublié"
    const tempPassword = Math.random().toString(36).slice(-10);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: tempPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          bureau,
          poste,
          role,
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() || '';
      if (
        msg.includes('already registered') ||
        msg.includes('user already exists')
      ) {
        setError('Un compte existe déjà avec cet email.');
      } else {
        setError(
          signUpError.message ||
            "Erreur lors de la création de l'utilisateur."
        );
      }
      setCreating(false);
      return;
    }

    if (data?.user) {
      // Mettre à jour le profil avec les valeurs sélectionnées
      await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          bureau,
          poste,
          role,
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
    setRole('conseiller');

    // Recharger la liste
    await loadUsers();
    setCreating(false);
  }; // ✅ fermeture de handleCreateUser

  // ✅ calcul de la liste filtrée EN DEHORS de handleCreateUser
  const filteredUsers =
    posteFilter === 'all'
      ? users
      : users.filter(
          (u) =>
            (u.poste || '').toLowerCase() ===
            posteFilter.toLowerCase()
        );
  const displayedUsers = sortDirection
    ? [...filteredUsers].sort((a, b) => {
        const nameA = (a.last_name || '').toLowerCase();
        const nameB = (b.last_name || '').toLowerCase();
        if (nameA === nameB) return 0;
        const order = nameA.localeCompare(nameB, 'fr', {
          sensitivity: 'base',
        });
        return sortDirection === 'asc' ? order : -order;
      })
    : filteredUsers;

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      bureau: user.bureau || '',
      poste: user.poste || '',
      role: user.role || 'conseiller',
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm({
      first_name: '',
      last_name: '',
      bureau: '',
      poste: '',
      role: 'conseiller',
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (userId) => {
    setError('');
    setInfo('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        bureau: editForm.bureau,
        poste: editForm.poste,
        role: editForm.role,
      })
      .eq('id', userId);

    if (updateError) {
      setError(
        updateError.message ||
          "Erreur lors de la mise à jour de l'utilisateur."
      );
      return;
    }

    setInfo('Utilisateur mis à jour.');
    setEditingUserId(null);
    await loadUsers();
  };

  const toggleSort = () => {
    setSortDirection((prev) => {
      if (prev === 'asc') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'asc';
    });
  };
  return (
    <div className="settings-page">
      <div className="settings-card">
        <h2 className="section-title strong-title">
          Gestion des utilisateurs
        </h2>
        {accessDenied && (
          <div className="alert error">Accès refusé</div>
        )}
        {error && <div className="alert error">{error}</div>}
        {info && <div className="alert success">{info}</div>}
        
        {checkingAccess ? (
          <p>Chargement…</p>
        ) : accessDenied ? null : (
          <>
        {/* Formulaire de création */}
        <h3 style={{ marginTop: 0, fontSize: 18 }}>
          Créer un nouveau conseiller
        </h3>
        <form
          onSubmit={handleCreateUser}
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(200px, 1fr))',
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
              <option value="GP">GP</option>
            </select>
          </div>

          <div className="settings-field">
            <label className="settings-label">Rôle</label>
            <select
              className="rapport-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="conseiller">conseiller</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
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

        {/* Ligne fine au-dessus des comptes existants */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            margin: '16px 0 8px',
          }}
        />

        {/* Titre + boutons filtre alignés droite */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h3 style={{ fontSize: 18, margin: 0 }}>
            Comptes existants
          </h3>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Bouton CGP */}
            <button
              type="button"
              onClick={() => setPosteFilter('CGP')}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid #9ca3af',
                backgroundColor:
                  posteFilter === 'CGP' ? '#2B3E37' : '#ffffff',
                color:
                  posteFilter === 'CGP' ? '#ffffff' : '#111827',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              CGP
            </button>
            {/* Bouton GP */}
            <button
              type="button"
              onClick={() => setPosteFilter('GP')}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid #9ca3af',
                backgroundColor:
                  posteFilter === 'GP' ? '#2B3E37' : '#ffffff',
                color:
                  posteFilter === 'GP' ? '#ffffff' : '#111827',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              GP
            </button>
            
            {/* Bouton GP */}
            <button
              type="button"
              onClick={() => setPosteFilter('GP')}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid #9ca3af',
                backgroundColor:
                  posteFilter === 'GP' ? '#2B3E37' : '#ffffff',
                color:
                  posteFilter === 'GP' ? '#ffffff' : '#111827',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              GP
            </button>

            {/* Bouton CP Social */}
            <button
              type="button"
              onClick={() => setPosteFilter('CPSocial')}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid #9ca3af',
                backgroundColor:
                  posteFilter === 'CPSocial'
                    ? '#2B3E37'
                    : '#ffffff',
                color:
                  posteFilter === 'CPSocial'
                    ? '#ffffff'
                    : '#111827',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              CP Social
            </button>

            {/* Bouton Tous */}
            <button
              type="button"
              onClick={() => setPosteFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid #9ca3af',
                backgroundColor:
                  posteFilter === 'all' ? '#2B3E37' : '#ffffff',
                color:
                  posteFilter === 'all' ? '#ffffff' : '#111827',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Tous
            </button>
          </div>
        </div>

        {loadingList ? (
          <p>Chargement…</p>
        ) : users.length === 0 ? (
          <p>Aucun utilisateur pour le moment.</p>
        ) : displayedUsers.length === 0 ? (
          <p>Aucun utilisateur pour ce filtre.</p>
        ) : (
          <div className="manager-table-wrap">
            <table className="manager-table">
<thead>
  <tr>
        <th
      onClick={toggleSort}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      Nom{' '}
      <span style={{ fontSize: 11, marginLeft: 4 }}>
        {sortDirection === 'asc'
          ? '▲'
          : sortDirection === 'desc'
          ? '▼'
          : ''}
      </span>
    </th>
    <th>Prénom</th>
    <th>Bureau</th>
    <th>Poste</th>
    <th>Rôle</th>
    <th>Créé le</th>
    <th>Actions</th>
  </tr>
</thead>

<tbody>
  {displayedUsers.map((u) => {
    const isEditing = editingUserId === u.id;
  
    return (
      <tr key={u.id}>
        <td>
          {isEditing ? (
            <input
              className="rapport-input"
              type="text"
              value={editForm.last_name}
              onChange={(e) =>
                handleEditChange('last_name', e.target.value)
              }
              style={{ minWidth: 120 }}
            />
          ) : (
            u.last_name || u.lastName
          )}
        </td>
        <td>
          {isEditing ? (
            <input
              className="rapport-input"
              type="text"
              value={editForm.first_name}
              onChange={(e) =>
                handleEditChange('first_name', e.target.value)
              }
              style={{ minWidth: 120 }}
            />
          ) : (
            u.first_name || u.firstName
          )}
        </td>
        <td>
          {isEditing ? (
            <select
              className="rapport-input"
              value={editForm.bureau}
              onChange={(e) =>
                handleEditChange('bureau', e.target.value)
              }
            >
              <option value="">Sélectionner un bureau</option>
              {BUREAUX.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          ) : (
            u.bureau || '—'
          )}
        </td>
        <td>
          {isEditing ? (
            <select
              className="rapport-input"
              value={editForm.poste}
              onChange={(e) =>
                handleEditChange('poste', e.target.value)
              }
            >
              <option value="CGP">CGP</option>
              <option value="CPSocial">CPSocial</option>
              <option value="GP">GP</option>
            </select>
          ) : (
            u.poste || '—'
          )}
        </td>
        <td>
          {isEditing ? (
            <select
              className="rapport-input"
              value={editForm.role}
              onChange={(e) =>
                handleEditChange('role', e.target.value)
              }
            >
              <option value="conseiller">conseiller</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          ) : (
            u.role
          )}
        </td>
        <td>
          {u.created_at
            ? new Date(u.created_at).toLocaleDateString('fr-FR')
            : '—'}
        </td>
        <td>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
            }}
          >
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveEdit(u.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 9999,
                    border: '1px solid #16a34a',
                    backgroundColor: '#ffffff',
                    color: '#16a34a',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 9999,
                    border: '1px solid #9ca3af',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => startEdit(u)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 9999,
                  border: '1px solid #9ca3af',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Éditer
              </button>
            )}


            {/* Bouton "Supprimer" (désactiver) */}
            <button
              type="button"
              onClick={() => handleDeleteUser(u.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid #b91c1c',
                backgroundColor: '#ffffff',
                color: '#b91c1c',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Supprimer
            </button>
          </div>
        </td>
      </tr>
    );
  })}
</tbody>

            </table>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
