/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { useCodeBaseStore } from '../store';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-16 h-16 text-lg',
};

export function getUserDisplayInfo(
  settings: { avatarUrl?: string; displayName?: string },
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null,
  portfolioName?: string
) {
  const displayName =
    settings.displayName ||
    user?.displayName ||
    portfolioName ||
    user?.email?.split('@')[0] ||
    'Developer';
  const avatarUrl = settings.avatarUrl || user?.photoURL || null;
  const initial = displayName.charAt(0).toUpperCase();
  return { displayName, avatarUrl, initial };
}

export default function UserAvatar({ size = 'md', editable = false, className = '' }: UserAvatarProps) {
  const { settings, user, portfolio, updateSettings } = useCodeBaseStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const { displayName, avatarUrl, initial } = getUserDisplayInfo(settings, user, portfolio.name);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 512000) {
      alert('Image must be under 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      await updateSettings({ avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className={`relative group shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={`${sizeClass} rounded-full object-cover border-2 border-blue-600 shadow-md`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full bg-blue-600 flex items-center justify-center font-bold font-sans text-white border-2 border-blue-600 shadow-md uppercase`}
        >
          {initial}
        </div>
      )}
      {editable && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
            title="Change profile photo"
          >
            <Camera size={size === 'sm' ? 10 : 14} className="text-white" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
}
