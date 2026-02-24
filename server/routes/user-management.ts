import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ==========================================
// User Management Routes
// ==========================================

/**
 * Password complexity validation helper
 */
function validatePasswordComplexity(password: string, email?: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least 1 uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least 1 lowercase letter";
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'`~/]/.test(password)) return "Password must contain at least 1 special character";
    if (email) {
        const emailPrefix = email.split("@")[0].toLowerCase();
        if (emailPrefix.length >= 3 && password.toLowerCase().includes(emailPrefix)) {
            return "Password cannot contain your email address";
        }
    }
    return null;
}

const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    roleIds: z.array(z.number().int().positive()).optional().default([]),
    binIds: z.array(z.number().int().positive().nullable()).optional().default([]),
    teamIds: z.array(z.number().int().positive()).optional().default([]),
});

const UpdateUserSchema = z.object({
    firstname: z.string().min(1).max(100).optional(),
    lastname: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
});

const AssignRolesSchema = z.object({
    roleIds: z.array(z.object({
        roleId: z.number().int().positive(),
        binId: z.number().int().positive().nullable().optional(),
    })),
});

/**
 * GET /api/user-management/users
 * List all users in account (admin only)
 */
export const handleGetUsers: RequestHandler = async (req, res) => {
    try {
        const accountId = req.user?.accountId;

        const result = await query(
            `SELECT 
        u.id, u.email, u.firstname, u.lastname,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'roleId', r.id,
              'roleName', r.name,
              'roleDisplayName', r.display_name,
              'binId', ur.bin_id,
              'binName', b.name
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::jsonb
        ) as roles
      FROM schema_auth.table_users u
      LEFT JOIN schema_auth.table_user_roles ur ON u.id = ur.user_id
      LEFT JOIN schema_auth.table_roles r ON ur.role_id = r.id
      LEFT JOIN schema_ticket.table_ticket_bins b ON ur.bin_id = b.id
      WHERE u.account_id = $1
      GROUP BY u.id
      ORDER BY u.id DESC`,
            [accountId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("[UserManagement] Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

/**
 * GET /api/user-management/users/:id
 * Get single user with roles (needed by AssignRoles page)
 */
export const handleGetUser: RequestHandler = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const accountId = req.user?.accountId;

        const result = await query(
            `SELECT 
        u.id, u.email, u.firstname, u.lastname,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'roleId', r.id,
              'roleName', r.name,
              'roleDisplayName', r.display_name,
              'binId', ur.bin_id,
              'binName', b.name
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::jsonb
        ) as roles
      FROM schema_auth.table_users u
      LEFT JOIN schema_auth.table_user_roles ur ON u.id = ur.user_id
      LEFT JOIN schema_auth.table_roles r ON ur.role_id = r.id
      LEFT JOIN schema_ticket.table_ticket_bins b ON ur.bin_id = b.id
      WHERE u.id = $1 AND u.account_id = $2
      GROUP BY u.id`,
            [userId, accountId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("[UserManagement] Error fetching user:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
};

/**
 * POST /api/user-management/users
 * Create new user (admin only)
 */
export const handleCreateUser: RequestHandler = async (req, res) => {
    try {
        const { email, firstname, lastname, password, roleIds, binIds, teamIds } = CreateUserSchema.parse(req.body);
        const accountId = req.user?.accountId;

        // Server-side password complexity check
        const pwError = validatePasswordComplexity(password, email);
        if (pwError) {
            return res.status(400).json({ error: pwError });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userResult = await query(
            `INSERT INTO schema_auth.table_users 
        (email, firstname, lastname, password, account_id, role)
      VALUES ($1, $2, $3, $4, $5, 'User')
      RETURNING id, email, firstname, lastname`,
            [email, firstname, lastname, hashedPassword, accountId]
        );

        const newUser = userResult.rows[0];

        // Assign roles if provided
        if (roleIds && roleIds.length > 0) {
            for (let i = 0; i < roleIds.length; i++) {
                const roleId = roleIds[i];
                const binId = binIds && binIds[i] ? binIds[i] : null;

                await query(
                    `INSERT INTO schema_auth.table_user_roles (user_id, role_id, bin_id, granted_by)
        VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
                    [newUser.id, roleId, binId, req.user?.id]
                );
            }
        }

        // Assign teams if provided
        if (teamIds && teamIds.length > 0) {
            for (const teamId of teamIds) {
                await query(
                    `INSERT INTO schema_auth.table_user_teams (user_id, team_id, assigned_by)
                     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                    [newUser.id, teamId, req.user?.id]
                );
            }
        }

        // Assign bins if provided
        if (binIds && binIds.length > 0) {
            for (const binId of binIds) {
                if (binId) {
                    await query(
                        `INSERT INTO schema_auth.table_user_bins (user_id, bin_id, assigned_by)
                         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                        [newUser.id, binId, req.user?.id]
                    );
                }
            }
        }

        console.log(`[UserManagement] Created user: ${email} by user ${req.user?.id}`);
        res.status(201).json(newUser);
    } catch (error: any) {
        console.error("[UserManagement] Error creating user:", error);

        if (error.code === '23505') {
            return res.status(400).json({ error: "Email already exists" });
        }

        res.status(500).json({ error: "Failed to create user" });
    }
};

/**
 * PUT /api/user-management/users/:id
 * Update user details
 */
export const handleUpdateUser: RequestHandler = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const accountId = req.user?.accountId;
        const { firstname, lastname, email } = UpdateUserSchema.parse(req.body);

        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (firstname !== undefined) {
            updates.push(`firstname = $${paramCount++}`);
            values.push(firstname);
        }

        if (lastname !== undefined) {
            updates.push(`lastname = $${paramCount++}`);
            values.push(lastname);
        }

        if (email !== undefined) {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No updates provided" });
        }

        values.push(userId, accountId);

        const result = await query(
            `UPDATE schema_auth.table_users 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount} AND account_id = $${paramCount + 1}
      RETURNING id, email, firstname, lastname`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`[UserManagement] Updated user ${userId} by user ${req.user?.id}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("[UserManagement] Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
};

/**
 * DELETE /api/user-management/users/:id
 * Delete user (cannot delete self)
 */
export const handleDeleteUser: RequestHandler = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const accountId = req.user?.accountId;

        if (userId === req.user?.id) {
            return res.status(400).json({ error: "Cannot delete your own account" });
        }

        const result = await query(
            `DELETE FROM schema_auth.table_users 
      WHERE id = $1 AND account_id = $2
      RETURNING email`,
            [userId, accountId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`[UserManagement] Deleted user ${userId} (${result.rows[0].email}) by user ${req.user?.id}`);
        res.json({ success: true, message: "User deleted" });
    } catch (error) {
        console.error("[UserManagement] Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
};

/**
 * POST /api/user-management/users/:id/reset-password
 * Reset user password with complexity validation
 */
export const handleResetPassword: RequestHandler = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const accountId = req.user?.accountId;
        const { newPassword } = z.object({ newPassword: z.string().min(8) }).parse(req.body);

        // Get user email for password check
        const userRow = await query(
            `SELECT email FROM schema_auth.table_users WHERE id = $1 AND account_id = $2`,
            [userId, accountId]
        );
        if (userRow.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const pwError = validatePasswordComplexity(newPassword, userRow.rows[0].email);
        if (pwError) {
            return res.status(400).json({ error: pwError });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await query(
            `UPDATE schema_auth.table_users SET password = $1 WHERE id = $2 AND account_id = $3`,
            [hashedPassword, userId, accountId]
        );

        console.log(`[UserManagement] Reset password for user ${userId} by user ${req.user?.id}`);
        res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("[UserManagement] Error resetting password:", error);
        res.status(500).json({ error: "Failed to reset password" });
    }
};

/**
 * GET /api/user-management/roles
 * List all available roles
 */
export const handleGetRoles: RequestHandler = async (req, res) => {
    try {
        const result = await query(
            `SELECT id, name, display_name, description, permissions
      FROM schema_auth.table_roles
      ORDER BY name`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("[UserManagement] Error fetching roles:", error);
        res.status(500).json({ error: "Failed to fetch roles" });
    }
};

/**
 * POST /api/user-management/users/:id/roles
 * Assign roles to user (replaces existing roles). Expects { roleIds: [{roleId, binId}] }
 */
export const handleAssignRoles: RequestHandler = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const accountId = req.user?.accountId;
        const { roleIds } = AssignRolesSchema.parse(req.body);

        const userCheck = await query(
            `SELECT id FROM schema_auth.table_users WHERE id = $1 AND account_id = $2`,
            [userId, accountId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete existing roles
        await query(
            `DELETE FROM schema_auth.table_user_roles WHERE user_id = $1`,
            [userId]
        );

        // Insert new roles
        for (const { roleId, binId } of roleIds) {
            await query(
                `INSERT INTO schema_auth.table_user_roles (user_id, role_id, bin_id, granted_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, role_id, bin_id) DO NOTHING`,
                [userId, roleId, binId || null, req.user?.id]
            );
        }

        console.log(`[UserManagement] Assigned roles to user ${userId} by user ${req.user?.id}`);
        res.json({ success: true, message: "Roles assigned successfully" });
    } catch (error) {
        console.error("[UserManagement] Error assigning roles:", error);
        res.status(500).json({ error: "Failed to assign roles" });
    }
};
