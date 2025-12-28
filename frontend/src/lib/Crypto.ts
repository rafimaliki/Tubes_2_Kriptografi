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

  async verifySignature(data: string, signatureBase64: string, public_key_string: string): Promise<boolean> {
    try {
      const public_key = await this.importPublicKeyFromBase64(public_key_string);
      const dataEncoded = new TextEncoder().encode(data);
      
      const signatureBinary = atob(signatureBase64);
      const signatureBytes = new Uint8Array(signatureBinary.length);
      for (let i = 0; i < signatureBinary.length; i++) {
        signatureBytes[i] = signatureBinary.charCodeAt(i);
      }
      
      const isValid = await crypto.subtle.verify(
        {
          name: "ECDSA",
          hash: "SHA-256",
        },
        public_key,
        signatureBytes.buffer,
        dataEncoded
      );
      
      return isValid;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
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

  async importPublicKeyFromBase64(base64: string): Promise<CryptoKey> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return await crypto.subtle.importKey(
      "spki",
      bytes.buffer,
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
