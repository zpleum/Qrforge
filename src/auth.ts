import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // Stateless JWT session in an httpOnly, Secure, SameSite=Lax cookie. Short life + sliding refresh.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  pages: { signIn: "/", error: "/" },
  callbacks: {
    async signIn({ account, profile }) {
      // Only Google accounts with a verified email. Reject everything else.
      if (account?.provider !== "google" || !profile?.email_verified || !profile.sub || !profile.email) return false;
      const row = { email: profile.email, name: profile.name ?? null, image: profile.picture ?? null };
      // Stable key = Google "sub" (not Auth.js's random UUID — see jwt below).
      await db.insert(users).values({ id: profile.sub, ...row }).onConflictDoUpdate({ target: users.id, set: row });
      return true;
    },
    async jwt({ token, account, profile }) {
      // Auth.js sets token.sub to a random UUID so the user is "independent of the provider".
      // We need the same id in the session and in `users.id`, so overwrite with Google's sub.
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
