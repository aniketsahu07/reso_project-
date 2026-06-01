"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Cpu, Award, Users, Clock, ArrowRight, ShieldCheck, CheckCircle2, User } from 'lucide-react';

import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';

export default function SkillMatchPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [aiProjects, setAiProjects] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // User Profile States to display context radar
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);

  useEffect(() => {
    async function loadAiMatches() {
      if (!user) return;

      setAiLoading(true);
      setAiError(null);

      try {
        // Fetch user profile info
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, university, bio, degree')
          .eq('id', user.id)
          .single();
        if (profile) setUserProfile(profile);

        // Fetch user skills
        const { data: skillsData } = await supabase
          .from('user_skills')
          .select('skill_name')
          .eq('user_id', user.id);
        const skillsList = (skillsData || []).map((s: any) => s.skill_name);
        setUserSkills(skillsList);

        const response = await fetch('/api/ai/match-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, limit: 9 })
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to load AI matches');
        }

        const formattedProjects = (payload?.projects || []).map((project: any) => {
          const reqSkills = project.project_skills ? project.project_skills.map((s: any) => s.skill_name) : [];
          const rawScore = typeof project.score === 'number' ? project.score : 0;
          const matchScore = Math.round(Math.max(0, Math.min(1, rawScore)) * 100);

          // Find intersection
          const userSkillSet = new Set(skillsList.map(s => s.toLowerCase()));
          const matchedSkills = reqSkills.filter(s => userSkillSet.has(s.toLowerCase()));
          const missingSkills = reqSkills.filter(s => !userSkillSet.has(s.toLowerCase()));

          return {
            id: project.id,
            title: project.title,
            type: project.type,
            description: project.description,
            commitment: project.commitment,
            teamSize: project.team_size,
            stage: project.stage,
            founder: project.users?.full_name || 'Anonymous',
            founderAvatar: project.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.users?.full_name || 'Anonymous')}&background=6366f1&color=fff`,
            skillsRequired: reqSkills,
            matchedSkills,
            missingSkills,
            matchScore
          };
        });

        setAiProjects(formattedProjects);
      } catch (error: any) {
        setAiError(error?.message || 'Unable to load AI matches.');
      } finally {
        setAiLoading(false);
      }
    }

    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user) {
      loadAiMatches();
    }
  }, [user, authLoading, router]);

  // Color picker helper for match score indicators
  const getMatchColor = (score: number) => {
    if (score >= 80) return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)', glow: 'rgba(16, 185, 129, 0.4)' };
    if (score >= 60) return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8', border: 'rgba(99, 102, 241, 0.3)', glow: 'rgba(99, 102, 241, 0.3)' };
    return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)', glow: 'rgba(245, 158, 11, 0.2)' };
  };

  return (
    <main className="main-content" style={{ maxWidth: '1150px', paddingTop: '110px' }}>
      
      {/* Title & Introduction Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.1)', color: '#C084FC', padding: '6px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600, width: 'fit-content', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
          <Sparkles size={14} className="animate-pulse" />
          AI-Powered Smart Recommendations
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-1px', background: 'linear-gradient(to right, #ffffff, #d4d4d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI SkillMatch Radar
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '650px', lineHeight: 1.6 }}>
          Our neural engine analyzes your engineering background, project descriptions, and technical competencies using semantic search to discover your ultimate hackathon or project matches.
        </p>
      </div>

      {/* Glassmorphic User Profile Summary Context Card */}
      {userProfile && (
        <div className="glass-panel animate-fade-in delay-1" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #a855f7', background: 'rgba(255, 255, 255, 0.01)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: '280px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <Cpu size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{userProfile.full_name || 'Collaborator'}</h3>
                <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span> Radar Active
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                {userProfile.degree ? `${userProfile.degree} student` : 'Collaborator'} {userProfile.university ? `at ${userProfile.university}` : ''}
              </p>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              AI Analyzed Competencies ({userSkills.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {userSkills.slice(0, 8).map(skill => (
                <span key={skill} style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', color: '#E4E4E7', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>
                  {skill}
                </span>
              ))}
              {userSkills.length > 8 && (
                <span style={{ fontSize: '0.75rem', color: '#A855F7', background: 'rgba(168, 85, 247, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                  +{userSkills.length - 8} More
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Results Listing */}
      {aiLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px', marginTop: '10px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel" style={{ height: '340px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '3px', width: '100%', position: 'absolute', top: 0, left: 0, background: 'rgba(255,255,255,0.05)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', height: '18px', width: '80px', borderRadius: '4px', className: 'animate-pulse' }}></div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', height: '24px', width: '60px', borderRadius: '8px', className: 'animate-pulse' }}></div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', height: '32px', width: '70%', borderRadius: '6px', className: 'animate-pulse' }}></div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', height: '60px', width: '100%', borderRadius: '8px', className: 'animate-pulse' }}></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', height: '24px', width: '60px', borderRadius: '20px' }}></div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', height: '24px', width: '70px', borderRadius: '20px' }}></div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', height: '24px', width: '65px', borderRadius: '20px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : aiError ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#F87171', border: '1px solid rgba(248, 113, 113, 0.2)', background: 'rgba(248, 113, 113, 0.02)' }}>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>Execution Failed</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{aiError}</p>
        </div>
      ) : aiProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <Award size={36} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>No Matching Recommendations</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            The AI engine couldn't match any projects. Try adding more skills to your profile to expand your search spectrum!
          </p>
          <Link href="/profile">
            <button className="btn-primary" style={{ padding: '10px 24px' }}>Edit Your Skills</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header count indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginTop: '16px' }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{aiProjects.length} AI Matches</span> based on semantic analysis
            </span>
          </div>

          {/* Glowing AI Synergy Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '28px' }}>
            {aiProjects.map((project, idx) => {
              const styles = getMatchColor(project.matchScore);
              return (
                <div 
                  key={project.id} 
                  className="glass-panel animate-fade-in"
                  style={{ 
                    animationDelay: `${(idx * 0.1) + 0.2}s`, 
                    padding: '28px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.borderColor = styles.text;
                    e.currentTarget.style.boxShadow = `0 12px 30px -10px ${styles.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Neon Top Match Score Progress line */}
                  <div style={{ height: '3px', width: '100%', position: 'absolute', top: 0, left: 0, background: `linear-gradient(to right, ${styles.text}, var(--accent-secondary))` }}></div>

                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: styles.text, background: styles.bg, border: `1px solid ${styles.border}`, padding: '4px 10px', borderRadius: '30px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        {project.type}
                      </span>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '10px', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
                        {project.title}
                      </h3>
                    </div>

                    {/* Glowing circular Match Gauge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: '14px', width: '64px', height: '64px', minWidth: '64px', boxShadow: `0 0 15px -3px ${styles.glow}` }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: styles.text, lineHeight: 1 }}>
                        {project.matchScore}%
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>
                        Match
                      </div>
                    </div>
                  </div>

                  {/* Project Description */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, minHeight: '68px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description}
                  </p>

                  {/* Detailed Skill Synergy Analysis */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} color="#10B981" />
                      Skill Synergy Analyzer
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {/* Matched Skills with glow */}
                      {project.matchedSkills.map((skill: string) => (
                        <span key={skill} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.08)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          <CheckCircle2 size={10} /> {skill}
                        </span>
                      ))}

                      {/* Missing skills */}
                      {project.missingSkills.map((skill: string) => (
                        <span key={skill} style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                    {/* Founder Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={project.founderAvatar} 
                        alt={project.founder} 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border-color)' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {project.founder}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                          Founder
                        </div>
                      </div>
                    </div>

                    {/* Stats & Link button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Users size={11} /> {project.teamSize}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}><Clock size={11} /> {project.commitment}</span>
                      </div>

                      <Link href={`/projects/${project.id}`}>
                        <button 
                          className="btn-primary" 
                          style={{ 
                            padding: '8px 14px', 
                            fontSize: '0.8rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            background: styles.bg,
                            border: `1px solid ${styles.border}`,
                            color: styles.text,
                            boxShadow: 'none',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = styles.text;
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = styles.bg;
                            e.currentTarget.style.color = styles.text;
                          }}
                        >
                          Details <ArrowRight size={13} />
                        </button>
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
