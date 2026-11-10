'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent as ReactKeyboardEvent, type FocusEvent } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Loader2, Camera, X, MapPin, Globe, Briefcase, Building2, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/image-url';
import { useMounted } from '@/hooks/use-mounted';
import type { UserProfile, UpdateProfileInput } from '@/types/profile';

const profileEditSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').max(50, 'Tên hiển thị không được quá 50 ký tự'),
  bio: z.string().max(500, 'Tiểu sử không được quá 500 ký tự').optional().nullable(),
  location: z.string().max(100, 'Địa điểm không được quá 100 ký tự').optional().nullable(),
  website: z.string()
    .transform(val => {
      if (!val || val.trim() === '') return '';
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return `https://${val}`;
      }
      return val;
    })
    .pipe(z.union([z.string().url('URL không hợp lệ'), z.literal('')]))
    .optional()
    .nullable(),
  jobTitle: z.string().max(100, 'Chức danh không được quá 100 ký tự').optional().or(z.literal('')).nullable(),
  company: z.string().max(100, 'Tên công ty không được quá 100 ký tự').optional().or(z.literal('')).nullable(),
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (data: UpdateProfileInput & { avatarFile?: File; coverFile?: File }) => Promise<void>;
  isLoading?: boolean;
}

/* ─── Character counter helper ─── */
function CharCount({ value, max }: { value: string; max: number }) {
  const len = value?.length || 0;
  const pct = len / max;
  return (
    <span
      className={`text-xs tabular-nums ${
        pct >= 1 ? 'text-red-400' : pct >= 0.9 ? 'text-amber-400' : 'text-muted-foreground'
      }`}
    >
      {len}/{max}
    </span>
  );
}

