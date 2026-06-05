import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const KENKOOOO = 'https://kenkoooo.com/atcoder';

interface AtCoderContestEntry {
  NewRating: number;
  EndTime: string;
  IsRated?: boolean;
}

interface UserInfo {
  user_id: string;
  accepted_count: number;
  accepted_count_rank: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { handle } = req.query;
  if (!handle || typeof handle !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid handle parameter' });
  }

  const acHandle = handle.trim();

  try {
    // user_info works even for users with zero contest participation
    let userInfo: UserInfo | null = null;
    try {
      const infoRes = await axios.get(`${KENKOOOO}/atcoder-api/v3/user_info?user=${encodeURIComponent(acHandle)}`, {
        timeout: 12000,
      });
      userInfo = infoRes.data;
    } catch {
      userInfo = null;
    }

    // Rating history via Kenkoooo proxy (replaces deprecated rating/history endpoint)
    let ratingHistory: AtCoderContestEntry[] = [];
    try {
      const historyRes = await axios.get(`${KENKOOOO}/proxy/users/${encodeURIComponent(acHandle)}/history/json`, {
        timeout: 12000,
      });
      ratingHistory = historyRes.data || [];
    } catch {
      ratingHistory = [];
    }

    if (!userInfo && ratingHistory.length === 0) {
      return res.status(404).json({ error: `AtCoder user "${acHandle}" not found` });
    }

    const solvedCount = userInfo?.accepted_count ?? 0;
    const rank = userInfo?.accepted_count_rank ?? 0;

    let currentRating = 0;
    let highestRating = 0;
    const history: Array<{ date: string; rating: number }> = [];

    if (ratingHistory.length > 0) {
      const last = ratingHistory[ratingHistory.length - 1];
      currentRating = last.NewRating;
      ratingHistory.forEach((entry) => {
        if (entry.NewRating > highestRating) highestRating = entry.NewRating;
      });
      ratingHistory.slice(-10).forEach((entry) => {
        history.push({
          date: new Date(entry.EndTime).toISOString().split('T')[0],
          rating: entry.NewRating,
        });
      });
    }

    return res.status(200).json({
      handle: acHandle,
      rating: currentRating,
      highestRating: highestRating || currentRating,
      rank,
      solvedCount,
      history,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('AtCoder API Error:', err.message);
    return res.status(500).json({
      error: 'Failed to fetch AtCoder data',
      detail: err.message || 'Unknown error',
    });
  }
}
