import Image from "next/image"
import { notFound } from "next/navigation"

type Params = { params: { slug: string } }

type ArticleItem = {
  id: string | number
  slug: string
  title: string
  excerpt: string
  content: string
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

async function fetchArticle(slug: string): Promise<ArticleItem | null> {
  const params = new URLSearchParams({ postType: "บทความ", slug })
  const apiUrl = `${(process.env.API_BASE_URL || "").replace(/\/$/, "")}/api/posts?${params.toString()}`
  try {
    const res = await fetch(apiUrl, { cache: "no-store" })
    if (!res.ok) return null
    const json: any = await res.json().catch(() => null)
    const list: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
    const found = list.find((p) => p?.slug === slug && p?.postType?.name === "บทความ") || null
    if (!found) return null
    const desktop = found?.imageUrl || found?.imageUrlMobileMode || ""
    const mobile = found?.imageUrlMobileMode || found?.imageUrl || ""
    const excerpt = found?.excerpt || deriveExcerpt(found?.content, 180)
    const item: ArticleItem = {
      id: found?.id ?? slug,
      slug: found?.slug || slug,
      title: found?.title || "",
      excerpt: excerpt || "",
      content: found?.content || "",
      date: found?.publishedAt ? new Date(found.publishedAt).toISOString() : new Date().toISOString(),
      imageDesktop: desktop,
      imageMobile: mobile,
    }
    return item
  } catch (e) {
    return null
  }
}

export default async function ArticleDetailPage({ params }: Params) {
  const { slug } = params
  const article = await fetchArticle(slug)
  if (!article) return notFound()

  return (
    <section className="py-10 lg:py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-[16/7.5] overflow-hidden rounded-xl bg-white shadow-sm">
          {article.imageDesktop && (
            <Image
              src={article.imageDesktop}
              alt={article.title}
              fill
              sizes="(min-width: 768px) 100vw, 0px"
              className="object-cover hidden md:block"
              priority
            />
          )}
          {article.imageMobile && (
            <Image
              src={article.imageMobile}
              alt={article.title}
              fill
              sizes="(max-width: 767px) 100vw, 0px"
              className="object-cover md:hidden"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="mt-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 text-balance">
            {article.title}
          </h1>
          {article.excerpt ? (
            <p className="mt-4 text-lg text-gray-600 text-pretty">{article.excerpt}</p>
          ) : null}
          <div className="mt-2 text-sm text-gray-500">
            {new Date(article.date).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <article className="mt-8 bg-white rounded-xl shadow-sm p-6 leading-relaxed text-gray-800 whitespace-pre-line">
          {article.content || article.excerpt}
        </article>
      </div>
    </section>
  )
}

