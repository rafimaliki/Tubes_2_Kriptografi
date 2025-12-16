import type { Context } from "hono";
import { generateJwt } from "@/lib/jwt";
import { NonceRepository } from "@/repo/nonce.repo";
import { PublicKeyRepository } from "@/repo/publickey.repo";

export const authHandler = {
  async challenge(c: Context) {
    try {
      const nonce = NonceRepository.generate();

      return c.json({ nonce: nonce }, 200);
    } catch (error) {
      return c.json({ error }, 400);
    }
  },

  async login(c: Context) {
    try {
      const body = await c.req.text();
      const public_key = PublicKeyRepository.get();

      const { signed_nonce } = JSON.parse(body);
      console.log("Received signed_nonce:", signed_nonce);

      const stored_nonce = NonceRepository.get();
      console.log("Stored nonce:", stored_nonce);

      if (!stored_nonce) {
        return c.json({ error: "Invalid Key" }, 401);
      }

      const verified = true;
      if (!verified) {
        return c.json({ error: "Invalid Key" }, 401);
      }

      const jwt_payload = {
        user: "admin",
      };

      const jwt_token = await generateJwt(jwt_payload);

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
};
