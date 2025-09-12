"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Post = { id: string; content?: string | null }
type Course = { id: string; title: string; coverImageUrl?: string | null; category?: { name?: string | null }; price?: number; isFree?: boolean }

function y(url: string){const m=url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];return m?`https://www.youtube-nocookie.com/embed/${m}?rel=0&modestbranding=1`:null}
function v(url: string){const m=url.match(/(?:vimeo\.com|player\.vimeo\.com)\/(?:video\/)?(\d+)/)?.[1];return m?`https://player.vimeo.com/video/${m}?dnt=1&title=0&byline=0&portrait=0`:null}
function firstUrl(t?:string|null){if(!t)return null;const m=t.match(/https?:[^\s)\]]+/i);return m?m[0]:null}

export default function HighCompetitionCoursesPage(){
  const [video,setVideo]=useState<string|null>(null)
  const [lv,setLv]=useState(true)
  const [courses,setCourses]=useState<Course[]>([])
  const [lc,setLc]=useState(true)
  const [sums,setSums]=useState<{id:string;desktop?:string|null;mobile?:string|null;title?:string}[]>([])
  const [ls,setLs]=useState(true)

  useEffect(()=>{let c=false;(async()=>{try{setLv(true);const p=new URLSearchParams({postType:"วิดีโอแนะนำคอร์สแข่งขัน-ม.ปลาย",limit:"1"});const r=await fetch(`/api/posts?${p.toString()}`,{cache:"no-store"});const j=await r.json().catch(()=>({}));const list:Post[]=Array.isArray(j?.data)?j.data:Array.isArray(j)?j:[];const f=list[0];const u=firstUrl(f?.content||"");const e=u?(y(u)||v(u)):null;if(!c)setVideo(e)}finally{if(!c)setLv(false)}})();return()=>{c=true}},[])
  
  useEffect(()=>{let c=false;(async()=>{try{setLc(true);const r=await fetch(`/api/courses`,{cache:"no-store"});const j=await r.json().catch(()=>({}));const list:Course[]=Array.isArray(j?.data)?j.data:Array.isArray(j)?j:[];const fl=list.filter((x)=>(x as any)?.category?.name==="คอร์สแนะนำแข่งขัน-ม.ปลาย");if(!c)setCourses(fl)}finally{if(!c)setLc(false)}})();return()=>{c=true}},[])

  useEffect(()=>{let c=false;(async()=>{try{setLs(true);const p=new URLSearchParams({postType:"ภาพสรุปแข่งขัน-ม.ปลาย"});const r=await fetch(`/api/posts?${p.toString()}`,{cache:"no-store"});const j=await r.json().catch(()=>({}));const list:any[]=Array.isArray(j?.data)?j.data:Array.isArray(j)?j:[];const m=list.map((p:any)=>({id:String(p?.id),desktop:p?.imageUrl||null,mobile:p?.imageUrlMobileMode||null,title:p?.title||""}));if(!c)setSums(m)}finally{if(!c)setLs(false)}})();return()=>{c=true}},[])

  const line="https://line.me/ti/p/@csw9917j"

  return (
    <section className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">คอร์สแข่งขัน ม.ปลาย</h1>
          <p className="text-gray-600">เตรียมสอบแข่งขันด้วยวิดีโอแนะนำและคอร์สแนะนำ</p>
        </div>

        <div className="mb-10">
          <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
            {video && (
              <iframe src={video} className="w-full h-full" allowFullScreen referrerPolicy="no-referrer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" title="วิดีโอแนะนำ คอร์สแข่งขัน ม.ปลาย" />
            )}
            {!video && !lv && (<div className="absolute inset-0 flex items-center justify-center text-white opacity-80">ไม่พบวิดีโอแนะนำ</div>)}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ภาพสรุป</h2>
          {ls ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=>(<div key={`sum-sk-${i}`} className="aspect-[16/9] bg-gray-100 rounded-xl" />))}</div>
          ) : sums.length ? (
            <div className="grid sm:grid-cols-2 lg:grid_cols-3 gap-4">
              {sums.map((s)=>(
                <Card key={s.id} className="overflow-hidden"><CardContent className="p-0"><div className="relative aspect-[16/9] bg-white">
                  {s.desktop && (<Image src={s.desktop} alt={s.title||'summary'} fill className="object-contain hidden md:block" />)}
                  {s.mobile && (<Image src={s.mobile} alt={s.title||'summary'} fill className="object-contain md:hidden" />)}
                  {!s.desktop && !s.mobile && (<Image src="/placeholder.svg" alt="summary" fill className="object-contain" />)}
                </div></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="text-gray-600">ไม่มีภาพสรุป</div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">คอร์สแนะนำ</h2>
          <Link href="/courses"><Button variant="outline">ดูคอร์สทั้งหมด</Button></Link>
        </div>

        {lc ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({length:6}).map((_,i)=>(<Card key={`sk-${i}`} className="overflow-hidden"><CardContent className="p-0"><div className="aspect-video bg-gray-100"/><div className="p-4 space-y-3"><div className="h-5 bg-gray-100 rounded w-2/3"/><div className="h-4 bg-gray-100 rounded w-1/3"/><div className="h-9 bg-gray-100 rounded w-28"/></div></CardContent></Card>))}</div>
        ) : courses.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c)=>(
              <Card key={c.id} className="overflow-hidden group">
                <CardContent className="p-0">
                  <div className="aspect-video relative bg-white">
                    <Image src={c.coverImageUrl || "/placeholder.svg"} alt={c.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="font-semibold text-gray-900 line-clamp-2">{c.title}</div>
                    <div className="flex items-center gap-2">{c.isFree?(<span className="text-green-600 font-medium">ฟรี</span>):(<span className="text-yellow-600 font-semibold">฿{Number(c.price||0).toLocaleString()}</span>)}</div>
                    <Link href={`/courses/${encodeURIComponent(c.id)}`}><Button className="bg-yellow-400 hover:bg-yellow-500 text-white w-full">ดูรายละเอียด</Button></Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-gray-600">ยังไม่มีคอร์สแนะนำ</div>
        )}

        <div className="text-center mt-12"><a href={line} target="_blank" rel="noopener noreferrer"><Button size="lg" className="bg-[#06C755] hover:bg-[#05b24c] text-white rounded-full px-8">แอดไลน์ คลิกเพื่อติดต่อ</Button></a></div>
      </div>
    </section>
  )
}
