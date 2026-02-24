import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

// =============================================
// GET /api/permissions/definitions
// Returns all permission definitions for UI generation
// =============================================
export const handleGetPermissionDefinitions: RequestHandler = async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const result = await query(`
      SELECT permission_key, display_name, description, value_type, display_order
      FROM schema_auth.table_permission_definitions
      WHERE is_active = true
      ORDER BY display_order ASC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error("[Permissions] Error fetching definitions:", error);
        res.status(500).json({ error: "Failed to fetch permission definitions" });
    }
};

// =============================================
// GET /api/permissions/matrix
// Returns all users with their permissions, teams, and bins — for the matrix UI
// =============================================
export const handleGetPermissionsMatrix: RequestHandler = async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const accountId = req.user?.accountId;

        // Get all users in the account
        const usersResult = await query(
            `SELECT id, email, firstname, lastname FROM schema_auth.table_users
       WHERE account_id = $1 ORDER BY id ASC`,
            [accountId]
        );

        const users = usersResult.rows;
        if (users.length === 0) {
            return res.json({ users: [], permissionDefinitions: [] });
        }

        const userIds = users.map((u) => u.id);

        // Get all permissions for these users
        const permsResult = await query(
            `SELECT user_id, permission_key, permission_value
       FROM schema_auth.table_user_permissions
       WHERE user_id = ANY($1::int[])`,
            [userIds]
        );

        // Get bins assigned per user
        const binsResult = await query(
            `SELECT ub.user_id, ub.bin_id, b.name as bin_name
       FROM schema_auth.table_user_bins ub
       JOIN schema_ticket.table_ticket_bins b ON ub.bin_id = b.id
       WHERE ub.user_id = ANY($1::int[])`,
            [userIds]
        );

        // Get teams assigned per user
        const teamsResult = await query(
            `SELECT ut.user_id, ut.team_id, t.name as team_name
       FROM schema_auth.table_user_teams ut
       JOIN schema_ticket.table_teams t ON ut.team_id = t.id
       WHERE ut.user_id = ANY($1::int[])`,
            [userIds]
        );

        // Get permission definitions
        const defsResult = await query(
            `SELECT permission_key, display_name, description, value_type, display_order
       FROM schema_auth.table_permission_definitions
       WHERE is_active = true ORDER BY display_order ASC`
        );

        // Build user permission map
        const permsByUser: Record<number, Record<string, any>> = {};
        for (const row of permsResult.rows) {
            if (!permsByUser[row.user_id]) permsByUser[row.user_id] = {};
            permsByUser[row.user_id][row.permission_key] = row.permission_value;
        }

        // Build bins-by-user map
        const binsByUser: Record<number, { bin_id: number; bin_name: string }[]> = {};
        for (const row of binsResult.rows) {
            if (!binsByUser[row.user_id]) binsByUser[row.user_id] = [];
            binsByUser[row.user_id].push({ bin_id: row.bin_id, bin_name: row.bin_name });
        }

        // Build teams-by-user map
        const teamsByUser: Record<number, { team_id: number; team_name: string }[]> = {};
        for (const row of teamsResult.rows) {
            if (!teamsByUser[row.user_id]) teamsByUser[row.user_id] = [];
            teamsByUser[row.user_id].push({ team_id: row.team_id, team_name: row.team_name });
        }

        // Assemble response
        const responseUsers = users.map((u) => ({
            id: u.id,
            email: u.email,
            firstname: u.firstname,
            lastname: u.lastname,
            permissions: permsByUser[u.id] || {},
            bins_assigned: (binsByUser[u.id] || []).map((b) => b.bin_id),
            teams_assigned: (teamsByUser[u.id] || []).map((t) => t.team_id),
        }));

        res.json({
            users: responseUsers,
            permissionDefinitions: defsResult.rows,
        });
    } catch (error) {
        console.error("[Permissions] Error fetching matrix:", error);
        res.status(500).json({ error: "Failed to fetch permissions matrix" });
    }
};

// =============================================
// POST /api/permissions/matrix
// Bulk update permissions for multiple users
// =============================================
const BulkUpdateSchema = z.object({
    updates: z.array(
        z.object({
            userId: z.number().int().positive(),
            permissions: z.record(z.any()),         // { create_user: true, bins_assigned: [1,2], ... }
            binsAssigned: z.array(z.number()).optional(),
            teamsAssigned: z.array(z.number()).optional(),
        })
    ),
});

export const handleUpdatePermissionsMatrix: RequestHandler = async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { updates } = BulkUpdateSchema.parse(req.body);
        const grantedBy = req.user?.id;
        const accountId = req.user?.accountId;

        for (const update of updates) {
            const { userId, permissions, binsAssigned, teamsAssigned } = update;

            // Verify user belongs to same account
            const userCheck = await query(
                `SELECT id FROM schema_auth.table_users WHERE id = $1 AND account_id = $2`,
                [userId, accountId]
            );
            if (userCheck.rows.length === 0) continue;

            // Upsert each permission
            for (const [key, value] of Object.entries(permissions)) {
                if (key === "bins_assigned") continue; // handled separately via table_user_bins
                await query(
                    `INSERT INTO schema_auth.table_user_permissions (user_id, permission_key, permission_value, granted_by)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (user_id, permission_key) DO UPDATE
           SET permission_value = EXCLUDED.permission_value, granted_by = EXCLUDED.granted_by`,
                    [userId, key, JSON.stringify(value), grantedBy]
                );
            }

            // Update bin assignments if provided
            if (binsAssigned !== undefined) {
                await query(
                    `DELETE FROM schema_auth.table_user_bins WHERE user_id = $1`,
                    [userId]
                );
                for (const binId of binsAssigned) {
                    await query(
                        `INSERT INTO schema_auth.table_user_bins (user_id, bin_id, assigned_by)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                        [userId, binId, grantedBy]
                    );
                }
            }

            // Update team assignments if provided
            if (teamsAssigned !== undefined) {
                await query(
                    `DELETE FROM schema_auth.table_user_teams WHERE user_id = $1`,
                    [userId]
                );
                for (const teamId of teamsAssigned) {
                    await query(
                        `INSERT INTO schema_auth.table_user_teams (user_id, team_id, assigned_by)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                        [userId, teamId, grantedBy]
                    );
                }
            }
        }

        console.log(`[Permissions] Matrix bulk-updated by user ${grantedBy}`);
        res.json({ success: true, message: "Permissions updated successfully" });
    } catch (error) {
        console.error("[Permissions] Error updating matrix:", error);
        res.status(500).json({ error: "Failed to update permissions" });
    }
};
