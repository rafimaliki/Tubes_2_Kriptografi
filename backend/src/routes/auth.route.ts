import { Hono } from "hono";
import { authHandler } from "@/handler/auth.handler";
import { authMiddleware } from "@/middleware/auth.middleware";

const authRoutes = new Hono();

authRoutes.post("/login", authHandler.login);
authRoutes.post("/challenge", authHandler.challenge);
authRoutes.post("/logout", authMiddleware, authHandler.logout);
authRoutes.get("/whoami", authMiddleware, authHandler.whoami);

export default authRoutes;
