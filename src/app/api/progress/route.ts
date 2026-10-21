import { NextResponse } from "next/server";
import { db } from "@/db";
import { userProgress } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  // ⭐ getSession() 대신 무조건 getUser()를 사용해야 서버에서 안전하게 인증됩니다.
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
          eq(userProgress.userId, user.id), // ⭐ session.user.id -> user.id 로 변경
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
    console.error("DB Error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  // ⭐ POST 요청에서도 getUser() 적용
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
}
