# Implementation Tasks

## Phase 1: Remove Dummy Data & Fix Settings Persistence

### Task 1.1: Remove dummy data generation from store.ts
**Status:** Pending  
**Priority:** Critical  
**Estimated Time:** 15 minutes

**Description:**
Remove or comment out the `generateSampleStats()` function and all references to it in `src/store.ts`. This function currently returns hardcoded demo data.

**Acceptance Criteria:**
- [ ] `generateSampleStats()` function removed or commented out with clear deprecation note
- [ ] No calls to `generateSampleStats()` anywhere in the codebase
- [ ] Code compiles without errors

**Files to Modify:**
- `src/store.ts` (lines ~170-345 based on file reading)

---

### Task 1.2: Update refreshStats() to call real API routes
**Status:** Pending  
**Priority:** Critical  
**Estimated Time:** 30 minutes

**Description:**
Modify the `refreshStats()` function in `src/store.ts` to call real API endpoints instead of generating dummy data. The function already has the structure for calling APIs, so we need to ensure it's working correctly and remove any fallback to dummy data.

**Acceptance Criteria:**
- [ ] `refreshStats()` only calls `/api/*` endpoints (no dummy data fallback)
- [ ] Only fetches data for platforms with configured usernames
- [ ] Uses `Promise.allSettled()` for parallel fetching
- [ ] Handles null responses gracefully (sets platform data to null)
- [ ] Logs warnings for failed fetches (console.warn)
- [ ] Caches results to localStorage
- [ ] Updates portfolio aggregates correctly
- [ ] Respects TTL settings

**Implementation Details:**
```typescript
// Current structure already exists in store.ts around line 750+
// Key changes:
// 1. Remove any fallback to generateSampleStats()
// 2. Ensure null is set for failed/unconfigured platforms
// 3. Verify all 5 platforms are handled: CF, LC, CC, AC, GH
```

**Files to Modify:**
- `src/store.ts` (`refreshStats()` function)

---

### Task 1.3: Verify initialSettings has empty usernames
**Status:** Pending  
**Priority:** High  
**Estimated Time:** 5 minutes

**Description:**
Confirm that `initialSettings` in `src/store.ts` has empty strings for all platform usernames. This ensures settings don't reset to dummy values on reload.

**Acceptance Criteria:**
- [ ] `initialSettings.usernames` all set to empty strings (`''`)
- [ ] No hardcoded dummy usernames in initialSettings
- [ ] Settings persist correctly on page reload

**Files to Check:**
- `src/store.ts` (around line 411-421)

---

## Phase 2: Review and Update API Routes

### Task 2.1: Review existing API implementations
**Status:** Pending  
**Priority:** High  
**Estimated Time:** 15 minutes

**Description:**
Review all 5 API route files to ensure they follow the design spec, have proper error handling, CORS headers, and return the correct data structure.

**Acceptance Criteria:**
- [ ] All API files have CORS headers enabled
- [ ] All API files handle OPTIONS requests
- [ ] All API files have proper error handling (400, 404, 500)
- [ ] All API files have timeouts configured (~10-15 seconds)
- [ ] Response formats match TypeScript interfaces in `src/types.ts`

**Files to Review:**
- `api/codeforces.ts` ✅ (already reviewed - looks good)
- `api/github.ts` ✅ (already reviewed - looks good)
- `api/leetcode.ts`
- `api/codechef.ts`
- `api/atcoder.ts`

---

### Task 2.2: Update/fix LeetCode API if needed
**Status:** Pending  
**Priority:** Medium  
**Estimated Time:** 20 minutes

**Description:**
Review and update the LeetCode API handler to fetch real data from a reliable source. Consider using LeetCode's community GraphQL API or a third-party stats API.

**Acceptance Criteria:**
- [ ] Fetches real LeetCode user data
- [ ] Returns correct data structure matching `LeetCodeStats` interface
- [ ] Handles user not found (404)
- [ ] Handles API failures gracefully
- [ ] Has proper CORS headers
- [ ] Has timeout configured

**Data Sources (choose one):**
- LeetCode GraphQL API (official but may require auth)
- `https://leetcode-stats-api.herokuapp.com/{username}`
- `https://alfa-leetcode-api.onrender.com/{username}/solved`

**Files to Modify:**
- `api/leetcode.ts`

---

### Task 2.3: Update/fix CodeChef API if needed
**Status:** Pending  
**Priority:** Medium  
**Estimated Time:** 25 minutes

**Description:**
Review and update the CodeChef API handler. Since CodeChef doesn't have an official public API, we'll need to scrape public profile pages or use a third-party API if available.

**Acceptance Criteria:**
- [ ] Fetches real CodeChef user data
- [ ] Returns correct data structure matching `CodeChefStats` interface
- [ ] Handles user not found (404)
- [ ] Handles parsing errors gracefully
- [ ] Has proper CORS headers
- [ ] Has timeout configured

**Implementation Strategy:**
- Scrape `https://www.codechef.com/users/{username}`
- Use `cheerio` for HTML parsing (if available)
- Or use axios and regex for extracting data

**Files to Modify:**
- `api/codechef.ts`

---

### Task 2.4: Update/fix AtCoder API if needed
**Status:** Pending  
**Priority:** Medium  
**Estimated Time:** 20 minutes

**Description:**
Review and update the AtCoder API handler to use the Kenkoooo community API which provides structured data for AtCoder users.

**Acceptance Criteria:**
- [ ] Fetches real AtCoder user data
- [ ] Returns correct data structure matching `AtCoderStats` interface
- [ ] Handles user not found (404)
- [ ] Handles API failures gracefully
- [ ] Has proper CORS headers
- [ ] Has timeout configured

**Data Source:**
- `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user={username}`
- `https://kenkoooo.com/atcoder/resources/user.json`

**Files to Modify:**
- `api/atcoder.ts`

---

## Phase 3: Update Frontend UI Components

### Task 3.1: Add empty state handling to ProfileSection
**Status:** Pending  
**Priority:** High  
**Estimated Time:** 30 minutes

**Description:**
Update `ProfileSection.tsx` to show appropriate empty states when platforms are not configured or when API calls fail.

**Acceptance Criteria:**
- [ ] Shows "Not Configured" when username is empty
- [ ] Shows "Link to Settings" button for unconfigured platforms
- [ ] Shows "Unable to fetch" when API returns null/error
- [ ] Shows "Retry" button for failed fetches
- [ ] Shows loading skeletons during initial fetch
- [ ] Shows last synced timestamp when data exists
- [ ] Handles all 5 platforms (CF, LC, CC, AC, GH)

**UI States to Handle:**
1. **Not Configured:** `!settings.usernames.{platform} || settings.usernames.{platform} === ''`
2. **Loading:** `loading.stats === true && !stats`
3. **Error:** `stats?.{platform} === null && settings.usernames.{platform} !== ''`
4. **Success:** `stats?.{platform} !== null`

**Files to Modify:**
- `src/components/ProfileSection.tsx`

---

### Task 3.2: Add empty state handling to OverviewSection
**Status:** Pending  
**Priority:** Medium  
**Estimated Time:** 20 minutes

**Description:**
Update `OverviewSection.tsx` to handle null platform data gracefully and show appropriate messages or skip unconfigured platforms in aggregated views.

**Acceptance Criteria:**
- [ ] Handles null platform data without crashing
- [ ] Shows meaningful messages when no platforms configured
- [ ] Aggregated stats only count configured platforms
- [ ] Shows "Configure platforms in Settings" message if nothing configured
- [ ] Loading states work correctly

**Files to Modify:**
- `src/components/OverviewSection.tsx`

---

### Task 3.3: Verify SettingsSection is correct
**Status:** Pending  
**Priority:** Low  
**Estimated Time:** 5 minutes

**Description:**
Review `SettingsSection.tsx` to ensure it correctly handles empty usernames and doesn't have any hardcoded dummy values.

