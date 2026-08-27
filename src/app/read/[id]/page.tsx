import { db } from "@/db";
import { passages, levels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ReadingView } from "@/components/reading-view";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const passageId = parseInt(id, 10);
  if (Number.isNaN(passageId)) {
    notFound();
  }

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
    notFound();
  }

  const row = rows[0];
  if (!row.levelSlug || !row.levelName || !row.levelColor) {
    notFound();
  }

  const passage = {
    ...row,
    levelSlug: row.levelSlug,
    levelName: row.levelName,
    levelColor: row.levelColor,
  };

  return (
    <main className="h-screen">
      <ReadingView passage={passage} />
    </main>
  );
}
