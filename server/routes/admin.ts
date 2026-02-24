import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

const UpdateUserRoleSchema = z.object({
  role: z.enum(["user", "support", "manager", "admin"]),
});

// Middleware to check if user is admin
const isAdmin = async (userId: number): Promise<boolean> => {
  const result = await query(
    "SELECT role FROM schema_auth.table_users WHERE id = $1",
    [userId]
  );
  return result.rows.length > 0 && result.rows[0].role === "admin";
};

export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!(await isAdmin(req.session.userId))) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const result = await query(`
      SELECT id, firstname, lastname, email, role
      FROM schema_auth.table_users
      ORDER BY firstname ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateUserRole: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!(await isAdmin(req.session.userId))) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const { id } = req.params;
    const { role } = UpdateUserRoleSchema.parse(req.body);

    const result = await query(
      "UPDATE schema_auth.table_users SET role = $1 WHERE id = $2 RETURNING id, firstname, lastname, email, role",
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log activity
    await query(
      `
      INSERT INTO schema_system.table_activity_logs
        (user_id, action, details, timestamp)
      VALUES ($1, $2, $3, NOW())
    `,
      [
        req.session.userId,
        "UPDATE_USER_ROLE",
        `Updated user ${id} role to ${role}`,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetActivityLogs: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!(await isAdmin(req.session.userId))) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    // Get logs from last 7 days
    const result = await query(`
      SELECT
        id,
        user_id,
        action,
        details,
        timestamp
      FROM schema_system.table_activity_logs
      WHERE timestamp > NOW() - INTERVAL '7 days'
      ORDER BY timestamp DESC
      LIMIT 500
    `);

    res.json(
      result.rows.map((row) => ({
        ...row,
        timestamp: row.timestamp?.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetUserStats: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!(await isAdmin(req.session.userId))) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const result = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_count,
        COUNT(CASE WHEN role = 'support' THEN 1 END) as support_count,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
      FROM schema_auth.table_users
    `);

    res.json({
      total_users: parseInt(result.rows[0].total_users || 0),
      admin_count: parseInt(result.rows[0].admin_count || 0),
      manager_count: parseInt(result.rows[0].manager_count || 0),
      support_count: parseInt(result.rows[0].support_count || 0),
      user_count: parseInt(result.rows[0].user_count || 0),
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
