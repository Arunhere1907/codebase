/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, subDays, startOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import axios from 'axios';
import { Grid3X3 } from 'lucide-react';
import type { DailyCountMap, DashboardStats, ProblemLog, UserSettings } from '../types';

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

type FetchedDaily = {
  leetcode?: DailyCountMap;
  codeforces?: DailyCountMap;
  github?: DailyCountMap;
};

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
}> = [
  { key: 'leetcode', label: 'LeetCode', dotClass: 'bg-blue-600' },
  { key: 'github', label: 'GitHub commits', dotClass: 'bg-zinc-400 dark:bg-zinc-300' },
  { key: 'codeforces', label: 'Codeforces', dotClass: 'bg-cyan-400' },
  { key: 'codechef', label: 'CodeChef', dotClass: 'bg-emerald-500' },
  { key: 'atcoder', label: 'AtCoder', dotClass: 'bg-indigo-500' },
  { key: 'tracker', label: 'CP Tracker logs', dotClass: 'bg-amber-500' },
];

function hasDailyData(map?: DailyCountMap): boolean {
  return !!map && Object.keys(map).length > 0;
}

function buildActivityByDate(
  stats: DashboardStats | null,
  problemLogs: ProblemLog[],
  fetched: FetchedDaily
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

  addMap(fetched.leetcode ?? stats?.leetcode?.dailySubmissions, 'leetcode');
  addMap(fetched.codeforces ?? stats?.codeforces?.dailySubmissions, 'codeforces');
  addMap(fetched.github ?? stats?.github?.dailyCommits, 'github');

  problemLogs.forEach((log) => {
    try {
      const date = format(parseISO(log.date), 'yyyy-MM-dd');
      const day = ensure(date);
      const platform = log.platform.toLowerCase();
      if (platform === 'leetcode') day.leetcode += 1;
      else if (platform === 'codeforces') day.codeforces += 1;
      else if (platform === 'github') day.github += 1;
      else if (platform === 'codechef') day.codechef += 1;
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
  const [tooltipAnchor, setTooltipAnchor] = useState<{
    x: number;
    y: number;
    placeAbove: boolean;
  } | null>(null);
  const [fetchedDaily, setFetchedDaily] = useState<FetchedDaily>({});
  const [fetchingDaily, setFetchingDaily] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const { usernames } = settings;

  useEffect(() => {
    const lc = usernames.leetcode?.trim();
    const cf = usernames.codeforces?.trim();
    const gh = usernames.github?.trim();

    const needLc = lc && !hasDailyData(stats?.leetcode?.dailySubmissions) && !hasDailyData(fetchedDaily.leetcode);
    const needCf = cf && !hasDailyData(stats?.codeforces?.dailySubmissions) && !hasDailyData(fetchedDaily.codeforces);
    const needGh = gh && !hasDailyData(stats?.github?.dailyCommits) && !hasDailyData(fetchedDaily.github);

    if (!needLc && !needCf && !needGh) return;

    let cancelled = false;
    setFetchingDaily(true);

    const tasks: Promise<void>[] = [];

    if (needLc) {
      tasks.push(
        axios
          .get(`/api/leetcode?handle=${encodeURIComponent(lc!)}`, { timeout: 20000 })
          .then((res) => {
            if (!cancelled && res.data?.dailySubmissions) {
              setFetchedDaily((prev) => ({ ...prev, leetcode: res.data.dailySubmissions }));
            }
          })
          .catch(() => {})
      );
    }
    if (needCf) {
      tasks.push(
        axios
          .get(`/api/codeforces?handle=${encodeURIComponent(cf!)}`, { timeout: 20000 })
          .then((res) => {
            if (!cancelled && res.data?.dailySubmissions) {
              setFetchedDaily((prev) => ({ ...prev, codeforces: res.data.dailySubmissions }));
            }
          })
          .catch(() => {})
      );
    }
    if (needGh) {
      tasks.push(
        axios
          .get(`/api/github?username=${encodeURIComponent(gh!)}`, { timeout: 20000 })
          .then((res) => {
            if (!cancelled && res.data?.dailyCommits) {
              setFetchedDaily((prev) => ({ ...prev, github: res.data.dailyCommits }));
            }
          })
          .catch(() => {})
      );
    }

    Promise.allSettled(tasks).finally(() => {
      if (!cancelled) setFetchingDaily(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    usernames.leetcode,
    usernames.codeforces,
    usernames.github,
    stats?.lastUpdated,
    stats?.leetcode?.dailySubmissions,
    stats?.codeforces?.dailySubmissions,
    stats?.github?.dailyCommits,
  ]);

  const activityByDate = useMemo(
    () => buildActivityByDate(stats, problemLogs, fetchedDaily),
    [stats, problemLogs, fetchedDaily]
  );

  const { weeks, maxTotal, monthLabels, activeDayCount } = useMemo(() => {
    const end = new Date();
    const start = subDays(end, WEEKS * 7 - 1);
    const rangeStart = startOfWeek(start, { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: rangeStart, end });

    let max = 0;
    let active = 0;

    allDays.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const total = activityByDate[key]?.total ?? 0;
      if (total > 0) active += 1;
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
      activeDayCount: active,
    };
  }, [activityByDate]);

  const handleCellEnter = (day: DayActivityBreakdown, e: React.MouseEvent<HTMLButtonElement>) => {
    setHovered(day);
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const margin = 12;
    const clampedX = Math.min(
      window.innerWidth - margin,
      Math.max(margin, centerX)
    );
    const placeAbove = rect.top > 200;
    setTooltipAnchor({
      x: clampedX,
      y: placeAbove ? rect.top : rect.bottom,
      placeAbove,
    });
  };

  const handleCellLeave = () => {
    setHovered(null);
    setTooltipAnchor(null);
  };

  const tooltipRows = hovered
    ? PLATFORM_ROWS.filter(({ key }) => hovered[key] > 0)
    : [];

  const hasConfiguredHandle = Object.values(usernames).some((h) => h?.trim());

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
        Last 12 months — any platform you&apos;ve configured counts. Hover a day for LeetCode, GitHub, Codeforces, and tracker breakdown.
        {activeDayCount > 0 && (
          <span className="text-blue-500 dark:text-blue-400 font-semibold ml-1">
            {activeDayCount} active day{activeDayCount === 1 ? '' : 's'}
          </span>
        )}
      </p>

      {(loading && !stats) || fetchingDaily ? (
        <div className="h-[118px] flex items-center justify-center border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
          <span className="text-xs text-gray-400 animate-pulse">Loading heatmap…</span>
        </div>
      ) : (
        <div ref={gridRef} className="relative overflow-x-auto overflow-y-visible pb-1 pt-2">
          {hovered &&
            tooltipAnchor &&
            createPortal(
              <div
                role="tooltip"
                className="pointer-events-none fixed z-[9999] w-[min(240px,calc(100vw-24px))] rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 shadow-2xl px-3.5 py-3"
                style={{
                  left: tooltipAnchor.x,
                  top: tooltipAnchor.y,
                  transform: tooltipAnchor.placeAbove
                    ? 'translate(-50%, calc(-100% - 10px))'
                    : 'translate(-50%, 10px)',
                }}
              >
                <p className="text-[11px] font-sans font-bold text-gray-900 dark:text-white mb-2.5 whitespace-nowrap">
                  {format(parseISO(hovered.date), 'EEE, MMM d, yyyy')}
                </p>
                <div className="space-y-2">
                  {tooltipRows.length === 0 ? (
                    <p className="text-[10px] text-gray-500 dark:text-white/40">No activity this day</p>
                  ) : (
                    tooltipRows.map(({ key, label, dotClass }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-6 text-[11px] leading-none"
                      >
                        <span className="flex items-center gap-2 text-gray-600 dark:text-white/70 shrink-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                          {label}
                        </span>
                        <strong className="font-mono text-gray-900 dark:text-white tabular-nums">
                          {hovered[key]}
                        </strong>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/10 flex justify-between gap-6 text-[11px]">
                  <span className="text-gray-500 dark:text-white/40 font-semibold">Total</span>
                  <strong className="font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                    {hovered.total}
                  </strong>
                </div>
              </div>,
              document.body
            )}

          <div className="inline-flex gap-[3px] min-w-max pl-8">
            <div className="flex flex-col justify-between text-[9px] font-mono text-gray-400 dark:text-white/30 pr-1 py-[2px] h-[98px] shrink-0">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex gap-[3px] h-3 pl-0.5 relative min-w-[200px]">
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
                          onMouseLeave={handleCellLeave}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {activeDayCount === 0 && hasConfiguredHandle && !fetchingDaily && (
            <p className="text-[10px] text-gray-400 dark:text-white/30 mt-3 text-center">
              Grid is ready — click <strong className="text-blue-500">Sync Platform Data</strong> in the sidebar to pull submission history.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
