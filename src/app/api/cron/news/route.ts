import { NextResponse } from "next/server";
import { db } from "@/db";
import { passages, levels } from "@/db/schema"; 
import { eq, sql } from "drizzle-orm";
import Parser from "rss-parser";

export async function GET(request: Request) {
  // 보안 설정 (로컬 확인 및 ?key= 파라미터 허용)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("key") !== process.env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const parser = new Parser();
    const feed = await parser.parseURL("http://feeds.bbci.co.uk/news/world/rss.xml");

    // db.query 대신 seed.ts와 동일한 db.select() 문법을 사용하여 타입 에러를 해결합니다.
    const levelRows = await db
      .select({ id: levels.id })
      .from(levels)
      .where(eq(levels.slug, "advanced"))
      .limit(1);

    const levelId = levelRows[0]?.id || 3;

    // 현재 고급 지문의 최대 orderIndex 확인
    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`max(${passages.orderIndex})` })
      .from(passages)
      .where(eq(passages.levelId, levelId));
    
    let currentOrder = (Number(maxOrderResult[0]?.maxOrder) || 0) + 1;

    const topArticles = feed.items.slice(0, 5);
    let insertedCount = 0;

    for (const item of topArticles) {
      if (!item.title || !item.contentSnippet) continue;

      const content = item.contentSnippet.trim();
      if (content.length < 50) continue;

      const wordCount = content.split(/\s+/).length;
      const durationMinutes = Math.max(1, Math.ceil(wordCount / 100));

      await db.insert(passages).values({
        levelId: levelId,
        title: item.title,
        content: content,
        wordCount: wordCount,
        durationMinutes: durationMinutes,
        orderIndex: currentOrder++,
      }).onConflictDoNothing();

      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `성공적으로 ${insertedCount}개의 뉴스를 수집했습니다!`,
    });
  } catch (error: any) {
    console.error("News fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch news" }, { status: 500 });
  }
}
