# Deployment Guide - CodeBase

This guide covers everything you need to deploy CodeBase to production.

---

## Required Services

### 1. Firebase (Required)

CodeBase relies heavily on Firebase for:
- **Authentication**: User login/signup (Email/Password, Google OAuth)
- **Firestore Database**: All data storage (users, problem logs, portfolios, reminders)
- **Security Rules**: Zero-trust security architecture

**Setup Steps:**

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Authentication**
   - In Firebase Console, go to **Authentication** → **Sign-in method**
   - Enable **Email/Password**
   - Enable **Google** (optional but recommended)

3. **Create Firestore Database**
   - Go to **Firestore Database** → **Create database**
   - Start in **production mode** (security rules will be deployed separately)
   - Choose your region (closest to your users)
   - Note your database ID (usually "(default)")

4. **Get Firebase Configuration**
   - Go to **Project Settings** → **General**
   - Scroll to "Your apps" → Add web app
   - Copy the configuration object

5. **Create `firebase-applet-config.json`**
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "your-app.firebaseapp.com",
     "projectId": "your-project-id",
     "storageBucket": "your-app.appspot.com",
     "messagingSenderId": "123456789",
     "appId": "1:123:web:abc...",
     "firestoreDatabaseId": "(default)"
   }
   ```

6. **Deploy Security Rules**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login
   firebase login
   
   # Initialize (select Firestore only)
   firebase init firestore
   
   # Deploy rules
   firebase deploy --only firestore:rules
   ```

---

## Optional Services

### Google Gemini API (Not Currently Used)

The codebase includes `@google/genai` dependency and declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` in metadata, but **no features currently use it**.

**When you might need it:**
- Future AI-powered code suggestions
- Automated problem analysis
- Smart tagging of problems
- Contest recommendations

**How to get it:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env.local` as `GEMINI_API_KEY`

**Current status**: Can be left empty or omitted entirely.

---

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

**Pros:**
- Free tier available
- Automatic HTTPS
- Global CDN
- Tight integration with Firebase Auth/Firestore
- Easy deployment

**Steps:**

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   
   Configuration:
   - Public directory: `dist`
   - Single-page app: `Yes`
   - Automatic builds with GitHub: `No` (optional)

3. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

4. **Your app is live!**
   ```
   https://your-project-id.web.app
   ```

**Custom Domain** (optional):
```bash
firebase hosting:channel:deploy production --domain your-domain.com
```

---

### Option 2: Vercel

**Pros:**
- Excellent developer experience
- Automatic deployments from Git
- Great performance
- Free tier generous

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables** (in Vercel Dashboard)
   - Go to Project Settings → Environment Variables
   - Add `VITE_FIREBASE_API_KEY`, etc. (if needed)
   
4. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

**Note**: Firebase config should be in `firebase-applet-config.json`, not environment variables.

---

### Option 3: Netlify

**Pros:**
- Simple deployment
- Git integration
- Free tier
- Good for static sites

**Steps:**

