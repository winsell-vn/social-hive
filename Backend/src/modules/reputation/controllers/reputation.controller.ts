import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ReputationService } from "../services/reputation.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { GetKarmaHistoryDto } from "../dto/reputation.dto";

@Controller("reputation")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReputationController {
  constructor(private reputationService: ReputationService) {}

  /**
   * GET /reputation/me
   * Get current user's karma and tier info
   */
  @Get("me")
  async getMyReputation(@CurrentUser() user: CurrentUserData) {
    return this.reputationService.getUserReputation(user.id);
  }

  /**
   * GET /reputation/history
   * Get karma transaction history (paginated)
   */
  @Get("history")
  async getKarmaHistory(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetKarmaHistoryDto,
  ) {
    return this.reputationService.getKarmaHistory(
      user.id,
      query.page || 1,
      query.limit || 20,
      query.action,
    );
  }

  /**
   * GET /reputation/tiers
   * Get tier definitions (public endpoint)
   */
  @Get("tiers")
  @Public()
  getTierDefinitions() {
    return this.reputationService.getTierDefinitions();
  }
}