**Acceptance Criteria:**
- [ ] Input fields accept empty strings
- [ ] Placeholders shown for empty fields
- [ ] Save button triggers `updateSettings()`
- [ ] No hardcoded dummy usernames in component state

**Files to Review:**
- `src/components/SettingsSection.tsx` ✅ (already reviewed - looks good)

---

## Phase 4: Environment Variables & GitHub Safety

### Task 4.1: Update .env.example with required variables
**Status:** Pending  
**Priority:** High  
**Estimated Time:** 10 minutes

**Description:**
Update `.env.example` to document all environment variables needed for the application, including Firebase and GitHub token.

**Acceptance Criteria:**
- [ ] All Firebase variables documented (already present)
- [ ] GitHub token documented as optional
- [ ] Clear comments explaining each variable
- [ ] Notes about Vercel auto-providing GitHub token

**File Content:**
```bash
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# GitHub API Token (Optional)
# Vercel automatically provides this for GitHub-linked projects
# You can also set it manually for higher rate limits
GITHUB_TOKEN=your_github_personal_access_token

# Note: All other platforms (Codeforces, LeetCode, CodeChef, AtCoder)
# use public APIs that don't require authentication tokens
```

**Files to Modify:**
- `.env.example`

---

### Task 4.2: Verify .gitignore excludes secrets
**Status:** Pending  
**Priority:** Critical  
**Estimated Time:** 5 minutes

**Description:**
Ensure `.gitignore` properly excludes environment files and no secrets are committed to the repository.

**Acceptance Criteria:**
- [ ] `.env` is in `.gitignore`
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.*.local` patterns are in `.gitignore`
- [ ] No hardcoded API keys or tokens in any code files
- [ ] No `.env` files tracked by git

**Files to Check:**
- `.gitignore`

---

### Task 4.3: Document Vercel deployment steps
**Status:** Pending  
**Priority:** Medium  
**Estimated Time:** 15 minutes

**Description:**
Update `DEPLOYMENT.md` with clear instructions for setting up environment variables in Vercel.

**Acceptance Criteria:**
- [ ] Step-by-step guide for Vercel environment variables
- [ ] List of all required variables
- [ ] Screenshot or description of Vercel settings UI
- [ ] Notes about GitHub token auto-provision
- [ ] Troubleshooting section

**Files to Modify:**
- `DEPLOYMENT.md`

---

## Phase 5: Testing & Validation

### Task 5.1: Local testing with real usernames
**Status:** Pending  
**Priority:** High  
**Estimated Time:** 30 minutes

**Description:**
Test the application locally with real platform usernames to ensure data fetching works correctly.

**Test Cases:**
1. Configure valid usernames for all platforms → Should fetch real data
2. Leave all usernames empty → Should show "Not Configured" for all
3. Configure only Codeforces → Should fetch CF data, others show empty
4. Configure invalid username → Should show "Unable to fetch" error
5. Reload page → Settings should persist
6. Wait for TTL expiry → Should auto-refresh on next visit
7. Force refresh → Should fetch immediately
8. Test offline → Should show cached data or errors

**Test Usernames (Public Accounts):**
- Codeforces: `tourist`, `Petr`, `Benq`
- GitHub: `torvalds`, `gaearon`
- LeetCode: Test with valid usernames
- CodeChef: Test with valid handles
- AtCoder: Test with valid handles

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] No console errors
- [ ] Loading states work
- [ ] Error states work
- [ ] Empty states work
- [ ] Data displays correctly

---

### Task 5.2: Verify API route functionality
**Status:** Pending  
**Priority:** High  
**Estimated Time:** 20 minutes

**Description:**
Test each API route individually using curl or Postman to ensure they return correct data.

**Test Commands:**
```bash
# Test Codeforces
curl "http://localhost:3000/api/codeforces?handle=tourist"

# Test GitHub
curl "http://localhost:3000/api/github?username=torvalds"

# Test LeetCode
curl "http://localhost:3000/api/leetcode?handle={valid_username}"

# Test CodeChef
curl "http://localhost:3000/api/codechef?handle={valid_handle}"

# Test AtCoder
curl "http://localhost:3000/api/atcoder?handle={valid_handle}"
```

**Acceptance Criteria:**
- [ ] All API routes respond with 200 OK for valid users
- [ ] All API routes respond with 404 for invalid users
- [ ] Response data matches TypeScript interfaces
- [ ] CORS headers present in responses
- [ ] Error messages are descriptive

---

### Task 5.3: Deploy to Vercel and test production
**Status:** Pending  
**Priority:** Critical  
**Estimated Time:** 20 minutes

**Description:**
Deploy the application to Vercel and test in production environment with real environment variables.

**Deployment Steps:**
1. Push code to GitHub
2. Verify Vercel auto-deploys
3. Configure environment variables in Vercel dashboard
4. Wait for build to complete
5. Test production URL

**Acceptance Criteria:**
- [ ] Build succeeds without errors
- [ ] All environment variables configured correctly
- [ ] Production app fetches real data
- [ ] All platforms work in production
- [ ] No CORS errors in production
- [ ] Firebase auth works
- [ ] API routes respond correctly

---

### Task 5.4: Cross-browser testing
**Status:** Pending  
**Priority:** Low  
**Estimated Time:** 15 minutes

**Description:**
Test the application in different browsers to ensure compatibility.

**Browsers to Test:**
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

**Acceptance Criteria:**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] localStorage works in all browsers
- [ ] API calls work in all browsers

---

## Phase 6: Documentation & Cleanup

### Task 6.1: Update README with new features
**Status:** Pending  
**Priority:** Medium  
**Estimated Time:** 15 minutes

**Description:**
Update `README.md` to reflect that the app now fetches real platform data instead of showing demo data.

**Updates Needed:**
- [ ] Remove references to "demo data" or "sample stats"
- [ ] Add section about configuring usernames
- [ ] Add section about platform support
- [ ] Note about optional platforms
- [ ] Add troubleshooting section for API fetch failures

**Files to Modify:**
- `README.md`

---

### Task 6.2: Add inline code documentation
**Status:** Pending  
**Priority:** Low  
**Estimated Time:** 15 minutes

**Description:**
Add JSDoc comments to key functions in `store.ts` and API files for better code maintainability.

**Functions to Document:**
- `refreshStats()` in `store.ts`
- `updateSettings()` in `store.ts`
- All API handlers in `api/*.ts`

**Acceptance Criteria:**
- [ ] All major functions have JSDoc comments
- [ ] Parameters explained
- [ ] Return values explained
- [ ] Error conditions documented

**Files to Modify:**
- `src/store.ts`
- `api/*.ts`

---

### Task 6.3: Clean up console.log statements
**Status:** Pending  
**Priority:** Low  
**Estimated Time:** 10 minutes

**Description:**
Remove or convert debug `console.log()` statements to `console.warn()` or `console.error()` as appropriate.

**Acceptance Criteria:**
- [ ] No debug `console.log()` in production code
- [ ] Errors use `console.error()`
- [ ] Warnings use `console.warn()`
- [ ] Keep useful logging for debugging

**Files to Check:**
- `src/store.ts`
- `api/*.ts`
- All component files

---

## Summary

**Total Tasks:** 23  
**Critical Priority:** 5 tasks  
**High Priority:** 9 tasks  
**Medium Priority:** 6 tasks  
**Low Priority:** 3 tasks

**Estimated Total Time:** ~5-6 hours

**Dependencies:**
- Phase 1 must complete before Phase 3
- Phase 2 can run in parallel with Phase 1
- Phase 4 can start anytime
- Phase 5 requires Phases 1-3 complete
- Phase 6 can run anytime after basic functionality works

**Recommended Execution Order:**
1. Phase 1 (Critical - core functionality)
2. Phase 2 (Parallel - API review)
3. Phase 3 (High - UI updates)
4. Phase 4 (High - deployment prep)
5. Phase 5 (Critical - validation)
6. Phase 6 (Low - polish)
