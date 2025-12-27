import axios from "axios";
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api/";

axios.defaults.withCredentials = true;

import type {
  ChallengeApiResult,
  LoginApiResult,
  WhoamiApiResult,
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

  logout: async (): Promise<void> => {
    try {
      await axios.post(BACKEND_URL + "auth/logout");
    } catch (err: any) {
      console.error("AuthAPI.logout error:", err);
    }
  },

  whoami: async (): Promise<WhoamiApiResult> => {
    try {
      const res = await axios.get(BACKEND_URL + "auth/whoami");
      return { ok: true, data: res.data };
    } catch (err: any) {
      console.error("AuthAPI.whoami error:", err);
      const msg = err?.response?.data?.error ?? "Network error";
      return { ok: false, error: String(msg) };
    }
  },
};
