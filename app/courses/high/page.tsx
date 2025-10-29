"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Clock } from "lucide-react";
import { useRecommendedCourses } from "@/hooks/use-recommended-courses";
import Player from "@vimeo/player";
import SimpleYouTubePlayer from "@/components/simple-youtube-player";

type Post = { id: string; content?: string | null };

function y(url: string) {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/
  )?.[1];
  return m
    ? `https://www.youtube-nocookie.com/embed/${m}?rel=0&modestbranding=1&enablejsapi=1&playsinline=1`
    : null;
}
function v(url: string) {
  const m = url.match(
    /(?:vimeo\.com|player\.vimeo\.com)\/(?:video\/)?(\d+)/
  )?.[1];
  return m
    ? `https://player.vimeo.com/video/${m}?dnt=1&title=0&byline=0&portrait=0`
    : null;
}
function firstUrl(t?: string | null) {
  if (!t) return null;
  const m = t.match(/https?:[^\s)\]]+/i);
  return m ? m[0] : null;
}

export default function HighCoursesPage() {
  const [video, setVideo] = useState<string | null>(null);
  const [lv, setLv] = useState(true);
  const [videoFetched, setVideoFetched] = useState(false);
  const [videoReloadKey, setVideoReloadKey] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const vimeoPlayerRef = useRef<Player | null>(null);
  const { courses, loading: lc } = useRecommendedCourses("ม.ปลาย");
  const [sums, setSums] = useState<
    {
      id: string;
      desktop?: string | null;
      mobile?: string | null;
      title?: string;
    }[]
  >([]);
  const [ls, setLs] = useState(true);
  const isVimeo = useMemo(() => (video || "").includes("player.vimeo.com"), [video]);
  const isYouTube = useMemo(() => (video || "").includes("youtube") || (video || "").includes("youtu"), [video]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLv(true);
        if (videoReloadKey > 0) setVideo(null);
        const p = new URLSearchParams({
          postType: "วิดีโอแนะนำ-ม.ปลาย",
          limit: "1",
        });
        const r = await fetch(`/api/posts?${p.toString()}`, {
          cache: "no-store",
        });
        const j = await r.json().catch(() => ({}));
        const list: Post[] = Array.isArray(j?.data)
          ? j.data
          : Array.isArray(j)
          ? j
          : [];
        const f = list[0];
        const u = firstUrl(f?.content || "");
        const e = u ? y(u) || v(u) : null;
        if (!c) setVideo(e);
      } finally {
        if (!c) {
          setLv(false);
          setVideoFetched(true);
        }
      }
    })();
    return () => {
      c = true;
    };
  }, [videoReloadKey]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLs(true);
        const pageSize = 100;
        const seen = new Set<string>();
        const all: {
          id: string;
          desktop?: string | null;
          mobile?: string | null;
          title?: string;
        }[] = [];
        let page = 1,
          loops = 0;
        while (!c && loops < 20) {
          const p = new URLSearchParams({
            postType: "ภาพสรุป-ม.ปลาย",
            limit: String(pageSize),
            page: String(page),
          });
          const r = await fetch(`/api/posts?${p.toString()}`, {
            cache: "no-store",
          });
          const j = await r.json().catch(() => ({}));
          const list: any[] = Array.isArray(j?.data)
            ? j.data
            : Array.isArray(j)
            ? j
            : [];
          const mapped = list.map((x: any) => ({
            id: String(x?.id),
            desktop: x?.imageUrl || null,
            mobile: x?.imageUrlMobileMode || null,
            title: x?.title || "",
          }));
          const before = all.length;
          for (const it of mapped) {
            if (it.id && !seen.has(it.id)) {
              seen.add(it.id);
              all.push(it);
            }
          }
          if (!list.length || list.length < pageSize || all.length === before)
            break;
          page++;
          loops++;
        }
        if (!c) setSums(all);
      } finally {
        if (!c) setLs(false);
      }
    })().catch(() => {});
    return () => {
      c = true;
    };
  }, []);

  const line = "https://line.me/ti/p/@csw9917j";
  const showVideoSection = lv || videoFetched;

  useEffect(() => {
    setVideoEnded(false);
  }, [video, videoReloadKey]);

  useEffect(() => {
    if (!video || !isVimeo || !iframeRef.current) {
      if (vimeoPlayerRef.current) {
        vimeoPlayerRef.current.unload().catch(() => {});
        vimeoPlayerRef.current = null;
      }
      return;
    }

    const player = new Player(iframeRef.current, { dnt: true });
    vimeoPlayerRef.current = player;

    const handleEnded = async () => {
      setVideoEnded(true);
      try {
        await player.unload();
      } catch {}
    };

    player.on("ended", handleEnded);

    return () => {
      player.off("ended", handleEnded);
      player.unload().catch(() => {});
      if (vimeoPlayerRef.current === player) {
        vimeoPlayerRef.current = null;
      }
    };
  }, [isVimeo, video, videoReloadKey]);

  useEffect(() => {
    if (!video || !isYouTube) return;

    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== "object") return;

      if (data.event === "onReady") {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "addEventListener",
            args: ["onStateChange"],
          }),
          "*"
        );
      }
      if (data.event === "onStateChange" && data.info === 0) {
        setVideoEnded(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isYouTube, video, videoReloadKey]);

  const handleRetryVideo = () => {
    setLv(true);
    setVideoFetched(false);
    setVideo(null);
    setVideoEnded(false);
    setVideoReloadKey((n) => n + 1);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-white via-yellow-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-balance">
            คอร์ส ม.ปลาย
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            วิดีโอแนะนำและคอร์สแนะนำสำหรับ ม.ปลาย
          </p>
        </div>

        {showVideoSection && (
          <div className="mb-16 flex items-center justify-center">
            <div className="aspect-video w-200 bg-gray-900 rounded-2xl overflow-hidden relative">
              {(() => {
                // Extract YouTube ID from video URL
                const extractYouTubeId = (url: string) => {
                  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
                  return match ? match[1] : null;
                };

                const youtubeId = video ? extractYouTubeId(video) : null;

                if (youtubeId) {
                  return (
                    <SimpleYouTubePlayer 
                      videoId={youtubeId} 
                      title="วิดีโอแนะนำ ม.ปลาย"
                    />
                  );
                }

                // Fallback for non-YouTube videos or loading states
                if (video && !youtubeId) {
                  return (
                    <iframe
                      key={videoReloadKey}
                      ref={iframeRef}
                      src={video}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; fullscreen"
                      title="วิดีโอแนะนำ ม.ปลาย"
                    />
                  );
                }

                if (lv) {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                    </div>
                  );
                }

                return (
                  <div className="absolute inset-0 flex items-center justify-center text-white/90">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-lg">ไม่พบวิดีโอแนะนำ</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        <div className="mb-16">
          {ls ? (
            <div className="relative w-full aspect-[283/400] bg-gray-100 rounded-2xl animate-pulse border border-gray-200" />
          ) : sums.length ? (
            <div className="grid grid-cols-1 gap-6">
              {sums.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden border-2 border-gray-100 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl"
                >
                  <CardContent className="p-0">
                    <div className="relative w-full aspect-[283/400] bg-white">
                      {item.desktop && (
                        <Image
                          src={item.desktop}
                          alt={item.title || "summary"}
                          fill
                          className="object-contain hidden md:block"
                        />
                      )}
                      {item.mobile ? (
                        <Image
                          src={item.mobile}
                          alt={item.title || "summary"}
                          fill
                          className="object-contain md:hidden"
                        />
                      ) : !item.desktop ? (
                        <Image
                          src="/placeholder.svg"
                          alt="summary"
                          fill
                          className="object-contain"
                        />
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              ไม่มีภาพสรุป
            </div>
          )}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">คอร์สแนะนำ</h2>
          </div>
          <Link href="/courses">
            <Button
              variant="outline"
              className="border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-colors duration-300 bg-transparent"
            >
              ดูคอร์สทั้งหมด
            </Button>
          </Link>
        </div>

        {lc ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={`sk-${i}`}
                className="overflow-hidden border-2 border-gray-100"
              >
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-100 animate-pulse" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                    <div className="h-10 bg-gray-100 rounded-lg w-32 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="h-full hover:shadow-xl transition-shadow duration-300 group pt-0"
              >
                <CardContent className="p-0">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <Image
                      src={
                        course.coverImageUrl ||
                        "/placeholder.svg?height=200&width=350"
                      }
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-yellow-400 text-white">
                        {course.category?.name ?? "คอร์ส"}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-balance line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-pretty line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course._count?.enrollments ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course._count?.chapters ?? 0} บทเรียน</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{(course as any)?.duration ?? "-"}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-6">
                      {course.isFree || (course.price || 0) === 0 ? (
                        <span className="text-2xl font-bold text-green-600">
                          ฟรี
                        </span>
                      ) : (
                        (() => {
                          const original = Number(course.price || 0);
                          const d = course.discountPrice as
                            | number
                            | null
                            | undefined;
                          const hasDiscount = d != null && d < original;
                          const effective = hasDiscount ? Number(d) : original;
                          return (
                            <>
                              {hasDiscount && (
                                <span className="text-sm text-gray-400 line-through mr-1">
                                  ฿{original.toLocaleString()}
                                </span>
                              )}
                              <span className="text-2xl font-extrabold text-yellow-600">
                                ฿{effective.toLocaleString()}
                              </span>
                            </>
                          );
                        })()
                      )}
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white">
                        ดูรายละเอียด
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <p className="text-lg">ยังไม่มีคอร์สแนะนำ</p>
          </div>
        )}

        <div className="text-center mt-16">
          <div className="inline-flex flex-col items-center gap-4">
            <p className="text-gray-600 font-medium">ติดต่อสมัครเรียน?</p>
            <a href={line} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-[#06C755] hover:bg-[#05b24c] text-white rounded-2xl px-10 py-4 font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                <svg
                  className="w-6 h-6 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12.017.572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                แอดไลน์ คลิกเพื่อติดต่อ
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
