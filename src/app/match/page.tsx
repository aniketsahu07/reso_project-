"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cpu, Award, Users, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

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
  const [showAllSkills, setShowAllSkills] = useState(false);

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
            founderAvatar: project.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.users?.full_name || 'Anonymous')}&background=d0d7de&color=24292f`,
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

  const getMatchColor = (score: number) => {
    if (score >= 80) return { bg: 'var(--semantic-success-bg)', text: 'var(--semantic-success)', border: 'var(--semantic-success-border)', fg: 'var(--semantic-success-fg)', solid: 'var(--semantic-success-solid)' };
    if (score >= 60) return { bg: 'var(--semantic-primary-bg)', text: 'var(--semantic-primary)', border: 'var(--semantic-primary-border)', fg: 'var(--semantic-primary-fg)', solid: 'var(--semantic-primary-solid)' };
    return { bg: 'var(--semantic-warning-bg)', text: 'var(--semantic-warning)', border: 'var(--semantic-warning-border)', fg: 'var(--semantic-warning-fg)', solid: 'var(--semantic-warning-solid)' };
  };

  return (
    <main className="main-content" style={{ maxWidth: '1150px', paddingTop: '88px' }}>

      {/* Title & Introduction Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)', margin: 0 }}>
          Project Match
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '650px', lineHeight: 1.4 }}>
          View project recommendations based on your profile, skills, and the project details already in the workspace.
        </p>
      </div>

      {/* User profile summary */}
      {userProfile && (
        <div className="panel" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--semantic-primary)', marginBottom: '0px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: '280px' }}>
            <div style={{ background: 'var(--bg-surface-hover)', width: '56px', height: '56px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--semantic-primary)', border: '1px solid var(--border-subtle)' }}>
              <Cpu size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>{userProfile.full_name || 'Collaborator'}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--semantic-success)', background: 'var(--semantic-success-bg)', padding: '2px 8px', borderRadius: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--semantic-success)', display: 'inline-block' }}></span> Active
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                {userProfile.degree ? `${userProfile.degree} student` : 'Collaborator'} {userProfile.university ? `at ${userProfile.university}` : ''}
              </p>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
              Skills ({userSkills.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(showAllSkills ? userSkills : userSkills.slice(0, 8)).map(skill => (
                <span key={skill} style={{ fontSize: '0.75rem', background: 'var(--bg-interactive-neutral)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: '8px', fontWeight: 500 }}>
                  {skill}
                </span>
              ))}
              {userSkills.length > 8 && (
                <button
                  onClick={() => setShowAllSkills(!showAllSkills)}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--semantic-primary)',
                    background: 'var(--semantic-primary-bg)',
                    border: '1px solid var(--semantic-primary-border)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--semantic-primary-border)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--semantic-primary-bg)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {showAllSkills ? 'Show Less' : `+${userSkills.length - 8} More`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Results Listing */}
      {aiLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px', marginTop: '0px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="panel" style={{ height: '340px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '3px', width: '100%', position: 'absolute', top: 0, left: 0, background: 'var(--border-subtle)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ background: 'var(--bg-interactive-neutral)', height: '18px', width: '80px', borderRadius: '4px' }}></div>
                <div style={{ background: 'var(--bg-interactive-neutral)', height: '24px', width: '60px', borderRadius: '8px' }}></div>
              </div>
              <div style={{ background: 'var(--bg-interactive-neutral)', height: '32px', width: '70%', borderRadius: '6px' }}></div>
              <div style={{ background: 'var(--bg-interactive-neutral)', height: '60px', width: '100%', borderRadius: '8px' }}></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{ background: 'var(--bg-interactive-neutral)', height: '24px', width: '60px', borderRadius: 'var(--radius-md)' }}></div>
                <div style={{ background: 'var(--bg-interactive-neutral)', height: '24px', width: '70px', borderRadius: 'var(--radius-md)' }}></div>
                <div style={{ background: 'var(--bg-interactive-neutral)', height: '24px', width: '65px', borderRadius: 'var(--radius-md)' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : aiError ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--semantic-error)', border: '1px solid var(--semantic-error-border)', background: 'var(--semantic-error-bg)' }}>
          <p style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: '8px' }}>Execution Failed</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{aiError}</p>
        </div>
      ) : aiProjects.length === 0 ? (
        <div className="panel" style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--bg-interactive-neutral)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <Award size={36} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 500 }}>No Matching Recommendations</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            The AI engine couldn't match any projects. Try adding more skills to your profile to expand your search spectrum!
          </p>
          <Link href="/profile">
            <button className="btn-primary" style={{ padding: '10px 24px' }}>Edit your skills</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '0px' }}>
          {/* Header count indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginTop: '0px' }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{aiProjects.length} matches</span> based on your profile
            </span>
          </div>

          {/* Match cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '28px' }}>
            {aiProjects.map((project) => {
              const styles = getMatchColor(project.matchScore);
              return (
                <div
                  key={project.id}
                  className="panel"
                  style={{
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0px',
                    transition: 'border-color 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = styles.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ height: '3px', width: '100%', position: 'absolute', top: 0, left: 0, background: styles.text }}></div>

                  {/* Header & Title Wrapper */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: styles.text, background: styles.bg, border: `1px solid ${styles.border}`, padding: '2px 8px', borderRadius: '4px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          {project.type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 }}>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: styles.text }}>
                          {project.matchScore}%
                        </span>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 500, marginTop: '2px' }}>
                          match
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.3px', margin: 0 }}>
                      {project.title}
                    </h3>
                  </div>

                  {/* Project Description */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 16px 0', minHeight: '68px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description}
                  </p>

                  {/* Detailed Skill Synergy Analysis */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', fontSize: '0.8rem', marginTop: '12px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} color="var(--semantic-success)" />
                      Skill Synergy
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                      {project.matchedSkills.slice(0, 4).map((skill: string) => (
                        <span key={skill} style={{
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--semantic-success-bg)',
                          border: '1px solid var(--semantic-success-border)',
                          color: 'var(--semantic-success)',
                          fontSize: '0.71rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }}>
                          {skill}
                        </span>
                      ))}
                      {project.matchedSkills.length > 4 && (
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-surface-hover)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-dim)',
                          fontSize: '0.71rem',
                          fontWeight: 500
                        }}>
                          +{project.matchedSkills.length - 4} more
                        </span>
                      )}

                      {project.missingSkills.slice(0, 4).map((skill: string) => (
                        <span key={skill} style={{
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-surface-hover)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-dim)',
                          fontSize: '0.71rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }}>
                          {skill}
                        </span>
                      ))}
                      {project.missingSkills.length > 4 && (
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-surface-hover)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-dim)',
                          fontSize: '0.71rem',
                          fontWeight: 500
                        }}>
                          +{project.missingSkills.length - 4} more
                        </span>
                      )}
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
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
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
                            e.currentTarget.style.background = styles.solid;
                            e.currentTarget.style.color = styles.fg;
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
