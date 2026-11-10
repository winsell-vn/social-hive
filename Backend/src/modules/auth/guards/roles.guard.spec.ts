import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../../../common/decorators/roles.decorator";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (userRole?: Role): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: userRole
            ? {
                id: "user-123",
                email: "test@example.com",
                role: userRole,
              }
            : undefined,
        }),
      }),
    } as any;
  };

  describe("canActivate", () => {
    it("should allow access if no roles are required", () => {
      // Arrange
      const context = createMockExecutionContext(Role.USER);
      reflector.getAllAndOverride.mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it("should allow access if user has required role (USER)", () => {
      // Arrange
      const context = createMockExecutionContext(Role.USER);
      reflector.getAllAndOverride.mockReturnValue([Role.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it("should allow access if user has required role (ADMIN)", () => {
      // Arrange
      const context = createMockExecutionContext(Role.ADMIN);
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it("should allow access if user has required role (SUPER_ADMIN)", () => {
      // Arrange
      const context = createMockExecutionContext(Role.SUPER_ADMIN);
      reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it("should deny access if user does not have required role", () => {
      // Arrange
      const context = createMockExecutionContext(Role.USER);
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it("should deny access if user is not authenticated", () => {
      // Arrange
      const context = createMockExecutionContext(undefined);
      reflector.getAllAndOverride.mockReturnValue([Role.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it("should allow access if user has one of multiple required roles", () => {
      // Arrange
      const context = createMockExecutionContext(Role.ADMIN);
      reflector.getAllAndOverride.mockReturnValue([
        Role.ADMIN,
        Role.SUPER_ADMIN,
      ]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it("should deny access if user role does not match any required roles", () => {
      // Arrange
      const context = createMockExecutionContext(Role.USER);
      reflector.getAllAndOverride.mockReturnValue([
        Role.ADMIN,
        Role.SUPER_ADMIN,
      ]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it("should handle GUEST role correctly", () => {
      // Arrange
      const context = createMockExecutionContext(Role.GUEST);
      reflector.getAllAndOverride.mockReturnValue([Role.GUEST]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it("should deny GUEST access to USER-only routes", () => {
      // Arrange
      const context = createMockExecutionContext(Role.GUEST);
      reflector.getAllAndOverride.mockReturnValue([Role.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });
  });
});
