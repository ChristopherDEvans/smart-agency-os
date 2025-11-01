import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  agencies,
  agencyMembers,
  clients,
  contacts,
  engagements,
  onboardingTasks,
  proposals,
  reports,
  communications,
  chatSessions,
  chatMessages,
  attachments,
  activityLogs,
  type Agency,
  type InsertAgency,
  type AgencyMember,
  type InsertAgencyMember,
  type Client,
  type InsertClient,
  type Contact,
  type InsertContact,
  type Engagement,
  type InsertEngagement,
  type OnboardingTask,
  type InsertOnboardingTask,
  type Proposal,
  type InsertProposal,
  type Report,
  type InsertReport,
  type Communication,
  type InsertCommunication,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type Attachment,
  type InsertAttachment,
  type ActivityLog,
  type InsertActivityLog,
} from "../drizzle/schema";
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

// ============================================================================
// User Management
// ============================================================================

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

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Agency Management
// ============================================================================

export async function createAgency(data: InsertAgency) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(agencies).values(data);
  return result;
}

export async function getAgencyById(agencyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agencies).where(eq(agencies.id, agencyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAgenciesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      agency: agencies,
      role: agencyMembers.role,
    })
    .from(agencyMembers)
    .innerJoin(agencies, eq(agencyMembers.agencyId, agencies.id))
    .where(eq(agencyMembers.userId, userId));

  return result;
}

export async function addAgencyMember(data: InsertAgencyMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(agencyMembers).values(data);
  return result;
}

export async function getAgencyMembers(agencyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      member: agencyMembers,
      user: users,
    })
    .from(agencyMembers)
    .innerJoin(users, eq(agencyMembers.userId, users.id))
    .where(eq(agencyMembers.agencyId, agencyId));

  return result;
}

// ============================================================================
// Client Management
// ============================================================================

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(data);
  return result;
}

export async function getClientsByAgency(agencyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.agencyId, agencyId))
    .orderBy(desc(clients.createdAt));

  return result;
}

export async function getClientById(clientId: number, agencyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateClient(clientId: number, agencyId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(clients)
    .set(data)
    .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)));

  return result;
}

export async function deleteClient(clientId: number, agencyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(clients)
    .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)));

  return result;
}

// ============================================================================
// Contact Management
// ============================================================================

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contacts).values(data);
  return result;
}

export async function getContactsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(contacts)
    .where(eq(contacts.clientId, clientId))
    .orderBy(desc(contacts.isPrimary), asc(contacts.name));

  return result;
}

export async function updateContact(contactId: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(contacts)
    .set(data)
    .where(eq(contacts.id, contactId));

  return result;
}

export async function deleteContact(contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(contacts).where(eq(contacts.id, contactId));
  return result;
}

// ============================================================================
// Engagement Management
// ============================================================================

export async function createEngagement(data: InsertEngagement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(engagements).values(data);
  return result;
}

export async function getEngagementsByAgency(agencyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      engagement: engagements,
      client: clients,
    })
    .from(engagements)
    .innerJoin(clients, eq(engagements.clientId, clients.id))
    .where(eq(engagements.agencyId, agencyId))
    .orderBy(desc(engagements.createdAt));

  return result;
}

export async function getEngagementById(engagementId: number, agencyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(engagements)
    .where(and(eq(engagements.id, engagementId), eq(engagements.agencyId, agencyId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateEngagement(engagementId: number, agencyId: number, data: Partial<InsertEngagement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(engagements)
    .set(data)
    .where(and(eq(engagements.id, engagementId), eq(engagements.agencyId, agencyId)));

  return result;
}

// ============================================================================
// Onboarding Task Management
// ============================================================================

export async function createOnboardingTask(data: InsertOnboardingTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(onboardingTasks).values(data);
  return result;
}

export async function getTasksByEngagement(engagementId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(onboardingTasks)
    .where(eq(onboardingTasks.engagementId, engagementId))
    .orderBy(asc(onboardingTasks.dueDate), asc(onboardingTasks.createdAt));

  return result;
}

export async function updateOnboardingTask(taskId: number, data: Partial<InsertOnboardingTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(onboardingTasks)
    .set(data)
    .where(eq(onboardingTasks.id, taskId));

  return result;
}

// ============================================================================
// Proposal Management
// ============================================================================

export async function createProposal(data: InsertProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(proposals).values(data);
  return result;
}

export async function getProposalsByAgency(agencyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      proposal: proposals,
      client: clients,
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.agencyId, agencyId))
    .orderBy(desc(proposals.createdAt));

  return result;
}

export async function getProposalById(proposalId: number, agencyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), eq(proposals.agencyId, agencyId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateProposal(proposalId: number, agencyId: number, data: Partial<InsertProposal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(proposals)
    .set(data)
    .where(and(eq(proposals.id, proposalId), eq(proposals.agencyId, agencyId)));

  return result;
}

// ============================================================================
// Report Management
// ============================================================================

export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reports).values(data);
  return result;
}

export async function getReportsByAgency(agencyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      report: reports,
      engagement: engagements,
      client: clients,
    })
    .from(reports)
    .innerJoin(engagements, eq(reports.engagementId, engagements.id))
    .innerJoin(clients, eq(engagements.clientId, clients.id))
    .where(eq(reports.agencyId, agencyId))
    .orderBy(desc(reports.createdAt));

  return result;
}

export async function getReportById(reportId: number, agencyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.agencyId, agencyId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateReport(reportId: number, agencyId: number, data: Partial<InsertReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(reports)
    .set(data)
    .where(and(eq(reports.id, reportId), eq(reports.agencyId, agencyId)));

  return result;
}

// ============================================================================
// Communication Management
// ============================================================================

export async function createCommunication(data: InsertCommunication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(communications).values(data);
  return result;
}

export async function getCommunicationsByClient(clientId: number, agencyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(communications)
    .where(and(eq(communications.clientId, clientId), eq(communications.agencyId, agencyId)))
    .orderBy(desc(communications.timestamp));

  return result;
}

export async function getCommunicationsByAgency(agencyId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      communication: communications,
      client: clients,
    })
    .from(communications)
    .innerJoin(clients, eq(communications.clientId, clients.id))
    .where(eq(communications.agencyId, agencyId))
    .orderBy(desc(communications.timestamp))
    .limit(limit);

  return result;
}

// ============================================================================
// Chat Session Management
// ============================================================================

export async function createChatSession(data: InsertChatSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatSessions).values(data);
  return result;
}

export async function getChatSessionsByUser(userId: number, agencyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.userId, userId), eq(chatSessions.agencyId, agencyId)))
    .orderBy(desc(chatSessions.updatedAt));

  return result;
}

export async function createChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatMessages).values(data);
  return result;
}

export async function getMessagesBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));

  return result;
}

// ============================================================================
// Activity Log Management
// ============================================================================

export async function createActivityLog(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(activityLogs).values(data);
  return result;
}

export async function getActivityLogsByAgency(agencyId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      log: activityLogs,
      user: users,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.agencyId, agencyId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  return result;
}
