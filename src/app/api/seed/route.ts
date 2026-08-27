import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { levels, passages } from "@/db/schema";
import { generateAllPassages, buildPassage } from "@/lib/passage-generator";

const levelData = [
  {
    slug: "beginner",
    name: "Beginner",
    description: "Simple sentences and everyday topics for starting your English reading journey.",
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

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const expected = process.env.SEED_TOKEN || "dev-seed-token";
  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.insert(levels).values(levelData).onConflictDoNothing();
    const levelRows = await db.select().from(levels);
    const levelMap = new Map(levelRows.map((l) => [l.slug, l.id]));

    await db.execute(sql`TRUNCATE TABLE passages RESTART IDENTITY CASCADE`);

    const inputs = generateAllPassages();
    const values = inputs.map((input) => {
      const levelId = levelMap.get(input.levelSlug);
      if (!levelId) throw new Error(`Missing level ${input.levelSlug}`);
      const built = buildPassage(input);
      return {
        levelId,
        title: built.title,
        content: built.content,
        durationMinutes: built.durationMinutes,
        wordCount: built.wordCount,
        orderIndex: input.orderIndex,
      };
    });

    const batchSize = 50;
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      await db.insert(passages).values(batch).onConflictDoNothing();
    }

    return NextResponse.json({ ok: true, count: values.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
