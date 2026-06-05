"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import BackButton from '../../../components/BackButton';
import { Award, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const truncateText = (text: string, limit: number) => {
  if (!text) return 'No description provided.';
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}...` : text;
};

export default function PublicProfile({ params }: { params: { id: string } }) {
  const { id } = params;
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (user) {
        setProfile(user);

        const { data: sData } = await supabase
          .from('user_skills')
          .select('skill_name')
          .eq('user_id', id);
        if (sData) setSkills(sData.map((s: any) => s.skill_name));

        const { data: pData } = await supabase
          .from('applications')
          .select(`
            status,
            projects ( id, title, type, description, status )
          `)
          .eq('applicant_id', id)
          .eq('status', 'Accepted');

        const { data: foundedProjects } = await supabase
          .from('projects')
          .select('id, title, type, description, status')
          .eq('founder_id', id);

        const allProjects = [];
        if (pData) allProjects.push(...pData.map((p: any) => p.projects));
        if (foundedProjects) allProjects.push(...foundedProjects);

        // Deduplicate in case somehow they are both founder and applicant (shouldn't happen, but safe)
        const uniqueProjects = Array.from(new Map(allProjects.filter(p => p).map(p => [p.id, p])).values());

        setProjects(uniqueProjects);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="body-text" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading profile...</div>;
  }

  if (!profile) {
    return <div className="body-text" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Profile not found.</div>;
  }

  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const completedProjects = projects.filter(p => p.status === 'Completed');

  return (
    <main className="main-content" style={{ maxWidth: '1100px', paddingTop: '96px' }}>
      <BackButton href="back" text="Go Back" />

      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 16px;
        }
        .bento-item {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: none;
          position: relative;
          overflow: hidden;
        }
        .bento-header { grid-column: span 12; }
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
        .project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .project-card {
          padding: 16px;
          cursor: pointer;
          border-left-width: 3px;
          border-left-style: solid;
          height: 100%;
        }
        @media (max-width: 900px) {
          .bento-main, .bento-sidebar { grid-column: span 12; position: static; top: auto; }
        }
        @media (max-width: 600px) {
          .bento-item { padding: 20px; }
        }
      `}</style>

      <div className="bento-grid">
        <div className="bento-item bento-header" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, height: '100px', background: 'var(--bg-card-hover)' }}></div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', zIndex: 1, marginTop: '24px' }}>
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=d0d7de&color=24292f`}
              alt={profile.full_name}
              style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--bg-card)' }}
            />
            <div style={{ flex: 1, minWidth: 'min(100%, 360px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 className="h1-page" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{profile.full_name}</h1>
                <span className="label-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: profile.open_to_collaborate ? 'var(--semantic-success-bg)' : 'var(--bg-interactive-neutral)', color: profile.open_to_collaborate ? 'var(--semantic-success)' : 'var(--text-secondary)', border: '1px solid var(--border-subtle)', textTransform: 'none', fontSize: '0.72rem', fontWeight: 500 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: profile.open_to_collaborate ? 'var(--semantic-success)' : 'var(--text-secondary)' }}></span>
                  {profile.open_to_collaborate ? 'Open to collaborate' : 'Not open to collaborate'}
                </span>
              </div>
              <div className="meta-text" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GraduationCap size={14} /> {profile.university || 'University not specified'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={14} /> {profile.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bento-item bento-main">
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '0px' }}>
            <h2 className="h2-section" style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: 600 }}>
              About
            </h2>
            <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
              {!profile.bio || profile.bio.trim() === "" || profile.bio.trim() === "/" ? (
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
            <h2 className="h2-section" style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 600 }}>
              Active Projects
            </h2>
            {activeProjects.length === 0 ? (
              <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>No active projects.</p>
            ) : (
              <div className="project-grid">
                {activeProjects.map((proj, idx) => (
                  <Link href={`/projects/${proj.id}`} key={idx}>
                    <div className="card project-card" style={{ borderLeftColor: 'var(--semantic-success)' }}>
                      <div className="label-text" style={{ color: 'var(--semantic-primary)', marginBottom: '4px', fontSize: '0.68rem', textTransform: 'none' }}>{proj.type}</div>
                      <h3 className="h3-card" style={{ marginBottom: '6px', fontSize: '0.98rem', fontWeight: 600 }}>{proj.title}</h3>
                      <p className="body-text" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.4 }}>{truncateText(proj.description, 120)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {completedProjects.length > 0 && (
            <div>
              <h2 className="h2-section" style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 600 }}>
                Completed Projects
              </h2>
              <div className="project-grid">
                {completedProjects.map((proj, idx) => (
                  <Link href={`/projects/${proj.id}`} key={idx}>
                    <div className="card project-card" style={{ borderLeftColor: 'var(--semantic-primary)' }}>
                      <div className="label-text" style={{ color: 'var(--semantic-primary)', marginBottom: '4px', fontSize: '0.68rem', textTransform: 'none' }}>{proj.type}</div>
                      <h3 className="h3-card" style={{ marginBottom: '6px', fontSize: '0.98rem', fontWeight: 600 }}>{proj.title}</h3>
                      <p className="body-text" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.4 }}>{truncateText(proj.description, 120)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bento-item bento-sidebar">
          <div className="sidebar-section">
            <h2 className="h2-section" style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: 600 }}>
              Skills
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map((skill, index) => (
                <span key={index} className="skill-badge label-text" style={{ padding: '4px 8px', fontSize: '0.72rem', textTransform: 'none' }}>{skill}</span>
              ))}
              {skills.length === 0 && <span className="body-text" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No skills listed.</span>}
            </div>
          </div>

          <div className="sidebar-section">
            <h2 className="h2-section" style={{ marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
              Stats
            </h2>
            <div style={{ display: 'grid', gap: '6px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span className="body-text" style={{ color: 'var(--text-secondary)' }}>Active</span>
                <span className="body-text text-bold" style={{ color: 'var(--text-primary)' }}>{activeProjects.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span className="body-text" style={{ color: 'var(--text-secondary)' }}>Completed</span>
                <span className="body-text text-bold" style={{ color: 'var(--text-primary)' }}>{completedProjects.length}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="h2-section" style={{ marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
              Open to Collaborate
            </h2>
            <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              {profile.open_to_collaborate ? 'Yes, this creator is open to collaboration.' : 'This creator is not open to collaboration right now.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
