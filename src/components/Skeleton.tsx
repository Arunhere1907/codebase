/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  id?: string;
}

export function SkeletonPulse({ className = '', id }: SkeletonProps) {
  return (
    <div
      id={id}
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md ${className}`}
    />
  );
}

export function SkeletonCard({ id }: { id?: string }) {
  return (
    <div id={id} className="p-5 border border-gray-100 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-10 h-10 rounded-lg" />
          <div className="space-y-1.5">
            <SkeletonPulse className="w-24 h-4" />
            <SkeletonPulse className="w-16 h-3" />
          </div>
        </div>
        <SkeletonPulse className="w-12 h-6 rounded-full" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <SkeletonPulse className="w-10 h-3" />
          <SkeletonPulse className="w-16 h-6" />
        </div>
        <div className="space-y-1.5">
          <SkeletonPulse className="w-10 h-3" />
          <SkeletonPulse className="w-16 h-6" />
        </div>
      </div>
      
      <div className="space-y-2 pt-2">
        <SkeletonPulse className="w-full h-8 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonContestListItem({ id }: { id?: string }) {
  return (
    <div id={id} className="p-4 border border-gray-100 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <SkeletonPulse className="w-10 h-10 rounded-lg mt-0.5 shrink-0" />
        <div className="space-y-2">
          <SkeletonPulse className="w-48 sm:w-64 h-5" />
          <div className="flex items-center gap-3">
            <SkeletonPulse className="w-20 h-3" />
            <SkeletonPulse className="w-24 h-3" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
        <SkeletonPulse className="w-16 h-6 rounded" />
        <SkeletonPulse className="w-28 h-9 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonContestCardItem({ id }: { id?: string }) {
  return (
    <div id={id} className="p-4 border border-gray-100 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900/30 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="w-14 h-5 rounded-full" />
        <SkeletonPulse className="w-16 h-3" />
      </div>
      <SkeletonPulse className="w-full h-6" />
      <SkeletonPulse className="w-1/2 h-4" />
      <div className="flex gap-2 pt-2">
        <SkeletonPulse className="w-1/3 h-8 rounded-lg" />
        <SkeletonPulse className="w-2/3 h-8 rounded-lg" />
      </div>
    </div>
  );
}
