/**
 * Vite dev-server middleware that runs Vercel API handlers locally.
 * In production, Vercel serves /api/* as serverless functions automatically.
 */
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PLATFORMS = ['codeforces', 'leetcode', 'codechef', 'atcoder', 'github', 'contests'] as const;

function parseQuery(url: string): VercelRequest['query'] {
  const parsed = new URL(url, 'http://localhost');
  const query: Record<string, string | string[]> = {};
  parsed.searchParams.forEach((value, key) => {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  });
  return query;
}

function wrapResponse(res: ServerResponse): VercelResponse {
  let statusCode = 200;
  const self = {
    setHeader: (key: string, value: string | string[]) => {
      res.setHeader(key, value);
      return self;
    },
    status: (code: number) => {
      statusCode = code;
      res.statusCode = code;
      return self;
    },
    json: (data: unknown) => {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = statusCode;
        res.end(JSON.stringify(data));
      }
    },
    end: (data?: string) => {
      if (!res.headersSent) {
        res.statusCode = statusCode;
        res.end(data);
      }
    },
  } as VercelResponse;
  return self;
}

export function apiDevPlugin(): Plugin {
  return {
    name: 'codebase-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const pathname = req.url.split('?')[0];
        const platform = pathname.replace('/api/', '');

        if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Unknown API route' }));
          return;
        }

        try {
          const module = await import(`../api/${platform}.ts`);
          const handler = module.default;
          const vercelReq = {
            method: req.method,
            query: parseQuery(req.url),
            headers: req.headers,
          } as VercelRequest;
          const vercelRes = wrapResponse(res);
          await handler(vercelReq, vercelRes);
        } catch (err) {
          console.error(`[api-dev] ${platform} error:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal dev API error' }));
          }
        }
      });
    },
  };
}
