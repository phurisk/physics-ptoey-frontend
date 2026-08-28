const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const mechanics = await prisma.mockTopic.upsert({
    where: { subject_name: { subject: 'Physics', name: 'กลศาสตร์' } },
    update: {},
    create: { subject: 'Physics', name: 'กลศาสตร์' },
  });
  const electricity = await prisma.mockTopic.upsert({
    where: { subject_name: { subject: 'Physics', name: 'ไฟฟ้า' } },
    update: {},
    create: { subject: 'Physics', name: 'ไฟฟ้า' },
  });

  let exam = await prisma.mockExam.findFirst({ where: { title: 'ข้อสอบจำลองฟิสิกส์ ม.ปลาย ชุดที่ 1' } });
  if (!exam) {
    exam = await prisma.mockExam.create({
      data: {
        title: 'ข้อสอบจำลองฟิสิกส์ ม.ปลาย ชุดที่ 1',
        description: 'ครอบคลุมกลศาสตร์และไฟฟ้าเบื้องต้น เหมาะสำหรับทบทวนก่อนสอบ',
        subject: 'Physics',
        gradeLevel: 'SENIOR_HIGH',
        timeLimit: 60,
        price: 0,
        passingMarks: 6,
        attemptsAllowed: 1,
        allowPracticeMode: true,
        allowRealMode: true,
        practiceUnlockCost: 1,
        isActive: true,
      },
    });
  }

  const questions = [
    {
      questionText: 'กฎข้อที่ 1 ของนิวตันกล่าวว่าอย่างไร',
      questionType: 'MULTIPLE_CHOICE',
      topicId: mechanics.id,
      marks: 1,
      explanation: 'กฎความเฉื่อย: วัตถุจะรักษาสภาพหยุดนิ่งหรือเคลื่อนที่ด้วยความเร็วคงที่ เว้นแต่มีแรงลัพธ์มากระทำ',
      options: [
        { optionText: 'วัตถุจะรักษาสภาพหยุดนิ่งหรือเคลื่อนที่คงที่ เว้นแต่มีแรงลัพธ์มากระทำ', isCorrect: true, order: 0 },
        { optionText: 'แรงเท่ากับมวลคูณความเร่ง', isCorrect: false, order: 1 },
        { optionText: 'แรงกิริยาเท่ากับแรงปฏิกิริยา', isCorrect: false, order: 2 },
        { optionText: 'พลังงานรวมของระบบคงที่เสมอ', isCorrect: false, order: 3 },
      ],
    },
    {
      questionText: 'สูตร F = ma มาจากกฎข้อใดของนิวตัน',
      questionType: 'MULTIPLE_CHOICE',
      topicId: mechanics.id,
      marks: 1,
      explanation: 'กฎข้อที่ 2 ของนิวตัน: แรงลัพธ์ = มวล × ความเร่ง',
      options: [
        { optionText: 'กฎข้อที่ 1', isCorrect: false, order: 0 },
        { optionText: 'กฎข้อที่ 2', isCorrect: true, order: 1 },
        { optionText: 'กฎข้อที่ 3', isCorrect: false, order: 2 },
        { optionText: 'กฎแรงโน้มถ่วง', isCorrect: false, order: 3 },
      ],
    },
    {
      questionText: 'หน่วยของแรงในระบบ SI คือนิวตัน (N)',
      questionType: 'TRUE_FALSE',
      topicId: mechanics.id,
      marks: 1,
      explanation: 'ถูกต้อง หน่วยของแรงคือนิวตัน (N) = kg·m/s²',
      options: [
        { optionText: 'จริง', isCorrect: true, order: 0 },
        { optionText: 'เท็จ', isCorrect: false, order: 1 },
      ],
    },
    {
      questionText: 'วัตถุมวล 2 kg ได้รับแรง 10 N จะมีความเร่งเท่าใด (m/s²)',
      questionType: 'SHORT_ANSWER',
      topicId: mechanics.id,
      marks: 2,
      numericTolerance: 0.1,
      explanation: 'a = F/m = 10/2 = 5 m/s²',
      options: [{ optionText: '5', isCorrect: true, order: 0 }],
    },
    {
      questionText: 'หน่วยของประจุไฟฟ้าคืออะไร',
      questionType: 'MULTIPLE_CHOICE',
      topicId: electricity.id,
      marks: 1,
      explanation: 'หน่วยของประจุไฟฟ้าคือคูลอมบ์ (C)',
      options: [
        { optionText: 'แอมแปร์ (A)', isCorrect: false, order: 0 },
        { optionText: 'โวลต์ (V)', isCorrect: false, order: 1 },
        { optionText: 'คูลอมบ์ (C)', isCorrect: true, order: 2 },
        { optionText: 'โอห์ม (Ω)', isCorrect: false, order: 3 },
      ],
    },
    {
      questionText: 'กฎของโอห์มคือ V = IR',
      questionType: 'TRUE_FALSE',
      topicId: electricity.id,
      marks: 1,
      explanation: 'ถูกต้อง แรงดัน = กระแส × ความต้านทาน',
      options: [
        { optionText: 'จริง', isCorrect: true, order: 0 },
        { optionText: 'เท็จ', isCorrect: false, order: 1 },
      ],
    },
    {
      questionText: 'วงจรไฟฟ้าที่มีความต้านทาน 5 โอห์ม ต่อกับแรงดัน 10 โวลต์ จะมีกระแสไหลผ่านกี่แอมแปร์',
      questionType: 'SHORT_ANSWER',
      topicId: electricity.id,
      marks: 2,
      numericTolerance: 0.1,
      explanation: 'I = V/R = 10/5 = 2 A',
      options: [{ optionText: '2', isCorrect: true, order: 0 }],
    },
  ];

  const maxOrderAgg = await prisma.mockQuestion.aggregate({ where: { mockExamId: exam.id }, _max: { order: true } });
  let order = maxOrderAgg._max.order ?? 0;

  for (const q of questions) {
    const exists = await prisma.mockQuestion.findFirst({ where: { mockExamId: exam.id, questionText: q.questionText } });
    if (exists) continue;
    order += 1;
    await prisma.mockQuestion.create({
      data: {
        mockExamId: exam.id,
        topicId: q.topicId,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        numericTolerance: q.numericTolerance ?? null,
        explanation: q.explanation,
        order,
        options: { create: q.options },
      },
    });
  }

  console.log(`✅ Mock exam seed complete: "${exam.title}" (${exam.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
