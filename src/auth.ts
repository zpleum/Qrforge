import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin-emails";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  pages: { signIn: "/", error: "/" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !profile?.email_verified || !profile.sub || !profile.email) return false;

      const [existing] = await db.select({ status: users.status }).from(users).where(eq(users.id, profile.sub)).limit(1);
      if (existing?.status === "suspended") return false;

      const role = isAdminEmail(profile.email) ? "admin" : "user";
      const row = {
        email: profile.email,
        name: profile.name ?? null,
        image: profile.picture ?? null,
        lastLoginAt: new Date(),
      };
      await db
        .insert(users)
        .values({ id: profile.sub, ...row, role, status: "active" })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...row,
            // Promote from ADMIN_EMAILS on each login; never auto-demote.
            ...(role === "admin" ? { role: "admin" as const } : {}),
          },
        });
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile && "sub" in profile && profile.sub) {
        token.sub = String(profile.sub);
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
