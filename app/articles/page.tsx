import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Script from "next/script"
import { articles as fallbackArticles } from "@/lib/dummy-data"

const PAGE_SIZE = 9
const FETCH_LIMIT = 200

export const metadata = {
  title: "บทความทั้งหมด | Physics Ptoey",
  description: "รวมบทความ เทคนิคการเรียนฟิสิกส์ และแนะแนวการสอบ",
}

type ArticleItem = {
  id: string | number
  slug: string
  title: string
  excerpt: string
  date: string
  imageDesktop: string
  imageMobile: string
}

function deriveExcerpt(input?: string, max = 160) {
  if (!input) return ""
  const text = String(input)
    .replace(/\r\n|\n|\r/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > max ? text.slice(0, max - 1) + "…" : text
}

type Props = {
  searchParams?: { page?: string }
}

export default async function ArticlesIndexPage({ searchParams }: Props) {

  const raw = searchParams?.page ?? "1"
  const page = Math.max(1, Number.isNaN(Number(raw)) ? 1 : Number(raw))

  const params = new URLSearchParams({ postType: "บทความ", limit: String(FETCH_LIMIT) })
  const apiUrl = `${(process.env.API_BASE_URL || "").replace(/\/$/, "")}/api/posts?${params.toString()}`
  let ok = false
  let status = 0
  let items: any[] = []
  try {
    const res = await fetch(apiUrl, { cache: "no-store" })
    ok = res.ok
    status = res.status
    const json: any = await res.json().catch(() => null)
    items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
  } catch (e) {
    ok = false
    status = 0
    items = []
  }

  const mapped: ArticleItem[] = items
    .filter((p: any) => p?.postType?.name === "บทความ")
    .map((p: any, idx: number) => {
      const desktop = p?.imageUrl || p?.imageUrlMobileMode || ""
      const mobile = p?.imageUrlMobileMode || p?.imageUrl || ""
      const excerpt = p?.excerpt || deriveExcerpt(p?.content, 180)
      return {
        id: p?.id ?? idx,
        slug: p?.slug || "",
        title: p?.title || "",
        imageDesktop: desktop,
        imageMobile: mobile,
        excerpt: excerpt || "",
        date: p?.publishedAt
          ? new Date(p.publishedAt).toISOString()
          : new Date().toISOString(),
      }
    })
    .filter((a) => !!(a.imageDesktop || a.imageMobile))

  const usingFallback = mapped.length === 0
  const fallbackReason = !items.length ? "no-posts" : "no-images"
  const base: ArticleItem[] = usingFallback
    ? fallbackArticles.map((a) => ({
        id: (a as any).id,
        slug: (a as any).slug || "",
        title: (a as any).title || "",
        excerpt: (a as any).excerpt || "",
        date: (a as any).date || new Date().toISOString(),
        imageDesktop: (a as any).image || "",
        imageMobile: (a as any).image || "",
      }))
    : mapped

  const sorted = [...base].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))

 
  if (page > totalPages) {
    redirect(`/articles?page=${totalPages}`)
  }

  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const pageItems = sorted.slice(start, end)

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Script id="articles-logs" strategy="afterInteractive">
          {`
            (() => {
              const scope = '[Articles]';
              const d = ${JSON.stringify({
                ok,
                status,
                postsCount: undefined, 
                mappedCount: undefined,
                usingFallback,
                fallbackReason,
                fallbackCount: fallbackArticles.length,
              })};
              d.postsCount = ${Number.isFinite((items as any[]).length) ? (items as any[]).length : 0};
              d.mappedCount = ${Number.isFinite((mapped as any[]).length) ? (mapped as any[]).length : 0};
              if (typeof d.ok !== 'undefined') {
                if (d.ok) console.log(scope + ' Fetch /api/posts: OK ' + d.status);
                else console.warn(scope + ' Fetch /api/posts: NOT OK ' + d.status);
              }
              if (typeof d.postsCount !== 'undefined') {
                if (!d.postsCount) {
                  console.warn(scope + ' API ไม่มีข้อมูลโพสต์ ใช้รูป dummy แทน (' + d.fallbackCount + ' ภาพ)');
                } else {
                  console.log(scope + ' Posts loaded: ' + d.postsCount);
                }
              }
              console.log(scope + ' Articles mapped: ' + d.mappedCount);
              if (d.usingFallback) {
                if (d.fallbackReason === 'no-images') {
                  console.warn(scope + ' API ไม่มีรูป (imageUrl/imageUrlMobileMode) ใช้รูป dummy แทน (' + d.fallbackCount + ' ภาพ)');
                }
              } else {
                console.log(scope + ' ใช้รูปจาก API จำนวน ' + d.mappedCount + ' ภาพ');
              }
            })();
          `}
        </Script>

        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">
            บทความทั้งหมด
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            อัปเดตความรู้ฟิสิกส์ เคล็ดลับทำข้อสอบ และแนวคิดที่ใช้ได้จริง
          </p>
        </div>


        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pageItems.map((article) => (
            <Card
              key={`${article.id}-${article.slug ?? ""}`} 
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white py-0"
            >
              <CardContent className="p-0 ">
                <Link href={article.slug ? `/articles/${article.slug}` : `#`}>
                  <div className="aspect-[16/7.5] relative overflow-hidden cursor-pointer">
                    {article.imageDesktop && (
                      <Image
                        src={article.imageDesktop}
                        alt={article.title}
                        fill
                        sizes="(min-width: 768px) 100vw, 0px"
                        className="object-cover hidden md:block group-hover:scale-105 transition-transform duration-300 "
                      />
                    )}
                    {article.imageMobile && (
                      <Image
                        src={article.imageMobile}
                        alt={article.title}
                        fill
                        sizes="(max-width: 767px) 100vw, 0px"
                        className="object-cover md:hidden group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </Link>

                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3 gap-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(article.date).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <Link href={article.slug ? `/articles/${article.slug}` : `#`}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 text-balance group-hover:text-yellow-600 transition-colors duration-200">
                      {article.title}
                    </h3>
                  </Link>

                  <p className="text-gray-600 mb-6 text-pretty leading-relaxed">
                    {article.excerpt}
                  </p>

                  <Button asChild variant="ghost" className="group/btn p-0 h-auto text-yellow-600 hover:text-yellow-700">
                    <Link href={`/articles/${article.slug}`}>
                      อ่านต่อ
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


        <div className="flex items-center justify-center gap-3 mt-12">

          {page <= 1 ? (
            <Button variant="outline" disabled>
              ← หน้าก่อนหน้า
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={`/articles?page=${page - 1}`}>← หน้าก่อนหน้า</Link>
            </Button>
          )}

          <span className="text-sm text-gray-600" aria-current="page">
            หน้า {page} / {totalPages}
          </span>


          {page >= totalPages ? (
            <Button variant="outline" disabled>
              หน้าถัดไป →
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={`/articles?page=${page + 1}`}>หน้าถัดไป →</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
