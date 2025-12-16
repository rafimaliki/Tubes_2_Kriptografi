import { create } from "zustand";
import { AuthAPI } from "@/api/auth.api";
import { LocalStorage } from "@/lib/LocalStorage";
import type {
  ChallengeApiResult,
  LoginApiResult,
} from "@/types/api-result.type";

export interface User {
  name: string;
  private_key: string;
  public_key: string;
}

interface AuthStore {
  authenticated: boolean;
  login: (privateKey: string) => Promise<ChallengeApiResult | LoginApiResult>;
  logout: () => void;
}

const LOCAL_STORAGE_KEY = "app_user";

export const useAuthStore = create<AuthStore>((set) => ({
  authenticated: Boolean(LocalStorage.load(LOCAL_STORAGE_KEY)),

  login: async (private_key: string) => {
    try {
      // 1) request challenge nonce
      const challenge_res = await AuthAPI.challenge();

      if (!challenge_res.ok) {
        return challenge_res;
      }

      const { nonce } = challenge_res.data;

      // 2) sign nonce with private key
      const signed_nonce = "signed-" + private_key + "-" + nonce;

      // 3) kirim login request dengan signed nonce
      const login_res = await AuthAPI.login(signed_nonce);

      if (!login_res.ok) {
        return login_res;
      }

      const user = {
        name: "admin",
        private_key: private_key,
        public_key: login_res.data.public_key,
      };

      // 4) save user di store + localStorage
      set({ authenticated: true });
      LocalStorage.save(LOCAL_STORAGE_KEY, user);

      return login_res;
    } catch (err) {
      console.log("AuthStore.login error:", err);
      return { ok: false, error: "Unexpected error during login" };
    }
  },

  logout: () => {
    set({ authenticated: false });
    LocalStorage.deleteAll();
  },
}));
