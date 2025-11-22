import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SettingsNav from '../SettingsNav';
import './SettingsImpots.css';

// ----------------------
// Valeurs par défaut
// ----------------------
// Barème 2025 (revenus 2024) + retraitements : Word + brochure IR 2025
// Barème 2024 (revenus 2023) : barème officiel 2024
// PFU, CEHR, CDHR, IS : sources officielles.
const DEFAULT_TAX_SETTINGS = {
  incomeTax: {
    currentYearLabel: '2025 (revenus 2024)',
    previousYearLabel: '2024 (revenus 2023)',
    scaleCurrent: [
      { from: 0, to: 11497, rate: 0, deduction: 0 },
      { from: 11498, to: 29315, rate: 11, deduction: 1264.78 },
      { from: 29316, to: 83823, rate: 30, deduction: 6834.63 },
      { from: 83824, to: 180294, rate: 41, deduction: 16055.16 },
      { from: 180295, to: null, rate: 45, deduction: 23266.92 },
    ],
    scalePrevious: [
      { from: 0, to: 11294, rate: 0, deduction: 0 },
      { from: 11295, to: 28797, rate: 11, deduction: 0 },
      { from: 28798, to: 82341, rate: 30, deduction: 0 },
      { from: 82342, to: 177106, rate: 41, deduction: 0 },
      { from: 177107, to: null, rate: 45, deduction: 0 },
    ],
    quotientFamily: {
      plafondPartSup: 1791,
      plafondParentIsoléDeuxPremièresParts: 4224,
    },
    decote: {
      triggerSingle: 1964,
      triggerCouple: 3248,
      amountSingle: 889,
      amountCouple: 1470,
      ratePercent: 45.25,
    },
    abat10: {
      current: { plafond: 14426, plancher: 504 },
      previous: { plafond: 14171, plancher: 495 },
      retireesCurrent: { plafond: 4399, plancher: 450 },
      retireesPrevious: { plafond: 4321, plancher: 442 },
    },
  },
  pfu: {
    rateIR: 12.8,
    rateSocial: 17.2,
    rateTotal: 30.0,
  },
  cehr: {
    single: [
      { from: 250000, to: 500000, rate: 3 },
      { from: 500000, to: null, rate: 4 },
    ],
    couple: [
      { from: 500000, to: 1000000, rate: 3 },
      { from: 1000000, to: null, rate: 4 },
    ],
  },
  cdhr: {
    minEffectiveRate: 20,
    thresholdSingle: 250000,
    thresholdCouple: 500000,
  },
  corporateTax: {
    normalRate: 25,
    reducedRate: 15,
    reducedThreshold: 42500,
  },
};

function numberOrEmpty(v) {
  return v === null || v === undefined || Number.isNaN(v) ? '' : String(v);
}

