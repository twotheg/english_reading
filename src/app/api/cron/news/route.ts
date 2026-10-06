import { NextResponse } from "next/server";
import { db } from "@/db";
// 주의: 아래 passages 위치는 회원님의 스키마 경로에 맞게 확인해주세요 (보통 @/db/schema)
import { passages } from "@/db/schema"; 
import Parser from "rss-parser";

export async function GET(request: Request) {
  // 1. 보안 설정: 아무나 이 주소로 접속해서 뉴스를 마구 업데이트하지 못하게 막습니다.
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const parser = new Parser();
    // BBC World News의 RSS 피드 주소 (무료)
    const feed = await parser.parseURL('http://feeds.bbci.co.uk/news/world/rss.xml');

    // 최신 기사 딱 3개만 가져오기 (매일 3개씩 누적)
    const topArticles = feed.items.slice(0, 3);

    for (const item of topArticles) {
      if (!item.title || !item.contentSnippet) continue;

      // 기사 내용이 너무 짧으면 제외
      const content = item.contentSnippet.trim();
      if (content.length < 50) continue;

      const wordsCount = content.split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordsCount / 100)); // 100단어당 1분 계산

      // DB에 기사 삽입
      // (이미 같은 제목의 기사가 있다면 무시하는 로직이 필요하지만, 여기서는 단순 삽입합니다)
      await db.insert(passages).values({
        title: item.title,
        content: content,
        levelName: "Advanced",
        levelColor: "#ef4444", // 빨간색 계열
        wordsCount: wordsCount,
        readingTime: readingTime,
        // 필요하다면 createdAt 등의 필드 추가
      }).onConflictDoNothing(); // 중복 방지 (Drizzle 설정에 따라 다를 수 있음)
    }

    return NextResponse.json({ success: true, message: "Daily news updated successfully!" });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
