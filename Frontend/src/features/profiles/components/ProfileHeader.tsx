"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatNumber, getInitials } from "@/lib/utils";
import { generateAvatarAlt, generateCoverAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl, getCoverUrl } from "@/lib/image-url";
import { TierBadge } from "@/features/reputation";
import { FriendButton } from "@/features/friends";
import { ProfileEditModal } from "./ProfileEditModal";
import { useUpdateProfile, useUploadAvatar, useUploadCover } from "../api/profiles";
import type { UserProfile, UpdateProfileInput } from "@/types/profile";
import type { Tier } from "@/types/reputation";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onEditProfile?: () => void;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  onUnfollow,
  onEditProfile,
}: ProfileHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const uploadCoverMutation = useUploadCover();

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (data: UpdateProfileInput & { avatarFile?: File; coverFile?: File }) => {
    try {
      // Extract file fields before sending profile update
      const { avatarFile, coverFile, ...profileData } = data;

      // Upload avatar if provided
      if (avatarFile) {
        await uploadAvatarMutation.mutateAsync(avatarFile);
      }

      // Upload cover if provided
      if (coverFile) {
        await uploadCoverMutation.mutateAsync(coverFile);
      }

      // Update profile data (without file fields)
      await updateProfileMutation.mutateAsync(profileData);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  };

  const isLoading = updateProfileMutation.isPending || uploadAvatarMutation.isPending || uploadCoverMutation.isPending;

  return (
    <>
      <Card className="mb-4 overflow-hidden">
        {/* Cover Image - LCP candidate on profile pages */}
        <div className="relative h-48 bg-gradient-to-r from-primary/20 to-accent/20">
          {getCoverUrl(profile.coverPhoto) && (
            <Image
              src={getCoverUrl(profile.coverPhoto)!}
              alt={generateCoverAlt(profile.displayName || "Người dùng")}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        <CardContent className="relative pt-0 pb-4">
          {/* Avatar - LCP candidate on profile pages */}
          <div className="absolute -top-16 left-4">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage
                src={getAvatarUrl(profile.avatar)}
                alt={generateAvatarAlt(profile.displayName || "Người dùng")}
                loading="eager"
                fetchPriority="high"
              />
              <AvatarFallback className="text-3xl">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            {isOwnProfile ? (
              <Button variant="outline" onClick={handleEditClick}>
                Chỉnh sửa hồ sơ
              </Button>
            ) : (
              <div className="flex gap-2">
                <FriendButton userId={profile.user.id} />
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={isFollowing ? onUnfollow : onFollow}
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Button>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="mt-8">
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>

            {profile.bio && <p className="mt-2 text-foreground">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  {profile.website}
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <button className="hover:underline cursor-pointer">
                <span className="font-bold">
                  {formatNumber(profile.postCount ?? 0)}
                </span>
                <span className="text-muted-foreground ml-1">bài viết</span>
              </button>
              <button className="hover:underline cursor-pointer">
                <span className="font-bold">
                  {formatNumber(profile.followerCount)}
                </span>
                <span className="text-muted-foreground ml-1">người theo dõi</span>
              </button>
              <button className="hover:underline cursor-pointer">
                <span className="font-bold">
                  {formatNumber(profile.followingCount)}
                </span>
                <span className="text-muted-foreground ml-1">đang theo dõi</span>
              </button>
            </div>

            {/* Tier Badge */}
            <div className="mt-3">
              <TierBadge tier={profile.tier as Tier} size="md" />
            </div>
          </div>
        </CardContent>
      </Card>

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
