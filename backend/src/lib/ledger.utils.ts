import { desc } from "drizzle-orm";
import CryptoJS from "crypto-js";
import { db } from "@/db";
import { ledger } from "@/db/schema";

export const LedgerUtils = {
  async getLastHash(): Promise<string> {
    const lastBlock = await db
      .select({ current_hash: ledger.current_hash })
      .from(ledger)
      .orderBy(desc(ledger.id))
      .limit(1);

    // Return Genesis Hash if ledger is empty
    return lastBlock[0]?.current_hash ?? "0000000000000000000000000000000000000000000000000000000000000000";
  },

  /**
   * Calculates SHA-256 hash ensuring the chain is immutable.
   * Format: SHA256(PreviousHash + Metadata + Signature)
   */
  calculateHash(prevHash: string, metadata: unknown, signature: string): string {
    const dataString = JSON.stringify(metadata);
    const contentToHash = prevHash + dataString + signature;
    
    return CryptoJS.SHA256(contentToHash).toString();
  }
};