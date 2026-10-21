import { NextResponse } from "next/server";
import { db } from "@/db";
import { userProgress } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const passageId = searchParams.get("passageId");
  const passageIds = searchParams.get("passageIds");

  try {
    if (passageIds) {
      const ids = passageIds.split(',').map(Number);
      const progresses = await db.query.userProgress.findMany({
        where: and(
          eq(userProgress.userId, user.id),
          inArray(userProgress.passageId, ids)
        )
      });
      return NextResponse.json({ progresses });
    }

    if (passageId) {
      const progress = await db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, user.id),
          eq(userProgress.passageId, parseInt(passageId))
        ),
      });
      return NextResponse.json({ progress: progress || null });
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    console.error("DB GET Error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // ⭐ 전체를 try-catch로 감싸서 서버 다운(401 동반)을 방지합니다.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { passageId, scrollPosition, isRead } = body;

    const existing = await db.query.userProgress.findFirst({
      where: and(
        eq(userProgress.userId, user.id),
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
        userId: user.id,
        passageId,
        scrollPosition: scrollPosition ?? 0,
        isRead: isRead ?? false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DB POST Error:", error);
    // 에러 발생 시 원인을 정확히 알려주도록 변경
    return NextResponse.json({ error: "DB Insert/Update Failed" }, { status: 500 });
  }
}
