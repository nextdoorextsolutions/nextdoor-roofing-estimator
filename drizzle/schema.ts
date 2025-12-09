import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leads table for storing customer contact information
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address").notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  // CRM status tracking
  status: mysqlEnum("status", ["new", "contacted", "quoted", "won", "lost"]).default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Estimates table for storing roof quote data
 */
export const estimates = mysqlTable("estimates", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  // Roof data from Solar API
  totalRoofArea: int("totalRoofArea"), // in sq ft
  averagePitch: int("averagePitch"), // pitch value (e.g., 6 for 6/12)
  eaveLength: int("eaveLength"), // in feet
  ridgeValleyLength: int("ridgeValleyLength"), // in feet
  // Calculated values
  adjustedArea: int("adjustedArea"), // with waste factor
  hasPitchSurcharge: boolean("hasPitchSurcharge").default(false),
  // Pricing tiers (stored in cents)
  goodPrice: int("goodPrice"),
  betterPrice: int("betterPrice"),
  bestPrice: int("bestPrice"),
  // Selected tier
  selectedTier: mysqlEnum("selectedTier", ["good", "better", "best"]),
  // Status
  status: mysqlEnum("status", ["pending", "manual_quote", "completed"]).default("pending"),
  // Satellite image URL
  satelliteImageUrl: text("satelliteImageUrl"),
  // API data availability
  solarApiAvailable: boolean("solarApiAvailable").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = typeof estimates.$inferInsert;
