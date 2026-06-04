# Requirements Document

## 1. Functional Requirements

### FR-1: Real Platform Data Fetching
**Priority:** Critical  
**Description:** The application must fetch real user statistics from competitive programming platforms instead of displaying dummy/sample data.

**Acceptance Criteria:**
- App calls real platform APIs via Vercel serverless functions
- Data displayed matches actual user profiles on respective platforms
- No dummy or hardcoded statistics shown to users
- Failed API calls result in null data, not fake data

**Platforms Supported:**
- Codeforces (Public API)
- LeetCode (Community API)
- CodeChef (Public profile scraping)
- AtCoder (Kenkoooo community API)
- GitHub (Official REST API)

---

### FR-2: Optional Platform Configuration
**Priority:** Critical  
**Description:** Users can configure usernames for any combination of platforms. Platforms without configured usernames show empty states.

**Acceptance Criteria:**
- Users can leave any platform username blank
- Empty username fields show "Not Configured" state in UI
- Configured platforms fetch and display real data
- System only makes API calls for configured platforms
- No errors or warnings for unconfigured platforms

**Edge Cases:**
- All platforms empty → Show "Configure platforms in Settings" message
- Some platforms empty → Show mixed configured/unconfigured states
- All platforms configured → Show all data

---

### FR-3: Settings Persistence
**Priority:** Critical  
**Description:** User-configured platform usernames must persist across browser sessions and page reloads.

**Acceptance Criteria:**
- Settings saved to Firestore for logged-in users
- Settings saved to localStorage for guest users
- Page reload does not reset usernames to dummy values
- Page reload does not clear configured usernames
- Settings sync across devices for logged-in users (via Firestore)

**Current Bug to Fix:**
- Settings currently reset to dummy usernames on reload
- `initialSettings` must have empty strings, not dummy values

---

### FR-4: Data Caching with TTL
**Priority:** High  
**Description:** Fetched platform data must be cached locally with a configurable Time-To-Live (TTL) to reduce API calls.

**Acceptance Criteria:**
- Data cached in localStorage after successful fetch
- Default TTL: 15 minutes (configurable in settings: 5/15/30/60 min)
- Cached data used if within TTL and not force-refreshed
- Expired cache triggers automatic refresh on page visit
- Manual "Refresh" button bypasses cache (force refresh)

**Performance Targets:**
- <3 seconds for parallel fetch of all 5 platforms
- <500ms to load from cache
- No unnecessary API calls during TTL window

---

### FR-5: Error Handling and Recovery
**Priority:** High  
**Description:** The application must handle API failures gracefully without breaking the user experience.

