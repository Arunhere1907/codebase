/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef } from 'react';
import { format, subDays, startOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { Grid3X3 } from 'lucide-react';
import type { DashboardStats, ProblemLog, UserSettings } from '../types';

export interface DayActivityBreakdown {
  date: string;
  leetcode: number;
  codeforces: number;
  github: number;
  codechef: number;
  atcoder: number;
  tracker: number;
  total: number;
}

interface SubmissionHeatmapProps {
  stats: DashboardStats | null;
  problemLogs: ProblemLog[];
  settings: UserSettings;
  loading?: boolean;
}

const WEEKS = 53;
const LEVEL_CLASSES = [
  'bg-gray-100 dark:bg-white/[0.06] border border-gray-200/80 dark:border-white/[0.06]',
  'bg-blue-500/25 dark:bg-blue-500/30 border border-blue-500/20',
  'bg-blue-500/45 dark:bg-blue-500/50 border border-blue-500/30',
  'bg-blue-500/70 dark:bg-blue-500/75 border border-blue-500/40',
  'bg-blue-600 dark:bg-blue-500 border border-blue-600/50 dark:border-blue-400/40',
];

const PLATFORM_ROWS: Array<{
  key: keyof Omit<DayActivityBreakdown, 'date' | 'total'>;
  label: string;
  dotClass: string;
  configured: (s: UserSettings) => boolean;
}> = [
  { key: 'leetcode', label: 'LeetCode', dotClass: 'bg-blue-600', configured: (s) => !!s.usernames.leetcode?.trim() },
  { key: 'github', label: 'GitHub commits', dotClass: 'bg-zinc-400 dark:bg-zinc-300', configured: (s) => !!s.usernames.github?.trim() },
  { key: 'codeforces', label: 'Codeforces', dotClass: 'bg-cyan-400', configured: (s) => !!s.usernames.codeforces?.trim() },
  { key: 'codechef', label: 'CodeChef', dotClass: 'bg-emerald-500', configured: (s) => !!s.usernames.codechef?.trim() },
  { key: 'atcoder', label: 'AtCoder', dotClass: 'bg-indigo-500', configured: (s) => !!s.usernames.atcoder?.trim() },
  { key: 'tracker', label: 'CP Tracker logs', dotClass: 'bg-amber-500', configured: () => true },
];

function buildActivityByDate(
  stats: DashboardStats | null,
  problemLogs: ProblemLog[]
): Record<string, DayActivityBreakdown> {
  const map: Record<string, DayActivityBreakdown> = {};

  const ensure = (date: string): DayActivityBreakdown => {
    if (!map[date]) {
      map[date] = {
        date,
        leetcode: 0,
        codeforces: 0,
        github: 0,
        codechef: 0,
        atcoder: 0,
        tracker: 0,
        total: 0,
      };
    }
    return map[date];
  };

  const addMap = (source: Record<string, number> | undefined, field: keyof Omit<DayActivityBreakdown, 'date' | 'total'>) => {
    if (!source) return;
    Object.entries(source).forEach(([date, count]) => {
      const day = ensure(date);
      day[field] += count;
    });
  };

  addMap(stats?.leetcode?.dailySubmissions, 'leetcode');
  addMap(stats?.codeforces?.dailySubmissions, 'codeforces');
  addMap(stats?.github?.dailyCommits, 'github');

  problemLogs.forEach((log) => {
    try {
      const date = format(parseISO(log.date), 'yyyy-MM-dd');
      const day = ensure(date);
      const platform = log.platform.toLowerCase();
      if (platform === 'codechef') day.codechef += 1;
      else if (platform === 'atcoder') day.atcoder += 1;
      day.tracker += 1;
    } catch {
      // skip invalid dates
    }
  });

  Object.values(map).forEach((day) => {
    day.total = day.leetcode + day.codeforces + day.github + day.codechef + day.atcoder + day.tracker;
  });

  return map;
}

function getIntensityLevel(total: number, maxTotal: number): number {
  if (total <= 0) return 0;
  if (maxTotal <= 1) return 4;
  const ratio = total / maxTotal;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.45) return 2;
  if (ratio <= 0.7) return 3;
  return 4;
}

