/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Platform = 'Codeforces' | 'LeetCode' | 'CodeChef' | 'AtCoder' | 'GitHub';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ProblemStatus = 'Solved' | 'Attempted' | 'Revisit';

export interface CodeforcesStats {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  solvedCount: number;
  history: Array<{ date: string; rating: number; rank?: number; contestName?: string }>;
  recentSubmissions: Array<{
    id: string | number;
    problemName: string;
    verdict: string;
    language: string;
    time: string;
  }>;
}

export interface LeetCodeStats {
  handle: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  streak: number;
  contestRating: number;
  badges: string[];
  history: Array<{ date: string; rating: number }>;
}

export interface CodeChefStats {
  handle: string;
  rating: number;
  stars: string;
  globalRank: number;
  countryRank: number;
  solvedCount: number;
  history: Array<{ date: string; rating: number }>;
}

export interface AtCoderStats {
  handle: string;
  rating: number;
  highestRating: number;
  rank: number;
  solvedCount: number;
  history: Array<{ date: string; rating: number }>;
}

export interface GitHubStats {
  username: string;
  contributionsThisWeek: number;
  streak: number;
  totalContributionsLastYear: number;
  topRepos: Array<{
    name: string;
    stars: number;
    language: string;
    url: string;
  }>;
}

export interface DashboardStats {
  codeforces: CodeforcesStats | null;
  leetcode: LeetCodeStats | null;
  codechef: CodeChefStats | null;
  atcoder: AtCoderStats | null;
  github: GitHubStats | null;
  lastUpdated: string;
}

export interface ProblemLog {
  id: string;
  userId?: string;
  name: string;
  platform: Platform;
  difficulty: Difficulty;
  topicTags: string[];
  status: ProblemStatus;
  timeTaken: number; // in minutes
  notes: string;
  date: string; // YYYY-MM-DD
}

export interface Contest {
  id: string;
  platform: 'CF' | 'LC' | 'CC' | 'AC' | 'HR' | 'GFG';
  name: string;
  startTime: string; // ISO string
  durationSeconds: number;
  registrationUrl: string;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  liveUrl?: string;
  featured: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  duration: string;
  grade?: string;
}

export interface PortfolioData {
  name: string;
  title: string;
  tagline: string;
  aboutMe: string;
  skills: string[];
  projects: Project[];
  education: Education[];
  cpHighlights: {
    maxCodeforcesRating: number;
    leetcodeStreak: number;
    totalSolved: number;
  };
}

export interface UserSettings {
  usernames: {
    codeforces: string;
    leetcode: string;
    codechef: string;
    atcoder: string;
    github: string;
  };
  theme: 'light' | 'dark';
  contestReminders: boolean;
  refreshInterval: number; // in minutes
  defaultReminderTime?: number;
}

export interface Reminder {
  id: string;
  userId: string;
  contestId: string;
  contestName: string;
  contestStartTime: string;
  platform: string;
  reminderTimeOffset: number; // in minutes
  notified: boolean;
}

