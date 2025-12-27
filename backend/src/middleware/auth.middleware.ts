import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyJwt } from "@/lib/jwt";

declare module "hono" {
  interface Context {
    user?: string;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const token = getCookie(c, "jwt_token");

    if (!token) {
      return c.json({ error: "Authentication failed" }, 401);
    }

    const user = await verifyJwt(token);

    if (!user) {
      return c.json({ error: "Authentication failed" }, 401);
    }

    c.user = user;

    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
};
