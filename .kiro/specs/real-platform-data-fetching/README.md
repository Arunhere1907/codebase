# Real Platform Data Fetching - Specification

**Status:** 📝 Draft  
**Created:** June 4, 2026  
**Last Updated:** June 4, 2026  
**Priority:** 🔴 Critical

---

## Quick Overview

Transform the CodeBase Dashboard from showing dummy/sample data to fetching real competitive programming statistics from platform APIs. The implementation must be GitHub-safe, use Vercel serverless functions, support optional platforms, and handle errors gracefully.

**Current Problem:**
- App displays hardcoded demo data (fake stats)
- Settings can be configured but data doesn't change
- Users cannot see their actual competitive programming progress

**Solution:**
- Remove dummy data generation
- Fetch real data from platform APIs via Vercel serverless functions
- Show empty states for unconfigured platforms
- Handle API failures gracefully
- Deploy safely to GitHub without exposing secrets

---

## Key Requirements

✅ **Must Have:**
- Real data fetching from all 5 platforms (Codeforces, LeetCode, CodeChef, AtCoder, GitHub)
- No dummy data generation
- Settings persistence (no reset on reload)
- Empty states for unconfigured platforms
- Error handling for failed API calls
- GitHub-safe deployment (no secrets in code)

📋 **Platforms Supported:**
1. **Codeforces** - Public REST API (no auth required)
2. **LeetCode** - Community GraphQL API (best effort)
3. **CodeChef** - Public profile scraping (no official API)
4. **AtCoder** - Kenkoooo community API (free)
5. **GitHub** - Official REST API (Vercel auto-provides token)

🎯 **User Experience:**
- Configure usernames in Settings
- See real stats on Profiles page
- "Not Configured" for empty usernames
- "Unable to fetch" for API failures
- Loading skeletons during fetch
- Manual refresh button

---

## Specification Documents

This spec consists of the following documents:

### 1. [Requirements](./requirements.md)
Detailed functional and non-functional requirements, user stories, acceptance criteria, and constraints.

**Key Sections:**
- Functional Requirements (FR-1 through FR-8)
- Non-Functional Requirements (NFR-1 through NFR-7)
- Technical Constraints
- User Stories
- Assumptions and Out of Scope
- Success Metrics

### 2. [Design](./spec.md)
Technical architecture, API specifications, data flow, component design, and deployment strategy.

**Key Sections:**
- Architecture Overview
- Data Flow Diagrams
- Component Architecture
- API Design Specifications
- Error Handling Strategy
- Environment Variables
- Performance Considerations
- Security Considerations
- UI/UX Design

### 3. [Tasks](./tasks.md)
Detailed implementation tasks broken down into 6 phases with time estimates and acceptance criteria.

**Phases:**
1. **Phase 1:** Remove Dummy Data & Fix Settings Persistence (50 min)
2. **Phase 2:** Review and Update API Routes (80 min)
3. **Phase 3:** Update Frontend UI Components (55 min)
4. **Phase 4:** Environment Variables & GitHub Safety (30 min)
5. **Phase 5:** Testing & Validation (85 min)
6. **Phase 6:** Documentation & Cleanup (40 min)

