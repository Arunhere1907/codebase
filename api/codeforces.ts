import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

interface CodeforcesUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
}

interface CodeforcesSubmission {
  id: number;
  problem: {
    name: string;
  };
  verdict: string;
  programmingLanguage: string;
  creationTimeSeconds: number;
}

interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

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
    // Fetch user info
    const userResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`, {
      timeout: 10000
    });

    if (userResponse.data?.status !== 'OK' || !userResponse.data.result?.[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user: CodeforcesUser = userResponse.data.result[0];

    // Fetch solved count from user submissions
    const submissionsResponse = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`, {
      timeout: 15000
    });

    let solvedCount = 0;
    const solvedProblems = new Set<string>();

    if (submissionsResponse.data?.status === 'OK') {
      const submissions: CodeforcesSubmission[] = submissionsResponse.data.result || [];
      submissions.forEach((sub) => {
        if (sub.verdict === 'OK') {
          const problemId = `${sub.problem.name}`;
          solvedProblems.add(problemId);
        }
      });
      solvedCount = solvedProblems.size;
    }

    // Fetch rating history
    const ratingResponse = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`, {
      timeout: 10000
    });

    const history: Array<{ date: string; rating: number; rank: number; contestName: string }> = [];
    
    if (ratingResponse.data?.status === 'OK') {
      const ratingChanges: CodeforcesRatingChange[] = ratingResponse.data.result || [];
      // Get last 10 contests
      const recentChanges = ratingChanges.slice(-10);
      
      recentChanges.forEach((change) => {
        history.push({
          date: new Date(change.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0],
          rating: change.newRating,
          rank: change.rank,
          contestName: change.contestName
        });
      });
    }

    // Fetch recent submissions (last 20)
    const recentSubmissions: Array<{
      id: number;
      problemName: string;
      verdict: string;
      language: string;
      time: string;
    }> = [];

    if (submissionsResponse.data?.status === 'OK') {
      const submissions: CodeforcesSubmission[] = submissionsResponse.data.result || [];
      const recent = submissions.slice(0, 20);

      recent.forEach((sub) => {
        const submissionTime = new Date(sub.creationTimeSeconds * 1000);
        const now = new Date();
        const diffMs = now.getTime() - submissionTime.getTime();
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
          const diffWeeks = Math.floor(diffDays / 7);
          timeStr = `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
        }

        recentSubmissions.push({
          id: sub.id,
          problemName: sub.problem.name,
          verdict: sub.verdict,
          language: sub.programmingLanguage,
          time: timeStr
        });
      });
    }

    const result = {
      handle: user.handle,
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'Newbie',
      maxRank: user.maxRank || 'Newbie',
      solvedCount,
      history,
      recentSubmissions
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Codeforces API Error:', error.message);
    
    if (error.response?.status === 400) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch Codeforces data' });
  }
}
