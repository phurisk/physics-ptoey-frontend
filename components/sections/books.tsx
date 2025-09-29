"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";
import LoginModal from "@/components/login-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import http from "@/lib/http";

type Ebook = {
  id: string;
  title: string;
  description?: string | null;
  author?: string | null;
  price: number;
  discountPrice: number;
  coverImageUrl?: string | null;
  averageRating?: number;
  isPhysical?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
};

export default function Books() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const handleDetails = (ebookId: string) => {
    router.push(`/books/${encodeURIComponent(String(ebookId))}`);
  };
  const [loginOpen, setLoginOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string;
    total: number;
  } | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [ownedOpen, setOwnedOpen] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Ebook | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    district: "",
    province: "",
    postalCode: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await http.get(`/api/ebooks`);
        if (res.status < 200 || res.status >= 300)
          throw new Error(`HTTP ${res.status}`);
        const json = res.data;
        if (!cancelled) {
          const list: Ebook[] = Array.isArray(json?.data) ? json.data : [];
          const featuredActive = list.filter(
            (b) => b?.isActive === true && b?.isFeatured === true
          );
          setEbooks(featuredActive);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const calculateDiscount = (original: number, discounted: number) => {
    if (!original || original <= 0) return 0;
    return Math.round(((original - discounted) / original) * 100);
  };

  const handleBuy = async (ebookId: string) => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    router.push(`/checkout/ebook/${encodeURIComponent(String(ebookId))}`);
  };

  const applyCoupon = async () => {
    if (!selectedBook) return;
    if (!couponCode) {
      setCouponError("กรอกรหัสคูปอง");
      return;
    }
    try {
      setValidatingCoupon(true);
      setCouponError(null);
      const subtotal = selectedBook.discountPrice || selectedBook.price;
      const res = await http.post(`/api/coupons/validate`, {
        code: couponCode,
        userId: user?.id ?? "guest",
        itemType: "ebook",
        itemId: selectedBook.id,
        subtotal,
      });
      const json = res.data || {};
      if (res.status < 200 || res.status >= 300 || json?.success === false)
        throw new Error(json?.error || "ใช้คูปองไม่สำเร็จ");
      const d = Number(json?.data?.discount || 0);
      setDiscount(d);
    } catch (e: any) {
      setCouponError(e?.message ?? "ใช้คูปองไม่สำเร็จ");
      setDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const confirmPurchase = async () => {
    if (!selectedBook) return;
    try {
      setCreating(true);
      setPurchaseError(null);

      if (user?.id && selectedBook?.id) {
        try {
          const res0 = await http.get(`/api/orders`, {
            params: { userId: user.id },
          });
          const json0: any = res0.data || {};
          const list: any[] = Array.isArray(json0?.data)
            ? json0.data
            : Array.isArray(json0)
            ? json0
            : [];
          const exists = list.find((o: any) => {
            const t = String(o?.orderType || o?.type || "").toUpperCase();
            const status = String(o?.status || "").toUpperCase();
            const ebookId =
              o?.ebook?.id ||
              o?.ebookId ||
              (t === "EBOOK" ? o?.itemId || o?.itemID : undefined);
            const isCancelled = ["CANCELLED", "REJECTED"].includes(status);
            return (
              t === "EBOOK" &&
              ebookId &&
              String(ebookId) === String(selectedBook.id) &&
              !isCancelled
            );
          });
          if (exists) {
            const status = String(exists?.status || "").toUpperCase();
            const payStatus = String(
              exists?.payment?.status || ""
            ).toUpperCase();
            const eff = payStatus || status;
            const isPending = ["PENDING", "PENDING_VERIFICATION"].includes(eff);
            setPurchaseOpen(false);
            if (isPending) {
              setOrderInfo({
                orderId: String(exists.id),
                total: Number(exists.total || 0),
              });
              setUploadOpen(true);
            } else {
              setOwnedOpen(true);
            }
            setCreating(false);
            return;
          }
        } catch {}
      }
      const payload: any = {
        userId: user?.id,
        items: [
          {
            itemType: "EBOOK",
            itemId: selectedBook.id,
            title: selectedBook.title,
            quantity: 1,
            unitPrice: selectedBook.discountPrice || selectedBook.price,
          },
        ],
      };
      if (couponCode) payload.couponCode = couponCode;
      if (selectedBook.isPhysical) payload.shippingAddress = shipping;
      const res = await http.post(`/api/orders`, payload);
      const json = res.data || {};
      if (res.status < 200 || res.status >= 300 || json?.success === false)
        throw new Error(json?.error || "สั่งซื้อไม่สำเร็จ");
      setPurchaseOpen(false);
      if (json?.data?.isFree) {
        router.push(`/order-success/${json?.data?.orderId}`);
      } else {
        setOrderInfo({
          orderId: json?.data?.orderId,
          total: json?.data?.total,
        });
        setUploadOpen(true);
      }
    } catch (e: any) {
      const msg = e?.message || "สั่งซื้อไม่สำเร็จ";
      if (
        msg.includes("ซื้อแล้ว") ||
        msg.includes("ได้ซื้อ") ||
        msg.includes("สินค้านี้แล้ว")
      ) {
        setPurchaseOpen(false);
        setOwnedOpen(true);
      } else {
        setPurchaseError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const uploadSlip = async () => {
    if (!orderInfo || !slip) return;
    try {
      setUploading(true);
      setUploadMsg(null);
      setUploadProgress(0);
      const form = new FormData();
      form.append("orderId", orderInfo.orderId);
      form.append("file", slip);
      const res = await http.post(`/api/payments/upload-slip`, form, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.round((evt.loaded * 100) / evt.total);
            setUploadProgress(pct);
          }
        },
      });
      const json = res.data || {};
      if (res.status < 200 || res.status >= 300 || json?.success === false)
        throw new Error(json?.error || "อัพโหลดไม่สำเร็จ");
      setUploadMsg("อัพโหลดสลิปสำเร็จ กำลังรอตรวจสอบ");
    } catch (e: any) {
      setUploadMsg(e?.message ?? "อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!slip) {
      if (slipPreview) {
        try {
          URL.revokeObjectURL(slipPreview);
        } catch {}
      }
      setSlipPreview(null);
      return;
    }
    const url = URL.createObjectURL(slip);
    setSlipPreview(url);
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };
  }, [slip]);

  return (
    <>
      <section className="pt-0 pb-10 lg:pt-24 lg:pb-5 bg-white">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 text-balance bg-[#ffbf00] px-8 py-4 w-fit mx-auto rounded-full shadow-sm">
              หนังสือของเรา
            </h2>
            <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
              หนังสือเรียนฟิสิกส์คุณภาพสูง เขียนโดยอาจารย์เต้ย
              พร้อมเทคนิคการแก้โจทย์ที่เข้าใจง่าย
            </p>
          </div>

          <div
            className="
            grid grid-cols-2        
            md:grid-cols-2          
            lg:grid-cols-4          
            gap-3 md:gap-8          
          "
          >
            {loading && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={`skeleton-${i}`} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative">
                        <div className="aspect-[640/906] w-full overflow-hidden">
                          <Skeleton className="h-full w-full" />
                        </div>

                        <Skeleton className="absolute top-2 right-2 lg:top-4 lg:right-4 h-5 w-12 rounded-full" />
                      </div>

                      <div className="p-3 md:p-6 space-y-3 md:space-y-4">
                        <Skeleton className="h-4 md:h-5 w-4/5" />
                        <Skeleton className="hidden md:block h-4 w-3/5" />

                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-10" />
                        </div>

                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 md:h-7 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>

                        <Skeleton className="h-9 md:h-11 w-full rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
            {!loading && error && (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-red-600 py-10">
                โหลดข้อมูลไม่สำเร็จ: {error}
              </div>
            )}
            {!loading && !error && ebooks.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-gray-500 py-10">
                ยังไม่มีรายการหนังสือ
              </div>
            )}
            {!loading &&
              !error &&
              ebooks.map((book) => (
                <Card
                  key={book.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden pt-0"
                >
                  <CardContent className="p-0">
                    <div className="aspect-[640/906] relative overflow-hidden">
                      <Image
                        src={book.coverImageUrl || "/placeholder.svg"}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-102 transition-transform duration-300"
                      />

                      <Badge
                        className="
                      absolute top-2 right-2 lg:top-4 lg:right-4
                      bg-red-500 text-white text-[10px] lg:text-xs
                      px-1.5 py-0.5 lg:px-2 lg:py-0.5 
                    "
                      >
                        -{calculateDiscount(book.price, book.discountPrice)}%
                      </Badge>
                    </div>

                    <div className="p-3 md:p-6">
                      <h3 className="text-sm md:text-xl font-semibold text-gray-900 mb-2 md:mb-3 text-balance line-clamp-2">
                        {book.title}
                      </h3>

                      <p className="hidden md:block text-gray-600 mb-4 text-pretty leading-relaxed line-clamp-2 lg:line-clamp-3">
                        {book.description || ""}
                      </p>

                      <div className="flex items-center mb-3 md:mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 fill-current"
                            />
                          ))}
                        </div>
                        <span className="text-xs md:text-sm text-gray-500 ml-2">
                          ({(book.averageRating ?? 0).toFixed(1)})
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg md:text-2xl font-bold text-yellow-600">
                            ฿{book.discountPrice}
                          </span>
                          <span className="text-sm md:text-lg text-gray-400 line-through">
                            ฿{book.price}
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-medium py-2 md:py-3 text-sm md:text-base"
                        onClick={() => handleDetails(book.id)}
                        disabled={creating}
                      >
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          <div className="text-center mt-10 lg:mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-yellow-400 text-yellow-600 hover:bg-yellow-50 bg-transparent h-10 px-4 text-sm md:h-12 md:px-6 md:text-base"
              onClick={() => router.push("/books")}
            >
              ดูหนังสือเพิ่มเติม
            </Button>
          </div>
        </div>
      </section>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการสั่งซื้อหนังสือ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {purchaseError && (
              <div className="text-sm text-red-600">{purchaseError}</div>
            )}
            <div className="text-sm text-gray-700">
              สินค้า: <span className="font-medium">{selectedBook?.title}</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">คูปองส่วนลด</div>
              <div className="flex gap-2">
                <Input
                  placeholder="กรอกรหัสคูปอง (ถ้ามี)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={validatingCoupon}
                  onClick={applyCoupon}
                >
                  {validatingCoupon ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    "ใช้คูปอง"
                  )}
                </Button>
              </div>
              {couponError && (
                <div className="text-xs text-red-600">{couponError}</div>
              )}
              {!couponError && discount > 0 && !validatingCoupon && (
                <div className="text-xs text-green-600">
                  ใช้คูปองสำเร็จ ได้รับส่วนลดจำนวน ฿{discount.toLocaleString()}{" "}
                  บาท
                </div>
              )}
            </div>
            {selectedBook?.isPhysical && (
              <div className="space-y-2">
                <div className="text-sm font-medium">ที่อยู่จัดส่ง</div>
                <div className="grid md:grid-cols-2 gap-2">
                  <Input
                    placeholder="ชื่อผู้รับ"
                    value={shipping.name}
                    onChange={(e) =>
                      setShipping({ ...shipping, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="เบอร์โทร"
                    value={shipping.phone}
                    onChange={(e) =>
                      setShipping({ ...shipping, phone: e.target.value })
                    }
                  />
                </div>
                <Input
                  placeholder="ที่อยู่"
                  value={shipping.address}
                  onChange={(e) =>
                    setShipping({ ...shipping, address: e.target.value })
                  }
                />
                <div className="grid md:grid-cols-3 gap-2">
                  <Input
                    placeholder="อำเภอ/เขต"
                    value={shipping.district}
                    onChange={(e) =>
                      setShipping({ ...shipping, district: e.target.value })
                    }
                  />
                  <Input
                    placeholder="จังหวัด"
                    value={shipping.province}
                    onChange={(e) =>
                      setShipping({ ...shipping, province: e.target.value })
                    }
                  />
                  <Input
                    placeholder="รหัสไปรษณีย์"
                    value={shipping.postalCode}
                    onChange={(e) =>
                      setShipping({ ...shipping, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">ยอดชำระ</div>
              <div className="text-lg font-semibold text-gray-900">
                ฿
                {Math.max(
                  0,
                  (selectedBook
                    ? selectedBook.discountPrice || selectedBook.price
                    : 0) - (discount || 0)
                ).toLocaleString()}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPurchaseOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                disabled={creating}
                onClick={confirmPurchase}
                className="bg-yellow-400 hover:bg-yellow-500 text-white"
              >
                {creating ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={ownedOpen} onOpenChange={setOwnedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>คุณได้ซื้อสินค้านี้แล้ว</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-gray-700">
              ตรวจสอบคำสั่งซื้อและสถานะการชำระเงินในหน้าคำสั่งซื้อของฉัน
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOwnedOpen(false)}>
                ปิด
              </Button>
              <Button
                className="bg-yellow-400 hover:bg-yellow-500 text-white"
                onClick={() => {
                  setOwnedOpen(false);
                  router.push("/profile/orders");
                }}
              >
                ไปหน้าคำสั่งซื้อ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              ยอดชำระ: ฿{(orderInfo?.total ?? 0).toLocaleString()}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setSlip(e.target.files?.[0] || null)}
            />
            {slipPreview && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">
                  ตัวอย่างรูปที่เลือก
                </div>
                <div className="relative border rounded-md overflow-hidden bg-gray-50">
                  <img
                    src={slipPreview}
                    alt="ตัวอย่างสลิป"
                    className="max-h-72 w-full object-contain"
                  />
                </div>
              </div>
            )}
            {uploadMsg && (
              <div
                className={
                  uploadMsg.includes("สำเร็จ")
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {uploadMsg}
              </div>
            )}
            <div className="flex justify-end gap-2">
              {orderInfo && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/order-success/${orderInfo.orderId}`)
                  }
                  className="mr-auto"
                >
                  รายละเอียดคำสั่งซื้อ
                </Button>
              )}
              <Button variant="outline" onClick={() => setUploadOpen(false)}>
                ปิด
              </Button>
              <Button
                disabled={!slip || uploading}
                onClick={uploadSlip}
                className="bg-yellow-400 hover:bg-yellow-500 text-white"
              >
                {uploading ? `กำลังอัพโหลด ${uploadProgress}%` : "อัพโหลดสลิป"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
