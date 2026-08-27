import { NextResponse } from "next/server";
import { db } from "@/db";
import { passages, levels } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const passageId = parseInt(id, 10);
  if (Number.isNaN(passageId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const rows = await db
      .select({
        id: passages.id,
        title: passages.title,
        content: passages.content,
        durationMinutes: passages.durationMinutes,
        wordCount: passages.wordCount,
        orderIndex: passages.orderIndex,
        levelSlug: levels.slug,
        levelName: levels.name,
        levelColor: levels.color,
      })
      .from(passages)
      .leftJoin(levels, eq(passages.levelId, levels.id))
      .where(eq(passages.id, passageId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Passage not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load passage" }, { status: 500 });
  }
}
