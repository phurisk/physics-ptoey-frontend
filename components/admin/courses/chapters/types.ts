export type AdminContent = {
  id: string
  title: string
  contentType: "VIDEO" | "PDF" | "LINK" | "QUIZ" | "ASSIGNMENT"
  contentUrl: string
  order: number
  chapterId: string
}

export type AdminChapter = {
  id: string
  title: string
  order: number
  courseId: string
  contents: AdminContent[]
}
