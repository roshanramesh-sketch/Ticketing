import { RequestHandler } from "express";
import { query } from "../db";
import { z } from "zod";

const CreateKBSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(10),
  category: z.string().default("General"),
});

export const handleGetKBItems: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await query(`
      SELECT
        id,
        title,
        content,
        category,
        author_id,
        created_time,
        source_ticket_id
      FROM schema_kb.table_kb_items
      ORDER BY created_time DESC
    `);

    res.json(
      result.rows.map((row) => ({
        ...row,
        created_time: row.created_time?.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Get KB items error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCreateKBItem: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { title, content, category } = CreateKBSchema.parse(req.body);

    const result = await query(
      `
      INSERT INTO schema_kb.table_kb_items
        (title, content, category, author_id, created_time)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, title, content, category, author_id, created_time
    `,
      [title, content, category, req.session.userId]
    );

    const item = result.rows[0];
    res.status(201).json({
      ...item,
      created_time: item.created_time?.toISOString(),
    });
  } catch (error) {
    console.error("Create KB item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetKBItem: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const result = await query(
      `
      SELECT
        id,
        title,
        content,
        category,
        author_id,
        created_time,
        source_ticket_id
      FROM schema_kb.table_kb_items
      WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "KB item not found" });
    }

    const item = result.rows[0];
    res.json({
      ...item,
      created_time: item.created_time?.toISOString(),
    });
  } catch (error) {
    console.error("Get KB item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteKBItem: RequestHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const result = await query(
      `DELETE FROM schema_kb.table_kb_items WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "KB item not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete KB item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
