import { Hono } from "hono";

import authRoutes from "./auth.route";
import certificateRoutes from "./certificate.route";
import ledgerRoutes from "./ledger.route";

const apiRoutes = new Hono();

apiRoutes.route("/auth", authRoutes);
apiRoutes.route("/certificate", certificateRoutes);
apiRoutes.route("/ledger", ledgerRoutes);

export default apiRoutes;
