import { IsArray, IsUUID, IsEnum } from "class-validator";
import { AiAgentStatus } from "@prisma/client";

export class BulkStatusDto {
  @IsArray()
  @IsUUID("4", { each: true })
  agentIds: string[];

  @IsEnum(AiAgentStatus)
  status: AiAgentStatus;
}
