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

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid username parameter' });
  }

  try {
    // Use Vercel's auto-provided GitHub token if available, otherwise use no auth
    const token = process.env.GITHUB_TOKEN || '';
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CodeBase-Dashboard'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fetch user info
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, {
      headers,
      timeout: 10000
    });

    const user = userResponse.data;

    // Fetch user repos (top by stars)
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?sort=stars&per_page=10`, {
      headers,
      timeout: 10000
    });

    const topRepos = reposResponse.data.slice(0, 4).map((repo: any) => ({
      name: repo.name,
      stars: repo.stargazers_count,
      language: repo.language || 'Unknown',
      url: repo.html_url
    }));

    // Fetch contribution activity (using GitHub GraphQL would be better, but REST API is simpler)
    // We'll calculate based on events API
    const eventsResponse = await axios.get(`https://api.github.com/users/${username}/events/public?per_page=100`, {
      headers,
      timeout: 10000
    });

    const events = eventsResponse.data || [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let contributionsThisWeek = 0;
    let totalContributionsLastYear = 0;

    events.forEach((event: any) => {
      const eventDate = new Date(event.created_at);
      
      if (['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'IssueCommentEvent'].includes(event.type)) {
        if (eventDate >= oneYearAgo) {
          totalContributionsLastYear++;
        }
        if (eventDate >= oneWeekAgo) {
          contributionsThisWeek++;
        }
      }
    });

    // Calculate streak (simplified - based on consecutive days with events)
    const eventDates = new Set(
      events
        .filter((e: any) => ['PushEvent', 'PullRequestEvent'].includes(e.type))
        .map((e: any) => new Date(e.created_at).toISOString().split('T')[0])
    );

    let streak = 0;
    let currentDate = new Date();
    
    while (streak < 365) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (eventDates.has(dateStr)) {
        streak++;
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    const result = {
      username: user.login,
      contributionsThisWeek,
      streak,
      totalContributionsLastYear: totalContributionsLastYear || user.public_repos * 3, // Fallback estimate
      topRepos
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('GitHub API Error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ error: 'GitHub API rate limit exceeded' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch GitHub data' });
  }
}
