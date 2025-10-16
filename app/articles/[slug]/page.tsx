import Image from "next/image"
import { notFound } from "next/navigation"

import { articles as fallbackArticles } from "@/lib/dummy-data"

type PageProps = { params: Promise<{ slug: string }> }

type ArticleContentBlock = {
  id: string
  title?: string
  description?: string
  imageUrl?: string
  author?: string
  createdAt?: string
}

type TextBlock = { type: "text"; value: string }
type HtmlBlock = { type: "html"; value: string }
type SectionBlock = { type: "section"; block: ArticleContentBlock }

type ArticleItem = {
  id: string | number
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  imageDesktop: string
  imageMobile: string
  authorName?: string
  readTimeMinutes: number
  postContents: ArticleContentBlock[]
}

const FETCH_LIMIT = 200

function deriveExcerpt(input?: string, max = 160) {
  if (!input) return ""
  const text = String(input)
    .replace(/\r\n|\n|\r/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > max ? text.slice(0, max - 1) + "…" : text
}

function normalizeSlug(input?: string | null) {
  return (input ?? "").trim().toLowerCase()
}

function buildContentBlocks(content: string): Array<TextBlock | HtmlBlock> {
  if (!content) return []
  const hasHtml = /<\w+[^>]*>/.test(content)
  if (hasHtml) {
    return [{ type: "html", value: content }]
  }
  let paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length <= 1) {
    paragraphs = content
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
  }
  if (!paragraphs.length) return []
  return paragraphs.map((value) => ({ type: "text", value }))
}

function splitParagraphs(text?: string) {
  if (!text) return []
  let segments = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  if (segments.length <= 1) {
    segments = text
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  }
  return segments
}

