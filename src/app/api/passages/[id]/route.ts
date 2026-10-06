import { NextResponse } from "next/server";
import { db } from "@/db";
import { passages, levels } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// 1. 기존 본문 조회 API (유지)
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

// 2. 새로 추가된 고급(Advanced) 전용 개별 삭제 API
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const passageId = parseInt(id, 10);
    if (Number.isNaN(passageId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Advanced 레벨의 ID 조회
    const advancedLevel = await db
      .select({ id: levels.id })
      .from(levels)
      .where(eq(levels.slug, "advanced"))
      .limit(1);

    const advancedLevelId = advancedLevel[0]?.id || 3;

    // Advanced 레벨의 지문만 삭제되도록 제한
    await db
      .delete(passages)
      .where(
        and(
          eq(passages.id, passageId),
          eq(passages.levelId, advancedLevelId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete passage error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
