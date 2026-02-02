/**
 * Vercel Function: /api/news/refresh
 * - Called by Vercel Cron (GET) or manual trigger.
 * - Authenticates the caller.
 * - Proxies a POST call to the Supabase Edge Function that refreshes RSS sources.
 */

const crypto = require("crypto");
const { fetch: undiciFetch } = require("undici");
const fetchImpl = globalThis.fetch || undiciFetch;

function fingerprint(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 8);
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function getHeader(req, name) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function extractBearerToken(authorization) {
  if (!authorization) return null;
  const match = String(authorization).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function resolveTargetUrl(functionsBaseUrl, functionName) {
  const base = String(functionsBaseUrl).replace(/\/+$/, "");
  if (base.endsWith(`/${functionName}`)) return base;
  return `${base}/${functionName}`;
}

function resolveFunctionsBaseUrl() {
  const explicit = process.env.SUPABASE_FUNCTIONS_URL;
  if (explicit) return String(explicit).replace(/\/+$/, "");

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${String(supabaseUrl).replace(/\/+$/, "")}/functions/v1`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 55_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async (req, res) => {
  // 1) Incoming auth
  const cronSecret = process.env.CRON_SECRET;
  const edgeToken = process.env.NEWS_REFRESH_TOKEN || cronSecret;

  const authorization = getHeader(req, "authorization");
  const xRefreshToken = getHeader(req, "x-refresh-token") || getHeader(req, "X-Refresh-Token");
  const ua = String(req.headers["user-agent"] || "");
  const isVercelCron = ua.startsWith("vercel-cron/");
  const allowCronBypass = ["1", "true", "yes"].includes(
    String(process.env.ALLOW_VERCEL_CRON_UA_BYPASS || "").toLowerCase()
  );

  const bearer = extractBearerToken(authorization);
  const provided = (xRefreshToken || bearer || "").trim();
  const allowedTokens = [cronSecret, edgeToken].filter(Boolean);

  console.log("[news.refresh] auth check", {
    method: req.method,
    hasAuthorization: Boolean(authorization),
    authorizationLength: authorization ? String(authorization).length : 0,
    hasXRefreshToken: Boolean(xRefreshToken),
    xRefreshTokenLength: xRefreshToken ? String(xRefreshToken).length : 0,
    allowedTokenLengths: allowedTokens.map((t) => String(t).length),
    isVercelCron,
    allowCronBypass,
    providedFp: fingerprint(provided),
    cronSecretFp: fingerprint(cronSecret),
    edgeTokenFp: fingerprint(edgeToken),
  });

  if (allowedTokens.length === 0) {
    return json(res, 500, {
      ok: false,
      error: "Missing env vars: set CRON_SECRET and/or NEWS_REFRESH_TOKEN on Vercel.",
    });
  }

  if (!(isVercelCron && allowCronBypass)) {
    const authOk = provided && allowedTokens.includes(provided);
    if (!authOk) return json(res, 401, { ok: false, error: "Unauthorized" });
  } else {
    console.log("[news.refresh] cron bypass enabled (vercel-cron)");
  }

  // 2) Supabase Edge Function target
  const functionsBaseUrl = resolveFunctionsBaseUrl();
  if (!functionsBaseUrl) {
    return json(res, 500, {
      ok: false,
      error: "Missing Supabase Functions URL (set SUPABASE_FUNCTIONS_URL or SUPABASE_URL).",
    });
  }

  const functionName = process.env.SUPABASE_FUNCTION_NAME || "new-refresh";
  const targetUrl = resolveTargetUrl(functionsBaseUrl, functionName);

  try {
    // IMPORTANT: Supabase Edge Functions are JWT-protected by default
    const supabaseAuthKey =
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseAuthKey) {
      console.warn(
        "[news.refresh] missing SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY: edge call may be rejected with 401"
      );
    }

    const edgeHeaders = {
      "Content-Type": "application/json",
      "X-Refresh-Token": edgeToken,
    };

    if (supabaseAuthKey) {
      edgeHeaders.Authorization = `Bearer ${supabaseAuthKey}`;
      edgeHeaders.apikey = supabaseAuthKey;
    }

    const edgeRes = await fetchWithTimeout(targetUrl, {
      method: "POST",
      headers: edgeHeaders,
      body: JSON.stringify({ triggeredAt: new Date().toISOString() }),
    });

    const text = await edgeRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!edgeRes.ok) {
      return json(res, edgeRes.status, {
        ok: false,
        error: "Edge function error",
        status: edgeRes.status,
        targetUrl,
        data,
      });
    }

    return json(res, 200, data);
  } catch (err) {
    console.error("[news.refresh] proxy failed", err);
    return json(res, 500, {
      ok: false,
      error: "Request failed",
      detail: String(err),
      stack: err?.stack || null,
    });
  }
};
