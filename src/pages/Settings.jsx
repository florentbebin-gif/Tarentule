import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SettingsNav from './SettingsNav';

// Couleurs par défaut
const DEFAULT_COLORS = {
  color1: '#2B3E37',
  color2: '#709B8B',
  color3: '#9FBDB2',
  color4: '#CFDED8',
  color5: '#788781',
  color6: '#CEC1B6',
  color7: '#F5F3F0',
  color8: '#D9D9D9',
  color9: '#7F7F7F',
  color10: '#000000',
};

const COLOR_FIELDS = [
  { key: 'color1', label: 'Couleur 1' },
  { key: 'color2', label: 'Couleur 2' },
  { key: 'color3', label: 'Couleur 3' },
  { key: 'color4', label: 'Couleur 4' },
  { key: 'color5', label: 'Couleur 5' },
  { key: 'color6', label: 'Couleur 6' },
  { key: 'color7', label: 'Couleur 7' },
  { key: 'color8', label: 'Couleur 8' },
  { key: 'color9', label: 'Couleur 9' },
  { key: 'color10', label: 'Couleur 10' },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('User');
  const [loading, setLoading] = useState(true);

  const [colors, setColors] = useState(DEFAULT_COLORS);       // valeurs “réelles”
  const [colorText, setColorText] = useState(DEFAULT_COLORS); // texte tapé par l’utilisateur
  const [savingColors, setSavingColors] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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

          // couleurs sauvegardées (si déjà présentes)
          const savedColors = meta.theme_colors || {};
          const merged = {
            color1: savedColors.color1 || DEFAULT_COLORS.color1,
            color2: savedColors.color2 || DEFAULT_COLORS.color2,
            color3: savedColors.color3 || DEFAULT_COLORS.color3,
            color4: savedColors.color4 || DEFAULT_COLORS.color4,
            color5: savedColors.color5 || DEFAULT_COLORS.color5,
            color6: savedColors.color6 || DEFAULT_COLORS.color6,
            color7: savedColors.color7 || DEFAULT_COLORS.color7,
            color8: savedColors.color8 || DEFAULT_COLORS.color8,
            color9: savedColors.color9 || DEFAULT_COLORS.color9,
            color10: savedColors.color10 || DEFAULT_COLORS.color10,
          };
          setColors(merged);
          setColorText(merged);

          // URL de la page de garde (si déjà enregistrée)
          if (meta.cover_slide_url) {
            setCoverUrl(meta.cover_slide_url);
          }
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- Gestion des couleurs ---------- */

  const handleColorChange = (key, value) => {
    // changement via palette → on met à jour la valeur réelle ET le texte
    setColors(prev => ({ ...prev, [key]: value }));
    setColorText(prev => ({ ...prev, [key]: value.toUpperCase() }));
    setSaveMessage('');
  };

  const handleColorTextChange = (key, value) => {
    // l’utilisateur tape dans le champ texte
    setColorText(prev => ({ ...prev, [key]: value }));
    setSaveMessage('');
  };

  const handleColorTextBlur = (key) => {
    const v = (colorText[key] || '').trim();
    const hex = v.startsWith('#') ? v : `#${v}`;

    // hex complet #RRGGBB
    const isValid = /^#[0-9a-fA-F]{6}$/.test(hex);

    if (isValid) {
      setColors(prev => ({ ...prev, [key]: hex }));
      setColorText(prev => ({ ...prev, [key]: hex.toUpperCase() }));
    } else {
      // invalide → on revient à la couleur réelle
      setColorText(prev => ({ ...prev, [key]: prev[key] || colors[key] || '' }));
    }
  };

  const handleSaveColors = async () => {
    try {
      setSavingColors(true);
      setSaveMessage('');

      const { error } = await supabase.auth.updateUser({
        data: {
          theme_colors: colors,
          ...(coverUrl ? { cover_slide_url: coverUrl } : {}),
        },
      });

      if (error) {
        console.error('Erreur sauvegarde couleurs :', error);
        setSaveMessage("Erreur lors de l'enregistrement.");
      } else {
        setSaveMessage('Code couleur enregistré.');
      }
    } catch (e) {
      console.error(e);
      setSaveMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSavingColors(false);
    }
  };

  /* ---------- Upload / suppression page de garde ---------- */

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaveMessage('');

    if (!file.type.startsWith('image/')) {
      setSaveMessage('Veuillez sélectionner une image (jpg ou png).');
      return;
    }

    // vérif dimensions
    const imageCheck = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    let dimensions;
    try {
      dimensions = await imageCheck;
    } catch {
      setSaveMessage("Impossible de lire l'image.");
      return;
    }

    if (dimensions.width < 1200 || dimensions.height < 700) {
      setSaveMessage("L'image doit faire au minimum 1200 × 700 pixels.");
      return;
    }

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const filePath = `${user.id}/page_de_garde.${ext}`;

      // upload dans le bucket covers
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Erreur upload :', uploadError);
        setSaveMessage(
          "Erreur lors de l'upload dans Supabase Storage : " +
          (uploadError.message || uploadError.error_description || '')
        );
        return;
      }

      const { data: publicData } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      const publicUrl = publicData.publicUrl;

      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          cover_slide_url: publicUrl,
          theme_colors: colors,
        },
      });

      if (metaError) {
        console.error('Erreur metadata :', metaError);
        setSaveMessage("Erreur lors de l'enregistrement dans les métadonnées.");
        return;
      }

      setCoverUrl(publicUrl);
      setSaveMessage('Page de garde enregistrée avec succès.');
    } catch (err) {
      console.error(err);
      setSaveMessage("Erreur lors de l'enregistrement de la page de garde.");
    }
  };

  const handleRemoveCover = async () => {
    if (!coverUrl) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          cover_slide_url: null,
        },
      });
      if (error) {
        console.error('Erreur suppression cover :', error);
        setSaveMessage("Erreur lors de la suppression de la page de garde.");
        return;
      }
      setCoverUrl('');
      setSaveMessage('Page de garde supprimée.');
    } catch (e) {
      console.error(e);
      setSaveMessage("Erreur lors de la suppression de la page de garde.");
    }
  };

  /* ---------- Rendu ---------- */

  if (loading) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <SettingsNav />
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <SettingsNav />
          <p>Aucun utilisateur connecté.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>

        {/* Nav en pilules */}
        <SettingsNav />

        {/* Contenu onglet Généraux */}
        <div
          style={{
            fontSize: 16,
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Infos utilisateur */}
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Utilisateur :</strong>{' '}
              <span>{user.email}</span>
            </div>
            <div>
              <strong>Statut :</strong>{' '}
              <span>{roleLabel}</span>
            </div>
          </div>

          {/* Choix du code couleur */}
          <div>
            <h3 style={{ marginBottom: 8 }}>Choix du code couleur de l’étude</h3>
            <p style={{ marginBottom: 12, fontSize: 14, color: '#555' }}>
              Ces couleurs seront utilisées dans les futures éditions PowerPoint de l’étude.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {COLOR_FIELDS.map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <span style={{ minWidth: 90, fontSize: 13 }}>{label}</span>

                  {/* Palette */}
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    style={{
                      width: 32,
                      height: 32,
                      border: 'none',
                      padding: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  />

                  {/* Saisie hexadécimale */}
                  <input
                    type="text"
                    value={colorText[key]}
                    onChange={(e) => handleColorTextChange(key, e.target.value)}
                    onBlur={() => handleColorTextBlur(key)}
                    style={{
                      width: 90,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                    placeholder="#000000"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="chip"
              onClick={handleSaveColors}
              disabled={savingColors}
              style={{ marginTop: 14 }}
            >
              {savingColors ? 'Enregistrement…' : 'Enregistrer le code couleur'}
            </button>
          </div>

          {/* Choix de la page de garde */}
          <div>
            <h3 style={{ marginBottom: 8 }}>Choix de la page de garde de l’étude</h3>
            <p style={{ marginBottom: 8, fontSize: 14, color: '#555' }}>
              Chargez une image (.jpg ou .png) d&apos;au moins 1200 × 700 pixels.
              Cette image sera utilisée comme page de garde dans les futures éditions PowerPoint de l’étude.
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleCoverFileChange}
            />

            <div style={{ marginTop: 8, fontSize: 13, color: '#444' }}>
              <strong>Page de garde sélectionnée :</strong>{' '}
              {coverUrl ? (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={coverUrl}
                    alt="Page de garde"
                    style={{
                      maxWidth: '260px',
                      borderRadius: 8,
                      border: '1px solid #ccc',
                    }}
                  />
                  <div style={{ fontSize: 12, marginTop: 4 }}>{coverUrl}</div>
                  <button
                    type="button"
                    className="chip"
                    onClick={handleRemoveCover}
                    style={{ marginTop: 8 }}
                  >
                    Supprimer la page de garde
                  </button>
                </div>
              ) : (
                'Aucune'
              )}
            </div>
          </div>

          {saveMessage && (
            <div style={{ fontSize: 13, color: '#2B3E37' }}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
