import { NextResponse } from "next/server";
import { db } from "@/db";
import { passages } from "@/db/schema"; 
import Parser from "rss-parser";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const parser = new Parser();
    const feed = await parser.parseURL('http://feeds.bbci.co.uk/news/world/rss.xml');

    const topArticles = feed.items.slice(0, 3);

    for (const item of topArticles) {
      if (!item.title || !item.contentSnippet) continue;

      const content = item.contentSnippet.trim();
      if (content.length < 50) continue;

      // 에러 해결: levelName 대신 DB 스키마에 맞는 levelId(3 = Advanced)를 사용합니다.
      await db.insert(passages).values({
        title: item.title,
        content: content,
        levelId: 3 
      }).onConflictDoNothing(); 
    }

    return NextResponse.json({ success: true, message: "Daily news updated successfully!" });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
