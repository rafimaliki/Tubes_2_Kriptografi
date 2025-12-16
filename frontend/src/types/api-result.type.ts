// generic type
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// auth api
export type ChallengeApiResult = ApiResult<{ nonce: string }>;
export type LoginApiResult = ApiResult<{
  message: string;
  jwt_token: string;
  public_key: string;
}>;
