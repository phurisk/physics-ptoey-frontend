"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, BookOpen, ChevronRight } from "lucide-react"

// Mock data for Physics course
const courseData = {
    title: "Physics Fundamentals",
    description: "เรียนรู้หลักการฟิสิกส์พื้นฐานผ่านวิดีโอที่เข้าใจง่าย",
    chapters: [
        {
            id: 1,
            title: "Mechanics",
            description: "กลศาสตร์และการเคลื่อนที่",
            videos: [
                { id: 1, title: "Introduction to Motion", duration: "15:30" },
                { id: 2, title: "Velocity and Acceleration", duration: "18:45" },
                { id: 3, title: "Newton's First Law", duration: "12:20" },
                { id: 4, title: "Newton's Second Law", duration: "16:10" },
                { id: 5, title: "Newton's Third Law", duration: "14:25" },
                { id: 6, title: "Friction and Forces", duration: "20:15" },
                { id: 7, title: "Work and Energy", duration: "22:30"},
            ],
        },
        {
            id: 2,
            title: "Thermodynamics",
            description: "อุณหพลศาสตร์และการถ่ายเทความร้อน",
            videos: [
                { id: 8, title: "Temperature and Heat", duration: "17:40" },
                { id: 9, title: "Thermal Expansion", duration: "13:55" },
                { id: 10, title: "Heat Transfer", duration: "19:20" },
                { id: 11, title: "First Law of Thermodynamics", duration: "21:10" },
                { id: 12, title: "Second Law of Thermodynamics", duration: "18:30" },
                { id: 13, title: "Heat Engines", duration: "16:45" },
                { id: 14, title: "Refrigerators and Heat Pumps", duration: "15:20" },
            ],
        },
        {
            id: 3,
            title: "Waves and Sound",
            description: "คลื่นและเสียง",
            videos: [
                { id: 15, title: "Wave Properties", duration: "14:15" },
                { id: 16, title: "Wave Interference", duration: "16:30" },
                { id: 17, title: "Sound Waves", duration: "18:20" },
                { id: 18, title: "Doppler Effect", duration: "12:45" },
                { id: 19, title: "Standing Waves", duration: "15:10" },
                { id: 20, title: "Resonance", duration: "13:35" },
                { id: 21, title: "Musical Instruments", duration: "17:25" },
            ],
        },
        {
            id: 4,
            title: "Electricity and Magnetism",
            description: "ไฟฟ้าและแม่เหล็ก",
            videos: [
                { id: 22, title: "Electric Charge", duration: "16:20" },
                { id: 23, title: "Electric Field", duration: "19:15" },
                { id: 24, title: "Electric Potential", duration: "17:50" },
                {
                    id: 25,
                    title: "Current and Resistance",
                    duration: "15:40",
                },
                { id: 26, title: "Magnetic Fields", duration: "18:30" },
                {
                    id: 27,
                    title: "Electromagnetic Induction",
                    duration: "20:25",
                },
                { id: 28, title: "AC and DC Circuits", duration: "22:10" },
            ],
        },
        {
            id: 5,
            title: "Modern Physics",
            description: "ฟิสิกส์สมัยใหม่",
            videos: [
                {
                    id: 29,
                    title: "Quantum Mechanics Basics",
                    duration: "24:30",
                },
                { id: 30, title: "Atomic Structure", duration: "18:45" },
                { id: 31, title: "Radioactivity", duration: "16:20" },
                { id: 32, title: "Nuclear Physics", duration: "21:15" },
                { id: 33, title: "Special Relativity", duration: "26:40" },
                { id: 34, title: "Particle Physics", duration: "19:30" },
                { id: 35, title: "Cosmology", duration: "23:50" },
            ],
        },
    ],
}

