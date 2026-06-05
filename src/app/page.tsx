"use client";

import React, { useState, useEffect } from 'react';
import { Search, Rocket, Users as UsersIcon, Code, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';

/* ── Hero ──────────────────────────────────────────────────── */
const HeroSection = ({ onExplore, onHowItWorks }: { onExplore: () => void; onHowItWorks: () => void }) => (
  <div className="hero-grid">
    {/* Left Column: Text & CTAs */}
    <section className="hero-left-col">
      {/* Platform label */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'rgba(91,124,255,0.1)',
        border: '1px solid rgba(91,124,255,0.22)',
        borderRadius: '999px',
        padding: '5px 16px',
        marginBottom: '28px'
      }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: '#5b7cff', fontWeight: 600, letterSpacing: '0.02em' }}>
          Student Collaboration Platform · MMMUT
        </span>
      </div>

      {/* Heading */}
      <h1 style={{
        fontSize: 'clamp(2.8rem, 6.5vw, 4.5rem)',
        fontWeight: 800,
        lineHeight: 1.08,
        letterSpacing: '-0.03em',
        color: '#f8fafc',
        marginBottom: '20px'
      }}>
        Find your people.<br />
        <span style={{
          background: 'linear-gradient(135deg, #5b7cff 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Build real things.
        </span>
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: '1.05rem',
        color: '#94a3b8',
        marginBottom: '36px',
        maxWidth: '520px',
        lineHeight: 1.65,
        fontWeight: 400
      }}>
        Browse open student projects, discover teams matching your skills, and start shipping together.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          onClick={onExplore}
          style={{ padding: '13px 30px', fontSize: '1rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          Browse Projects <ArrowRight size={16} />
        </button>
        <button
          className="btn-ghost"
          onClick={onHowItWorks}
          style={{ padding: '13px 28px', fontSize: '1rem', borderRadius: '10px' }}
        >
          How it works
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '32px', marginTop: '48px', flexWrap: 'wrap' }}>
        {[
          { label: 'Open Projects', value: '20+' },
          { label: 'Active Builders', value: '100+' },
          { label: 'Teams Formed', value: '30+' }
        ].map(stat => (
          <div key={stat.label}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Right Column: Visual Connection Graph */}
    <div className="hero-right-col">
      {/* Background blur glow */}
      <div className="hero-glow" style={{
        position: 'absolute',
        width: '420px',
        height: '420px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%)',
        filter: 'blur(50px)',
        borderRadius: '50%',
        zIndex: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }} />

      <div className="network-graph-container" style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
        <svg width="100%" height="500px" viewBox="0 0 500 500" className="network-svg" style={{ display: 'block', overflow: 'visible' }}>
          {/* Definitions for Gradients */}
          <defs>
            <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="skillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
          </defs>

          {/* Connection Lines & Traveling Dots */}
          <g className="network-lines">
            {/* Solidity */}
            <line x1="250" y1="250" x2="250" y2="80" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle r="3" fill="#a78bfa">
              <animateMotion path="M 250 250 L 250 80" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Flutter */}
            <line x1="250" y1="250" x2="382" y2="132" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle r="3" fill="#a78bfa">
              <animateMotion path="M 250 250 L 382 132" dur="2.4s" repeatCount="indefinite" />
            </circle>

            {/* Python */}
            <line x1="250" y1="250" x2="420" y2="283" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle r="3" fill="#a78bfa">
              <animateMotion path="M 250 250 L 420 283" dur="2.8s" repeatCount="indefinite" />
            </circle>

            {/* Figma */}
            <line x1="250" y1="250" x2="335" y2="408" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle r="3" fill="#a78bfa">
              <animateMotion path="M 250 250 L 335 408" dur="3.2s" repeatCount="indefinite" />
            </circle>

            {/* Node.js */}
            <line x1="250" y1="250" x2="132" y2="415" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle r="3" fill="#a78bfa">
              <animateMotion path="M 250 250 L 132 415" dur="3.6s" repeatCount="indefinite" />
            </circle>

            {/* UI/UX */}
            <line x1="250" y1="250" x2="72" y2="265" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle r="3" fill="#a78bfa">
              <animateMotion path="M 250 250 L 72 265" dur="4s" repeatCount="indefinite" />
            </circle>

            {/* ML */}
            <line x1="250" y1="250" x2="118" y2="118" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle r="3" fill="#a78bfa">
              <animateMotion path="M 250 250 L 118 118" dur="4.4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Student Nodes */}
          {/* Node 1: Solidity */}
          <g className="node-g" style={{ animation: 'float1 5.2s ease-in-out infinite' }}>
            <circle cx="250" cy="80" r="16" fill="url(#skillGrad)" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.7))' }} />
            {/* Person avatar icon */}
            <circle cx="250" cy="76.5" r="3.5" fill="#ffffff" opacity="0.9" />
            <path d="M 244 86.5 A 6 6 0 0 1 256 86.5" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.9" />
            <text x="250" y="108" className="node-label" style={{ fontSize: '11px', fill: '#a5b4fc', textAnchor: 'middle', fontWeight: 500 }}>Solidity</text>
          </g>

          {/* Node 2: Flutter */}
          <g className="node-g" style={{ animation: 'float2 6.4s ease-in-out infinite' }}>
            <circle cx="382" cy="132" r="16" fill="url(#skillGrad)" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.7))' }} />
            {/* Person avatar icon */}
            <circle cx="382" cy="128.5" r="3.5" fill="#ffffff" opacity="0.9" />
            <path d="M 376 138.5 A 6 6 0 0 1 388 138.5" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.9" />
            <text x="382" y="160" className="node-label" style={{ fontSize: '11px', fill: '#a5b4fc', textAnchor: 'middle', fontWeight: 500 }}>Flutter</text>
          </g>

          {/* Node 3: Python */}
          <g className="node-g" style={{ animation: 'float3 7.1s ease-in-out infinite' }}>
            <circle cx="420" cy="283" r="16" fill="url(#skillGrad)" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.7))' }} />
            {/* Person avatar icon */}
            <circle cx="420" cy="279.5" r="3.5" fill="#ffffff" opacity="0.9" />
            <path d="M 414 289.5 A 6 6 0 0 1 426 289.5" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.9" />
            <text x="420" y="311" className="node-label" style={{ fontSize: '11px', fill: '#a5b4fc', textAnchor: 'middle', fontWeight: 500 }}>Python</text>
          </g>

          {/* Node 4: Figma */}
          <g className="node-g" style={{ animation: 'float4 8.3s ease-in-out infinite' }}>
            <circle cx="335" cy="408" r="16" fill="url(#skillGrad)" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.7))' }} />
            {/* Person avatar icon */}
            <circle cx="335" cy="404.5" r="3.5" fill="#ffffff" opacity="0.9" />
            <path d="M 329 414.5 A 6 6 0 0 1 341 414.5" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.9" />
            <text x="335" y="436" className="node-label" style={{ fontSize: '11px', fill: '#a5b4fc', textAnchor: 'middle', fontWeight: 500 }}>Figma</text>
          </g>

          {/* Node 5: Node.js */}
          <g className="node-g" style={{ animation: 'float5 5.8s ease-in-out infinite' }}>
            <circle cx="132" cy="415" r="16" fill="url(#skillGrad)" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.7))' }} />
            {/* Person avatar icon */}
            <circle cx="132" cy="411.5" r="3.5" fill="#ffffff" opacity="0.9" />
            <path d="M 126 421.5 A 6 6 0 0 1 138 421.5" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.9" />
            <text x="132" y="443" className="node-label" style={{ fontSize: '11px', fill: '#a5b4fc', textAnchor: 'middle', fontWeight: 500 }}>Node.js</text>
          </g>

          {/* Node 6: UI/UX */}
          <g className="node-g" style={{ animation: 'float6 6.9s ease-in-out infinite' }}>
            <circle cx="72" cy="265" r="16" fill="url(#skillGrad)" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.7))' }} />
            {/* Person avatar icon */}
            <circle cx="72" cy="261.5" r="3.5" fill="#ffffff" opacity="0.9" />
            <path d="M 66 271.5 A 6 6 0 0 1 78 271.5" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.9" />
            <text x="72" y="293" className="node-label" style={{ fontSize: '11px', fill: '#a5b4fc', textAnchor: 'middle', fontWeight: 500 }}>UI/UX</text>
          </g>

          {/* Node 7: ML */}
          <g className="node-g" style={{ animation: 'float7 7.7s ease-in-out infinite' }}>
            <circle cx="118" cy="118" r="16" fill="url(#skillGrad)" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.7))' }} />
            {/* Person avatar icon */}
            <circle cx="118" cy="114.5" r="3.5" fill="#ffffff" opacity="0.9" />
            <path d="M 112 124.5 A 6 6 0 0 1 124 124.5" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.9" />
            <text x="118" y="146" className="node-label" style={{ fontSize: '11px', fill: '#a5b4fc', textAnchor: 'middle', fontWeight: 500 }}>ML</text>
          </g>

          {/* Central Platform Hub */}
          <g className="hub-g">
            <circle cx="250" cy="250" r="28" fill="url(#hubGrad)" style={{ filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.9))' }} />
            {/* ProjectHub lightning bolt icon as centered text */}
            <text x="250" y="257" textAnchor="middle" fontSize="20px" fill="#ffffff" style={{ fontWeight: 'bold' }}>⚡</text>
          </g>
        </svg>
      </div>
    </div>
  </div>
);

