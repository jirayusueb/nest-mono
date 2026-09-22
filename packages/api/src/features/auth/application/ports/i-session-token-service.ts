export abstract class ISessionTokenService {
  abstract issue(): Promise<{ token: string; tokenHash: string }>;
  abstract hash(raw: string): Promise<string>;
}
