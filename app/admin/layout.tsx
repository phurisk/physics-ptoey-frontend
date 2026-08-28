import type { ReactNode } from "react"
import { AdminAuthProvider } from "./_lib/AdminAuthContext"

// SessionProvider is already mounted globally in the root layout
// (components/session-provider-wrapper.tsx) and shared with the
// student-facing LINE login — only the admin-specific context wrapper is
// added here, no second SessionProvider.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}
