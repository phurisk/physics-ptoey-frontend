"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import QRCODE from "../../../components/PaymentInfo/QRCODE";
import BankingInfo from "../../../components/PaymentInfo/BankingInfo";

type OrderItem = {
  id?: string;
  itemType: "COURSE" | "EBOOK" | string;
  itemId: string;
  title?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  createdAt?: string;
};

type Order = {
  id: string;
  orderNumber?: string | null;
  orderType?: "COURSE" | "EBOOK";
  status: string;
  subtotal: number;
  shippingFee: number;
  tax?: number | null;
  discount?: number | null;
  couponDiscount: number;
  total: number;
  createdAt: string;
  couponCode?: string | null;
  course?: { id: string; title: string; isPhysical?: boolean };
  ebook?: {
    id: string;
    title: string;
    coverImageUrl?: string | null;
    isPhysical?: boolean;
    fileUrl?: string | null;
    previewUrl?: string | null;
  };
  payment?: {
    id: string;
    status: string;
    method?: string | null;
    ref?: string;
    amount?: number;
    paidAt?: string | null;
    slipUrl?: string;
    notes?: string;
    uploadedAt?: string | null;
    verifiedAt?: string | null;
    verifiedBy?: string | null;
    senderBank?: string | null;
    senderName?: string | null;
  };
  shipping?: { shippingMethod?: string; status?: string };
  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
  items?: OrderItem[];
};

type OrderResponse = { success: boolean; data?: Order; error?: string };

function getSafeUserId(user: any): string | undefined {
  return (user?.id ?? user?.userId ?? user?._id ?? user?.uid) || undefined;
}

function isPaidLikeStatus(s?: string) {
  const x = (s || "").toUpperCase();
  return ["COMPLETED", "PAID", "APPROVED", "SUCCESS"].includes(x);
}

function formatCurrency(value?: number | null) {
  const numeric = Number(value ?? 0);
  const safeNumber = Number.isFinite(numeric) ? numeric : 0;
  return `฿${safeNumber.toLocaleString()}`;
}

function toItemTypeLabel(itemType?: string) {
  const t = (itemType || "").toUpperCase();
  if (t === "COURSE") return "คอร์สเรียน";
  if (t === "EBOOK") return "หนังสือ / E-Book";
  return itemType || "สินค้า";
}

