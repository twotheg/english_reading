import { NextResponse } from "next/server";
import { db } from "@/db";
import { userProgress } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm"; // ⭐ inArray 추가됨
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const passageId = searchParams.get("passageId");
  const passageIds = searchParams.get("passageIds"); // ⭐ 묶음 요청용 변수

  try {
    // 여러 개를 한 번에 물어볼 때 (목록 페이지용)
    if (passageIds) {
      const ids = passageIds.split(',').map(Number);
      const progresses = await db.query.userProgress.findMany({
        where: and(
          eq(userProgress.userId, session.user.id),
          inArray(userProgress.passageId, ids)
        )
      });
      return NextResponse.json({ progresses });
    }

    // 한 개만 물어볼 때 (상세 페이지용)
    if (passageId) {
      const progress = await db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, session.user.id),
          eq(userProgress.passageId, parseInt(passageId))
        ),
      });
      return NextResponse.json({ progress: progress || null });
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { passageId, scrollPosition, isRead } = body;

  const existing = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, session.user.id),
      eq(userProgress.passageId, passageId)
    ),
  });

  if (existing) {
    await db.update(userProgress)
      .set({ 
        scrollPosition: scrollPosition ?? existing.scrollPosition,
        isRead: isRead ?? existing.isRead,
        lastReadAt: new Date()
      })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      userId: session.user.id,
      passageId,
      scrollPosition: scrollPosition ?? 0,
      isRead: isRead ?? false,
    });
  }

  return NextResponse.json({ success: true });
}
