/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import axios from 'axios';
import { 
  UserSettings, 
  ProblemLog, 
  Contest, 
  PortfolioData, 
  DashboardStats,
  Platform,
  Difficulty,
  ProblemStatus,
  CodeforcesStats,
  LeetCodeStats,
  CodeChefStats,
  AtCoderStats,
  GitHubStats,
  Reminder,
  PlatformFetchErrors,
  ContestHistoryEntry
} from './types';
import { 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  getDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

interface CodeBaseState {
  currentTab: 'home' | 'profiles' | 'tracker' | 'calendar' | 'portfolio' | 'settings';
  portfolioMode: 'private' | 'public';
  sidebarCollapsed: boolean;
  settings: UserSettings;
  problemLogs: ProblemLog[];
  contests: Contest[];
  stats: DashboardStats | null;
  fetchErrors: PlatformFetchErrors;
  portfolio: PortfolioData;
  user: FirebaseUser | null;
  authLoading: boolean;
  reminders: Reminder[];
  contestHistory: ContestHistoryEntry[];
  loading: {
    stats: boolean;
    contests: boolean;
  };
  
  // Actions
  setTab: (tab: 'home' | 'profiles' | 'tracker' | 'calendar' | 'portfolio' | 'settings') => void;
  setPortfolioMode: (mode: 'private' | 'public') => void;
  toggleSidebar: () => void;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  // CP Tracker Actions
  addProblemLog: (log: Omit<ProblemLog, 'id' | 'userId'>) => Promise<void>;
  updateProblemLog: (id: string, log: Partial<ProblemLog>) => Promise<void>;
  deleteProblemLog: (id: string) => Promise<void>;
  
  // Portfolio Actions
  updatePortfolio: (portfolio: Partial<PortfolioData>) => Promise<void>;
  
  // Fetch Stats Actions
  refreshStats: (force?: boolean) => Promise<void>;
  refreshContests: () => Promise<void>;

  // Firebase Auth Actions
  initAuth: () => void;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Reminder Actions
  addReminder: (contestId: string, contestName: string, contestStartTime: string, platform: string, offsetMins: number) => Promise<void>;
  removeReminder: (reminderId: string) => Promise<void>;
  markReminderAsNotified: (reminderId: string) => Promise<void>;

  // Contest History Actions
  addContestHistory: (entry: Omit<ContestHistoryEntry, 'id' | 'userId'>) => Promise<void>;
  updateContestHistory: (id: string, entry: Partial<ContestHistoryEntry>) => Promise<void>;
  deleteContestHistory: (id: string) => Promise<void>;
}

// Default seeded problem logs
const defaultProblemLogs: ProblemLog[] = [
  {
    id: '1',
    userId: 'default',
    name: 'Longest Palindromic Substring',
    platform: 'LeetCode',
    difficulty: 'Medium',
    topicTags: ['Dynamic Programming', 'Strings'],
    status: 'Solved',
    timeTaken: 35,
    notes: 'Used expanding around center method. O(N^2) time complexity and O(1) extra space. DP lookup table takes O(N^2) space, so centered logic is better.',
    date: '2026-06-02'
  },
  {
    id: '2',
    userId: 'default',
    name: 'XOR on Segment',
    platform: 'Codeforces',
    difficulty: 'Hard',
    topicTags: ['Segment Tree', 'Bitwise'],
    status: 'Revisit',
    timeTaken: 75,
    notes: 'Need to maintain split counts for all 20 bits on each Segment Tree node to handle both range XOR and range Sum quickly. Revisit to implement without any memory leaks.',
    date: '2026-06-03'
  },
  {
    id: '3',
    userId: 'default',
    name: 'Edit Distance',
    platform: 'LeetCode',
    difficulty: 'Hard',
    topicTags: ['Dynamic Programming'],
    status: 'Solved',
    timeTaken: 45,
    notes: 'Classic grid optimization problem. Row optimization DP table works in O(Min(M, N)) memory space.',
    date: '2026-06-01'
  },
  {
    id: '4',
    userId: 'default',
    name: 'Beautiful Matrix',
    platform: 'Codeforces',
    difficulty: 'Easy',
    topicTags: ['Implementation'],
    status: 'Solved',
    timeTaken: 5,
    notes: 'Straightforward Manhattan distance solver. Simple center target calculation.',
    date: '2026-06-04'
  },
  {
    id: '5',
    userId: 'default',
    name: 'Subarray Sums II',
    platform: 'AtCoder',
    difficulty: 'Medium',
    topicTags: ['Two Pointers', 'Map'],
    status: 'Attempted',
    timeTaken: 30,
    notes: 'Currently encountering TLE on last 3 test suites. Look into optimizing standard unordered_map allocations in C++.',
    date: '2026-05-30'
  },
  {
    id: '6',
    userId: 'default',
    name: 'Binary Search Tree Deletion',
    platform: 'LeetCode',
    difficulty: 'Medium',
    topicTags: ['Trees', 'DFS'],
    status: 'Solved',
    timeTaken: 20,
    notes: 'Standard BST cases: leaf node, single child, two children. Used predecessor replacement model.',
    date: '2026-05-28'
  },
  {
    id: '7',
    userId: 'default',
    name: 'Maximum Path sum',
    platform: 'CodeChef',
    difficulty: 'Medium',
    topicTags: ['Dynamic Programming', 'Trees'],
    status: 'Revisit',
    timeTaken: 50,
    notes: 'Calculates structural maximum branches, but need to be careful about negative node values dragging path downward.',
    date: '2026-05-15'
  }
];

// DEPRECATED: This function generated fake sample stats for demo purposes
// Now we fetch real data from platform APIs via Vercel serverless functions
// Keeping this commented for reference only
/*
// Helper to generate realistic stats depending on the username configured
const generateSampleStats = (usernames: UserSettings['usernames']): DashboardStats => {
  const { codeforces, leetcode, codechef, atcoder, github } = usernames;
  
  const cfRating = 1756;
  const cfHistory = [
    { date: '2025-11-15', rating: 1240, rank: 3500, contestName: 'Codeforces Round #962' },
    { date: '2025-12-10', rating: 1390, rank: 2100, contestName: 'Codeforces Round #971' },
    { date: '2026-01-20', rating: 1450, rank: 1800, contestName: 'Codeforces Round #982' },
    { date: '2026-03-05', rating: 1610, rank: 1100, contestName: 'Codeforces Round #994' },
    { date: '2026-04-18', rating: 1540, rank: 2500, contestName: 'Codeforces Round #1006' },
    { date: '2026-05-22', rating: 1756, rank: 450, contestName: 'Codeforces Round #1012' }
  ];

  const cfStats: CodeforcesStats = {
    handle: codeforces || 'arun_here',
    rating: cfRating,
    maxRating: 1756,
    rank: 'Expert',
    maxRank: 'Expert',
    solvedCount: 342,
    history: cfHistory,
    recentSubmissions: [
      { id: 2194827, problemName: 'A. Split the Multiset', verdict: 'OK', language: 'GNU C++20', time: '1 day ago' },
      { id: 2191942, problemName: 'C. Increase Subarray Sums', verdict: 'OK', language: 'GNU C++20', time: '2 days ago' },
      { id: 2182845, problemName: 'B. Make Almost Equal With XOR', verdict: 'WRONG ANSWER', language: 'GNU C++20', time: '3 days ago' },
      { id: 2182410, problemName: 'B. Make Almost Equal With XOR', verdict: 'OK', language: 'GNU C++20', time: '3 days ago' },
      { id: 2174312, problemName: 'D. Multi-colored Segments', verdict: 'TIME_LIMIT_EXCEEDED', language: 'GNU C++20', time: '1 week ago' }
    ]
  };

  const lcHistory = [
    { date: '2026-01-15', rating: 1640 },
    { date: '2026-02-15', rating: 1720 },
    { date: '2026-03-15', rating: 1810 },
    { date: '2026-04-15', rating: 1860 },
    { date: '2026-05-15', rating: 1954 }
  ];

  const lcStats: LeetCodeStats = {
    handle: leetcode || 'arun_here',
    totalSolved: 584,
    easySolved: 189,
    mediumSolved: 312,
    hardSolved: 83,
    streak: 15,
    contestRating: 1954,
    badges: ['Knight', 'June 50-day Streak', 'DP Specialist'],
    history: lcHistory
  };

  const ccStats: CodeChefStats = {
    handle: codechef || 'arun_chef',
    rating: 1845,
    stars: '4★',
    globalRank: 3942,
    countryRank: 1205,
    solvedCount: 165,
    history: [
      { date: '2026-01-01', rating: 1400 },
      { date: '2026-02-10', rating: 1550 },
      { date: '2026-03-20', rating: 1630 },
      { date: '2026-04-30', rating: 1710 },
      { date: '2026-05-25', rating: 1845 }
    ]
  };

  const acStats: AtCoderStats = {
    handle: atcoder || 'arun_at',
    rating: 1104,
    highestRating: 1140,
    rank: 4102,
    solvedCount: 88,
    history: [
      { date: '2026-02-01', rating: 780 },
      { date: '2026-03-01', rating: 910 },
      { date: '2026-04-01', rating: 1040 },
      { date: '2026-05-01', rating: 1104 }
    ]
  };

  const ghStats: GitHubStats = {
    username: github || 'arun-github',
    contributionsThisWeek: 42,
    streak: 28,
    totalContributionsLastYear: 1843,
    topRepos: [
      { name: 'algo-visualizer', stars: 24, language: 'TypeScript', url: 'https://github.com' },
      { name: 'competitive-programming', stars: 15, language: 'C++', url: 'https://github.com' },
      { name: 'nextjs-saas-template', stars: 84, language: 'TypeScript', url: 'https://github.com' },
      { name: 'segment-tree-wasm', stars: 12, language: 'Rust', url: 'https://github.com' }
    ]
  };

  return {
    codeforces: codeforces ? cfStats : null,
    leetcode: leetcode ? lcStats : null,
    codechef: codechef ? ccStats : null,
    atcoder: atcoder ? acStats : null,
    github: github ? ghStats : null,
    lastUpdated: new Date().toISOString()
  };
};
*/

const defaultPortfolio: PortfolioData = {
  name: 'Arun Kumar',
  title: 'Competitive Programmer & Full-Stack Engineer',
  tagline: 'Crafting highly polished reactive frontends and designing scalable, time-optimal segment computations.',
  aboutMe: "I am a passionate competitive programmer and software engineer who loves algorithms, visual design ecosystems, and type-safe systems. Solving problems and building beautiful applications are where I operate best. Here you can explore my platform analytics, tracking system, and portfolio highlights.",
  skills: [
    'Data Structures & Algorithms',
    'C++',
    'TypeScript / JavaScript',
    'React & Next.js',
    'Node.js & Express',
    'Zustand / Redux',
    'Tailwind CSS',
    'Python',
    'Git & GitHub'
  ],
  projects: [
    {
      id: 'p1',
      title: 'AlgoLumina',
      tagline: 'Interactive DSA Visualizer',
      description: 'An interactive algorithm studio displaying trees, segments, and pathfinding solvers with customizable speed and graph feeds.',
      techStack: ['TypeScript', 'React', 'Framer Motion', 'Web Workers'],
      githubUrl: 'https://github.com',
      liveUrl: 'https://example.com',
      featured: true
    },
    {
      id: 'p2',
      title: 'Segtree WASM solver',
      tagline: 'WebAssembly Optimized Queries',
      description: 'A WebAssembly-loaded structural segment manager capable of solving multi-dimensional segment trees in microseconds in-browser.',
      techStack: ['Rust', 'WASM', 'WebPack', 'TypeScript'],
      githubUrl: 'https://github.com',
      featured: true
    },
    {
      id: 'p3',
      title: 'Competitive Tracker CLI',
      tagline: 'Rust-based Command Line tool',
      description: 'A CLI tool to parse, compile, and run testcases against official competitive websites in 3ms.',
      techStack: ['Rust', 'Tokio', 'Reqwest'],
      githubUrl: 'https://github.com',
      featured: false
    }
  ],
  education: [],
  cpHighlights: {
    maxCodeforcesRating: 1756,
    leetcodeStreak: 15,
    totalSolved: 1179
  }
};

const initialSettings: UserSettings = {
  usernames: {
    codeforces: '',
    leetcode: '',
    codechef: '',
    atcoder: '',
    github: ''
  },
  theme: 'dark',
  contestReminders: true,
  refreshInterval: 15,
  defaultReminderTime: 60
};

/** Firestore rules only allow specific user document fields. */
function toFirestoreUserDoc(settings: UserSettings, uid: string): UserSettings & { id: string } {
  const doc: UserSettings & { id: string } = {
    id: uid,
    usernames: settings.usernames,
    theme: settings.theme,
    contestReminders: settings.contestReminders,
    refreshInterval: settings.refreshInterval,
  };
  if (settings.defaultReminderTime !== undefined) {
    doc.defaultReminderTime = settings.defaultReminderTime;
  }
  if (settings.displayName?.trim()) {
    doc.displayName = settings.displayName.trim();
  }
  if (settings.avatarUrl) {
    doc.avatarUrl = settings.avatarUrl;
  }
  return doc;
}

function persistSettingsLocally(settings: UserSettings) {
  try {
    localStorage.setItem('codebase_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to persist settings to localStorage', e);
  }
}

export const useCodeBaseStore = create<CodeBaseState>((set, get) => {
  // Load from local storage has fallbacks
  const getStoredSettings = (): UserSettings => {
    try {
      const saved = localStorage.getItem('codebase_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialSettings;
  };

  const getStoredProblemLogs = (): ProblemLog[] => {
    try {
      const saved = localStorage.getItem('codebase_problems');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultProblemLogs;
  };

  const getStoredStats = (): DashboardStats | null => {
    try {
      const saved = localStorage.getItem('codebase_stats');
      if (saved) {
        const stats = JSON.parse(saved);
        // Verify age
        const ttl = getStoredSettings().refreshInterval * 60 * 1000;
        const lastUpdated = new Date(stats.lastUpdated).getTime();
        if (Date.now() - lastUpdated < ttl) {
          return stats;
        }
      }
    } catch (e) {}
    return null;
  };

  const getStoredPortfolio = (): PortfolioData => {
    try {
      const saved = localStorage.getItem('codebase_portfolio');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultPortfolio;
  };

  const getStoredReminders = (): Reminder[] => {
    try {
      const saved = localStorage.getItem('codebase_reminders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  };

  const getStoredContestHistory = (): ContestHistoryEntry[] => {
    try {
      const saved = localStorage.getItem('codebase_contest_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'seed-1', userId: 'default', contestName: 'LeetCode Weekly Contest 398', platform: 'LC', date: '2026-05-24', rank: 1240, totalParticipants: 22000, problemsSolved: 3, totalProblems: 4, ratingBefore: 1890, ratingAfter: 1912, ratingDelta: 22, notes: 'Missed Q4 hard DP problem. Need to practice more tree DP.' },
      { id: 'seed-2', userId: 'default', contestName: 'Codeforces Round #1012 (Div.2)', platform: 'CF', date: '2026-05-22', rank: 450, totalParticipants: 9400, problemsSolved: 4, totalProblems: 6, ratingBefore: 1700, ratingAfter: 1756, ratingDelta: 56, notes: 'Strong performance. Solved A-D in first 45 min.' },
      { id: 'seed-3', userId: 'default', contestName: 'CodeChef Starters 135 (Div.2)', platform: 'CC', date: '2026-05-18', rank: 184, totalParticipants: 4500, problemsSolved: 5, totalProblems: 6, ratingBefore: 1761, ratingAfter: 1845, ratingDelta: 84, notes: 'Best CodeChef performance yet. Only missed final problem.' },
      { id: 'seed-4', userId: 'default', contestName: 'LeetCode Biweekly Contest 130', platform: 'LC', date: '2026-05-11', rank: 2100, totalParticipants: 18000, problemsSolved: 2, totalProblems: 4, ratingBefore: 1920, ratingAfter: 1890, ratingDelta: -30, notes: 'Bad contest. Got stuck on Q3 binary search variant.' },
      { id: 'seed-5', userId: 'default', contestName: 'Codeforces Round #1008 (Div.2)', platform: 'CF', date: '2026-05-08', rank: 1200, totalParticipants: 11000, problemsSolved: 3, totalProblems: 6, ratingBefore: 1720, ratingAfter: 1700, ratingDelta: -20, notes: 'C was tricky greedy. D approach was right but TLE on test 15.' },
      { id: 'seed-6', userId: 'default', contestName: 'AtCoder Beginner Contest 355', platform: 'AC', date: '2026-05-04', rank: 890, totalParticipants: 7000, problemsSolved: 5, totalProblems: 7, ratingBefore: 1060, ratingAfter: 1104, ratingDelta: 44, notes: 'Clean solve through E. F was graph theory beyond current level.' },
      { id: 'seed-7', userId: 'default', contestName: 'LeetCode Weekly Contest 396', platform: 'LC', date: '2026-04-27', rank: 980, totalParticipants: 20000, problemsSolved: 4, totalProblems: 4, ratingBefore: 1870, ratingAfter: 1920, ratingDelta: 50, notes: 'Perfect contest! All 4 solved. Q4 was segment tree which is my strength.' },
      { id: 'seed-8', userId: 'default', contestName: 'Codeforces Round #1005 (Div.2)', platform: 'CF', date: '2026-04-20', rank: 650, totalParticipants: 10200, problemsSolved: 4, totalProblems: 6, ratingBefore: 1680, ratingAfter: 1720, ratingDelta: 40, notes: 'Solid performance. D was a nice constructive problem.' }
    ];
  };

  const initialStore = {
    currentTab: 'home' as const,
    portfolioMode: 'private' as const,
    sidebarCollapsed: false,
    settings: getStoredSettings(),
    problemLogs: getStoredProblemLogs(),
    contests: [],
    stats: getStoredStats(),
    fetchErrors: {},
    portfolio: getStoredPortfolio(),
    reminders: getStoredReminders(),
    contestHistory: getStoredContestHistory(),
    user: null,
    authLoading: true,
    loading: {
      stats: false,
      contests: false
    }
  };

  return {
    ...initialStore,

    setTab: (tab) => set({ currentTab: tab }),
    setPortfolioMode: (mode) => set({ portfolioMode: mode }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    
    // Auth State Initializer
    initAuth: () => {
      onAuthStateChanged(auth, async (authUser) => {
        // Unsubscribe from any previous Firestore listeners first
        const prevSubs = (get() as any)._firestoreSubs || [];
        prevSubs.forEach((unsub: () => void) => {
          try { unsub(); } catch (e) {}
        });
        set({ _firestoreSubs: [] } as any);

        if (authUser) {
          const uid = authUser.uid;
          set({ user: authUser, authLoading: false });

          // Check if setting doc exists, otherwise seed Firestore with local data
          const settingsRef = doc(db, 'users', uid);
          let docSnap;
          try {
            docSnap = await getDoc(settingsRef);
          } catch (e) {
            console.error("Failed to check settings on Firestore", e);
          }

          if (!docSnap || !docSnap.exists()) {
            console.log("Seeding Firestore data for new user", uid);
            try {
              // 1. Seed global User Settings
              const seededSettings = getStoredSettings();
              await setDoc(doc(db, 'users', uid), toFirestoreUserDoc(seededSettings, uid));

              // 2. Seed Portfolio
              await setDoc(doc(db, 'users', uid, 'portfolio', 'main'), getStoredPortfolio());

              // 3. Seed problem logs
              const seededLogs = getStoredProblemLogs();
              const promises = seededLogs.map(log => 
                setDoc(doc(db, 'users', uid, 'problemLogs', log.id), {
                  ...log,
                  userId: uid
                })
              );
              await Promise.all(promises);

              // 4. Seed contest history
              const seededHistory = getStoredContestHistory();
              const historyPromises = seededHistory.map(entry =>
                setDoc(doc(db, 'users', uid, 'contestHistory', entry.id), {
                  ...entry,
                  userId: uid
                })
              );
              await Promise.all(historyPromises);
            } catch (seedErr) {
              console.error("Seeding aborted due to permissions/network: ", seedErr);
            }
          }

          // Start active onSnapshot synchronization
          const unsubSettings = onSnapshot(doc(db, 'users', uid), (settingsDoc) => {
            if (settingsDoc.exists()) {
              let remoteSettings = settingsDoc.data() as UserSettings;
              const localSettings = getStoredSettings();
              const remoteHasHandles = Object.values(remoteSettings.usernames || {}).some((h) => h?.trim());
              const localHasHandles = Object.values(localSettings.usernames || {}).some((h) => h?.trim());

              // Recover handles saved locally when cloud doc is still empty (failed sync earlier)
              if (!remoteHasHandles && localHasHandles) {
                remoteSettings = {
                  ...remoteSettings,
                  usernames: { ...remoteSettings.usernames, ...localSettings.usernames },
                };
                setDoc(doc(db, 'users', uid), toFirestoreUserDoc(remoteSettings, uid), { merge: true }).catch(
                  (err) => console.warn('Could not backfill handles to Firestore', err)
                );
              }

              if (remoteSettings.theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
              persistSettingsLocally(remoteSettings);
              set({ settings: remoteSettings });
              const hasHandles = Object.values(remoteSettings.usernames || {}).some((h) => h?.trim());
              if (hasHandles) {
                get().refreshStats(true);
              }
            }
          }, (err) => {
            console.error("Realtime settings sync error:", err);
          });

          const unsubProblemLogs = onSnapshot(collection(db, 'users', uid, 'problemLogs'), (colSnap) => {
            const logs: ProblemLog[] = [];
            colSnap.forEach((itemSnap) => {
              logs.push(itemSnap.data() as ProblemLog);
            });
            // Sort by date descending
            logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ problemLogs: logs });
          }, (err) => {
            console.error("Realtime problemLogs sync error:", err);
          });

          const unsubPortfolio = onSnapshot(doc(db, 'users', uid, 'portfolio', 'main'), (portfolioDoc) => {
            if (portfolioDoc.exists()) {
              set({ portfolio: portfolioDoc.data() as PortfolioData });
            }
          }, (err) => {
            console.error("Realtime portfolio sync error:", err);
          });

          const unsubReminders = onSnapshot(collection(db, 'users', uid, 'reminders'), (colSnap) => {
            const rems: Reminder[] = [];
            colSnap.forEach((itemSnap) => {
              rems.push(itemSnap.data() as Reminder);
            });
            set({ reminders: rems });
          }, (err) => {
            console.error("Realtime reminders sync error:", err);
          });

          const unsubContestHistory = onSnapshot(collection(db, 'users', uid, 'contestHistory'), (colSnap) => {
            const entries: ContestHistoryEntry[] = [];
            colSnap.forEach((itemSnap) => {
              entries.push(itemSnap.data() as ContestHistoryEntry);
            });
            entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ contestHistory: entries });
          }, (err) => {
            console.error("Realtime contestHistory sync error:", err);
          });

          // Store cleanup references in store context
          set({ _firestoreSubs: [unsubSettings, unsubProblemLogs, unsubPortfolio, unsubReminders, unsubContestHistory] } as any);
        } else {
          // Revert back safely to local user state
          set({ 
            user: null, 
            authLoading: false,
            settings: getStoredSettings(),
            problemLogs: getStoredProblemLogs(),
            portfolio: getStoredPortfolio(),
            reminders: getStoredReminders(),
            contestHistory: getStoredContestHistory()
          });
        }
      });
    },

    signUpWithEmail: async (email, password) => {
      set({ authLoading: true });
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        set({ authLoading: false });
        throw err;
      }
    },

    loginWithEmail: async (email, password) => {
      set({ authLoading: true });
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        set({ authLoading: false });
        throw err;
      }
    },

    loginWithGoogle: async () => {
      set({ authLoading: true });
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err) {
        set({ authLoading: false });
        throw err;
      }
    },

    logout: async () => {
      set({ authLoading: true });
      try {
        await signOut(auth);
      } catch (err) {
        set({ authLoading: false });
      }
    },
    
    updateSettings: async (newSettings) => {
      const state = get();
      const updated: UserSettings = {
        ...state.settings,
        ...newSettings,
        usernames: newSettings.usernames
          ? { ...state.settings.usernames, ...newSettings.usernames }
          : state.settings.usernames,
      };

      // Apply theme immediately to DOM
      if (newSettings.theme !== undefined) {
        if (newSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      // Always update in-memory state and local backup first (survives reload + failed cloud sync)
      set({ settings: updated });
      persistSettingsLocally(updated);

      const user = state.user;
      if (user) {
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            toFirestoreUserDoc(updated, user.uid),
            { merge: true }
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const needsVerification =
            message.includes('PERMISSION_DENIED') &&
            auth.currentUser &&
            !auth.currentUser.emailVerified &&
            auth.currentUser.providerData.every((p) => p.providerId !== 'google.com');
          console.error('Firestore settings sync failed:', err);
          throw new Error(
            needsVerification
              ? 'Settings saved on this device. Verify your email to sync to the cloud.'
              : 'Settings saved on this device. Cloud sync failed — check your connection or try again.'
          );
        }
      }

      await get().refreshStats(true);
    },

    addProblemLog: async (log) => {
      const user = get().user;
      const logId = Date.now().toString();
      const newLog: ProblemLog = {
        ...log,
        id: logId,
        userId: user ? user.uid : 'local'
      };

      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'problemLogs', logId), newLog);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/problemLogs/${logId}`);
        }
      } else {
        const updated = [newLog, ...get().problemLogs];
        localStorage.setItem('codebase_problems', JSON.stringify(updated));
        set({ problemLogs: updated });
      }
    },

    updateProblemLog: async (id, log) => {
      const user = get().user;
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'problemLogs', id), log);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/problemLogs/${id}`);
        }
      } else {
        const updated = get().problemLogs.map((item) => 
          item.id === id ? { ...item, ...log } : item
        );
        localStorage.setItem('codebase_problems', JSON.stringify(updated));
        set({ problemLogs: updated });
      }
    },

    deleteProblemLog: async (id) => {
      const user = get().user;
      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'problemLogs', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/problemLogs/${id}`);
        }
      } else {
        const updated = get().problemLogs.filter((item) => item.id !== id);
        localStorage.setItem('codebase_problems', JSON.stringify(updated));
        set({ problemLogs: updated });
      }
    },

    updatePortfolio: async (portfolioData) => {
      const user = get().user;
      const updated = { ...get().portfolio, ...portfolioData };

      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'portfolio', 'main'), updated, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/portfolio/main`);
        }
      } else {
        localStorage.setItem('codebase_portfolio', JSON.stringify(updated));
        set({ portfolio: updated });
      }
    },

    // Reminder Actions
    addReminder: async (contestId, contestName, contestStartTime, platform, offsetMins) => {
      const user = get().user;
      const uid = user ? user.uid : 'local';
      const reminderId = `${contestId}-${offsetMins}`;

      const newReminder: Reminder = {
        id: reminderId,
        userId: uid,
        contestId,
        contestName,
        contestStartTime,
        platform,
        reminderTimeOffset: offsetMins,
        notified: false
      };

      if (user) {
        try {
          await setDoc(doc(db, 'users', uid, 'reminders', reminderId), newReminder);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}/reminders/${reminderId}`);
        }
      } else {
        const currentRems = get().reminders || [];
        const updated = [...currentRems.filter(r => r.id !== reminderId), newReminder];
        localStorage.setItem('codebase_reminders', JSON.stringify(updated));
        set({ reminders: updated });
      }
    },

    removeReminder: async (reminderId) => {
      const user = get().user;
      const uid = user ? user.uid : 'local';

      if (user) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'reminders', reminderId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${uid}/reminders/${reminderId}`);
        }
      } else {
        const currentRems = get().reminders || [];
        const updated = currentRems.filter(r => r.id !== reminderId);
        localStorage.setItem('codebase_reminders', JSON.stringify(updated));
        set({ reminders: updated });
      }
    },

    markReminderAsNotified: async (reminderId) => {
      const user = get().user;
      const uid = user ? user.uid : 'local';

      if (user) {
        try {
          await updateDoc(doc(db, 'users', uid, 'reminders', reminderId), { notified: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/reminders/${reminderId}`);
        }
      } else {
        const currentRems = get().reminders || [];
        const updated = currentRems.map(r => r.id === reminderId ? { ...r, notified: true } : r);
        localStorage.setItem('codebase_reminders', JSON.stringify(updated));
        set({ reminders: updated });
      }
    },

    // Contest History CRUD Actions
    addContestHistory: async (entry) => {
      const user = get().user;
      const entryId = Date.now().toString();
      const newEntry: ContestHistoryEntry = {
        ...entry,
        id: entryId,
        userId: user ? user.uid : 'local'
      };

      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'contestHistory', entryId), newEntry);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/contestHistory/${entryId}`);
        }
      } else {
        const updated = [newEntry, ...get().contestHistory];
        updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem('codebase_contest_history', JSON.stringify(updated));
        set({ contestHistory: updated });
      }
    },

    updateContestHistory: async (id, entry) => {
      const user = get().user;
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'contestHistory', id), entry);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/contestHistory/${id}`);
        }
      } else {
        const updated = get().contestHistory.map((item) =>
          item.id === id ? { ...item, ...entry } : item
        );
        localStorage.setItem('codebase_contest_history', JSON.stringify(updated));
        set({ contestHistory: updated });
      }
    },

    deleteContestHistory: async (id) => {
      const user = get().user;
      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'contestHistory', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/contestHistory/${id}`);
        }
      } else {
        const updated = get().contestHistory.filter((item) => item.id !== id);
        localStorage.setItem('codebase_contest_history', JSON.stringify(updated));
        set({ contestHistory: updated });
      }
    },

    refreshStats: async (force = false) => {
      const { settings, stats, loading } = get();
      if (loading.stats) return;

      const { usernames } = settings;
      const missingHeatmapData =
        (usernames.leetcode?.trim() && !stats?.leetcode?.dailySubmissions) ||
        (usernames.codeforces?.trim() && !stats?.codeforces?.dailySubmissions) ||
        (usernames.github?.trim() && !stats?.github?.dailyCommits);

      // If already has stats and not forced, check TTL (unless daily heatmap data is missing)
      if (stats && !force && !missingHeatmapData) {
        const ttl = settings.refreshInterval * 60 * 1000;
        const lastUpdated = new Date(stats.lastUpdated).getTime();
        if (Date.now() - lastUpdated < ttl) {
          return; // Skip refetch, cache is fresh
        }
      }

      set((state) => ({ loading: { ...state.loading, stats: true } }));

      try {
        // Fetch stats in parallel for configured platforms only
        const fetchPromises: Array<Promise<any>> = [];
        
        const apiBase = '/api';
        const fetchErrors: PlatformFetchErrors = {};

        let cfStats: CodeforcesStats | null = null;
        let lcStats: LeetCodeStats | null = null;
        let ccStats: CodeChefStats | null = null;
        let acStats: AtCoderStats | null = null;
        let ghStats: GitHubStats | null = null;

        const fetchPlatform = (
          platform: keyof PlatformFetchErrors,
          url: string,
          setter: (data: any) => void
        ) => {
          fetchPromises.push(
            axios.get(url, { timeout: 15000 })
              .then(res => { setter(res.data); })
              .catch(err => {
                const data = err.response?.data;
                const msg = data?.error || data?.detail || err.message || 'Fetch failed';
                console.warn(`${platform} fetch failed:`, msg);
                fetchErrors[platform] = msg;
                setter(null);
              })
          );
        };

        if (usernames.codeforces) {
          fetchPlatform('codeforces', `${apiBase}/codeforces?handle=${encodeURIComponent(usernames.codeforces)}`, (d) => { cfStats = d; });
        }
        if (usernames.leetcode) {
          fetchPlatform('leetcode', `${apiBase}/leetcode?handle=${encodeURIComponent(usernames.leetcode)}`, (d) => { lcStats = d; });
        }
        if (usernames.codechef) {
          fetchPlatform('codechef', `${apiBase}/codechef?handle=${encodeURIComponent(usernames.codechef)}`, (d) => { ccStats = d; });
        }
        if (usernames.atcoder) {
          fetchPlatform('atcoder', `${apiBase}/atcoder?handle=${encodeURIComponent(usernames.atcoder)}`, (d) => { acStats = d; });
        }
        if (usernames.github) {
          fetchPlatform('github', `${apiBase}/github?username=${encodeURIComponent(usernames.github)}`, (d) => { ghStats = d; });
        }

        // Wait for all configured platforms to complete
        await Promise.allSettled(fetchPromises);

        const freshStats: DashboardStats = {
          codeforces: cfStats,
          leetcode: lcStats,
          codechef: ccStats,
          atcoder: acStats,
          github: ghStats,
          lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('codebase_stats', JSON.stringify(freshStats));

        // Update portfolio aggregates with updated statistics
        const totalSolvedVal = 
          (cfStats?.solvedCount || 0) + 
          (lcStats?.totalSolved || 0) + 
          (ccStats?.solvedCount || 0) + 
          (acStats?.solvedCount || 0);

        set((state) => {
          const updatedPortfolio: PortfolioData = {
            ...state.portfolio,
            cpHighlights: {
              maxCodeforcesRating: cfStats?.maxRating || state.portfolio.cpHighlights.maxCodeforcesRating,
              leetcodeStreak: lcStats?.streak || state.portfolio.cpHighlights.leetcodeStreak,
              totalSolved: totalSolvedVal > 0 ? totalSolvedVal : state.portfolio.cpHighlights.totalSolved
            }
          };
          localStorage.setItem('codebase_portfolio', JSON.stringify(updatedPortfolio));
          
          return {
            stats: freshStats,
            fetchErrors,
            portfolio: updatedPortfolio,
            loading: { ...state.loading, stats: false }
          };
        });
      } catch (err) {
        console.error('Stats refresh error:', err);
        set((state) => ({ loading: { ...state.loading, stats: false } }));
      }
    },

    refreshContests: async () => {
      const { loading } = get();
      if (loading.contests) return;

      set((state) => ({ loading: { ...state.loading, contests: true } }));

      try {
        // Fetch aggregated contest data from our serverless API endpoint
        // which collects from Codeforces API + Kontests.net (LC, CC, AC, HR, GFG)
        const response = await axios.get('/api/contests', { timeout: 20000 });
        
        let contests: Contest[] = [];
        
        if (response.data?.contests && Array.isArray(response.data.contests)) {
          contests = response.data.contests;
        }

        // Filter to only future contests
        const now = Date.now();
        contests = contests.filter((c) => {
          const startMs = new Date(c.startTime).getTime();
          const endMs = startMs + c.durationSeconds * 1000;
          return endMs > now; // Include ongoing + upcoming
        });

        // Sort by start time ascending
        contests.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        set((state) => ({
          contests,
          loading: { ...state.loading, contests: false }
        }));
      } catch (err) {
        console.error('Contest refresh error, attempting direct Kontests.net fallback:', err);

        // Fallback: fetch directly from Kontests.net and Codeforces API
        try {
          const endpoints = [
            { url: 'https://kontests.net/api/v1/all', transform: true },
          ];
          
          const kontestsResponse = await axios.get('https://kontests.net/api/v1/all', { timeout: 12000 });
          
          const platformMap: Record<string, Contest['platform']> = {
            'CodeForces': 'CF',
            'CodeForces::Gym': 'CF',
            'LeetCode': 'LC',
            'CodeChef': 'CC',
            'AtCoder': 'AC',
            'HackerRank': 'HR',
            'GeeksforGeeks': 'GFG',
          };
          
          const platformUrls: Record<string, string> = {
            CF: 'https://codeforces.com/contests',
            LC: 'https://leetcode.com/contest/',
            CC: 'https://www.codechef.com/contests',
            AC: 'https://atcoder.jp/contests',
            HR: 'https://www.hackerrank.com/contests',
            GFG: 'https://www.geeksforgeeks.org/events',
          };

          const now = Date.now();
          const fallbackContests: Contest[] = kontestsResponse.data
            .filter((c: any) => {
              const platform = platformMap[c.site];
              if (!platform) return false;
              const endTime = new Date(c.end_time).getTime();
              return endTime > now;
            })
            .map((c: any, idx: number) => {
              const platform = platformMap[c.site]!;
              return {
                id: `${platform.toLowerCase()}-fallback-${idx}`,
                platform,
                name: c.name,
                startTime: new Date(c.start_time).toISOString(),
                durationSeconds: parseInt(c.duration, 10) || 0,
                registrationUrl: c.url || platformUrls[platform] || '',
              };
            })
            .sort((a: Contest, b: Contest) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 50);

          set((state) => ({
            contests: fallbackContests,
            loading: { ...state.loading, contests: false }
          }));
        } catch (fallbackErr) {
          console.error('All contest fetching failed:', fallbackErr);
          set((state) => ({
            contests: [],
            loading: { ...state.loading, contests: false }
          }));
        }
      }
    }
  };
});
