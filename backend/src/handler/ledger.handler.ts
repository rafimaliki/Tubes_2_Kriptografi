import type { Context } from "hono";
import { db } from "@/db";
import { ledger } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { LedgerUtils } from "@/lib/ledger.utils";

type RevokeMetadata = {
  action: "REVOKE";
  target_cert_id: string;
  reason: string;
  issuer: string;
  timestamp: string;
};
const GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

export const ledgerHandler = {
  validateTransaction: async (hash: string): Promise<boolean> => {
    try {
      const [transaction] = await db
        .select()
        .from(ledger)
        .where(eq(ledger.current_hash, hash))
        .limit(1);

      if (!transaction) {
        return false;
      }

      // If this is the genesis transaction (first transaction)
      if (transaction.previous_hash === GENESIS_HASH) {
        const calculatedHash = LedgerUtils.calculateHash(
          transaction.previous_hash,
          transaction.metadata,
          transaction.signature
        );
        return calculatedHash === transaction.current_hash;
      }

      const calculatedHash = LedgerUtils.calculateHash(
        transaction.previous_hash,
        transaction.metadata,
        transaction.signature
      );

      if (calculatedHash !== transaction.current_hash) {
        return false; // Hash mismatch - chain is broken
      }

      // Recursively validate the previous transaction
      return await ledgerHandler.validateTransaction(transaction.previous_hash);
    } catch (error) {
      console.error("Error validating transaction:", error);
      return false;
    }
  },

  isTransactionRevoked: async (hash: string): Promise<boolean> => {
    try {
      const revokeTransactions = await db
        .select()
        .from(ledger)
        .where(sql`${ledger.metadata} ->> 'target_cert_id' = ${hash}`);

      return revokeTransactions.length > 0;
    } catch (error) {
      console.error("Error checking revocation status:", error);
      return false;
    }
  },

  getTransaction: async (c: Context) => {
    try {
      const hash = c.req.param("hash");

      if (!hash) {
        return c.json({ error: "Transaction hash is required" }, 400);
      }

      const [transaction] = await db
        .select()
        .from(ledger)
        .where(eq(ledger.current_hash, hash))
        .limit(1);

      if (!transaction) {
        return c.json({ error: "Transaction not found" }, 404);
      }

      const isValid = await ledgerHandler.validateTransaction(hash);

      if (!isValid) {
        return c.json({
          transaction: {
            id: transaction.id,
            previous_hash: transaction.previous_hash,
            current_hash: transaction.current_hash,
            transaction_type: transaction.transaction_type,
            metadata: transaction.metadata,
            created_at: transaction.created_at,
          },
          status: "invalid",
          message:
            "Transaction chain validation failed - hash mismatch detected",
        });
      }

      const isRevoked =
        transaction.transaction_type === "ISSUE"
          ? await ledgerHandler.isTransactionRevoked(hash)
          : false;

      const status = isRevoked ? "revoked" : "valid";

      let revokeReason = null;
      if (isRevoked) {
        const [revokeTransaction] = await db
          .select()
          .from(ledger)
          .where(sql`${ledger.metadata} ->> 'target_cert_id' = ${hash}`)
          .limit(1);

        if (revokeTransaction) {
          const revokeMetadata = revokeTransaction.metadata as RevokeMetadata;
          revokeReason = revokeMetadata.reason;
        }
      }

      return c.json({
        transaction: {
          id: transaction.id,
          previous_hash: transaction.previous_hash,
          current_hash: transaction.current_hash,
          transaction_type: transaction.transaction_type,
          metadata: transaction.metadata,
          created_at: transaction.created_at,
        },
        status,
        ...(revokeReason && { revokeReason }),
        message: isRevoked
          ? "Transaction is valid but has been revoked"
          : "Transaction is valid and active",
      });
    } catch (error) {
      console.error("Get Transaction Error:", error);
      return c.json({ error: "Failed to get transaction" }, 500);
    }
  },

  listTransactions: async (c: Context) => {
    try {
      const transactions = await db
        .select({
          id: ledger.id,
          previous_hash: ledger.previous_hash,
          current_hash: ledger.current_hash,
          transaction_type: ledger.transaction_type,
          metadata: ledger.metadata,
          signature: ledger.signature,
          created_at: ledger.created_at,
        })
        .from(ledger)
        .orderBy(desc(ledger.created_at));

      console.log("Fetched Transactions:", transactions);

      return c.json(transactions);
    } catch (error) {
      console.error("Get All Transactions Error:", error);
      return c.json({ error: "Failed to get transactions" }, 500);
    }
  },
};
