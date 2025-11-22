import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SettingsNav from './SettingsNav';


export default function Settings() {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('User');
  const [loading, setLoading] = useState(true);


  const [coverUrl, setCoverUrl] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erreur chargement user :', error);
          if (mounted) setLoading(false);
          return;
        }

        const u = data?.user || null;
        if (!mounted) return;

        setUser(u);

        if (u) {
          const meta = u.user_metadata || {};

          // rôle Admin / User
          const isAdmin =
            (typeof meta.role === 'string' &&
              meta.role.toLowerCase() === 'admin') ||
            meta.is_admin === true;

          setRoleLabel(isAdmin ? 'Admin' : 'User');

}
