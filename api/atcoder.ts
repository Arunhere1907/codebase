import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
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

  try {
    // Fetch rating history first — works even for users with zero submissions
    const ratingResponse = await axios.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/rating/history?user=${handle}`, {
      timeout: 10000
    });

    const ratingHistory = ratingResponse.data || [];

    // Count solved problems from submissions (optional — user may have none)
    let solvedCount = 0;
    try {
      const userInfoResponse = await axios.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=0`, {
        timeout: 15000
      });
      const submissions = userInfoResponse.data || [];
      const solvedProblems = new Set<string>();
      submissions.forEach((sub: any) => {
        if (sub.result === 'AC') {
          solvedProblems.add(sub.problem_id);
        }
      });
      solvedCount = solvedProblems.size;
    } catch {
      solvedCount = 0;
    }

    if (ratingHistory.length === 0 && solvedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let currentRating = 0;
    let highestRating = 0;
    const history: Array<{ date: string; rating: number }> = [];

    if (ratingHistory.length > 0) {
      // Get last rating
      const lastRating = ratingHistory[ratingHistory.length - 1];
      currentRating = lastRating.NewRating;

      // Find highest rating
      ratingHistory.forEach((contest: any) => {
        if (contest.NewRating > highestRating) {
          highestRating = contest.NewRating;
        }
      });

      // Get last 10 contests for history
      const recentContests = ratingHistory.slice(-10);
      recentContests.forEach((contest: any) => {
        history.push({
          date: new Date(contest.EndTime * 1000).toISOString().split('T')[0],
          rating: contest.NewRating
        });
      });
    }

    // Get user rank from Kenkoooo rankings
    let rank = 0;
    try {
      const rankResponse = await axios.get(`https://kenkoooo.com/atcoder/resources/user.json`, {
        timeout: 10000
      });
      
      const users = rankResponse.data || [];
      const userRankInfo = users.find((u: any) => u.user_id === handle);
      if (userRankInfo) {
        // Calculate approximate rank based on rating
        const higherRatedUsers = users.filter((u: any) => (u.rating || 0) > currentRating);
        rank = higherRatedUsers.length + 1;
      }
    } catch (e) {
      // If rank fetch fails, estimate based on rating
      rank = currentRating > 1600 ? 1000 : currentRating > 1200 ? 3000 : 5000;
    }

    const result = {
      handle,
      rating: currentRating,
      highestRating,
      rank,
      solvedCount,
      history
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('AtCoder API Error:', error.message);
    
    if (error.response?.status === 404 || error.message.includes('404')) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch AtCoder data' });
  }
}
