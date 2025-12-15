import { Hono } from "hono";
import { certificateHandler } from "../handler/certificate.handler";

const certificateRoutes = new Hono();

certificateRoutes.post("/upload", certificateHandler.upload);
certificateRoutes.get("/download/:fileName", certificateHandler.download);

export default certificateRoutes;
