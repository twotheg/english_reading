import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const levels = pgTable(
  "levels",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    color: varchar("color", { length: 50 }).notNull().default("#3b82f6"),
    icon: varchar("icon", { length: 50 }).notNull().default("book-open"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("levels_slug_idx").on(table.slug),
  })
);

export const passages = pgTable(
  "passages",
  {
    id: serial("id").primaryKey(),
    levelId: integer("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(10),
    wordCount: integer("word_count").notNull().default(0),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    levelIdx: index("passages_level_idx").on(table.levelId),
    orderIdx: index("passages_order_idx").on(table.levelId, table.orderIndex),
  })
);

export const words = pgTable(
  "words",
  {
    id: serial("id").primaryKey(),
    word: varchar("word", { length: 100 }).notNull(),
    normalized: varchar("normalized", { length: 100 }).notNull(),
    pronunciation: varchar("pronunciation", { length: 255 }),
    partOfSpeech: varchar("part_of_speech", { length: 100 }),
    definitions: jsonb("definitions").$type<string[]>(),
    audioUrl: text("audio_url"),
    fetchedAt: timestamp("fetched_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    normalizedIdx: uniqueIndex("words_normalized_idx").on(table.normalized),
    wordIdx: index("words_word_idx").on(table.word),
  })
);

export const levelsRelations = relations(levels, ({ many }) => ({
  passages: many(passages),
}));

export const passagesRelations = relations(passages, ({ one }) => ({
  level: one(levels, { fields: [passages.levelId], references: [levels.id] }),
}));

export type Level = typeof levels.$inferSelect;
export type NewLevel = typeof levels.$inferInsert;
export type Passage = typeof passages.$inferSelect;
export type NewPassage = typeof passages.$inferInsert;
export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