**Total Estimated Time:** ~5-6 hours

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                    │
│  • store.ts: refreshStats() calls APIs                   │
│  • ProfileSection: displays data with empty states       │
│  • SettingsSection: configure usernames                  │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│        Vercel Serverless Functions (/api/*)              │
│  • codeforces.ts  • leetcode.ts  • codechef.ts          │
│  • atcoder.ts     • github.ts                           │
│  • CORS enabled   • Error handling  • Timeouts          │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│           External Platform APIs (Free)                   │
│  • Codeforces Public API                                 │
│  • GitHub REST API                                       │
│  • Kenkoooo AtCoder API                                 │
│  • CodeChef Profile Pages                               │
│  • LeetCode Community API                               │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Core Functionality
- [ ] Remove `generateSampleStats()` from `src/store.ts`
- [ ] Update `refreshStats()` to call real APIs
- [ ] Verify `initialSettings` has empty usernames
- [ ] Test settings persistence

### Phase 2: API Routes
- [ ] Review Codeforces API implementation ✅
- [ ] Review GitHub API implementation ✅
- [ ] Update LeetCode API handler
- [ ] Update CodeChef API handler
- [ ] Update AtCoder API handler

### Phase 3: UI Components
- [ ] Add empty states to ProfileSection
- [ ] Add error states to ProfileSection
- [ ] Update OverviewSection for null data
- [ ] Add loading states
- [ ] Add last synced timestamp

### Phase 4: Deployment Prep
- [ ] Update `.env.example`
- [ ] Verify `.gitignore` excludes secrets
- [ ] Update `DEPLOYMENT.md`
- [ ] Document Vercel env vars setup

### Phase 5: Testing
- [ ] Test with real usernames
- [ ] Test with empty usernames
- [ ] Test with invalid usernames
- [ ] Test settings persistence
- [ ] Test in production on Vercel

### Phase 6: Documentation
- [ ] Update README
- [ ] Add JSDoc comments
- [ ] Clean up console logs
- [ ] Final review

---

## Environment Variables

### Required (GitHub Safe)

**Firebase Configuration:**
```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**GitHub API Token (Optional):**
```bash
GITHUB_TOKEN=your_github_personal_access_token
```
*Note: Vercel automatically provides this for GitHub-linked projects*

### Setting Up in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable with its value
3. Select environments (Production, Preview, Development)
4. Save and redeploy

---

## Testing Strategy

### Local Testing
```bash
# 1. Start dev server
npm run dev

# 2. Configure usernames in Settings
# 3. Navigate to Profiles page
# 4. Verify real data fetched
# 5. Test all scenarios (valid, invalid, empty)
```

### API Testing
```bash
# Test individual API routes
curl "http://localhost:3000/api/codeforces?handle=tourist"
curl "http://localhost:3000/api/github?username=torvalds"
```

### Production Testing
1. Deploy to Vercel
2. Configure environment variables
3. Test with real usernames
4. Verify all platforms work
5. Check browser console for errors

---

## Success Criteria

The implementation is considered successful when:

✅ **Functional:**
- All configured platforms fetch real data
- No dummy data anywhere in the app
- Settings persist correctly
- Empty/error states work properly

✅ **Security:**
- No secrets in GitHub repository
- Environment variables configured in Vercel
- `.env` files properly ignored

✅ **Performance:**
- <3 seconds for parallel fetch
- Cache reduces API calls
- UI remains responsive

✅ **User Experience:**
- Clear loading states
- Helpful error messages
- Intuitive empty states
- Manual refresh works

---

## Known Limitations

1. **LeetCode API:** Community-maintained, may be unreliable
2. **CodeChef API:** No official API, uses HTML scraping
3. **GitHub Rate Limits:** 60/hour without token, 5000/hour with token
4. **AtCoder API:** Community API (Kenkoooo), not official
5. **Real-Time Updates:** Not supported, manual refresh required

---

## Future Enhancements

**After MVP:**
- OAuth authentication for LeetCode and CodeChef
- Server-side caching (Redis) for better performance
- Real-time updates via WebSockets
- Historical data storage in Firestore
- Data analytics and trends
- Social features (compare with friends)

**Out of Scope for Now:**
- Mobile native apps
- Offline mode
- Custom platform support
- Data export (CSV/PDF)
- Multi-language support

---

## Timeline

**Estimated Total Time:** 5-6 hours

**Breakdown:**
- Phase 1: Core functionality (50 min)
- Phase 2: API routes (80 min)
- Phase 3: UI updates (55 min)
- Phase 4: Deployment prep (30 min)
- Phase 5: Testing (85 min)
- Phase 6: Documentation (40 min)

**Recommended Schedule:**
- Day 1: Phases 1-2 (Core + APIs)
- Day 2: Phases 3-4 (UI + Deployment)
- Day 3: Phases 5-6 (Testing + Docs)

---

## Questions & Decisions

### Resolved Decisions
✅ Use Vercel serverless functions (not external backend)
✅ Support 5 platforms (CF, LC, CC, AC, GH)
✅ Platforms are optional (not all required)
✅ No dummy data (show empty states instead)
✅ Use client-side caching (localStorage)
✅ GitHub token auto-provided by Vercel

### Open Questions
❓ Should we implement OAuth for LeetCode/CodeChef now or later? → **Later (out of scope)**
❓ Should we store historical data in Firestore? → **No (cache only)**
❓ Should we add more platforms? → **No (5 is enough for MVP)**

---

## Related Documentation

- [Main README](../../../README.md) - Project overview
- [Deployment Guide](../../../DEPLOYMENT.md) - Deployment instructions
- [Security Spec](../../../security_spec.md) - Security considerations

---

## Getting Help

If you encounter issues during implementation:

1. **API Failures:** Check console for error messages, verify username is valid
2. **CORS Errors:** Ensure API routes have CORS headers
3. **Environment Variables:** Verify Vercel dashboard configuration
4. **Settings Not Persisting:** Check Firestore rules and localStorage
5. **Build Failures:** Check TypeScript errors, verify all imports

**Common Issues:**
- GitHub rate limit → Add GITHUB_TOKEN env var
- LeetCode not working → Try different community API
- CodeChef scraping fails → Profile may be private or HTML changed
- Settings reset → Check `initialSettings` in store.ts

---

## Approval & Sign-Off

**Created By:** AI Assistant  
**Reviewed By:** _(Pending User Review)_  
**Approved By:** _(Pending)_  
**Date:** June 4, 2026

**Ready for Implementation:** 🟡 Pending User Approval

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-06-04 | 1.0 | Initial spec creation | AI Assistant |

---

**Next Steps:**
1. ✅ Review this specification document
2. ⏳ Get user approval to proceed
3. ⏳ Begin Phase 1 implementation
4. ⏳ Follow task checklist in tasks.md
5. ⏳ Deploy and verify in production
