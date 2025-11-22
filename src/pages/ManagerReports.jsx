// src/pages/ManagerReports.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ManagerReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Non connecté.')
        setLoading(false)
        return
      }

      // Récupérer le profil pour connaître le rôle
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profile) {
        setError('Profil introuvable.')
        setLoading(false)
        return
      }

      if (profile.role !== 'manager' && profile.role !== 'admin') {
        setAuthorized(false)
        setLoading(false)
        return
      }

      setAuthorized(true)

      // Charger tous les rapports
      const { data: allReports, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (reportsError) {
        setError(reportsError.message)
        setLoading(false)
        return
      }

      setReports(allReports || [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <p>Chargement…</p>

  if (error) return <p className="error-text">{error}</p>

  if (!authorized)
    return (
      <p className="error-text">
        Accès refusé. Cette page est réservée aux managers.
      </p>
    )

  return (
    <div className="page manager">
      <h1>Rapports des conseillers</h1>
      {reports.length === 0 && <p>Aucun rapport pour le moment.</p>}

      <ul className="reports-list">
        {reports.map((r) => (
          <li key={r.id} className="report-item">
            <p>
              <strong>Période :</strong> {r.period}
            </p>
            <p>
              <strong>Score global :</strong> {r.global_score ?? '—'}
            </p>
            <p>
              <strong>Commentaire :</strong> {r.comment || '—'}
            </p>
            <p>
              <small>
                Créé le :{' '}
                {new Date(r.created_at).toLocaleString('fr-FR')}
              </small>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
