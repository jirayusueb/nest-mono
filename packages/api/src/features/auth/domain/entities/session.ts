import type { SessionId, UserId } from "../../../../shared/kernel/types/ids";

export interface SessionProps {
  id: SessionId;
  userId: UserId;
  /** SHA-256 digest of the cookie token — never the cookie value itself. */
  tokenHash: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IssueSessionInput = Omit<
  SessionProps,
  "createdAt" | "updatedAt"
> & { now: Date };

export class Session {
  /** Fixed 7 day lifetime; no sliding refresh. */
  static readonly TTL_SECONDS = 604_800;

  private constructor(private readonly props: SessionProps) {}

  get id(): SessionId {
    return this.props.id;
  }
  get userId(): UserId {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get ipAddress(): string | null {
    return this.props.ipAddress;
  }
  get userAgent(): string | null {
    return this.props.userAgent;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Factory for NEW sessions. */
  static issue(input: IssueSessionInput): Session {
    return new Session({
      ...input,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  /** Factory for EXISTING sessions (trusted DB rows). */
  static restore(props: SessionProps): Session {
    return new Session(props);
  }

  isExpired(now: Date): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }
}
