async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
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

  const functionsBaseUrl = process.env.SUPABASE_FUNCTIONS_URL;
  const refreshToken = process.env.NEWS_REFRESH_TOKEN || process.env.CRON_SECRET;

  if (!functionsBaseUrl) {
    res.status(500).json({ ok: false, error: "Missing Supabase functions URL" });
    return;
  }
  
  if (!refreshToken) {
    res.status(500).json({ ok: false, error: "Missing refresh token" });
    return;
  }
  const endpoint = `${functionsBaseUrl.replace(/\/$/, "")}/news-refresh`;

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Refresh-Token": refreshToken,
      },
    });
    const payload = await response.json().catch(() => ({
      ok: false,
      error: "Invalid JSON from Edge Function",
    }));
    res.status(response.status).json(payload);
  } catch (error) {
    console.error("[news.refresh] proxy error", error?.message || error);
    res.status(502).json({ ok: false, error: "Edge Function request failed" });
  }
};
