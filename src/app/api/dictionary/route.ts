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

  // 특수문자 등을 제거하고 순수 단어만 추출
  const normalized = normalizeWord(raw);
  if (!normalized || /\d/.test(normalized)) {
    return NextResponse.json({ error: "Invalid word" }, { status: 400 });
  }

  try {
    // 1. 먼저 내 데이터베이스(캐시)에 이미 찾아둔 단어 뜻이 있는지 확인
    const cached = await db
      .select()
      .from(words)
      .where(eq(words.normalized, normalized))
      .limit(1);

    if (cached.length > 0 && cached[0].definitions && cached[0].definitions.length > 0) {
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

    // 2. 데이터베이스에 없으면 1차 사전 API (dictionaryapi.dev) 호출
    let response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`,
      { next: { revalidate: 86400 } }
    );

    let definitions: string[] = [];
    let partOfSpeech: string | undefined = undefined;
    let phonetic = "";
    let audioUrl = "";
    let finalWord = normalized;

    // 3. 1차 사전에서 단어를 찾았을 때 (원형 단어일 경우)
    if (response.ok) {
      const data = (await response.json()) as DictionaryEntry[];
      const entry = data[0];

      finalWord = entry.word;
      phonetic = entry.phonetic || entry.phonetics.find((p) => p.text)?.text || "";
      audioUrl = entry.phonetics.find((p) => p.audio)?.audio || "";

      const meanings = entry.meanings.slice(0, 3);
      definitions = meanings.flatMap((m) =>
        m.definitions.slice(0, 2).map((d) => d.definition)
      );
      partOfSpeech = meanings.map((m) => m.partOfSpeech).join(", ") || undefined;
    } 
    // 4. [문제 해결 핵심!] 1차 사전에서 못 찾았을 때 (과거형, 분사형 등)
    // 좀 더 유연한 대체 API(Datamuse API)를 사용하여 뜻을 찾아냅니다.
    else {
      const fallbackResponse = await fetch(
        `https://api.datamuse.com/words?sp=${encodeURIComponent(normalized)}&md=d&max=1`,
        { next: { revalidate: 86400 } }
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0 && fallbackData[0].defs) {
          finalWord = fallbackData[0].word; // 원형 단어로 교체될 수 있음
          
          // Datamuse API는 "n\t 뜻" 형태로 반환하므로 보기 좋게 잘라냅니다.
          definitions = fallbackData[0].defs.slice(0, 3).map((def: string) => {
            const parts = def.split('\t');
            return parts.length > 1 ? parts[1] : def;
          });
          
          // 품사 추출 (n, v, adj 등)
          const posList = fallbackData[0].defs.map((def: string) => def.split('\t')[0]);
          partOfSpeech = [...new Set(posList)].join(", ");
        }
      }
    }

    // 두 API 모두에서 뜻을 찾지 못했을 경우
    if (definitions.length === 0) {
      return NextResponse.json(
        { error: "Dictionary entry not found" },
        { status: 404 }
      );
    }

    // 5. 성공적으로 찾은 뜻을 데이터베이스에 저장
    const inserted = await db
      .insert(words)
      .values({
        word: finalWord,
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
          word: finalWord,
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
