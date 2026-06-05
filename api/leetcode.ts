import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const LC_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://leetcode.com',
  'Origin': 'https://leetcode.com',
};

async function lcGraphql(query: string, variables: Record<string, string>) {
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
          userCalendar { streak totalActiveDays }
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
    const contestRating = data.userContestRanking?.rating
      ? Math.round(data.userContestRanking.rating)
      : 0;

    const badges: string[] = [];
    if (totalSolved >= 500) badges.push('Knight');
    if (streak >= 30) badges.push('30-day Streak');
    if (hardSolved >= 50) badges.push('Hard Problem Solver');

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
      badges,
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
