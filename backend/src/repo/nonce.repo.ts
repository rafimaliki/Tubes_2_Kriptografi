import crypto from "crypto";

let nonce: string | null = null;

export const NonceRepository = {
  get: () => {
    return nonce;
  },

  generate: () => {
    nonce = crypto.randomBytes(16).toString("hex");
    return nonce;
  },

  clear: () => {
    nonce = null;
  },
};
