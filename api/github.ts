import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const ghUser = username.trim();

  try {
    const token = process.env.GITHUB_TOKEN || '';
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'CodeBase-Dashboard',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (token) {
      // Support both classic PAT (token) and fine-grained (Bearer) formats
      headers.Authorization = token.startsWith('ghp_') || token.startsWith('github_pat_')
        ? `Bearer ${token}`
        : `token ${token}`;
    }

    const userResponse = await axios.get(`https://api.github.com/users/${ghUser}`, {
      headers,
      timeout: 10000,
    });

    const user = userResponse.data;

    const reposResponse = await axios.get(
      `https://api.github.com/users/${ghUser}/repos?sort=stars&per_page=10`,
      { headers, timeout: 10000 }
    );

    const topRepos = (reposResponse.data || []).slice(0, 4).map((repo: {
      name: string;
      stargazers_count: number;
      language: string | null;
      html_url: string;
    }) => ({
      name: repo.name,
      stars: repo.stargazers_count,
      language: repo.language || 'Unknown',
      url: repo.html_url,
    }));

    let contributionsThisWeek = 0;
    let totalContributionsLastYear = 0;
    let streak = 0;

    try {
      const eventsResponse = await axios.get(
        `https://api.github.com/users/${ghUser}/events/public?per_page=100`,
        { headers, timeout: 10000 }
      );

      const events = eventsResponse.data || [];
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      events.forEach((event: { type: string; created_at: string }) => {
        const eventDate = new Date(event.created_at);
        if (['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'IssueCommentEvent'].includes(event.type)) {
          if (eventDate >= oneYearAgo) totalContributionsLastYear++;
          if (eventDate >= oneWeekAgo) contributionsThisWeek++;
        }
      });

      const eventDates = new Set(
        events
          .filter((e: { type: string }) => ['PushEvent', 'PullRequestEvent'].includes(e.type))
          .map((e: { created_at: string }) => new Date(e.created_at).toISOString().split('T')[0])
      );

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
    } catch {
      // Events API may fail for users with no public events — still return profile data
    }

    return res.status(200).json({
      username: user.login,
      contributionsThisWeek,
      streak,
      totalContributionsLastYear: totalContributionsLastYear || user.public_repos,
      topRepos,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number; data?: { message?: string } } };
    console.error('GitHub API Error:', err.message, err.response?.data);

    if (err.response?.status === 404) {
      return res.status(404).json({ error: `GitHub user "${ghUser}" not found` });
    }

    if (err.response?.status === 403) {
      const msg = err.response?.data?.message || 'Rate limit exceeded';
      return res.status(403).json({
        error: `GitHub API rate limit: ${msg}. Add GITHUB_TOKEN in Vercel env vars.`,
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch GitHub data',
      detail: err.message || 'Unknown error',
    });
  }
}
