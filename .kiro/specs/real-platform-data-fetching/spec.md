# Real Platform Data Fetching Implementation

**Status:** Draft  
**Created:** 2026-06-04  
**Owner:** User  
**Priority:** High

---

## Overview

Transform the CodeBase Dashboard from using dummy/sample data to fetching real competitive programming statistics from platform APIs. The implementation must be GitHub-safe (no secrets in repo), use Vercel serverless functions (free tier), support optional platforms, and handle authentication requirements.

**Current State:**
- App uses `generateSampleStats()` function that returns hardcoded demo data
- Settings can be configured but data shown is fake
- API route handlers exist in `/api/*.ts` but frontend still uses dummy data
- Vercel deployment configured with `vercel.json`

**Target State:**
- Real data fetched from platform APIs via Vercel serverless functions
- No dummy data generation
- Empty states shown for unconfigured platforms
- Settings persist correctly (no reset to dummy values)
- All secrets managed via Vercel environment variables
- Safe to push to GitHub (no credentials in code)

---

## Design

### 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  store.ts: refreshStats() function                     │ │
│  │  • Detects configured usernames                        │ │
│  │  • Calls /api/* routes in parallel                     │ │
│  │  • Handles null responses gracefully                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            Vercel Serverless Functions (/api/*)              │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │ codeforces.ts│  leetcode.ts │  codechef.ts │ atcoder.ts│ │
│  │  github.ts   │              │              │          │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│  • CORS enabled                                             │
│  • Timeout handling (15s max)                               │
│  • Error handling with proper status codes                  │
│  • Uses environment variables for auth tokens               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              External Platform APIs (Free)                   │
│  • Codeforces: Public REST API (no auth)                   │
│  • GitHub: REST API (Vercel auto-token or public)          │
│  • AtCoder: Kenkoooo API (community, free)                 │
│  • CodeChef: Public profile scraping                        │
│  • LeetCode: Community GraphQL API (optional)               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Data Flow

**On Settings Save:**
1. User enters platform usernames in Settings page
2. `updateSettings()` called with new usernames
3. Settings saved to Firestore (if logged in) or localStorage (if guest)
4. `refreshStats(true)` triggered to fetch fresh data immediately

**On Stats Refresh:**
1. Check loading state (prevent duplicate requests)
2. Check TTL cache (skip if fresh and not forced)
3. Build parallel fetch promises only for configured platforms
4. Call `/api/{platform}?handle={username}` for each platform
5. Wait for all promises with `Promise.allSettled()` (failures don't block others)
6. Store results in `DashboardStats` with nulls for failed/unconfigured platforms
7. Cache to localStorage
8. Update UI with loading states cleared

**On Page Load:**
1. Check localStorage cache
2. Validate TTL (default 15 minutes)
3. If expired or missing, trigger refresh
4. Show loading skeletons during fetch
5. Display data or empty states based on results

### 3. Component Architecture

**Modified Files:**
- `src/store.ts` - Remove `generateSampleStats()`, update `refreshStats()`
- `src/components/ProfileSection.tsx` - Add empty state handling
- `src/components/OverviewSection.tsx` - Handle null platform data
- `src/components/SettingsSection.tsx` - Already correct (no changes needed)

**API Files (Already Exist):**
- `api/codeforces.ts` ✅ Implemented
- `api/github.ts` ✅ Implemented
- `api/leetcode.ts` - Needs review/update
- `api/codechef.ts` - Needs review/update
- `api/atcoder.ts` - Needs review/update

### 4. API Design Specifications

#### 4.1 Codeforces API (`/api/codeforces`)
**Status:** ✅ Already implemented
**Endpoint:** `GET /api/codeforces?handle={username}`
**Authentication:** None required (public API)
**Response Format:**
```typescript
{
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  solvedCount: number;
  history: Array<{ date: string; rating: number; rank: number; contestName: string }>;
  recentSubmissions: Array<{ id: number; problemName: string; verdict: string; language: string; time: string }>;
}
```

#### 4.2 GitHub API (`/api/github`)
**Status:** ✅ Already implemented
**Endpoint:** `GET /api/github?username={username}`
**Authentication:** Uses `GITHUB_TOKEN` env var (Vercel auto-provides or optional)
**Response Format:**
```typescript
{
  username: string;
  contributionsThisWeek: number;
  streak: number;
  totalContributionsLastYear: number;
  topRepos: Array<{ name: string; stars: number; language: string; url: string }>;
}
```

#### 4.3 LeetCode API (`/api/leetcode`)
**Endpoint:** `GET /api/leetcode?handle={username}`
**Authentication:** None (uses community GraphQL API)
**Data Source:** `https://leetcode-stats-api.herokuapp.com/{username}` or LeetCode GraphQL
**Response Format:**
```typescript
{
  handle: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  streak: number;
  contestRating: number;
  badges: string[];
  history: Array<{ date: string; rating: number }>;
}
```

#### 4.4 CodeChef API (`/api/codechef`)
**Endpoint:** `GET /api/codechef?handle={username}`
**Authentication:** None (public profile scraping)
**Data Source:** Parse HTML from `https://www.codechef.com/users/{username}`
**Response Format:**
```typescript
{
  handle: string;
  rating: number;
  stars: string;
  globalRank: number;
  countryRank: number;
  solvedCount: number;
  history: Array<{ date: string; rating: number }>;
}
```

#### 4.5 AtCoder API (`/api/atcoder`)
**Endpoint:** `GET /api/atcoder?handle={username}`
**Authentication:** None (uses Kenkoooo community API)
**Data Source:** `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user={username}`
**Response Format:**
```typescript
{
  handle: string;
  rating: number;
  highestRating: number;
  rank: number;
  solvedCount: number;
  history: Array<{ date: string; rating: number }>;
}
```

### 5. Error Handling Strategy

**API Layer:**
- Return 400 for invalid parameters
- Return 404 for user not found
- Return 403 for rate limit exceeded
- Return 500 for unexpected errors
- Include descriptive error messages in JSON response

**Frontend Layer:**
- Log warnings to console (don't throw errors)
- Set platform data to `null` on failure
- Continue fetching other platforms
- Show "Unable to fetch" message in UI
- Allow manual retry with refresh button

**Empty States:**
- Show "Not Configured" when username is empty
- Show "Link to Settings" button
- Show "Unable to fetch" when API fails
- Show "Last synced: {time}" when data exists

### 6. Environment Variables

**GitHub Safe Setup:**
- All API keys stored as Vercel environment variables
- `.env.example` documents required variables
- `.gitignore` includes `.env` and `.env.local`
- No secrets committed to repository

**Required Variables (Optional):**
```bash
GITHUB_TOKEN=         # Optional: Vercel auto-provides, or use for higher rate limits
# All other platforms use public APIs (no tokens needed)
```

**Firebase Variables (Existing):**
```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 7. Performance Considerations

**Caching Strategy:**
- Cache API responses in localStorage
- Default TTL: 15 minutes (configurable in settings)
- Force refresh option available
- Check TTL before making new requests

**Parallel Fetching:**
- Use `Promise.allSettled()` for concurrent platform fetches
- Don't block on individual platform failures
- 15-second timeout per platform API call
- Overall refresh completes even if some platforms fail

**Rate Limiting:**
- Respect platform rate limits
- Caching reduces API calls
- User-configurable refresh intervals (5/15/30/60 minutes)
- Warning message about decreasing refresh interval

### 8. Security Considerations

**GitHub Safety:**
- Never commit `.env` files
- Use Vercel environment variables UI
- Document all required env vars in `.env.example`
- Frontend uses `VITE_` prefix for client-exposed vars
- Backend uses direct `process.env` for server-only vars

**CORS Configuration:**
- Enable CORS in API routes with `Access-Control-Allow-Origin: *`
- Handle OPTIONS preflight requests
- Safe for public API consumption

**Data Privacy:**
- All platform data is public information
- No authentication credentials stored
- Firebase handles auth securely
- User data stored per-user in Firestore

### 9. UI/UX Design

**Empty States:**
```
┌─────────────────────────────────────┐
│  📊 Platform Not Configured         │
│                                     │
│  Configure your username in         │
│  Settings to see your stats here.   │
│                                     │
│  [ Go to Settings → ]               │
└─────────────────────────────────────┘
```

**Error States:**
```
┌─────────────────────────────────────┐
│  ⚠️  Unable to Fetch Data           │
│                                     │
│  Could not connect to platform      │
│  API. Try again later.              │
│                                     │
│  [ Retry ]                          │
└─────────────────────────────────────┘
```

**Loading States:**
- Skeleton cards during initial fetch
- Spinner on refresh button during refresh
- "Refreshing..." text on refresh button
- Disabled state on refresh button during fetch

**Success States:**
- Show all fetched data
- Display "Last synced: 5 minutes ago" timestamp
- Enable refresh button
- Update portfolio aggregates automatically

### 10. Testing Strategy

**Manual Testing Checklist:**
1. ✅ Configure valid usernames → Should fetch real data
2. ✅ Leave usernames empty → Should show "Not Configured"
3. ✅ Configure invalid usernames → Should show "Unable to fetch"
4. ✅ Reload page → Settings should persist (no reset to dummy values)
5. ✅ Wait for TTL expiry → Should auto-refresh on next visit
6. ✅ Force refresh → Should fetch immediately regardless of TTL
7. ✅ Test with one platform configured → Others show empty states
8. ✅ Test rate limiting → Should handle gracefully
9. ✅ Test network offline → Should show error states
10. ✅ Deploy to Vercel → Should work in production with env vars

**Platform-Specific Testing:**
- Codeforces: Test with handles like `tourist`, `Petr`, `Benq`
- GitHub: Test with handles like `torvalds`, `gaearon`, your own
- LeetCode: Test with valid LeetCode usernames
- CodeChef: Test with valid CodeChef handles
- AtCoder: Test with valid AtCoder handles

### 11. Deployment Workflow

**Step 1: Code Changes**
1. Remove `generateSampleStats()` function from `src/store.ts`
2. Update `refreshStats()` to call real API routes
3. Update UI components for empty/error states
4. Review and update API files if needed

**Step 2: GitHub Push**
1. Ensure `.env` is in `.gitignore`
2. Verify no secrets in code
3. Push to GitHub repository

**Step 3: Vercel Configuration**
1. Vercel auto-deploys from GitHub
2. Configure environment variables in Vercel UI:
   - Firebase vars (already configured)
   - GITHUB_TOKEN (optional, Vercel auto-provides)
3. Verify build succeeds
4. Test production deployment

**Step 4: Verification**
1. Visit deployed URL
2. Configure usernames in Settings
3. Verify real data appears
4. Test all platforms
5. Check browser console for errors

---

## Technical Debt & Future Enhancements

**Known Limitations:**
- LeetCode API is unreliable (community-maintained)
- CodeChef requires HTML scraping (no official API)
- GitHub API has rate limits without token
- AtCoder uses community API (Kenkoooo)

**Future OAuth Implementation:**
- LeetCode OAuth for reliable data
- CodeChef OAuth for official API access
- Platform-specific authentication flows
- Secure token storage in Firestore

**Future Performance Improvements:**
- Server-side caching (Redis on Vercel)
- Incremental data fetching (only changed data)
- WebSocket for real-time updates
- Service worker for offline support

---

## Dependencies

**Existing:**
- `axios` - HTTP client for API calls
- `zustand` - State management
- `firebase` - Authentication and data storage
- `@vercel/node` - Vercel serverless function types

**New (if needed):**
- `cheerio` - HTML parsing for CodeChef scraping (if not already installed)
- None required for core functionality

---

## Rollback Plan

If issues occur in production:

1. **Immediate Rollback:**
   - Revert to previous commit
   - Redeploy from Vercel dashboard
   - Users see dummy data again (previous behavior)

2. **Partial Rollback:**
   - Keep API routes but restore `generateSampleStats()` as fallback
   - Use dummy data when API calls fail
   - Gradual migration path

3. **Data Preservation:**
   - User settings stored in Firestore (not affected)
   - Problem logs stored separately (not affected)
   - Only stats display changes

---

## Success Criteria

✅ **Must Have:**
- Real data fetched from all configured platforms
- No dummy data generation
- Settings persist correctly (no reset)
- Empty states for unconfigured platforms
- Error handling for failed API calls
- GitHub-safe (no secrets in repo)
- Vercel deployment works with env vars
- All Firebase variables work as before

✅ **Should Have:**
- Loading states during fetch
- Manual refresh button works
- TTL caching reduces API calls
- Performance: <3s for parallel fetch
- Error messages are user-friendly

✅ **Nice to Have:**
- Retry button for failed platforms
- Last synced timestamp
- Platform-specific error messages
- Rate limit handling with backoff

---

## Timeline Estimate

- **Phase 1:** Remove dummy data, update store.ts (30 min)
- **Phase 2:** Review/update API files (30 min)
- **Phase 3:** Update UI components for empty/error states (45 min)
- **Phase 4:** Testing (all platforms, all scenarios) (30 min)
- **Phase 5:** Deploy to Vercel, verify production (15 min)

**Total:** ~2.5 hours

---

## Notes

- API files already exist in `/api/*.ts` directory
- Vercel configuration already set up in `vercel.json`
- Firebase integration already working
- Main work is removing dummy data and adding empty state handling
- GitHub token is automatically provided by Vercel for GitHub repos
