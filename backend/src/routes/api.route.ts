import { Hono } from "hono";

import authRoutes from "./auth.route";
import certificateRoutes from "./certificate.route";

const apiRoutes = new Hono();

apiRoutes.route("/auth", authRoutes);
apiRoutes.route("/certificate", certificateRoutes);

export default apiRoutes;
