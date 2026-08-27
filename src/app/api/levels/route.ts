import { NextResponse } from "next/server";
import { db } from "@/db";
import { levels, passages } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET() {
  try {
    const levelRows = await db.select().from(levels).orderBy(levels.orderIndex);
    const counts = await db
      .select({ levelId: passages.levelId, total: count() })
      .from(passages)
      .groupBy(passages.levelId);

    const countMap = new Map(counts.map((c) => [c.levelId, c.total]));

    const result = levelRows.map((level) => ({
      ...level,
      passageCount: countMap.get(level.id) ?? 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load levels" }, { status: 500 });
  }
}
