import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import { handleDemo } from "./routes/demo";
import {
  handleLogin,
  handleGetMe,
  handleLogout,
} from "./routes/auth";
import { handleGetStats } from "./routes/dashboard";
import {
  handleGetTickets,
  handleCreateTicket,
  handleGetTicket,
  handleUpdateTicket,
  handleArchiveTicket,
} from "./routes/tickets";
import {
  handleGetKBItems,
  handleCreateKBItem,
  handleGetKBItem,
  handleDeleteKBItem,
} from "./routes/knowledge-base";
import { handleChangePassword } from "./routes/settings";
import {
  handleGetUsers,
  handleUpdateUserRole,
  handleGetActivityLogs,
  handleGetUserStats,
} from "./routes/admin";
// NEW: Permission middleware
import { loadUserPermissions, requirePermission, requireAnyPermission } from "./middleware/permissions";
// NEW: Account management routes
import {
  handleGetAccounts,
  handleCreateAccount,
  handleGetAccount,
  handleUpdateAccount,
  handleDeleteAccount,
} from "./routes/accounts";
// NEW: Bins management routes
import {
  handleGetBins,
  handleCreateBin,
  handleGetBin,
  handleUpdateBin,
  handleDeleteBin,
  handleTransferTicket,
} from "./routes/bins";
// NEW: Teams management routes
import {
  handleGetTeams,
  handleCreateTeam,
  handleUpdateTeam,
  handleDeleteTeam,
} from "./routes/teams";
// NEW: User management routes
import {
  handleGetUsers as handleGetAllUsers,
  handleGetUser,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleResetPassword,
  handleGetRoles,
  handleAssignRoles,
} from "./routes/user-management";
// NEW: Permissions matrix routes
import {
  handleGetPermissionDefinitions,
  handleGetPermissionsMatrix,
  handleUpdatePermissionsMatrix,
} from "./routes/permissions";

