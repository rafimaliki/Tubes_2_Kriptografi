import type { Context } from "hono";

export const authHandler = {
  login: async (c: Context) => {
    try {
      return c.json({ message: "Login endpoint" }, 200);
    } catch (error) {
      return c.json({ error: "Login failed" }, 500);
    }
  },

  logout: async (c: Context) => {
    try {
      return c.json({ message: "Logout endpoint" }, 200);
    } catch (error) {
      return c.json({ error: "Logout failed" }, 500);
    }
  },
};
