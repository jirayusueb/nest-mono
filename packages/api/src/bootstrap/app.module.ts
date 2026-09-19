import { Module } from "@nestjs/common";
import { AuthModule } from "../features/auth/auth.module";
import { BlogModule } from "../features/blog/blog.module";
import { UserModule } from "../features/user/user.module";
import { MediaModule } from "../features/media/media.module";
import { DatabaseModule } from "../shared/infrastructure/database.module";
import { SessionModule } from "./session.module";

@Module({
  imports: [
    DatabaseModule,
    SessionModule,
    AuthModule,
    UserModule,
    BlogModule,
    MediaModule,
  ],
})
export class AppModule {}
