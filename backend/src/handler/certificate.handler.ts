import type { Context } from "hono";
import { writeFile } from "fs/promises";
import { join } from "path";
import CryptoJS from "crypto-js";
import { db } from "@/db";
import { ledger } from "@/db/schema";
import { LedgerUtils } from "@/lib/ledger.utils";
import { eq } from "drizzle-orm";

const STORAGE_DIR = join(import.meta.dir, "../../storage/certificates");

export const certificateHandler = {
  upload: async (c: Context) => {
    try {
      console.log("payload received", c.req.formData);

      const formData = await c.req.formData();
      const file = formData.get("file") as File;
      const signature = formData.get("signature") as string;
      const ownerName = formData.get("ownerName") as string;
      const studyProgram = formData.get("study") as string;
      const issuerAddress = formData.get("issuerAddress") as string;


      if (!file || !signature || !issuerAddress || !ownerName || !studyProgram) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBase64 = Buffer.from(arrayBuffer).toString("base64");

      const originalFileHash = CryptoJS.SHA256(
        CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer))
      ).toString();

      const aesKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);

      const encryptedContent = CryptoJS.AES.encrypt(fileBase64, aesKey).toString();


      const fileName = `${Date.now()}-${originalFileHash.substring(0, 8)}.enc`;
      await writeFile(join(STORAGE_DIR, fileName), encryptedContent);

      const prevHash = await LedgerUtils.getLastHash();

      const metadata = {
        action: "ISSUE",
        fileName,
        fileHash: originalFileHash,
        ownerName,
        studyProgram,
        issuer: issuerAddress,
        timestamp: new Date().toISOString(),
      };

      const currentHash = LedgerUtils.calculateHash(prevHash, metadata, signature);

      await db.insert(ledger).values({
        previous_hash: prevHash,
        current_hash: currentHash,
        transaction_type: "ISSUE",
        metadata,
        signature,
      });

      const accessUrl = `${c.req.header("origin")}/verify?file=${fileName}&key=${encodeURIComponent(
        aesKey
      )}&tx=${currentHash}`;

      return c.json(
        {
          success: true,
          data: {
            tx_hash: currentHash,
            access_url: accessUrl,
          },
        },
        201
      );
    } catch (error) {
      console.error("Issue Certificate Error:", error);
      return c.json({ error: "Failed to issue certificate" }, 500);
    }
  },

  revoke: async (c: Context) => {
    try {
      const { target_tx_hash, reason, signature, issuerAddress } = await c.req.json();

      if (!target_tx_hash || !reason || !signature || !issuerAddress) {
        return c.json({ error: "Missing required revocation parameters" }, 400);
      }

      const exists = await db
        .select({ id: ledger.id })
        .from(ledger)
        .where(eq(ledger.current_hash, target_tx_hash));

      if (!exists.length) {
        return c.json({ error: "Target certificate not found" }, 404);
      }

      const prevHash = await LedgerUtils.getLastHash();

      const metadata = {
        action: "REVOKE",
        target_cert_id: target_tx_hash,
        reason,
        issuer: issuerAddress,
        timestamp: new Date().toISOString(),
      };

      const currentHash = LedgerUtils.calculateHash(prevHash, metadata, signature);

      await db.insert(ledger).values({
        previous_hash: prevHash,
        current_hash: currentHash,
        transaction_type: "REVOKE",
        metadata,
        signature,
      });

      return c.json({
        success: true,
        message: "Certificate revoked successfully",
        tx_hash: currentHash,
      });
    } catch (error) {
      console.error("Revoke Error:", error);
      return c.json({ error: "Failed to revoke certificate" }, 500);
    }
  },

  download: async (c: Context) => {
    try {
      const fileName = c.req.param("fileName");

      if (!fileName?.endsWith(".enc")) {
        return c.json({ error: "Invalid file format" }, 403);
      }

      const filePath = join(STORAGE_DIR, fileName);
      const file = Bun.file(filePath);

      if (!(await file.exists())) {
        return c.json({ error: "File not found" }, 404);
      }

      if (!filePath.startsWith(STORAGE_DIR)) {
        return c.json({ error: "Access denied" }, 403);
      }

      return new Response(file);
    } catch {
      return c.json({ error: "Download failed" }, 500);
    }
  },
};
