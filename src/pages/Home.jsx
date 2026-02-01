import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Home.css";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const FALLBACK_SOURCES = [
  { key: "bofip", name: "BOFiP", category: "Fiscal" },
  { key: "boss", name: "BOSS", category: "Social" },

function Home({ userRole }) {
  const navigate = useNavigate();
  const isManager = userRole === "manager" || userRole === "admin";
  const target = isManager ? "/manager" : "/rapport";
    const [feedState, setFeedState] = useState({
    loading: true,
    error: null,
    items: [],
    sources: [],
  });

  useEffect(() => {
    let isMounted = true;

    const loadFeed = async () => {
      setFeedState((prev) => ({ ...prev, loading: true, error: null }));

      const sourcesPromise = supabase
        .from("news_sources")
        .select("key,name,category")
        .in("key", ["bofip", "boss"])
        .eq("is_active", true);

      const itemsPromise = supabase
        .from("news_items")
        .select("title,url,summary,published_at,source_key,tags")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(12);

      const [sourcesResult, itemsResult] = await Promise.all([
        sourcesPromise,
        itemsPromise,
      ]);

      if (!isMounted) {
        return;
      }

      if (sourcesResult.error || itemsResult.error) {
        console.error("Erreur chargement fil d’actualité", {
          sources: sourcesResult.error,
          items: itemsResult.error,
        });
        setFeedState({
          loading: false,
          error: "Impossible de charger les actualités.",
          items: itemsResult.data || [],
          sources: sourcesResult.data || [],
        });
        return;
      }

      setFeedState({
        loading: false,
        error: null,
        items: itemsResult.data || [],
        sources: sourcesResult.data || [],
      });
    };

    loadFeed();

    return () => {
      isMounted = false;
    };
  }, []);

  const sourcesByKey = useMemo(() => {
    const map = new Map();
    const sources = feedState.sources.length
      ? feedState.sources
      : FALLBACK_SOURCES;
    sources.forEach((source) => {
      map.set(source.key, source);
    });
    return map;
  }, [feedState.sources]);

  const renderDate = (publishedAt) => {
    if (!publishedAt) {
      return "—";
    }
    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return DATE_FORMAT.format(date);
  };

  return (
    <div className="credit-panel">
      <div className="home-grid">
        {/* Colonne gauche */}
        <section className="section-card home-feed">
          <h2 className="section-title strong-title">Fil d’actualité</h2>

          <div className="home-feed-list">
            {feedState.loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="home-feed-item">
                    <div className="home-feed-date skeleton-line" />
                    <div className="home-feed-title skeleton-line" />
                    <div className="home-feed-description skeleton-line" />
                  </div>
                ))
              : null}

            {!feedState.loading && feedState.items.length === 0 ? (
              <div className="home-feed-empty">
                Aucune actualité pour le moment
              </div>
            ) : null}

            {!feedState.loading &&
              feedState.items.map((item) => {
                const source = sourcesByKey.get(item.source_key) || {};
                const summary =
                  item.summary && item.summary.length > 280
                    ? `${item.summary.slice(0, 280)}…`
                    : item.summary || "—";
                return (
                  <article
                    key={`${item.source_key}-${item.url}`}
                    className="home-feed-item"
                  >
                    <div className="home-feed-meta">
                      <span className="home-feed-date">
                        {renderDate(item.published_at)}
                      </span>
                      <span className="home-feed-badge">
                        {source.name || item.source_key}
                      </span>
                    </div>
                    <a
                      className="home-feed-title link-title"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.title}
                    </a>
                    <div className="home-feed-description">{summary}</div>
                  </article>
                );
              })}    
          </div>
            {feedState.error ? (
            <div className="home-feed-error">{feedState.error}</div>
          ) : null}
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

export default Home;
