export const Crypto = {
  async signNonce(nonce: string, private_key_string: string): Promise<string> {
    const private_key = await this.importPrivateKeyFromPem(private_key_string);
    const data = new TextEncoder().encode(nonce);
    const signature = await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      private_key,
      data
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  },

  async importPrivateKeyFromPem(pem: string): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      "pkcs8",
      this.pemToArrayBuffer(pem),
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["sign"]
    );
  },

  pemToArrayBuffer(pem: string): ArrayBuffer {
    const base64 = pem
      .replace(/-----BEGIN.*KEY-----/g, "")
      .replace(/-----END.*KEY-----/g, "")
      .replace(/\s+/g, "");

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  },
};
