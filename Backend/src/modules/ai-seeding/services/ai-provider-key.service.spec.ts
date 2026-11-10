import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { AiProviderProtocol } from "@prisma/client";
import { AiProviderKeyService } from "./ai-provider-key.service";
import { AiProviderKeyRepository } from "../repositories/ai-provider-key.repository";
import { AiAgentRepository } from "../repositories/ai-agent.repository";

describe("AiProviderKeyService", () => {
  let service: AiProviderKeyService;
  let repository: jest.Mocked<AiProviderKeyRepository>;

  const baseRecord = {
    id: "key-1",
    name: "My provider",
    encryptedKey: "encrypted",
    iv: "iv:tag",
    baseUrl: "https://api.groq.com/openai/v1",
    modelId: "llama-3.1-8b-instant",
    protocol: AiProviderProtocol.OPENAI_CHAT_COMPLETION,
    isActive: true,
    usageToday: 0,
    usageTotal: 0,
    lastUsedAt: null,
    lastResetAt: new Date(),
    maxAgents: 10,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    process.env.AI_ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProviderKeyService,
        {
          provide: AiProviderKeyRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findActive: jest.fn(),
            findWithAgentCount: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            incrementUsage: jest.fn(),
            resetDailyUsage: jest.fn(),
            countAgents: jest.fn(),
            getAgentIds: jest.fn(),
          },
        },
        {
          provide: AiAgentRepository,
          useValue: {
            bulkUpdateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AiProviderKeyService);
    repository = module.get(AiProviderKeyRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("accepts any provider key format (no gsk_ requirement)", async () => {
      repository.create.mockResolvedValue(baseRecord);

      const result = await service.create({
        name: "My provider",
        apiKey: "sk-openai-style-key",
      });

      expect(result.id).toBe(baseRecord.id);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My provider",
          baseUrl: "https://api.groq.com/openai/v1",
          modelId: "llama-3.1-8b-instant",
          protocol: AiProviderProtocol.OPENAI_CHAT_COMPLETION,
        }),
      );
    });

    it("stores the provided base url, model and protocol", async () => {
      repository.create.mockImplementation(async (data: any) => ({
        ...baseRecord,
        ...data,
      }));

      const result = await service.create({
        name: "OpenAI",
        apiKey: "sk-123",
        baseUrl: "https://api.openai.com/v1/",
        modelId: "gpt-4o-mini",
        protocol: AiProviderProtocol.OPENAI_RESPONSE,
      });

      expect(result.baseUrl).toBe("https://api.openai.com/v1");
      expect(result.modelId).toBe("gpt-4o-mini");
      expect(result.protocol).toBe(AiProviderProtocol.OPENAI_RESPONSE);
    });

    it("rejects an invalid base url", async () => {
      await expect(
        service.create({
          name: "Broken",
          apiKey: "sk-123",
          baseUrl: "not a url",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("update", () => {
    it("rejects an invalid base url", async () => {
      repository.findById.mockResolvedValue(baseRecord);

      await expect(
        service.update("key-1", { baseUrl: "http://" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("accepts a new api key without a gsk_ prefix", async () => {
      repository.findById.mockResolvedValue(baseRecord);
      repository.update.mockResolvedValue(baseRecord);
      repository.countAgents.mockResolvedValue(0);

      await service.update("key-1", { apiKey: "sk-any-provider-key" });

      expect(repository.update).toHaveBeenCalledWith(
        "key-1",
        expect.objectContaining({
          encryptedKey: expect.any(String),
          iv: expect.stringContaining(":"),
        }),
      );
    });
  });

  describe("toSafeResponse", () => {
    it("never exposes the plain key", async () => {
      repository.findById.mockResolvedValue({
        ...baseRecord,
        encryptedKey: "",
        iv: "bad",
      });
      repository.countAgents.mockResolvedValue(0);

      const result = await service.findById("key-1");

      expect(result.maskedKey).toBe("****");
      expect(result).not.toHaveProperty("encryptedKey");
      expect(result).not.toHaveProperty("iv");
    });
  });
});
