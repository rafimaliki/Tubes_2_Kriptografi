import { create } from "zustand";
import { AuthAPI } from "@/api/auth.api";
import { LocalStorage } from "@/lib/LocalStorage";
import { Crypto } from "@/lib/Crypto";
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
  verify: () => Promise<void>;
  login: (privateKey: string) => Promise<ChallengeApiResult | LoginApiResult>;
  logout: () => void;
}

const LOCAL_STORAGE_KEY = "app_user";

export const useAuthStore = create<AuthStore>((set) => ({
  authenticated: false,

  verify: async () => {
    const user = LocalStorage.load(LOCAL_STORAGE_KEY) as User | null;
    if (!user) {
      set({ authenticated: false });
      return;
    }

    try {
      const whoami_res = await AuthAPI.whoami();

      if (whoami_res.ok && whoami_res.data.user.name === user.name) {
        set({ authenticated: true });
      } else {
        set({ authenticated: false });
        LocalStorage.deleteAll();
      }
    } catch (err) {
      console.error("AuthStore.verify error:", err);
      set({ authenticated: false });
      LocalStorage.deleteAll();
    }
  },

  login: async (private_key: string) => {
    try {
      // 1) request challenge nonce
      const challenge_res = await AuthAPI.challenge();

      if (!challenge_res.ok) {
        return challenge_res;
      }

      const { nonce } = challenge_res.data;

      // 2) sign nonce
      const signed_nonce = await Crypto.signNonce(nonce, private_key);

      console.log("Signed Nonce:", signed_nonce);

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

  logout: async () => {
    try {
      const logout_res = await AuthAPI.logout();

      set({ authenticated: false });
      LocalStorage.deleteAll();

      return logout_res;
    } catch (err) {
      console.error("AuthStore.logout error:", err);

      return { ok: false, error: "Unexpected error during logout" };
    }
  },
}));
