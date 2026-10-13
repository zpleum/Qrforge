import "server-only";
import { auth } from "@/auth";

export const isAdminEmail = (email?: string | null) =>
  !!email &&
  (process.env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());

export async function requireAdmin() {
  const session = await auth();
  return isAdminEmail(session?.user?.email) ? session : null;
}
