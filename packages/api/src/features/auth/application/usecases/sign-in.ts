import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { EmailVO } from "../../../../shared/kernel/values/email-vo";
import type { IssuedSessionOutput, SignInInput } from "../dtos/auth-dtos";
import type { IIdentityRepository } from "../ports/i-identity-repository";
import type { IPasswordHasher } from "../ports/i-password-hasher";
import type { SessionIssuer } from "../services/session-issuer";

const INVALID_CREDENTIALS = () =>
  AppError.unauthorized("Invalid email or password");

export class SignInUseCase {
  constructor(
    private readonly identities: IIdentityRepository,
    private readonly hasher: IPasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
    private readonly dateProvider: IDateProvider,
  ) {}

  async execute(
    input: SignInInput,
  ): Promise<Result<IssuedSessionOutput, AppError>> {
    const email = EmailVO.create(input.email);

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

    return this.sessionIssuer.issue(identity, input, this.dateProvider.now());
  }
}
