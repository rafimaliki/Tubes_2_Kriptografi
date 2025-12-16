import { Hono } from "hono";
import { authHandler } from "@/handler/auth.handler";

const authRoutes = new Hono();

authRoutes.post("/login", authHandler.login);
authRoutes.post("/challenge", authHandler.challenge);

export default authRoutes;
