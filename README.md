# CodeBase - Developer Dashboard & CP Tracker

<div align="center">

![React](https://img.shields.io/badge/React-19.0.1-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=flat&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.14.0-FFCA28?style=flat&logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.2.3-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.14-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

**A professional, self-hosted developer dashboard and competitive programming tracker with comprehensive stats, problem logs, contest calendar, and public developer portfolio.**

[Features](#features) • [Quick Start](#quick-start) • [Tech Stack](#tech-stack) • [Security](#security) • [License](#license)

</div>

---

## Overview

CodeBase is a comprehensive developer productivity platform designed for competitive programmers and software engineers. It combines real-time contest tracking, problem-solving analytics, portfolio management, and multi-platform statistics into a single unified dashboard.

### Key Highlights

- **Multi-Platform Integration**: Track stats from Codeforces, LeetCode, CodeChef, AtCoder, HackerRank, and GitHub
- **Real-Time Contest Calendar**: Never miss a contest with live countdowns and reminder notifications
- **Problem Log Tracker**: Document your problem-solving journey with detailed analytics
- **Public Portfolio**: Generate a shareable developer portfolio showcasing your competitive programming achievements
- **Zero-Trust Security**: Enterprise-grade Firestore security rules with the "Dirty Dozen" attack prevention
- **Dark Mode Support**: Beautiful UI with seamless light/dark theme switching

---

## Features

### Dashboard Overview
- Real-time statistics from multiple competitive programming platforms
- Activity heatmaps and submission trends
- Rating progression charts with historical data
- GitHub contribution tracking
- Current streak and solve count metrics

### Problem Tracker
- Log problems with platform, difficulty, tags, and time taken
- Advanced filtering by platform, difficulty, status, and topic tags
- Topic-wise practice distribution heatmap
- Revisit queue for flagged problems
- Weekly/monthly solve statistics
- Average solve time analytics

### Contest Calendar
- Upcoming contests from 6+ platforms (CF, LC, CC, AC, HR, GFG)
- Live countdown timer for next contest
- Multiple view modes: List view and Monthly grid
- Google Calendar integration for one-click exports
- Customizable contest reminder system with browser notifications
- Platform-specific filtering
- Past performance history with ranks and rating deltas

### Profile Management
- Manage usernames across multiple platforms
- Real-time API sync with platform profiles
- Historical rating graphs and submission analytics
- Badge and achievement display
- Contribution streak tracking

### Public Portfolio
- Generate a beautiful public-facing developer portfolio
- Showcase competitive programming highlights
- Display projects with tech stacks and links
- Education timeline
- Skills and expertise listing
- Shareable standalone portfolio mode

### Settings
- Theme customization (light/dark mode)
- Contest reminder preferences
- Auto-refresh intervals
- Default reminder time offsets
- Platform username configuration

---

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Firebase Account** with Firestore enabled
- **Gemini API Key** (optional - reserved for future AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd codebase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create `firebase-applet-config.json` in the root directory:
   ```json
   {
     "apiKey": "YOUR_FIREBASE_API_KEY",
     "authDomain": "your-project.firebaseapp.com",
     "projectId": "your-project-id",
     "storageBucket": "your-project.appspot.com",
     "messagingSenderId": "123456789",
     "appId": "your-app-id",
     "firestoreDatabaseId": "your-database-id"
   }
   ```

4. **Set up environment variables** (Optional)
   
   Copy `.env.example` to `.env.local`:
   ```bash
   copy .env.example .env.local
   ```
   
   Update `.env.local` with your credentials:
   ```env
   GEMINI_API_KEY="your_gemini_api_key"  # Optional - not currently used
   APP_URL="http://localhost:3000"
   ```
   
   > **Note**: The Gemini API key is reserved for future AI-powered features and is not required for current functionality.

5. **Deploy Firestore Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:3000`

---

## Tech Stack

### Frontend
- **React 19.0.1** - UI framework with latest concurrent features
- **TypeScript 5.8.2** - Type-safe development
- **Vite 6.2.3** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **Motion 12.23.24** (Framer Motion) - Smooth animations and transitions
- **Zustand 5.0.14** - Lightweight state management

### Backend & Services
- **Firebase 12.14.0**
  - Authentication (Email/Password, Google OAuth)
  - Firestore Database (Real-time NoSQL)
  - Security Rules with zero-trust architecture
- **Google Gemini AI** (Future) - Reserved for AI-powered features

### Data Visualization
- **Recharts 3.8.1** - Interactive charts and graphs
- **date-fns 4.4.0** - Date manipulation and formatting
- **Lucide React 0.546.0** - Beautiful icon library

### API Integration
- **Axios 1.17.0** - HTTP client for platform APIs
- Custom API adapters for:
  - Codeforces API
  - LeetCode GraphQL API
  - CodeChef API
  - AtCoder API
  - GitHub REST API

---

## Security

CodeBase implements **enterprise-grade security** with a comprehensive zero-trust architecture.

### Security Features

**Authentication Requirements**
- All write operations require authenticated and verified users
- Email verification mandatory for data modifications
- Support for Google OAuth and email/password authentication

**Data Isolation**
- Users can only access their own data
- Path-based user ID validation
- No cross-user data leakage

**Input Validation**
- Type-safe validation for all fields
- Size limits on all text inputs (prevents resource exhaustion)
- Strict enum validation for status fields
- Alphanumeric ID constraints

**Attack Prevention**
- Protection against the "Dirty Dozen" malicious payloads
- Identity spoofing prevention
- Timestamp integrity enforcement
- Injection attack mitigation
- Resource poisoning safeguards

### The "Dirty Dozen" Attack Scenarios

The security implementation prevents 12 critical attack vectors:

1. **Identity Spoofing** - Hostile modification of other users' settings
2. **Impersonation** - Fake authorship on write operations
3. **Shadow Updates** - Injection of unauthorized fields (e.g., `isAdmin`)
4. **Resource Poisoning** - Infinite string/array attacks (DoS)
5. **Token Spoofing** - Bypassing email verification requirements
6. **Type Safety Bypass** - Invalid platform/difficulty values
7. **Timestamp Forgery** - Manipulating creation/update times
8. **Boundary Violations** - Empty titles or oversized inputs
9. **Immutable Field Mutation** - Changing locked historical data
10. **Array Flooding** - Injecting massive arrays
11. **PII Leaks** - Unauthorized blanket user queries
12. **Resource Hijacking** - Accessing other users' reminders

For detailed security specifications, see [`security_spec.md`](./security_spec.md).

---

## Project Structure

```
codebase/
├── src/
│   ├── components/          # React components
│   │   ├── Auth.tsx         # Authentication UI
│   │   ├── CalendarSection.tsx
│   │   ├── OverviewSection.tsx
│   │   ├── PortfolioSection.tsx
│   │   ├── ProfileSection.tsx
│   │   ├── SettingsSection.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Skeleton.tsx     # Loading skeletons
│   │   └── TrackerSection.tsx
│   ├── App.tsx              # Main app component
│   ├── firebase.ts          # Firebase configuration
│   ├── main.tsx             # Application entry point
│   ├── store.ts             # Zustand state management
│   ├── types.ts             # TypeScript type definitions
│   └── index.css            # Global styles
├── firestore.rules          # Security rules
├── firebase-blueprint.json  # Data model schema
├── security_spec.md         # Security documentation
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Data Model

### Collections

**`/users/{userId}`**
- User settings and preferences
- Theme configuration
- Platform usernames
- Reminder preferences

**`/users/{userId}/problemLogs/{logId}`**
- Problem solve history
- Platform, difficulty, tags
- Time taken and notes
- Status tracking (Solved/Attempted/Revisit)

**`/users/{userId}/portfolio/main`**
- Public portfolio data
- Projects and education
- Skills and achievements
- CP highlights

**`/users/{userId}/reminders/{reminderId}`**
- Contest reminder schedules
- Notification preferences
- Triggered status tracking

For the complete schema, see [`firebase-blueprint.json`](./firebase-blueprint.json).

---

## UI/UX Features

### Design Philosophy
- **Minimal & Professional** - Clean interface focused on content
- **Responsive Design** - Mobile-first approach with adaptive layouts
- **Dark Mode First** - Beautiful dark theme with smooth transitions
- **Micro-interactions** - Polished animations and feedback
- **Accessibility** - WCAG compliant with keyboard navigation

### Components
- Custom skeleton loaders for perceived performance
- Toast notifications for real-time alerts
- Modal dialogs with smooth animations
- Interactive charts and heatmaps
- Collapsible sidebar navigation

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for future AI features | No (reserved) |
| `APP_URL` | Application base URL | No (optional) |

### Firebase Configuration

Ensure your `firebase-applet-config.json` includes:
- `apiKey` - Firebase API key
- `authDomain` - Authentication domain
- `projectId` - Firebase project ID
- `firestoreDatabaseId` - Firestore database ID

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server on port 3000

# Build
npm run build        # Production build

# Preview
npm run preview      # Preview production build

# Linting
npm run lint         # Type checking with TypeScript

# Clean
npm run clean        # Remove build artifacts
```

---

## Deployment

### Firebase Hosting (Recommended)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

### Other Platforms

The build output in `/dist` can be deployed to:
- Vercel
- Netlify
- AWS Amplify
- Google Cloud Run
- Any static hosting service

**For detailed deployment instructions**, including Docker setup, environment configuration, and troubleshooting, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain existing code style
- Add comments for complex logic
- Update documentation as needed
- Test security rules thoroughly

---

## License

This project is licensed under the **Apache-2.0 License**.

```
Copyright 2026 CodeBase Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## Acknowledgments

- **Google AI Studio** - Platform integration and hosting
- **Firebase Team** - Backend infrastructure and security
- **React Community** - UI framework and ecosystem
- **Competitive Programming Platforms** - API access and data

---

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review security specifications

---

<div align="center">

**Built for the Competitive Programming Community**

Star this repo if you find it helpful!

</div>
