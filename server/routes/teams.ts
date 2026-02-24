import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

// ==========================================
// Teams Management Routes
// ==========================================

const CreateTeamSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
});

const UpdateTeamSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
});

/**
 * GET /api/teams
 * List teams for current account
 */
export const handleGetTeams: RequestHandler = async (req, res) => {
    try {
        const accountId = req.user?.accountId;

        const result = await query(
            `SELECT 
        id, name, description, is_active, created_time,
        (SELECT COUNT(*) FROM schema_ticket.table_tickets WHERE team_id = t.id) as ticket_count
      FROM schema_ticket.table_teams t
      WHERE account_id = $1
      ORDER BY name`,
            [accountId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("[Teams] Error fetching teams:", error);
        res.status(500).json({ error: "Failed to fetch teams" });
    }
};

/**
 * POST /api/teams
 * Create new team (admin only)
 */
export const handleCreateTeam: RequestHandler = async (req, res) => {
    try {
        const { name, description } = CreateTeamSchema.parse(req.body);
        const accountId = req.user?.accountId;

        const result = await query(
            `INSERT INTO schema_ticket.table_teams 
        (name, description, account_id, created_by, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, description, is_active, created_time`,
            [name, description || null, accountId, req.user?.id]
        );

        console.log(`[Teams] Created team: ${name} by user ${req.user?.id}`);
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error("[Teams] Error creating team:", error);

        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: "Team name already exists for this account" });
        }

        res.status(500).json({ error: "Failed to create team" });
    }
};

/**
 * PUT /api/teams/:id
 * Update team
 */
export const handleUpdateTeam: RequestHandler = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);
        const accountId = req.user?.accountId;
        const { name, description, isActive } = UpdateTeamSchema.parse(req.body);

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

        if (isActive !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(isActive);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No updates provided" });
        }

        values.push(teamId, accountId);

        const result = await query(
            `UPDATE schema_ticket.table_teams 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount} AND account_id = $${paramCount + 1}
      RETURNING id, name, description, is_active`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Team not found" });
        }

        console.log(`[Teams] Updated team ${teamId} by user ${req.user?.id}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("[Teams] Error updating team:", error);
        res.status(500).json({ error: "Failed to update team" });
    }
};

/**
 * DELETE /api/teams/:id
 * Delete team (soft delete)
 */
export const handleDeleteTeam: RequestHandler = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);
        const accountId = req.user?.accountId;

        const result = await query(
            `UPDATE schema_ticket.table_teams 
      SET is_active = false
      WHERE id = $1 AND account_id = $2
      RETURNING name`,
            [teamId, accountId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Team not found" });
        }

        console.log(`[Teams] Deleted team ${teamId} by user ${req.user?.id}`);
        res.json({ success: true, message: "Team deleted" });
    } catch (error) {
        console.error("[Teams] Error deleting team:", error);
        res.status(500).json({ error: "Failed to delete team" });
    }
};
