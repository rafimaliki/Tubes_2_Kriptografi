import axios from "axios";

const BACKEND_URL = "http://localhost:5000/api/";

axios.defaults.withCredentials = true;

import type { TransactionListApiResult } from "@/types/api-result.type";

export interface IssuePayload {
  file: File;
  ownerName: string;
  study: string;
  signature: string;
  issuerAddress: string;
  fileType: string;
}

export interface RevokePayload {
  target_tx_hash: string;
  signature: string;
  issuerAddress: string;
  reason: string;
}

export const TransactionAPI = {
  list: async (): Promise<TransactionListApiResult> => {
    try {
      const res = await axios.get(BACKEND_URL + "ledger/list");
      return { ok: true, data: res.data };
    } catch (err: any) {
      console.error("TransactionAPI.list error:", err);
      const msg = err?.response?.data?.error ?? "Network error";
      return { ok: false, error: String(msg) };
    }
  },
};
