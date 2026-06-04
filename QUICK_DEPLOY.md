# Quick Deployment Checklist

**TL;DR**: What you actually need to deploy CodeBase.

---

## Required (Must Have)

### 1. Firebase Account & Setup
- Create project at [Firebase Console](https://console.firebase.google.com/)
- Enable **Firestore Database**
- Enable **Authentication** (Email/Password + Google OAuth)
- Deploy security rules: `firebase deploy --only firestore:rules`
- Create `firebase-applet-config.json` with your Firebase config

**Cost**: FREE (for up to 50K reads/day)

---

## Optional (Not Needed Now)

### Google Gemini API Key
- **Status**: Package installed but NOT USED anywhere in the code
- **Purpose**: Reserved for future AI features (problem suggestions, analysis, etc.)
- **Can skip**: Yes, app works 100% without it
- **When to add**: When AI features are implemented later

---

## Minimal Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Add Firebase config
# Create firebase-applet-config.json with your Firebase details

# 3. Deploy Firestore rules
firebase login
firebase init firestore
firebase deploy --only firestore:rules

# 4. Build
npm run build

# 5. Deploy (choose one)
firebase deploy --only hosting  # Firebase Hosting
# OR
vercel                           # Vercel
# OR
netlify deploy --prod            # Netlify
```

---

## What Each Service Does

| Service | What It Does | Required? | Free Tier |
|---------|--------------|-----------|-----------|
| **Firebase Auth** | User login/signup | YES | Unlimited |
| **Firestore** | Store all data (logs, portfolios, etc.) | YES | 50K reads/day |
| **Firebase Hosting** | Host the built app | Recommended | 10 GB storage |
| **Gemini API** | AI features (not implemented yet) | NO | N/A |

---

## The Bottom Line

**To deploy right now, you need:**
1. ✅ Firebase account (free)
2. ✅ 5 minutes of setup time
3. ❌ NO Gemini API key needed
4. ❌ NO payment required (unless you exceed free tier)

**Gemini API is:**
- Listed in dependencies (yes)
- Actually used in code (no)
- Required for deployment (no)
- For future features (yes)

---

## If You Want to Add AI Features Later

The codebase is set up to support Gemini API. Potential features you could add:

- Automated problem difficulty prediction
- Smart topic tag suggestions
- Contest recommendation engine
- Code solution analysis
- Portfolio content generation

When you're ready to implement these, add the API key and use the `@google/genai` package that's already installed.

---

For detailed instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
