import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { Email } from "../../../../shared/kernel/values/email";
import type { IssuedSessionDto } from "../dtos/issued-session-dto";
import type { SignInInput } from "../dtos/sign-in-input";
import type { IIdentityRepository } from "../ports/i-identity-repository";
import type { IPasswordHasher } from "../ports/i-password-hasher";
import type { SessionIssuer } from "../services/session-issuer";

/** Enumeration-safe: every failure path answers the same Unauthorized. */
const INVALID_CREDENTIALS = () =>
  AppError.unauthorized("Invalid email or password");

export class SignIn {
  constructor(
    private readonly identities: IIdentityRepository,
    private readonly hasher: IPasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
    private readonly dateProvider: IDateProvider,
  ) {}

  async execute(
    input: SignInInput,
  ): Promise<Result<IssuedSessionDto, AppError>> {
    const email = Email.create(input.email);

    if (email.isErr()) {
      return err(INVALID_CREDENTIALS());
    }

    const identity = await this.identities.findByEmail(email.value);

    if (identity === null || identity.passwordHash === null) {
      return err(INVALID_CREDENTIALS());
    }

    const verified = await this.hasher.verify(
      input.password,
      identity.passwordHash,
    );

    if (!verified) {
      return err(INVALID_CREDENTIALS());
    }

    return ok(
      await this.sessionIssuer.issue(identity, input, this.dateProvider.now()),
    );
  }
}
