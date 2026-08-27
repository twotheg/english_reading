import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { words } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizeWord } from "@/lib/utils";

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: { text?: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string }[];
  }[];
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("word")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 });
  }

  const normalized = normalizeWord(raw);
  if (!normalized || /\d/.test(normalized)) {
    return NextResponse.json({ error: "Invalid word" }, { status: 400 });
  }

  try {
    const cached = await db
      .select()
      .from(words)
      .where(eq(words.normalized, normalized))
      .limit(1);

    if (cached.length > 0 && cached[0].definitions) {
      return NextResponse.json({
        word: cached[0].word,
        normalized: cached[0].normalized,
        pronunciation: cached[0].pronunciation,
        partOfSpeech: cached[0].partOfSpeech,
        definitions: cached[0].definitions,
        audioUrl: cached[0].audioUrl,
        cached: true,
      });
    }

    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Dictionary entry not found" },
        { status: 404 }
      );
    }

    const data = (await response.json()) as DictionaryEntry[];
    const entry = data[0];

    const phonetic =
      entry.phonetic ||
      entry.phonetics.find((p) => p.text)?.text ||
      "";

    const audioUrl =
      entry.phonetics.find((p) => p.audio)?.audio || "";

    const meanings = entry.meanings.slice(0, 3);
    const definitions = meanings.flatMap((m) =>
      m.definitions.slice(0, 2).map((d) => d.definition)
    );

    const partOfSpeech = meanings.map((m) => m.partOfSpeech).join(", ") || undefined;

    const inserted = await db
      .insert(words)
      .values({
        word: entry.word,
        normalized,
        pronunciation: phonetic || undefined,
        partOfSpeech,
        definitions,
        audioUrl: audioUrl || undefined,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: words.normalized,
        set: {
          pronunciation: phonetic || undefined,
          partOfSpeech,
          definitions,
          audioUrl: audioUrl || undefined,
          fetchedAt: new Date(),
        },
      })
      .returning();

    const record = inserted[0];

    return NextResponse.json({
      word: record.word,
      normalized: record.normalized,
      pronunciation: record.pronunciation,
      partOfSpeech: record.partOfSpeech,
      definitions: record.definitions,
      audioUrl: record.audioUrl,
      cached: false,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dictionary" },
      { status: 500 }
    );
  }
}
