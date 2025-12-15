import type { Context, Next } from "hono";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const token = c.req.header("Authorization");

    if (!token) {
      return c.json({ error: "No token provided" }, 401);
    }

    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
};
