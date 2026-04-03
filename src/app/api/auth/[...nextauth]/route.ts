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
    async jwt({ token, user }) {
      if (user) {
        // Grab the ID from the database user and attach it to the encrypted token
        token.id = user.id; 
      }
      return token;
    },
    
    // 2. This runs every time you call useSession() or getServerSession()
    async session({ session, token }) {
      if (session.user && token) {
        // Grab the ID from the decrypted token and attach it to the final session object
        session.user.id = token.id as string; 
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };