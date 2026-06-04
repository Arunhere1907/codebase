# Quick Start Guide - Real Platform Data Fetching

**Goal:** Remove dummy data and implement real API fetching in ~5-6 hours

---

## Prerequisites

✅ Vercel account connected to GitHub repository  
✅ Firebase project configured  
✅ Node.js and npm installed  
✅ Git repository initialized  

---

## Step-by-Step Implementation

### Step 1: Remove Dummy Data (30 minutes)

**File:** `src/store.ts`

1. **Find and comment out `generateSampleStats()` function** (around line 170-345):
```typescript
// DEPRECATED: This function generated fake sample stats for demo purposes
// Now we fetch real data from platform APIs via Vercel serverless functions
/*
const generateSampleStats = (usernames: UserSettings['usernames']): DashboardStats => {
  // ... entire function commented out
};
*/
```

2. **Verify `initialSettings` has empty usernames** (around line 411-421):
```typescript
const initialSettings: UserSettings = {
  usernames: {
    codeforces: '',    // ✅ Must be empty string
    leetcode: '',      // ✅ Must be empty string
    codechef: '',      // ✅ Must be empty string
    atcoder: '',       // ✅ Must be empty string
    github: ''         // ✅ Must be empty string
  },
  theme: 'dark',
  contestReminders: true,
  refreshInterval: 15,
  defaultReminderTime: 60
};
```

3. **Verify `refreshStats()` function** calls real APIs (around line 750+):
   - Should already be calling `/api/codeforces`, `/api/leetcode`, etc.
   - Ensure no fallback to `generateSampleStats()`
   - Sets platform data to `null` on failure (not dummy data)

**Test:**
```bash
npm run dev
# Open http://localhost:5173
# All platforms should show "Not Configured" or loading
```

---

### Step 2: Review API Routes (30 minutes)

**Files:** `api/*.ts`

**Already Complete:**
- ✅ `api/codeforces.ts` - Working
- ✅ `api/github.ts` - Working

**Need Review:**
- `api/leetcode.ts`
- `api/codechef.ts`
- `api/atcoder.ts`

**Quick Test Each API:**
```bash
# Start dev server
npm run dev

# In another terminal, test APIs
curl "http://localhost:3000/api/codeforces?handle=tourist"
curl "http://localhost:3000/api/github?username=torvalds"
curl "http://localhost:3000/api/leetcode?handle=YOUR_USERNAME"
curl "http://localhost:3000/api/codechef?handle=YOUR_HANDLE"
curl "http://localhost:3000/api/atcoder?handle=YOUR_HANDLE"
```

**If API fails:**
1. Check console for errors
2. Verify API endpoint URL
3. Check response format matches TypeScript interface
4. Add CORS headers if missing
5. Add timeout handling

---

### Step 3: Add Empty States to UI (45 minutes)

**File:** `src/components/ProfileSection.tsx`

**Add helper functions at the top:**
```typescript
// Helper to check if platform is configured
const isPlatformConfigured = (username: string | undefined): boolean => {
  return !!username && username.trim() !== '';
};

// Helper to check if platform has data
const hasPlatformData = (data: any): boolean => {
  return data !== null && data !== undefined;
};
```

**Update platform card rendering:**
```typescript
const platformsList: Array<{ /* ... */ }> = [
  {
    id: 'Codeforces',
    name: 'Codeforces',
    handle: cfData?.handle || settings.usernames.codeforces || 'Not Configured',
    rating: cfData?.rating || 'Unrated',
    rank: cfData?.rank || 'Newbie',
    solved: cfData?.solvedCount || 0,
    // ... rest of config
  },
  // ... other platforms
];

// In the render, add conditional rendering:
{platformsList.map((platform) => {
  const isConfigured = isPlatformConfigured(settings.usernames[platform.id.toLowerCase()]);
  const hasData = hasPlatformData(stats?.[platform.id.toLowerCase()]);
  
  return (
    <div key={platform.id}>
      {!isConfigured && (
        <div className="text-center py-8">
          <p className="text-gray-500">Not Configured</p>
          <button onClick={() => navigate('/settings')}>
            Go to Settings →
          </button>
        </div>
      )}
      
      {isConfigured && !hasData && !loading.stats && (
        <div className="text-center py-8">
          <p className="text-red-500">Unable to fetch data</p>
          <button onClick={() => refreshStats(true)}>
            Retry
          </button>
        </div>
      )}
      
      {isConfigured && hasData && (
        // Existing card rendering
      )}
    </div>
  );
})}
```

**Test all states:**
- Empty username → "Not Configured"
- Valid username → Real data
- Invalid username → "Unable to fetch"
- Loading → Skeleton cards

---

### Step 4: Environment Variables (15 minutes)

**1. Update `.env.example`:**
```bash
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# GitHub API Token (Optional - Vercel auto-provides)
GITHUB_TOKEN=your_github_personal_access_token

# Note: All other platforms use public APIs (no tokens needed)
```

**2. Verify `.gitignore`:**
```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

**3. Check no secrets in code:**
```bash
# Search for potential secrets
git grep -i "api.key"
git grep -i "token"
git grep -i "secret"

