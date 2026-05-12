import type { DefaultSession } from "next-auth";
import type { AdminRole } from "@/lib/auth/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AdminRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AdminRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: AdminRole;
  }
}
