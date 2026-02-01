import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.3.5";

const SOURCE_FALLBACKS: Record<string, string> = {
  bofip:
    "https://bofip.impots.gouv.fr/bofip/ext/rss.xml?series=IR:IR-CHAMP:IR-BASE:IR-LIQ:IR-RICI:IR-DECLA:IR-PAS:IR-PAIE:IR-PROCD:IR-CESS:IR-DOMIC:IR-CHR:RSA:RSA-CHAMP:RSA-GEO:RSA-BASE:RSA-PENS:RSA-GER:RPPM:RPPM-PVBMC:RPPM-RCM:RPPM-PVBMI:RFPI:RFPI-CHAMP:RFPI-BASE:RFPI-DECLA:RFPI-SPEC:RFPI-PROCD:RFPI-CTRL:RFPI-PVI:RFPI-PVINR:RFPI-SPI:RFPI-TDC:RFPI-TPVIE:BA:BA-CHAMP:BA-REG:BA-BASE:BA-LIQ:BA-RICI:BA-DECLA:BA-PROCD:BA-SECT:BA-CESS:BNC:BNC-CHAMP:BNC-BASE:BNC-RICI:BNC-DECLA:BNC-PROCD:BNC-SECT:BNC-CESS:BIC:BIC-CHAMP:BIC-BASE:BIC-PDSTK:BIC-CHG:BIC-PVMV:BIC-AMT:BIC-PROV:BIC-DEF:BIC-RICI:BIC-DECLA:BIC-PROCD:BIC-CESS:BIC-PTP:IS:IS-CHAMP:IS-BASE:IS-DEF:IS-LIQ:IS-RICI:IS-DECLA:IS-AUT:IS-PROCD:IS-GEO:IS-CESS:IS-FUS:IS-GPE:PAT:PAT-IFI:PAT-ISF:PAT-TPC:PAT-CAP&maxR=25&maxJ=14",
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

function normalizeArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(input: string | null | undefined): string {
  if (!input) {
    return "";
  }
  const noTags = input.replace(/<[^>]+>/g, " ");
  return decodeEntities(noTags).replace(/\s+/g, " ").trim();
}

function extractText(value: unknown): string {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record["#text"] === "string") {
      return record["#text"];
    }
    if (typeof record.__cdata === "string") {
      return record.__cdata;
    }
    if (typeof record.text === "string") {
      return record.text;
    }
  }
  return "";
}

function extractLink(entry: Record<string, unknown>): string {
  const link = entry.link;
  if (typeof link === "string") {
    return link;
  }
  if (link && typeof (link as Record<string, unknown>)["@_href"] === "string") {
    return (link as Record<string, unknown>)["@_href"] as string;
  }
  if (Array.isArray(link)) {
    const href = link.find((item) =>
      item && typeof (item as Record<string, unknown>)["@_href"] === "string"
    ) as Record<string, unknown> | undefined;
    return href?.["@_href"] as string ?? "";
  }
  return "";
}

function parseDate(value: unknown): string | null {
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

function buildTags(text: string): string[] {
  const tags = new Set<string>();
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

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
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
    return await fetch(url, {
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractItems(parsed: Record<string, unknown>): Record<string, unknown>[] {
  if (parsed?.rss?.channel?.item) {
    return normalizeArray(parsed.rss.channel.item) as Record<string, unknown>[];
  }
  if (parsed?.feed?.entry) {
    return normalizeArray(parsed.feed.entry) as Record<string, unknown>[];
  }
  if (parsed?.channel?.item) {
    return normalizeArray(parsed.channel.item) as Record<string, unknown>[];
  }
  if (parsed?.["rdf:RDF"]?.item) {
    return normalizeArray(parsed["rdf:RDF"].item) as Record<string, unknown>[];
  }
  if (parsed?.RDF?.item) {
    return normalizeArray(parsed.RDF.item) as Record<string, unknown>[];
  }
  return [];
}

async function loadExistingUrls(
  supabase: ReturnType<typeof createClient>,
  urls: string[]
): Promise<Set<string>> {
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

  return new Set((data || []).map((row: { url: string }) => row.url));
}

async function upsertItems(
  supabase: ReturnType<typeof createClient>,
  items: Record<string, unknown>[]
): Promise<{ inserted: number; updated: number }> {
  if (!items.length) {
    return { inserted: 0, updated: 0 };
  }

  const urls = items.map((item) => item.url).filter(Boolean) as string[];
  const existingUrls = await loadExistingUrls(supabase, urls);

  const inserted = items.filter((item) =>
    item.url && !existingUrls.has(item.url as string)
  ).length;
  const updated = items.filter((item) =>
    item.url && existingUrls.has(item.url as string)
  ).length;

  const { error } = await supabase
    .from("news_items")
    .upsert(items, { onConflict: "url" });

  if (error) {
    throw error;
  }

  return { inserted, updated };
}

async function loadSources(supabase: ReturnType<typeof createClient>) {
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

async function processSource(
  supabase: ReturnType<typeof createClient>,
  source: { key: string; url?: string | null }
): Promise<{ inserted: number; updated: number; parsedCount: number }> {
  const url = source.url || SOURCE_FALLBACKS[source.key];
  if (!url) {
    throw new Error("URL RSS manquante");
  }

  const response = await fetchWithTimeout(url, 30000);
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
    "[news-refresh] source",
    source.key,
    "status",
    response.status,
    "parsedCount",
    items.length,
    "normalized",
    normalized.length
  );

  const counts = await upsertItems(supabase, normalized);
  console.log(
    "[news-refresh] upserted",
    source.key,
    "inserted",
    counts.inserted,
    "updated",
    counts.updated
  );

  return { ...counts, parsedCount: items.length };
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const refreshToken = Deno.env.get("NEWS_REFRESH_TOKEN");
  const provided = req.headers.get("X-Refresh-Token");

  if (!refreshToken || provided !== refreshToken) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing Supabase credentials" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const errors: { key: string; message: string }[] = [];
  let inserted = 0;
  let updated = 0;
  let sources: { key: string; url?: string | null }[] = [];

  try {
    sources = await loadSources(supabase);
    console.log(
      "[news-refresh] loaded sources",
      sources.map((source) => source.key)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load sources failed";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : "Erreur inconnue";
      console.error("[news-refresh] error", source?.key, message);
      errors.push({
        key: source?.key ?? "unknown",
        message,
      });
    }
  });

  return new Response(
    JSON.stringify({
      ok: true,
      sources: sources.map((source) => source.key),
      inserted,
      updated,
      errors,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
