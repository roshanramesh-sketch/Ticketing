import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export const handleChangePassword: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { currentPassword, newPassword } = ChangePasswordSchema.parse(
      req.body
    );

    // Get current user password
    const userResult = await query(
      "SELECT password FROM schema_auth.table_users WHERE id = $1",
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password (in production use bcrypt)
    if (userResult.rows[0].password !== currentPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password (in production hash the new password)
    await query(
      "UPDATE schema_auth.table_users SET password = $1 WHERE id = $2",
      [newPassword, req.session.userId]
    );

    // Log activity
    await query(
      `
      INSERT INTO schema_system.table_activity_logs
        (user_id, action, details, timestamp)
      VALUES ($1, $2, $3, NOW())
    `,
      [req.session.userId, "CHANGE_PASSWORD", "User changed their password"]
    );

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
