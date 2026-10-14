/** Pure helper — no auth import (avoids circular deps with auth.ts). */
export const isAdminEmail = (email?: string | null) =>
  !!email &&
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
