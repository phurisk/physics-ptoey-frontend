"use client";

import {
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import http from "@/lib/http";
import { useAuth } from "@/components/auth-provider";
import LoginModal from "@/components/login-modal";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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
  category?: {
    id: string;
    name?: string | null;
    slug?: string | null;
  } | null;
};

export default function AllBooksPage() {
  const router = useRouter();
  const handleDetails = (ebookId: string) => {
    router.push(`/books/${encodeURIComponent(String(ebookId))}`);
  };
  const { isAuthenticated } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const [allEbooks, setAllEbooks] = useState<Ebook[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompactPagination, setIsCompactPagination] = useState(false);

  const PAGE_SIZE = 8;

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
        if (!cancelled) {
          setCategories(withAll);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyCategoryFilter = (categoryId: string, source: Ebook[]) => {
    if (!Array.isArray(source) || source.length === 0) {
      setEbooks(categoryId === "all" ? source : []);
      return;
    }
    if (categoryId === "all") {
      setEbooks(source);
      return;
    }

    const selected = categories.find((c) => c.id === categoryId);
    const slug = selected?.slug?.trim();
    const name = selected?.name?.trim();
    const id = selected?.id ? String(selected.id) : undefined;

    const filtered = source.filter((ebook) => {
      const cat = ebook.category;
      const fallbackName = (ebook as any)?.categoryName as string | undefined;
      const fallbackSlug = (ebook as any)?.categorySlug as string | undefined;
      const fallbackId = (ebook as any)?.categoryId as string | number | undefined;
      const catSlug = cat?.slug?.trim();
      const catName = cat?.name?.trim();
      const catId = cat?.id ? String(cat.id) : undefined;
      return (
        (slug && catSlug === slug) ||
        (slug && fallbackSlug && fallbackSlug === slug) ||
        (id && catId === id) ||
        (id && fallbackId && String(fallbackId) === id) ||
        (name && catName === name)
        || (name && fallbackName && fallbackName === name)
      );
    });
    setEbooks(filtered);
  };

  const loadBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get(`/api/ebooks`);
      const json = res.data;
      const list = Array.isArray(json?.data) ? (json.data as Ebook[]) : [];
      setAllEbooks(list);
      return list;
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      setAllEbooks([]);
      setEbooks([]);
      return [] as Ebook[];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks()
      .then((list) => {
        applyCategoryFilter(selectedCategory, list);
      })
      .catch(() => {});
  }, [categories.length]);

  const onSelectCategory = (id: string) => {
    setSelectedCategory(id);
    setCurrentPage(1);
    applyCategoryFilter(id, allEbooks);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 480px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsCompactPagination(event.matches);
    };
    setIsCompactPagination(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleChange);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(handleChange);
    }
    return () => {
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", handleChange);
      } else if (typeof mq.removeListener === "function") {
        mq.removeListener(handleChange);
      }
    };
  }, []);

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

  useEffect(() => {
    applyCategoryFilter(selectedCategory, allEbooks);
  }, [allEbooks, selectedCategory, categories]);

  useEffect(() => {
    setCurrentPage((prev) => {
      if (!Number.isFinite(prev) || prev < 1) return 1;
      const pages = Math.max(1, Math.ceil((ebooks.length || 0) / PAGE_SIZE));
      return Math.min(prev, pages);
    });
  }, [ebooks.length]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((ebooks.length || 0) / PAGE_SIZE)),
    [ebooks.length, PAGE_SIZE]
  );

  const buildPageList = useMemo<(number | "...")[]>(() => {
    if (totalPages <= 1) return [1];
    if (isCompactPagination) {
      const visible = 3;
      if (totalPages <= visible) {
        return Array.from({ length: totalPages }, (_, idx) => idx + 1);
      }
      let start = currentPage - Math.floor(visible / 2);
      start = Math.max(1, start);
      let end = start + visible - 1;
      if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - visible + 1);
      }
      return Array.from({ length: visible }, (_, idx) => start + idx);
    }
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    const pages: Array<number | "..."> = [1];
    const middleStart = Math.max(2, currentPage - 2);
    const middleEnd = Math.min(totalPages - 1, currentPage + 2);
    if (middleStart > 2) pages.push("...");
    for (let p = middleStart; p <= middleEnd; p += 1) pages.push(p);
    if (middleEnd < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages, isCompactPagination]);

  const paginationControls = useMemo<ReactNode[]>(() => {
    const controls: ReactNode[] = [];
    const createButton = (
      key: string,
      icon: ReactNode,
      onClick: () => void,
      disabled: boolean
    ) => (
      <Button
        key={key}
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-0 hover:bg-yellow-50 hover:border-yellow-400"
      >
        {icon}
      </Button>
    );

    controls.push(
      createButton("first", <ChevronsLeft className="h-4 w-4" />, () => setCurrentPage(1), currentPage === 1)
    );
    controls.push(
      createButton(
        "prev",
        <ChevronLeft className="h-4 w-4" />,
        () => setCurrentPage((prev) => Math.max(1, prev - 1)),
        currentPage === 1
      )
    );

    controls.push(
      ...buildPageList.map((page, idx) => {
        if (page === "...") {
          return (
            <span
              key={`dots-${idx}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400"
            >
              &#8230;
            </span>
          );
        }
        const isActive = currentPage === page;
        const className = [
          "flex h-9 min-w-[2.5rem] shrink-0 items-center justify-center rounded-full px-0",
          isActive
            ? "bg-yellow-400 hover:bg-yellow-500 text-white"
            : "hover:bg-yellow-50 hover:border-yellow-400",
        ].join(" ");
        return (
          <Button
            key={`page-${page}`}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page as number)}
            className={className}
          >
            {page}
          </Button>
        );
      })
    );

    controls.push(
      createButton(
        "next",
        <ChevronRight className="h-4 w-4" />,
        () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
        currentPage === totalPages
      )
    );
    controls.push(
      createButton(
        "last",
        <ChevronsRight className="h-4 w-4" />,
        () => setCurrentPage(totalPages),
        currentPage === totalPages
      )
    );

    return controls;
  }, [buildPageList, currentPage, totalPages]);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return ebooks.slice(start, end);
  }, [currentPage, ebooks, PAGE_SIZE]);

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={`sk-${i}`} className="overflow-hidden py-0">
                <CardContent className="p-0">
                  <div className="aspect-[3/4] relative">
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

        {!loading && !error && ebooks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedBooks.map((book) => {
              const hasDiscount =
                (book.discountPrice || 0) > 0 &&
                book.discountPrice < book.price;
              const percent = hasDiscount
                ? Math.round(
                    ((book.price - book.discountPrice) / book.price) * 100
                  )
                : 0;

              return (
                <Card key={book.id} className="overflow-hidden group py-0">
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4] bg-white">
                      <Image
                        src={
                          book.coverImageUrl ||
                          "/placeholder.svg?height=200&width=350"
                        }
                        alt={book.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:object-contain group-hover:scale-105"
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

        {!loading && !error && ebooks.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            ไม่พบหนังสือในหมวดหมู่นี้
          </div>
        )}

        {!loading && !error && ebooks.length > 0 && (
          <div className="mt-10 flex w-full flex-wrap items-center justify-center gap-2">
            {paginationControls}
          </div>
        )}

        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    </section>
  );
}
