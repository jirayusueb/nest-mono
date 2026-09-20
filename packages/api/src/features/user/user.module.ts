import { Module } from "@nestjs/common";
import { DrizzleUserRepository } from "./infrastructure/repositories/drizzle-user-repository";
import { GetUserUseCase } from "./application/usecases/get-user";
import { USER_REPOSITORY, type IUserRepository } from "./application/ports/i-user-repository";
import { UserController } from "./presentation/http/user.controller";

@Module({
  controllers: [UserController],
  exports: [USER_REPOSITORY],
  providers: [
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    {
      provide: GetUserUseCase,
      useFactory: (repo: IUserRepository) => new GetUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
  ],
})
export class UserModule {}
