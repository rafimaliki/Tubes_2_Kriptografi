export const Crypto = {
  async verifyNonce(
    nonce: string,
    signature_base64: string,
    public_key_string: string
  ): Promise<boolean> {
    const publicKey = await this.importPublicKeyFromPem(public_key_string);

    const data = new TextEncoder().encode(nonce);
    const signature = Uint8Array.from(atob(signature_base64), (c) =>
      c.charCodeAt(0)
    );

    return await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      publicKey,
      signature,
      data
    );
  },

  async importPublicKeyFromPem(pem: string): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      "spki",
      this.pemToArrayBuffer(pem),
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"]
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
