import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { IS_PUBLIC_KEY } from "../../../common/decorators/public.decorator";

// Mock the parent AuthGuard
jest.mock("@nestjs/passport", () => ({
  AuthGuard: jest.fn().mockImplementation(() => {
    return class {
      canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        if (!request.headers.authorization) {
          throw new UnauthorizedException();
        }
        if (request.headers.authorization.includes("malformed")) {
          throw new UnauthorizedException("Invalid token");
        }
        if (request.headers.authorization.includes("expired")) {
          throw new UnauthorizedException("Token expired");
        }
        return true;
      }
    };
  }),
}));

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    isPublic: boolean = false,
  ): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            authorization: "Bearer valid-token",
          },
          user: {
            id: "user-123",
            email: "test@example.com",
            role: "USER",
          },
        }),
      }),
    } as any;
  };

  describe("canActivate", () => {
    it("should allow access to public routes without authentication", async () => {
      // Arrange
      const context = createMockExecutionContext(true);
      reflector.getAllAndOverride.mockReturnValue(true);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it("should allow access with valid JWT on protected route", async () => {
      // Arrange
      const context = createMockExecutionContext(false);
      reflector.getAllAndOverride.mockReturnValue(false);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it("should deny access if JWT is missing on protected route", async () => {
      // Arrange
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
      } as any;
      reflector.getAllAndOverride.mockReturnValue(false);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should deny access if JWT is expired", async () => {
      // Arrange
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: "Bearer expired-token",
            },
          }),
        }),
      } as any;
      reflector.getAllAndOverride.mockReturnValue(false);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should deny access if JWT is malformed", async () => {
      // Arrange
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: "Bearer malformed.token",
            },
          }),
        }),
      } as any;
      reflector.getAllAndOverride.mockReturnValue(false);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should allow public routes even with invalid token", async () => {
      // Arrange
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: "Bearer invalid-token",
            },
          }),
        }),
      } as any;
      reflector.getAllAndOverride.mockReturnValue(true);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });
  });
});
