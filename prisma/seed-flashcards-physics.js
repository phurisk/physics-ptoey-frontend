const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const topic = await prisma.mockTopic.upsert({
    where: { subject_name: { subject: 'Physics', name: 'กลศาสตร์' } },
    update: {},
    create: { subject: 'Physics', name: 'กลศาสตร์' },
  });

  let deck = await prisma.flashcardDeck.findFirst({ where: { title: 'ฟิสิกส์: กฎการเคลื่อนที่ของนิวตัน' } });
  if (!deck) {
    deck = await prisma.flashcardDeck.create({
      data: {
        title: 'ฟิสิกส์: กฎการเคลื่อนที่ของนิวตัน',
        description: 'ทบทวนกฎการเคลื่อนที่ 3 ข้อของนิวตัน และการคำนวณแรง มวล ความเร่งเบื้องต้น',
        subject: 'Physics',
        gradeLevel: 'SENIOR_HIGH',
        topicId: topic.id,
        isActive: true,
      },
    });
  }

  const cards = [
    { front: 'กฎข้อที่ 1 ของนิวตันเรียกว่าอะไร', back: 'กฎความเฉื่อย (Law of Inertia)' },
    {
      front: 'กฎข้อที่ 1 ของนิวตันกล่าวว่าอย่างไร',
      back: 'วัตถุจะรักษาสภาพหยุดนิ่งหรือเคลื่อนที่ด้วยความเร็วคงที่ เว้นแต่มีแรงลัพธ์ภายนอกมากระทำ',
    },
    { front: 'สูตรของกฎข้อที่ 2 ของนิวตันคืออะไร', back: 'F = ma (แรง = มวล × ความเร่ง)' },
    { front: 'กฎข้อที่ 3 ของนิวตันกล่าวว่าอย่างไร', back: 'ทุกแรงกิริยาจะมีแรงปฏิกิริยาที่มีขนาดเท่ากันแต่ทิศทางตรงข้ามเสมอ' },
    { front: 'หน่วยของแรงในระบบ SI คืออะไร', back: 'นิวตัน (N) ซึ่งเท่ากับ kg·m/s²' },
    { front: 'หน่วยของมวลในระบบ SI คืออะไร', back: 'กิโลกรัม (kg)' },
    { front: 'ความเร่งคืออะไร', back: 'อัตราการเปลี่ยนแปลงความเร็วต่อหนึ่งหน่วยเวลา มีหน่วยเป็น m/s²' },
    { front: 'แรงเสียดทานคืออะไร', back: 'แรงที่ต้านการเคลื่อนที่ของวัตถุ เกิดจากการสัมผัสกันของผิววัตถุสองผิว' },
    {
      front: 'วัตถุมวล 4 kg ได้รับแรง 20 N จะมีความเร่งเท่าใด (m/s²)',
      back: '5',
      answerMode: 'TYPED',
      acceptedAnswers: ['5', '5 m/s2', '5m/s2'],
      numericTolerance: 0.1,
    },
    {
      front: 'น้ำหนักของวัตถุมวล 10 kg บนโลก (g = 10 m/s²) มีค่ากี่นิวตัน',
      back: '100',
      answerMode: 'TYPED',
      acceptedAnswers: ['100'],
      numericTolerance: 1,
    },
    {
      front: 'ข้อใดคือหน่วยของโมเมนตัม',
      back: 'kg·m/s',
      answerMode: 'MULTIPLE_CHOICE',
      options: [
        { text: 'kg·m/s', correct: true },
        { text: 'N·m', correct: false },
        { text: 'J', correct: false },
        { text: 'W', correct: false },
      ],
    },
    {
      front: 'ข้อใดถูกต้องเกี่ยวกับแรงโน้มถ่วง',
      back: 'แรงโน้มถ่วงเป็นแรงดึงดูดระหว่างมวล',
      answerMode: 'MULTIPLE_CHOICE',
      options: [
        { text: 'แรงโน้มถ่วงเป็นแรงผลัก', correct: false },
        { text: 'แรงโน้มถ่วงเป็นแรงดึงดูดระหว่างมวล', correct: true },
        { text: 'แรงโน้มถ่วงมีเฉพาะบนโลกเท่านั้น', correct: false },
        { text: 'แรงโน้มถ่วงไม่มีหน่วย', correct: false },
      ],
    },
  ];

  const maxOrderAgg = await prisma.flashcard.aggregate({ where: { deckId: deck.id }, _max: { order: true } });
  let order = maxOrderAgg._max.order ?? 0;

  for (const c of cards) {
    const exists = await prisma.flashcard.findFirst({ where: { deckId: deck.id, front: c.front } });
    if (exists) continue;
    order += 1;
    await prisma.flashcard.create({
      data: {
        deckId: deck.id,
        front: c.front,
        back: c.back,
        order,
        answerMode: c.answerMode || 'SELF_GRADE',
        acceptedAnswers: c.acceptedAnswers || [],
        numericTolerance: c.numericTolerance ?? null,
        options: c.options ? { create: c.options.map((o, i) => ({ optionText: o.text, isCorrect: o.correct, order: i })) } : undefined,
      },
    });
  }

  console.log(`✅ Flashcard seed complete: "${deck.title}" (${deck.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
