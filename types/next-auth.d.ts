import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      lineId?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    lineId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
    role: string
    lineId?: string | null
  }
}
