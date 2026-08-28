import ChapterManagement from "@/components/admin/courses/chapters/ChapterManagement"

export default async function CourseChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChapterManagement courseId={id} />
}
