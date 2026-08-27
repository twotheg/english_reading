export interface Level {
  id: number;
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  orderIndex: number;
  createdAt: Date | string;
  passageCount?: number;
}

export interface PassageMeta {
  id: number;
  title: string;
  durationMinutes: number;
  wordCount: number;
  orderIndex: number;
  levelSlug: string;
  levelName: string;
  levelColor: string;
}

export interface PassageDetail extends PassageMeta {
  content: string;
}

export interface PaginatedPassages {
  passages: PassageMeta[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WordDefinition {
  word: string;
  normalized: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definitions?: string[];
  audioUrl?: string;
  cached?: boolean;
}

export interface ReadingProgress {
  passageId: number;
  lastWordIndex: number;
  completed: boolean;
  updatedAt: string;
}
