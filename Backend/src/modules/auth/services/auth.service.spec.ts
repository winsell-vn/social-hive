import { Test, TestingModule } from "@nestjs/testing";
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { UserRepository } from "../repositories/user.repository";
import { UsersRepository } from "../../users/repositories/users.repository";
import { SessionService } from "./session.service";
import { TwoFactorService } from "./two-factor.service";
import { LoginAttemptService } from "./login-attempt.service";
import { PasswordBreachService } from "./password-breach.service";
import { MailService } from "../../mail/mail.service";
import { EmailSettingsService } from "../../mail/services/email-settings.service";
import { Role, Tier } from "@prisma/client";

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let sessionService: jest.Mocked<SessionService>;
  let loginAttemptService: jest.Mocked<LoginAttemptService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;
  let emailSettingsService: jest.Mocked<EmailSettingsService>;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    password: "$2b$12$hashedpassword",
    role: Role.USER,
    tier: Tier.NEWCOMER,
    karma: 0,
    isActive: true,
    isAiAgent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
    deletionRequestedAt: null,
    deletionScheduledFor: null,
  };

  const mockSession = {
    id: "session-123",
    userId: "user-123",
    refreshToken: "refresh-token-123",
    deviceInfo: "Mozilla/5.0",
    ipAddress: "127.0.0.1",
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    rememberMe: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findByIdWithProfile: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updatePassword: jest.fn(),
            activateUser: jest.fn(),
            createEmailVerification: jest.fn(),
            findEmailVerification: jest.fn(),
            markEmailVerified: jest.fn(),
            createPasswordReset: jest.fn(),
            findPasswordReset: jest.fn(),
            markPasswordResetUsed: jest.fn(),
            createProfile: jest.fn(),
            invalidatePasswordResets: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            getUserSettings: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn(),
            findByRefreshToken: jest.fn(),
            updateSession: jest.fn(),
            deleteByRefreshToken: jest.fn(),
            deleteAllByUserId: jest.fn(),
          },
        },
        {
          provide: TwoFactorService,
          useValue: {
            generateSecret: jest.fn(),
            verifyToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                "jwt.secret": "test-secret",
                "jwt.expiresIn": "15m",
                "jwt.refreshSecret": "test-refresh-secret",
                "jwt.refreshExpiresIn": "7d",
              };
              return config[key];
            }),
          },
        },
        {
          provide: LoginAttemptService,
          useValue: {
            isLocked: jest.fn().mockResolvedValue(false),
            recordFailedAttempt: jest.fn().mockResolvedValue(1),
            clearAttempts: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PasswordBreachService,
          useValue: {
            isBreached: jest.fn().mockResolvedValue(false),
            checkPassword: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: EmailSettingsService,
          useValue: {
            isVerificationRequired: jest.fn().mockResolvedValue(true),
            getConfig: jest.fn().mockResolvedValue({
              apiKey: "",
              from: "noreply@chungtoixayweb.vn",
              verificationRequired: true,
              source: "env",
              configured: false,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    sessionService = module.get(SessionService);
    loginAttemptService = module.get(LoginAttemptService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    mailService = module.get(MailService);
    emailSettingsService = module.get(EmailSettingsService);
    // Default: email verification is required. Individual tests override this.
    emailSettingsService.isVerificationRequired.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const registerDto = {
      email: "newuser@example.com",
      username: "newuser",
      password: "PLACEHOLDER_TEST_PASSWORD",
      turnstileToken: "test-turnstile-token",
    };

    it("should successfully register a new user", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.createProfile.mockResolvedValue({
        id: "profile-123",
        userId: mockUser.id,
        username: registerDto.username,
        displayName: null,
        avatar: null,
        coverPhoto: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        portfolio: null,
        isPrivate: false,
        lastUsernameChange: null,
        closeFriends: null,
        followerCount: 0,
        followingCount: 0,
        jobTitle: null,
        company: null,
        expertise: null,
        credentials: null,
        isVerifiedExpert: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.createEmailVerification.mockResolvedValue({
        id: "verification-123",
        email: registerDto.email,
        token: "verification-token",
        expiresAt: new Date(),
        verifiedAt: null,
        createdAt: new Date(),
      });
      mailService.sendVerificationEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        userId: mockUser.id,
        requiresEmailVerification: true,
        verificationEmailSent: true,
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.createProfile).toHaveBeenCalledWith({
        userId: mockUser.id,
        username: registerDto.username,
        displayName: null,
      });
      expect(userRepository.createEmailVerification).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it("should activate the account and skip the email when verification is disabled", async () => {
      // Arrange
      emailSettingsService.isVerificationRequired.mockResolvedValue(false);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.createProfile.mockResolvedValue({
        id: "profile-123",
        userId: mockUser.id,
        username: registerDto.username,
        displayName: null,
        avatar: null,
        coverPhoto: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        portfolio: null,
        isPrivate: false,
        lastUsernameChange: null,
        closeFriends: null,
        followerCount: 0,
        followingCount: 0,
        jobTitle: null,
        company: null,
        expertise: null,
        credentials: null,
        isVerifiedExpert: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        userId: mockUser.id,
        requiresEmailVerification: false,
        verificationEmailSent: false,
      });
      expect(userRepository.activateUser).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.createEmailVerification).not.toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("should not fail the registration when the mail provider errors", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.createProfile.mockResolvedValue({
        id: "profile-123",
        userId: mockUser.id,
        username: registerDto.username,
        displayName: null,
        avatar: null,
        coverPhoto: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        portfolio: null,
        isPrivate: false,
        lastUsernameChange: null,
        closeFriends: null,
        followerCount: 0,
        followingCount: 0,
        jobTitle: null,
        company: null,
        expertise: null,
        credentials: null,
        isVerifiedExpert: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.createEmailVerification.mockResolvedValue({
        id: "verification-123",
        email: registerDto.email,
        token: "verification-token",
        expiresAt: new Date(),
        verifiedAt: null,
        createdAt: new Date(),
      });
      mailService.sendVerificationEmail.mockRejectedValue(
        new Error("Resend API key is invalid"),
      );

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        userId: mockUser.id,
        requiresEmailVerification: true,
        verificationEmailSent: false,
      });
      expect(userRepository.createEmailVerification).toHaveBeenCalled();
    });

    it("should hash password with bcrypt cost factor 12", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      const bcryptHashSpy = jest.spyOn(bcrypt, "hash");
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.createProfile.mockResolvedValue({
        id: "profile-123",
        userId: mockUser.id,
        username: registerDto.username,
        displayName: null,
        avatar: null,
        coverPhoto: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        portfolio: null,
        isPrivate: false,
        lastUsernameChange: null,
        closeFriends: null,
        followerCount: 0,
        followingCount: 0,
        jobTitle: null,
        company: null,
        expertise: null,
        credentials: null,
        isVerifiedExpert: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.createEmailVerification.mockResolvedValue({
        id: "verification-123",
        email: registerDto.email,
        token: "verification-token",
        expiresAt: new Date(),
        verifiedAt: null,
        createdAt: new Date(),
      });
      mailService.sendVerificationEmail.mockResolvedValue(undefined);

      // Act
      await service.register(registerDto);

      // Assert
      expect(bcryptHashSpy).toHaveBeenCalledWith(registerDto.password, 12);
      bcryptHashSpy.mockRestore();
    });
  });

  describe("verifyEmail", () => {
    const validToken = "valid-token-123";

    it("should successfully verify email with valid token", async () => {
      // Arrange
      const verification = {
        id: "verification-123",
        email: "test@example.com",
        token: validToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        verifiedAt: null,
        createdAt: new Date(),
      };
      userRepository.findEmailVerification.mockResolvedValue(verification);
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.activateUser.mockResolvedValue({
        ...mockUser,
        isActive: true,
      });
      userRepository.markEmailVerified.mockResolvedValue(verification);

      // Act
      await service.verifyEmail(validToken);

      // Assert
      expect(userRepository.findEmailVerification).toHaveBeenCalledWith(
        validToken,
      );
      expect(userRepository.activateUser).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.markEmailVerified).toHaveBeenCalledWith(validToken);
    });

    it("should throw BadRequestException if token is invalid", async () => {
      // Arrange
      userRepository.findEmailVerification.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyEmail("invalid-token")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if token is expired", async () => {
      // Arrange
      const expiredVerification = {
        id: "verification-123",
        email: "test@example.com",
        token: validToken,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
        verifiedAt: null,
        createdAt: new Date(),
      };
      userRepository.findEmailVerification.mockResolvedValue(
        expiredVerification,
      );

      // Act & Assert
      await expect(service.verifyEmail(validToken)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if token already used", async () => {
      // Arrange
      const usedVerification = {
        id: "verification-123",
        email: "test@example.com",
        token: validToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        verifiedAt: new Date(), // Already verified
        createdAt: new Date(),
      };
      userRepository.findEmailVerification.mockResolvedValue(usedVerification);

      // Act & Assert
      await expect(service.verifyEmail(validToken)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("login", () => {
    const loginDto = {
      email: "test@example.com",
      password: "PLACEHOLDER_TEST_PASSWORD",
      turnstileToken: "test-turnstile-token",
    };

    it("should successfully login with valid credentials", async () => {
      // Arrange
      const mockUserWithProfile = {
        ...mockUser,
        profile: {
          id: "profile-1",
          userId: mockUser.id,
          username: "testuser",
          displayName: "Test User",
          avatar: null,
          coverPhoto: null,
          bio: null,
          location: null,
          website: null,
          isPrivate: false,
          socialLinks: null,
          portfolio: null,
          lastUsernameChange: new Date(),
          closeFriends: null,
          followerCount: 0,
          followingCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile as any,
      );
      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation(() => Promise.resolve(true));
      jwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");
      sessionService.createSession.mockResolvedValue(mockSession);
      userRepository.update.mockResolvedValue(mockUser);

      // Act
      const result = await service.login(loginDto, "Mozilla/5.0", "127.0.0.1");

      // Assert
      expect(result).toHaveProperty("accessToken", "access-token");
      expect(result).toHaveProperty("refreshToken", "refresh-token");
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tier: mockUser.tier,
        karma: mockUser.karma,
        profile: {
          username: "testuser",
          displayName: "Test User",
        },
      });
      expect(sessionService.createSession).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if user not found", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.login(loginDto, "Mozilla/5.0", "127.0.0.1"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation(() => Promise.resolve(false));

      // Act & Assert
      await expect(
        service.login(loginDto, "Mozilla/5.0", "127.0.0.1"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if user is not active", async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findByEmail.mockResolvedValue(inactiveUser);
      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation(() => Promise.resolve(true));

      // Act & Assert
      await expect(
        service.login(loginDto, "Mozilla/5.0", "127.0.0.1"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should create session with device info and IP address", async () => {
      // Arrange
      const deviceInfo = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
      const ipAddress = "192.168.1.100";
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.findByIdWithProfile.mockResolvedValue({
        ...mockUser,
        profile: { username: "testuser" },
      } as any);
      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation(() => Promise.resolve(true));
      jwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");
      sessionService.createSession.mockResolvedValue(mockSession);
      userRepository.update.mockResolvedValue(mockUser);

      // Act
      await service.login(loginDto, deviceInfo, ipAddress);

      // Assert
      expect(sessionService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          deviceInfo,
          ipAddress,
        }),
      );
    });
  });

  describe("refreshTokens", () => {
    const refreshToken = "valid-refresh-token";

    it("should successfully refresh tokens with valid refresh token", async () => {
      // Arrange
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
      });
      sessionService.findByRefreshToken.mockResolvedValue(mockSession);
      userRepository.findById.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce("new-access-token")
        .mockReturnValueOnce("new-refresh-token");
      sessionService.updateSession.mockResolvedValue(mockSession);

      // Act
      const result = await service.refreshTokens(refreshToken);

      // Assert
      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      expect(sessionService.findByRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(sessionService.updateSession).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if refresh token not found", async () => {
      // Arrange
      sessionService.findByRefreshToken.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshTokens("invalid-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if session is expired", async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
      };
      sessionService.findByRefreshToken.mockResolvedValue(expiredSession);

      // Act & Assert
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should rotate refresh token on successful refresh", async () => {
      // Arrange
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
      });
      sessionService.findByRefreshToken.mockResolvedValue(mockSession);
      userRepository.findById.mockResolvedValue(mockUser);
      const newRefreshToken = "new-refresh-token";
      jwtService.sign
        .mockReturnValueOnce("new-access-token")
        .mockReturnValueOnce(newRefreshToken);
      sessionService.updateSession.mockResolvedValue(mockSession);

      // Act
      const result = await service.refreshTokens(refreshToken);

      // Assert
      expect(result.refreshToken).toBe(newRefreshToken);
      expect(sessionService.updateSession).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({
          refreshToken: newRefreshToken,
        }),
      );
    });
  });

  describe("logout", () => {
    it("should successfully logout and invalidate session", async () => {
      // Arrange
      const refreshToken = "refresh-token-123";
      sessionService.deleteByRefreshToken.mockResolvedValue(undefined);

      // Act
      await service.logout(refreshToken);

      // Assert
      expect(sessionService.deleteByRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
    });
  });

  describe("logoutAll", () => {
    it("should invalidate all user sessions", async () => {
      // Arrange
      const userId = "user-123";
      sessionService.deleteAllByUserId.mockResolvedValue(undefined);

      // Act
      await service.logoutAll(userId);

      // Assert
      expect(sessionService.deleteAllByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe("forgotPassword", () => {
    const email = "test@example.com";

    it("should send password reset email if user exists", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.createPasswordReset.mockResolvedValue({
        id: "reset-123",
        email,
        token: "reset-token",
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      });
      mailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      // Act
      await service.forgotPassword(email);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(userRepository.createPasswordReset).toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        email,
        expect.any(String),
      );
    });

    it("should not reveal if user does not exist (security)", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      await service.forgotPassword("nonexistent@example.com");

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(userRepository.createPasswordReset).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    const token = "valid-reset-token";
    const newPassword = "PLACEHOLDER_TEST_PASSWORD";

    it("should successfully reset password with valid token", async () => {
      // Arrange
      const passwordReset = {
        id: "reset-123",
        email: "test@example.com",
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      };
      userRepository.findPasswordReset.mockResolvedValue(passwordReset);
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.updatePassword.mockResolvedValue(mockUser);
      userRepository.markPasswordResetUsed.mockResolvedValue(passwordReset);
      sessionService.deleteAllByUserId.mockResolvedValue(undefined);

      // Act
      await service.resetPassword(token, newPassword);

      // Assert
      expect(userRepository.findPasswordReset).toHaveBeenCalledWith(token);
      expect(userRepository.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
      );
      expect(userRepository.markPasswordResetUsed).toHaveBeenCalledWith(token);
      expect(sessionService.deleteAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it("should throw BadRequestException if token is invalid", async () => {
      // Arrange
      userRepository.findPasswordReset.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.resetPassword("invalid-token", newPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if token is expired", async () => {
      // Arrange
      const expiredReset = {
        id: "reset-123",
        email: "test@example.com",
        token,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
        usedAt: null,
        createdAt: new Date(),
      };
      userRepository.findPasswordReset.mockResolvedValue(expiredReset);

      // Act & Assert
      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if token already used", async () => {
      // Arrange
      const usedReset = {
        id: "reset-123",
        email: "test@example.com",
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: new Date(), // Already used
        createdAt: new Date(),
      };
      userRepository.findPasswordReset.mockResolvedValue(usedReset);

      // Act & Assert
      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should invalidate all sessions after password reset", async () => {
      // Arrange
      const passwordReset = {
        id: "reset-123",
        email: "test@example.com",
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      };
      userRepository.findPasswordReset.mockResolvedValue(passwordReset);
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.updatePassword.mockResolvedValue(mockUser);
      userRepository.markPasswordResetUsed.mockResolvedValue(passwordReset);
      sessionService.deleteAllByUserId.mockResolvedValue(undefined);

      // Act
      await service.resetPassword(token, newPassword);

      // Assert
      expect(sessionService.deleteAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it("should hash new password with bcrypt cost factor 12", async () => {
      // Arrange
      const passwordReset = {
        id: "reset-123",
        email: "test@example.com",
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      };
      userRepository.findPasswordReset.mockResolvedValue(passwordReset);
      userRepository.findByEmail.mockResolvedValue(mockUser);
      const bcryptHashSpy = jest.spyOn(bcrypt, "hash");
      userRepository.updatePassword.mockResolvedValue(mockUser);
      userRepository.markPasswordResetUsed.mockResolvedValue(passwordReset);
      sessionService.deleteAllByUserId.mockResolvedValue(undefined);

      // Act
      await service.resetPassword(token, newPassword);

      // Assert
      expect(bcryptHashSpy).toHaveBeenCalledWith(newPassword, 12);
      bcryptHashSpy.mockRestore();
    });
  });
});