/* ── How It Works ──────────────────────────────────────────── */
const HowItWorksSection = () => (
  <section id="how-it-works" style={{ padding: '56px 0 48px', scrollMarginTop: '100px' }}>
    <div style={{ marginBottom: '36px' }}>
      <h2 style={{
        fontSize: '1.75rem', fontWeight: 700,
        color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.5px'
      }}>
        How it works
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
        Three steps to find your team and start building
      </p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
      {[
        {
          icon: <Rocket size={22} />,
          title: 'Post a project',
          desc: 'Describe your idea, set expectations, and list the skills you need from teammates.'
        },
        {
          icon: <Search size={22} />,
          title: 'Find a fit',
          desc: 'Browse open projects, filter by skills and commitment, and see your match score.'
        },
        {
          icon: <UsersIcon size={22} />,
          title: 'Join a team',
          desc: 'Apply with a short pitch, get accepted by the founder, and start shipping.',
          accent: true
        }
      ].map((step, i) => (
        <div key={i} className="step-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '10px',
            background: step.accent ? 'rgba(139,92,246,0.14)' : 'rgba(91,124,255,0.12)',
            color: step.accent ? '#8b5cf6' : '#5b7cff',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {step.icon}
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', marginBottom: '6px', letterSpacing: '-0.01em' }}>
              {i + 1}. {step.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              {step.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ── Main Page ─────────────────────────────────────────────── */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [projects, setProjects] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('student');
  const [dbError, setDbError] = useState<string | null>(null);
  const router = useRouter();

  const filters = ['All', 'Web App', 'Mobile App', 'AI/ML', 'Hardware/IoT'];

  useEffect(() => {
    async function fetchProjects() {
      let userSkills: string[] = [];

      if (user) {
        const { data: uSkills } = await supabase
          .from('user_skills')
          .select('skill_name')
          .eq('user_id', user.id);
        if (uSkills) {
          userSkills = uSkills.map((s: any) => s.skill_name.toLowerCase());
        }

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserRole(profile.role || 'student');
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, title, type, description, commitment, team_size, stage, status,
          users!projects_founder_id_fkey ( full_name, avatar_url ),
          project_skills!project_skills_project_id_fkey ( skill_name, is_required ),
          endorsements!endorsements_project_id_fkey ( id )
        `)
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Error:', error);
        setDbError(error.message || JSON.stringify(error));
      }

      if (data) {
        let formattedProjects = data.map((p: any) => {
          const reqSkills = p.project_skills ? p.project_skills.filter((s: any) => s.is_required).map((s: any) => s.skill_name) : [];
          const niceSkills = p.project_skills ? p.project_skills.filter((s: any) => !s.is_required).map((s: any) => s.skill_name) : [];

          let matchedSkills: string[] = [];
          let matchScore = 0;

          if (userSkills.length > 0 && reqSkills.length > 0) {
            matchedSkills = reqSkills.filter((rs: string) => userSkills.includes(rs.toLowerCase()));
            matchScore = Math.round((matchedSkills.length / reqSkills.length) * 100);
          }

          return {
            id: p.id,
            title: p.title,
            type: p.type,
            description: p.description,
            commitment: p.commitment,
            teamSize: p.team_size,
            stage: p.stage,
            founder: p.users?.full_name || 'Anonymous',
            founderAvatar: p.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.users?.full_name || 'Anonymous')}&background=10182f&color=5b7cff`,
            skillsRequired: reqSkills,
            skillsNice: niceSkills,
            matchedSkills: matchedSkills,
            matchScore: matchScore,
            endorsementCount: p.endorsements ? p.endorsements.length : 0
          };
        });

        if (user && userSkills.length > 0) {
          formattedProjects.sort((a, b) => b.matchScore - a.matchScore);
        }

        setProjects(formattedProjects);
      }
      setLoading(false);
    }

    if (!authLoading) {
      fetchProjects();
    }
  }, [user, authLoading]);

  const filteredProjects = projects.filter(project => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.skillsRequired.some((skill: string) => skill.toLowerCase().includes(searchLower));
    const matchesFilter = activeFilter === 'All' || project.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <main className="main-content">
      {/* Hero — only shown to guests */}
      {!user && (
        <>
          <HeroSection
            onExplore={() => scrollToSection('ideaboard')}
            onHowItWorks={() => scrollToSection('how-it-works')}
          />
          <HowItWorksSection />
        </>
      )}

      {/* IdeaBoard */}
      <section id="ideaboard" style={{ scrollMarginTop: '100px' }}>
        {/* Section header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <span className="section-label">Projects</span>
            <h2 style={{
              fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc',
              letterSpacing: '-0.02em', margin: 0
            }}>
              The IdeaBoard
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
              {user ? 'Open projects matching your skills' : 'Browse open student projects'}
            </p>
          </div>

          {/* Search + filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', minWidth: '280px' }}>
            <div className="search-input-wrapper" style={{ minWidth: '220px', maxWidth: '300px' }}>
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search projects or skills..."
                className="search-input body-text"
                style={{ paddingLeft: '42px', height: '38px', paddingTop: 0, paddingBottom: 0, fontSize: '0.88rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-tags">
              {filters.map(filter => (
                <button
                  key={filter}
                  className={`filter-tag ${activeFilter === filter ? 'active' : ''}`}
                  style={{ padding: '5px 12px', height: '38px', display: 'flex', alignItems: 'center', fontSize: '0.82rem' }}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Showing count */}
        {!loading && filteredProjects.length > 0 && (
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
            Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* DB error */}
        {dbError && (
          <div style={{
            padding: '16px 20px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px',
            color: '#ef4444',
            marginBottom: '24px'
          }}>
            <strong>Database Error:</strong> {dbError}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="card p-4 text-center body-text" style={{ color: '#94a3b8' }}>
            Loading projects...
          </div>
        ) : (
          <div className="idea-board">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredProjects.length === 0 && (
          <div className="card p-4 flex-col flex-center text-center mt-4" style={{ gap: '16px', padding: '56px 32px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '14px',
              background: 'rgba(91,124,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#5b7cff'
            }}>
              <Code size={32} />
            </div>

            {projects.length === 0 ? (
              <>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>No projects yet</h3>
                <p style={{ color: '#94a3b8', maxWidth: '380px', fontSize: '0.95rem' }}>
                  {userRole === 'admin' || userRole === 'faculty'
                    ? 'The IdeaBoard is empty. Students have not posted any projects yet.'
                    : 'The IdeaBoard is empty. Be the first to post a project.'}
                </p>
                {user
                  ? userRole !== 'admin' && userRole !== 'faculty' && (
                    <button className="btn-primary" onClick={() => router.push('/post')}>
                      Post a project
                    </button>
                  )
                  : (
                    <button className="btn-primary" onClick={handleLogin}>
                      Log in to post a project
                    </button>
                  )
                }
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>No matches found</h3>
                <p style={{ color: '#94a3b8', maxWidth: '380px' }}>
                  No projects match the current filters or search.
                </p>
                <button className="btn-ghost" onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}>
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
