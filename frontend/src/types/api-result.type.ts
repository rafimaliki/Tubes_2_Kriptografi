// generic type
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// auth api
export type ChallengeApiResult = ApiResult<{ nonce: string }>;
export type LoginApiResult = ApiResult<{
  message: string;
  jwt_token: string;
  public_key: string;
}>;
export type WhoamiApiResult = ApiResult<{
  user: {
    name: string;
  };
}>;

// transaction api
export type TransactionListApiResult = ApiResult<
  [
    {
      id: number;
      previous_hash: string;
      current_hash: string;
      transaction_type: string;
      metadata: {
        action: string;
        issuer: string;
        fileHash: string;
        fileName: string;
        ownerName: string;
        timestamp: string;
        studyProgram: string;
      };
      signature: string;
      created_at: string;
    },
  ]
>;
