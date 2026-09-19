export interface ISessionTokenService {
  /** Mint a fresh token pair: the cookie value and its DB digest. */
  issue(): Promise<{ token: string; tokenHash: string }>;
  hash(raw: string): Promise<string>;
}
