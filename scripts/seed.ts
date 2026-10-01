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
    title: "1. The Three Little Pigs (아기 돼지 삼형제)",
    content: "Once upon a time, there were three little pigs.\nThey left their mother to build their own houses.\nThe first little pig was very lazy.\nHe built his house out of straw.\nThe second little pig worked a little bit harder.\nHe built his house out of sticks.\nThe third little pig worked very hard all day.\nHe built a strong house out of bricks.\nOne day, a big bad wolf came to the straw house.\nHe huffed and he puffed, and he blew the house down!\nThe first pig ran to the stick house.\nThe wolf followed him.\nHe huffed and he puffed, and he blew the stick house down!\nThe two pigs ran to the brick house.\nThe wolf huffed and he puffed.\nBut he could not blow the brick house down.\nThe wolf was very tired and ran away.\nThe three little pigs lived happily ever after."
  },
  {
    title: "2. Cinderella (신데렐라)",
    content: "Cinderella was a beautiful and kind girl.\nShe lived with her mean stepmother and two stepsisters.\nThey made Cinderella work hard all day.\nOne day, the King invited everyone to a big party.\nThe stepsisters wore beautiful dresses.\nBut Cinderella had nothing to wear.\nShe was left alone and cried.\nSuddenly, her fairy godmother appeared.\nShe waved her magic wand.\nShe gave Cinderella a beautiful blue dress and glass shoes.\n'You must come back before midnight,' the fairy said.\nCinderella went to the party and danced with the Prince.\nThe Prince fell in love with her.\nSuddenly, the clock struck twelve.\nCinderella ran away, but she left one glass shoe behind.\nThe Prince searched everywhere for the owner of the shoe.\nFinally, he found Cinderella.\nThe shoe fit her perfectly, and they were married."
  },
  {
    title: "3. The Ugly Duckling (미운 오리 새끼)",
    content: "A mother duck sat on her eggs.\nOne by one, the eggs cracked open.\nBeautiful little yellow ducks came out.\nBut one egg was very big.\nWhen it opened, a large, gray bird came out.\nHe looked very different from the others.\nThe other ducks laughed at him.\n'You are so ugly!' they said.\nThe ugly duckling was very sad and ran away.\nHe walked through the cold winter alone.\nHe had no friends and no warm home.\nFinally, spring came.\nThe sun was warm, and the flowers bloomed.\nThe ugly duckling looked at his face in the water.\nHe was not an ugly gray bird anymore.\nHe was a beautiful white swan!\nOther swans swam to him and welcomed him.\nHe was never sad again."
  },
  {
    title: "4. Snow White (백설공주)",
    content: "Snow White was a beautiful princess.\nShe had skin as white as snow and lips as red as a rose.\nHer stepmother, the Queen, was very beautiful but evil.\nThe Queen had a magic mirror.\nShe always asked, 'Mirror, mirror, on the wall, who is the fairest of them all?'\nThe mirror always answered, 'You are, my Queen.'\nBut one day, the mirror said, 'Snow White is the fairest.'\nThe Queen was very angry.\nSnow White ran away into the deep dark forest.\nShe found a small house with seven little beds.\nShe cleaned the house and fell asleep.\nSeven dwarfs came home and found her.\nThey became good friends and lived happily.\nBut the evil Queen found out.\nShe gave Snow White a poisoned apple.\nSnow White took a bite and fell into a deep sleep.\nLater, a handsome prince kissed her, and she woke up."
  },
  {
    title: "5. Little Red Riding Hood (빨간 모자)",
    content: "Little Red Riding Hood was a sweet young girl.\nShe always wore a red cape.\nOne day, her mother said, 'Take this basket of food to your grandmother.'\n'She is sick in bed. Do not talk to strangers!'\nRed Riding Hood walked into the woods.\nShe met a big wolf.\nThe wolf asked, 'Where are you going, little girl?'\nShe forgot her mother's words and told him.\nThe wolf ran to the grandmother's house very fast.\nHe hid the grandmother in the closet and put on her clothes.\nHe laid in the bed and waited.\nRed Riding Hood arrived and said, 'Grandma, what big eyes you have!'\n'The better to see you with,' the wolf said.\n'Grandma, what big teeth you have!'\n'The better to eat you with!' cried the wolf.\nJust then, a brave woodcutter heard the noise.\nHe saved the girl and her grandmother."
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
