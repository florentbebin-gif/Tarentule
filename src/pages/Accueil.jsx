import React from 'react';
import { useNavigate } from 'react-router-dom';

const IconReport = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M7 4h7l4 4v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 4v4h4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 12h7M8.5 15.5h5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const feedItems = [
  {
    title: 'Nouvelle campagne EAE 2024',
    date: '12 septembre 2024',
    tag: 'Organisation',
    teaser:
      'Planning consolidé et rappels automatiques pour sécuriser les échéances clés.',
  },
  {
    title: 'Focus objectifs trimestriels',
    date: '09 septembre 2024',
    tag: 'Performance',
    teaser:
      'Mise à jour des priorités et jalons pour un pilotage plus fluide des équipes.',
  },
  {
    title: 'Nouvelle grille de synthèse',
    date: '05 septembre 2024',
    tag: 'Qualité',
    teaser:
      'Une lecture rapide des points clés et des actions à fort impact.',
  },
  {
    title: 'Atelier feedback 360°',
    date: '02 septembre 2024',
    tag: 'Culture',
    teaser:
      'Un format court pour recueillir des retours constructifs et actionnables.',
  },
  {
    title: 'Kit de préparation entretien',
    date: '29 août 2024',
    tag: 'Ressources',
    teaser:
      'Des checklists et guides pour structurer l’entretien en amont.',
  },
  {
    title: 'Point mobilité interne',
    date: '26 août 2024',
    tag: 'RH',
    teaser:
      'Synthèse des opportunités internes et des besoins identifiés.',
  },
  {
    title: 'Évolutions du référentiel',
    date: '22 août 2024',
    tag: 'Process',
    teaser:
      'Clarifications sur les compétences attendues et la progression cible.',
  },
  {
    title: 'Bilan mid-year',
    date: '19 août 2024',
    tag: 'Suivi',
    teaser:
      'Des insights rapides pour ajuster la trajectoire avant la fin d’année.',
  },
];

export default function Accueil() {
  const navigate = useNavigate();

  return (
    <main className="post-login-page">
      <div className="post-login-header">
        <div>
          <p className="post-login-kicker">Bienvenue</p>
          <h1 className="post-login-title">Accueil après connexion</h1>
        </div>
        <p className="post-login-subtitle">
          Suivez l’actualité interne et accédez rapidement à votre rapport.
        </p>
      </div>

      <div className="post-login-grid">
        <section className="post-login-card">
          <div className="post-login-section-title">
            <h2>Fil d’actualité</h2>
            <span className="post-login-section-badge">Dernières mises à jour</span>
          </div>
          {/* Placeholder data: remplacez feedItems par un hook ou des props. */}
          <div className="post-login-feed">
            {feedItems.map((item) => (
              <article className="feed-card" key={item.title}>
                <div className="feed-card-meta">
                  <span className="feed-tag">{item.tag}</span>
                  <span className="feed-date">{item.date}</span>
                </div>
                <h3 className="feed-title">{item.title}</h3>
                <p className="feed-teaser">{item.teaser}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="post-login-card report-card">
          <div className="report-card-head">
            <div className="report-icon">
              <IconReport className="report-icon-svg" />
            </div>
            <div>
              <h2>Accéder à mon rapport</h2>
              <p>Synthèse, actions en cours, points clés.</p>
            </div>
          </div>
          <button
            type="button"
            className="report-action"
            onClick={() => navigate('/rapport')}
          >
            Accéder à mon rapport
          </button>
        </aside>
      </div>
    </main>
  );
}
