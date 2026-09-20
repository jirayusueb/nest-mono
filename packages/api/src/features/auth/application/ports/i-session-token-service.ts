export const SESSION_TOKEN_SERVICE = "SESSION_TOKEN_SERVICE";

export interface ISessionTokenService {
  issue(): Promise<{ token: string; tokenHash: string }>;
  hash(raw: string): Promise<string>;
}
