import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

// ==========================================
// Permission Middleware
// ==========================================

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                accountId: number;
                permissions: string[];
            };
        }
    }
}

/**
 * Middleware to load user permissions from database
 * Attaches user object with permissions to req.user
 */
export const loadUserPermissions: RequestHandler = async (req, res, next) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const result = await query(
            `SELECT 
        u.id, 
        u.email, 
        u.account_id,
        COALESCE(
          jsonb_agg(DISTINCT r.permissions) FILTER (WHERE r.permissions IS NOT NULL),
          '[]'::jsonb
        ) as all_permissions
      FROM schema_auth.table_users u
      LEFT JOIN schema_auth.table_user_roles ur ON u.id = ur.user_id
      LEFT JOIN schema_auth.table_roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.account_id`,
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "User not found" });
        }

        const user = result.rows[0];

        // Flatten permissions array (array of arrays to single array)
        const permissions: string[] = [];
        for (const permSet of user.all_permissions) {
            if (Array.isArray(permSet)) {
                permissions.push(...permSet);
            }
        }

        req.user = {
            id: user.id,
            email: user.email,
            accountId: user.account_id,
            permissions: [...new Set(permissions)], // Remove duplicates
        };

        next();
    } catch (error) {
        console.error("[Permission] Error loading user permissions:", error);
        res.status(500).json({ error: "Failed to load permissions" });
    }
};

/**
 * Middleware factory to check if user has required permission
 */
export function requirePermission(permission: string): RequestHandler {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Superadmin has all permissions
        if (req.user.permissions.includes("all")) {
            return next();
        }

        // Check for specific permission
        if (req.user.permissions.includes(permission)) {
            return next();
        }

        return res.status(403).json({
            error: "Forbidden",
            message: `Required permission: ${permission}`
        });
    };
}

/**
 * Middleware to check if user has ANY of the required permissions
 */
export function requireAnyPermission(permissions: string[]): RequestHandler {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Superadmin has all permissions
        if (req.user.permissions.includes("all")) {
            return next();
        }

        // Check if user has any of the required permissions
        const hasPermission = permissions.some(perm =>
            req.user!.permissions.includes(perm)
        );

        if (hasPermission) {
            return next();
        }

        return res.status(403).json({
            error: "Forbidden",
            message: `Required one of: ${permissions.join(", ")}`
        });
    };
}

/**
 * Check if user can access specific bin
 */
export async function canAccessBin(
    userId: number,
    binId: number
): Promise<boolean> {
    const result = await query(
        `SELECT EXISTS (
      SELECT 1 FROM schema_auth.table_user_roles ur
      JOIN schema_auth.table_roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
        AND (
          ur.bin_id = $2 OR  -- Has role for this specific bin
          ur.bin_id IS NULL OR  -- Has global role
          r.permissions @> '["all"]'::jsonb  -- Is superadmin
        )
    ) as can_access`,
        [userId, binId]
    );

    return result.rows[0]?.can_access || false;
}
