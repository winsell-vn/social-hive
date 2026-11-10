import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../../../common/decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public endpoints, still try to validate token if present
      // but don't fail if no token or invalid token
      try {
        await super.canActivate(context);
      } catch {
        // Ignore auth errors for public endpoints
        // request.user will be undefined if no valid token
      }
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
