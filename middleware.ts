import { withAuth } from "next-auth/middleware"

// Protects /admin/** PAGE routes only — /api/admin/** routes guard themselves
// via requireAdmin() so they can return proper 401 JSON instead of a redirect.
export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === "ADMIN",
  },
  pages: {
    signIn: "/admin/login",
  },
})

export const config = {
  matcher: ["/admin/((?!login).*)"],
}
