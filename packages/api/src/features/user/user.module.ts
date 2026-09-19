import { Module } from "@nestjs/common";
import { USER_REPOSITORY } from "../../shared/tokens";
import { DrizzleUserRepository } from "./infrastructure/repositories/drizzle-user-repository";
import { GetUser } from "./application/usecases/get-user";
import type { IUserRepository } from "./application/ports/i-user-repository";
import { UserController } from "./presentation/http/user.controller";

@Module({
  controllers: [UserController],
  providers: [
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    {
      provide: GetUser,
      useFactory: (repo: IUserRepository) => new GetUser(repo),
      inject: [USER_REPOSITORY],
    },
  ],
})
export class UserModule {}
