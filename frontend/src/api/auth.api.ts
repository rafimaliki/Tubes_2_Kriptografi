import axios from "axios";
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api/";

// Configure axios to include credentials (cookies)
axios.defaults.withCredentials = true;

import type {
  ChallengeApiResult,
  LoginApiResult,
} from "@/types/api-result.type";

export const AuthAPI = {
  challenge: async (): Promise<ChallengeApiResult> => {
    try {
      const res = await axios.post(BACKEND_URL + "auth/challenge");
      return { ok: true, data: res.data };
    } catch (err: any) {
      console.error("AuthAPI.challenge error:", err);
      const msg = err?.response?.data?.error ?? "Network error";
      return { ok: false, error: String(msg) };
    }
  },

  login: async (signed_nonce: string): Promise<LoginApiResult> => {
    try {
      const res = await axios.post(BACKEND_URL + "auth/login", {
        signed_nonce,
      });
      return { ok: true, data: res.data };
    } catch (err: any) {
      console.error("AuthAPI.login error:", err);
      const msg = err?.response?.data?.error ?? "Network error";
      return { ok: false, error: String(msg) };
    }
  },
};
