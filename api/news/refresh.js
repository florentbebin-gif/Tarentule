const { createClient } = require("@supabase/supabase-js");
const { XMLParser } = require("fast-xml-parser");

const SOURCE_FALLBACKS = {
  bofip:
    "https://bofip.impots.gouv.fr/bofip/ext/rss.xml?series=IR:IR-CHAMP:IR-BASE:IR-LIQ:IR-RICI:IR-DECLA:IR-PAS:IR-PAIE:IR-PROCD:IR-CESS:IR-DOMIC:IR-CHR:RSA:RSA-CHAMP:RSA-GEO:RSA-BASE:RSA-PENS:RSA-ES:RSA-GER:RPPM:RPPM-PVBMC:RPPM-RCM:RPPM-PVBMI:RFPI:RFPI-CHAMP:RFPI-BASE:RFPI-DECLA:RFPI-SPEC:RFPI-PROCD:RFPI-CTRL:RFPI-PVI:RFPI-PVINR:RFPI-SPI:RFPI-TDC:RFPI-TPVIE:BA:BA-CHAMP:BA-REG:BA-BASE:BA-LIQ:BA-RICI:BA-DECLA:BA-PROCD:BA-SECT:BA-CESS:BNC:BNC-CHAMP:BNC-BASE:BNC-RICI:BNC-DECLA:BNC-PROCD:BNC-SECT:BNC-CESS:BIC:BIC-CHAMP:BIC-BASE:BIC-PDSTK:BIC-CHG:BIC-PVMV:BIC-AMT:BIC-PROV:BIC-DEF:BIC-RICI:BIC-DECLA:BIC-PROCD:BIC-CESS:BIC-PTP:IS:IS-CHAMP:IS-BASE:IS-DEF:IS-LIQ:IS-RICI:IS-DECLA:IS-AUT:IS-PROCD:IS-GEO:IS-CESS:IS-FUS:IS-GPE:PAT:PAT-IFI:PAT-ISF:PAT-TPC:PAT-CAP&maxR=25&maxJ=14",
  boss: "https://boss.gouv.fr/portail/fil-rss-boss-rescrit/pagecontent/flux-actualites.rss",
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

const FISCAL_KEYWORDS = ["IR", "IFI", "PFU", "RSA", "BNC", "BIC", "IS"];
const SOCIAL_KEYWORDS = [
  "cotisations",
  "urssaf",
  "exonération",
  "prévoyance",
  "mutuelle",
  "retraite",
];

function normalizeArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(input) {
  if (!input) {
    return "";
  }
  const noTags = input.replace(/<[^>]+>/g, " ");
  return decodeEntities(noTags).replace(/\s+/g, " ").trim();
}

function extractText(value) {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    if (typeof value["#text"] === "string") {
      return value["#text"];
    }
    if (typeof value.__cdata === "string") {
      return value.__cdata;
    }
    if (typeof value.text === "string") {
      return value.text;
    }
  }
  return "";
}

function extractLink(entry) {
  if (!entry) {
    return "";
  }
  if (typeof entry.link === "string") {
    return entry.link;
  }
  if (entry.link && typeof entry.link["@_href"] === "string") {
    return entry.link["@_href"];
  }
  if (Array.isArray(entry.link)) {
    const href = entry.link.find((item) => item && item["@_href"]);
    return href ? href["@_href"] : "";
  }
  return "";
}

