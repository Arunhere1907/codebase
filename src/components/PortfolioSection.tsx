/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Terminal, 
  Award, 
  Code2, 
  Sparkles, 
  FileText, 
  Download, 
  ExternalLink, 
  User, 
  Briefcase, 
  GraduationCap, 
  Edit3, 
  Check, 
  Mail, 
  Github, 
  Plus, 
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import { useCodeBaseStore } from '../store';
import { PortfolioData, Project, Education } from '../types';

export default function PortfolioSection() {
  const { portfolio, updatePortfolio, portfolioMode, setPortfolioMode, stats } = useCodeBaseStore();
  const [isEditing, setIsEditing] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  
  // Tagline typewriter speed simulation
  useEffect(() => {
    let index = 0;
    const fullText = portfolio.tagline;
    setTypewriterText('');
    
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypewriterText((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 35);
    
    return () => clearInterval(interval);
  }, [portfolio.tagline, portfolioMode]);

  // Form states for Portfolio editors
  const [formName, setFormName] = useState(portfolio.name);
  const [formTitle, setFormTitle] = useState(portfolio.title);
  const [formTagline, setFormTagline] = useState(portfolio.tagline);
  const [formAbout, setFormAbout] = useState(portfolio.aboutMe);
  const [formSkills, setFormSkills] = useState(portfolio.skills.join(', '));
  const [formProjects, setFormProjects] = useState<Project[]>(portfolio.projects);
  const [formEducation, setFormEducation] = useState<Education[]>(portfolio.education);

  // Sync state if store updates
  useEffect(() => {
    setFormName(portfolio.name);
    setFormTitle(portfolio.title);
    setFormTagline(portfolio.tagline);
    setFormAbout(portfolio.aboutMe);
    setFormSkills(portfolio.skills.join(', '));
    setFormProjects(portfolio.projects);
    setFormEducation(portfolio.education);
  }, [portfolio]);

  const handleSavePortfolio = () => {
    updatePortfolio({
      name: formName,
      title: formTitle,
      tagline: formTagline,
      aboutMe: formAbout,
      skills: formSkills.split(',').map(s => s.trim()).filter(s => s.length > 0),
      projects: formProjects,
      education: formEducation
    });
    setIsEditing(false);
  };

  const handleAddProject = () => {
    const newProj: Project = {
      id: Date.now().toString(),
      title: 'New Project Title',
      tagline: 'Short catchy subtitle',
      description: 'Describe technological scope, impact, or outcomes here.',
      techStack: ['React', 'TypeScript'],
      githubUrl: 'https://github.com',
      featured: false
    };
    setFormProjects([...formProjects, newProj]);
  };

  const handleUpdateProjectField = (id: string, field: keyof Project, value: any) => {
    setFormProjects(prev => prev.map(proj => {
      if (proj.id !== id) return proj;
      if (field === 'techStack') {
        return { ...proj, techStack: value.split(',').map((s: string) => s.trim()) };
      }
      return { ...proj, [field]: value };
    }));
  };

  const handleRemoveProject = (id: string) => {
    setFormProjects(prev => prev.filter(p => p.id !== id));
  };

  // Compile offline self-contained HTML
  const handleExportHTML = () => {
    const skillsListHTML = portfolio.skills.map(s => `<span class="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs">${s}</span>`).join('\n');
    const projectsListHTML = portfolio.projects.map(p => `
      <div class="p-5 border border-zinc-900 bg-zinc-950/40 rounded-xl space-y-3">
        <div class="flex justify-between items-start gap-2">
          <div>
            <h4 class="text-sm font-bold text-white">${p.title}</h4>
            <p class="text-xs text-blue-400 font-mono mt-0.5">${p.tagline}</p>
          </div>
          <a href="${p.githubUrl}" target="_blank" class="text-zinc-500 hover:text-white"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
        </div>
        <p class="text-xs text-zinc-400 font-sans leading-relaxed">${p.description}</p>
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${p.techStack.map(s => `<span class="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono rounded">${s}</span>`).join('')}
        </div>
      </div>
    `).join('\n');

    const educationHTML = portfolio.education.map(e => `
      <div class="py-3">
        <h4 class="text-xs font-bold text-white">${e.degree}</h4>
        <p class="text-[11px] text-zinc-400 font-sans mt-0.5">${e.institution} • ${e.duration}</p>
        ${e.grade ? `<p class="text-[10px] text-zinc-500 font-mono mt-0.5">${e.grade}</p>` : ''}
      </div>
    `).join('\n');

    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${portfolio.name} - Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #09090b;
      color: #a1a1aa;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="selection:bg-blue-600 selection:text-white scroll-smooth">

  <!-- Nav bar -->
  <header class="fixed top-0 inset-x-0 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-50">
    <div class="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
      <span class="font-bold text-white tracking-tight">${portfolio.name}</span>
      <nav class="flex items-center gap-5 text-xs font-semibold text-zinc-400">
        <a href="#about" class="hover:text-white transition-colors">About</a>
        <a href="#skills" class="hover:text-white transition-colors">Skills</a>
        <a href="#projects" class="hover:text-white transition-colors">Projects</a>
        <a href="#cp" class="hover:text-white transition-colors">CP Stats</a>
      </nav>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-6 pt-28 pb-16 space-y-20">

    <!-- Hero Section -->
    <section id="about" class="space-y-4">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded bg-blue-500/10 text-blue-400 border border-blue-500/15">
        💻 PORTFOLIO EXPORT
      </div>
      <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">${portfolio.name}</h1>
      <p class="text-xs font-mono text-zinc-500">${portfolio.title}</p>
      
      <!-- Terminal tagline -->
      <div class="p-4 bg-zinc-950 border border-zinc-900 rounded-lg text-xs leading-relaxed font-mono">
        <span class="text-emerald-500">&gt;</span> ${portfolio.tagline}
      </div>

      <div class="text-sm leading-relaxed text-zinc-400 pt-3 border-t border-zinc-900">
        ${portfolio.aboutMe}
      </div>
    </section>

    <!-- Skills Section -->
    <section id="skills" class="space-y-4">
      <h3 class="text-xs font-mono uppercase tracking-wider text-white">Skills Matrix</h3>
      <div class="flex flex-wrap gap-2 pt-1">
        ${skillsListHTML}
      </div>
    </section>

    <!-- Projects Section -->
    <section id="projects" class="space-y-5">
      <h3 class="text-xs font-mono uppercase tracking-wider text-white">Featured Projects</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${projectsListHTML}
      </div>
    </section>

    <!-- Competitive Programming summary -->
    <section id="cp" class="p-5 border border-zinc-900 bg-zinc-950/20 rounded-xl space-y-4">
      <h3 class="text-xs font-mono uppercase tracking-wider text-white">Competitive Programming Highs</h3>
      <div class="grid grid-cols-3 gap-4 font-mono text-center">
        <div class="p-3 border border-zinc-900 rounded-lg">
          <span class="text-[10px] text-zinc-500 block">Peak Codeforces</span>
          <span class="text-base font-bold text-red-500">${portfolio.cpHighlights.maxCodeforcesRating}</span>
        </div>
        <div class="p-3 border border-zinc-900 rounded-lg">
          <span class="text-[10px] text-zinc-500 block">Streak Record</span>
          <span class="text-base font-bold text-amber-500">${portfolio.cpHighlights.leetcodeStreak} days</span>
        </div>
        <div class="p-3 border border-zinc-900 rounded-lg">
          <span class="text-[10px] text-zinc-500 block">Total Solves</span>
          <span class="text-base font-bold text-blue-400">${portfolio.cpHighlights.totalSolved}</span>
        </div>
      </div>
    </section>

    <!-- Education portion -->
    <section class="space-y-4">
      <h3 class="text-xs font-mono uppercase tracking-wider text-white">Academic Credentials</h3>
      <div class="divide-y divide-zinc-900">
        ${educationHTML}
      </div>
    </section>

    <!-- Contact portion -->
    <section class="p-5 border border-zinc-900 bg-zinc-950/40 rounded-xl space-y-2 text-center">
      <p class="text-xs text-zinc-400">Want to discuss segment trees or React frameworks?</p>
      <p class="text-sm font-bold text-white font-mono">arun.here01@gmail.com</p>
    </section>

  </main>

  <footer class="text-center py-8 text-[11px] font-mono text-zinc-600 border-t border-zinc-900">
    Generated from CodeBase dashboard on June 4, 2026.
  </footer>

</body>
</html>`;

    // Download flow trigger
    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${portfolio.name.toLowerCase().replace(/\s+/g, '_')}_portfolio.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Tab Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white tracking-tight">
            Developer Portfolio
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
            Build and preview your public shareable developer landing page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle dashboard public/private */}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
            <button
              id="portfolio-mode-private-btn"
              onClick={() => setPortfolioMode('private')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                portfolioMode === 'private' 
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-white/60'
              }`}
            >
              <Lock size={12} /> Dashboard View
            </button>
            <button
              id="portfolio-mode-public-btn"
              onClick={() => setPortfolioMode('public')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                portfolioMode === 'public' 
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-white/60'
              }`}
            >
              <Unlock size={12} /> Public Preview
            </button>
          </div>

          <button
            id="export-portfolio-html"
            onClick={handleExportHTML}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-zinc-100 dark:bg-white dark:text-zinc-900 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Download size={13} /> Export html
          </button>
        </div>
      </div>

      {portfolioMode === 'private' ? (
        // DASHBOARD MODE (PRIVATE SETUP)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Editor controls form */}
          <div className="lg:col-span-2 p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-white/10">
              <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white">
                Edit Portfolio Configurations
              </h2>
              <span className="text-[10px] font-mono text-gray-400 dark:text-white/40">Settings save to LocalStorage</span>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-white/40 font-semibold font-sans">Developer Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-white/40 font-semibold font-sans">Profession Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 dark:text-white/40 font-semibold font-sans">Typewriter intro tagline</label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 dark:text-white/40 font-semibold font-sans">About description</label>
                <textarea
                  rows={4}
                  value={formAbout}
                  onChange={(e) => setFormAbout(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 dark:text-white/40 font-semibold font-sans">Skills Matrix (comma-separated)</label>
                <input
                  type="text"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                />
              </div>

              {/* Editable Projects */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-white/40 font-semibold font-sans">Project Showcases</span>
                  <button
                    onClick={handleAddProject}
                    className="flex items-center gap-1 text-[11px] font-sans font-bold text-blue-500 hover:underline"
                  >
                    + Add New Project
                  </button>
                </div>

                <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                  {formProjects.map((p, pIdx) => (
                    <div key={p.id} className="p-3 bg-gray-50/50 dark:bg-white/5 rounded-lg border border-gray-150 dark:border-white/10 relative space-y-2">
                      <button
                        onClick={() => handleRemoveProject(p.id)}
                        className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={p.title}
                          placeholder="Title"
                          onChange={(e) => handleUpdateProjectField(p.id, 'title', e.target.value)}
                          className="bg-transparent border-b border-gray-200 dark:border-white/10 py-1 font-bold font-sans text-xs focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={p.tagline}
                          placeholder="Subtitle"
                          onChange={(e) => handleUpdateProjectField(p.id, 'tagline', e.target.value)}
                          className="bg-transparent border-b border-gray-200 dark:border-white/10 py-1 font-mono text-[10px] text-blue-500 focus:outline-none"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={p.description}
                        placeholder="Description"
                        onChange={(e) => handleUpdateProjectField(p.id, 'description', e.target.value)}
                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded p-1.5 focus:outline-none text-gray-800 dark:text-gray-250"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={p.techStack.join(', ')}
                          placeholder="Tech stack tags (comma sep)"
                          onChange={(e) => handleUpdateProjectField(p.id, 'techStack', e.target.value)}
                          className="bg-transparent border-b border-white/10 py-1 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={p.githubUrl}
                          placeholder="Github URL"
                          onChange={(e) => handleUpdateProjectField(p.id, 'githubUrl', e.target.value)}
                          className="bg-transparent border-b border-white/10 py-1 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save changes segment */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  onClick={handleSavePortfolio}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow"
                >
                  <Check size={14} /> Save Portfolio Details
                </button>
              </div>

            </div>
          </div>

          {/* Quick tips sidebar */}
          <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-4 h-fit">
            <h3 className="text-sm font-sans font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-blue-500" size={16} /> Quick Tips Portfolio
            </h3>
            <div className="text-xs text-gray-500 dark:text-white/40 space-y-3 font-sans leading-relaxed">
              <p>
                <strong>Public Mode</strong> toggles a gorgeous, slick shareable rendering optimized for recruiter review.
              </p>
              <p>
                The Competitive Programming statistics are derived automatically from your cached platform scores (Codeforces peak, LeetCode milestones).
              </p>
              <p>
                Clicking **Export HTML** triggers a local compilation script that bundles your colors, typography assets, and content into a single standalone `.html` bundle – ready to host on GitHub Pages or custom servers in 2 seconds.
              </p>
            </div>
          </div>

        </div>
      ) : (
        // PUBLIC PORTFOLIO PREVIEW MODE (RENDER VISITOR CARD)
        <div id="public-view-canvas" className="bg-zinc-950 text-zinc-300 min-h-screen rounded-xl border border-zinc-900 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
          
          <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
            
            {/* Header intro typewriter */}
            <section className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/10">
                <Terminal size={10} /> Typewriter tagline active
              </div>
              
              <h2 className="text-3xl font-sans font-bold text-white tracking-tight">
                {portfolio.name}
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">
                {portfolio.title}
              </p>

              {/* Typewriter terminal section */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-900/80 rounded-lg text-xs font-mono font-medium text-gray-300 leading-relaxed max-w-xl min-h-[50px] flex items-center">
                <span>
                  <strong className="text-emerald-500 mr-1.5">&gt;</strong>
                  {typewriterText}
                  <span className="w-1.5 h-3.5 bg-blue-500 ml-1 inline-block animate-pulse align-middle" />
                </span>
              </div>

              <div className="text-xs text-zinc-400 font-sans leading-relaxed pt-3 max-w-2xl">
                {portfolio.aboutMe}
              </div>
            </section>

            {/* Skills matrix Grid */}
            <section className="space-y-3">
              <h3 className="text-xs font-mono text-white uppercase tracking-wider">Professional skillset</h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {portfolio.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-xs font-sans rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* CP Highlights */}
            <section className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-4">
              <h3 className="text-xs font-mono text-white uppercase tracking-wider">Algorithms & CP Statistics</h3>
              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                <div className="p-3 border border-zinc-900 rounded-lg bg-zinc-900/30">
                  <span className="text-[9px] text-zinc-500 uppercase block">Max CF Rating</span>
                  <span className="text-base font-bold text-red-500 mt-1 block">
                    {portfolio.cpHighlights.maxCodeforcesRating}
                  </span>
                </div>
                <div className="p-3 border border-zinc-900 rounded-lg bg-zinc-900/30">
                  <span className="text-[9px] text-zinc-500 uppercase block">LeetCode Streak</span>
                  <span className="text-base font-bold text-amber-500 mt-1 block">
                    {portfolio.cpHighlights.leetcodeStreak} days
                  </span>
                </div>
                <div className="p-3 border border-zinc-900 rounded-lg bg-zinc-900/30">
                  <span className="text-[9px] text-zinc-500 uppercase block">Solved Combined</span>
                  <span className="text-base font-bold text-blue-400 mt-1 block">
                    {portfolio.cpHighlights.totalSolved}
                  </span>
                </div>
              </div>
            </section>

            {/* Project portfolio list cards */}
            <section className="space-y-4">
              <h3 className="text-xs font-mono text-white uppercase tracking-wider">Showcase engineering projects</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolio.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 bg-zinc-900/30 hover:bg-zinc-950 hover:border-zinc-700 transition-all duration-200 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-3.5"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-sans font-bold text-white uppercase tracking-tight">
                          {proj.title}
                        </h4>
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-white"
                        >
                          <Github size={14} />
                        </a>
                      </div>
                      <span className="text-[10px] text-blue-500 font-mono block">
                        {proj.tagline}
                      </span>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {proj.techStack.map((stack) => (
                        <span
                          key={stack}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
                        >
                          {stack}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Academic history */}
            <section className="space-y-3">
              <h3 className="text-xs font-mono text-white uppercase tracking-wider">Education Credentials</h3>
              <div className="divide-y divide-zinc-900 font-sans text-xs">
                {portfolio.education.map((edu, idx) => (
                  <div key={idx} className="py-2.5">
                    <h4 className="font-bold text-white">{edu.degree}</h4>
                    <p className="text-zinc-400 mt-0.5">{edu.institution} • {edu.duration}</p>
                    {edu.grade && <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{edu.grade}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* Footer visitor contact */}
            <section className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-lg text-center font-sans space-y-1.5">
              <p className="text-xs text-zinc-400">Want to run custom segment tree benchmarks or discuss full-stack details?</p>
              <div className="flex items-center justify-center gap-2 text-xs text-white">
                <Mail size={13} className="text-blue-500" />
                <span className="font-mono">arun.here01@gmail.com</span>
              </div>
            </section>

          </main>
        </div>
      )}

    </motion.div>
  );
}
