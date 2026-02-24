import { RequestHandler } from "express";
import { query } from "../db";

export const handleGetStats: RequestHandler = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const today = new Date().toISOString().split("T")[0];

    const result = await query(`
      SELECT
        COUNT(CASE WHEN status != 'archived' THEN 1 END)::int as total_tickets_created,
        COUNT(CASE WHEN status = 'archived' THEN 1 END)::int as total_tickets_archived,
        COUNT(CASE WHEN DATE(created_time) = $1 THEN 1 END)::int as tickets_created_today,
        COUNT(CASE WHEN DATE(created_time) = $1 AND status != 'archived' THEN 1 END)::int as tickets_open_today,
        COUNT(CASE WHEN status != 'archived' THEN 1 END)::int as tickets_open,
        COUNT(CASE WHEN DATE(archived_time) = $1 AND status = 'archived' THEN 1 END)::int as tickets_archived_today
      FROM schema_ticket.table_tickets
    `, [today]);

    const stats = result.rows[0] || {};

    res.json({
      total_tickets_created: parseInt(stats.total_tickets_created || 0),
      total_tickets_archived: parseInt(stats.total_tickets_archived || 0),
      tickets_created_today: parseInt(stats.tickets_created_today || 0),
      tickets_open_today: parseInt(stats.tickets_open_today || 0),
      tickets_open: parseInt(stats.tickets_open || 0),
      tickets_archived_today: parseInt(stats.tickets_archived_today || 0),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
