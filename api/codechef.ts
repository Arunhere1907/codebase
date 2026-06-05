import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const CC_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/json,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

function starsFromRating(rating: number): string {
  if (rating >= 2200) return '7★';
  if (rating >= 2000) return '6★';
  if (rating >= 1800) return '5★';
  if (rating >= 1600) return '4★';
  if (rating >= 1400) return '3★';
  if (rating >= 1200) return '2★';
  if (rating > 0) return '1★';
  return 'Unrated';
}

function parseFromHtml(html: string) {
  let rating = 0;
  let solvedCount = 0;
  let globalRank = 0;
  let countryRank = 0;

  const ratingPatterns = [
    /class="rating-number[^"]*"[^>]*>\s*(\d+)/i,
    /"currentRating"\s*:\s*(\d+)/,
    /"rating"\s*:\s*(\d+)/,
    /Rating<\/div>\s*<div[^>]*>(\d+)/i,
  ];
  for (const pattern of ratingPatterns) {
    const match = html.match(pattern);
    if (match) {
      rating = parseInt(match[1], 10);
      if (rating > 0) break;
    }
  }

  const solvedPatterns = [
    /Total Problems Solved:\s*(\d+)/i,
    /"problemsSolved"\s*:\s*(\d+)/,
    /"total_problems_solved"\s*:\s*(\d+)/,
    /Fully Solved<\/b>:\s*<span[^>]*>(\d+)/i,
    /Problems Solved<\/div>\s*<div[^>]*>(\d+)/i,
  ];
  for (const pattern of solvedPatterns) {
    const match = html.match(pattern);
    if (match) {
      solvedCount = parseInt(match[1], 10);
      if (solvedCount > 0) break;
    }
  }

  const globalRankMatch = html.match(/Global Rank[^0-9]*(\d[\d,]*)/i);
  if (globalRankMatch) globalRank = parseInt(globalRankMatch[1].replace(/,/g, ''), 10);

  const countryRankMatch = html.match(/Country Rank[^0-9]*(\d[\d,]*)/i);
  if (countryRankMatch) countryRank = parseInt(countryRankMatch[1].replace(/,/g, ''), 10);

  // Parse __NEXT_DATA__ if present
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const pageProps = nextData?.props?.pageProps || {};
      const user = pageProps.user || pageProps.profile || pageProps.data || {};
      if (user.rating && !rating) rating = Number(user.rating);
      if (user.global_rank && !globalRank) globalRank = Number(user.global_rank);
      if (user.country_rank && !countryRank) countryRank = Number(user.country_rank);
      if (user.problems_solved && !solvedCount) solvedCount = Number(user.problems_solved);
    } catch {
      // ignore JSON parse errors
    }
  }

  return { rating, solvedCount, globalRank, countryRank };
}

async function fetchFromRatingsApi(handle: string) {
  const response = await axios.get(`https://www.codechef.com/api/ratings/${encodeURIComponent(handle)}`, {
    timeout: 12000,
    headers: {
      ...CC_HEADERS,
      Referer: `https://www.codechef.com/users/${handle}`,
      Origin: 'https://www.codechef.com',
    },
  });
  const data = response.data?.data || response.data || {};
  return {
    rating: Number(data.rating || data.current_rating || 0),
    solvedCount: Number(data.problems_solved || data.fully_solved || 0),
    globalRank: Number(data.global_rank || 0),
    countryRank: Number(data.country_rank || 0),
    history: data.rating_graph || data.history || [],
  };
}

async function fetchFromCompeteApi(handle: string) {
  const response = await axios.get(`https://competeapi.vercel.app/user/codechef/${encodeURIComponent(handle)}`, {
    timeout: 12000,
  });
  const data = response.data || {};
  const rating = Number(String(data.rating_number || data.rating || '').replace(/\D/g, '')) || 0;
  return {
    rating,
    solvedCount: 0,
    globalRank: Number(String(data.global_rank || '').replace(/\D/g, '')) || 0,
    countryRank: Number(String(data.country_rank || '').replace(/\D/g, '')) || 0,
    history: data.all_rating || {},
  };
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

  const ccHandle = handle.trim();
  let rating = 0;
  let solvedCount = 0;
  let globalRank = 0;
  let countryRank = 0;
  let rawHistory: unknown = null;
  let found = false;

  // Strategy 1: CodeChef ratings API
  try {
    const apiData = await fetchFromRatingsApi(ccHandle);
    rating = apiData.rating;
    solvedCount = apiData.solvedCount;
    globalRank = apiData.globalRank;
    countryRank = apiData.countryRank;
    rawHistory = apiData.history;
    found = true;
  } catch {
    // continue to next strategy
  }

  // Strategy 2: HTML profile scrape
  if (!found || (rating === 0 && solvedCount === 0)) {
    try {
      const htmlRes = await axios.get(`https://www.codechef.com/users/${encodeURIComponent(ccHandle)}`, {
        timeout: 15000,
        headers: CC_HEADERS,
      });
      if (htmlRes.status === 404) {
        return res.status(404).json({ error: `CodeChef user "${ccHandle}" not found` });
      }
      const parsed = parseFromHtml(String(htmlRes.data));
      if (parsed.rating > 0) rating = parsed.rating;
      if (parsed.solvedCount > 0) solvedCount = parsed.solvedCount;
      if (parsed.globalRank > 0) globalRank = parsed.globalRank;
      if (parsed.countryRank > 0) countryRank = parsed.countryRank;
      found = true;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 404) {
        return res.status(404).json({ error: `CodeChef user "${ccHandle}" not found` });
      }
    }
  }

  // Strategy 3: CompeteAPI fallback
  if (!found || rating === 0) {
    try {
      const compete = await fetchFromCompeteApi(ccHandle);
      if (compete.rating > 0) rating = compete.rating;
      if (compete.globalRank > 0) globalRank = compete.globalRank;
      if (compete.countryRank > 0) countryRank = compete.countryRank;
      if (!rawHistory && compete.history) rawHistory = compete.history;
      found = true;
    } catch {
      // continue
    }
  }

  if (!found) {
    return res.status(404).json({ error: `CodeChef user "${ccHandle}" not found` });
  }

  const history: Array<{ date: string; rating: number }> = [];
  if (rawHistory && typeof rawHistory === 'object') {
    Object.entries(rawHistory as Record<string, Array<{ rating: number; end_date?: string }>>).forEach(([, entries]) => {
      if (Array.isArray(entries)) {
        entries.slice(-5).forEach((entry) => {
          if (entry.rating && entry.end_date) {
            history.push({ date: entry.end_date.split(' ')[0], rating: entry.rating });
          }
        });
      }
    });
  }

  if (history.length === 0 && rating > 0) {
    history.push({ date: new Date().toISOString().split('T')[0], rating });
  }

  return res.status(200).json({
    handle: ccHandle,
    rating,
    stars: starsFromRating(rating),
    globalRank,
    countryRank,
    solvedCount,
    history,
  });
}
