import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

// ==========================================
// Accounts Management Routes
// ==========================================

const CreateAccountSchema = z.object({
    name: z.string().min(1).max(255).regex(/^[a-z0-9_]+$/),
    displayName: z.string().min(1).max(255),
    settings: z.record(z.any()).optional(),
});

const UpdateAccountSchema = z.object({
    displayName: z.string().min(1).max(255).optional(),
    isActive: z.boolean().optional(),
    settings: z.record(z.any()).optional(),
});

/**
 * GET /api/accounts
 * List all accounts (superadmin only)
 */
export const handleGetAccounts: RequestHandler = async (req, res) => {
    try {
        const result = await query(
            `SELECT 
        id, name, display_name, created_time, is_active,
        (SELECT COUNT(*) FROM schema_auth.table_users WHERE account_id = a.id) as user_count,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE account_id = a.id) as ticket_count
      FROM schema_system.table_accounts a
      ORDER BY created_time DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("[Accounts] Error fetching accounts:", error);
        res.status(500).json({ error: "Failed to fetch accounts" });
    }
};

/**
 * POST /api/accounts
 * Create new account (superadmin only)
 */
export const handleCreateAccount: RequestHandler = async (req, res) => {
    try {
        const { name, displayName, settings } = CreateAccountSchema.parse(req.body);

        const result = await query(
            `INSERT INTO schema_system.table_accounts 
        (name, display_name, settings, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, display_name, created_time, is_active`,
            [name, displayName, JSON.stringify(settings || {}), req.user?.id]
        );

        console.log(`[Accounts] Created account: ${name} by user ${req.user?.id}`);
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error("[Accounts] Error creating account:", error);

        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: "Account name already exists" });
        }

        res.status(500).json({ error: "Failed to create account" });
    }
};

/**
 * GET /api/accounts/:id
 * Get account details
 */
export const handleGetAccount: RequestHandler = async (req, res) => {
    try {
        const accountId = parseInt(req.params.id);

        const result = await query(
            `SELECT 
        a.*,
        (SELECT COUNT(*) FROM schema_auth.table_users WHERE account_id = a.id) as user_count,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE account_id = a.id) as ticket_count,
        (SELECT COUNT(*) FROM schema_ticket.table_ticket_bins WHERE account_id = a.id) as bin_count
      FROM schema_system.table_accounts a
      WHERE id = $1`,
            [accountId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("[Accounts] Error fetching account:", error);
        res.status(500).json({ error: "Failed to fetch account" });
    }
};

/**
 * PUT /api/accounts/:id
 * Update account (superadmin only)
 */
export const handleUpdateAccount: RequestHandler = async (req, res) => {
    try {
        const accountId = parseInt(req.params.id);
        const { displayName, isActive, settings } = UpdateAccountSchema.parse(req.body);

        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (displayName !== undefined) {
            updates.push(`display_name = $${paramCount++}`);
            values.push(displayName);
        }

        if (isActive !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(isActive);
        }

        if (settings !== undefined) {
            updates.push(`settings = $${paramCount++}`);
            values.push(JSON.stringify(settings));
        }

        updates.push(`updated_time = CURRENT_TIMESTAMP`);
        values.push(accountId);

        const result = await query(
            `UPDATE schema_system.table_accounts 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, name, display_name, is_active, updated_time`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }

        console.log(`[Accounts] Updated account ${accountId} by user ${req.user?.id}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("[Accounts] Error updating account:", error);
        res.status(500).json({ error: "Failed to update account" });
    }
};

/**
 * DELETE /api/accounts/:id
 * Delete account (superadmin only)
 * Note: This will cascade delete all related data!
 */
export const handleDeleteAccount: RequestHandler = async (req, res) => {
    try {
        const accountId = parseInt(req.params.id);

        // Prevent deleting default BCITS account
        if (accountId === 1) {
            return res.status(400).json({ error: "Cannot delete default BCITS account" });
        }

        const result = await query(
            `DELETE FROM schema_system.table_accounts WHERE id = $1 RETURNING name`,
            [accountId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }

        console.log(`[Accounts] Deleted account ${accountId} (${result.rows[0].name}) by user ${req.user?.id}`);
        res.json({ success: true, message: "Account deleted" });
    } catch (error) {
        console.error("[Accounts] Error deleting account:", error);
        res.status(500).json({ error: "Failed to delete account" });
    }
};
