// src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function Settings() {
  const [user, setUser] = useState(null);       // Auth
  const [profile, setProfile] = useState(null); // Table profiles
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // -------------------------------
  // Charger user + profil
  // -------------------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        // 1) Utilisateur Auth
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) {
          if (mounted) {
            setError("Erreur lors du chargement de l'utilisateur.");
            setLoading(false);
          }
          return;
        }

        const u = data?.user;
        if (!u) {
          if (mounted) {
            setError('Aucun utilisateur connecté.');
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;
        setUser(u);

        // 2) Profil
        const { data: p, error: pErr } = await supabase
          .from('profiles')
          .select('first_name, last_name, bureau, role')
          .eq('id', u.id)
          .maybeSingle();

        if (pErr) {
          if (mounted) setError("Erreur lors du chargement du profil.");
        } else if (mounted) {
          setProfile(p || null);
        }
      } catch (e) {
        if (mounted) setError("Erreur inattendue lors du chargement.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // -------------------------------
  // Helpers
  // -------------------------------
  const computeRoleLabel = () => {
    const raw = profile?.role || user?.user_metadata?.role || 'user';
    const r = String(raw).toLowerCase();

    if (r === 'admin') return 'Admin';
    if (r === 'manager' || r === 'managere' || r === 'n+1') return 'Manager';
    return 'User';
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-card">
          <div className="section-title strong-title">Paramètres</div>
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-page">
        <div className="settings-card">
          <div className="section-title strong-title">Paramètres</div>
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="settings-page">
        <div className="settings-card">
          <div className="section-title strong-title">Paramètres</div>
          <p>Aucun utilisateur connecté.</p>
        </div>
      </div>
    );
  }

  const nom = profile?.last_name || user.user_metadata?.last_name || '—';
  const prenom = profile?.first_name || user.user_metadata?.first_name || '—';
  const agence = profile?.bureau || user.user_metadata?.bureau || '—';
  const email = user.email || '—';
  const statut = computeRoleLabel();



  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="section-title strong-title">Paramètres</div>

        <p style={{ marginTop: 4, marginBottom: 16, color: '#555' }}>
          Informations de votre compte Tarentule.
        </p>

        <div className="settings-grid">
          <div className="settings-field">
            <div className="settings-label">Nom</div>
            <div className="settings-value">{nom}</div>
          </div>

          <div className="settings-field">
            <div className="settings-label">Prénom</div>
            <div className="settings-value">{prenom}</div>
          </div>

          <div className="settings-field">
            <div className="settings-label">Email</div>
            <div className="settings-value">{email}</div>
          </div>

          <div className="settings-field">
            <div className="settings-label">Agence</div>
            <div className="settings-value">{agence}</div>
          </div>

          <div className="settings-field">
            <div className="settings-label">Statut</div>
            <div className="settings-value">{statut}</div>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: '#777' }}>
          Pour modifier des informations personnelles (agence, statut, etc.),
          vous pouvez contacter votre manager.
        </p>

      </div>
    </div>
  );
}
