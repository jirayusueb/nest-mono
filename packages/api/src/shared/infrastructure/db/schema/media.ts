import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

const createdAt = () =>
  timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull();

const updatedAt = () =>
  timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  key: text("key").notNull().unique(),
  contentType: text("content_type").notNull(),
  bytes: integer("bytes").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
