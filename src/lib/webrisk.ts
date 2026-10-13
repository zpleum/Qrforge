import "server-only";

/**
 * Google Web Risk (the commercial-use sibling of Safe Browsing).
 * Fails OPEN on purpose: if the key is missing or the API is down, saving still works,
 * and the nightly cron re-checks every active destination anyway.
 */
export async function isUnsafe(url: string): Promise<boolean> {
  const key = process.env.WEB_RISK_API_KEY;
  if (!key) return false;
  try {
    const q = new URLSearchParams({ uri: url });
    for (const t of ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"]) q.append("threatTypes", t);
    const res = await fetch(`https://webrisk.googleapis.com/v1/uris:search?${q}`, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) { console.error("webrisk status", res.status); return false; }
    const data = (await res.json()) as { threat?: unknown };
    return Boolean(data.threat);
  } catch (e) {
    console.error("webrisk failed", e);
    return false;
  }
}
