"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Clock, Users, GitCommit, Award, ChevronLeft, Calendar, Rocket, Send, ExternalLink, Crown } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pitch, setPitch] = useState("");
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationFeedback, setApplicationFeedback] = useState<string | null>(null);
  const [isAcceptedMember, setIsAcceptedMember] = useState(false);
  const [showPitchForm, setShowPitchForm] = useState(false);
  const [commits, setCommits] = useState<any[]>([]);
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("student");
  const [endorsementNote, setEndorsementNote] = useState("");
  const [endorsing, setEndorsing] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);

      const { data: projectData } = await supabase
        .from('projects')
        .select(`
          *,
          users!projects_founder_id_fkey ( full_name, avatar_url, university, bio ),
          project_skills!project_skills_project_id_fkey ( skill_name )
        `)
        .eq('id', id)
        .single();

      if (projectData) {
        setProject(projectData);

        if (session) {
          const { data: appData } = await supabase
            .from('applications')
            .select('id, status, feedback')
            .eq('project_id', id)
            .eq('applicant_id', session.user.id)
            .single();

          if (appData) {
            setHasApplied(true);
            setApplicationStatus(appData.status);
            if (appData.feedback) setApplicationFeedback(appData.feedback);
            if (appData.status === 'Accepted') setIsAcceptedMember(true);
          }

          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile) setUserRole(profile.role);
        }

        if (projectData.github_url) {
          try {
            const urlObj = new URL(projectData.github_url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 2) {
              const owner = pathParts[0];
              const repo = pathParts[1];
              const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=3`);
              if (res.ok) {
                const data = await res.json();
                setCommits(data);
              }
            }
          } catch (e) {
            console.error("Failed to fetch github commits");
          }
        }
      }

      const { data: membersData } = await supabase
        .from('applications')
        .select(`applicant_id, users!applications_applicant_id_fkey ( full_name, avatar_url, university )`)
        .eq('project_id', id)
        .eq('status', 'Accepted');

      if (membersData) {
        setTeamMembers(membersData);
      }

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (milestonesData) {
        setMilestones(milestonesData);
      }

      const { data: endorsementsData } = await supabase
        .from('endorsements')
        .select(`id, note, created_at, users!endorsements_faculty_id_fkey ( full_name, avatar_url, university )`)
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (endorsementsData) {
        setEndorsements(endorsementsData);
      }

      setLoading(false);
    }

    loadData();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }

    setApplying(true);

    const { error } = await supabase
      .from('applications')
      .insert({
        project_id: id,
        applicant_id: user.id,
        pitch: pitch,
        status: 'Pending'
      });

    if (error) {
      alert(error.message);
    } else {
      setHasApplied(true);
      setShowPitchForm(false);
    }

    setApplying(false);
  };

  const handleWithdraw = async () => {
    if (!user) return;
    setApplying(true);
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('project_id', id)
      .eq('applicant_id', user.id);

    if (!error) {
      setHasApplied(false);
      setApplicationStatus(null);
      setApplicationFeedback(null);
      setShowPitchForm(false);
      setPitch("");
    }
    setApplying(false);
  };

  const handleEndorse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userRole !== 'faculty') return;

    setEndorsing(true);
    const { data } = await supabase
      .from('endorsements')
      .insert({
        project_id: id,
        faculty_id: user.id,
        note: endorsementNote
      })
      .select(`id, note, created_at, users ( full_name, avatar_url, university )`)
      .single();

    if (data) {
      setEndorsements([data, ...endorsements]);
      setEndorsementNote("");
    }
    setEndorsing(false);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid var(--border-subtle)', borderTopColor: 'var(--semantic-primary)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span className="body-text">
            Loading project...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="flex-center body-text" style={{ minHeight: '60vh', color: 'var(--text-secondary)' }}>Project not found.</div>;
  }

  const isFounder = user?.id === project.founder_id;

  return (
    <main style={{ maxWidth: 'min(1400px, 90vw)', margin: '0 auto', padding: '96px 16px 40px' }}>
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: 65fr 35fr;
          gap: 16px;
        }
        .bento-item {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: none;
        }
        .bento-header { grid-column: span 2; position: relative; overflow: hidden; }
        .bento-main { display: flex; flex-direction: column; gap: 16px; }
        .bento-sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 96px; align-self: start; }
        
        @media (max-width: 900px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }
          .bento-header { grid-column: span 1; }
          .bento-sidebar { order: -1; }
        }
      `}</style>

      <div style={{ marginBottom: '16px' }}>
        <Link href="/" className="body-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ChevronLeft size={16} /> Back to IdeaBoard
        </Link>
      </div>

      <div className="bento-grid">

        {/* Header Block */}
        <div className="bento-item bento-header" style={{ padding: '24px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span className={`badge ${project.type === 'AI/ML' ? 'badge-success' : (project.type === 'Web App' || project.type === 'WEB APP' ? 'badge-warning' : 'badge-primary')} label-text`} style={{ padding: '4px 10px', fontSize: '0.72rem', textTransform: 'none' }}>{project.type} · {project.stage}</span>
            </div>

            <h1 className="h1-page" style={{ margin: '0 0 16px 0', fontSize: '1.8rem', fontWeight: 700 }}>
              {project.title}
            </h1>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.88rem' }}>
              <div className="body-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Users size={16} />
                Team of {project.team_size}
              </div>
              <div className="body-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Clock size={16} />
                {project.commitment}
              </div>
              <div className="body-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Calendar size={16} />
                Started {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Column */}
        <div className="bento-main">

          <div className="bento-item">
            <h2 className="h2-section" style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: 600 }}>
              Overview
            </h2>
            <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
              {project.description}
            </p>
          </div>

          {milestones.length > 0 && (
            <div className="bento-item">
              <h2 className="h2-section" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 600 }}>
                Timeline
              </h2>

              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                {/* Vertical Dashed Line */}
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border-subtle)' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {milestones.map((m) => {
                    let details: any = { desc: m.description, due: '', assigned: '', completed: false, completed_at: '' };
                    try {
                      const parsed = JSON.parse(m.description);
                      if (parsed.desc !== undefined) details = { ...details, ...parsed };
                    } catch (e) { }

                    const isOverdue = !details.completed && details.due && new Date(details.due) < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <div key={m.id} style={{ position: 'relative', background: details.completed ? 'var(--semantic-success-bg)' : isOverdue ? 'var(--semantic-error-bg)' : 'var(--bg-card)', border: '1px solid', borderColor: details.completed ? 'var(--semantic-success-border)' : isOverdue ? 'var(--semantic-error-border)' : 'var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'none' }}>

                        {/* Timeline Node */}
                        <div style={{ position: 'absolute', left: '-29px', top: '22px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: details.completed ? 'var(--semantic-success)' : isOverdue ? 'var(--semantic-error)' : 'var(--semantic-primary)', boxShadow: 'none' }}></div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span className="meta-text text-bold" style={{ fontSize: '0.78rem' }}>{new Date(m.created_at).toLocaleDateString()}</span>
                          {details.due && <span className="meta-text text-bold" style={{ color: isOverdue ? 'var(--semantic-error)' : 'var(--text-secondary)', fontSize: '0.78rem' }}>• Due: {new Date(details.due).toLocaleDateString()}</span>}

                          {details.completed && (
                            <span className="badge badge-success status-text" style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem' }}>
                              Completed
                            </span>
                          )}
                          {isOverdue && <span className="status-text" style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--semantic-error-bg)', color: 'var(--semantic-error)', border: '1px solid var(--semantic-error-border)', fontSize: '0.7rem' }}>Overdue</span>}
                        </div>

                        <h3 className="h3-card" style={{ marginBottom: '4px', fontSize: '0.95rem', fontWeight: 600 }}>{m.title}</h3>
                        <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem', lineHeight: 1.4 }}>{details.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {project.github_url && (
            <div className="bento-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 className="h2-section" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                  Repository Activity
                </h2>
                <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="btn-ghost body-text" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  View Repository <ExternalLink size={14} />
                </a>
              </div>

              {commits.length === 0 ? (
                <div className="body-text" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-interactive-neutral)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)', fontSize: '0.9rem' }}>
                  No recent commits found or repository is private.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {commits.map((commit: any, idx: number) => (
                    <div key={idx} style={{ padding: '12px 16px', background: 'var(--bg-interactive-neutral)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.open(commit.html_url, '_blank')}>
                      <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--semantic-primary-bg)', border: '1px solid var(--semantic-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GitCommit size={16} color="var(--semantic-primary)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="body-text text-bold" style={{ color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>{commit.commit.message.split('\n')[0]}</div>
                        <div className="meta-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--semantic-primary)' }}>{commit.commit.author.name}</span>
                          <span style={{ opacity: 0.3 }}>•</span>
                          <span>{new Date(commit.commit.author.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="label-text" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', background: '#ffffff', padding: '3px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.72rem' }}>
                        {commit.sha.substring(0, 7)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Endorsements */}
          {(endorsements.length > 0 || (userRole === 'faculty' && !isFounder)) && (
            <div className="bento-item">
              <h2 className="h2-section" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 600 }}>
                Endorsements
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {endorsements.map(e => (
                  <div key={e.id} style={{ background: 'var(--bg-interactive-neutral)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                    <p className="body-text" style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '0.9rem', lineHeight: 1.5 }}>{e.note}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={e.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.users?.full_name || 'Faculty')}&background=d0d7de&color=24292f`}
                        alt={e.users?.full_name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div className="body-text text-bold" style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{e.users?.full_name || 'Faculty Member'}</div>
                        <div className="meta-text" style={{ fontSize: '0.72rem' }}>{e.users?.university}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {userRole === 'faculty' && !isFounder && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ padding: '16px', background: 'var(--semantic-primary-bg)', border: '1px dashed var(--semantic-primary-border)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 className="h3-card" style={{ color: 'var(--semantic-primary)', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>Add Your Endorsement</h3>
                    <p className="body-text" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
                      Add a short note of support or guidance for this student team.
                    </p>
                    <form onSubmit={handleEndorse} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <textarea
                        required
                        maxLength={300}
                        className="search-field body-text"
                        placeholder="Write a brief note of support or guidance..."
                        style={{ minHeight: '80px', resize: 'vertical', borderRadius: 'var(--radius-sm)', background: '#ffffff', padding: '10px' }}
                        value={endorsementNote}
                        onChange={(e) => setEndorsementNote(e.target.value)}
                      />
                      <button type="submit" disabled={endorsing} className="btn-primary body-text" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '0.85rem', alignSelf: 'flex-start' }}>
                        {endorsing ? 'Posting...' : 'Post endorsement'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sticky Sidebar */}
        <div className="bento-sidebar">

          {/* Actions Block */}
          {(isFounder || !(userRole === 'admin' || userRole === 'faculty')) && (
            <div className="bento-item" style={{ padding: '20px' }}>
              {isFounder ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-primary-bg)', border: '1px solid var(--semantic-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <Crown size={24} color="var(--semantic-primary)" />
                  </div>
                  <h3 className="h3-card" style={{ marginBottom: '6px', fontSize: '1rem', fontWeight: 600 }}>You lead this team</h3>
                  <p className="body-text" style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.85rem', lineHeight: 1.4 }}>Manage membership pitches, timelines, and credentials.</p>
                  <Link href={`/projects/${project.id}/manage`}>
                    <button className="btn-primary body-text" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                      Manage workspace
                    </button>
                  </Link>
                </div>
              ) : isAcceptedMember ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-success-bg)', border: '1px solid var(--semantic-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <Award size={24} color="var(--semantic-success)" />
                  </div>
                  <h3 className="h3-card" style={{ marginBottom: '4px', fontSize: '1.05rem', fontWeight: 600 }}>Active Member</h3>
                  <p className="status-text" style={{ color: 'var(--semantic-success)', marginBottom: 0, fontSize: '0.88rem' }}>✓ You are officially on this team.</p>
                </div>
              ) : hasApplied ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--bg-interactive-neutral)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <Send size={24} color="var(--text-secondary)" />
                  </div>
                  <h3 className="h3-card" style={{ marginBottom: '4px', fontSize: '1.05rem', fontWeight: 600 }}>
                    {applicationStatus === 'Declined' ? 'Not Selected' : applicationStatus === 'Removed' ? 'Removed from Team' : 'Application Sent'}
                  </h3>
                  <p className="body-text" style={{ color: applicationStatus === 'Declined' || applicationStatus === 'Removed' ? 'var(--semantic-error)' : 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem' }}>
                    {applicationStatus === 'Declined' ? 'Your application was not selected.' : applicationStatus === 'Removed' ? 'You have been removed from this team.' : 'Your application is pending review.'}
                  </p>
                  {applicationStatus === 'Declined' && (
                    <>
                      {applicationFeedback && (
                        <div style={{ padding: '12px', background: 'var(--semantic-error-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--semantic-error-border)', marginBottom: '12px', textAlign: 'left' }}>
                          <h4 className="label-text" style={{ color: 'var(--semantic-error)', marginBottom: '4px', textTransform: 'none', letterSpacing: 'normal', fontWeight: 600, fontSize: '0.75rem' }}>Feedback from Founder</h4>
                          <p className="body-text" style={{ margin: 0, fontStyle: 'italic', fontSize: '0.8rem' }}>"{applicationFeedback}"</p>
                        </div>
                      )}
                      <button onClick={handleWithdraw} disabled={applying} className="btn-ghost body-text" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {applying ? 'Processing...' : 'Withdraw & reapply'}
                      </button>
                    </>
                  )}
                </div>
              ) : !showPitchForm ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-success-bg)', border: '1px solid var(--semantic-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <Users size={24} color="var(--semantic-success)" />
                  </div>
                  <h3 className="h3-card" style={{ marginBottom: '6px', fontSize: '1rem', fontWeight: 600 }}>Join Team</h3>
                  <p className="body-text" style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.85rem', lineHeight: 1.4 }}>Pitch the founder to join this team.</p>
                  <button
                    onClick={() => setShowPitchForm(true)}
                    className="btn-primary body-text"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--semantic-success-solid)', color: 'var(--semantic-success-fg)', border: 'none', fontSize: '0.88rem' }}
                  >
                    Apply to join
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="h3-card" style={{ color: 'var(--semantic-success)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.98rem', fontWeight: 600 }}>
                    <Send size={16} /> Pitch the Founder
                  </h3>
                  <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      required
                      maxLength={300}
                      className="search-field body-text"
                      placeholder="Why are you the perfect fit? (Max 300 char)"
                      style={{ minHeight: '100px', resize: 'vertical', borderRadius: 'var(--radius-sm)', padding: '10px', background: '#ffffff' }}
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                    />
                    <div className="meta-text" style={{ textAlign: 'right', fontSize: '0.72rem' }}>
                      <span style={{ color: pitch.length > 280 ? 'var(--semantic-error)' : 'var(--text-secondary)' }}>{pitch.length}</span>/300
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => setShowPitchForm(false)} className="btn-ghost body-text" style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={applying} className="btn-primary body-text" style={{ flex: 2, padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--semantic-success-solid)', color: 'var(--semantic-success-fg)', border: 'none', fontSize: '0.85rem' }}>
                        {applying ? 'Sending...' : 'Send pitch'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Tech Stack */}
          <div className="bento-item" style={{ padding: '20px' }}>
            <h3 className="h3-card" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 600 }}>
              <Rocket size={16} /> Skills Needed
            </h3>
            {project.project_skills?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {project.project_skills.map((skill: any) => (
                  <span
                    key={skill.skill_name}
                    className="label-text"
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-interactive-neutral)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {skill.skill_name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="body-text" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No specific skills listed.</span>
            )}
          </div>

          {/* Active Team Block */}
          <div className="bento-item" style={{ padding: '20px' }}>
            <h3 className="h3-card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 600 }}>
              <Users size={16} /> Active Roster
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href={`/profile/${project.founder_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-interactive-neutral)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={project.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.users?.full_name || 'Anonymous')}&background=d0d7de&color=24292f`}
                      alt={project.users?.full_name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', background: 'var(--bg-card)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={8} color="var(--semantic-primary)" />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="body-text text-bold" style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{project.users?.full_name || 'Anonymous'}</div>
                    <div className="meta-text" style={{ marginTop: '2px', fontSize: '0.72rem' }}>Founder</div>
                  </div>
                </div>
              </Link>

              {teamMembers.map((member, index) => (
                <Link key={index} href={`/profile/${member.applicant_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-interactive-neutral)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                    <img
                      src={member.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.users?.full_name || 'Anonymous')}&background=d0d7de&color=24292f`}
                      alt={member.users?.full_name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="body-text text-bold" style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{member.users?.full_name || 'Anonymous'}</div>
                      <div className="meta-text" style={{ marginTop: '2px', fontSize: '0.72rem' }}>Member</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


