import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { AiProviderKeyRepository } from "../repositories/ai-provider-key.repository";
import { AiAgentRepository } from "../repositories/ai-agent.repository";
import {
  encrypt,
  decrypt,
  EncryptedData,
} from "../../../common/utils/encryption.util";
import {
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL_ID,
  buildProviderRequestBody,
  buildProviderUrl,
  isValidBaseUrl,
  normalizeBaseUrl,
  providerEndpointPath,
  resolveProtocol,
} from "../../../common/utils/ai-provider.util";
import { CreateAiProviderKeyDto } from "../dto/create-ai-provider-key.dto";
import { UpdateAiProviderKeyDto } from "../dto/update-ai-provider-key.dto";
import { AiProviderKey, AiAgentStatus, AiProviderProtocol } from "@prisma/client";

export interface AiProviderKeyWithStats extends Omit<
  AiProviderKey,
  "encryptedKey" | "iv" | "deletedAt"
> {
  agentCount: number;
  maskedKey: string;
}

/**
 * Everything the provider client needs to talk to one provider.
 */
export interface AiProviderConfig {
  id: string;
  apiKey: string;
  baseUrl: string;
  modelId: string;
  protocol: AiProviderProtocol;
}

@Injectable()
export class AiProviderKeyService {
  private readonly logger = new Logger(AiProviderKeyService.name);

  constructor(
    private readonly providerKeyRepository: AiProviderKeyRepository,
    private readonly aiAgentRepository: AiAgentRepository,
  ) {}

  /**
   * Create a new AI provider API key (encrypted)
   */
  async create(dto: CreateAiProviderKeyDto): Promise<AiProviderKeyWithStats> {
    if (dto.baseUrl !== undefined && !isValidBaseUrl(dto.baseUrl)) {
      throw new BadRequestException(
        `Base URL không hợp lệ: "${dto.baseUrl}". Ví dụ hợp lệ: https://api.groq.com/openai/v1`,
      );
    }

    const baseUrl = normalizeBaseUrl(dto.baseUrl);

    // Encrypt the API key
    const encrypted = encrypt(dto.apiKey);

    const apiKey = await this.providerKeyRepository.create({
      name: dto.name,
      encryptedKey: encrypted.encryptedKey,
      iv: `${encrypted.iv}:${encrypted.authTag}`, // Store IV and authTag together
      baseUrl,
      modelId: dto.modelId || DEFAULT_AI_MODEL_ID,
      protocol: resolveProtocol(dto.protocol),
      maxAgents: dto.maxAgents || 10,
    });

    this.logger.log(
      `Created new AI provider key: ${apiKey.id} (${apiKey.name}) -> ${apiKey.baseUrl}`,
    );

    return this.toSafeResponse(apiKey, 0);
  }

  /**
   * Get all API keys (without decrypted keys)
   */
  async findAll(): Promise<AiProviderKeyWithStats[]> {
    const keys = await this.providerKeyRepository.findWithAgentCount();

    return keys.map((key) => this.toSafeResponse(key, key._count.agents));
  }

  /**
   * Get a single API key by ID
   */
  async findById(id: string): Promise<AiProviderKeyWithStats> {
    const key = await this.providerKeyRepository.findById(id);

    if (!key) {
      throw new NotFoundException(`API key not found: ${id}`);
    }

    const agentCount = await this.providerKeyRepository.countAgents(id);
    return this.toSafeResponse(key, agentCount);
  }

  /**
   * Get decrypted API key (internal use only)
   */
  async getDecryptedKey(id: string): Promise<string> {
    const key = await this.providerKeyRepository.findById(id);

    if (!key) {
      throw new NotFoundException(`API key not found: ${id}`);
    }

    if (!key.isActive) {
      throw new BadRequestException(`API key is not active: ${id}`);
    }

    return this.decryptKey(key);
  }

  /**
   * Get the full provider configuration (decrypted key + endpoint details).
   * This is what the provider client consumes.
   */
  async getProviderConfig(id: string): Promise<AiProviderConfig> {
    const key = await this.providerKeyRepository.findById(id);

    if (!key) {
      throw new NotFoundException(`API key not found: ${id}`);
    }

    if (!key.isActive) {
      throw new BadRequestException(`API key is not active: ${id}`);
    }

    return {
      id: key.id,
      apiKey: this.decryptKey(key),
      baseUrl: key.baseUrl || DEFAULT_AI_BASE_URL,
      modelId: key.modelId || DEFAULT_AI_MODEL_ID,
      protocol: resolveProtocol(key.protocol),
    };
  }

