import type {
  IssuedSessionOutput,
  SignUpInput,
} from "~/features/auth/application/dtos/auth-dtos";
import type { IIdentityRepository } from "~/features/auth/application/ports/i-identity-repository";
import type { IPasswordHasher } from "~/features/auth/application/ports/i-password-hasher";
import type { SessionIssuer } from "~/features/auth/application/services/session-issuer";
import { PlainPasswordVO } from "~/features/auth/domain/values/plain-password-vo";
import type { IDateProvider } from "~/shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "~/shared/application/interfaces/i-id-generator";
import type { IUnitOfWork } from "~/shared/application/interfaces/i-unit-of-work";
import { AppError } from "~/shared/kernel/errors/app-error";
import { validateName } from "~/shared/kernel/rules/name-rules";
import { make } from "~/shared/kernel/types/brand";
import type { UserId } from "~/shared/kernel/types/ids";
import { err } from "~/shared/kernel/types/result";
import type { Result } from "~/shared/kernel/types/result";
import { EmailVO } from "~/shared/kernel/values/email-vo";

export class SignUpUseCase {
  constructor(
    private readonly identities: IIdentityRepository,
    private readonly hasher: IPasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
    private readonly idGenerator: IIdGenerator,
    private readonly dateProvider: IDateProvider,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(
    input: SignUpInput,
  ): Promise<Result<IssuedSessionOutput, AppError>> {
    const email = EmailVO.create(input.email);

    if (email.isErr()) {
      return err(email.error);
    }

    const password = PlainPasswordVO.create(input.password);

    if (password.isErr()) {
      return err(password.error);
    }

    const name = input.name.trim();

    const nameCheck = validateName(name);

    if (!nameCheck.valid) {
      return err(AppError.validation(nameCheck.errors.join(", ")));
    }

    return this.uow.runInTransaction(async () => {
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

      return this.sessionIssuer.issue(identity, input, now);
    });
  }
}