1. **Create `netlify.toml`**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy via CLI**
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod
   ```

3. **Or connect GitHub repo** in Netlify dashboard

---

### Option 4: AWS Amplify

**Pros:**
- Scales well
- AWS integration
- Good for enterprise

**Steps:**

1. **Create `amplify.yml`**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

2. **Deploy via Amplify Console**
   - Connect your Git repository
   - Amplify auto-detects the config
   - Deploy

---

### Option 5: Docker + Any Cloud Platform

**For:** Self-hosted or custom infrastructure

**Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Create `nginx.conf`:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and run:**
```bash
docker build -t codebase-app .
docker run -p 8080:80 codebase-app
```

**Deploy to:**
- Google Cloud Run
- AWS ECS
- Azure Container Apps
- DigitalOcean App Platform
- Heroku
- Railway

---

## Post-Deployment Checklist

### 1. Firebase Configuration

- [ ] Firestore security rules deployed
- [ ] Authentication methods enabled
- [ ] Firestore indexes created (if needed)
- [ ] Firebase app configured correctly

### 2. Authentication Setup

- [ ] Email/Password authentication works
- [ ] Google OAuth configured (if using)
- [ ] Authorized domains added in Firebase Console:
  - Go to **Authentication** → **Settings** → **Authorized domains**
  - Add your production domain

### 3. CORS Configuration (if needed)

If using API endpoints, ensure CORS is configured:
```javascript
// In Firebase Functions (if you add any)
response.set('Access-Control-Allow-Origin', 'https://your-domain.com');
```

### 4. Testing

- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test problem log creation
- [ ] Test contest calendar loading
- [ ] Test portfolio generation
- [ ] Test reminders
- [ ] Test on mobile devices
- [ ] Test in incognito mode
- [ ] Test with slow network (throttling)

### 5. Security

- [ ] Firestore security rules validated
- [ ] All API keys secured (not in public code)
- [ ] HTTPS enabled
- [ ] CSP headers configured (optional)

### 6. Performance

- [ ] Lighthouse score > 90
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Lazy loading implemented

### 7. Monitoring (optional but recommended)

Set up Firebase Analytics:
```javascript
// In src/firebase.ts
import { getAnalytics } from 'firebase/analytics';
export const analytics = getAnalytics(app);
```

---

## Environment Variables Summary

| Variable | Required | Purpose | Where to Set |
|----------|----------|---------|--------------|
| Firebase config | Yes | In `firebase-applet-config.json` | Root directory |
| `GEMINI_API_KEY` | No | Future AI features | `.env.local` (dev only) |
| `APP_URL` | No | Self-referential links | `.env.local` or hosting platform |

---

## Common Issues

### Issue: "Permission denied" in Firestore

**Solution**: Deploy security rules
```bash
firebase deploy --only firestore:rules
```

### Issue: Authentication redirect doesn't work

**Solution**: Add your domain to Firebase authorized domains
- Firebase Console → Authentication → Settings → Authorized domains

### Issue: Build fails

**Solution**: Check Node version (needs v18+)
```bash
node --version
npm install
npm run build
```

### Issue: Firebase config not found

**Solution**: Ensure `firebase-applet-config.json` exists in root with valid config

### Issue: Contest data not loading

**Solution**: Check browser console for CORS errors. The app uses public APIs which should work, but some platforms may have rate limits.

---

## Cost Estimation

### Firebase (Free Tier Limits)

**Firestore:**
- 50K reads/day
- 20K writes/day
- 20K deletes/day
- 1 GiB storage

**Authentication:**
- Unlimited users (Email/Password, Google)

**Hosting:**
- 10 GB storage
- 360 MB/day bandwidth

**Typical Usage:**
- Small team (10 users): FREE
- Medium (100 users): ~$5-10/month
- Large (1000+ users): ~$25-50/month

### Vercel/Netlify
- **Free tier**: Perfect for personal use
- **Pro tier** ($20/month): Good for teams

---

## Scaling Considerations

### Small Scale (< 100 users)
- Firebase free tier sufficient
- No optimizations needed

### Medium Scale (100-1000 users)
- Enable Firestore indexes for queries
- Consider caching contest data
- Monitor Firebase usage

### Large Scale (1000+ users)
- Implement server-side caching (Redis)
- Use Cloud Functions for heavy processing
- Consider CDN for static assets
- Database sharding if needed

---

## Backup Strategy

### Firestore Backups

**Option 1: Automated backups** (Firebase Blaze plan)
```bash
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

**Option 2: Manual exports**
Use Firebase CLI or Admin SDK to periodically export data

**Option 3: Read replicas** (Enterprise)
Enable multi-region replication

---

## Support & Troubleshooting

- **Firebase Issues**: [Firebase Support](https://firebase.google.com/support)
- **Build Issues**: Check Node version and clean install (`rm -rf node_modules && npm install`)
- **Security Rules**: Test in Firebase Console's Rules Playground
- **Performance**: Use Lighthouse and Chrome DevTools

---

## Next Steps After Deployment

1. **Set up monitoring**: Firebase Analytics, Sentry for error tracking
2. **Configure alerts**: Firebase Console → Alerts (usage, errors)
3. **Add custom domain**: Firebase Hosting custom domain setup
4. **Optimize images**: Use WebP format, lazy loading
5. **Enable PWA**: Add service worker for offline support
6. **Set up CI/CD**: GitHub Actions for automated deployments

---

**Need help?** Open an issue on GitHub or check the main README for more information.
