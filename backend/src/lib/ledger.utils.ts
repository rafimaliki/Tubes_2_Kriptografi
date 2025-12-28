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
   * 
   * Uses sorted keys to ensure consistent stringification
   */
  calculateHash(prevHash: string, metadata: unknown, signature: string): string {
    // Sort keys to ensure consistent JSON stringification
    const sortedMetadata = this.sortObjectKeys(metadata);
    const dataString = JSON.stringify(sortedMetadata);
    const contentToHash = prevHash + dataString + signature;
    
    return CryptoJS.SHA256(contentToHash).toString();
  },

  /**
   * Recursively sorts object keys alphabetically for consistent serialization
   */
  sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key: string) => {
        result[key] = this.sortObjectKeys(obj[key]);
        return result;
      }, {});
  }
};