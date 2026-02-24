import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

// ==========================================
// Bins Management Routes
// ==========================================

const CreateBinSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    managerId: z.number().int().positive().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const UpdateBinSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    managerId: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const TransferTicketSchema = z.object({
    toBinId: z.number().int().positive(),
    reason: z.string().optional(),
});

/**
 * GET /api/bins
 * List bins (filtered by account and permissions)
 */
export const handleGetBins: RequestHandler = async (req, res) => {
    try {
        const accountId = req.user?.accountId;

        const result = await query(
            `SELECT 
        b.id, b.name, b.description, b.manager_id, b.is_active, 
        b.created_time, b.color,
        u.firstname || ' ' || u.lastname as manager_name,
        u.email as manager_email,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE bin_id = b.id AND archived_time IS NULL) as active_tickets,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE bin_id = b.id AND status = 'Open') as open_tickets,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE bin_id = b.id AND status = 'In Progress') as in_progress_tickets
      FROM schema_ticket.table_ticket_bins b
      LEFT JOIN schema_auth.table_users u ON b.manager_id = u.id
      WHERE b.account_id = $1
      ORDER BY b.name`,
            [accountId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("[Bins] Error fetching bins:", error);
        res.status(500).json({ error: "Failed to fetch bins" });
    }
};

/**
 * POST /api/bins
 * Create new bin (admin only)
 */
export const handleCreateBin: RequestHandler = async (req, res) => {
    try {
        const { name, description, managerId, color } = CreateBinSchema.parse(req.body);
        const accountId = req.user?.accountId;

        const result = await query(
            `INSERT INTO schema_ticket.table_ticket_bins 
        (name, description, manager_id, account_id, created_by, color, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, name, description, manager_id, is_active, created_time, color`,
            [name, description || null, managerId || null, accountId, req.user?.id, color || '#6B7280']
        );

        console.log(`[Bins] Created bin: ${name} by user ${req.user?.id}`);
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error("[Bins] Error creating bin:", error);

        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: "Bin name already exists for this account" });
        }

        res.status(500).json({ error: "Failed to create bin" });
    }
};

/**
 * GET /api/bins/:id
 * Get bin details
 */
export const handleGetBin: RequestHandler = async (req, res) => {
    try {
        const binId = parseInt(req.params.id);
        const accountId = req.user?.accountId;

        const result = await query(
            `SELECT 
        b.*,
        u.firstname || ' ' || u.lastname as manager_name,
        u.email as manager_email,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE bin_id = b.id) as total_tickets,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE bin_id = b.id AND status = 'Open') as open_tickets,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE bin_id = b.id AND status = 'In Progress') as in_progress_tickets,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE bin_id = b.id AND status = 'Resolved') as resolved_tickets
      FROM schema_ticket.table_ticket_bins b
      LEFT JOIN schema_auth.table_users u ON b.manager_id = u.id
      WHERE b.id = $1 AND b.account_id = $2`,
            [binId, accountId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Bin not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("[Bins] Error fetching bin:", error);
        res.status(500).json({ error: "Failed to fetch bin" });
    }
};

/**
 * PUT /api/bins/:id
 * Update bin
 */
export const handleUpdateBin: RequestHandler = async (req, res) => {
    try {
        const binId = parseInt(req.params.id);
        const accountId = req.user?.accountId;
        const { name, description, managerId, isActive, color } = UpdateBinSchema.parse(req.body);

        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }

        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }

        if (managerId !== undefined) {
            updates.push(`manager_id = $${paramCount++}`);
            values.push(managerId);
        }

        if (isActive !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(isActive);
        }

        if (color !== undefined) {
            updates.push(`color = $${paramCount++}`);
            values.push(color);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No updates provided" });
        }

        values.push(binId, accountId);

        const result = await query(
            `UPDATE schema_ticket.table_ticket_bins 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount} AND account_id = $${paramCount + 1}
      RETURNING id, name, description, manager_id, is_active, color`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Bin not found" });
        }

        console.log(`[Bins] Updated bin ${binId} by user ${req.user?.id}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("[Bins] Error updating bin:", error);
        res.status(500).json({ error: "Failed to update bin" });
    }
};

/**
 * DELETE /api/bins/:id
 * Delete bin (soft delete by setting is_active = false)
 */
export const handleDeleteBin: RequestHandler = async (req, res) => {
    try {
        const binId = parseInt(req.params.id);
        const accountId = req.user?.accountId;

        // Check if bin has active tickets
        const ticketCheck = await query(
            `SELECT COUNT(*) as count FROM schema_ticket.table_tickets 
      WHERE bin_id = $1 AND archived_time IS NULL`,
            [binId]
        );

        if (parseInt(ticketCheck.rows[0].count) > 0) {
            return res.status(400).json({
                error: "Cannot delete bin with active tickets",
                message: "Please transfer or archive all tickets first"
            });
        }

        const result = await query(
            `UPDATE schema_ticket.table_ticket_bins 
      SET is_active = false
      WHERE id = $1 AND account_id = $2
      RETURNING name`,
            [binId, accountId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Bin not found" });
        }

        console.log(`[Bins] Deleted bin ${binId} by user ${req.user?.id}`);
        res.json({ success: true, message: "Bin deleted" });
    } catch (error) {
        console.error("[Bins] Error deleting bin:", error);
        res.status(500).json({ error: "Failed to delete bin" });
    }
};

/**
 * POST /api/tickets/:id/transfer
 * Transfer ticket to another bin
 */
export const handleTransferTicket: RequestHandler = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const { toBinId, reason } = TransferTicketSchema.parse(req.body);
        const userId = req.user?.id;

        // Use the database function to transfer
        const result = await query(
            `SELECT schema_ticket.transfer_ticket($1, $2, $3, $4) as success`,
            [ticketId, toBinId, userId, reason || null]
        );

        if (!result.rows[0].success) {
            return res.status(400).json({ error: "Failed to transfer ticket" });
        }

        console.log(`[Bins] Transferred ticket ${ticketId} to bin ${toBinId} by user ${userId}`);
        res.json({ success: true, message: "Ticket transferred successfully" });
    } catch (error: any) {
        console.error("[Bins] Error transferring ticket:", error);

        if (error.message) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: "Failed to transfer ticket" });
    }
};
