"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Eye,
  FileText,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/sections/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/login-modal";
import { useAuth } from "@/components/auth-provider";

type ApiExam = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
  _count?: { files: number };
};

type ApiResponse = {
  success?: boolean;
  data?: ApiExam[];
  total?: number;
  count?: number;
  pagination?: { total?: number; page?: number; limit?: number };
  meta?: { total?: number; page?: number; limit?: number };
};

type UiExam = {
  id: string;
  title: string;
  categoryId?: string;
  categoryName: string;
  year: number;
  examType: string;
  subject?: string;
  pdfUrl?: string;
  downloadUrl?: string;
};

const EXAMS_API = "/api/exams";
const ITEMS_PER_PAGE = 12;
const SEARCH_RESULTS_LIMIT = 200;
const MAX_FILE_NAME_LENGTH = 23;

const formatFileName = (value?: string | null, fallback = "ไฟล์ PDF") => {
  const safe = (value ?? "").trim() || fallback;
  if (safe.length <= MAX_FILE_NAME_LENGTH) return safe;
  return `${safe.slice(0, MAX_FILE_NAME_LENGTH - 1)}…`;
};

export default function ExamBankPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<
    { id: string; name: string; color: string; type?: string }[]
  >([]);

  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState<UiExam | null>(null);

  const [data, setData] = useState<ApiExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [files, setFiles] = useState<
    { id?: string; name?: string; url: string; mime?: string; isDownload?: boolean }[]
  >([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCompactPagination, setIsCompactPagination] = useState(false);
  const [canDownload, setCanDownload] = useState(true);

  useEffect(() => {
    let active = true;
    // Fetch centralized download toggle. When false, hide download controls.
    (async () => {
      try {
        const res = await fetch(
          `/api/exams/e03395c1-cd6a-4cda-9da3-78e47a2981c5`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: any = await res.json().catch(() => ({}));
        const data = json?.data ?? json ?? {};
        const flag =
          typeof data?.isDownload === "boolean"
            ? data.isDownload
            : Array.isArray(data?.files)
            ? data.files.some((f: any) => f?.isDownload !== false)
            : undefined;
        if (active) {
          if (typeof flag === "boolean") setCanDownload(flag);
          else setCanDownload(true);
        }
      } catch {
        if (active) setCanDownload(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/exam-categories?limit=100`, {
          cache: "no-store",
        });
        const json: any = (await res.json().catch(() => ({}))) || {};
        const list: any[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        const palette = [
          "rgb(250 202 21)",
          "rgb(254 190 1)",
          "rgb(0 75 125)",
          "rgb(255 90 31)",
          "rgb(155 28 28)",
          "rgb(30 64 175)",
          "rgb(16 185 129)",
        ];
        const mapped = list.map((t: any, idx: number) => ({
          id: String(t?.id ?? t?.slug ?? t?.type ?? t?.code ?? idx),
          name: String(t?.name ?? t?.label ?? t?.type ?? `ประเภท ${idx + 1}`),
          type: String(t?.type ?? t?.slug ?? t?.code ?? t?.id ?? idx),
          color: palette[idx % palette.length],
        }));
        const withAll = [
          { id: "all", name: "ทั้งหมด", color: "rgb(250 202 21)" },
          ...mapped,
        ];
        if (!cancelled) setCategories(withAll);
      } catch {
        if (!cancelled)
          setCategories([
            { id: "all", name: "ทั้งหมด", color: "rgb(250 202 21)" },
          ]);
      }
    })();
    return () => {};
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/exams/years`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          const arr = (j?.data ?? j ?? []) as number[];
          if (Array.isArray(arr) && arr.length && !cancelled) {
            const uniq = Array.from(new Set(arr)).sort((a, b) => b - a);
            setYearOptions(uniq);
          }
        }
      } catch {}
    })();
    return () => {};
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedYear, searchTerm]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = searchTerm.trim();
        const buildParams = (opts: { useSearch: boolean; useQ: boolean }) => {
          const params = new URLSearchParams();
          params.set("page", String(currentPage));
          const limit = q ? SEARCH_RESULTS_LIMIT : ITEMS_PER_PAGE;
          params.set("limit", String(limit));
          if (selectedCategory !== "all") params.set("categoryId", selectedCategory);
          if (selectedYear !== "all") params.set("year", selectedYear);
          if (q) {
            if (opts.useSearch) params.set("search", q);
            if (opts.useQ) params.set("q", q);
          }
          return params;
        };

        const attemptFetch = async (useSearch: boolean, useQ: boolean) => {
          const params = buildParams({ useSearch, useQ });
          return fetch(`${EXAMS_API}?${params.toString()}`, { cache: "no-store" });
        };

        let res = await attemptFetch(true, true);
        if (q && res.status >= 500) {
          res = await attemptFetch(false, true);
        }
        if (q && res.status >= 500) {
          res = await attemptFetch(true, false);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: ApiResponse | any = await res.json().catch(() => ({}));
        const items: ApiExam[] = Array.isArray(json?.data)
          ? (json.data as ApiExam[])
          : Array.isArray(json)
          ? (json as ApiExam[])
          : [];
        if (active) {
          setData(items || []);
          const t =
            json?.pagination?.total ??
            json?.meta?.total ??
            json?.total ??
            json?.count ??
            Number(res.headers.get("x-total-count")) ??
            items.length;
          setTotalCount(Number.isFinite(Number(t)) ? Number(t) : items.length);
          if (!yearOptions.length) {
            const yrs = Array.from(
              new Set(
                (items || []).map((e) => new Date(e.createdAt).getFullYear())
              )
            ).sort((a, b) => b - a);
            if (yrs.length) setYearOptions(yrs);
          }
        }
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load exams");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [
    currentPage,
    selectedCategory,
    selectedYear,
    searchTerm,
    yearOptions.length,
  ]);

  useEffect(() => {
    let cancelled = false;
    async function loadFiles(examId: string) {
      try {
        setFilesLoading(true);
        setFilesError(null);
        setFiles([]);
        const res = await fetch(
          `${EXAMS_API}/${encodeURIComponent(examId)}?include=files`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json().catch(() => ({}));
        const detail = json?.data || json;
        const rawFiles = (detail?.files || detail?.data?.files || []) as any[];
        let normalized = (Array.isArray(rawFiles) ? rawFiles : [])
          .map((f: any) => {
            const url: string =
              f?.url ||
              f?.fileUrl ||
              f?.downloadUrl ||
              f?.cloudinaryUrl ||
              f?.filePath ||
              "";
            const name: string =
              f?.name ||
              f?.title ||
              f?.filename ||
              f?.originalName ||
              f?.publicId ||
              f?.fileName ||
              "ไฟล์ PDF";
            const mime: string | undefined =
              f?.mime ||
              f?.mimeType ||
              f?.contentType ||
              f?.fileType ||
              undefined;
            const isDownload = typeof f?.isDownload === "boolean" ? f.isDownload : undefined;
            return url ? { id: f?.id, name, url, mime, isDownload } : null;
          })
          .filter(Boolean) as {
          id?: string;
          name?: string;
          url: string;
          mime?: string;
          isDownload?: boolean;
        }[];
        const pdfs = normalized.filter(
          (f) => /pdf/i.test(f.mime || "") || /\.pdf(\?|$)/i.test(f.url)
        );
        normalized = pdfs.length > 0 ? pdfs : normalized;
        if (!cancelled) setFiles(normalized);
        if (!cancelled && normalized.length === 0) {
          try {
            const res2 = await fetch(
              `${EXAMS_API}/${encodeURIComponent(examId)}/files`,
              { cache: "no-store" }
            );
            if (res2.ok) {
              const json2 = await res2.json().catch(() => ({}));
              const list = (json2?.data || json2 || []) as any[];
              let norm2 = (Array.isArray(list) ? list : [])
                .map((f: any) => {
                  const url: string =
                    f?.url ||
                    f?.fileUrl ||
                    f?.downloadUrl ||
                    f?.cloudinaryUrl ||
                    f?.filePath ||
                    "";
                  const name: string =
                    f?.name ||
                    f?.title ||
                    f?.filename ||
                    f?.originalName ||
                    f?.publicId ||
                    f?.fileName ||
                    "ไฟล์ PDF";
                  const mime: string | undefined =
                    f?.mime ||
                    f?.mimeType ||
                    f?.contentType ||
                    f?.fileType ||
                    undefined;
                  const isDownload = typeof f?.isDownload === "boolean" ? f.isDownload : undefined;
                  return url ? { id: f?.id, name, url, mime, isDownload } : null;
                })
                .filter(Boolean) as {
                id?: string;
                name?: string;
                url: string;
                mime?: string;
                isDownload?: boolean;
              }[];
              const pdfs2 = norm2.filter(
                (f) => /pdf/i.test(f.mime || "") || /\.pdf(\?|$)/i.test(f.url)
              );
              norm2 = pdfs2.length > 0 ? pdfs2 : norm2;
              if (!cancelled) setFiles(norm2);
            }
          } catch {}
        }
      } catch (e: any) {
        if (!cancelled) setFilesError(e?.message ?? "โหลดไฟล์ไม่สำเร็จ");
      } finally {
        if (!cancelled) setFilesLoading(false);
      }
    }
    if (selectedExam?.id) {
      loadFiles(selectedExam.id);
    } else {
      setFiles([]);
      setFilesError(null);
      setFilesLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [selectedExam]);

  const getCategoryColorById = (key?: string) => {
    if (!key) return "rgb(250 202 21)";
    const match = categories.find(
      (c) => c.id === key || c.type === key || c.name === key
    );
    return match?.color ?? "rgb(250 202 21)";
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredData = useMemo(() => {
    if (!normalizedSearch) return data || [];
    return (data || []).filter((exam) => {
      const target = [
        exam.title,
        exam.description,
        exam.category?.name,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return target.some((value) => value.includes(normalizedSearch));
    });
  }, [data, normalizedSearch]);

  const uiExams: UiExam[] = useMemo(() => {
    return (filteredData || [])
      .filter((e) => e.isActive)
      .map((e) => {
        const year = new Date(e.createdAt).getFullYear();
        const categoryName = e.category?.name ?? "ไม่ระบุ";
        const categoryId = String(e.category?.id ?? e.categoryId ?? "");
        return {
          id: e.id,
          title: e.title,
          categoryId,
          categoryName,
          year,
          examType: categoryName,
        };
      });
  }, [filteredData]);

  const categoriesForUI = categories;

  const displayTotal = normalizedSearch ? uiExams.length : totalCount;

  const totalPages = useMemo(() => {
    if (normalizedSearch) return 1;
    return Math.max(1, Math.ceil((totalCount || 0) / ITEMS_PER_PAGE));
  }, [normalizedSearch, totalCount]);

  const buildPageList = useMemo<(number | "...")[]>(() => {
    if (totalPages <= 1) return [1];
    if (isCompactPagination) {
      const visible = 3;
      if (totalPages <= visible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      let start = currentPage - Math.floor(visible / 2);
      start = Math.max(1, start);
      let end = start + visible - 1;
      if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - visible + 1);
      }
      return Array.from({ length: visible }, (_, i) => start + i);
    }
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    const middleStart = Math.max(2, currentPage - 2);
    const middleEnd = Math.min(totalPages - 1, currentPage + 2);
    if (middleStart > 2) pages.push("...");
    for (let p = middleStart; p <= middleEnd; p++) pages.push(p);
    if (middleEnd < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages, isCompactPagination]);

  const paginationControls = useMemo<ReactNode[]>(() => {
    const nodes: ReactNode[] = [];
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

    nodes.push(
      createButton("first", <ChevronsLeft className="h-4 w-4" />, () => setCurrentPage(1), currentPage === 1)
    );
    nodes.push(
      createButton(
        "prev",
        <ChevronLeft className="h-4 w-4" />,
        () => setCurrentPage((p) => Math.max(1, p - 1)),
        currentPage === 1
      )
    );

    const pageNodes = buildPageList.map((page, idx) => {
        if (page === "...") {
          return (
            <span
              key={`dots-${idx}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400 select-none"
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
            style={{
              backgroundColor: isActive ? "rgb(250 202 21)" : "transparent",
              borderColor: "rgb(250 202 21)",
              color: isActive ? "white" : "rgb(250 202 21)",
            }}
          >
            {page}
          </Button>
        );
      });
    nodes.push(...pageNodes);

    nodes.push(
      createButton(
        "next",
        <ChevronRight className="h-4 w-4" />,
        () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
        currentPage === totalPages
      )
    );
    nodes.push(
      createButton(
        "last",
        <ChevronsRight className="h-4 w-4" />,
        () => setCurrentPage(totalPages),
        currentPage === totalPages
      )
    );

    return nodes;
  }, [buildPageList, currentPage, totalPages]);

  const handleViewPDF = (
    examId: string,
    file?: { id?: string; url?: string | null }
  ) => {
    if (!examId) return;
    const params = new URLSearchParams();
    if (file?.id != null) params.set("fileId", String(file.id));
    else if (file?.url) params.set("fileUrl", String(file.url));
    const query = params.toString();
    const href = `/exam-bank/view/${encodeURIComponent(examId)}${
      query ? `?${query}` : ""
    }`;
    router.push(href);
  };

  const handleDownload = async (downloadUrl: string, filename?: string) => {
    if (!downloadUrl || !canDownload) return;
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    const url = `/api/proxy-download-pdf?url=${encodeURIComponent(
      downloadUrl
    )}${filename ? `&filename=${encodeURIComponent(filename)}` : ""}`;
    try {
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      try {
        window.location.href = url;
      } catch {}
    }
  };

  const SKELETON_COUNT = 8;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-white to-yellow-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              คลังข้อสอบ
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              รวบรวมข้อสอบฟิสิกส์และวิชาที่เกี่ยวข้องจากหลายปีการศึกษา
              พร้อมให้ดูและดาวน์โหลดฟรี
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-row gap-3 items-center max-w-2xl mx-auto w-85 md:w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="ค้นหาข้อสอบ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
              <div className="shrink-0">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-33 sm:w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="เลือกปี" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกปี</SelectItem>
                    {(yearOptions.length
                      ? yearOptions
                      : Array.from(
                          new Set(
                            data.map((e) => new Date(e.createdAt).getFullYear())
                          )
                        ).sort((a, b) => b - a)
                    ).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        ปี {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            {loading && (
              <div className="flex flex-wrap justify-center gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 w-28 rounded-full shimmer" />
                ))}
              </div>
            )}
            {!loading && (
              <div className="flex flex-wrap justify-center gap-3">
                {categoriesForUI.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-2 rounded-full transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "text-white shadow-lg transform scale-105"
                        : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor:
                        selectedCategory === category.id
                          ? getCategoryColorById(category.id)
                          : "transparent",
                      borderColor: getCategoryColorById(category.id),
                      color:
                        selectedCategory === category.id
                          ? "white"
                          : getCategoryColorById(category.id),
                    }}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-6"
          >
            {!loading && (
              <p className="text-gray-600">
                พบข้อสอบ {displayTotal} รายการ
                {!normalizedSearch && (
                  <>
                    {" "}• หน้า {Math.min(currentPage, totalPages)} / {totalPages}
                  </>
                )}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {loading &&
              Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <div key={idx} className="h-full">
                  <Card className="h-full border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-8 w-8 rounded shimmer" />
                        <div className="h-5 w-12 rounded shimmer" />
                      </div>
                      <div className="h-6 w-3/4 rounded shimmer" />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-4 w-1/2 rounded shimmer mx-auto mt-2" />
                    </CardContent>
                  </Card>
                </div>
              ))}

            {!loading && error && (
              <div className="col-span-full text-center text-red-600 py-10">
                เกิดข้อผิดพลาด: {error}
              </div>
            )}

            {!loading &&
              !error &&
              uiExams.map((exam, index) => {
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.06 * index }}
                    whileHover={{ y: -5 }}
                    className="h-full"
                  >
                    <Card
                      className="h-full cursor-pointer transition-all duration-300 border-2 hover:shadow-xl"
                      style={{
                        borderColor:
                          getCategoryColorById(exam.categoryId) + "20",
                      }}
                      onMouseEnter={(e) => {
                        const c = getCategoryColorById(exam.categoryId);
                        e.currentTarget.style.borderColor = c || "#000";
                        e.currentTarget.style.backgroundColor = c + "05";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          getCategoryColorById(exam.categoryId) + "20";
                        e.currentTarget.style.backgroundColor = "";
                      }}
                      onClick={() => setSelectedExam(exam)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <FileText
                            className="h-8 w-8 flex-shrink-0 mt-1"
                            style={{
                              color: getCategoryColorById(exam.categoryId),
                            }}
                          />
                          <Badge
                            variant="secondary"
                            className="text-white text-xs"
                            style={{
                              backgroundColor: getCategoryColorById(
                                exam.categoryId
                              ),
                            }}
                          >
                            ปี {exam.year}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg leading-tight text-gray-900">
                          {exam.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-center pt-2">
                          <p className="text-xs text-gray-500">
                            {canDownload
                              ? "คลิกเพื่อดูหรือดาวน์โหลด"
                              : "คลิกเพื่อดูเฉลย"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </motion.div>

          {!loading && !error && !normalizedSearch && totalCount > ITEMS_PER_PAGE && (
            <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-2">
              {paginationControls}
            </div>
          )}

          {!loading && !error && uiExams.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                ไม่พบข้อสอบที่ค้นหา
              </h3>
              <p className="text-gray-500">
                ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-16 p-8 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-2xl"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ต้องการข้อสอบเพิ่มเติม?
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              สมัครเรียนกับเราเพื่อเข้าถึงข้อสอบและเนื้อหาเพิ่มเติม
              พร้อมคำอธิบายและเทคนิคการแก้โจทย์จากอาจารย์เต้ย
            </p>
            <Link href="/courses">
              <Button
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full cursor-pointer"
              >
                สมัครเรียนออนไลน์
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      <Dialog
        open={!!selectedExam}
        onOpenChange={(open) => !open && setSelectedExam(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {selectedExam?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">หมวดหมู่:</span>
                <p className="font-semibold">{selectedExam?.examType}</p>
              </div>
              <div>
                <span className="text-gray-600">ปี:</span>
                <p className="font-semibold">{selectedExam?.year}</p>
              </div>
            </div>

            <div className="pt-2">
              {filesLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-md border p-2">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded shimmer" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-2/3 rounded shimmer" />
                          <div className="h-3 w-1/3 rounded shimmer" />
                        </div>
                        <div className="h-8 w-24 rounded shimmer" />
                        <div className="h-8 w-10 rounded shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!filesLoading && filesError && (
                <p className="text-center text-red-600 py-2">{filesError}</p>
              )}

              {!filesLoading && !filesError && files.length === 0 && (
                <p className="text-center text-gray-500 py-2">
                  ไม่พบไฟล์สำหรับข้อสอบนี้
                </p>
              )}

              {!filesLoading && !filesError && files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, idx) => (
                    <div
                      key={f.id || idx}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-gray-600 shrink-0" />
                        <div className="truncate">
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={f.name || "ไฟล์ PDF"}
                          >
                            {formatFileName(f.name)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewPDF(selectedExam?.id || "", {
                              id: f.id,
                              url: f.url,
                            })
                          }
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                          {f.isDownload === false || !canDownload
                            ? "ดูเฉลย"
                            : "ดูข้อสอบ"}
                        </Button>
                        {canDownload && f.isDownload !== false && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                f.url,
                                f.name || `${selectedExam?.title || "exam"}.pdf`
                              )
                            }
                            style={{
                              backgroundColor: getCategoryColorById(
                                selectedExam?.categoryId
                              ),
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      <Footer />

      <style jsx>{`
        .shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            90deg,
            rgba(229, 229, 229, 1) 0%,
            rgba(243, 244, 246, 1) 50%,
            rgba(229, 229, 229, 1) 100%
          );
          background-size: 200% 100%;
          animation: shimmerSlide 1.4s ease-in-out infinite;
        }
        @keyframes shimmerSlide {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
}
