import { Hono } from "hono";
import apiRoutes from "./routes/api.route";
import { errorMiddleware } from "./middleware/error.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { corsMiddleware } from "./middleware/cors.middleware";

const app = new Hono();

app.use(corsMiddleware);
app.use(loggerMiddleware);
app.use(errorMiddleware);

app.get("/", (c) => c.json({ message: "Hello from Hono + Bun!" }));
app.route("/api", apiRoutes);

export default app;
