import { NextResponse } from "next/server";
import { db } from "@/db";
import { passages, levels } from "@/db/schema"; 
import { eq, sql } from "drizzle-orm";
import Parser from "rss-parser";

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
      if (insertedCount >= 3) break;

      const rawText = (item as any).fullContent || item.content || item.summary || "";
      const cleanContent = stripHtml(rawText);
      const wordCount = cleanContent.split(/\s+/).length;

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

    // [핵심] 최신 50개 기사만 유지하고 오래된 기사는 자동 삭제
    await db.execute(sql`
      DELETE FROM passages 
      WHERE level_id = ${levelId} 
      AND id NOT IN (
        SELECT id FROM passages 
        WHERE level_id = ${levelId} 
        ORDER BY order_index DESC, id DESC 
        LIMIT 50
      )
    `);

    return NextResponse.json({
      success: true,
      message: `성공적으로 기사 ${insertedCount}개를 수집하고 최신 50개를 유지하도록 정리했습니다!`,
    });
  } catch (error: any) {
    console.error("News fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch news" }, { status: 500 });
  }
}
