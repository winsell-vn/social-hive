import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface CurrentUserData {
  id: string;
  email: string;
  role: string;
  tier: string;
  karma?: number;
  profile?: {
    username: string;
    displayName: string | null;
    avatar: string | null;
    bio: string | null;
  } | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    return data ? user?.[data] : user;
  },
);