/* ─── Section divider ─── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  onSave,
  isLoading = false,
}: ProfileEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(getAvatarUrl(profile.avatar));
  const [coverPreview, setCoverPreview] = useState<string | null>(profile.coverPhoto);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>(profile.expertise || []);
  const [skillInput, setSkillInput] = useState('');
  const [visible, setVisible] = useState(false);
  const mounted = useMounted();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayName: profile.displayName,
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      jobTitle: profile.jobTitle || '',
      company: profile.company || '',
    },
  });

  const displayName = watch('displayName');
  const bioValue = watch('bio') || '';
  const locationValue = watch('location') || '';
  const jobTitleValue = watch('jobTitle') || '';
  const companyValue = watch('company') || '';

  /* ─── Reset form when profile data changes ─── */
  useEffect(() => {
    reset({
      displayName: profile.displayName,
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      jobTitle: profile.jobTitle || '',
      company: profile.company || '',
    });
    setSkills(profile.expertise || []);
    setAvatarPreview(getAvatarUrl(profile.avatar));
    setCoverPreview(profile.coverPhoto);
  }, [profile, reset]);

  /* ─── Slide-in / slide-out animation ─── */
  useEffect(() => {
    if (isOpen) {
      // Small delay so the DOM renders first, then animate in
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ─── Cleanup close timeout on unmount ─── */
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  /* ─── Escape key ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ─── Focus trap: auto-focus first element and cycle Tab within modal ─── */
  const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  useEffect(() => {
    if (visible && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length > 0) {
        // Focus the close button (first interactive element)
        focusableElements[0].focus();
      }
    }
  }, [visible]);

  const handleKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;

    const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  /* ─── File handlers (unchanged logic) ─── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('Kích thước ảnh không được vượt quá 5MB'); return; }
      if (!file.type.startsWith('image/')) { alert('Vui lòng chọn một tệp hình ảnh'); return; }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('Kích thước ảnh không được vượt quá 5MB'); return; }
      if (!file.type.startsWith('image/')) { alert('Vui lòng chọn một tệp hình ảnh'); return; }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeAvatarPreview = () => {
    setAvatarPreview(getAvatarUrl(profile.avatar));
    setAvatarFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const removeCoverPreview = () => {
    setCoverPreview(profile.coverPhoto);
    setCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  /* ─── Skills tag input ─── */
  const addSkill = useCallback((raw: string) => {
    const val = raw.trim();
    if (!val) return;
    if (skills.length >= 20) return;
    if (skills.some(s => s.toLowerCase() === val.toLowerCase())) return;
    setSkills(prev => [...prev, val]);
    setSkillInput('');
  }, [skills]);

  const removeSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleSkillKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
    if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  };

  /* ─── Submit ─── */
  const onSubmit = async (data: ProfileEditFormData) => {
    setIsSaving(true);
    try {
      const updateData: UpdateProfileInput & { avatarFile?: File; coverFile?: File } = {
        displayName: data.displayName,
        bio: data.bio || undefined,
        location: data.location || undefined,
        website: data.website || undefined,
        jobTitle: data.jobTitle || undefined,
        company: data.company || undefined,
        expertise: skills.length > 0 ? skills : undefined,
      };
      if (avatarFile) updateData.avatarFile = avatarFile;
      if (coverFile) updateData.coverFile = coverFile;
      await onSave(updateData);
      handleClose();
    } catch (err) {
      console.error('ProfileEditModal: update failed', err);
      alert('Cập nhật hồ sơ thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      reset();
      setAvatarPreview(getAvatarUrl(profile.avatar));
      setCoverPreview(profile.coverPhoto);
      setAvatarFile(null);
      setCoverFile(null);
      setSkills(profile.expertise || []);
      setSkillInput('');
      onClose();
    }, 300); // wait for slide-out animation
  };

  const hasChanges = isDirty || avatarFile !== null || coverFile !== null
    || JSON.stringify(skills) !== JSON.stringify(profile.expertise || []);

  if (!isOpen || !mounted) return null;

  /* ─── Shared input classes ─── */
  const inputCls =
    'w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50';

  return createPortal(
    /* Backdrop */
    <div
      className={`fixed inset-0 z-[60] isolate transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Chỉnh sửa hồ sơ"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel - full screen on mobile, max-w-2xl on desktop */}
      <div
        ref={panelRef}
        onKeyDown={handleKeyDown}
        className={`absolute inset-y-0 right-0 w-full h-full sm:h-auto sm:max-w-2xl bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-foreground">Chỉnh sửa hồ sơ</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable Content ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto"
        >
          <div className="px-4 md:px-6 pb-6">
            {/* Cover Photo */}
            <div
              className="relative mt-4 h-40 md:h-48 rounded-xl overflow-hidden group cursor-pointer bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-cyan-500/20"
              onClick={() => coverInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); coverInputRef.current?.click(); } }}
              aria-label="Thay đổi ảnh bìa"
            >
              {coverPreview && (
                <Image src={coverPreview} alt="Ảnh bìa" fill className="object-cover" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="h-4 w-4" />
                  Thay đổi ảnh bìa
                </div>
              </div>
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleCoverChange} className="hidden" aria-label="Tải lên ảnh bìa" />
              {coverFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeCoverPreview(); }}
                  className="absolute top-3 right-3 p-1.5 bg-black/70 text-white rounded-full hover:bg-red-500 transition-colors"
                  aria-label="Xóa ảnh bìa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Avatar overlapping cover */}
            <div className="relative -mt-12 ml-6 md:ml-8 mb-4">
              <div
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-card group cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avatarInputRef.current?.click(); } }}
                aria-label="Thay đổi ảnh đại diện"
              >
                <Avatar className="w-full h-full">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="text-xl">{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarChange} className="hidden" aria-label="Tải lên ảnh đại diện" />
              </div>
              {avatarFile && (
                <button
                  type="button"
                  onClick={removeAvatarPreview}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  aria-label="Xóa ảnh đại diện"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <p className="mt-1.5 text-[11px] text-muted-foreground">Tối đa 5MB · JPG, PNG, GIF</p>
            </div>

            {/* ── Section: Thông tin cơ bản ── */}
            <SectionDivider label="Thông tin cơ bản" />
            <div className="mt-4 space-y-4">
              {/* Display Name */}
              <div>
                <Label htmlFor="displayName" className="text-sm font-medium text-foreground">
                  Tên hiển thị <span className="text-red-400">*</span>
                </Label>
                <input
                  id="displayName"
                  {...register('displayName')}
                  placeholder="Nhập tên hiển thị"
                  className={`${inputCls} mt-1.5`}
                  aria-invalid={!!errors.displayName}
                  aria-describedby={errors.displayName ? 'displayName-error' : undefined}
                />
                <div className="flex justify-between mt-1">
                  {errors.displayName ? (
                    <p id="displayName-error" className="text-xs text-red-400">{errors.displayName.message}</p>
                  ) : <span />}
                  <CharCount value={displayName || ''} max={50} />
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio" className="text-sm font-medium text-foreground">Giới thiệu</Label>
                <textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Viết vài dòng về bản thân..."
                  rows={4}
                  className={`${inputCls} mt-1.5 min-h-[100px] resize-none`}
                  aria-invalid={!!errors.bio}
                  aria-describedby={errors.bio ? 'bio-error' : undefined}
                />
                <div className="flex justify-between mt-1">
                  {errors.bio ? (
                    <p id="bio-error" className="text-xs text-red-400">{errors.bio.message}</p>
                  ) : <span />}
                  <CharCount value={bioValue} max={500} />
                </div>
              </div>
            </div>

            {/* ── Section: Vị trí & Liên kết ── */}
            <div className="mt-6">
              <SectionDivider label="Vị trí & Liên kết" />
              <div className="mt-4 space-y-4">
                {/* Location */}
                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Vị trí
                  </Label>
                  <input
                    id="location"
                    {...register('location')}
                    placeholder="VD: Hồ Chí Minh, Việt Nam"
                    className={`${inputCls} mt-1.5`}
                    aria-invalid={!!errors.location}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.location ? (
                      <p className="text-xs text-red-400">{errors.location.message}</p>
                    ) : <span />}
                    <CharCount value={locationValue} max={100} />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Website
                  </Label>
                  <input
                    id="website"
                    type="url"
                    {...register('website')}
                    placeholder="https://example.com"
                    className={`${inputCls} mt-1.5`}
                    aria-invalid={!!errors.website}
                  />
                  {errors.website && (
                    <p className="text-xs text-red-400 mt-1">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section: Thông tin nghề nghiệp ── */}
            <div className="mt-6">
              <SectionDivider label="Thông tin nghề nghiệp" />
              <div className="mt-4 space-y-4">
                {/* Job Title */}
                <div>
                  <Label htmlFor="jobTitle" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    Chức danh
                  </Label>
                  <input
                    id="jobTitle"
                    {...register('jobTitle')}
                    placeholder="VD: Senior Web Developer"
                    className={`${inputCls} mt-1.5`}
                    aria-invalid={!!errors.jobTitle}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.jobTitle ? (
                      <p className="text-xs text-red-400">{errors.jobTitle.message}</p>
                    ) : <span />}
                    <CharCount value={jobTitleValue} max={100} />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <Label htmlFor="company" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Công ty
                  </Label>
                  <input
                    id="company"
                    {...register('company')}
                    placeholder="VD: ChungToiXayWeb"
                    className={`${inputCls} mt-1.5`}
                    aria-invalid={!!errors.company}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.company ? (
                      <p className="text-xs text-red-400">{errors.company.message}</p>
                    ) : <span />}
                    <CharCount value={companyValue} max={100} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section: Kỹ năng ── */}
            <div className="mt-6">
              <SectionDivider label="Kỹ năng" />
              <div className="mt-4">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Chuyên môn
                </Label>

                {/* Tags container */}
                <div
                  className="mt-1.5 flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-secondary min-h-[44px] cursor-text transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
                  onClick={() => skillInputRef.current?.focus()}
                >
                  {skills.map((skill, i) => (
                    <span
                      key={`${skill}-${i}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/25 text-blue-400 transition-colors hover:bg-blue-500/20"
                    >
                      {skill}
                      <button
                        type="button"
                        data-skill-remove
                        onClick={(e) => { e.stopPropagation(); removeSkill(i); }}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-blue-500/30 transition-colors"
                        aria-label={`Xóa kỹ năng ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {skills.length < 20 && (
                    <input
                      ref={skillInputRef}
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      onBlur={(e: FocusEvent<HTMLInputElement>) => {
                        // Don't add skill if clicking on a remove button (race condition fix)
                        if ((e.relatedTarget as HTMLElement)?.closest('[data-skill-remove]')) return;
                        if (skillInput.trim()) addSkill(skillInput);
                      }}
                      placeholder={skills.length === 0 ? 'VD: React, Next.js, TypeScript...' : 'Thêm kỹ năng...'}
                      className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                      aria-label="Thêm kỹ năng"
                    />
                  )}
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-[11px] text-muted-foreground">Nhấn Enter hoặc dấu phẩy để thêm</p>
                  <span className={`text-xs tabular-nums ${skills.length >= 20 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {skills.length}/20
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sticky Footer ── */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-card/95 backdrop-blur-md">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving || isLoading}
              className="px-5"
              aria-label="Hủy chỉnh sửa"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isSaving || isLoading}
              className="px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-colors"
              aria-label={isSaving || isLoading ? 'Đang lưu thay đổi' : 'Lưu thay đổi'}
            >
              {isSaving || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
