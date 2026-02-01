import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Home.css";

export default function Home({ userRole }) {
  const navigate = useNavigate();
  const isManager = userRole === "manager" || userRole === "admin";
  const target = isManager ? "/manager" : "/rapport";
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );
  const fallbackSources = useMemo(
    () => [
      { key: "bofip", name: "BOFiP", category: "Fiscal" },
      { key: "boss", name: "BOSS", category: "Social" },
    ],
    []
  );
  const filterOptions = useMemo(
    () => [
      { key: "all", label: "Tout (alterné)" },
      { key: "bofip", label: "BOFiP" },
      { key: "boss", label: "BOSS" },
    ],
    []
  );
  const [newsFilter, setNewsFilter] = useState(() => {
    if (typeof window === "undefined") {
      return "all";
    }
    return window.localStorage.getItem("home.newsFilter") || "all";
  });
  const [feedState, setFeedState] = useState({
    loading: true,
    error: null,
    bofipItems: [],
    bossItems: [],
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

      const bofipPromise = supabase
        .from("news_items")
        .select("title,url,summary,published_at,source_key,tags")
        .eq("source_key", "bofip")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(12);

      const bossPromise = supabase
        .from("news_items")
        .select("title,url,summary,published_at,source_key,tags")
        .eq("source_key", "boss")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(12);

      try {
        const [sourcesResult, bofipResult, bossResult] = await Promise.all([
          sourcesPromise,
          bofipPromise,
          bossPromise,
        ]);

        if (!isMounted) {
          return;
        }

        if (sourcesResult.error || bofipResult.error || bossResult.error) {
          console.error("Erreur chargement fil d’actualité", {
            sources: sourcesResult.error,
            bofip: bofipResult.error,
            boss: bossResult.error,
          });
          setFeedState({
            loading: false,
            error: "Impossible de charger les actualités.",
            bofipItems: bofipResult.data || [],
            bossItems: bossResult.data || [],
            sources: sourcesResult.data || [],
          });
          return;
        }

        setFeedState({
          loading: false,
          error: null,
          bofipItems: bofipResult.data || [],
          bossItems: bossResult.data || [],
          sources: sourcesResult.data || [],
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error("Erreur chargement fil d’actualité", error);
        setFeedState((prev) => ({
          ...prev,
          loading: false,
          error: "Impossible de charger les actualités.",
        }));
      }
    };

    loadFeed();

    return () => {
      isMounted = false;
    };
  }, []);

    useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("home.newsFilter", newsFilter);
  }, [newsFilter]);

  const sourcesByKey = useMemo(() => {
    const map = new Map();
    const sources = feedState.sources.length
      ? feedState.sources
      : fallbackSources;
    sources.forEach((source) => {
      map.set(source.key, source);
    });
    return map;
  }, [feedState.sources, fallbackSources]);

  const visibleItems = useMemo(() => {
    if (newsFilter === "bofip") {
      return feedState.bofipItems;
    }
    if (newsFilter === "boss") {
      return feedState.bossItems;
    }
    const maxLen = Math.max(
      feedState.bofipItems.length,
      feedState.bossItems.length
    );
    const interleaved = [];
    for (let index = 0; index < maxLen; index += 1) {
      if (feedState.bofipItems[index]) {
        interleaved.push(feedState.bofipItems[index]);
      }
      if (feedState.bossItems[index]) {
        interleaved.push(feedState.bossItems[index]);
      }
    }
    return interleaved.slice(0, 12);
  }, [feedState.bofipItems, feedState.bossItems, newsFilter]);

  const emptyMessage = useMemo(() => {
    if (newsFilter === "bofip") {
      return "Aucune actualité BOFiP pour le moment";
    }
    if (newsFilter === "boss") {
      return "Aucune actualité BOSS pour le moment";
    }
    return "Aucune actualité pour le moment";
  }, [newsFilter]);

  const renderDate = (publishedAt) => {
    if (!publishedAt) {
      return "—";
    }
    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return dateFormatter.format(date);
  };

  return (
    <div className="credit-panel">
      <div className="home-grid">
        {/* Colonne gauche */}
        <section className="section-card home-feed">
          <h2 className="section-title strong-title">Fil d’actualité</h2>
           <div className="manager-filters home-feed-controls">
            <div className="manager-filters-label">Sources :</div>
            <div className="manager-filters-list">
              {filterOptions.map((option) => (
                <label
                  key={option.key}
                  className={`manager-filter-chip home-feed-filter-chip${
                    newsFilter === option.key ? " is-active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="home-news-filter"
                    value={option.key}
                    checked={newsFilter === option.key}
                    onChange={() => setNewsFilter(option.key)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="home-feed-list">
            {feedState.loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="home-feed-item">
                    <div className="home-feed-date skeleton-line" />
                    <div className="home-feed-row">
                      <div className="home-feed-badge skeleton-line" />
                      <div className="home-feed-title skeleton-line" />
                    </div>
                    <div className="home-feed-description skeleton-line" />
                  </div>
                ))
              : null}

            {!feedState.loading && visibleItems.length === 0 ? (
              <div className="home-feed-empty">
                {emptyMessage}
              </div>
            ) : null}

            {!feedState.loading &&
              visibleItems.map((item) => {
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
                    <div className="home-feed-date">
                      {renderDate(item.published_at)}
                    </div>
                    <div className="home-feed-row">
                      <span className="home-feed-badge">
                        {source.name || item.source_key}
                      </span>
                      <a
                        className="home-feed-title link-title"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.title}
                      </a>
                    </div>
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
