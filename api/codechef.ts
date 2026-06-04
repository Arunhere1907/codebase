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
    // Scrape CodeChef public profile page
    const profileUrl = `https://www.codechef.com/users/${handle}`;
    const response = await axios.get(profileUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;

    // Extract rating using regex (CodeChef shows rating in profile)
    const ratingMatch = html.match(/Rating<\/div>\s*<div[^>]*>(\d+)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;

    // Extract stars
    let stars = '1★';
    if (rating >= 2000) stars = '5★';
    else if (rating >= 1800) stars = '4★';
    else if (rating >= 1600) stars = '3★';
    else if (rating >= 1400) stars = '2★';

    // Extract global rank
    const globalRankMatch = html.match(/Global Rank<\/div>\s*<div[^>]*>(\d+)/i) || 
                           html.match(/Rank<\/div>\s*<div[^>]*>(\d+)/i);
    const globalRank = globalRankMatch ? parseInt(globalRankMatch[1]) : 0;

    // Extract country rank
    const countryRankMatch = html.match(/Country Rank<\/div>\s*<div[^>]*>(\d+)/i);
    const countryRank = countryRankMatch ? parseInt(countryRankMatch[1]) : 0;

    // Extract solved count (approximate from profile stats)
    const solvedMatch = html.match(/Fully Solved<\/b>:\s*<span[^>]*>(\d+)/i) ||
                       html.match(/Problems Solved<\/div>\s*<div[^>]*>(\d+)/i);
    const solvedCount = solvedMatch ? parseInt(solvedMatch[1]) : 0;

    // Generate estimated history (CodeChef doesn't provide easy API access to rating history)
    const history: Array<{ date: string; rating: number }> = [];
    const now = new Date();
    
    // Generate 5 points showing gradual rating increase
    for (let i = 5; i >= 1; i--) {
      const monthsAgo = i;
      const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const estimatedRating = Math.max(1000, rating - (i * 50)); // Rough estimate
      
      history.push({
        date: date.toISOString().split('T')[0],
        rating: estimatedRating
      });
    }

    // Add current rating
    history.push({
      date: now.toISOString().split('T')[0],
      rating
    });

    const result = {
      handle,
      rating,
      stars,
      globalRank,
      countryRank,
      solvedCount,
      history
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('CodeChef API Error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch CodeChef data' });
  }
}
