import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { SessionService } from "./services/session.service";
import { TwoFactorService } from "./services/two-factor.service";
import { TurnstileService } from "./services/turnstile.service";
import { LoginAttemptService } from "./services/login-attempt.service";
import { PasswordBreachService } from "./services/password-breach.service";
import { UserRepository } from "./repositories/user.repository";
import { UsersRepository } from "../users/repositories/users.repository";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { MailModule } from "../mail/mail.module";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("jwt.secret"),
        signOptions: { expiresIn: configService.get("jwt.expiresIn") },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    TwoFactorService,
    TurnstileService,
    LoginAttemptService,
    PasswordBreachService,
    UserRepository,
    UsersRepository,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, TwoFactorService],
})
export class AuthModule {}
