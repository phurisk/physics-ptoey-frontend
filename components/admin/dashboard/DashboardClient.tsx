"use client"

import { useEffect, useState } from "react"
import { Users, BookOpen, GraduationCap, ShoppingCart, Wallet, Clock } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { LayoutDashboard } from "lucide-react"

type Stats = {
  totalUsers: number
  totalCourses: number
  publishedCourses: number
  activeEnrollments: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  recentOrders: {
    id: string
    orderNumber: string
    userName: string
    total: number
    status: string
    paymentStatus: string | null
    createdAt: string
  }[]
}

type RevenuePoint = { key: string; label: string; revenue: number }

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "รอชำระเงิน",
  PENDING_PAYMENT: "รอชำระเงิน",
  PENDING_VERIFICATION: "รอตรวจสอบ",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
  REFUNDED: "คืนเงิน",
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount)

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-500">{label}</div>
          <div className="truncate text-xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [statsRes, revenueRes] = await Promise.all([
          fetch("/api/admin/dashboard/stats").then((r) => r.json()),
          fetch("/api/admin/dashboard/revenue-by-month").then((r) => r.json()),
        ])
        if (!active) return
        if (statsRes.success) setStats(statsRes.data)
        if (revenueRes.success) setRevenue(revenueRes.data)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <AdminPageHeader icon={<LayoutDashboard className="h-6 w-6" />} title="แดชบอร์ด" subtitle="ภาพรวมระบบหลังบ้าน">
      {loading || !stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Users} label="ผู้ใช้งานทั้งหมด" value={String(stats.totalUsers)} accent="bg-blue-50 text-blue-600" />
            <StatCard
              icon={BookOpen}
              label="คอร์สเรียน"
              value={`${stats.publishedCourses}/${stats.totalCourses}`}
              accent="bg-purple-50 text-purple-600"
            />
            <StatCard icon={GraduationCap} label="กำลังเรียน" value={String(stats.activeEnrollments)} accent="bg-emerald-50 text-emerald-600" />
            <StatCard icon={ShoppingCart} label="คำสั่งซื้อทั้งหมด" value={String(stats.totalOrders)} accent="bg-amber-50 text-amber-600" />
            <StatCard icon={Clock} label="รอดำเนินการ" value={String(stats.pendingOrders)} accent="bg-orange-50 text-orange-600" />
            <StatCard icon={Wallet} label="รายได้รวม" value={formatCurrency(stats.totalRevenue)} accent="bg-green-50 text-green-600" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="mb-4 font-semibold text-gray-900">รายได้ 6 เดือนล่าสุด</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => new Intl.NumberFormat("th-TH", { notation: "compact" }).format(v)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">คำสั่งซื้อล่าสุด</h3>
              <div className="space-y-3">
                {stats.recentOrders.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีคำสั่งซื้อ</p>}
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-2 border-b border-gray-50 pb-2 last:border-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">{order.userName}</div>
                      <div className="text-xs text-gray-400">#{order.orderNumber}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</div>
                      <Badge variant="outline" className="mt-0.5 text-[10px]">
                        {ORDER_STATUS_LABEL[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminPageHeader>
  )
}
