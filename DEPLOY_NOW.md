# 🚀 Deploy Now - Step by Step Guide

**Your code is ready to deploy!** Follow these simple steps:

---

## Step 1: Push to GitHub (If you haven't already)

```bash
# Navigate to your project
cd d:\codebase

# Check what changed
git status

# Add all changes
git add .

# Commit with message
git commit -m "feat: implement real platform data fetching with API routes"

# Push to GitHub
git push origin main
```

**✅ Expected Result:** Code appears in your GitHub repository

---

## Step 2: Vercel Will Auto-Deploy

**What happens automatically:**
1. Vercel detects your GitHub push
2. Starts building your app
3. Deploys to production
4. Gives you a URL like `https://your-app.vercel.app`

**Check deployment status:**
- Go to https://vercel.com/dashboard
- Find your project
- See "Building..." then "Ready"

**⏱️ Time:** ~2-3 minutes

---

## Step 3: Configure Environment Variables in Vercel

### 3.1 Open Vercel Settings

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click "Settings" tab
4. Click "Environment Variables" in left sidebar

### 3.2 Add Firebase Variables

**Add each of these one by one:**

| Variable Name | Where to get it |
|---------------|-----------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings → General |

**For each variable:**
1. Click "Add New" button
2. Enter variable name (copy exactly from table above)
3. Enter value from Firebase
4. Select all environments:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development
5. Click "Save"

### 3.3 Add GitHub Token (Optional)

**Only needed if you want higher rate limits for GitHub API (5000/hour instead of 60/hour)**

1. Click "Add New"
2. Name: `GITHUB_TOKEN`
3. Value: Your GitHub personal access token
   - Get one at: https://github.com/settings/tokens
   - Or skip this - Vercel auto-provides a token anyway!
4. Select all environments
5. Click "Save"

**Note:** If you don't add this, Vercel will automatically use its own GitHub token for your repo!

---

## Step 4: Redeploy (After Adding Env Vars)

**Option A: Automatic**
- Vercel should auto-redeploy after you save env vars
- Wait 2-3 minutes

**Option B: Manual**
1. Go to "Deployments" tab
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Confirm

---

## Step 5: Test Your Deployment

### 5.1 Open Your App

Visit your Vercel URL: `https://your-app-name.vercel.app`

### 5.2 Configure Your Usernames

1. **Click "Settings" in sidebar**
2. **Enter your platform usernames:**
   - Codeforces: Your CF handle (e.g., `tourist`)
   - LeetCode: Your LC username
   - CodeChef: Your CC handle
   - AtCoder: Your AC handle
   - GitHub: Your GitHub username
3. **Click "Save All Configurations"**

### 5.3 View Your Stats

1. **Click "Profiles" in sidebar**
2. **You should see:**
   - ✅ Real data from platforms you configured
   - ✅ "Not Configured" for platforms you left empty
   - ✅ Loading indicators while fetching

### 5.4 Test Refresh

1. **Click "Refresh stats" button**
2. **Should see:**
   - Button shows "Refreshing..." with spinner
   - Data updates after ~2-3 seconds
   - "Last synced: X minutes ago" timestamp

---

## Step 6: Verify Everything Works

### ✅ Checklist

- [ ] **Homepage loads** without errors
- [ ] **Settings page** lets you save usernames
- [ ] **Profiles page** shows real data from configured platforms
- [ ] **Reload page** → Settings persist (don't reset)
- [ ] **Unconfigured platforms** show "Not Configured" message
- [ ] **Refresh button** fetches new data
- [ ] **No console errors** (Press F12 → Console tab)

---

## Troubleshooting

### 🔴 Problem: Build Failed on Vercel

**Check:**
1. Vercel deployment logs (click on failed deployment)
2. Look for error message
3. Usually TypeScript or dependency issues

**Fix:**
```bash
# Test locally first
npm run build

# If it works locally, redeploy to Vercel
```

---

### 🔴 Problem: Page loads but shows "Not Configured" for all platforms

**Fix:**
1. Go to Settings
2. Enter your usernames
3. Click Save
4. Go to Profiles
5. Click Refresh

---

### 🔴 Problem: Settings reset when I reload

**Fix:**
1. Check if you're logged in (click "Auth" in sidebar)
2. If not logged in, data saves to localStorage (browser only)
3. If logged in, data saves to Firestore (persistent)
4. Clear browser cache and try again

---

### 🔴 Problem: API calls failing (Network errors)

**Check:**
1. Browser Console (F12) for errors
2. Vercel function logs (Dashboard → Functions)
3. Test API directly: `https://your-app.vercel.app/api/codeforces?handle=tourist`

**Common fixes:**
- Add environment variables in Vercel
- Check CORS headers (should be already set)
- Verify API routes deployed (check Functions tab)

---

### 🔴 Problem: GitHub rate limit (403 error)

**Fix:**
1. Add `GITHUB_TOKEN` environment variable in Vercel
2. Get token at: https://github.com/settings/tokens
3. Or just wait 1 hour (rate limit resets)

---

## Success! 🎉

If all checklist items pass, you're done!

**Your app now:**
- ✅ Fetches real data from 5 platforms
- ✅ Shows empty states for unconfigured platforms
- ✅ Persists settings across sessions
- ✅ Caches data to reduce API calls
- ✅ Works in production on Vercel

---

## What's Next?

### Optional Enhancements

1. **Custom Domain**
   - Go to Vercel → Settings → Domains
   - Add your custom domain (e.g., `codebase.yourdomain.com`)

2. **OAuth for LeetCode/CodeChef**
   - Implement in future for more reliable data
   - Currently uses public APIs

3. **Analytics**
   - Add Vercel Analytics
   - Track user engagement

4. **More Platforms**
   - HackerRank
   - GeeksforGeeks
   - TopCoder

---

## Need Help?

1. **Check Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
2. **Check Full Spec:** `.kiro/specs/real-platform-data-fetching/`
3. **Check Deployment Guide:** `DEPLOYMENT.md`

---

## Testing with Real Data

**Try these test accounts (public profiles):**

```
Codeforces: tourist, Petr, Benq
GitHub: torvalds, gaearon, facebook
```

Or use your own accounts!

---

**That's it! You're live! 🚀**
