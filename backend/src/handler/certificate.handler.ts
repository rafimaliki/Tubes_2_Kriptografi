import type { Context } from "hono";
import { writeFile } from "fs/promises";
import { join } from "path";
import CryptoJS from "crypto-js";
import { db } from "@/db";
import { ledger } from "@/db/schema";
import { LedgerUtils } from "@/lib/ledger.utils";
import { ledgerHandler } from "@/handler/ledger.handler";
import { and, eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const STORAGE_DIR = join(import.meta.dir, "../../storage/certificates");
const ACCESS_URL_ENCRYPTION_KEY = "BACKEND_SECRET_KEY_FOR_ACCESS_URL_2024";


type IssueMetadata = {
  action: "ISSUE";
  fileName: string;
  fileHash: string;
  ownerName: string;
  studyProgram: string;
  issuer: string;
  timestamp: string;
};

type RevokeMetadata = {
  action: "REVOKE";
  target_cert_id: string;
  reason: string;
  issuer: string;
  timestamp: string;
};

type LedgerMetadata = IssueMetadata | RevokeMetadata;


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
      const fileType = formData.get("fileType") as string;


      if (!file || !signature || !issuerAddress || !ownerName || !studyProgram || !fileType) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBase64 = Buffer.from(arrayBuffer).toString("base64");

      const originalFileHash = CryptoJS.SHA256(
        CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer))
      ).toString();

      const aesKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);

      const encryptedContent = CryptoJS.AES.encrypt(fileBase64, aesKey).toString();


      const fileName = `${fileType}-${Date.now()}-${originalFileHash.substring(0, 8)}.enc`;
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

      const accessUrl = `http://localhost:3000/verify?cert_url=${fileName}&aes_key=${encodeURIComponent(
        aesKey
      )}&tx_hash=${currentHash}`;

      const encryptedAccessUrl = CryptoJS.AES.encrypt(accessUrl, ACCESS_URL_ENCRYPTION_KEY).toString();

      await db.insert(ledger).values({
        previous_hash: prevHash,
        current_hash: currentHash,
        transaction_type: "ISSUE",
        metadata,
        signature,
        access_url: encryptedAccessUrl,
      });

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

      const [existingLedger] = await db
        .select({ id: ledger.id, access_url: ledger.access_url })
        .from(ledger)
        .where(eq(ledger.current_hash, target_tx_hash));

      if (!existingLedger) {
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
        access_url: existingLedger.access_url,
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

      const origin = c.req.header("origin") || "http://localhost:3000";
      
      return new Response(file, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      });
    } catch {
      return c.json({ error: "Download failed" }, 500);
    }
  },

  list: async (c: Context) => {
    const issues = await db
      .select()
      .from(ledger)
      .where(eq(ledger.transaction_type, "ISSUE"))
      .orderBy(desc(ledger.created_at));

    const revokes = await db
      .select()
      .from(ledger)
      .where(eq(ledger.transaction_type, "REVOKE"));

    const revokedTargets = new Set(
      revokes
        .map((r) => (r.metadata as RevokeMetadata | null)?.target_cert_id)
        .filter(Boolean)
    );

    const certificatesWithStatus = await Promise.all(
      issues.map(async (r) => {
        const metadata = r.metadata as IssueMetadata;

        let status: "valid" | "invalid" | "revoked" = "valid";
        
        if (revokedTargets.has(r.current_hash)) {
          status = "revoked";
        } else {
          const isValid = await ledgerHandler.validateTransaction(r.current_hash);
          status = isValid ? "valid" : "invalid";
        }

        return {
          id: r.current_hash,
          ownerName: metadata.ownerName,
          study: metadata.studyProgram,
          issueDate: metadata.timestamp,
          status,
        };
      })
    );

    return c.json(certificatesWithStatus);
  },

  getById: async (c: Context) => {
    const id = c.req.param("id");

    const rows = await db
      .select()
      .from(ledger)
      .where(and(eq(ledger.current_hash, id)))
      .limit(1);

    const revoke = await db
      .select()
      .from(ledger)
      .where(sql`${ledger.metadata} ->> 'target_cert_id' = ${id}`)

    const revokeEntry = revoke[0];
    const revokeMetadata = revokeEntry?.metadata as RevokeMetadata | undefined;


    if (!rows.length) {
      return c.json({ error: "Certificate not found" }, 404);
    }

    const issue = rows[0];
    if (!issue) {
      return c.json({ error: "Certificate not found" }, 404);
    }

    const metadata = issue!.metadata as any;

    let decryptedAccessUrl = "";
    if (issue.access_url) {
      try {
        const bytes = CryptoJS.AES.decrypt(issue.access_url, ACCESS_URL_ENCRYPTION_KEY);
        decryptedAccessUrl = bytes.toString(CryptoJS.enc.Utf8);
      } catch (error) {
        console.error("Failed to decrypt access URL:", error);
      }
    }

    let status: "valid" | "invalid" | "revoked" = "valid";
    
    if (revoke.length) {
      status = "revoked";
    } else {
      const isValid = await ledgerHandler.validateTransaction(id);
      status = isValid ? "valid" : "invalid";
    }

    return c.json({
      id,
      ownerName: metadata.ownerName,
      study: metadata.studyProgram,
      issueDate: metadata.timestamp,
      status,
      revokeReason: revokeMetadata?.reason || null,
      accessUrl: decryptedAccessUrl,
    });
  },


};
