import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const LC_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://leetcode.com',
  'Origin': 'https://leetcode.com',
};

async function lcGraphql(query: string, variables: Record<string, string | number>) {
  const response = await axios.post(
    'https://leetcode.com/graphql',
    { query, variables },
    { timeout: 15000, headers: LC_HEADERS }
  );
  return response.data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { handle } = req.query;

  if (!handle || typeof handle !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid handle parameter' });
  }

  const username = handle.trim();

  try {
    const profileData = await lcGraphql(
      `query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats {
            acSubmissionNum { difficulty count }
          }
          profile { ranking reputation starRating }
          userCalendar { streak totalActiveDays submissionCalendar }
          badges { displayName }
        }
        userContestRanking(username: $username) { rating topPercentage }
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest { title startTime }
        }
      }`,
      { username }
    );

    const data = profileData?.data;

    if (!data?.matchedUser) {
      return res.status(404).json({ error: `LeetCode user "${username}" not found` });
    }

    const user = data.matchedUser;
    const submitStats = user.submitStats?.acSubmissionNum || [];

    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    submitStats.forEach((stat: { difficulty: string; count: number }) => {
      if (stat.difficulty === 'Easy') easySolved = stat.count;
      if (stat.difficulty === 'Medium') mediumSolved = stat.count;
      if (stat.difficulty === 'Hard') hardSolved = stat.count;
    });

    const totalSolved = easySolved + mediumSolved + hardSolved;
    const streak = user.userCalendar?.streak || 0;
    const HEATMAP_MS = 53 * 7 * 24 * 60 * 60 * 1000;
    const heatmapCutoff = Date.now() - HEATMAP_MS;

    const dailySubmissions: Record<string, number> = {};
    const addDaily = (dayKey: string, count: number) => {
      if (!dayKey) return;
      dailySubmissions[dayKey] = (dailySubmissions[dayKey] || 0) + count;
    };

    try {
      const rawCalendar = user.userCalendar?.submissionCalendar;
      if (rawCalendar) {
        const parsed = JSON.parse(rawCalendar) as Record<string, number>;
        Object.entries(parsed).forEach(([ts, count]) => {
          const ms = Number(ts) * 1000;
          if (Number.isNaN(ms) || ms < heatmapCutoff) return;
          addDaily(new Date(ms).toISOString().slice(0, 10), Number(count));
        });
      }
    } catch {
      // submissionCalendar optional
    }

    if (Object.keys(dailySubmissions).length === 0) {
      try {
        const recentData = await lcGraphql(
          `query recentAcSubmissions($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit) {
              timestamp
            }
          }`,
          { username, limit: 2500 }
        );
        const recent = recentData?.data?.recentAcSubmissionList || [];
        recent.forEach((sub: { timestamp: string }) => {
          const sec = Number(sub.timestamp);
          if (Number.isNaN(sec)) return;
          const ms = sec * 1000;
          if (ms < heatmapCutoff) return;
          addDaily(new Date(ms).toISOString().slice(0, 10), 1);
        });
      } catch {
        // recent list optional
      }
    }

    const contestRating = data.userContestRanking?.rating
      ? Math.round(data.userContestRanking.rating)
      : 0;

    const topPercentage = data.userContestRanking?.topPercentage || null;

    const badges: string[] = [];
    if (user.badges && Array.isArray(user.badges)) {
      user.badges.forEach((b: { displayName: string }) => {
        if (b.displayName) badges.push(b.displayName);
      });
    }

    const history: Array<{ date: string; rating: number }> = [];
    const rankingHistory = data.userContestRankingHistory || [];
    if (rankingHistory.length > 0) {
      rankingHistory.slice(-10).forEach((entry: { rating: number; contest: { startTime: number } }) => {
        history.push({
          date: new Date(entry.contest.startTime * 1000).toISOString().split('T')[0],
          rating: Math.round(entry.rating),
        });
      });
    } else if (contestRating > 0) {
      history.push({
        date: new Date().toISOString().split('T')[0],
        rating: contestRating,
      });
    }

    return res.status(200).json({
      handle: user.username,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      streak,
      contestRating,
      topPercentage,
      badges,
      dailySubmissions,
      history,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number; data?: unknown } };
    console.error('LeetCode API Error:', err.message, err.response?.data);

    if (err.response?.status === 404) {
      return res.status(404).json({ error: `LeetCode user "${username}" not found` });
    }

    return res.status(500).json({
      error: 'Failed to fetch LeetCode data',
      detail: err.message || 'Unknown error',
    });
  }
}