export function createServer() {
  const app = express();

  // Trust proxy - required for proper session cookie handling behind proxies
  const trustProxy = process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production";
  if (trustProxy) {
    app.set("trust proxy", 1);
    console.log("[Server] Trust proxy enabled");
  }

  // CORS configuration with dynamic origin support
  const appUrl = process.env.APP_URL || "http://localhost:8080";
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin requests (no Origin header)
        if (!origin) return callback(null, true);

        // Allow the configured APP_URL
        if (origin === appUrl || origin === appUrl.replace(/:\d+$/, "")) {
          return callback(null, true);
        }

        // Allow localhost and common development URLs
        const devPatterns = [
          /^http:\/\/localhost(:\d+)?$/,
          /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        ];

        // Allow private IP ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
        const privateIPPatterns = [
          /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
          /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
          /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/,
        ];

        // Allow any domain with HTTPS (for production domains)
        const productionPatterns = [
          /^https:\/\/.+$/,
        ];

        const allPatterns = [...devPatterns, ...privateIPPatterns, ...productionPatterns];

        if (allPatterns.some((pattern) => pattern.test(origin))) {
          return callback(null, true);
        }

        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session middleware with enhanced configuration
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET || "your-secret-key";
  const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || "86400000"); // 24 hours default

  // Determine if we should use secure cookies (only for HTTPS)
  const useSecureCookies = isProduction && appUrl.startsWith("https");

  console.log(`[Session] Initializing with:`, {
    secure: useSecureCookies,
    sameSite: "lax",
    maxAge: sessionTimeout,
    trustProxy: trustProxy,
  });

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      proxy: trustProxy,
      cookie: {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        maxAge: sessionTimeout,
        // Set domain only if using a domain-based URL (not IP)
        ...(appUrl.includes("://") && !appUrl.match(/\d+\.\d+\.\d+\.\d+/)
          ? { domain: new URL(appUrl).hostname }
          : {}),
      },
    })
  );

  // ===== HEALTH CHECK ROUTES =====
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ===== AUTHENTICATION ROUTES =====
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/me", handleGetMe);
  app.post("/api/auth/logout", handleLogout);

  // ===== DASHBOARD ROUTES =====
  app.get("/api/dashboard/stats", handleGetStats);

  // ===== TICKETS ROUTES =====
  app.get("/api/tickets", handleGetTickets);
  app.post("/api/tickets", handleCreateTicket);
  app.get("/api/tickets/:id", handleGetTicket);
  app.put("/api/tickets/:id", handleUpdateTicket);
  app.post("/api/tickets/:id/archive", handleArchiveTicket);

  // ===== KNOWLEDGE BASE ROUTES =====
  app.get("/api/knowledge-base", handleGetKBItems);
  app.post("/api/knowledge-base", handleCreateKBItem);
  app.get("/api/knowledge-base/:id", handleGetKBItem);
  app.delete("/api/knowledge-base/:id", handleDeleteKBItem);

  // ===== SETTINGS ROUTES =====
  app.post("/api/settings/change-password", handleChangePassword);

  // ===== ADMIN ROUTES =====
  app.get("/api/admin/users", handleGetUsers);
  app.put("/api/admin/users/:id/role", handleUpdateUserRole);
  app.get("/api/admin/activity-logs", handleGetActivityLogs);
  app.get("/api/admin/user-stats", handleGetUserStats);

  // ===== PERMISSION MIDDLEWARE =====
  // Apply permission loading to all protected routes (skip auth/public endpoints)
  app.use("/api", (req, res, next) => {
    // Skip permission loading for auth and public endpoints
    if (
      req.path.startsWith("/auth/") ||
      req.path === "/ping" ||
      req.path === "/demo"
    ) {
      return next();
    }
    loadUserPermissions(req, res, next);
  });

  // ===== ACCOUNTS ROUTES (Superadmin only) =====
  app.get("/api/accounts", requirePermission("all"), handleGetAccounts);
  app.post("/api/accounts", requirePermission("all"), handleCreateAccount);
  app.get("/api/accounts/:id", requirePermission("all"), handleGetAccount);
  app.put("/api/accounts/:id", requirePermission("all"), handleUpdateAccount);
  app.delete("/api/accounts/:id", requirePermission("all"), handleDeleteAccount);

  // ===== BINS ROUTES =====
  app.get("/api/bins", requireAnyPermission(["all_bins", "all"]), handleGetBins);
  app.post("/api/bins", requirePermission("all_bins"), handleCreateBin);
  app.get("/api/bins/:id", requireAnyPermission(["all_bins", "all"]), handleGetBin);
  app.put("/api/bins/:id", requirePermission("all_bins"), handleUpdateBin);
  app.delete("/api/bins/:id", requirePermission("all_bins"), handleDeleteBin);

  // ===== TICKET TRANSFER ROUTE =====
  app.post("/api/tickets/:id/transfer", requirePermission("transfer_tickets"), handleTransferTicket);

  // ===== TEAMS ROUTES =====
  app.get("/api/teams", handleGetTeams); // All authenticated users
  app.post("/api/teams", requirePermission("all_bins"), handleCreateTeam);
  app.put("/api/teams/:id", requirePermission("all_bins"), handleUpdateTeam);
  app.delete("/api/teams/:id", requirePermission("all_bins"), handleDeleteTeam);

  // ===== USER MANAGEMENT ROUTES =====
  app.get("/api/user-management/users", requirePermission("all_users"), handleGetAllUsers);
  app.get("/api/user-management/users/:id", requirePermission("all_users"), handleGetUser);
  app.post("/api/user-management/users", requirePermission("all_users"), handleCreateUser);
  app.put("/api/user-management/users/:id", requirePermission("all_users"), handleUpdateUser);
  app.delete("/api/user-management/users/:id", requirePermission("all_users"), handleDeleteUser);
  app.post("/api/user-management/users/:id/reset-password", requirePermission("all_users"), handleResetPassword);
  app.get("/api/user-management/roles", requirePermission("all_users"), handleGetRoles);
  app.post("/api/user-management/users/:id/roles", requirePermission("all_users"), handleAssignRoles);

  // ===== PERMISSIONS MATRIX ROUTES =====
  app.get("/api/permissions/definitions", handleGetPermissionDefinitions);
  app.get("/api/permissions/matrix", requirePermission("all_users"), handleGetPermissionsMatrix);
  app.post("/api/permissions/matrix", requirePermission("all_users"), handleUpdatePermissionsMatrix);

  return app;
}

