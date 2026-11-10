"use client";

import * as React from "react";
import { useState } from "react";
import { MapPin, Link as LinkIcon, Calendar, Building2, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatNumber, getInitials } from "@/lib/utils";
import { generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl } from "@/lib/image-url";
import { TierBadge } from "@/features/reputation";
import { FriendButton } from "@/features/friends";
import { ProfileEditModal } from "./ProfileEditModal";
import { useUpdateProfile, useUploadAvatar, useUploadCover } from "../api/profiles";
import type { UserProfile, UpdateProfileInput } from "@/types/profile";
import type { Tier } from "@/types/reputation";

// Helper to ensure URL has protocol
function normalizeWebsiteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

interface ProfileSidebarProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

export function ProfileSidebar({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  onUnfollow,
}: ProfileSidebarProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const uploadCoverMutation = useUploadCover();

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (data: UpdateProfileInput & { avatarFile?: File; coverFile?: File }) => {
    try {
      const { avatarFile, coverFile, ...profileData } = data;
      // Upload avatar and cover in parallel
      const uploadPromises: Promise<unknown>[] = [];
      if (avatarFile) uploadPromises.push(uploadAvatarMutation.mutateAsync(avatarFile));
      if (coverFile) uploadPromises.push(uploadCoverMutation.mutateAsync(coverFile));
      await Promise.all(uploadPromises);
      await updateProfileMutation.mutateAsync(profileData);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  };

  const isLoading = updateProfileMutation.isPending || uploadAvatarMutation.isPending || uploadCoverMutation.isPending;

  // Check if bio is long enough to need truncation
  const bioNeedsTruncation = profile.bio && profile.bio.length > 150;

  return (
    <>
      <div className="space-y-4">
        {/* Avatar */}
        <Avatar className="w-36 h-36 mx-auto lg:mx-0 ring-2 ring-border">
          <AvatarImage
            src={getAvatarUrl(profile.avatar)}
            alt={generateAvatarAlt(profile.displayName || "Người dùng")}
            loading="eager"
            fetchPriority="high"
          />
          <AvatarFallback className="text-3xl">
            {getInitials(profile.displayName || profile.username || '')}
          </AvatarFallback>
        </Avatar>

        {/* Name & Username */}
        <div className="text-center lg:text-left">
          <h1 className="text-xl font-semibold text-foreground">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="text-center lg:text-left">
            <p className={`text-sm text-foreground ${!isBioExpanded && bioNeedsTruncation ? 'line-clamp-4' : ''}`}>
              {profile.bio}
            </p>
            {bioNeedsTruncation && (
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
              >
                {isBioExpanded ? (
                  <>Thu gọn <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Xem thêm <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center lg:justify-start gap-2">
          {isOwnProfile ? (
            <Button variant="outline" onClick={handleEditClick} className="w-full lg:w-auto">
              Chỉnh sửa hồ sơ
            </Button>
          ) : (
            <>
              <FriendButton userId={profile.user.id} />
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={() => { if (isFollowing) onUnfollow?.(); else onFollow?.(); }}
                disabled={isFollowing ? !onUnfollow : !onFollow}
              >
                {isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </Button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-x-4 gap-y-1 text-sm">
          <div className="cursor-default">
            <span className="font-semibold">{formatNumber(profile.postCount ?? 0)}</span>
            <span className="text-muted-foreground ml-1">bài viết</span>
          </div>
          <div className="cursor-default">
            <span className="font-semibold">{formatNumber(profile.followerCount ?? 0)}</span>
            <span className="text-muted-foreground ml-1">theo dõi</span>
          </div>
          <div className="cursor-default">
            <span className="font-semibold">{formatNumber(profile.followingCount ?? 0)}</span>
            <span className="text-muted-foreground ml-1">đang theo dõi</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Professional Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {profile.jobTitle && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{profile.jobTitle}</span>
            </div>
          )}
          {profile.company && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{profile.company}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 flex-shrink-0" />
              <a
                href={normalizeWebsiteUrl(profile.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Tham gia {new Date(profile.user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Skills/Expertise */}
        {profile.expertise && profile.expertise.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chuyên môn</h3>
              <div className="flex flex-wrap gap-2">
                {profile.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground border border-border"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tier Badge */}
        {profile.tier && (
          <>
            <div className="border-t border-border" />
            <div>
              <TierBadge tier={profile.tier as Tier} size="md" />
            </div>
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onSave={handleSaveProfile}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