export default function PhysicsCoursePage() {
    const [selectedChapter, setSelectedChapter] = useState(1)
    const [selectedVideo, setSelectedVideo] = useState(courseData.chapters[0].videos[0])
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const currentChapter = courseData.chapters.find((ch) => ch.id === selectedChapter)

    const handleVideoSelect = (video: any, chapterId: number) => {
        setSelectedVideo(video)
        setSelectedChapter(chapterId)
        setIsSidebarOpen(false)
    }

    return (
        <div className="min-h-screen bg-gray-50">


            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    <div className={`lg:col-span-1 ${isSidebarOpen ? "block" : "hidden lg:block"}`}>
                        <Card className="bg-white border-gray-200 sticky top-24">
                            <CardContent className="p-4">
                                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Chapters
                                </h2>
                                <div className="space-y-2">
                                    {courseData.chapters.map((chapter) => (
                                        <div key={chapter.id} className="space-y-2">
                                            <Button
                                                variant={selectedChapter === chapter.id ? "default" : "ghost"}
                                                className={`w-full justify-start text-left h-auto p-3 ${selectedChapter === chapter.id
                                                        ? "text-white hover:opacity-90"
                                                        : "text-gray-700 hover:bg-gray-100"
                                                    }`}
                                                style={selectedChapter === chapter.id ? { backgroundColor: "#004b7d" } : {}}
                                                onClick={() => setSelectedChapter(chapter.id)}
                                            >
                                                <div>
                                                    <div className="font-medium text-balance">
                                                        Chapter {chapter.id}: {chapter.title}
                                                    </div>
                                                    <div className="text-xs opacity-80 text-pretty">{chapter.description}</div>
                                                </div>
                                            </Button>

                                            {selectedChapter === chapter.id && (
                                                <div className="ml-4 space-y-1">
                                                    {chapter.videos.map((video) => (
                                                        <Button
                                                            key={video.id}
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`w-full justify-start text-left h-auto p-2 ${selectedVideo.id === video.id
                                                                    ? "bg-yellow-100 text-gray-800 border border-yellow-300"
                                                                    : "text-gray-600 hover:bg-gray-50"
                                                                }`}
                                                            onClick={() => handleVideoSelect(video, chapter.id)}
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                <Play className="h-3 w-3 flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-medium truncate text-balance">{video.title}</div>
                                                                    <div className="text-xs opacity-70 flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {video.duration}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>


                    <div className="lg:col-span-3">
                        <div className="space-y-6">

                            <Card className="bg-white border-gray-200">
                                <CardContent className="p-0">
                                    <div className="aspect-video bg-gray-100 rounded-t-lg relative overflow-hidden">
                                        <img
                                            src={"/placeholder.svg"}
                                            alt={selectedVideo.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <Button size="lg" className="text-white hover:opacity-90" style={{ backgroundColor: "#004b7d" }}>
                                                <Play className="h-6 w-6 mr-2" />
                                                เล่นวิดีโอ
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-800 text-balance">{selectedVideo.title}</h3>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <Badge variant="secondary" className="bg-yellow-100 text-gray-800 border border-yellow-300">
                                                        Chapter {selectedChapter}: {currentChapter?.title}
                                                    </Badge>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {selectedVideo.duration}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-pretty">
                                            เรียนรู้เกี่ยวกับ {selectedVideo.title} ในบทที่ {selectedChapter}
                                            ผ่านการอธิบายที่เข้าใจง่ายและตัวอย่างที่ชัดเจน
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Related Videos */}
                            <Card className="bg-white border-gray-200">
                                <CardContent className="p-6">
                                    <h4 className="font-semibold text-gray-800 mb-4">วิดีโออื่นๆ ใน Chapter {selectedChapter}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {currentChapter?.videos
                                            .filter((video) => video.id !== selectedVideo.id)
                                            .slice(0, 6)
                                            .map((video) => (
                                                <Card
                                                    key={video.id}
                                                    className="cursor-pointer hover:shadow-md transition-shadow bg-gray-50 border-gray-200 hover:border-yellow-300"
                                                    onClick={() => handleVideoSelect(video, selectedChapter)}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="aspect-video bg-gray-200 rounded mb-3 relative overflow-hidden">
                                                            <img
                                                                src={"/placeholder.svg"}
                                                                alt={video.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                                {video.duration}
                                                            </div>
                                                        </div>
                                                        <h5 className="font-medium text-sm text-gray-800 text-balance">{video.title}</h5>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