  /**
   * Update an API key
   */
  async update(
    id: string,
    dto: UpdateAiProviderKeyDto,
  ): Promise<AiProviderKeyWithStats> {
    const existing = await this.providerKeyRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`API key not found: ${id}`);
    }

    const updateData: any = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    if (dto.maxAgents !== undefined) {
      updateData.maxAgents = dto.maxAgents;
    }

    if (dto.baseUrl !== undefined) {
      if (!isValidBaseUrl(dto.baseUrl)) {
        throw new BadRequestException(
          `Base URL không hợp lệ: "${dto.baseUrl}". Ví dụ hợp lệ: https://api.groq.com/openai/v1`,
        );
      }
      updateData.baseUrl = normalizeBaseUrl(dto.baseUrl);
    }

    if (dto.modelId !== undefined) {
      updateData.modelId = dto.modelId;
    }

    if (dto.protocol !== undefined) {
      updateData.protocol = resolveProtocol(dto.protocol);
    }

    // If new API key provided, encrypt it
    if (dto.apiKey) {
      const encrypted = encrypt(dto.apiKey);
      updateData.encryptedKey = encrypted.encryptedKey;
      updateData.iv = `${encrypted.iv}:${encrypted.authTag}`;
    }

    const updated = await this.providerKeyRepository.update(id, updateData);
    const agentCount = await this.providerKeyRepository.countAgents(id);

    this.logger.log(`Updated AI provider key: ${id}`);

    return this.toSafeResponse(updated, agentCount);
  }

  /**
   * Soft delete an API key and disable all agents using it (AC-003)
   * This sets deletedAt timestamp instead of removing the record
   */
  async delete(id: string): Promise<void> {
    const existing = await this.providerKeyRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`API key not found: ${id}`);
    }

    // Get all agents using this API key
    const agentIds = await this.providerKeyRepository.getAgentIds(id);

    // Disable all agents using this key (revoke access)
    if (agentIds.length > 0) {
      await this.aiAgentRepository.bulkUpdateStatus(
        agentIds,
        AiAgentStatus.DISABLED,
      );
      this.logger.log(
        `Disabled ${agentIds.length} agents using API key: ${id}`,
      );
    }

    // Soft delete the API key
    await this.providerKeyRepository.softDelete(id);
    this.logger.log(`Soft deleted AI provider key: ${id}`);
  }

  /**
   * Get an active API key for use
   */
  async getActiveKey(): Promise<{ id: string; key: string } | null> {
    const activeKeys = await this.providerKeyRepository.findActive();

    if (activeKeys.length === 0) {
      return null;
    }

    // Get the key with lowest usage today (load balancing)
    const sortedKeys = activeKeys.sort((a, b) => a.usageToday - b.usageToday);
    const selectedKey = sortedKeys[0];

    const decryptedKey = await this.getDecryptedKey(selectedKey.id);

    return {
      id: selectedKey.id,
      key: decryptedKey,
    };
  }

  /**
   * Record API usage
   */
  async recordUsage(id: string, tokens: number = 1): Promise<void> {
    await this.providerKeyRepository.incrementUsage(id, tokens);
  }

  /**
   * Reset daily usage for all keys (called by scheduler)
   */
  async resetDailyUsage(): Promise<void> {
    await this.providerKeyRepository.resetDailyUsage();
    this.logger.log("Reset daily usage for all API keys");
  }

  /**
   * Check if an API key can accept more agents
   */
  async canAddAgent(id: string): Promise<boolean> {
    const key = await this.providerKeyRepository.findById(id);

    if (!key || !key.isActive) {
      return false;
    }

    const agentCount = await this.providerKeyRepository.countAgents(id);
    return agentCount < key.maxAgents;
  }

  /**
   * Test if an API key is valid by making a simple API call against the
   * provider configured for this key.
   */
  async testKey(id: string): Promise<boolean> {
    try {
      const config = await this.getProviderConfig(id);

      // Most OpenAI-compatible providers expose /models for key validation.
      const modelsResponse = await fetch(buildProviderUrl(config.baseUrl, "/models"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (modelsResponse.ok) {
        this.logger.log(`API key ${id} test successful`);
        return true;
      }

      // Some self-hosted providers do not implement /models - fall back to a
      // minimal completion to validate the key, model and protocol.
      if (modelsResponse.status === 404 || modelsResponse.status === 405) {
        return await this.testKeyWithCompletion(id, config);
      }

      this.logger.warn(`API key ${id} test failed: ${modelsResponse.status}`);
      return false;
    } catch (error) {
      this.logger.error(
        `API key ${id} test error: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }

  /**
   * Validate a key with a minimal completion request (fallback when the
   * provider has no /models endpoint).
   */
  private async testKeyWithCompletion(
    id: string,
    config: AiProviderConfig,
  ): Promise<boolean> {
    try {
      const isResponses =
        config.protocol === AiProviderProtocol.OPENAI_RESPONSE;

      const body = buildProviderRequestBody(config.protocol, {
        model: config.modelId,
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 1,
        temperature: 0,
      });

      const response = await fetch(
        buildProviderUrl(config.baseUrl, providerEndpointPath(config.protocol)),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        this.logger.log(
          `API key ${id} test successful via ${isResponses ? "responses" : "chat/completions"}`,
        );
        return true;
      }

      this.logger.warn(
        `API key ${id} test failed: ${response.status} ${await response.text().catch(() => "")}`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        `API key ${id} test error: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }

  /**
   * Decrypt the stored key of a provider record.
   */
  private decryptKey(key: AiProviderKey): string {
    // Parse IV and authTag
    const [iv, authTag] = key.iv.split(":");

    const encrypted: EncryptedData = {
      encryptedKey: key.encryptedKey,
      iv,
      authTag,
    };

    return decrypt(encrypted);
  }

  /**
   * Convert to safe response (without sensitive data)
   */
  private toSafeResponse(
    key: AiProviderKey,
    agentCount: number,
  ): AiProviderKeyWithStats {
    // Mask the key for display (show first 8 and last 4 chars)
    let maskedKey = "****";

    try {
      const decrypted = this.decryptKey(key);
      maskedKey =
        decrypted.length > 12
          ? `${decrypted.substring(0, 8)}...${decrypted.substring(decrypted.length - 4)}`
          : "****";
    } catch {
      // If decryption fails, use default mask
    }

    return {
      id: key.id,
      name: key.name,
      baseUrl: key.baseUrl || DEFAULT_AI_BASE_URL,
      modelId: key.modelId || DEFAULT_AI_MODEL_ID,
      protocol: resolveProtocol(key.protocol),
      isActive: key.isActive,
      usageToday: key.usageToday,
      usageTotal: key.usageTotal,
      lastUsedAt: key.lastUsedAt,
      lastResetAt: key.lastResetAt,
      maxAgents: key.maxAgents,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      agentCount,
      maskedKey,
    };
  }
}
