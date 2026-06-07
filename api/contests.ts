import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

/**
 * Serverless API endpoint that aggregates upcoming programming contests
 * from multiple sources:
 * 
 * 1. Codeforces Official API (direct)
 * 2. Kontests.net API (LeetCode, CodeChef, AtCoder, HackerRank, GeeksForGeeks)
 * 
 * Returns a unified, sorted list of upcoming contests.
 */

interface Contest {
  id: string;
  platform: 'CF' | 'LC' | 'CC' | 'AC' | 'HR' | 'GFG';
  name: string;
  startTime: string; // ISO string
  durationSeconds: number;
  registrationUrl: string;
}

interface KontestsContest {
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string; // duration in seconds as string
  site: string;
  in_24_hours: string;
  status: string;
}

// Map Kontests site names to our platform codes
const KONTESTS_PLATFORM_MAP: Record<string, Contest['platform']> = {
  'CodeForces': 'CF',
  'CodeForces::Gym': 'CF',
  'LeetCode': 'LC',
  'CodeChef': 'CC',
  'AtCoder': 'AC',
  'HackerRank': 'HR',
  'GeeksforGeeks': 'GFG',
};

// Map platform codes to Kontests API endpoint slugs
const KONTESTS_ENDPOINTS: Record<string, string> = {
  LC: 'leet_code',
  CC: 'code_chef',
  AC: 'at_coder',
  HR: 'hacker_rank',
  GFG: 'geeks_for_geeks',
};

// Map platform codes to registration URLs (fallback)
const PLATFORM_URLS: Record<string, string> = {
  CF: 'https://codeforces.com/contests',
  LC: 'https://leetcode.com/contest/',
  CC: 'https://www.codechef.com/contests',
  AC: 'https://atcoder.jp/contests',
  HR: 'https://www.hackerrank.com/contests',
  GFG: 'https://www.geeksforgeeks.org/events',
};

async function fetchCodeforcesContests(): Promise<Contest[]> {
  try {
    const response = await axios.get('https://codeforces.com/api/contest.list', {
      timeout: 10000,
    });

    if (response.data?.status !== 'OK') return [];

    const list = response.data.result;
    return list
      .filter((c: any) => c.phase === 'BEFORE')
      .map((c: any) => ({
        id: `cf-${c.id}`,
        platform: 'CF' as const,
        name: c.name,
        startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
        durationSeconds: c.durationSeconds,
        registrationUrl: `https://codeforces.com/contest/${c.id}`,
      }));
  } catch (err) {
    console.warn('Codeforces contest fetch failed:', (err as Error).message);
    return [];
  }
}

async function fetchKontestsForPlatform(platformCode: string): Promise<Contest[]> {
  const slug = KONTESTS_ENDPOINTS[platformCode];
  if (!slug) return [];

  try {
    const response = await axios.get<KontestsContest[]>(
      `https://kontests.net/api/v1/${slug}`,
      { timeout: 10000 }
    );

    const now = Date.now();

    return response.data
      .filter((c) => {
        // Only include upcoming contests (not already ended)
        const endTime = new Date(c.end_time).getTime();
        return endTime > now;
      })
      .map((c, idx) => {
        const durationSecs = parseInt(c.duration, 10) || 0;
        const startTimeISO = new Date(c.start_time).toISOString();

        return {
          id: `${platformCode.toLowerCase()}-kontests-${idx}-${Date.now()}`,
          platform: platformCode as Contest['platform'],
          name: c.name,
          startTime: startTimeISO,
          durationSeconds: durationSecs,
          registrationUrl: c.url || PLATFORM_URLS[platformCode] || '',
        };
      });
  } catch (err) {
    console.warn(`Kontests fetch for ${platformCode} failed:`, (err as Error).message);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Cache the response for 10 minutes to avoid hammering upstream APIs
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Fetch from all sources in parallel
    const [cfContests, lcContests, ccContests, acContests, hrContests, gfgContests] =
      await Promise.all([
        fetchCodeforcesContests(),
        fetchKontestsForPlatform('LC'),
        fetchKontestsForPlatform('CC'),
        fetchKontestsForPlatform('AC'),
        fetchKontestsForPlatform('HR'),
        fetchKontestsForPlatform('GFG'),
      ]);

    let combined: Contest[] = [
      ...cfContests,
      ...lcContests,
      ...ccContests,
      ...acContests,
      ...hrContests,
      ...gfgContests,
    ];

    // Sort by start time ascending
    combined.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Limit to a reasonable number
    combined = combined.slice(0, 50);

    return res.status(200).json({
      contests: combined,
      fetchedAt: new Date().toISOString(),
      sources: {
        codeforces: cfContests.length,
        leetcode: lcContests.length,
        codechef: ccContests.length,
        atcoder: acContests.length,
        hackerrank: hrContests.length,
        geeksforgeeks: gfgContests.length,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Contests API Error:', err.message);

    return res.status(500).json({
      error: 'Failed to fetch contest data',
      detail: err.message || 'Unknown error',
    });
  }
}
