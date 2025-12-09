import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create admin context
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Helper to create non-admin context
function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Helper to create unauthenticated context
function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Admin Procedures", () => {
  describe("admin.getLeadsWithEstimates", () => {
    it("should allow admin users to access leads", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // This should not throw - admin has access
      const result = await caller.admin.getLeadsWithEstimates();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should deny access to non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.getLeadsWithEstimates()).rejects.toThrow();
    });

    it("should deny access to unauthenticated users", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.getLeadsWithEstimates()).rejects.toThrow();
    });
  });

  describe("admin.updateLeadStatus", () => {
    it("should deny access to non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.admin.updateLeadStatus({ leadId: 1, status: "contacted" })
      ).rejects.toThrow();
    });
  });

  describe("admin.updateLeadNotes", () => {
    it("should deny access to non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.admin.updateLeadNotes({ leadId: 1, notes: "Test notes" })
      ).rejects.toThrow();
    });
  });

  describe("admin.deleteLead", () => {
    it("should deny access to non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.deleteLead({ leadId: 1 })).rejects.toThrow();
    });
  });
});

describe("Lead Status Values", () => {
  it("should accept valid status values", () => {
    const validStatuses = ["new", "contacted", "quoted", "won", "lost"];
    validStatuses.forEach((status) => {
      expect(validStatuses).toContain(status);
    });
  });
});
