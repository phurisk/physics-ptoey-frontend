import { Fragment, ReactNode } from "react"
import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type BreadcrumbItemDef = { label: ReactNode; href?: string }

/**
 * Canonical admin page shell: outer padded container + a header card with
 * icon/title/subtitle, an optional breadcrumb, an optional back button, and
 * an optional primary action (e.g. "+ เพิ่ม..."). Renders `children` below
 * the header, inside the same container, so every admin page shares one
 * layout instead of each page hand-rolling its own.
 *
 * `breadcrumbItems`: array of { label, href? } — "หน้าหลัก" (dashboard) is
 * added automatically as the first item, don't include it yourself.
 */
export default function AdminPageHeader({
  icon,
  title,
  subtitle,
  breadcrumbItems,
  onBack,
  actions,
  children,
}: {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  breadcrumbItems?: BreadcrumbItemDef[]
  onBack?: () => void
  actions?: ReactNode
  children?: ReactNode
}) {
  const items: BreadcrumbItemDef[] | null = breadcrumbItems
    ? [
        {
          href: "/admin/dashboard",
          label: (
            <span className="inline-flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              หน้าหลัก
            </span>
          ),
        },
        ...breadcrumbItems,
      ]
    : null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          {items && (
            <Breadcrumb>
              <BreadcrumbList>
                {items.map((item, idx) => (
                  <Fragment key={`crumb-${idx}`}>
                    <BreadcrumbItem>
                      {idx === items.length - 1 || !item.href ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {idx < items.length - 1 && <BreadcrumbSeparator />}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
                {icon}
                {title}
              </h2>
              {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
            </div>
            <div className="flex items-center gap-2">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  กลับ
                </Button>
              )}
              {actions}
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
