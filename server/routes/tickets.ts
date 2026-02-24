import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

const CreateTicketSchema = z.object({
  subject: z.string().min(5),
  content: z.string().min(10),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export const handleGetTickets: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await query(`
      SELECT
        id,
        subject,
        content,
        status,
        priority,
        requester_id,
        assignee_id,
        created_time,
        updated_time,
        archived_time,
        bin_id,
        is_duplicate_of
      FROM schema_ticket.table_tickets
      ORDER BY created_time DESC
    `);

    res.json(
      result.rows.map((row) => ({
        ...row,
        created_time: row.created_time?.toISOString(),
        updated_time: row.updated_time?.toISOString(),
        archived_time: row.archived_time?.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCreateTicket: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { subject, content, priority } = CreateTicketSchema.parse(req.body);

    const result = await query(
      `
      INSERT INTO schema_ticket.table_tickets
        (subject, content, status, priority, requester_id, created_time, updated_time)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, subject, content, status, priority, requester_id, created_time, updated_time
    `,
      [subject, content, "open", priority, req.session.userId]
    );

    const ticket = result.rows[0];
    res.status(201).json({
      ...ticket,
      created_time: ticket.created_time?.toISOString(),
      updated_time: ticket.updated_time?.toISOString(),
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetTicket: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const result = await query(
      `
      SELECT
        id,
        subject,
        content,
        status,
        priority,
        requester_id,
        assignee_id,
        created_time,
        updated_time,
        archived_time,
        bin_id,
        is_duplicate_of
      FROM schema_ticket.table_tickets
      WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticket = result.rows[0];
    res.json({
      ...ticket,
      created_time: ticket.created_time?.toISOString(),
      updated_time: ticket.updated_time?.toISOString(),
      archived_time: ticket.archived_time?.toISOString(),
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateTicket: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;
    const { status, priority, assignee_id } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    if (priority) {
      updates.push(`priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }
    if (assignee_id) {
      updates.push(`assignee_id = $${paramCount}`);
      values.push(assignee_id);
      paramCount++;
    }

    updates.push(`updated_time = NOW()`);
    values.push(id);

    const result = await query(
      `
      UPDATE schema_ticket.table_tickets
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, subject, content, status, priority, requester_id, assignee_id, created_time, updated_time, archived_time
    `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticket = result.rows[0];
    res.json({
      ...ticket,
      created_time: ticket.created_time?.toISOString(),
      updated_time: ticket.updated_time?.toISOString(),
      archived_time: ticket.archived_time?.toISOString(),
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleArchiveTicket: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const result = await query(
      `
      UPDATE schema_ticket.table_tickets
      SET status = 'archived', archived_time = NOW(), updated_time = NOW()
      WHERE id = $1
      RETURNING id, subject, content, status, priority, requester_id, created_time, updated_time, archived_time
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticket = result.rows[0];
    res.json({
      ...ticket,
      created_time: ticket.created_time?.toISOString(),
      updated_time: ticket.updated_time?.toISOString(),
      archived_time: ticket.archived_time?.toISOString(),
    });
  } catch (error) {
    console.error("Archive ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