async function fetchArticle(slug: string): Promise<ArticleItem | null> {
  const normalizedSlug = normalizeSlug(slug)
  const baseUrl = process.env.API_BASE_URL?.replace(/\/$/, "") || ""
  const params = new URLSearchParams({ postType: "บทความ", limit: String(FETCH_LIMIT) })
  const apiUrl = baseUrl ? `${baseUrl}/api/posts?${params.toString()}` : `/api/posts?${params.toString()}`
  try {
    const res = await fetch(apiUrl, { cache: "no-store" })
    const text = await res.text()
    if (!res.ok) return null
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    } catch (err) {
      json = null
    }
    const list: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
    const found =
      list.find((p) => {
        const pSlug = normalizeSlug(p?.slug)
        const typeName = (p?.postType?.name ?? "").trim()
        return pSlug === normalizedSlug && (!typeName || typeName === "บทความ")
      }) ||
      list.find((p) => normalizeSlug(p?.slug) === normalizedSlug) ||
      null
    if (!found) return null
    const desktop = found?.imageUrl || found?.imageUrlMobileMode || ""
    const mobile = found?.imageUrlMobileMode || found?.imageUrl || ""
    const excerpt = found?.excerpt || deriveExcerpt(found?.content, 180)
    const authorName = found?.author?.name || found?.authorName || "Physics Ptoey"
    const postContents: ArticleContentBlock[] = Array.isArray(found?.postContents)
      ? found.postContents
          .map((block: any, idx: number): ArticleContentBlock => ({
            id: String(block?.id ?? `${found?.id ?? slug}-${idx}`),
            title: (block?.name ?? "").trim() || undefined,
            description: (block?.description ?? "").trim() || undefined,
            imageUrl: block?.urlImg ?? undefined,
            author: block?.author?.name,
            createdAt: block?.createdAt,
          }))
          .filter((block: ArticleContentBlock) => block.title || block.description || block.imageUrl)
      : []
    const totalWords = String(found?.content ?? excerpt ?? "").split(/\s+/).filter(Boolean).length
    const readTimeMinutes = Math.max(1, Math.round(totalWords / 200))
    const item: ArticleItem = {
      id: found?.id ?? slug,
      slug: found?.slug || slug,
      title: found?.title || "",
      excerpt: excerpt || "",
      content: found?.content || "",
      date: found?.publishedAt ? new Date(found.publishedAt).toISOString() : new Date().toISOString(),
      imageDesktop: desktop,
      imageMobile: mobile,
      authorName,
      readTimeMinutes,
      postContents,
    }
    return item
  } catch (e) {
    return null
  }
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params
  const article =
    (await fetchArticle(slug)) ||
    (() => {
      const fallback = fallbackArticles.find(
        (item) => normalizeSlug((item as any)?.slug) === normalizeSlug(slug)
      )
      if (!fallback) return null
      const date = (fallback as any).date || new Date().toISOString()
      const image = (fallback as any).image || ""
      return {
        id: (fallback as any).id ?? slug,
        slug: (fallback as any).slug ?? slug,
        title: (fallback as any).title ?? "",
        excerpt: (fallback as any).excerpt ?? "",
        content: (fallback as any).content ?? (fallback as any).excerpt ?? "",
        date,
        imageDesktop: image,
        imageMobile: image,
        authorName: "Physics Ptoey",
        readTimeMinutes: Math.max(
          1,
          Math.round(
            String((fallback as any).content ?? (fallback as any).excerpt ?? "")
              .split(/\s+/)
              .filter(Boolean).length / 200
          )
        ),
        postContents: [],
      } satisfies ArticleItem
    })()

  if (!article) return notFound()

  const hasAdditionalSections = article.postContents.length > 0
  const mainContentBlocks = buildContentBlocks(article.content || article.excerpt)
  const combinedBlocks: Array<TextBlock | HtmlBlock | SectionBlock> = []

  if (mainContentBlocks.length) {
    combinedBlocks.push(...mainContentBlocks)
  }
  if (hasAdditionalSections) {
    for (const block of article.postContents) {
      combinedBlocks.push({ type: "section", block })
    }
  }
  const hasCombinedBlocks = combinedBlocks.length > 0
  const excerptParagraphs = splitParagraphs(article.excerpt)
  const fallbackParagraphs = excerptParagraphs.length
    ? excerptParagraphs
    : article.excerpt
      ? [article.excerpt.trim()].filter(Boolean)
      : []

  return (
    <section className="bg-gradient-to-b from-amber-50/70 via-white to-white pb-20">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10  opacity-70" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-[81/38] relative mt-10 md:mt-14 overflow-hidden rounded-3xl bg-gray-900 text-white shadow-xl">
            {article.imageDesktop && (
              <Image
                src={article.imageDesktop}
                alt={article.title}
                fill
                priority
                className="hidden object-cover opacity-80 md:block"
                sizes="(min-width: 768px) 100vw, 0px"
              />
            )}
            {article.imageMobile && (
              <Image
                src={article.imageMobile}
                alt={article.title}
                fill
                priority
                className="object-cover opacity-80 md:hidden"
                sizes="(max-width: 767px) 100vw, 0px"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
            <div className="relative px-6 py-16 sm:px-10 lg:px-14">
              <div className="flex flex-wrap items-center gap-3 text-sm text-amber-200/90">
                <span className="rounded-full bg-white/10 px-3 py-1">บทความ</span>
                <span>
                  {new Date(article.date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span>·</span>
                <span>{article.readTimeMinutes} นาทีในการอ่าน</span>
              </div>
              <h1 className="mt-6 text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl">
                {article.title}
              </h1>
              {article.excerpt ? (
                <div className="mt-4 max-w-3xl space-y-3 text-lg text-amber-100/90 text-pretty">
                  {(fallbackParagraphs.length ? fallbackParagraphs : [article.excerpt.trim()].filter(Boolean)).map(
                    (paragraph, paragraphIdx) => (
                      <p key={`hero-excerpt-${paragraphIdx}`} className="indent-8">
                        {paragraph}
                      </p>
                    )
                  )}
                </div>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-amber-100/80">
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-900">
                    {article.authorName?.charAt(0) ?? "P"}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{article.authorName ?? "ทีม Physics Ptoey"}</div>
                    <div className="text-xs text-amber-100/70">ทีมคอนเทนต์ Physics Ptoey</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-amber-100/70">
                  แชร์ความรู้ให้เพื่อน ๆ
                </div>
              </div>
            </div>  
          </div>

          <article className="mt-5 space-y-10 rounded-3xl bg-white p-6 sm:p-10">
            {hasCombinedBlocks ? (
              combinedBlocks.map((block, idx) => {
                if (block.type === "section") {
                  const content = block.block
                  return (
                    <section key={content.id} className="space-y-4">
                      {content.imageUrl ? (
                        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                          <Image
                            src={content.imageUrl}
                            alt={content.title || article.title}
                            fill
                            sizes="(min-width: 1024px) 640px, 100vw"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="space-y-3">
                        {content.title ? (
                          <h2 className="text-2xl font-semibold text-gray-900 text-pretty">
                            {content.title}
                          </h2>
                        ) : null}
                        {content.description ? (
                          <div className="space-y-4 text-lg leading-relaxed text-gray-700 text-pretty">
                            {splitParagraphs(content.description).map((paragraph, paragraphIdx) => (
                              <p
                                key={`${content.id}-paragraph-${paragraphIdx}`}
                                className="indent-8"
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </section>
                  )
                }

                if (block.type === "html") {
                  return (
                    <div
                      key={`html-block-${idx}`}
                      className="prose prose-lg max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: block.value }}
                    />
                  )
                }

                const paragraphs = splitParagraphs(block.value)
                return (
                  <div
                    key={`text-block-${idx}`}
                    className="space-y-4 text-lg leading-relaxed text-gray-700 text-pretty"
                  >
                    {(paragraphs.length ? paragraphs : [block.value.trim()]).map((paragraph, paragraphIdx) => (
                      <p
                        key={`text-block-${idx}-paragraph-${paragraphIdx}`}
                        className="indent-8"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )
              })
            ) : (
              <div className="space-y-4 text-lg leading-relaxed text-gray-700 text-pretty">
                {fallbackParagraphs.map((paragraph, paragraphIdx) => (
                  <p key={`excerpt-paragraph-${paragraphIdx}`} className="indent-8">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}
