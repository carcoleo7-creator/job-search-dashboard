import { pgTable, text, timestamp, integer, jsonb, boolean, serial } from "drizzle-orm/pg-core";

export interface ProfileData {
  personal: { name: string; email: string; phone: string; linkedin: string; location: string };
  headline: string;
  summary: string;
  workExperience: Array<{
    company: string; title: string; location: string; start: string; end: string; bullets: string[];
  }>;
  skills: { hard: string[]; tools: string[] };
  education: Array<{ degree: string; field: string; school: string; location: string; year: string }>;
}

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ats_type: text("ats_type").notNull(),
  ats_identifier: text("ats_identifier").notNull(),
  careers_url: text("careers_url").notNull(),
  auto_apply: boolean("auto_apply").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  preferred_skill_modes: jsonb("preferred_skill_modes").$type<string[]>().default([]),
  target_roles: jsonb("target_roles").$type<string[]>().default([]),
  last_scraped_at: timestamp("last_scraped_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  company_id: text("company_id").notNull().references(() => companies.id),
  external_id: text("external_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  location: text("location"),
  department: text("department"),
  description_raw: text("description_raw"),
  is_relevant: boolean("is_relevant").default(false).notNull(),
  relevance_score: integer("relevance_score").default(0),
  status: text("status").default("new").notNull(), // new | cv_generated | applied | rejected
  found_at: timestamp("found_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const generatedCvs = pgTable("generated_cvs", {
  id: serial("id").primaryKey(),
  job_id: integer("job_id").notNull().references(() => jobs.id),
  skill_mode: text("skill_mode").notNull(),
  keyword_coverage: integer("keyword_coverage"),
  summary: text("summary"),
  content_json: jsonb("content_json"),
  pdf_url: text("pdf_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  is_active: boolean("is_active").default(false).notNull(),
  data: jsonb("data").$type<ProfileData>().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const searchSettings = pgTable("search_settings", {
  id: integer("id").primaryKey().default(1),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  location_filter: text("location_filter").default("remote").notNull(), // remote | hybrid | any
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type GeneratedCv = typeof generatedCvs.$inferSelect;
export type SearchSettings = typeof searchSettings.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
