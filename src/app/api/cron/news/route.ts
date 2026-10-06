import { NextResponse } from "next/server";
import { db } from "@/db";
import { passages, levels } from "@/db/schema"; 
import { eq, sql } from "drizzle-orm";
import Parser from "rss-parser";

// 본문 HTML 태그 제거 함수
function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("key") !== process.env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const parser = new Parser({
      customFields: {
        item: [["content:encoded", "fullContent"]],
      },
    });

    // 학술·사회·과학 분야의 깊이 있는 장문 칼럼을 제공하는 피드 (The Conversation World News)
    const feed = await parser.parseURL("https://theconversation.com/global/articles.atom");

    const levelRows = await db
      .select({ id: levels.id })
      .from(levels)
      .where(eq(levels.slug, "advanced"))
      .limit(1);

    const levelId = levelRows[0]?.id || 3;

    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`max(${passages.orderIndex})` })
      .from(passages)
      .where(eq(passages.levelId, levelId));
    
    let currentOrder = (Number(maxOrderResult[0]?.maxOrder) || 0) + 1;

    let insertedCount = 0;

    for (const item of feed.items) {
      if (insertedCount >= 3) break; // 하루 3개씩 엄선

      // 전체 본문 추출 및 정리
      const rawText = (item as any).fullContent || item.content || item.summary || "";
      const cleanContent = stripHtml(rawText);

      const wordCount = cleanContent.split(/\s+/).length;

      // 10-Minute Reader 콘셉트에 맞게 400단어 이상의 긴 호흡 지문만 선별
      if (wordCount < 400) continue;

      const durationMinutes = Math.max(1, Math.ceil(wordCount / 100));

      await db.insert(passages).values({
        levelId: levelId,
        title: item.title?.trim() || "In-Depth Global Analysis",
        content: cleanContent,
        wordCount: wordCount,
        durationMinutes: durationMinutes,
        orderIndex: currentOrder++,
      }).onConflictDoNothing();

      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `성공적으로 장문 아티클 ${insertedCount}개를 수집했습니다!`,
    });
  } catch (error: any) {
    console.error("News fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch news" }, { status: 500 });
  }
}
