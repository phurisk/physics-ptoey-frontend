import type { NextAuthOptions } from "next-auth"
import LineProvider from "next-auth/providers/line"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  // No PrismaAdapter — LINE login is handled by hand in the signIn callback below.
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
      authorization: { params: { scope: "profile openid" } },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } })
        if (!user || !user.password) return null

        const isValidPassword = await bcrypt.compare(credentials.password, user.password)
        if (!isValidPassword) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "line") {
        try {
          const existingUser = await prisma.user.findUnique({ where: { lineId: account.providerAccountId } })

          if (existingUser) {
            await prisma.user.update({ where: { id: existingUser.id }, data: { name: user.name, image: user.image } })
            user.id = existingUser.id
            user.role = existingUser.role
            user.email = existingUser.email
          } else {
            const newUser = await prisma.user.create({
              data: {
                name: user.name,
                image: user.image,
                lineId: account.providerAccountId,
                role: "STUDENT",
                ...(user.email && { email: user.email }),
              },
            })
            user.id = newUser.id
            user.role = newUser.role
            user.email = newUser.email
          }
          return true
        } catch (error) {
          console.error("LINE login error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userId = user.id
        token.lineId = user.lineId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
}
