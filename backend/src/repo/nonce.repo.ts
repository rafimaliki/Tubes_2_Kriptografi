let nonce: string | null = null;

export const NonceRepository = {
  get: () => {
    return nonce;
  },

  generate: () => {
    nonce = "randomly-generated-nonce";
    return nonce;
  },

  clear: () => {
    nonce = null;
  },
};