function toPaymentMethodLabel(method?: string | null) {
  const m = (method || "").toUpperCase();
  if (m === "BANK_TRANSFER") return "โอนผ่านธนาคาร";
  if (m === "CREDIT_CARD") return "บัตรเครดิต";
  if (m === "PROMPTPAY") return "พร้อมเพย์";
  if (!method) return "-";
  return method;
}

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openUpload, setOpenUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [editingShipping, setEditingShipping] = useState(false);
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    district: "",
    province: "",
    postalCode: "",
  });
  const [shippingMsg, setShippingMsg] = useState<string | null>(null);
  const [ebookLink, setEbookLink] = useState<string | null>(null);

  const [enrollErr, setEnrollErr] = useState<string | null>(null);
  const triedEnrollRef = useRef(false);
  const [enrollErrByCourse, setEnrollErrByCourse] = useState<
    Record<string, string | null>
  >({});
  const triedEnrollSetRef = useRef<Set<string>>(new Set());
  const [enrollmentStatus, setEnrollmentStatus] = useState<
    Record<string, "loading" | "exists" | "missing" | "error">
  >({});

  const displayItems = useMemo<OrderItem[]>(() => {
    if (!order) return [];
    const rawItems = Array.isArray(order.items)
      ? order.items.filter(Boolean)
      : [];
    if (rawItems.length > 0) return rawItems as OrderItem[];

    const fallback: OrderItem[] = [];
    if (order.course?.id) {
      fallback.push({
        id: `course-${order.course.id}`,
        itemType: "COURSE",
        itemId: order.course.id,
        title: order.course.title,
        quantity: 1,
        unitPrice: order.total ?? order.subtotal,
        totalPrice: order.total ?? order.subtotal,
      });
    }
    if (order.ebook?.id) {
      fallback.push({
        id: `ebook-${order.ebook.id}`,
        itemType: "EBOOK",
        itemId: order.ebook.id,
        title: order.ebook.title,
        quantity: 1,
        unitPrice: order.total ?? order.subtotal,
        totalPrice: order.total ?? order.subtotal,
      });
    }
    return fallback;
  }, [order]);

  // ────────────────────────────────────────────────────────────────────────────
  // API helpers
  // ────────────────────────────────────────────────────────────────────────────
  async function fetchOrder(orderId: string) {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      cache: "no-store",
    });
    const text = await res.text().catch(() => "");
    let json: OrderResponse | null = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}
    if (!res.ok || !json?.success) {
      throw new Error(
        json?.error || (text && text.slice(0, 300)) || `HTTP ${res.status}`
      );
    }
    return json.data!;
  }

  const normalizedShipping = useMemo(() => {
    const s1: any = (order as any)?.shippingAddress;
    if (
      s1 &&
      (s1.name || s1.address || s1.district || s1.province || s1.postalCode)
    ) {
      return {
        name: s1.name || "",
        phone: s1.phone || "",
        address: s1.address || "",
        district: s1.district || "",
        province: s1.province || "",
        postalCode: s1.postalCode || "",
      };
    }
    const s2: any = (order as any)?.shipping;
    if (
      s2 &&
      (s2.recipientName ||
        s2.address ||
        s2.district ||
        s2.province ||
        s2.postalCode)
    ) {
      return {
        name: s2.recipientName || "",
        phone: s2.recipientPhone || "",
        address: s2.address || "",
        district: s2.district || "",
        province: s2.province || "",
        postalCode: s2.postalCode || "",
      };
    }
    return null;
  }, [order]);

  useEffect(() => {
    const s = normalizedShipping || {};
    setShipping({
      name: (s as any).name || "",
      phone: (s as any).phone || "",
      address: (s as any).address || "",
      district: (s as any).district || "",
      province: (s as any).province || "",
      postalCode: (s as any).postalCode || "",
    });
  }, [order?.id, normalizedShipping]);

  async function pollUntilPaid(orderId: string, timeoutMs = 60_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const o = await fetchOrder(orderId);
      const cur = (o?.payment?.status || o?.status || "").toUpperCase();
      if (isPaidLikeStatus(cur)) return o;
      await new Promise((r) => setTimeout(r, 2500));
    }
    throw new Error("ยังไม่อนุมัติการชำระเงิน");
  }

  async function enrollUser(
    userId: string,
    courseId: string,
    orderId?: string
  ) {
    const payload = { userId, courseId, orderId };

    const doPost = async (url: string) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => "");
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}
      const okLike = res.ok && json?.success !== false;
      if (!okLike) {
        const msg =
          json?.error ||
          json?.message ||
          (text && text.slice(0, 300)) ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return json;
    };

    try {
      if (process.env.NODE_ENV !== "production")
        console.log("[Enroll] try /api/enrollment", payload);
      return await doPost("/api/enrollment");
    } catch (e1: any) {
      if (process.env.NODE_ENV !== "production")
        console.warn("[Enroll] fallback /api/enrollments →", e1?.message);
      // fallback ไป plural
      return await doPost("/api/enrollments");
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Initial load
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!id) return;
        const data = await fetchOrder(String(id));
        if (active) setOrder(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // ────────────────────────────────────────────────────────────────────────────
  // Auto-enroll เฉพาะเมื่อชำระเงินแล้ว (รองรับหลายคอร์ส)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!order) return;
    const paymentStatus = (
      order?.payment?.status ||
      order?.status ||
      ""
    ).toUpperCase();
    const userId = getSafeUserId(user);
    if (!isPaidLikeStatus(paymentStatus) || !userId) return;

    const items = Array.isArray(order.items)
      ? order.items.filter((i) => (i.itemType || "").toUpperCase() === "COURSE")
      : order.course?.id
      ? [
          {
            itemType: "COURSE",
            itemId: order.course.id,
            title: order.course.title,
          },
        ]
      : [];

    if (!items.length) return;
    (async () => {
      for (const it of items) {
        const cid = String(it.itemId);
        if (triedEnrollSetRef.current.has(cid)) continue;
        triedEnrollSetRef.current.add(cid);
        try {
          await enrollUser(userId, cid, order.id);
          setEnrollErrByCourse((prev) => ({ ...prev, [cid]: null }));
        } catch (e: any) {
          const msg = e?.message || "Enroll ไม่สำเร็จ";
          setEnrollErrByCourse((prev) => ({ ...prev, [cid]: msg }));
        }
      }
    })();
  }, [order, user]);

  // ────────────────────────────────────────────────────────────────────────────
  // ตรวจสอบสถานะการลงทะเบียนของแต่ละคอร์ส (เพื่อโชว์ปุ่ม "ลองลงทะเบียนอีกครั้ง" เมื่อยังไม่ถูกสร้าง)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!order) return;
    const paymentStatus = (
      order?.payment?.status ||
      order?.status ||
      ""
    ).toUpperCase();
    const userId = getSafeUserId(user);
    if (!isPaidLikeStatus(paymentStatus) || !userId) return;

    const items = Array.isArray(order.items)
      ? order.items.filter((i) => (i.itemType || "").toUpperCase() === "COURSE")
      : order.course?.id
      ? [
          {
            itemType: "COURSE",
            itemId: order.course.id,
            title: order.course.title,
          },
        ]
      : [];

    if (!items.length) return;

    let cancelled = false;
    (async () => {
      const next: Record<string, "loading" | "exists" | "missing" | "error"> =
        {};
      for (const it of items) {
        const cid = String(it.itemId);
        next[cid] = "loading";
      }
      if (!cancelled) setEnrollmentStatus((prev) => ({ ...prev, ...next }));

      for (const it of items) {
        const cid = String(it.itemId);
        try {
          const res = await fetch(
            `/api/enrollments?userId=${encodeURIComponent(
              userId
            )}&courseId=${encodeURIComponent(cid)}`,
            { cache: "no-store" }
          );
          const json: any = await res.json().catch(() => ({}));
          const exists = !!(json?.enrollment || json?.data || json?.id);
          if (!cancelled)
            setEnrollmentStatus((prev) => ({
              ...prev,
              [cid]: exists ? "exists" : "missing",
            }));
        } catch {
          if (!cancelled)
            setEnrollmentStatus((prev) => ({ ...prev, [cid]: "error" }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order, user]);

  // ────────────────────────────────────────────────────────────────────────────
  // Upload slip → poll → setOrder (enroll จะเกิดจาก useEffect ด้านบนเอง)
  // ────────────────────────────────────────────────────────────────────────────
  const uploadSlip = async () => {
    if (!order || !file) return;
    try {
      setUploading(true);
      setUploadMsg(null);
      const form = new FormData();
      form.append("orderId", order.id);
      form.append("file", file);
      const res = await fetch(`/api/payments/upload-slip`, {
        method: "POST",
        body: form,
      });
      const text = await res.text().catch(() => "");
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok || json?.success === false) {
        const msg =
          json?.error || (text && text.slice(0, 300)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setUploadMsg("อัพโหลดสลิปสำเร็จ กำลังรอตรวจสอบ…");
      setOpenUpload(false);
      setFile(null);
      await refreshOrder();
    } catch (e: any) {
      setUploadMsg(e?.message ?? "อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!file) {
      if (filePreview) {
        try {
          URL.revokeObjectURL(filePreview);
        } catch {}
      }
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };
  }, [file]);

  const refreshOrder = async () => {
    if (!order?.id) return;
    try {
      setLoading(true);
      const data = await fetchOrder(order.id);
      setOrder(data);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // UI helpers
  // ────────────────────────────────────────────────────────────────────────────
  const statusBadge = (status?: string) => {
    const s = (status || "").toUpperCase();
    if (isPaidLikeStatus(s))
      return <Badge className="bg-green-600 text-white">ชำระเงินแล้ว</Badge>;
    if (s === "PENDING_VERIFICATION")
      return <Badge className="bg-yellow-500 text-white">รอตรวจสอบสลิป</Badge>;
    if (s === "PENDING")
      return <Badge className="bg-yellow-400 text-white">รอการชำระ</Badge>;
    if (s === "REJECTED" || s === "CANCELLED")
      return <Badge className="bg-red-600 text-white">ปฏิเสธ/ยกเลิก</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const paymentStatus = (
    order?.payment?.status ||
    order?.status ||
    ""
  ).toUpperCase();
  const isPending = ["PENDING", "PENDING_VERIFICATION"].includes(paymentStatus);
  const isCompleted =
    isPaidLikeStatus(paymentStatus) || isPaidLikeStatus(order?.status);

  const courseItems = useMemo(
    () =>
      displayItems.filter(
        (item) => (item.itemType || "").toUpperCase() === "COURSE"
      ),
    [displayItems]
  );
  const courseId = courseItems[0]?.itemId || order?.course?.id;
  const courseTitle = courseItems[0]?.title || order?.course?.title;

  const ebookItems = useMemo(
    () =>
      displayItems.filter(
        (item) => (item.itemType || "").toUpperCase() === "EBOOK"
      ),
    [displayItems]
  );
  const primaryEbookItem = ebookItems[0];
  const ebookFileUrl = useMemo(() => {
    if (order?.ebook?.fileUrl || order?.ebook?.previewUrl) {
      return order.ebook.fileUrl || order.ebook.previewUrl || null;
    }
    const fileFromItem =
      (primaryEbookItem as any)?.fileUrl ||
      (primaryEbookItem as any)?.previewUrl;
    return fileFromItem || null;
  }, [order?.ebook?.fileUrl, order?.ebook?.previewUrl, primaryEbookItem]);

  const slipUrl = order?.payment?.slipUrl;
  const hasUploadedSlip = !!slipUrl;

  const itemTypeSummary = useMemo(() => {
    if (displayItems.length === 0) {
      return order?.orderType ? toItemTypeLabel(order.orderType) : "-";
    }
    const labels = Array.from(
      new Set(displayItems.map((item) => toItemTypeLabel(item.itemType)))
    );
    if (labels.length === 1) return labels[0];
    return `หลายประเภท (${labels.join(", ")})`;
  }, [displayItems, order?.orderType]);

  const orderDisplayId = order?.orderNumber || order?.id || "";

  const summaryRows = useMemo(() => {
    if (!order)
      return [] as Array<{ label: string; value: string; accent?: boolean }>;
    const subtotal = Number(order.subtotal ?? 0);
    const discount = Number(order.discount ?? 0);
    const couponDiscount = Number(order.couponDiscount ?? 0);
    const shippingFee = Number(order.shippingFee ?? 0);
    const tax = Number(order.tax ?? 0);
    const total = Number(order.total ?? 0);

    const rows: Array<{ label: string; value: string; accent?: boolean }> = [
      { label: "ยอดรวมสินค้า", value: formatCurrency(subtotal) },
    ];

    if (discount !== 0) {
      const sign = discount < 0 ? "+" : "-";
      rows.push({
        label: "ส่วนลดเพิ่มเติม",
        value: `${sign}${formatCurrency(Math.abs(discount))}`,
      });
    }

    if (couponDiscount > 0) {
      rows.push({
        label: "ส่วนลดคูปอง",
        value: `-${formatCurrency(couponDiscount)}`,
      });
    }

    if (shippingFee > 0) {
      rows.push({ label: "ค่าจัดส่ง", value: formatCurrency(shippingFee) });
    }

    if (tax !== 0) {
      const sign = tax < 0 ? "-" : "+";
      rows.push({
        label: "ภาษี",
        value: `${sign}${formatCurrency(Math.abs(tax))}`,
      });
    }

    rows.push({
      label: "ยอดชำระสุทธิ",
      value: formatCurrency(total),
      accent: true,
    });
    return rows;
  }, [order]);

  const needsShipping = useMemo(() => {
    if (!order) return false;
    if (normalizedShipping) return true;
    if ((order as any)?.shipping) return true;
    if (typeof order.shippingFee === "number" && order.shippingFee > 0)
      return true;
    return displayItems.some((item) => (item as any)?.isPhysical);
  }, [order, normalizedShipping, displayItems]);

  const slipInfo = useMemo(() => {
    try {
      const n = order?.payment?.notes ? JSON.parse(order.payment.notes) : null;
      if (!n || typeof n !== "object") return null;
      const slipOKSuccess =
        n?.slipOKResult?.success ?? n?.slipOKSuccess ?? null;
      const detectedAmount =
        n?.slipOKResult?.data?.amount ?? n?.detectedAmount ?? null;
      const detectedDate =
        n?.slipOKResult?.data?.date ?? n?.detectedDate ?? null;
      const summary = n?.validation?.summary ?? n?.validationSummary ?? null;
      return { slipOKSuccess, detectedAmount, detectedDate, summary };
    } catch {
      return null;
    }
  }, [order?.payment?.notes]);

  const canManualEnroll =
    isCompleted && isAuthenticated && !!getSafeUserId(user);

  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
    /\/$/,
    ""
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const completed =
          isPaidLikeStatus(order?.status) ||
          isPaidLikeStatus(order?.payment?.status);
        if (!order || !completed) return;
        const ebookId = order.ebook?.id || primaryEbookItem?.itemId;
        if (!ebookId) return;
        if (ebookFileUrl) {
          setEbookLink(ebookFileUrl);
          return;
        }
        const res = await fetch(
          `/api/ebooks/${encodeURIComponent(String(ebookId))}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => ({} as any));
        const link = json?.data?.previewUrl || null;
        if (!cancelled) setEbookLink(link);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [order, ebookFileUrl, primaryEbookItem?.itemId]);

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">ยืนยันการสั่งซื้อ</h1>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <Button
              variant="outline"
              onClick={() => router.push("/profile/orders")}
            >
              กลับไปหน้าคำสั่งซื้อ
            </Button>
            <Button variant="outline" onClick={refreshOrder} className="gap-2">
              <RefreshCw className="h-4 w-4" /> รีเฟรชสถานะ
            </Button>
          </div>
        </div>
        {loading && <div className="text-gray-600">กำลังโหลด...</div>}
        {!loading && error && <div className="text-red-600">{error}</div>}
        {enrollErr && (
          <div className="text-red-600 text-sm">
            ลงทะเบียนอัตโนมัติไม่สำเร็จ: {enrollErr}
          </div>
        )}
      </div>

      {!loading && order && (
        <>
          <div className="bg-white/60 rounded-lg border p-4">
            {(() => {
              const s = (order?.status || "").toUpperCase();
              const ps = (order?.payment?.status || "").toUpperCase();
              const step2Done =
                hasUploadedSlip || isPaidLikeStatus(s) || isPaidLikeStatus(ps);
              const step2Active =
                ["PENDING", "PENDING_VERIFICATION"].includes(s) || step2Done;
              const step3Done =
                hasUploadedSlip || isPaidLikeStatus(s) || isPaidLikeStatus(ps);
              const step2Label =
                !step2Done &&
                (s === "PENDING_VERIFICATION" || ps === "PENDING_VERIFICATION")
                  ? "ตรวจสอบ"
                  : "ชำระเงิน";
              return (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-max">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-yellow-700">
                      สั่งซื้อ
                    </span>
                  </div>
                  <div
                    className={`h-0.5 flex-1 ${
                      step2Active ? "bg-yellow-500" : "bg-gray-200"
                    }`}
                  />
                  <div className="flex items-center gap-2 min-w-max">
                    {step2Done ? (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500 text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-yellow-500 text-yellow-600">
                        2
                      </span>
                    )}
                    <span
                      className={`text-sm font-medium ${
                        step2Active ? "text-yellow-700" : "text-gray-500"
                      }`}
                    >
                      {step2Label}
                    </span>
                  </div>
                  <div
                    className={`h-0.5 flex-1 ${
                      step3Done ? "bg-yellow-500" : "bg-gray-200"
                    }`}
                  />
                  <div className="flex items-center gap-2 min-w-max">
                    {step3Done ? (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-600 text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-200 text-gray-500">
                        3
                      </span>
                    )}
                    <span
                      className={`text-sm font-medium ${
                        step3Done ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      สำเร็จ
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : isPending ? (
                        <Clock className="h-6 w-6 text-amber-500" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      )}
                      <CardTitle className="text-lg truncate max-w-[250px] md:max-w-full ">
                        คำสั่งซื้อ #{orderDisplayId}
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600">สถานะ:</span>
                      {statusBadge(paymentStatus)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {hasUploadedSlip && !isCompleted && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      การสมัครเสร็จสมบูรณ์{" "}
                      <span className="block text-xs sm:text-sm text-green-600">
                        (ระบบกำลังตรวจสอบสลิป ภายใน 24 ชั่วโมงเพื่อเข้าเรียน)
                      </span>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">ประเภทสินค้า</div>
                      <div className="font-medium text-gray-900">
                        {itemTypeSummary}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">ยอดรวม</div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        วันที่สั่งซื้อ
                      </div>
                      <div className="text-gray-900">
                        {new Date(order.createdAt).toLocaleString("th-TH")}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        หมายเลขคำสั่งซื้อ
                      </div>
                      <div className="text-gray-900 inline-flex flex-wrap items-center gap-2">
                        <span className="font-medium">#{orderDisplayId}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigator.clipboard?.writeText(
                              String(orderDisplayId)
                            )
                          }
                        >
                          คัดลอก
                        </Button>
                      </div>
                      {order.orderNumber && order.orderNumber !== order.id && (
                        <div className="text-xs text-gray-500 break-all">
                          รหัสอ้างอิงระบบ: {order.id}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        ช่องทางชำระเงิน
                      </div>
                      <div className="text-gray-900">
                        {toPaymentMethodLabel(order.payment?.method)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">ยอดที่ชำระ</div>
                      <div className="text-gray-900">
                        {formatCurrency(order.payment?.amount ?? order.total)}
                      </div>
                      {order.payment?.paidAt && (
                        <div className="text-xs text-gray-500">
                          ชำระเมื่อ:{" "}
                          {new Date(order.payment.paidAt).toLocaleString(
                            "th-TH"
                          )}
                        </div>
                      )}
                    </div>
                    {order.payment?.ref && (
                      <div className="space-y-1 sm:col-span-2">
                        <div className="text-sm text-gray-600">
                          เลขอ้างอิงการชำระ
                        </div>
                        <div className="inline-flex flex-wrap items-center gap-2 text-gray-900">
                          <span className="font-medium break-all">
                            {order.payment.ref}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigator.clipboard?.writeText(
                                String(order.payment!.ref)
                              )
                            }
                          >
                            คัดลอก
                          </Button>
                        </div>
                      </div>
                    )}
                    {order.couponCode && (
                      <div className="space-y-1 sm:col-span-2">
                        <div className="text-sm text-gray-600">คูปองที่ใช้</div>
                        <div className="inline-flex flex-wrap items-center gap-2">
                          <Badge className="border border-amber-200 bg-amber-100 text-amber-700">
                            {order.couponCode}
                          </Badge>
                          {Number(order.couponDiscount) > 0 && (
                            <span className="text-xs text-gray-600">
                              ลด {formatCurrency(order.couponDiscount)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {displayItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        รายการสินค้า
                      </div>
                      <div className="divide-y rounded-lg border bg-gray-50/60">
                        {displayItems.map((item) => {
                          const qty = Number(item.quantity || 1);
                          const unit = Number(
                            item.unitPrice ?? item.totalPrice ?? 0
                          );
                          const total = Number(item.totalPrice ?? unit * qty);
                          const key =
                            item.id || `${item.itemType}-${item.itemId}`;
                          return (
                            <div
                              key={key}
                              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">
                                  {item.title || toItemTypeLabel(item.itemType)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ประเภท: {toItemTypeLabel(item.itemType)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  จำนวน: {qty}
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-semibold text-gray-900">
                                  {formatCurrency(total)}
                                </div>
                                {qty > 1 && (
                                  <div className="text-xs text-gray-500">
                                    ({formatCurrency(unit)} / ชิ้น)
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 sm:max-w-md">
                    <div className="text-sm font-medium text-gray-700">
                      สรุปราคา
                    </div>
                    <div className="overflow-hidden rounded-lg border bg-white">
                      {summaryRows.map((row, idx) => {
                        const isLast = idx === summaryRows.length - 1;
                        const common = row.accent
                          ? "py-3 text-sm font-semibold text-gray-900"
                          : "py-2 text-sm text-gray-700";
                        const border = !isLast ? "border-b" : "";
                        return (
                          <div
                            key={`${row.label}-${idx}`}
                            className={`flex items-center justify-between px-4 ${common} ${border}`}
                          >
                            <span>{row.label}</span>
                            <span>{row.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {needsShipping && (
                    <div className="space-y-2 border-t pt-4 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium inline-flex items-center">
                          <MapPin className="h-4 w-4 mr-2" /> ที่อยู่จัดส่ง
                        </div>
                      </div>

                      {normalizedShipping ? (
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {normalizedShipping.name} • {normalizedShipping.phone}
                          {"\n"}
                          {normalizedShipping.address}
                          {"\n"}
                          {normalizedShipping.district}{" "}
                          {normalizedShipping.province}{" "}
                          {normalizedShipping.postalCode}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">
                          ไม่ได้เพิ่มที่อยู่จัดส่ง
                        </div>
                      )}
                      {(order as any)?.shipping?.status && (
                        <div className="text-xs text-gray-500">
                          สถานะจัดส่ง: {(order as any).shipping.status}
                        </div>
                      )}
                      {(order as any)?.shipping?.shippingMethod && (
                        <div className="text-xs text-gray-500">
                          ช่องทางจัดส่ง:{" "}
                          {(order as any).shipping.shippingMethod}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {/* {isPending && (
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setOpenUpload(true)}>
                        อัพโหลดสลิป
                      </Button>
                    )} */}

                    {isCompleted && courseItems.length > 0 && (
                      <div className="flex flex-col gap-2 w-full">
                        {courseItems.map((ci) => {
                          const cid = String(ci.itemId);
                          const title = ci.title || courseTitle || "คอร์สเรียน";
                          const status = enrollmentStatus[cid];
                          const showRetry =
                            canManualEnroll && status === "missing";
                          const err = enrollErrByCourse[cid];
                          return (
                            <div
                              key={`course-actions-${cid}`}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/profile/my-courses/course/${cid}`
                                  )
                                }
                                className="bg-yellow-400 hover:bg-yellow-500 text-white"
                                aria-label={`เข้าเรียน ${title}`}
                              >
                                เข้าเรียน
                                {courseItems.length > 1 ? ` • ${title}` : ""}
                              </Button>
                              {showRetry && (
                                <Button
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await enrollUser(
                                        getSafeUserId(user)!,
                                        cid,
                                        order.id
                                      );
                                      setEnrollErrByCourse((prev) => ({
                                        ...prev,
                                        [cid]: null,
                                      }));
                                      setEnrollmentStatus((prev) => ({
                                        ...prev,
                                        [cid]: "exists",
                                      }));
                                    } catch (e: any) {
                                      setEnrollErrByCourse((prev) => ({
                                        ...prev,
                                        [cid]: e?.message || "Enroll ไม่สำเร็จ",
                                      }));
                                    }
                                  }}
                                >
                                  ลองลงทะเบียนอีกครั้ง
                                </Button>
                              )}
                              {status === "loading" && (
                                <span className="text-xs text-gray-500">
                                  กำลังตรวจสอบสิทธิ์เข้าเรียน…
                                </span>
                              )}
                              {status === "error" && (
                                <span className="text-xs text-red-600">
                                  ตรวจสอบสิทธิ์ไม่สำเร็จ
                                </span>
                              )}
                              {typeof err === "string" && err && (
                                <span className="text-xs text-red-600">
                                  {err}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isCompleted &&
                      (ebookItems.length > 0 || order?.ebook) &&
                      (ebookFileUrl || ebookLink) && (
                        <>
                          <Button
                            className="bg-yellow-400 hover:bg-yellow-500 text-white"
                            onClick={() => {
                              const name = `${
                                order.ebook?.title ||
                                primaryEbookItem?.title ||
                                "ebook"
                              }.pdf`;
                              const url = `/api/proxy-view?url=${encodeURIComponent(
                                ebookFileUrl || ebookLink || ""
                              )}&filename=${encodeURIComponent(name)}`;
                              window.open(url, "_blank");
                            }}
                          >
                            อ่าน eBook
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const name = `${
                                order.ebook?.title ||
                                primaryEbookItem?.title ||
                                "ebook"
                              }.pdf`;
                              const url = `/api/proxy-download-pdf?url=${encodeURIComponent(
                                ebookFileUrl || ebookLink || ""
                              )}&filename=${encodeURIComponent(name)}`;
                              window.open(url, "_blank");
                            }}
                          >
                            ดาวน์โหลด eBook
                          </Button>
                        </>
                      )}
                  </div>

                  {isCompleted &&
                    order.orderType === "COURSE" &&
                    !isAuthenticated && (
                      <div className="text-sm text-amber-600">
                        โปรดเข้าสู่ระบบเพื่อเปิดสิทธิ์เรียนอัตโนมัติ
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>สถานะการตรวจสลิป</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm text-gray-700">
                      สถานะคำสั่งซื้อ:
                    </div>
                    {statusBadge(paymentStatus)}
                  </div>

                  {slipUrl && (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative h-24 w-40 overflow-hidden rounded border">
                        <Image
                          src={slipUrl}
                          alt="สลิปโอนเงิน"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <a
                        href={slipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 underline"
                      >
                        เปิดสลิปต้นฉบับ
                      </a>
                    </div>
                  )}

                  {slipInfo && (
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        ผลตรวจ SlipOK:{" "}
                        <span className="font-medium">
                          {slipInfo.slipOKSuccess ? "สำเร็จ" : "ไม่สำเร็จ"}
                        </span>
                      </div>
                      {typeof slipInfo.detectedAmount !== "undefined" &&
                        slipInfo.detectedAmount !== null && (
                          <div>
                            จำนวนเงินที่ตรวจพบ:{" "}
                            <span className="font-medium">
                              ฿
                              {Number(slipInfo.detectedAmount).toLocaleString()}
                            </span>
                          </div>
                        )}
                      {slipInfo.detectedDate && (
                        <div>
                          วันที่โอนที่ตรวจพบ:{" "}
                          <span className="font-medium">
                            {String(slipInfo.detectedDate)}
                          </span>
                        </div>
                      )}
                      {slipInfo.summary && (
                        <div className="sm:col-span-2 text-gray-700">
                          สรุปการตรวจสอบ: ผ่าน {slipInfo.summary.passed || 0} •
                          เตือน {slipInfo.summary.warnings || 0} • ไม่ผ่าน{" "}
                          {slipInfo.summary.failed || 0}
                        </div>
                      )}
                    </div>
                  )}

                  {!slipUrl && (
                    <div className="text-sm text-gray-600">
                      ยังไม่มีสลิปกรอกเข้ามา กรุณาอัพโหลดหลักฐานการชำระเงิน
                    </div>
                  )}
                </CardContent>
              </Card>

              {(isPending || paymentStatus === "PENDING_VERIFICATION") && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>วิธีชำระเงินโดยการโอน</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative h-6 w-[140px]">
                        <Image
                          src="/kbank-logo.png"
                          alt="ธนาคารกสิกรไทย"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Badge className="bg-yellow-400 text-white">
                        โอนผ่าน Mobile Banking
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {/* <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-gray-700">เลขบัญชี</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold tracking-wider">
                            107-889-8751
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigator.clipboard?.writeText("1078898751")
                            }
                          >
                            คัดลอก
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-gray-700">ชื่อบัญชี</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            นาย เชษฐา พวงบุบผา
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigator.clipboard?.writeText(
                                "นาย เชษฐา พวงบุบผา"
                              )
                            }
                          >
                            คัดลอก
                          </Button>
                        </div>
                      </div> */}
                      <div className="border-t border-gray-200 my-4"></div>
                      <BankingInfo />
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-gray-700">ยอดที่ต้องชำระ</span>
                        <span className="font-semibold">
                          ฿{order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* <QRCODE/> */}

                    <div className="text-xs text-gray-500">
                      หลังโอนแล้ว กรุณาอัพโหลดสลิป ระบบจะตรวจสอบใช้เวลาโดยประมาณ
                      5-10 นาที
                    </div>
                    <div className="pt-1">
                      <Button
                        className="bg-yellow-400 hover:bg-yellow-500 text-white w-full"
                        onClick={() => setOpenUpload(true)}
                      >
                        อัพโหลดสลิป
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Dialog open={openUpload} onOpenChange={setOpenUpload}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {filePreview && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">
                      ตัวอย่างรูปที่เลือก
                    </div>
                    <div className="relative border rounded-md overflow-hidden bg-gray-50">
                      <img
                        src={filePreview}
                        alt="ตัวอย่างสลิป"
                        className="max-h-72 w-full object-contain"
                      />
                    </div>
                  </div>
                )}
                {uploadMsg && (
                  <div
                    aria-live="polite"
                    className={
                      uploadMsg.includes("สำเร็จ") ||
                      uploadMsg.includes("อนุมัติ")
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {uploadMsg}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpenUpload(false)}
                  >
                    ปิด
                  </Button>
                  <Button
                    disabled={!file || uploading}
                    onClick={uploadSlip}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white"
                  >
                    {uploading ? "กำลังอัพโหลด..." : "อัพโหลดสลิป"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
