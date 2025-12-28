import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ledger = pgTable("ledger", {
  id: serial("id").primaryKey(),
  
  // immutable logic
  previous_hash: text("previous_hash").notNull(), 
  current_hash: text("current_hash").notNull(), 
  
  // Type: 'ISSUE' or 'REVOKE'
  transaction_type: text("transaction_type").notNull(), 
  
  // Metadata: Stores Diploma Info or Revocation Reason
  metadata: jsonb("metadata").notNull(), 
  
  // Digital signature of the Issuer (ECDSA) for authenticity
  signature: text("signature").notNull(),

  // Access URL for certificate in website
  access_url: text("access_url").notNull(),
  
  created_at: timestamp("created_at").defaultNow(),
});