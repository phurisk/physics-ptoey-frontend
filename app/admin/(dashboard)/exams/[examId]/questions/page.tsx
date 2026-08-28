import ExamQuestionsManagement from "@/components/admin/exam-questions"

export default async function ExamQuestionsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params
  return <ExamQuestionsManagement examId={examId} />
}