export default function SubmissionHeatmap({ stats, problemLogs, settings, loading }: SubmissionHeatmapProps) {
  const [hovered, setHovered] = useState<DayActivityBreakdown | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  const { weeks, maxTotal, monthLabels, hasAnyActivity } = useMemo(() => {
    const end = new Date();
    const start = subDays(end, WEEKS * 7 - 1);
    const rangeStart = startOfWeek(start, { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: rangeStart, end });

    const activityByDate = buildActivityByDate(stats, problemLogs);
    let max = 0;
    let any = false;

    allDays.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const total = activityByDate[key]?.total ?? 0;
      if (total > 0) any = true;
      if (total > max) max = total;
    });

    const weekColumns: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekColumns.push(allDays.slice(i, i + 7));
    }

    const labels: { label: string; weekIndex: number }[] = [];
    weekColumns.forEach((col, weekIndex) => {
      const first = col[0];
      if (first && first.getDate() <= 7) {
        labels.push({ label: format(first, 'MMM'), weekIndex });
      }
    });

    return {
      weeks: weekColumns,
      maxTotal: max,
      monthLabels: labels,
      hasAnyActivity: any,
    };
  }, [stats, problemLogs]);

  const activityByDate = useMemo(
    () => buildActivityByDate(stats, problemLogs),
    [stats, problemLogs]
  );

  const handleCellEnter = (day: DayActivityBreakdown, e: React.MouseEvent<HTMLButtonElement>) => {
    setHovered(day);
    const rect = e.currentTarget.getBoundingClientRect();
    const container = gridRef.current?.getBoundingClientRect();
    if (container) {
      setTooltipPos({
        x: rect.left - container.left + rect.width / 2,
        y: rect.top - container.top,
      });
    }
  };

  const configuredPlatforms = PLATFORM_ROWS.filter((p) => p.configured(settings));

  return (
    <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-3.5 bg-blue-500" />
          <h2 className="text-xs font-sans font-extrabold text-gray-900 dark:text-white uppercase tracking-widest">
            Submission Heatmap
          </h2>
          <Grid3X3 size={14} className="text-blue-500/70" />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 dark:text-white/40">
          <span>Less</span>
          {LEVEL_CLASSES.map((cls, i) => (
            <span key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 dark:text-white/35 font-sans -mt-1">
        Last 12 months across LeetCode, GitHub, Codeforces, and your CP Tracker logs. Hover a day for the breakdown.
      </p>

      {loading && !stats ? (
        <div className="h-[130px] flex items-center justify-center">
          <span className="text-xs text-gray-400 animate-pulse">Loading activity data…</span>
        </div>
      ) : !hasAnyActivity ? (
        <div className="h-[130px] flex flex-col items-center justify-center gap-2 text-center px-4">
          <p className="text-xs text-gray-400">No submission activity in the last year yet.</p>
          <p className="text-[10px] text-gray-400 dark:text-white/30">
            Add platform handles in Settings and refresh stats, or log problems in CP Tracker.
          </p>
        </div>
      ) : (
        <div ref={gridRef} className="relative overflow-x-auto pb-1">
          {hovered && (
            <div
              className="pointer-events-none absolute z-30 min-w-[200px] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl px-3 py-2.5"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              <p className="text-[11px] font-sans font-bold text-gray-900 dark:text-white mb-2">
                {format(parseISO(hovered.date), 'EEE, MMM d, yyyy')}
              </p>
              <div className="space-y-1.5">
                {PLATFORM_ROWS.map(({ key, label, dotClass, configured }) => {
                  const count = hovered[key];
                  if (!configured(settings) && key !== 'tracker') return null;
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 text-[10px]">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        {label}
                      </span>
                      <strong className="font-mono text-gray-900 dark:text-white">{count}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/10 flex justify-between text-[10px]">
                <span className="text-gray-500 dark:text-white/40">Total</span>
                <strong className="font-mono text-blue-600 dark:text-blue-400">{hovered.total}</strong>
              </div>
            </div>
          )}

          <div className="inline-flex gap-[3px] min-w-max pl-8">
            <div className="flex flex-col justify-between text-[9px] font-mono text-gray-400 dark:text-white/30 pr-1 py-[2px] h-[98px] shrink-0">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex gap-[3px] h-3 pl-0.5 relative">
                {monthLabels.map(({ label, weekIndex }) => (
                  <span
                    key={`${label}-${weekIndex}`}
                    className="absolute text-[9px] font-mono text-gray-400 dark:text-white/30 uppercase"
                    style={{ left: weekIndex * 13 }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((date) => {
                      const key = format(date, 'yyyy-MM-dd');
                      const breakdown = activityByDate[key] ?? {
                        date: key,
                        leetcode: 0,
                        codeforces: 0,
                        github: 0,
                        codechef: 0,
                        atcoder: 0,
                        tracker: 0,
                        total: 0,
                      };
                      const level = getIntensityLevel(breakdown.total, maxTotal);
                      const isFuture = date > new Date();

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isFuture}
                          aria-label={`${key}: ${breakdown.total} activities`}
                          className={`w-[10px] h-[10px] rounded-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                            isFuture
                              ? 'opacity-0 cursor-default'
                              : `${LEVEL_CLASSES[level]} hover:ring-2 hover:ring-blue-400/50 hover:scale-110`
                          }`}
                          onMouseEnter={(e) => !isFuture && handleCellEnter(breakdown, e)}
                          onMouseLeave={() => setHovered(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {configuredPlatforms.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
              {configuredPlatforms.map(({ label, dotClass }) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-white/40">
                  <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
