import { sign, verify } from "hono/jwt";

const secret = "hiahiahiahiahaiha";

const EXPIRATION_SECONDS = 60 * 60 * 24;

export async function generateJwt(payload: Record<string, unknown>) {
  const exp = Math.floor(Date.now() / 1000) + EXPIRATION_SECONDS;

  return await sign(
    {
      ...payload,
      exp,
    },
    secret
  );
}

export async function verifyJwt(token: string) {
  try {
    const decoded = (await verify(token, secret)) as Record<string, unknown>;
    return decoded["user"] as string;
  } catch (err) {
    throw new Error("Invalid token");
  }
}
