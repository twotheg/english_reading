import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { WordDefinition, PassageMeta, ReadingProgress } from "@/lib/types";

interface AppDB extends DBSchema {
  definitions: {
    key: string;
    value: WordDefinition & { storedAt: number };
  };
  progress: {
    key: number;
    value: ReadingProgress;
  };
  passages: {
    key: number;
    value: PassageMeta & { storedAt: number };
  };
}

const DB_NAME = "english-reader-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("definitions", { keyPath: "normalized" });
        db.createObjectStore("progress", { keyPath: "passageId" });
        db.createObjectStore("passages", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function getCachedDefinition(
  word: string
): Promise<WordDefinition | undefined> {
  try {
    const db = await getDB();
    return await db.get("definitions", word.toLowerCase());
  } catch {
    return undefined;
  }
}

export async function cacheDefinition(def: WordDefinition): Promise<void> {
  try {
    const db = await getDB();
    await db.put("definitions", { ...def, storedAt: Date.now() });
  } catch {
    // ignore
  }
}

export async function getProgress(passageId: number): Promise<ReadingProgress | undefined> {
  try {
    const db = await getDB();
    return await db.get("progress", passageId);
  } catch {
    return undefined;
  }
}

export async function saveProgress(progress: ReadingProgress): Promise<void> {
  try {
    const db = await getDB();
    await db.put("progress", progress);
  } catch {
    // ignore
  }
}

export async function getAllProgress(): Promise<ReadingProgress[]> {
  try {
    const db = await getDB();
    return await db.getAll("progress");
  } catch {
    return [];
  }
}

export async function cachePassageMeta(passage: PassageMeta): Promise<void> {
  try {
    const db = await getDB();
    await db.put("passages", { ...passage, storedAt: Date.now() });
  } catch {
    // ignore
  }
}

export async function getCachedPassageMeta(id: number): Promise<PassageMeta | undefined> {
  try {
    const db = await getDB();
    return await db.get("passages", id);
  } catch {
    return undefined;
  }
}
