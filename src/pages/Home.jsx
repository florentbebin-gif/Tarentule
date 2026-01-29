import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const feedItems = [
  {
    date: "12 sept. 2024",
    title: "Actualité marché",
    description: "Tendances macro et opportunités à surveiller.",
  },
  {
    date: "10 sept. 2024",
    title: "Retraite",
    description: "Points clés sur les dernières évolutions réglementaires.",
  },
  {
    date: "08 sept. 2024",
    title: "Prévoyance",
    description: "Mises à jour produits et garanties prioritaires.",
  },
  {
    date: "05 sept. 2024",
    title: "Assurance emprunteur",
    description: "Éclairage sur les nouvelles pratiques de délégation.",
  },
  {
    date: "02 sept. 2024",
    title: "Épargne",
    description: "Focus sur les stratégies court terme premium.",
  },
];

export default function Home({ userRole }) {
  const navigate = useNavigate();
  const isManager = userRole === "manager" || userRole === "admin";
  const target = isManager ? "/manager" : "/rapport";

  return (
    <div className="credit-panel">
      <div className="home-grid">
        {/* Colonne gauche */}
        <section className="section-card home-feed">
          <h2 className="section-title strong-title">Fil d’actualité</h2>

          <div className="home-feed-list">
            {feedItems.map((item) => (
              <div key={`${item.date}-${item.title}`} className="home-feed-item">
                <div className="home-feed-date">{item.date}</div>
                <div className="home-feed-title">{item.title}</div>
                <div className="home-feed-description">{item.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Colonne droite */}
        <section className="section-card home-quick">
          <h2 className="section-title strong-title">Accès rapide</h2>

          <button
            type="button"
            className="btn home-cta"
            onClick={() => navigate(target)}
          >
            Accéder à mon rapport
          </button>

          <div className="home-cta-note">
            {/* Placeholder : tu pourras mettre ici une phrase ou un sous-texte */}
          </div>
        </section>
      </div>
    </div>
  );
}
