import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ============================================================================
// Agency Router
// ============================================================================

const agencyRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create agency
      const result = await db.createAgency({
        name: input.name,
        ownerId: ctx.user.id,
      });

      const agencyId = Number((result as any).insertId);

      // Add creator as owner
      await db.addAgencyMember({
        agencyId,
        userId: ctx.user.id,
        role: "owner",
      });

      return { agencyId };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const agencies = await db.getAgenciesByUserId(ctx.user.id);
    return agencies;
  }),

  get: protectedProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(async ({ input }) => {
      const agency = await db.getAgencyById(input.agencyId);
      return agency;
    }),

  members: protectedProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(async ({ input }) => {
      const members = await db.getAgencyMembers(input.agencyId);
      return members;
    }),
});

// ============================================================================
// Client Router
// ============================================================================

const clientRouter = router({
  create: protectedProcedure
    .input(z.object({
      agencyId: z.number(),
      name: z.string().min(1),
      industry: z.string().optional(),
      website: z.string().optional(),
      status: z.enum(["prospect", "active", "paused", "churned"]).default("prospect"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await db.createClient(input);
      return { clientId: Number((result as any).insertId) };
    }),

  list: protectedProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(async ({ input }) => {
      const clients = await db.getClientsByAgency(input.agencyId);
      return clients;
    }),

  get: protectedProcedure
    .input(z.object({ clientId: z.number(), agencyId: z.number() }))
    .query(async ({ input }) => {
      const client = await db.getClientById(input.clientId, input.agencyId);
      return client;
    }),

  update: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      agencyId: z.number(),
      name: z.string().optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      status: z.enum(["prospect", "active", "paused", "churned"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { clientId, agencyId, ...data } = input;
      await db.updateClient(clientId, agencyId, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ clientId: z.number(), agencyId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteClient(input.clientId, input.agencyId);
      return { success: true };
    }),
});

// ============================================================================
// Contact Router
// ============================================================================

const contactRouter = router({
  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.string().optional(),
      isPrimary: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const result = await db.createContact(input);
      return { contactId: Number((result as any).insertId) };
    }),

  list: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const contacts = await db.getContactsByClient(input.clientId);
      return contacts;
    }),

  update: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.string().optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { contactId, ...data } = input;
      await db.updateContact(contactId, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteContact(input.contactId);
      return { success: true };
    }),
});

// ============================================================================
// Engagement Router
// ============================================================================

