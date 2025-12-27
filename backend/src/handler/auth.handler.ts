import type { Context } from "hono";
import { generateJwt } from "@/lib/jwt";
import { NonceRepository } from "@/repo/nonce.repo";
import { PublicKeyRepository } from "@/repo/publickey.repo";
import { Crypto } from "@/lib/crypto";

export const authHandler = {
  async challenge(c: Context) {
    try {
      // generate nonce
      const nonce = NonceRepository.generate();

      return c.json({ nonce: nonce }, 200);
    } catch (error) {
      return c.json({ error }, 400);
    }
  },

  async login(c: Context) {
    try {
      const body = await c.req.text();

      // get public key
      const public_key = PublicKeyRepository.get();

      // get signed nonce dari body
      const { signed_nonce } = JSON.parse(body);

      // get stored nonce
      const stored_nonce = NonceRepository.get();

      if (!stored_nonce) {
        return c.json({ error: "Invalid Key" }, 401);
      }

      // verify signed nonce
      const verified = await Crypto.verifyNonce(
        stored_nonce,
        signed_nonce,
        public_key
      );
      if (!verified) {
        return c.json({ error: "Invalid Key" }, 401);
      }

      const jwt_payload = {
        user: "admin",
      };

      const jwt_token = await generateJwt(jwt_payload);

      // clear nonce
      NonceRepository.clear();

      c.header(
        "Set-Cookie",
        `jwt_token=${jwt_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
      );

      return c.json(
        {
          message: "Login successful",
          public_key: PublicKeyRepository.get(),
        },
        200
      );
    } catch (error) {
      console.error("Login error:", error);
      return c.json({ error: String(error) }, 400);
    }
  },

  async logout(c: Context) {
    try {
      c.header(
        "Set-Cookie",
        `jwt_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
      );
      return c.json({ message: "Logout successful" }, 200);
    } catch (error) {
      return c.json({ error }, 400);
    }
  },

  async whoami(c: Context) {
    return c.json(
      {
        user: {
          name: c.user,
        },
      },
      200
    );
  },
};