**Acceptance Criteria:**
- Failed platform API calls set that platform's data to null
- Other platforms continue to fetch (failures don't block success)
- User sees "Unable to fetch" message for failed platforms
- Console warnings logged (not errors that crash app)
- "Retry" button available for failed platforms
- Manual refresh retries all failed platforms

**Error Scenarios to Handle:**
- Network offline
- API rate limit exceeded
- Invalid username (404)
- Platform API down (500)
- Timeout (>15 seconds)
- CORS errors

---

### FR-6: GitHub-Safe Deployment
**Priority:** Critical  
**Description:** The codebase must be safe to push to public GitHub repositories without exposing secrets.

**Acceptance Criteria:**
- No API keys or tokens hardcoded in source code
- `.env` files excluded from git via `.gitignore`
- `.env.example` documents all required variables
- Firebase config uses `VITE_` prefixed env vars (client-safe)
- Vercel environment variables UI used for secrets
- README documents environment variable setup

**Security Requirements:**
- Firebase API key can be public (protected by Firestore rules)
- GitHub token (if used) stored only in Vercel env vars
- No credentials in git history
- No credentials in build artifacts

---

### FR-7: Parallel Data Fetching
**Priority:** Medium  
**Description:** Platform data must be fetched in parallel to minimize total load time.

**Acceptance Criteria:**
- All configured platforms fetch simultaneously
- Use `Promise.allSettled()` (not `Promise.all()`)
- Individual platform failures don't block others
- Total fetch time ≈ slowest single platform time
- 15-second timeout per platform API call

**Performance:**
- Best case: ~2-3 seconds (all platforms respond quickly)
- Worst case: ~15 seconds (one platform times out, others succeed)
- Cache hit: <500ms (no API calls)

---

### FR-8: UI State Management
**Priority:** High  
**Description:** The UI must clearly communicate different data states to users.

**States to Support:**
1. **Loading:** Fetching data for the first time
2. **Success:** Data fetched and displayed
3. **Not Configured:** Username not set for platform
4. **Error:** API call failed but username is configured
5. **Cached:** Showing cached data with timestamp

**UI Requirements:**
- Loading: Skeleton cards, spinner on refresh button
- Success: Show all data with "Last synced: X min ago"
- Not Configured: Empty state with "Go to Settings" button
- Error: "Unable to fetch" with "Retry" button
- Cached: Display data with cache timestamp

---

## 2. Non-Functional Requirements

### NFR-1: Performance
**Priority:** High

**Response Time:**
- Cache retrieval: <500ms
- API fetch (all platforms): <3 seconds typical, <15 seconds max
- UI rendering: <100ms after data received
- Settings save: <1 second

**Resource Usage:**
- localStorage: <5MB total storage
- Memory: Reasonable for React app
- Network: Only configured platforms queried

---

### NFR-2: Reliability
**Priority:** High

**Availability:**
- Frontend: 99.9% uptime (static hosting on Vercel)
- API routes: 99% uptime (dependent on platform APIs)
- Graceful degradation: Show cached data if APIs fail

**Error Recovery:**
- Auto-retry on network errors: No (manual retry button)
- Fallback to cache: Yes (if available)
- Data consistency: Best effort (real-time data)

---

### NFR-3: Scalability
**Priority:** Medium

**User Scalability:**
- Support unlimited concurrent users (static frontend)
- Vercel serverless functions auto-scale
- No backend database for stats (each user fetches own data)

**Data Scalability:**
- Support any number of platform accounts per user
- Support future platform additions
- Extensible API design

---

### NFR-4: Maintainability
**Priority:** Medium

**Code Quality:**
- TypeScript for type safety
- Consistent error handling patterns
- Modular API route design (one file per platform)
- Clear separation of concerns (UI, state, API)

**Documentation:**
- JSDoc comments on key functions
- README with setup instructions
- DEPLOYMENT.md with deployment steps
- Inline comments for complex logic

---

### NFR-5: Security
**Priority:** High

**Data Security:**
- All platform data is public information (no PII)
- No credentials stored in frontend
- Firebase auth handles user authentication
- Firestore rules protect user data

**API Security:**
- CORS enabled for client access
- No authentication tokens exposed to client
- Rate limiting handled by platform APIs
- Serverless functions isolated per request

---

### NFR-6: Usability
**Priority:** High

**User Experience:**
- Clear error messages (no technical jargon)
- Intuitive empty states with actionable guidance
- Visual loading indicators
- Responsive design (mobile/desktop)

**Accessibility:**
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast standards

---

### NFR-7: Compatibility
**Priority:** Medium

**Browser Support:**
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Platform Support:**
- Windows, macOS, Linux (via browser)
- iOS, Android (via mobile browser)

---

## 3. Technical Constraints

### TC-1: Platform API Limitations
**Constraint:** External platform APIs have rate limits and availability constraints

**Impact:**
- Codeforces: Public API, may have rate limits
- GitHub: 60 requests/hour without token, 5000 with token
- LeetCode: No official API (community APIs unreliable)
- CodeChef: No official API (HTML scraping required)
- AtCoder: Community API (Kenkoooo, may have limits)

**Mitigation:**
- Caching with TTL reduces API calls
- User-configurable refresh intervals
- Graceful error handling for rate limits
- GitHub token support for higher limits

---

### TC-2: Vercel Free Tier Limits
**Constraint:** Vercel free tier has usage limits

**Limits:**
- 100GB bandwidth per month
- 100 serverless function executions per day (on free tier)
- 10-second function execution timeout

**Mitigation:**
- Static site (low bandwidth usage)
- Serverless functions only called on user action (not automated)
- Client-side caching reduces function calls
- Reasonable timeout limits (15s max)

---

### TC-3: Firebase Free Tier Limits
**Constraint:** Firebase Spark plan has usage limits

**Limits:**
- 10GB/month downloads
- 1GB storage
- 50K reads/day, 20K writes/day

**Mitigation:**
- Settings and problem logs are small data
- Stats not stored in Firestore (cached locally)
- Read/write patterns are user-action triggered

---

### TC-4: No Server-Side State
**Constraint:** Vercel serverless functions are stateless

**Impact:**
- No shared cache between users
- Each user fetches their own data
- No server-side rate limiting

**Mitigation:**
- Client-side caching per user
- Each user manages their own API quotas
- Acceptable for personal dashboard use case

---

## 4. User Stories

### US-1: Configure Platform Usernames
**As a** competitive programming student  
**I want to** configure my platform usernames in settings  
**So that** I can see my real statistics from all my accounts

**Acceptance Criteria:**
- I can enter usernames in the Settings page
- Usernames are saved when I click "Save"
- Settings persist when I reload the page
- I can leave platforms blank if I don't use them

---

### US-2: View Real Platform Statistics
**As a** user with configured accounts  
**I want to** see my real competitive programming statistics  
**So that** I can track my actual progress

**Acceptance Criteria:**
- My Codeforces rating, rank, and solved count are accurate
- My LeetCode easy/medium/hard breakdown is correct
- My GitHub contribution stats match my profile
- My CodeChef and AtCoder stats are accurate
- Data updates when I refresh

---

### US-3: Understand When Data Is Not Available
**As a** user  
**I want to** see clear messages when platform data isn't available  
**So that** I know whether to configure it or if there's an error

**Acceptance Criteria:**
- "Not Configured" message when I haven't set a username
- "Unable to fetch" message when API call fails
- "Go to Settings" button for unconfigured platforms
- "Retry" button for failed fetches

---

### US-4: Deploy Without Exposing Secrets
**As a** developer  
**I want to** push my code to GitHub safely  
**So that** I don't expose my Firebase credentials or API tokens

**Acceptance Criteria:**
- No `.env` files in my git repository
- Firebase config uses environment variables
- Vercel dashboard used for setting secrets
- Deployment instructions are clear

---

### US-5: Reduce API Costs with Caching
**As a** user  
**I want** my dashboard to cache data locally  
**So that** I don't hit rate limits and pages load faster

**Acceptance Criteria:**
- Data is cached for 15 minutes by default
- I can change the cache duration in settings
- Cache is used on page reload within TTL
- I can force refresh to bypass cache

---

## 5. Assumptions

1. **Public Data:** All platform statistics are publicly accessible (no private profiles)
2. **Valid Usernames:** Users enter valid, existing usernames for their accounts
3. **Internet Connection:** Users have stable internet to fetch data
4. **Modern Browser:** Users use browsers with localStorage and fetch API support
5. **English Only:** UI text is in English (internationalization out of scope)
6. **Single User Device:** No multi-user support on same device
7. **Platform APIs Stable:** External APIs maintain their current structure
8. **Vercel Deployment:** App will be deployed on Vercel (not other platforms)

---

## 6. Out of Scope

The following features are explicitly **not** included in this implementation:

1. **OAuth Authentication:** Platform-specific OAuth flows (future enhancement)
2. **Real-Time Updates:** WebSocket or polling for live data updates
3. **Server-Side Caching:** Redis or similar for shared caching
4. **Historical Data Storage:** Long-term storage of rating history in database
5. **Data Analytics:** Trends, predictions, or advanced analytics
6. **Social Features:** Comparing stats with friends, leaderboards
7. **Mobile App:** Native iOS/Android applications
8. **Offline Mode:** Full functionality without internet
9. **Data Export:** CSV/PDF export of statistics (except backup JSON)
10. **Custom Platform Support:** User-defined platforms beyond the 5 supported

---

## 7. Success Metrics

### Primary Metrics
- [ ] 100% of configured platforms fetch real data (not dummy data)
- [ ] 0 hardcoded secrets in git repository
- [ ] <3 seconds average fetch time for all platforms
- [ ] 95%+ uptime for serverless API routes
- [ ] 0 critical bugs in production after 1 week

### User Experience Metrics
- [ ] Users can configure all 5 platforms successfully
- [ ] Settings persist correctly across sessions
- [ ] Error messages are clear and actionable
- [ ] Loading states are visible and intuitive

### Technical Metrics
- [ ] All TypeScript types are correct
- [ ] All console errors resolved
- [ ] All API routes have proper error handling
- [ ] All UI states (loading, success, error, empty) implemented

---

## 8. Dependencies

### External Dependencies
- **Codeforces API:** `https://codeforces.com/api/`
- **GitHub API:** `https://api.github.com/`
- **LeetCode API:** Community APIs (to be determined)
- **CodeChef:** Public profile pages
- **AtCoder API:** Kenkoooo API `https://kenkoooo.com/atcoder/`

### Internal Dependencies
- **Vercel:** Hosting and serverless functions
- **Firebase:** Authentication and user data storage
- **Vite:** Build tool and dev server
- **React:** UI framework
- **Zustand:** State management
- **Axios:** HTTP client

---

## 9. Risks and Mitigation

### Risk 1: Platform API Changes
**Probability:** Medium  
**Impact:** High  
**Mitigation:** 
- Modular API design (easy to update single platform)
- Version locking where possible
- Community API monitoring
- Graceful degradation (show cached or empty)

### Risk 2: Rate Limiting
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Caching with reasonable TTL (15 min default)
- User-configurable refresh intervals
- GitHub token for higher limits
- Clear error messages

### Risk 3: Community APIs Unreliable
**Probability:** High (LeetCode, AtCoder)  
**Impact:** Medium  
**Mitigation:**
- Mark these platforms as "best effort"
- Allow null data without breaking UI
- Provide retry mechanism
- Consider future OAuth implementation

### Risk 4: Vercel Function Timeouts
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- 15-second timeout on API calls
- Parallel fetching (not sequential)
- Most platforms respond in <3 seconds
- Cache reduces need for fresh data

### Risk 5: User Configuration Errors
**Probability:** Medium  
**Impact:** Low  
**Mitigation:**
- Clear placeholder text in inputs
- Validation on save (optional)
- Clear error messages for invalid usernames
- Examples provided in UI

---

## 10. Acceptance Criteria Summary

The implementation is considered complete when:

✅ **Core Functionality:**
- [ ] All configured platforms fetch real data from APIs
- [ ] No dummy/sample data generation exists in code
- [ ] Unconfigured platforms show "Not Configured" empty states
- [ ] Failed platforms show "Unable to fetch" error states
- [ ] Settings persist correctly across sessions and reloads

✅ **User Experience:**
- [ ] Loading skeletons shown during initial fetch
- [ ] Refresh button works and shows loading state
- [ ] Last synced timestamp displayed for cached data
- [ ] Error messages are clear and actionable
- [ ] All 5 platforms (CF, LC, CC, AC, GH) supported

✅ **Deployment:**
- [ ] Code is safe to push to public GitHub
- [ ] No secrets in repository
- [ ] `.env.example` documents all variables
- [ ] Vercel deployment works with environment variables
- [ ] Firebase integration works in production

✅ **Performance:**
- [ ] Parallel fetching of all platforms <3 seconds typical
- [ ] Cache reduces redundant API calls
- [ ] UI remains responsive during fetch

✅ **Testing:**
- [ ] Tested with real usernames for all platforms
- [ ] Tested with empty usernames (empty states)
- [ ] Tested with invalid usernames (error states)
- [ ] Tested settings persistence (reload behavior)
- [ ] Tested in production environment on Vercel
