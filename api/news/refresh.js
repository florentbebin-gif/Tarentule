/**
 * Vercel Function: /api/news/refresh
 * - Called by Vercel Cron (GET) or manual trigger.
 * - Authenticates the caller.
 * - Proxies a POST call to the Supabase Edge Function that refreshes RSS sources.
 */

const crypto = require('crypto');

function fingerprint(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8);
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
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
  const base = String(functionsBaseUrl).replace(/\/+$/, '');
  // If base already ends with the function name, don't append it.
  if (base.endsWith(`/${functionName}`)) return base;
  return `${base}/${functionName}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 55_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async (req, res) => {
  // 1) Incoming auth (what the caller must provide)
  // - Vercel Cron: Authorization: Bearer <CRON_SECRET>
  // - Manual test: x-refresh-token: <NEWS_REFRESH_TOKEN> (or Authorization Bearer)
  const cronSecret = process.env.CRON_SECRET;
  const edgeToken = process.env.NEWS_REFRESH_TOKEN || cronSecret; // fallback to keep things runnable

  const authorization = getHeader(req, 'authorization');
  const xRefreshToken = getHeader(req, 'x-refresh-token') || getHeader(req, 'X-Refresh-Token');
  const ua = String(req.headers['user-agent'] || '');
  const isVercelCron = ua.startsWith('vercel-cron/');
  const allowCronBypass = ['1', 'true', 'yes'].includes(
    String(process.env.ALLOW_VERCEL_CRON_UA_BYPASS || '').toLowerCase(),
  );
  const bearer = extractBearerToken(authorization);
  const provided = (xRefreshToken || bearer || '').trim();

  const allowedTokens = [cronSecret, edgeToken].filter(Boolean);

  console.log('[news.refresh] auth check', {
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
      error: 'Missing env vars: set CRON_SECRET and/or NEWS_REFRESH_TOKEN on Vercel.',
    });
  }

  if (isVercelCron && allowCronBypass) {
    console.log('[news.refresh] cron bypass enabled (vercel-cron)');
    // on autorise sans tenir compte des headers auth
  } else {
    const authOk = provided && allowedTokens.includes(provided);
    if (!authOk) {
      return json(res, 401, { ok: false, error: 'Unauthorized' });
    }
  }
  
  // 2) Supabase Edge Function target
  const functionsBaseUrl = process.env.SUPABASE_FUNCTIONS_URL;
  if (!functionsBaseUrl) {
    return json(res, 500, { ok: false, error: 'Missing SUPABASE_FUNCTIONS_URL env var' });
  }
  
  // According to your Supabase dashboard, the deployed function is named: `new-refresh`
  // You can override via SUPABASE_FUNCTION_NAME if you rename it later.
  const functionName = process.env.SUPABASE_FUNCTION_NAME || 'new-refresh';
  const targetUrl = resolveTargetUrl(functionsBaseUrl, functionName);

  // 3) Always POST to Edge Function (it rejects GET with 405)

  try {
    const edgeRes = await fetchWithTimeout(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Refresh-Token': edgeToken,
      },
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
        error: 'Edge function error',
        status: edgeRes.status,
        targetUrl,
        data,
      });
    }

    return json(res, 200, data);
  } catch (err) {
    return json(res, 500, { ok: false, error: 'Request failed', detail: String(err) });
  }
};
