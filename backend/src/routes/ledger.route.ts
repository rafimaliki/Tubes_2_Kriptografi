import { Hono } from "hono";
import { ledgerHandler } from "../handler/ledger.handler";

const ledgerRoutes = new Hono();

ledgerRoutes.get("/list", ledgerHandler.listTransactions);
ledgerRoutes.get("/:hash", ledgerHandler.getTransaction);

export default ledgerRoutes;
