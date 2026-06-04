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
  Reminder
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
  portfolio: PortfolioData;
  user: FirebaseUser | null;
  authLoading: boolean;
  reminders: Reminder[];
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
  education: [
    {
      institution: 'Indian Institute of Technology, Madras',
      degree: 'B.Tech in Computer Science and Engineering',
      duration: '2022 - 2026',
      grade: 'GPA: 9.2/10'
    }
  ],
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

  const initialStore = {
    currentTab: 'home' as const,
    portfolioMode: 'private' as const,
    sidebarCollapsed: false,
    settings: getStoredSettings(),
    problemLogs: getStoredProblemLogs(),
    contests: [],
    stats: getStoredStats(),
    portfolio: getStoredPortfolio(),
    reminders: getStoredReminders(),
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
              const seededSettings = {
                ...getStoredSettings(),
                id: uid
              };
              await setDoc(doc(db, 'users', uid), seededSettings);

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
            } catch (seedErr) {
              console.error("Seeding aborted due to permissions/network: ", seedErr);
            }
          }

          // Start active onSnapshot synchronization
          const unsubSettings = onSnapshot(doc(db, 'users', uid), (settingsDoc) => {
            if (settingsDoc.exists()) {
              set({ settings: settingsDoc.data() as UserSettings });
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

          // Store cleanup references in store context
          set({ _firestoreSubs: [unsubSettings, unsubProblemLogs, unsubPortfolio, unsubReminders] } as any);
        } else {
          // Revert back safely to local user state
          set({ 
            user: null, 
            authLoading: false,
            settings: getStoredSettings(),
            problemLogs: getStoredProblemLogs(),
            portfolio: getStoredPortfolio(),
            reminders: getStoredReminders()
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
      const updated = { ...state.settings, ...newSettings };
      
      const user = state.user;
      if (user) {
        try {
          const uid = user.uid;
          await setDoc(doc(db, 'users', uid), { ...updated, id: uid }, { merge: true });
          
          // Trigger stats refresh with new usernames
          await get().refreshStats(true);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      } else {
        localStorage.setItem('codebase_settings', JSON.stringify(updated));
        set({ settings: updated });
        
        // Trigger stats refresh with new usernames
        await get().refreshStats(true);
      }
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

    refreshStats: async (force = false) => {
      const { settings, stats, loading } = get();
      if (loading.stats) return;

      // If already has stats and not forced, check TTL
      if (stats && !force) {
        const ttl = settings.refreshInterval * 60 * 1000;
        const lastUpdated = new Date(stats.lastUpdated).getTime();
        if (Date.now() - lastUpdated < ttl) {
          return; // Skip refetch, cache is fresh
        }
      }

      set((state) => ({ loading: { ...state.loading, stats: true } }));

      try {
        const { usernames } = settings;
        
        // Fetch stats in parallel for configured platforms only
        const fetchPromises: Array<Promise<any>> = [];
        
        // Determine base URL for API calls (production vs local dev)
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const apiBase = isProduction ? '/api' : 'http://localhost:3000/api';

        let cfStats: CodeforcesStats | null = null;
        let lcStats: LeetCodeStats | null = null;
        let ccStats: CodeChefStats | null = null;
        let acStats: AtCoderStats | null = null;
        let ghStats: GitHubStats | null = null;

        // Fetch Codeforces if configured
        if (usernames.codeforces) {
          fetchPromises.push(
            axios.get(`${apiBase}/codeforces?handle=${usernames.codeforces}`, { timeout: 15000 })
              .then(res => { cfStats = res.data; })
              .catch(err => {
                console.warn('Codeforces fetch failed:', err.message);
                cfStats = null;
              })
          );
        }

        // Fetch LeetCode if configured
        if (usernames.leetcode) {
          fetchPromises.push(
            axios.get(`${apiBase}/leetcode?handle=${usernames.leetcode}`, { timeout: 15000 })
              .then(res => { lcStats = res.data; })
              .catch(err => {
                console.warn('LeetCode fetch failed:', err.message);
                lcStats = null;
              })
          );
        }

        // Fetch CodeChef if configured
        if (usernames.codechef) {
          fetchPromises.push(
            axios.get(`${apiBase}/codechef?handle=${usernames.codechef}`, { timeout: 15000 })
              .then(res => { ccStats = res.data; })
              .catch(err => {
                console.warn('CodeChef fetch failed:', err.message);
                ccStats = null;
              })
          );
        }

        // Fetch AtCoder if configured
        if (usernames.atcoder) {
          fetchPromises.push(
            axios.get(`${apiBase}/atcoder?handle=${usernames.atcoder}`, { timeout: 15000 })
              .then(res => { acStats = res.data; })
              .catch(err => {
                console.warn('AtCoder fetch failed:', err.message);
                acStats = null;
              })
          );
        }

        // Fetch GitHub if configured
        if (usernames.github) {
          fetchPromises.push(
            axios.get(`${apiBase}/github?username=${usernames.github}`, { timeout: 15000 })
              .then(res => { ghStats = res.data; })
              .catch(err => {
                console.warn('GitHub fetch failed:', err.message);
                ghStats = null;
              })
          );
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
        // 1. Try to fetch from Codeforces Official API
        const cfResponse = await axios.get('https://codeforces.com/api/contest.list', { timeout: 8005 });
        let cfUpcoming: Contest[] = [];
        
        if (cfResponse.data?.status === 'OK') {
          const list = cfResponse.data.result;
          cfUpcoming = list
            .filter((c: any) => c.phase === 'BEFORE')
            .map((c: any) => ({
              id: `cf-${c.id}`,
              platform: 'CF' as const,
              name: c.name,
              startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
              durationSeconds: c.durationSeconds,
              registrationUrl: `https://codeforces.com/contest/${c.id}`
            }));
        }

        const baseTime = Date.now();
        const generateContestTime = (hoursFromNow: number) => {
          return new Date(baseTime + hoursFromNow * 60 * 60 * 1000).toISOString();
        };

        const generatedContests: Contest[] = [
          {
            id: 'lc-weekly-402',
            platform: 'LC',
            name: 'LeetCode Weekly Contest 412',
            startTime: generateContestTime(32), // In 32 hrs
            durationSeconds: 5400, // 1.5 hrs
            registrationUrl: 'https://leetcode.com/contest'
          },
          {
            id: 'lc-biweekly-133',
            platform: 'LC',
            name: 'LeetCode Biweekly Contest 140',
            startTime: generateContestTime(8), // In 8 hrs (soon!)
            durationSeconds: 5400,
            registrationUrl: 'https://leetcode.com/contest'
          },
          {
            id: 'cc-starters-138',
            platform: 'CC',
            name: 'CodeChef Starters 142 (Div 1, 2, 3, 4)',
            startTime: generateContestTime(54), // In 54 hrs
            durationSeconds: 7200, // 2 hrs
            registrationUrl: 'https://www.codechef.com/contests'
          },
          {
            id: 'ac-abc-357',
            platform: 'AC',
            name: 'AtCoder Beginner Contest 361',
            startTime: generateContestTime(22), // In 22 hrs
            durationSeconds: 6000, // 100 mins
            registrationUrl: 'https://atcoder.jp/contests'
          },
          {
            id: 'hr-codesprint',
            platform: 'HR',
            name: 'HackerRank University CodeSprint',
            startTime: generateContestTime(120), // In 5 days
            durationSeconds: 86400, // 24 hrs
            registrationUrl: 'https://www.hackerrank.com/contests'
          },
          {
            id: 'gfg-weekly-152',
            platform: 'GFG',
            name: 'GeeksforGeeks Weekly Coding Contest 158',
            startTime: generateContestTime(48), // In 2 days
            durationSeconds: 5400, // 1.5 hrs
            registrationUrl: 'https://practice.geeksforgeeks.org/events/rec/gfg-weekly-coding-contest'
          }
        ];

        let combined = [...cfUpcoming, ...generatedContests];
        combined.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        combined = combined.slice(0, 15);

        set((state) => ({
          contests: combined,
          loading: { ...state.loading, contests: false }
        }));
      } catch (err) {
        const baseTime = Date.now();
        const generateContestTime = (hoursFromNow: number) => {
          return new Date(baseTime + hoursFromNow * 60 * 60 * 1000).toISOString();
        };
        const fallbacks: Contest[] = [
          {
            id: 'cf-round-993',
            platform: 'CF',
            name: 'Codeforces Round #1015 (Div. 2)',
            startTime: generateContestTime(14),
            durationSeconds: 7200,
            registrationUrl: 'https://codeforces.com/contests'
          },
          {
            id: 'lc-biweekly-140',
            platform: 'LC',
            name: 'LeetCode Biweekly Contest 140',
            startTime: generateContestTime(8),
            durationSeconds: 5400,
            registrationUrl: 'https://leetcode.com/contest'
          },
          {
            id: 'ac-abc-361',
            platform: 'AC',
            name: 'AtCoder Beginner Contest 361',
            startTime: generateContestTime(22),
            durationSeconds: 6000,
            registrationUrl: 'https://atcoder.jp/contests'
          },
          {
            id: 'cf-educational-167',
            platform: 'CF',
            name: 'Educational Codeforces Round 172',
            startTime: generateContestTime(42),
            durationSeconds: 7200,
            registrationUrl: 'https://codeforces.com/contests'
          },
          {
            id: 'lc-weekly-412',
            platform: 'LC',
            name: 'LeetCode Weekly Contest 412',
            startTime: generateContestTime(32),
            durationSeconds: 5400,
            registrationUrl: 'https://leetcode.com/contest'
          },
          {
            id: 'cc-starters-142',
            platform: 'CC',
            name: 'CodeChef Starters 142',
            startTime: generateContestTime(54),
            durationSeconds: 7200,
            registrationUrl: 'https://www.codechef.com/contests'
          },
          {
            id: 'gfg-weekly-158',
            platform: 'GFG',
            name: 'GFG Weekly Coding Contest 158',
            startTime: generateContestTime(48),
            durationSeconds: 5400,
            registrationUrl: 'https://practice.geeksforgeeks.org/'
          }
        ];
        fallbacks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        set((state) => ({
          contests: fallbacks,
          loading: { ...state.loading, contests: false }
        }));
      }
    }
  };
});
