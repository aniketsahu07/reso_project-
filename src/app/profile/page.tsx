"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle, ExternalLink, Code, Crown, Briefcase, Calendar, Edit3 } from 'lucide-react';
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
          border: '3px solid var(--border-subtle)', borderTopColor: 'var(--semantic-primary)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span className="body-text">
          Loading profile...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const isVerified = profile?.email?.endsWith('@mmmut.ac.in');
  const activeProjects = portfolio.filter(p => p.status !== 'Completed');
  const completedProjects = portfolio.filter(p => p.status === 'Completed');
  const skills = profile?.user_skills || [];

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 16px 40px' }}>
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
        }
        .bento-item {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-bento);
          position: relative;
          overflow: visible;
        }
        .bento-header {
          grid-column: span 12;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px 32px !important;
        }
        .bento-main { grid-column: span 8; display: flex; flex-direction: column; gap: 12px; }
        .bento-sidebar { grid-column: span 4; display: flex; flex-direction: column; gap: 16px; align-self: start; position: sticky; top: 96px; }
        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .sidebar-section:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }
        .profile-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
          overflow: hidden;
        }
        
        @media (max-width: 900px) {
          .bento-main, .bento-sidebar { grid-column: span 12; position: static; top: auto; }
        }
        @media (max-width: 700px) {
          .bento-header { flex-wrap: wrap; padding: 20px !important; }
          .profile-meta-row { flex-wrap: wrap; }
          .profile-edit-btn { margin-left: 0 !important; }
          .social-buttons { justify-content: center; }
          .bento-item { padding: 20px; }
        }
      `}</style>

      <div className="bento-grid">

        {/* Profile Header Block */}
        <div className="bento-item bento-header">

          {/* LEFT — Avatar */}
          <div style={{ position: 'relative', flexShrink: 0, width: '84px', height: '84px' }}>
            {profile?.avatar_url && !avatarError ? (
              <img
                src={profile.avatar_url}
                alt={profile?.full_name}
                onError={() => setAvatarError(true)}
                style={{
                  width: '84px', height: '84px', borderRadius: '50%',
                  border: '2px solid var(--border-subtle)',
                  objectFit: 'cover', background: 'var(--bg-card)', display: 'block'
                }}
              />
            ) : (
              <div
                aria-label={profile?.full_name}
                style={{
                  width: '84px', height: '84px', borderRadius: '50%',
                  border: '2px solid var(--border-subtle)',
                  background: 'var(--semantic-primary-solid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--semantic-primary-fg)',
                  letterSpacing: '-0.04em', textTransform: 'uppercase', fontSize: '1.75rem',
                  fontWeight: 700
                }}
              >
                {(profile?.full_name || 'A').trim().charAt(0) || 'A'}
              </div>
            )}
            {/* Online status dot — anchored to bottom-right corner of avatar */}
            {profile?.open_to_collaborate && (
              <div style={{
                position: 'absolute', bottom: '4px', right: '4px',
                width: '12px', height: '12px',
                background: 'var(--semantic-success)',
                border: '2px solid var(--bg-card)',
                borderRadius: '50%',
                zIndex: 1
              }} />
            )}
          </div>

          {/* CENTER — Name, badge, metadata */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Name + Verified badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="h1-page" style={{ margin: 0, fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                {profile?.full_name}
              </h1>
              {isVerified && (
                <span
                  className="label-text"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'var(--semantic-primary-bg)', color: 'var(--semantic-primary)',
                    padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.68rem', fontWeight: 600, textTransform: 'none',
                    border: '1px solid var(--semantic-primary-border)', whiteSpace: 'nowrap',
                    lineHeight: 1.4
                  }}
                >
                  <CheckCircle size={11} /> Verified Student
                </span>
              )}
            </div>

            {/* Metadata row — single line with bullet separators */}
            <div
              className="profile-meta-row"
              style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', overflow: 'hidden' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <Briefcase size={13} strokeWidth={1.8} color="var(--text-dim)" />
                {profile?.degree || 'Student'}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', lineHeight: 1 }}>•</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.university}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', lineHeight: 1 }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <Calendar size={13} strokeWidth={1.8} color="var(--text-dim)" />
                Class of {profile?.graduation_year}
              </span>
            </div>
          </div>

          {/* RIGHT — Edit Profile button */}
          <div className="profile-edit-btn" style={{ flexShrink: 0, marginLeft: 'auto' }}>
            <Link href="/onboarding">
              <button
                className="btn-ghost body-text"
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-md)',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.85rem', whiteSpace: 'nowrap'
                }}
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            </Link>
          </div>
        </div>

        {/* Profile Overview */}
        <div className="bento-item bento-main">
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '0px' }}>
            <span className="section-label">About</span>
            <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
              {!profile?.bio || profile.bio.trim() === "" || profile.bio.trim() === "/" ? (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No bio added yet.</span>
              ) : (
                profile.bio
              )}
            </p>
          </div>

          <div style={{
            borderBottom: completedProjects.length > 0 ? '1px solid var(--border-subtle)' : 'none',
            paddingBottom: completedProjects.length > 0 ? '12px' : '0px',
            marginBottom: '0px'
          }}>
            <span className="section-label">Projects</span>
            <h2 className="h2-section" style={{ marginBottom: '14px', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Active Projects
            </h2>

            {activeProjects.length === 0 ? (
              <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>No active projects yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {activeProjects.map(proj => (
                  <Link key={proj.id} href={`/projects/${proj.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px', cursor: 'pointer', height: '100%', borderLeft: '3px solid var(--semantic-success)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <h3 className="h3-card" style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>
                          {proj.title}
                        </h3>
                        <span className="label-text" style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                          background: proj.role === 'Founder' ? 'var(--semantic-primary-bg)' : 'var(--bg-interactive-neutral)',
                          color: proj.role === 'Founder' ? 'var(--semantic-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap',
                          fontSize: '0.68rem', textTransform: 'none', border: '1px solid var(--border-subtle)'
                        }}>
                          {proj.role === 'Founder' ? <Crown size={10} /> : <Code size={10} />} {proj.role}
                        </span>
                      </div>

                      {proj.completed_milestones && proj.completed_milestones.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
                          {proj.completed_milestones.slice(0, 2).map((m: any, idx: number) => (
                            <div key={idx} className="label-text" style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--semantic-success-bg)', border: '1px solid var(--semantic-success-border)', color: 'var(--semantic-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', textTransform: 'none' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--semantic-success)' }}></span>
                              {m.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {completedProjects.length > 0 && (
            <div>
              <span className="section-label">Completed</span>
              <h2 className="h2-section" style={{ marginBottom: '14px', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Completed Projects
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {completedProjects.map(proj => (
                  <Link key={proj.id} href={`/projects/${proj.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px', cursor: 'pointer', height: '100%', borderLeft: '3px solid var(--semantic-neutral)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <h3 className="h3-card" style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>
                          {proj.title}
                        </h3>
                        <span className="label-text" style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-interactive-neutral)', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
                          fontSize: '0.68rem', textTransform: 'none', border: '1px solid var(--border-subtle)'
                        }}>
                          {proj.role}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bento-item bento-sidebar">
          <div className="sidebar-section">
            <span className="section-label">Overview</span>
            <h3 className="h3-card" style={{ marginBottom: 0, fontSize: '0.9rem', fontWeight: 600 }}>Profile Summary</h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span className="body-text" style={{ color: 'var(--text-secondary)' }}>Degree</span>
                <span className="body-text text-bold" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{profile?.degree || 'Student'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span className="body-text" style={{ color: 'var(--text-secondary)' }}>Class Year</span>
                <span className="body-text text-bold" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{profile?.graduation_year || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span className="body-text" style={{ color: 'var(--text-secondary)' }}>University</span>
                <span className="body-text text-bold" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{profile?.university || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <span className="section-label">Skills</span>
            <h3 className="h3-card" style={{ marginBottom: 0, fontSize: '0.9rem', fontWeight: 600 }}>Technical Arsenal</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.length > 0 ? skills.map((s: any) => (
                <span key={s.skill_name || s} className="skill-badge" style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem', textTransform: 'none'
                }}>
                  {s.skill_name || s}
                </span>
              )) : (
                <span className="body-text" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No skills listed yet.</span>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <span className="section-label">Availability</span>
            <h3 className="h3-card" style={{ marginBottom: 0, fontSize: '0.9rem', fontWeight: 600 }}>Availability Status</h3>
            <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              Signal availability to founders searching for builders.
            </p>

            <button
              onClick={toggleCollaboration}
              className="body-text text-bold"
              style={{
                width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                border: '1px solid var(--border-subtle)',
                background: profile?.open_to_collaborate ? 'var(--semantic-success-solid)' : 'var(--bg-interactive-neutral)',
                color: profile?.open_to_collaborate ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: 'none',
                fontSize: '0.88rem'
              }}
            >
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: profile?.open_to_collaborate ? '#ffffff' : 'var(--text-dim)',
              }}></div>
              {profile?.open_to_collaborate ? 'Available for Teams' : 'Not Looking'}
            </button>
          </div>

          <div className="sidebar-section">
            <span className="section-label">Activity</span>
            <h3 className="h3-card" style={{ marginBottom: 0, fontSize: '0.9rem', fontWeight: 600 }}>Statistics</h3>
            <div style={{ display: 'grid', gap: '6px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span className="body-text" style={{ color: 'var(--text-secondary)' }}>Projects Managed</span>
                <span className="body-text text-bold" style={{ color: 'var(--text-primary)' }}>{portfolio.filter(p => p.role === 'Founder').length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span className="body-text" style={{ color: 'var(--text-secondary)' }}>Teams Joined</span>
                <span className="body-text text-bold" style={{ color: 'var(--text-primary)' }}>{portfolio.filter(p => p.role !== 'Founder').length}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="section-label">Connect</span>
            <h3 className="h3-card" style={{ marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600 }}>Social Links</h3>
            <div className="social-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profile?.github_link && (
                <a href={profile.github_link} target="_blank" rel="noreferrer" className="btn-ghost body-text" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.9 5.07 5.07 0 0 0 19 2c0 0-1.5-.4-4.5 1.5a15.7 15.7 0 0 0-5 0C6.5 1.6 5 2 5 2a5.07 5.07 0 0 0 0 2.9A5.44 5.44 0 0 0 3 9.88c0 5.45 3.3 6.64 6.44 6.99A4.8 4.8 0 0 0 8 19v3" /><path d="M8 20c-3 1-4-1-5-2" /></svg>
                  GitHub <ExternalLink size={12} style={{ opacity: 0.5 }} />
                </a>
              )}
              {profile?.linkedin_link && (
                <a href={profile.linkedin_link} target="_blank" rel="noreferrer" className="btn-ghost body-text" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                  LinkedIn <ExternalLink size={12} style={{ opacity: 0.5 }} />
                </a>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
