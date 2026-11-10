import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { UserRepository } from "../repositories/user.repository";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tier: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {
    super({
      // Extract token from cookies first, then fall back to Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request & { cookies?: Record<string, string> }) =>
          request?.cookies?.accessToken,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get("jwt.secret"),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findByIdWithProfile(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Unauthorized");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tier: user.tier,
      karma: user.karma,
      profile: user.profile
        ? {
            username: user.profile.username,
            displayName: user.profile.displayName,
            avatar: user.profile.avatar,
            bio: user.profile.bio,
          }
        : null,
    };
  }
}
