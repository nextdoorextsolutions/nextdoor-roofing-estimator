import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, leads, estimates, InsertLead, InsertEstimate, Lead, Estimate } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Lead functions
export async function createLead(lead: InsertLead): Promise<Lead | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(leads).values(lead);
    const insertId = result[0].insertId;
    const newLead = await db.select().from(leads).where(eq(leads.id, insertId)).limit(1);
    return newLead[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create lead:", error);
    throw error;
  }
}

export async function getLeadById(id: number): Promise<Lead | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lead: database not available");
    return null;
  }

  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leads: database not available");
    return [];
  }

  return await db.select().from(leads).orderBy(desc(leads.createdAt));
}

// Estimate functions
export async function createEstimate(estimate: InsertEstimate): Promise<Estimate | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create estimate: database not available");
    return null;
  }

  try {
    const result = await db.insert(estimates).values(estimate);
    const insertId = result[0].insertId;
    const newEstimate = await db.select().from(estimates).where(eq(estimates.id, insertId)).limit(1);
    return newEstimate[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create estimate:", error);
    throw error;
  }
}

export async function getEstimateById(id: number): Promise<Estimate | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get estimate: database not available");
    return null;
  }

  const result = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  return result[0] || null;
}

export async function getEstimateByLeadId(leadId: number): Promise<Estimate | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get estimate: database not available");
    return null;
  }

  const result = await db.select().from(estimates).where(eq(estimates.leadId, leadId)).limit(1);
  return result[0] || null;
}

export async function getAllEstimates(): Promise<Estimate[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get estimates: database not available");
    return [];
  }

  return await db.select().from(estimates).orderBy(desc(estimates.createdAt));
}

export async function getLeadWithEstimate(leadId: number): Promise<{ lead: Lead; estimate: Estimate | null } | null> {
  const lead = await getLeadById(leadId);
  if (!lead) return null;
  
  const estimate = await getEstimateByLeadId(leadId);
  return { lead, estimate };
}
