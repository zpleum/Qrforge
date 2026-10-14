import "server-only";
import { auth } from "@/auth";
import { isAdminEmail } from "./admin-emails";

export { isAdminEmail };

export async function requireAdmin() {
  const session = await auth();
  return isAdminEmail(session?.user?.email) ? session : null;
}
