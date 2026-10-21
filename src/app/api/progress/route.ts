import { NextResponse } from "next/server";
import { db } from "@/db";
import { userProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// 1. 기록 불러오기 (GET)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const passageId = searchParams.get("passageId");

  if (!passageId) return NextResponse.json({ error: "Missing passageId" }, { status: 400 });

  // 해당 유저가 해당 기사를 읽은 기록이 있는지 찾습니다.
  const progress = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, session.user.id),
      eq(userProgress.passageId, parseInt(passageId))
    ),
  });

  return NextResponse.json({ progress: progress || null });
}

// 2. 기록 저장 및 업데이트 (POST)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { passageId, scrollPosition, isRead } = body;

  // 기존 기록이 있는지 확인
  const existing = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, session.user.id),
      eq(userProgress.passageId, passageId)
    ),
  });

  if (existing) {
    // 기록이 있으면 스크롤 위치와 읽음 상태를 업데이트 (책갈피 덮어쓰기)
    await db.update(userProgress)
      .set({ 
        scrollPosition: scrollPosition ?? existing.scrollPosition,
        isRead: isRead ?? existing.isRead,
        lastReadAt: new Date()
      })
      .where(eq(userProgress.id, existing.id));
  } else {
    // 기록이 없으면 새로 생성
    await db.insert(userProgress).values({
      userId: session.user.id,
      passageId,
      scrollPosition: scrollPosition ?? 0,
      isRead: isRead ?? false,
    });
  }

  return NextResponse.json({ success: true });
}
