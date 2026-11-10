import { IsOptional, IsString, IsIn } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class GetFriendsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class GetPendingRequestsDto {
  @IsOptional()
  @IsIn(["incoming", "outgoing"])
  type?: "incoming" | "outgoing";
}

export interface FriendWithProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  mutualFriendsCount: number;
}

export interface FriendRequestWithUsers {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    profile: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
  receiver: {
    id: string;
    profile: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
}

export interface FriendshipStatusResponse {
  status: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS";
  requestId?: string;
}

export interface FriendCountsResponse {
  friends: number;
  pendingReceived: number;
  pendingSent: number;
}