export default function SettingsImpots() {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('User');
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_TAX_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const isAdmin =
    user &&
    ((typeof user?.user_metadata?.role === 'string' &&
      user.user_metadata.role.toLowerCase() === 'admin') ||
      user?.user_metadata?.is_admin === true);

  // Chargement user + paramètres depuis la table tax_settings
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error('Erreur user:', userErr);
          if (mounted) setLoading(false);
          return;
        }

        const u = userData?.user || null;
        if (!mounted) return;

        setUser(u);
        if (u) {
          const meta = u.user_metadata || {};
          const admin =
            (typeof meta.role === 'string' &&
              meta.role.toLowerCase() === 'admin') ||
            meta.is_admin === true;
          setRoleLabel(admin ? 'Admin' : 'User');
        }

        // Charge la ligne id=1 si elle existe
        const { data: rows, error: taxErr } = await supabase
          .from('tax_settings')
          .select('data')
          .eq('id', 1);

        if (!taxErr && rows && rows.length > 0 && rows[0].data) {
          setSettings((prev) => ({
            ...prev,
            ...rows[0].data,
          }));
        } else if (taxErr && taxErr.code !== 'PGRST116') {
          console.error('Erreur chargement tax_settings :', taxErr);
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!isAdmin) return;
    try {
      setSaving(true);
      setMessage('');

      const { error } = await supabase
        .from('tax_settings')
        .upsert({ id: 1, data: settings });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setMessage('Paramètres impôts enregistrés.');
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Helpers de MAJ
  const updateIncomeScale = (which, index, key, value) => {
    setSettings((prev) => ({
      ...prev,
      incomeTax: {
        ...prev.incomeTax,
        [which]: prev.incomeTax[which].map((row, i) =>
          i === index ? { ...row, [key]: value } : row
        ),
      },
    }));
    setMessage('');
  };

  const updateField = (path, value) => {
    // path du style ['incomeTax','decote','triggerSingle']
    setSettings((prev) => {
      const clone = structuredClone(prev);
      let obj = clone;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres — Impôts</div>
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
          <div className="section-title">Paramètres — Impôts</div>
          <SettingsNav />
          <p>Aucun utilisateur connecté.</p>
        </div>
      </div>
    );
  }

  const { incomeTax, pfu, cehr, cdhr, corporateTax } = settings;

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres — Impôts</div>

        <SettingsNav />

        <div
          style={{
            fontSize: 15,
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Bandeau info */}
          <div className="tax-user-banner">
            <strong>Utilisateur :</strong> {user.email} —{' '}
            <strong>Statut :</strong> {roleLabel}
          </div>


          {/* 1. Barème impôt sur le revenu */}
          <section>
            <h3>Barème de l’impôt sur le revenu</h3>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
              Barème progressif par tranches (taux et retraitement) pour le
              barème actuel et celui de l’année précédente.
            </p>

             <div className="income-tax-columns">
    {/* Barème 2025 / revenus 2024 */}
    <div className="income-tax-col">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        Barème {incomeTax.currentYearLabel}
      </div>
      <table className="settings-table">
        <thead>
          <tr>
            <th>De</th>
            <th>À</th>
            <th>Taux&nbsp;%</th>
            <th>Retraitement&nbsp;€</th>
          </tr>
        </thead>
        <tbody>
          {incomeTax.scaleCurrent.map((row, idx) => (
            <tr key={idx}>
              <td>
                <input
                  type="number"
                  value={numberOrEmpty(row.from)}
                  onChange={(e) =>
                    updateIncomeScale(
                      'scaleCurrent',
                      idx,
                      'from',
                      e.target.value === ''
                        ? null
                        : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={numberOrEmpty(row.to)}
                  onChange={(e) =>
                    updateIncomeScale(
                      'scaleCurrent',
                      idx,
                      'to',
                      e.target.value === ''
                        ? null
                        : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={numberOrEmpty(row.rate)}
                  onChange={(e) =>
                    updateIncomeScale(
                      'scaleCurrent',
                      idx,
                      'rate',
                      e.target.value === ''
                        ? null
                        : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={numberOrEmpty(row.deduction)}
                  onChange={(e) =>
                    updateIncomeScale(
                      'scaleCurrent',
                      idx,
                      'deduction',
                      e.target.value === ''
                        ? null
                        : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Barème 2024 / revenus 2023 */}
    <div className="income-tax-col income-tax-col-right">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        Barème {incomeTax.previousYearLabel}
      </div>
      <table className="settings-table">
        <thead>
          <tr>
            <th>De</th>
            <th>À</th>
            <th>Taux&nbsp;%</th>
            <th>Retraitement&nbsp;€</th>
          </tr>
        </thead>
        <tbody>
          {incomeTax.scalePrevious.map((row, idx) => (
            <tr key={idx}>
              <td>
                <input
                  type="number"
                  value={numberOrEmpty(row.from)}
                  onChange={(e) =>
                    updateIncomeScale(
                      'scalePrevious',
                      idx,
                      'from',
                      e.target.value === ''
                        ? null
                        : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={numberOrEmpty(row.to)}
                  onChange={(e) =>
                    updateIncomeScale(
                      'scalePrevious',
                      idx,
                      'to',
                      e.target.value === ''
                        ? null
                        : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={numberOrEmpty(row.rate)}
                  onChange={(e) =>
                    updateIncomeScale(
                      'scalePrevious',
                      idx,
                      'rate',
                      e.target.value === ''
                        ? null
                        : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={numberOrEmpty(row.deduction)}
                  onChange={(e) =>
                    updateIncomeScale(
                      'scalePrevious',
                      idx,
                      'deduction',
                      e.target.value === ''
                        ? null
                        : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

          </section>

          {/* 2. PFU */}
          <section>
  <h3>PFU (flat tax)</h3>

  <div className="tax-two-cols">
    {/* Colonne 2025 (revenus 2024) */}
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.currentYearLabel}
      </div>
      <div className="settings-field-row">
        <label>Part impôt sur le revenu</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(pfu.rateIR)}
          onChange={(e) =>
            updateField(
              ['pfu', 'rateIR'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Prélèvements sociaux</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(pfu.rateSocial)}
          onChange={(e) =>
            updateField(
              ['pfu', 'rateSocial'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Taux global PFU</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(pfu.rateTotal)}
          onChange={(e) =>
            updateField(
              ['pfu', 'rateTotal'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
    </div>

    {/* Colonne 2024 (revenus 2023) – mêmes données pour l’instant */}
    <div className="tax-two-cols-right">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.previousYearLabel}
      </div>
      <div className="settings-field-row">
        <label>Part impôt sur le revenu</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(pfu.rateIR)}
          onChange={(e) =>
            updateField(
              ['pfu', 'rateIR'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Prélèvements sociaux</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(pfu.rateSocial)}
          onChange={(e) =>
            updateField(
              ['pfu', 'rateSocial'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Taux global PFU</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(pfu.rateTotal)}
          onChange={(e) =>
            updateField(
              ['pfu', 'rateTotal'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
    </div>
  </div>
</section>


          {/* 3. CEHR / CDHR */}
          <section>
  <h3>CEHR / CDHR</h3>
  <p style={{ fontSize: 13, color: '#555' }}>
    Contribution exceptionnelle sur les hauts revenus (CEHR) et
    contribution différentielle (CDHR).
  </p>

  <div className="tax-two-cols">
    {/* Colonne 2025 */}
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.currentYearLabel}
      </div>

      <strong>CEHR – personne seule</strong>
      {cehr.single.map((row, idx) => (
        <div className="settings-field-row" key={`cehrS_2025_${idx}`}>
          <label>
            De {numberOrEmpty(row.from)} € à{' '}
            {row.to ? `${row.to} €` : 'plus'}
          </label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(row.rate)}
            onChange={(e) =>
              updateField(
                ['cehr', 'single', idx, 'rate'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
      ))}

      <strong>CEHR – couple</strong>
      {cehr.couple.map((row, idx) => (
        <div className="settings-field-row" key={`cehrC_2025_${idx}`}>
          <label>
            De {numberOrEmpty(row.from)} € à{' '}
            {row.to ? `${row.to} €` : 'plus'}
          </label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(row.rate)}
            onChange={(e) =>
              updateField(
                ['cehr', 'couple', idx, 'rate'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
      ))}

      <strong>CDHR (taux minimal)</strong>
      <div className="settings-field-row">
        <label>Taux effectif minimal</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(cdhr.minEffectiveRate)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'minEffectiveRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil RFR personne seule</label>
        <input
          type="number"
          value={numberOrEmpty(cdhr.thresholdSingle)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'thresholdSingle'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil RFR couple</label>
        <input
          type="number"
          value={numberOrEmpty(cdhr.thresholdCouple)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'thresholdCouple'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
    </div>

    {/* Colonne 2024 – mêmes paramètres pour l’instant */}
    <div className="tax-two-cols-right">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.previousYearLabel}
      </div>

      <strong>CEHR – personne seule</strong>
      {cehr.single.map((row, idx) => (
        <div className="settings-field-row" key={`cehrS_2024_${idx}`}>
          <label>
            De {numberOrEmpty(row.from)} € à{' '}
            {row.to ? `${row.to} €` : 'plus'}
          </label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(row.rate)}
            onChange={(e) =>
              updateField(
                ['cehr', 'single', idx, 'rate'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
      ))}

      <strong>CEHR – couple</strong>
      {cehr.couple.map((row, idx) => (
        <div className="settings-field-row" key={`cehrC_2024_${idx}`}>
          <label>
            De {numberOrEmpty(row.from)} € à{' '}
            {row.to ? `${row.to} €` : 'plus'}
          </label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(row.rate)}
            onChange={(e) =>
              updateField(
                ['cehr', 'couple', idx, 'rate'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
      ))}

      <strong>CDHR (taux minimal)</strong>
      <div className="settings-field-row">
        <label>Taux effectif minimal</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(cdhr.minEffectiveRate)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'minEffectiveRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil RFR personne seule</label>
        <input
          type="number"
          value={numberOrEmpty(cdhr.thresholdSingle)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'thresholdSingle'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil RFR couple</label>
        <input
          type="number"
          value={numberOrEmpty(cdhr.thresholdCouple)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'thresholdCouple'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
    </div>
  </div>
</section>


          {/* 4. Impôt sur les sociétés */}
          <section>
  <h3>Impôt sur les sociétés</h3>

  <div className="tax-two-cols">
    {/* 2025 */}
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.currentYearLabel}
      </div>
      <div className="settings-field-row">
        <label>Taux normal IS</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(corporateTax.normalRate)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'normalRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Taux réduit IS</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(corporateTax.reducedRate)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'reducedRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil de bénéfice au taux réduit</label>
        <input
          type="number"
          value={numberOrEmpty(corporateTax.reducedThreshold)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'reducedThreshold'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
    </div>

    {/* 2024 – mêmes valeurs aujourd’hui */}
    <div className="tax-two-cols-right">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.previousYearLabel}
      </div>
      <div className="settings-field-row">
        <label>Taux normal IS</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(corporateTax.normalRate)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'normalRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Taux réduit IS</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(corporateTax.reducedRate)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'reducedRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil de bénéfice au taux réduit</label>
        <input
          type="number"
          value={numberOrEmpty(corporateTax.reducedThreshold)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'reducedThreshold'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
    </div>
  </div>
</section>

          {/* Bouton Enregistrer */}
          {isAdmin && (
            <button
              type="button"
              className="chip"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? 'Enregistrement…'
                : 'Enregistrer les paramètres impôts'}
            </button>
          )}

          {message && (
            <div style={{ fontSize: 13, marginTop: 8 }}>{message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
