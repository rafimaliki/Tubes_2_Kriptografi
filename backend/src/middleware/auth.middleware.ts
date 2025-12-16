import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyJwt } from "@/lib/jwt";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const token = getCookie(c, "jwt_token");

    if (!token) {
      return c.json({ error: "No token provided" }, 401);
    }

    await verifyJwt(token);

    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
};
