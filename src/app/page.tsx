import { db } from "@/db";
import { levels } from "@/db/schema";
import { LevelCard } from "@/components/level-card";
import { BookOpenText, Headphones } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 지문 개수를 매번 세는 무거운 쿼리를 제거하고 레벨 정보만 빠르게 가져옵니다.
  const levelRows = await db.select().from(levels).orderBy(levels.orderIndex);

  // LevelCard 컴포넌트의 타입 에러 방지를 위해 기본값 0을 전달합니다.
  const levelsWithCount = levelRows.map((level) => ({
    ...level,
    passageCount: 0,
  }));

  return (
    <main className="flex min-h-screen flex-col">
      <section className="bg-gradient-to-b from-blue-900/40 to-slate-950 px-5 pb-8 pt-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20">
            <BookOpenText className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            ReadFlow: English Reading
          </h1>
          <p className="mt-2 text-base text-slate-300">
            Choose your level and read English for every day.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300">
            <Headphones className="h-3.5 w-3.5" />
            Touch words to listen. Long press for meanings.
          </div>
        </div>
      </section>

      <section className="flex-1 px-5 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Select Level
          </h2>
          {levelsWithCount.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
              <p>No levels found yet.</p>
              <p className="mt-1 text-sm">
                Run the seed script to populate reading materials.
              </p>
            </div>
          ) : (
            levelsWithCount.map((level) => <LevelCard key={level.id} level={level} />)
          )}
        </div>
      </section>
    </main>
  );
}
