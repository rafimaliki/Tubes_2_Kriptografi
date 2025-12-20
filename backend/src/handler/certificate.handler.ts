import type { Context } from "hono";
import { writeFile, readFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import CryptoJS from "crypto-js";
import { db } from "@/db";
import { ledger } from "@/db/schema";
import { LedgerUtils } from "@/lib/ledger.utils";

const STORAGE_DIR = join(import.meta.dir, "../../storage/certificates");

export const certificateHandler = {
  /**
   * ISSUE CERTIFICATE
   * 1. Encrypts file with AES (key is returned to user, not stored).
   * 2. Hashes original file for integrity.
   * 3. Appends transaction to the ledger with chained hashing.
   */
  upload: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;
      const signature = formData.get("signature") as string;
      const ownerName = formData.get("ownerName") as string;
      const studyProgram = formData.get("study") as string;
      const issuerAddress = formData.get("issuerAddress") as string;

      if (!file || !signature || !issuerAddress) {
        return c.json({ error: "Missing file, signature, or issuer address" }, 400);
      }

      // Process File Off-Chain
      const arrayBuffer = await file.arrayBuffer();
      const fileBase64 = Buffer.from(arrayBuffer).toString('base64');
      
      // Calculate hash of the ORIGINAL file for verification later
      const originalFileHash = CryptoJS.SHA256(fileBase64).toString();

      // Generate random AES key (32 bytes)
      const aesKey = CryptoJS.lib.WordArray.random(32).toString();

      // Encrypt file content
      const encryptedContent = CryptoJS.AES.encrypt(fileBase64, aesKey).toString();

      // Save encrypted file
      const fileName = `${Date.now()}-${originalFileHash.substring(0, 8)}.enc`;
      await writeFile(join(STORAGE_DIR, fileName), encryptedContent);

      // Ledger Logic (On-Chain)
      const prevHash = await LedgerUtils.getLastHash();

      const metadata = {
        action: "ISSUE",
        fileName,         
        fileHash: originalFileHash,
        ownerName,
        studyProgram,
        issuer: issuerAddress,
        timestamp: new Date().toISOString()
      };

      const currentHash = LedgerUtils.calculateHash(prevHash, metadata, signature);

      await db.insert(ledger).values({
        previous_hash: prevHash,
        current_hash: currentHash,
        transaction_type: "ISSUE",
        metadata,
        signature
      });

      // Construct verification URL containing the AES Key
      // This URL allows the user to decrypt the file client-side
      const accessUrl = `${c.req.header('origin')}/verify?file=${fileName}&key=${aesKey}&tx=${currentHash}`;

      return c.json({
        success: true,
        data: {
          tx_hash: currentHash,
          access_url: accessUrl
        }
      }, 201);

    } catch (error) {
      console.error("Issue Certificate Error:", error);
      return c.json({ error: "Failed to issue certificate" }, 500);
    }
  },

  /**
   * REVOKE CERTIFICATE
   * Adds a revocation block to the ledger.
   */
  revoke: async (c: Context) => {
    try {
      const { target_tx_hash, reason, signature, issuerAddress } = await c.req.json();

      if (!target_tx_hash || !reason || !signature) {
        return c.json({ error: "Missing required revocation parameters" }, 400);
      }

      const prevHash = await LedgerUtils.getLastHash();

      const metadata = {
        action: "REVOKE",
        target_cert_id: target_tx_hash,
        reason,
        issuer: issuerAddress,
        timestamp: new Date().toISOString()
      };

      const currentHash = LedgerUtils.calculateHash(prevHash, metadata, signature);

      await db.insert(ledger).values({
        previous_hash: prevHash,
        current_hash: currentHash,
        transaction_type: "REVOKE",
        metadata,
        signature
      });

      return c.json({
        success: true,
        message: "Certificate revoked successfully",
        tx_hash: currentHash
      });

    } catch (error) {
      console.error("Revoke Error:", error);
      return c.json({ error: "Failed to revoke certificate" }, 500);
    }
  },

  /**
   * SERVE ENCRYPTED FILE
   * Only serves .enc files. Client must have the key to decrypt.
   */
  download: async (c: Context) => {
    try {
      const fileName = c.req.param("fileName");
      
      if (!fileName?.endsWith('.enc')) {
        return c.json({ error: "Invalid file format" }, 403);
      }

      const filePath = join(STORAGE_DIR, fileName);
      
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
         return c.json({ error: "File not found" }, 404);
      }
      
      // Security check path traversal
      if (!filePath.startsWith(STORAGE_DIR)) {
        return c.json({ error: "Access denied" }, 403);
      }

      // Hono support return Response object directly
      return new Response(file);

    } catch (error) {
      return c.json({ error: "Download failed" }, 500);
    }
  }
};