function parseDate(value) {
  if (!value) {
    return null;
  }
    if (value instanceof Date) {
    const date = new Date(value.getTime());
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === "object") {
    const extracted = extractText(value);
    if (!extracted) {
      return null;
    }
    return parseDate(extracted);
  }
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function buildTags(text) {
  const tags = new Set();
  const upper = text.toUpperCase();
  const lower = text.toLowerCase();

  if (FISCAL_KEYWORDS.some((keyword) => upper.includes(keyword))) {
    tags.add("fiscal");
  }

  if (SOCIAL_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    tags.add("social");
  }

  return Array.from(tags);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {
      "User-Agent": "TarentuleNewsBot/1.0 (+https://<ton domaine>)",
      Accept:
        "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
      "Cache-Control": "no-cache",
    };
    const response = await fetch(url, { signal: controller.signal, headers });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
function isRetryableFetchError(error) {
  if (!error) {
    return false;
  }
  if (error.name === "AbortError") {
    return true;
  }
  return error instanceof TypeError && /fetch failed/i.test(error.message || "");
}

function buildCauseDetails(cause) {
  if (!cause || typeof cause !== "object") {
    return cause;
  }
  return {
    code: cause.code,
    errno: cause.errno,
    address: cause.address,
    port: cause.port,
    syscall: cause.syscall,
  };
}

async function fetchWithRetry(url, { timeoutMs = 20000, retries = 3 } = {}) {
  const delays = [500, 1500, 3000];
  const attempts = Math.max(1, retries);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchWithTimeout(url, timeoutMs);
    } catch (error) {
      console.error("[news.refresh] fetch failed", url, {
        name: error?.name,
        message: error?.message,
        cause: buildCauseDetails(error?.cause),
      });
      const shouldRetry = isRetryableFetchError(error) && attempt < attempts;
      if (!shouldRetry) {
        throw error;
      }
      const delay = delays[attempt - 1] ?? delays[delays.length - 1];
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Fetch retries exhausted");
}

function extractItems(parsed) {
  if (parsed?.rss?.channel?.item) {
    return normalizeArray(parsed.rss.channel.item);
  }
  if (parsed?.feed?.entry) {
    return normalizeArray(parsed.feed.entry);
  }
  if (parsed?.channel?.item) {
    return normalizeArray(parsed.channel.item);
  }
    if (parsed?.["rdf:RDF"]?.item) {
    return normalizeArray(parsed["rdf:RDF"].item);
  }
  if (parsed?.RDF?.item) {
    return normalizeArray(parsed.RDF.item);
  }
  return [];
}

async function loadExistingUrls(supabase, urls) {
  if (!urls.length) {
    return new Set();
  }
  const { data, error } = await supabase
    .from("news_items")
    .select("url")
    .in("url", urls);

  if (error) {
    throw error;
  }

  return new Set((data || []).map((row) => row.url));
}

async function upsertItems(supabase, items) {
  if (!items.length) {
    return { inserted: 0, updated: 0 };
  }

  const urls = items.map((item) => item.url).filter(Boolean);
  const existingUrls = await loadExistingUrls(supabase, urls);

  const inserted = items.filter((item) => item.url && !existingUrls.has(item.url)).length;
  const updated = items.filter((item) => item.url && existingUrls.has(item.url)).length;

  const { error } = await supabase
    .from("news_items")
    .upsert(items, { onConflict: "url" });

  if (error) {
    throw error;
  }

  return { inserted, updated };
}

async function loadSources(supabase) {
  const { data, error } = await supabase
    .from("news_sources")
    .select("key,name,category,type,url,is_active,weight")
    .in("key", ["bofip", "boss"])
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return data || [];
}

async function processSource(supabase, source) {
  const url = source.url || SOURCE_FALLBACKS[source.key];
  if (!url) {
    throw new Error("URL RSS manquante");
  }

  const bossFallbacks = [
    "https://boss.gouv.fr/portail/fil-rss/pagecontent/flux-actualites.rss",
    "http://boss.gouv.fr/portail/fil-rss/pagecontent/flux-actualites.rss",
    "https://r.jina.ai/http://boss.gouv.fr/portail/fil-rss/pagecontent/flux-actualites.rss",
  ];

  const candidateUrls =
    source.key === "boss"
      ? [url, ...bossFallbacks].filter(Boolean)
      : [url];
  const uniqueUrls = Array.from(new Set(candidateUrls));

  let response;
  let finalUrl = url;
  let lastError;

  for (const candidateUrl of uniqueUrls) {
    try {
      response = await fetchWithRetry(candidateUrl, {
        timeoutMs: 20000,
        retries: 3,
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      finalUrl = candidateUrl;
      break;
    } catch (error) {
      lastError = error;
      if (source.key !== "boss") {
        throw error;
      }
      console.warn(
        "[news.refresh] boss fallback attempt failed",
        candidateUrl,
        error?.message || "Erreur inconnue"
      );
    }
  }
  if (!response) {
    throw lastError || new Error("Fetch RSS failed");
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const items = extractItems(parsed);

  const normalized = items
    .map((item) => {
      const title = stripHtml(extractText(item.title)) || "";
      const link = extractLink(item) || extractText(item.link);
      const description =
        stripHtml(extractText(item.description)) ||
        stripHtml(extractText(item.summary)) ||
        stripHtml(extractText(item.content));
      const summary = description.slice(0, 350);
      const publishedAt =
        parseDate(item.pubDate) ||
        parseDate(item.published) ||
        parseDate(item.updated) ||
        parseDate(item["dc:date"]) ||
        parseDate(item.isoDate);

      const combinedText = `${title} ${summary}`.trim();
      return {
        title: title || "Sans titre",
        url: link,
        summary: summary || null,
        published_at: publishedAt,
        source_key: source.key,
        tags: combinedText ? buildTags(combinedText) : [],
      };
    })
    .filter((item) => item.url);

  console.log(
    "[news.refresh] source",
    source.key,
    "url",
    finalUrl,
    "status",
    response.status,
    "items",
    items.length,
    "normalized",
    normalized.length
  );
  return upsertItems(supabase, normalized);
}

module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }
  
  const expected = process.env.CRON_SECRET || process.env.NEWS_REFRESH_TOKEN;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!expected || token !== expected) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    res.status(500).json({ ok: false, error: "Missing Supabase credentials" });
    return;
  }

  const supabase = createClient(url, serviceKey);
  const errors = [];
  let inserted = 0;
  let updated = 0;
  let sources = [];

  try {
    sources = await loadSources(supabase);
        console.log(
      "[news.refresh] loaded sources:",
      sources.map((source) => source.key)
    );
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "Load sources failed" });
    return;
  }

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const counts = await processSource(supabase, source);
      return { key: source.key, ...counts };
    })
  );

  results.forEach((result, index) => {
    const source = sources[index];
    if (result.status === "fulfilled") {
      inserted += result.value.inserted;
      updated += result.value.updated;
    } else {
        console.error(
        "[news.refresh] error",
        source?.key,
        result.reason?.message || "Erreur inconnue",
        result.reason?.stack || ""
      );
      errors.push({
        key: source?.key,
        message: result.reason?.message || "Erreur inconnue",
      });
    }
  });

  res.status(200).json({
    ok: true,
    sources: sources.map((source) => source.key),
    inserted,
    updated,
    errors,
  });
};
