import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../../../shared/application/interfaces/i-id-generator";
import { make } from "../../../../shared/kernel/types/brand";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { Email } from "../../../../shared/kernel/values/email";
import { PlainPassword } from "../../domain/values/plain-password";
import type { IssuedSessionDto } from "../dtos/issued-session-dto";
import type { SignUpInput } from "../dtos/sign-up-input";
import type { IIdentityRepository } from "../ports/i-identity-repository";
import type { IPasswordHasher } from "../ports/i-password-hasher";
import type { SessionIssuer } from "../services/session-issuer";

export class SignUp {
  constructor(
    private readonly identities: IIdentityRepository,
    private readonly hasher: IPasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
    private readonly idGenerator: IIdGenerator,
    private readonly dateProvider: IDateProvider,
  ) {}

  async execute(
    input: SignUpInput,
  ): Promise<Result<IssuedSessionDto, AppError>> {
    const email = Email.create(input.email);

    if (email.isErr()) {
      return err(email.error);
    }

    const password = PlainPassword.create(input.password);

    if (password.isErr()) {
      return err(password.error);
    }

    const name = input.name.trim();

    if (name.length === 0 || name.length > 100) {
      return err(AppError.validation("Name must be 1-100 characters"));
    }

    if (await this.identities.emailExists(email.value)) {
      return err(AppError.conflict("User already exists"));
    }

    const now = this.dateProvider.now();

    const identity = await this.identities.createWithCredential({
      accountId: this.idGenerator.generate(),
      email: email.value.value,
      name,
      now,
      passwordHash: await this.hasher.hash(password.value.value),
      userId: make<UserId>(this.idGenerator.generate()),
    });

    return ok(await this.sessionIssuer.issue(identity, input, now));
  }
}
