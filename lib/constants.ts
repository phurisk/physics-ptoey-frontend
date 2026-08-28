// Subjects/GradeLevel enums matching prisma/schema.prisma

export const SUBJECTS = {
  Thai: { value: "Thai", label: "ภาษาไทย" },
  Mathematics: { value: "Mathematics", label: "คณิตศาสตร์" },
  Science: { value: "Science", label: "วิทยาศาสตร์" },
  Physics: { value: "Physics", label: "ฟิสิกส์" },
  Chemistry: { value: "Chemistry", label: "เคมี" },
  Biology: { value: "Biology", label: "ชีววิทยา" },
  SocialStudies: { value: "SocialStudies", label: "สังคมศึกษา ศาสนา วัฒนธรรม" },
  History: { value: "History", label: "ประวัติศาสตร์" },
  Geography: { value: "Geography", label: "ภูมิศาสตร์" },
  HealthAndPE: { value: "HealthAndPE", label: "สุขศึกษาและพลศึกษา" },
  Art: { value: "Art", label: "ศิลปะ" },
  Music: { value: "Music", label: "ดนตรี" },
  OccupationsAndTechnology: { value: "OccupationsAndTechnology", label: "การงานอาชีพและเทคโนโลยี" },
  ComputerScience: { value: "ComputerScience", label: "วิทยาการคอมพิวเตอร์" },
  ForeignLanguages: { value: "ForeignLanguages", label: "ภาษาต่างประเทศ" },
  English: { value: "English", label: "ภาษาอังกฤษ" },
  Chinese: { value: "Chinese", label: "ภาษาจีน" },
  Japanese: { value: "Japanese", label: "ภาษาญี่ปุ่น" },
} as const

export const getSubjectOptions = () => Object.values(SUBJECTS).map((s) => ({ value: s.value, label: s.label }))

export const getSubjectLabel = (value?: string | null) => {
  if (!value) return value ?? ""
  const subject = Object.values(SUBJECTS).find((s) => s.value === value)
  return subject ? subject.label : value
}

export const GRADE_LEVELS = {
  JUNIOR_HIGH: { value: "JUNIOR_HIGH", label: "ม.ต้น (มัธยมศึกษาตอนต้น)" },
  SENIOR_HIGH: { value: "SENIOR_HIGH", label: "ม.ปลาย (มัธยมศึกษาตอนปลาย)" },
} as const

export const getGradeLevelOptions = () => Object.values(GRADE_LEVELS).map((l) => ({ value: l.value, label: l.label }))

export const getGradeLevelLabel = (value?: string | null) => {
  if (!value) return value ?? ""
  const level = Object.values(GRADE_LEVELS).find((l) => l.value === value)
  return level ? level.label : value
}

// Legacy in-course exam/quiz system enums matching prisma/schema.prisma

export const EXAM_TYPES = {
  PRETEST: { value: "PRETEST", label: "ทดสอบก่อนเรียน" },
  POSTTEST: { value: "POSTTEST", label: "ทดสอบหลังเรียน" },
  QUIZ: { value: "QUIZ", label: "แบบทดสอบ" },
  MIDTERM: { value: "MIDTERM", label: "กลางภาค" },
  FINAL: { value: "FINAL", label: "ปลายภาค" },
  PRACTICE: { value: "PRACTICE", label: "แบบฝึกหัด" },
} as const

export const getExamTypeOptions = () => Object.values(EXAM_TYPES).map((t) => ({ value: t.value, label: t.label }))

export const getExamTypeLabel = (value?: string | null) => {
  if (!value) return value ?? ""
  const type = Object.values(EXAM_TYPES).find((t) => t.value === value)
  return type ? type.label : value
}

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: { value: "MULTIPLE_CHOICE", label: "ปรนัย (เลือกตอบ)" },
  TRUE_FALSE: { value: "TRUE_FALSE", label: "ถูก/ผิด" },
  SHORT_ANSWER: { value: "SHORT_ANSWER", label: "อัตนัย (เติมคำตอบ)" },
} as const

export const getQuestionTypeOptions = () => Object.values(QUESTION_TYPES).map((t) => ({ value: t.value, label: t.label }))

export const getQuestionTypeLabel = (value?: string | null) => {
  if (!value) return value ?? ""
  const type = Object.values(QUESTION_TYPES).find((t) => t.value === value)
  return type ? type.label : value
}
