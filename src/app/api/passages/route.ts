import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { passages, levels } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const levelSlug = searchParams.get("level");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  try {
    let levelId: number | undefined;
    if (levelSlug) {
      const levelRow = await db
        .select({ id: levels.id })
        .from(levels)
        .where(eq(levels.slug, levelSlug))
        .limit(1);
      if (levelRow.length === 0) {
        return NextResponse.json({ error: "Level not found" }, { status: 404 });
      }
      levelId = levelRow[0].id;
    }

    const where = levelId ? eq(passages.levelId, levelId) : undefined;
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: passages.id,
        title: passages.title,
        durationMinutes: passages.durationMinutes,
        wordCount: passages.wordCount,
        orderIndex: passages.orderIndex,
        levelSlug: levels.slug,
        levelName: levels.name,
        levelColor: levels.color,
      })
      .from(passages)
      .leftJoin(levels, eq(passages.levelId, levels.id))
      .where(where)
      .orderBy(passages.orderIndex)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ total: sql<number>`count(*)` })
      .from(passages)
      .where(where);

    const total = Number(countResult[0]?.total ?? 0);

    return NextResponse.json({
      passages: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load passages" }, { status: 500 });
  }
}
