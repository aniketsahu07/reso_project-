"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle, ExternalLink, Award, Code, Crown, Briefcase, Calendar, MapPin, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        if (!authLoading) router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('*, user_skills(skill_name)')
        .eq('id', user.id)
        .single();
        
      if (data) setProfile(data);
      
      const { data: myProjects } = await supabase
        .from('projects')
        .select('id, title, type, status')
        .eq('founder_id', user.id);

      const { data: appsData } = await supabase
        .from('applications')
        .select('projects(id, title, type, status)')
        .eq('applicant_id', user.id)
        .eq('status', 'Accepted');

      let projectsMap = new Map();
      if (myProjects) {
        myProjects.forEach(p => projectsMap.set(p.id, { ...p, role: 'Founder' }));
      }
      if (appsData) {
        appsData.forEach((a: any) => {
          if (a.projects && !projectsMap.has(a.projects.id)) {
            projectsMap.set(a.projects.id, { ...a.projects, role: 'Core Team' });
          }
        });
      }

      const allProjects = Array.from(projectsMap.values());
      
      if (allProjects.length > 0) {
        const projectIds = allProjects.map(p => p.id);
        const { data: milestones } = await supabase
          .from('milestones')
          .select('project_id, title')
          .in('project_id', projectIds)
          .eq('status', 'Completed');
          
        if (milestones) {
          allProjects.forEach(p => {
            p.completed_milestones = milestones.filter(m => m.project_id === p.id);
          });
        }
      }
      
      setPortfolio(allProjects);
      setLoading(false);
    }
    
    if (!authLoading) {
      loadProfile();
    }
  }, [router, user, authLoading]);

  const toggleCollaboration = async () => {
    const newState = !profile.open_to_collaborate;
    setProfile({ ...profile, open_to_collaborate: newState });
    await supabase.from('users').update({ open_to_collaborate: newState }).eq('id', profile.id);
  };

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-indigo)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
          Loading profile...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const isVerified = profile?.email?.endsWith('@mmmut.ac.in');
  const activeProjects = portfolio.filter(p => p.status !== 'Completed');
  const completedProjects = portfolio.filter(p => p.status === 'Completed');

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 16px 40px' }}>
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }
        .bento-item {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .bento-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
          border-color: rgba(99,102,241,0.3);
        }
        .bento-header { grid-column: span 12; }
        .bento-about { grid-column: span 8; }
        .bento-stats { grid-column: span 4; }
        .bento-portfolio { grid-column: span 12; }
        
        .pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0%, var(--accent-emerald) 50%, transparent 100%);
          animation: rotate-pulse 3s linear infinite;
          opacity: 0.8;
          z-index: -1;
        }
        @keyframes rotate-pulse {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 900px) {
          .bento-about, .bento-stats { grid-column: span 12; }
        }
        @media (max-width: 600px) {
          .profile-title-area { flex-direction: column; text-align: center; align-items: center !important; }
          .social-buttons { justify-content: center; }
          .bento-item { padding: 24px; }
        }
      `}</style>

      <div className="bento-grid">
        
        {/* Profile Header Block */}
        <div className="bento-item bento-header" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.05) 100%)', zIndex: 0 }}></div>
          
          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
            <Link href="/onboarding">
              <button className="btn-ghost" style={{ padding: '10px 20px', borderRadius: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={16} /> Edit Profile
              </button>
            </Link>
          </div>

          <div className="profile-title-area" style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', position: 'relative', zIndex: 1, marginTop: '40px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {profile?.avatar_url && !avatarError ? (
                <img
                  src={profile.avatar_url}
                  alt={profile?.full_name}
                  onError={() => setAvatarError(true)}
                  style={{ width: '130px', height: '130px', borderRadius: '32px', border: '4px solid var(--bg-card)', objectFit: 'cover', background: 'var(--bg-card)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                />
              ) : (
                <div
                  aria-label={profile?.full_name}
                  style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '32px',
                    border: '4px solid var(--bg-card)',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(168,85,247,0.9) 100%)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '3.2rem',
                    fontWeight: 800,
                    letterSpacing: '-0.06em',
                    textTransform: 'uppercase'
                  }}
                >
                  {(profile?.full_name || 'A').trim().charAt(0) || 'A'}
                </div>
              )}
              {profile?.open_to_collaborate && (
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '28px', height: '28px', background: 'var(--accent-emerald)', border: '4px solid var(--bg-card)', borderRadius: '50%', boxShadow: '0 0 16px rgba(16,185,129,0.6)' }}></div>
              )}
            </div>

            <div style={{ paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', margin: 0, lineHeight: 1.1, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                  {profile?.full_name}
                </h1>
                {isVerified && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', color: '#fff', padding: '6px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)', whiteSpace: 'nowrap' }}>
                    <CheckCircle size={14} /> Verified Student
                  </span>
                )}
              </div>
              <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16} color="var(--accent-indigo)" /> {profile?.degree || 'Student'}</span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} color="var(--accent-indigo)" /> {profile?.university}</span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} color="var(--accent-indigo)" /> Class of {profile?.graduation_year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* About & Skills Block */}
        <div className="bento-item bento-about" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '24px', borderRadius: '4px', background: 'var(--accent-indigo)' }}></div>
              About Me
            </h3>
            <p style={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0 }}>
              {profile?.bio || "This user hasn't written a bio yet."}
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '24px', borderRadius: '4px', background: 'var(--accent-violet)' }}></div>
              Technical Arsenal
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {profile?.user_skills?.length > 0 ? profile.user_skills.map((s: any, i: number) => (
                <span key={s.skill_name} className="badge badge-indigo" style={{ 
                  fontSize: '0.9rem', padding: '8px 16px', 
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  animation: `fade-in 0.5s ease forwards ${i * 0.05}s`, opacity: 0
                }}>
                  {s.skill_name}
                </span>
              )) : (
                <span style={{ color: 'var(--text-secondary)' }}>No skills listed yet.</span>
              )}
            </div>
          </div>

          <div className="social-buttons" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '16px' }}>
            {profile?.github_link && (
              <a href={profile.github_link} target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.9 5.07 5.07 0 0 0 19 2c0 0-1.5-.4-4.5 1.5a15.7 15.7 0 0 0-5 0C6.5 1.6 5 2 5 2a5.07 5.07 0 0 0 0 2.9A5.44 5.44 0 0 0 3 9.88c0 5.45 3.3 6.64 6.44 6.99A4.8 4.8 0 0 0 8 19v3"/><path d="M8 20c-3 1-4-1-5-2"/></svg>
                GitHub <ExternalLink size={14} style={{ opacity: 0.5 }} />
              </a>
            )}
            {profile?.linkedin_link && (
              <a href={profile.linkedin_link} target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', borderColor: 'rgba(59,130,246,0.3)', padding: '12px 24px', borderRadius: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                LinkedIn <ExternalLink size={14} style={{ opacity: 0.5 }} />
              </a>
            )}
          </div>
        </div>

        {/* Collab Block */}
        <div className="bento-item bento-stats" style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-elevated)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Collaboration Status</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Signal to founders whether you have the bandwidth to join a new project team right now.
            </p>
          </div>

          <button
            onClick={toggleCollaboration}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px',
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              border: profile?.open_to_collaborate ? 'none' : '1px solid var(--border-subtle)',
              background: profile?.open_to_collaborate ? 'linear-gradient(135deg, var(--accent-emerald), #059669)' : 'var(--bg-card)',
              color: profile?.open_to_collaborate ? '#fff' : 'var(--text-secondary)',
              boxShadow: profile?.open_to_collaborate ? '0 8px 24px rgba(16, 185, 129, 0.3)' : 'none',
              marginTop: 'auto'
            }}
          >
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: profile?.open_to_collaborate ? '#fff' : 'var(--text-secondary)',
              boxShadow: profile?.open_to_collaborate ? '0 0 12px rgba(255,255,255,0.8)' : 'none',
              transition: 'all 0.4s ease',
            }}></div>
            {profile?.open_to_collaborate ? 'Actively Looking' : 'Not Looking'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Projects Managed</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{portfolio.filter(p => p.role === 'Founder').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Teams Joined</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{portfolio.filter(p => p.role !== 'Founder').length}</span>
            </div>
          </div>
        </div>

        {/* Portfolio Block */}
        {(activeProjects.length > 0 || completedProjects.length > 0) && (
          <div className="bento-item bento-portfolio">
            
            {activeProjects.length > 0 && (
              <div style={{ marginBottom: completedProjects.length > 0 ? '40px' : '0' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={20} color="var(--accent-emerald)" />
                  </div>
                  Active Projects
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {activeProjects.map(proj => (
                    <Link key={proj.id} href={`/projects/${proj.id}`} style={{ textDecoration: 'none' }}>
                      <div className="glass-card glow-border" style={{ padding: '24px', cursor: 'pointer', height: '100%', borderLeft: '4px solid', borderImage: 'linear-gradient(to bottom, var(--accent-emerald), var(--accent-blue)) 1', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                            {proj.title}
                          </h4>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '20px',
                            background: proj.role === 'Founder' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: proj.role === 'Founder' ? 'var(--accent-violet)' : 'var(--accent-blue)', fontWeight: 600, whiteSpace: 'nowrap'
                          }}>
                            {proj.role === 'Founder' ? <Crown size={12} /> : <Code size={12} />} {proj.role}
                          </span>
                        </div>

                        {proj.completed_milestones && proj.completed_milestones.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                            {proj.completed_milestones.slice(0, 3).map((m: any, idx: number) => (
                              <div key={idx} style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }}></span>
                                {m.title}
                              </div>
                            ))}
                            {proj.completed_milestones.length > 3 && (
                              <div style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '20px', background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}>
                                +{proj.completed_milestones.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {completedProjects.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={20} color="var(--accent-indigo)" />
                  </div>
                  Completed Projects
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {completedProjects.map(proj => (
                    <Link key={proj.id} href={`/projects/${proj.id}`} style={{ textDecoration: 'none' }}>
                      <div className="glass-card glow-border" style={{ padding: '24px', cursor: 'pointer', height: '100%', borderLeft: '4px solid', borderImage: 'linear-gradient(to bottom, var(--accent-indigo), var(--accent-violet)) 1', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s ease', background: 'linear-gradient(135deg, rgba(99,102,241,0.03) 0%, transparent 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                            {proj.title}
                          </h4>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '20px',
                            background: proj.role === 'Founder' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: proj.role === 'Founder' ? 'var(--accent-violet)' : 'var(--accent-blue)', fontWeight: 600, whiteSpace: 'nowrap'
                          }}>
                            {proj.role === 'Founder' ? <Crown size={12} /> : <Code size={12} />} {proj.role}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
