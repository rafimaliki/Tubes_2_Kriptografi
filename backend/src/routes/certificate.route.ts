import { Hono } from "hono";
import { certificateHandler } from "../handler/certificate.handler";

const certificateRoutes = new Hono();

certificateRoutes.post("/upload", certificateHandler.upload);
certificateRoutes.post("/revoke", certificateHandler.revoke);
certificateRoutes.get("/download/:fileName", certificateHandler.download);
certificateRoutes.get("/list", certificateHandler.list);
certificateRoutes.get("/:id", certificateHandler.getById);


export default certificateRoutes;
