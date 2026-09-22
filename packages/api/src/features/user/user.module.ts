import { Module } from "@nestjs/common";

import { IUserRepository } from "./application/ports/i-user-repository";
import { GetUserUseCase } from "./application/usecases/get-user";
import { DrizzleUserRepository } from "./infrastructure/repositories/drizzle-user-repository";
import { UserController } from "./presentation/http/user.controller";

@Module({
  controllers: [UserController],
  exports: [IUserRepository],
  providers: [
    { provide: IUserRepository, useClass: DrizzleUserRepository },
    {
      provide: GetUserUseCase,
      useFactory: (repo: IUserRepository) => new GetUserUseCase(repo),
      inject: [IUserRepository],
    },
  ],
})
export class UserModule {}
