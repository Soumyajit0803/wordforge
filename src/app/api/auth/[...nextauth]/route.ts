import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/app/db/index";

// 1. We export this so your Server Actions can use it
export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  // 2. We add this callback to expose the database ID
  callbacks: {
    // 1. This runs the exact moment the user logs in
    async jwt({ token, trigger, session }) {
      if (trigger === "update" && session) {
        // Merge the new data from your frontend into the token
        token.name = session.name;
        token.picture = session.image; // NextAuth JWTs use 'picture' by default
      }
      return token;
    },
    // 2. This runs every time you call useSession() or getServerSession()
    async session({ session, token }) {
      if (token) {
        if (session.user) {
          session.user.id = token.sub as string;
          session.user.name = token.name;
          session.user.image = token.picture as string | null | undefined;
        }
      }
      return session;
    }
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
