import { DefaultSession } from "next-auth";
import "next-auth/jwt"; // You need to import this to augment it

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

// Tell TypeScript that our JWT token will now have an 'id' string
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}