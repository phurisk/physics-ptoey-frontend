"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import http from "@/lib/http";
import { useAuth } from "@/components/auth-provider";
import LoginModal from "@/components/login-modal";

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
};

export default function AllBooksPage() {
  const router = useRouter();
  const handleDetails = (ebookId: string) => {
    router.push(`/books/${encodeURIComponent(String(ebookId))}`);
  };
  const { isAuthenticated } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await http.get(`/api/ebook-categories`);
        const json: any = res.data || {};
        const list: any[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        const mapped = list
          .filter((c) => c?.isActive !== false)
          .map((c: any, idx: number) => {
            const slug: string =
              c?.slug ||
              String(c?.name || `cat-${idx}`)
                .toLowerCase()
                .replace(/\s+/g, "-");
            return { id: String(c?.id ?? slug), name: c?.name || slug, slug };
          });
        const withAll = [{ id: "all", name: "ทั้งหมด", slug: "" }, ...mapped];
        if (!cancelled) setCategories(withAll);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadBooks = async (catId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const slug =
        categories.find((c) => c.id === (catId || selectedCategory))?.slug ||
        "";
      const params = slug ? { category: slug } : undefined;
      const res = await http.get(`/api/ebooks`, { params });
      const json = res.data;
      setEbooks(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  const onSelectCategory = (id: string) => {
    setSelectedCategory(id);
    loadBooks(id);
  };

  const calculateDiscount = (original: number, discounted: number) => {
    if (!original || original <= 0) return 0;
    return Math.round(((original - discounted) / original) * 100);
  };

  const handleBuy = (ebookId: string) => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    router.push(`/checkout/ebook/${encodeURIComponent(String(ebookId))}`);
  };

  return (
    <section className="pt-10 pb-10 lg:pt-16 lg:pb-12 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            หนังสือทั้งหมด
          </h1>
          <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            เลือกดูหนังสือเรียนฟิสิกส์ทั้งหมด และกรองตามหมวดหมู่
          </p>
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={selectedCategory === c.id ? "default" : "outline"}
              onClick={() => onSelectCategory(c.id)}
              className={`px-5 rounded-full ${
                selectedCategory === c.id ? "bg-yellow-400 text-white" : ""
              }`}
            >
              {c.name}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={`sk-${i}`} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-[640/906] relative">
                    <Skeleton className="absolute inset-0" />
                  </div>
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ebooks.map((book) => {
              const hasDiscount =
                (book.discountPrice || 0) > 0 &&
                book.discountPrice < book.price;
              const percent = hasDiscount
                ? Math.round(
                    ((book.price - book.discountPrice) / book.price) * 100
                  )
                : 0;

              return (
                <Card key={book.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative aspect-[640/906] bg-white">
                      <Image
                        src={
                          book.coverImageUrl ||
                          "/placeholder.svg?height=200&width=350"
                        }
                        alt={book.title}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {hasDiscount && (
                        <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                          -{percent}%
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="font-semibold text-gray-900 line-clamp-2">
                        {book.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {book.author || "ไม่ระบุผู้เขียน"}
                      </div>
                      <div className="flex items-baseline gap-2">
                        {hasDiscount ? (
                          <>
                            <div className="text-lg font-bold text-yellow-600">
                              ฿{book.discountPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 line-through">
                              ฿{book.price.toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-bold text-gray-900">
                            ฿{book.price.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="pt-1">
                        <Button
                          className="bg-yellow-400 hover:bg-yellow-500 text-white w-full"
                          onClick={() => handleDetails(book.id)}
                        >
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    </section>
  );
}