# Should only find references to env vars like process.env.GITHUB_TOKEN
```

---

### Step 5: Deploy to Vercel (30 minutes)

**1. Push to GitHub:**
```bash
git add .
git commit -m "feat: implement real platform data fetching"
git push origin main
```

**2. Configure Vercel:**
- Go to https://vercel.com/dashboard
- Find your project
- Go to Settings → Environment Variables
- Add each variable from `.env.example`
- Select "Production", "Preview", "Development"
- Save

**3. Trigger Deployment:**
- Vercel auto-deploys on push
- Or manually trigger from dashboard
- Wait for build to complete

**4. Verify Production:**
- Open your Vercel URL
- Go to Settings
- Configure real usernames
- Go to Profiles
- Verify real data appears
- Check browser console for errors

---

### Step 6: Test Everything (30 minutes)

**Test Matrix:**

| Scenario | Expected Result | ✅/❌ |
|----------|----------------|------|
| All usernames empty | Show "Not Configured" for all | |
| Valid Codeforces username | Fetch real CF data | |
| Valid GitHub username | Fetch real GH data | |
| Invalid username | Show "Unable to fetch" | |
| Mix of valid/invalid | Show mixed states | |
| Reload page | Settings persist | |
| Force refresh | Data updates | |
| Wait 15 min | Auto-refresh on visit | |
| Network offline | Show cached or error | |
| Production deployment | Everything works | |

**How to Test:**

1. **Local Testing:**
```bash
npm run dev
# Test all scenarios above
```

2. **Production Testing:**
```bash
# Visit your Vercel URL
# Test all scenarios again
# Check Network tab for API calls
# Check Console for errors
```

3. **Platform-Specific Testing:**
```bash
# Use these public accounts for testing:
Codeforces: tourist, Petr, Benq
GitHub: torvalds, gaearon, facebook
LeetCode: (your own username)
CodeChef: (your own handle)
AtCoder: (your own handle)
```

---

## Quick Fixes for Common Issues

### Issue: Settings reset to empty on reload
**Fix:** Check `initialSettings` in `src/store.ts` - should have empty strings, not dummy usernames

### Issue: API returns 404 but username is valid
**Fix:** 
- Check API route file for correct endpoint URL
- Verify username format (some platforms have specific rules)
- Test API directly with curl

### Issue: CORS error in production
**Fix:** Add CORS headers to API route:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### Issue: GitHub rate limit exceeded
**Fix:** Add `GITHUB_TOKEN` environment variable in Vercel dashboard

### Issue: Build fails on Vercel
**Fix:**
- Check TypeScript errors in terminal
- Verify all imports exist
- Check `package.json` has all dependencies

### Issue: Data shows but is wrong
**Fix:**
- Check API response format
- Verify TypeScript interfaces match actual data
- Console.log API response to debug

---

## Rollback Plan

If something goes wrong:

**Option 1: Quick Rollback (5 minutes)**
```bash
# Revert last commit
git revert HEAD
git push origin main

# Vercel auto-deploys the revert
```

**Option 2: Restore Dummy Data (10 minutes)**
```typescript
// In store.ts, uncomment generateSampleStats()
// Add fallback to refreshStats():

if (!cfStats && usernames.codeforces) {
  cfStats = generateSampleStats(usernames).codeforces;
}
// Repeat for other platforms
```

**Option 3: Deploy Previous Version**
- Go to Vercel Dashboard
- Find previous deployment
- Click "Promote to Production"

---

## Validation Checklist

Before marking as complete:

**Functionality:**
- [ ] All configured platforms fetch real data
- [ ] No dummy data shown anywhere
- [ ] Empty usernames show "Not Configured"
- [ ] Invalid usernames show "Unable to fetch"
- [ ] Settings persist on reload
- [ ] Force refresh works
- [ ] Cache TTL works

**Security:**
- [ ] No `.env` files in git
- [ ] All secrets in Vercel env vars
- [ ] No hardcoded tokens in code
- [ ] `.env.example` documented

**Performance:**
- [ ] Parallel fetch <3 seconds
- [ ] Cache reduces API calls
- [ ] UI doesn't freeze during fetch
- [ ] Loading states visible

**User Experience:**
- [ ] Loading skeletons work
- [ ] Error messages clear
- [ ] Empty states intuitive
- [ ] Refresh button responsive

**Deployment:**
- [ ] Vercel build succeeds
- [ ] Production URL works
- [ ] All API routes work in prod
- [ ] No console errors

---

## Success! What's Next?

Once all tests pass:

1. **Update README.md:**
   - Remove references to "demo data"
   - Add section on configuring usernames
   - Document platform support

2. **User Documentation:**
   - Create guide for end users
   - Explain how to get platform usernames
   - Troubleshooting common issues

3. **Future Enhancements:**
   - OAuth for LeetCode/CodeChef
   - Server-side caching
   - Real-time updates
   - Historical data tracking

---

## Time Tracking

Track your time for each phase:

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Phase 1: Remove dummy data | 30 min | ___ min | |
| Phase 2: Review APIs | 30 min | ___ min | |
| Phase 3: UI updates | 45 min | ___ min | |
| Phase 4: Env vars | 15 min | ___ min | |
| Phase 5: Deploy | 30 min | ___ min | |
| Phase 6: Testing | 30 min | ___ min | |
| **Total** | **3 hours** | **___ hours** | |

*(Full spec estimates 5-6 hours with all phases)*

---

## Getting Help

**Stuck? Try these:**

1. Read the detailed spec files:
   - [requirements.md](./requirements.md) - What we're building
   - [spec.md](./spec.md) - How to build it
   - [tasks.md](./tasks.md) - Detailed task breakdown

2. Check existing API files:
   - `api/codeforces.ts` ✅ Working example
   - `api/github.ts` ✅ Working example

3. Test incrementally:
   - Test each change before moving to next
   - Use console.log for debugging
   - Test both local and production

4. Common debugging:
```typescript
// In store.ts refreshStats()
console.log('Fetching stats for:', usernames);
console.log('API response:', cfStats, lcStats, etc.);
console.log('Final stats object:', freshStats);
```

---

**Ready to start? Begin with Step 1! 🚀**
