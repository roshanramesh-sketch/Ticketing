import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Extend Express Session to include userId
declare global {
  namespace Express {
    interface SessionData {
      userId?: number;
    }
  }
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    console.log(`[Auth] Login attempt for: ${email}`);

    const result = await query(
      "SELECT id, firstname, lastname, email, role, password FROM schema_auth.table_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`[Auth] User not found: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[Auth] Invalid password for: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ set session
    req.session.userId = user.id;

    console.log(`[Auth] Session created for user ${user.id} (${email})`);
    console.log(`[Auth] Session ID: ${req.sessionID}`);

    // ✅ FORCE session persistence
    req.session.save((err) => {
      if (err) {
        console.error("[Auth] Session save error:", err);
        return res.status(500).json({ error: "Session error" });
      }

      console.log(`[Auth] Session saved successfully for user ${user.id}`);

      return res.json({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      });
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetMe: RequestHandler = async (req, res) => {
  try {
    // Check if user is authenticated
    console.log(`[Auth] Auth check - Session ID: ${req.sessionID}`);
    console.log(`[Auth] Session data:`, { userId: req.session?.userId });

    if (!req.session?.userId) {
      console.log("[Auth] Not authenticated - no session userId");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await query(
      "SELECT id, firstname, lastname, email, role FROM schema_auth.table_users WHERE id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      console.log(`[Auth] User not found in DB: ${req.session.userId}`);
      return res.status(401).json({ error: "User not found" });
    }

    const user = result.rows[0];
    console.log(`[Auth] User authenticated: ${user.email} (ID: ${user.id})`);

    res.json({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("[Auth] Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleLogout: RequestHandler = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

