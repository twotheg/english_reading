import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { levels, passages } from "@/db/schema";
// 기존 제너레이터는 Intermediate, Advanced 레벨을 위해 그대로 둡니다.
import { generateAllPassages, buildPassage } from "@/lib/passage-generator";

const levelData = [
  {
    slug: "beginner",
    name: "Beginner",
    description: "Simple fairy tales for starting your English reading journey.",
    color: "#22c55e",
    icon: "sprout",
    orderIndex: 1,
  },
  {
    slug: "intermediate",
    name: "Intermediate",
    description: "Longer texts with richer vocabulary and more complex ideas.",
    color: "#3b82f6",
    icon: "book-open",
    orderIndex: 2,
  },
  {
    slug: "advanced",
    name: "Advanced",
    description: "Sophisticated articles on academic, professional, and abstract topics.",
    color: "#a855f7",
    icon: "graduation-cap",
    orderIndex: 3,
  },
];

// 초보자용 쉬운 동화 데이터 (5개 샘플 - 잘 작동하면 여기에 100개까지 쭉 추가하면 됩니다)
const beginnerFairyTales = [
  {
    title: "The Thirsty Crow",
    content: "A crow was very thirsty.\nHe looked for water everywhere.\nHe found a water pitcher.\nBut the water was too low.\nHe dropped pebbles into the pitcher.\nThe water came up.\nThe crow drank the water and was happy.",
  },
  {
    title: "The Tortoise and the Hare",
    content: "The hare was very fast.\nThe tortoise was very slow.\nThey had a race.\nThe hare ran fast and went to sleep.\nThe tortoise did not stop.\nThe tortoise won the race.",
  },
  {
    title: "The Boy Who Cried Wolf",
    content: "A boy watched some sheep.\nHe was very bored.\nHe yelled, Wolf! Wolf!\nThe people came to help, but there was no wolf.\nLater, a real wolf came.\nHe yelled again, but nobody came.",
  },
  {
    title: "The Lion and the Mouse",
    content: "A big lion caught a small mouse.\nThe mouse said, Please let me go!\nThe lion laughed and let him go.\nOne day, the lion was caught in a net.\nThe small mouse bit the net.\nThe mouse saved the lion.",
  },
  {
    title: "The Ant and the Grasshopper",
    content: "The ant worked hard all summer.\nThe grasshopper just played and sang.\nWinter came and it was very cold.\nThe grasshopper had no food.\nThe ant shared his food.\nThe grasshopper said thank you.",
  }
];

async function seed() {
  console.log("Seeding levels...");
  await db.insert(levels).values(levelData).onConflictDoNothing();

  const levelRows = await db.select().from(levels);
  const levelMap = new Map(levelRows.map((l) => [l.slug, l.id]));

  console.log("Clearing existing passages...");
  await db.execute(sql`TRUNCATE TABLE passages RESTART IDENTITY CASCADE`);

  console.log("Generating passages...");
  
  // 1. 기존 제너레이터에서 데이터 가져오기
  const inputs = generateAllPassages();
  
  // 2. Beginner 데이터는 우리가 만든 동화로, 나머지는 기존 데이터로 분리해서 DB에 넣기
  const values = inputs.map((input) => {
    const levelId = levelMap.get(input.levelSlug);
    if (!levelId) throw new Error(`Missing level ${input.levelSlug}`);
    
    // 원래 로직대로 데이터 생성
    const built = buildPassage(input);
    
    return {
      levelId,
      title: built.title,
      content: built.content,
      durationMinutes: built.durationMinutes,
      wordCount: built.wordCount,
      orderIndex: input.orderIndex,
      isBeginner: input.levelSlug === "beginner" // Beginner 판별용 임시 플래그
    };
  }).filter(v => !v.isBeginner); // 기존 생성된 Beginner 데이터는 버림

  // 3. 우리가 만든 100개의 쉬운 동화책 데이터를 values 배열에 추가
  const beginnerLevelId = levelMap.get("beginner");
  beginnerFairyTales.forEach((tale, index) => {
    const wordCount = tale.content.split(/\s+/).length;
    values.push({
      levelId: beginnerLevelId!,
      title: tale.title,
      content: tale.content, // 줄바꿈(\n) 단위로 문장 저장
      durationMinutes: Math.max(1, Math.ceil(wordCount / 100)), // 대략적인 읽는 시간 계산
      wordCount: wordCount,
      orderIndex: index + 1,
      isBeginner: true // 타입 에러 방지용
    });
  });

  // 임시 플래그 제거 후 DB 삽입 포맷에 맞춤
  const finalValues = values.map(({ isBeginner, ...rest }) => rest);

  console.log(`Inserting ${finalValues.length} passages...`);
  const batchSize = 50;
  for (let i = 0; i < finalValues.length; i += batchSize) {
    const batch = finalValues.slice(i, i + batchSize);
    await db.insert(passages).values(batch).onConflictDoNothing();
    console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(finalValues.length / batchSize)}`);
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