const engagementRouter = router({
  create: protectedProcedure
    .input(z.object({
      agencyId: z.number(),
      clientId: z.number(),
      serviceTier: z.string().min(1),
      fee: z.number().min(0),
      startDate: z.date(),
      endDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await db.createEngagement(input);
      const engagementId = Number((result as any).insertId);

      // Create default onboarding tasks
      const defaultTasks = [
        "Kickoff meeting scheduled",
        "Access credentials provided",
        "Brand assets collected",
        "Project goals documented",
        "Communication channels set up",
      ];

      for (const title of defaultTasks) {
        await db.createOnboardingTask({
          engagementId,
          title,
          isDone: false,
        });
      }

      return { engagementId };
    }),

  list: protectedProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(async ({ input }) => {
      const engagements = await db.getEngagementsByAgency(input.agencyId);
      return engagements;
    }),

  get: protectedProcedure
    .input(z.object({ engagementId: z.number(), agencyId: z.number() }))
    .query(async ({ input }) => {
      const engagement = await db.getEngagementById(input.engagementId, input.agencyId);
      return engagement;
    }),

  update: protectedProcedure
    .input(z.object({
      engagementId: z.number(),
      agencyId: z.number(),
      serviceTier: z.string().optional(),
      fee: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      status: z.enum(["onboarding", "active", "paused", "complete"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { engagementId, agencyId, ...data } = input;
      await db.updateEngagement(engagementId, agencyId, data);
      return { success: true };
    }),

  getTasks: protectedProcedure
    .input(z.object({ engagementId: z.number() }))
    .query(async ({ input }) => {
      const tasks = await db.getTasksByEngagement(input.engagementId);
      return tasks;
    }),

  updateTask: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      isDone: z.boolean().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { taskId, ...data } = input;
      
      // If marking as done, set completedAt
      if (data.isDone === true) {
        await db.updateOnboardingTask(taskId, {
          ...data,
          completedAt: new Date(),
        });
      } else {
        await db.updateOnboardingTask(taskId, data);
      }
      
      return { success: true };
    }),

  addTask: protectedProcedure
    .input(z.object({
      engagementId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await db.createOnboardingTask(input);
      return { taskId: Number((result as any).insertId) };
    }),
});

// ============================================================================
// Proposal Router
// ============================================================================

const proposalRouter = router({
  create: protectedProcedure
    .input(z.object({
      agencyId: z.number(),
      clientId: z.number(),
      title: z.string().min(1),
      brief: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createProposal({
        ...input,
        generatedBy: ctx.user.id,
        status: "draft",
      });
      return { proposalId: Number((result as any).insertId) };
    }),

  list: protectedProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(async ({ input }) => {
      const proposals = await db.getProposalsByAgency(input.agencyId);
      return proposals;
    }),

  get: protectedProcedure
    .input(z.object({ proposalId: z.number(), agencyId: z.number() }))
    .query(async ({ input }) => {
      const proposal = await db.getProposalById(input.proposalId, input.agencyId);
      return proposal;
    }),

  update: protectedProcedure
    .input(z.object({
      proposalId: z.number(),
      agencyId: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      docUrl: z.string().optional(),
      status: z.enum(["draft", "sent", "approved", "rejected"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { proposalId, agencyId, ...data } = input;
      
      // If status is changing to sent, set sentAt
      if (data.status === "sent") {
        await db.updateProposal(proposalId, agencyId, {
          ...data,
          sentAt: new Date(),
        });
      } else if (data.status === "approved") {
        await db.updateProposal(proposalId, agencyId, {
          ...data,
          approvedAt: new Date(),
        });
      } else {
        await db.updateProposal(proposalId, agencyId, data);
      }
      
      return { success: true };
    }),
});

// ============================================================================
// Report Router
// ============================================================================

const reportRouter = router({
  create: protectedProcedure
    .input(z.object({
      agencyId: z.number(),
      engagementId: z.number(),
      title: z.string().min(1),
      summary: z.string().min(1),
      risks: z.string().optional(),
      nextSteps: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createReport({
        ...input,
        generatedBy: ctx.user.id,
      });
      return { reportId: Number((result as any).insertId) };
    }),

  list: protectedProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(async ({ input }) => {
      const reports = await db.getReportsByAgency(input.agencyId);
      return reports;
    }),

  get: protectedProcedure
    .input(z.object({ reportId: z.number(), agencyId: z.number() }))
    .query(async ({ input }) => {
      const report = await db.getReportById(input.reportId, input.agencyId);
      return report;
    }),

  update: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      agencyId: z.number(),
      title: z.string().optional(),
      summary: z.string().optional(),
      risks: z.string().optional(),
      nextSteps: z.string().optional(),
      docUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { reportId, agencyId, ...data } = input;
      await db.updateReport(reportId, agencyId, data);
      return { success: true };
    }),

  send: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      agencyId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.updateReport(input.reportId, input.agencyId, {
        sentAt: new Date(),
      });
      return { success: true };
    }),
});

// ============================================================================
// Communication Router
// ============================================================================

const communicationRouter = router({
  list: protectedProcedure
    .input(z.object({ agencyId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const communications = await db.getCommunicationsByAgency(input.agencyId, input.limit);
      return communications;
    }),

  byClient: protectedProcedure
    .input(z.object({ clientId: z.number(), agencyId: z.number() }))
    .query(async ({ input }) => {
      const communications = await db.getCommunicationsByClient(input.clientId, input.agencyId);
      return communications;
    }),
});

// ============================================================================
// Activity Router
// ============================================================================

const activityRouter = router({
  list: protectedProcedure
    .input(z.object({ agencyId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const activities = await db.getActivityLogsByAgency(input.agencyId, input.limit);
      return activities;
    }),

  log: protectedProcedure
    .input(z.object({
      agencyId: z.number(),
      action: z.string(),
      entityType: z.string().optional(),
      entityId: z.number().optional(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.createActivityLog({
        ...input,
        userId: ctx.user.id,
      });
      return { success: true };
    }),
});

// ============================================================================
// Main App Router
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  agency: agencyRouter,
  clients: clientRouter,
  contacts: contactRouter,
  engagement: engagementRouter,
  proposal: proposalRouter,
  report: reportRouter,
  communication: communicationRouter,
  activity: activityRouter,
});

export type AppRouter = typeof appRouter;
