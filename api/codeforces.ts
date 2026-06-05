import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const CF_BASE = 'https://codeforces.com/api';

interface CodeforcesSubmission {
  id: number;
  problem: {
    contestId?: number;
    index?: string;
    name: string;
  };
  verdict: string;
  programmingLanguage: string;
  creationTimeSeconds: number;
}

interface CodeforcesRatingChange {
  contestName: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  newRating: number;
}

async function cfGet<T>(path: string): Promise<T> {
  const response = await axios.get(`${CF_BASE}${path}`, { timeout: 15000 });
  if (response.data?.status !== 'OK') {
    throw new Error(response.data?.comment || 'Codeforces API returned FAILED');
  }
  return response.data.result as T;
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

  const cfHandle = handle.trim();

  try {
    const [user] = await cfGet<Array<{
      handle: string;
      rating?: number;
      maxRating?: number;
      rank?: string;
      maxRank?: string;
    }>>(`/user.info?handles=${encodeURIComponent(cfHandle)}`);

    if (!user) {
      return res.status(404).json({ error: `Codeforces user "${cfHandle}" not found` });
    }

    let solvedCount = 0;
    const solvedProblems = new Set<string>();
    let recentSubmissions: Array<{
      id: number;
      problemName: string;
      verdict: string;
      language: string;
      time: string;
    }> = [];

    try {
      const submissions = await cfGet<CodeforcesSubmission[]>(
        `/user.status?handle=${encodeURIComponent(cfHandle)}&from=1&count=10000`
      );

      submissions.forEach((sub) => {
        if (sub.verdict === 'OK') {
          const key = sub.problem.contestId && sub.problem.index
            ? `${sub.problem.contestId}${sub.problem.index}`
            : sub.problem.name;
          solvedProblems.add(key);
        }
      });
      solvedCount = solvedProblems.size;

      recentSubmissions = submissions.slice(0, 20).map((sub) => {
        const submissionTime = new Date(sub.creationTimeSeconds * 1000);
        const diffMs = Date.now() - submissionTime.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        let timeStr = '';
        if (diffDays === 0) {
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          timeStr = diffHours === 0 ? 'less than 1 hour ago' : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
          timeStr = '1 day ago';
        } else if (diffDays < 7) {
          timeStr = `${diffDays} days ago`;
        } else {
          timeStr = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        }
        return {
          id: sub.id,
          problemName: sub.problem.name,
          verdict: sub.verdict,
          language: sub.programmingLanguage,
          time: timeStr,
        };
      });
    } catch {
      // Submissions may fail for private accounts — still return profile data
    }

    const history: Array<{ date: string; rating: number; rank: number; contestName: string }> = [];
    try {
      const ratingChanges = await cfGet<CodeforcesRatingChange[]>(
        `/user.rating?handle=${encodeURIComponent(cfHandle)}`
      );
      ratingChanges.slice(-10).forEach((change) => {
        history.push({
          date: new Date(change.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0],
          rating: change.newRating,
          rank: change.rank,
          contestName: change.contestName,
        });
      });
    } catch {
      // User may have no contest history
    }

    return res.status(200).json({
      handle: user.handle,
      rating: user.rating || 0,
      maxRating: user.maxRating || user.rating || 0,
      rank: user.rank || 'Unrated',
      maxRank: user.maxRank || user.rank || 'Unrated',
      solvedCount,
      history,
      recentSubmissions,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } };
    console.error('Codeforces API Error:', err.message);

    if (err.message?.includes('not found') || err.response?.status === 400) {
      return res.status(404).json({ error: `Codeforces user "${cfHandle}" not found` });
    }

    return res.status(500).json({
      error: 'Failed to fetch Codeforces data',
      detail: err.message || 'Unknown error',
    });
  }
}
