/** Sanitize UTM values from a destination URL — short, printable, no PII intent. */
export function parseUtm(destination: string): {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
} {
  try {
    const u = new URL(destination);
    const clean = (k: string) => {
      const v = u.searchParams.get(k)?.trim();
      if (!v) return null;
      return v.slice(0, 80).replace(/[^\w.-]/g, "_") || null;
    };
    return {
      utmSource: clean("utm_source"),
      utmMedium: clean("utm_medium"),
      utmCampaign: clean("utm_campaign"),
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
}
