"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, Plus, GitBranch, Trash2, AlertTriangle } from 'lucide-react';
import BackButton from '../../../../components/BackButton';
import Link from 'next/link';

export default function ManageProject({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [project, setProject] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [milestoneAssigned, setMilestoneAssigned] = useState("");
  const [postingMilestone, setPostingMilestone] = useState(false);

  const [githubUrl, setGithubUrl] = useState("");
  const [savingGithub, setSavingGithub] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [decliningAppId, setDecliningAppId] = useState<string | null>(null);
  const [declineFeedback, setDeclineFeedback] = useState<string>("");

  // AI Roadmap Generation States
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRoadmap, setAiRoadmap] = useState<any[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [publishingRoadmap, setPublishingRoadmap] = useState(false);

  const handleGenerateRoadmap = async () => {
    setAiGenerating(true);
    setAiError(null);
    setAiRoadmap([]);

    try {
      const response = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to generate roadmap');
      }

      setAiRoadmap(payload.roadmap);
    } catch (err: any) {
      setAiError(err.message || 'Something went wrong.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePublishRoadmap = async () => {
    if (aiRoadmap.length === 0) return;
    setPublishingRoadmap(true);

    try {
      const milestonesToInsert = aiRoadmap.map((item: any) => ({
        project_id: id,
        title: item.title,
        description: JSON.stringify({
          desc: item.description,
          due: '',
          assigned: '',
          completed: false,
          completed_at: ''
        })
      }));

      const { data, error } = await supabase
        .from('milestones')
        .insert(milestonesToInsert)
        .select();

      if (error) {
        alert(error.message);
      } else if (data) {
        setMilestones([...data, ...milestones]);
        setAiRoadmap([]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to publish roadmap.');
    } finally {
      setPublishingRoadmap(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) {
        alert(error.message);
      } else {
        setMilestones(milestones.filter(m => m.id !== milestoneId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete milestone.');
    }
  };

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (!projectData || projectData.founder_id !== session.user.id) {
        router.push('/dashboard');
        return;
      }

      setProject(projectData);
      setGithubUrl(projectData.github_url || "");

      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          id, pitch, status, created_at, applicant_id,
          users!applications_applicant_id_fkey ( full_name, avatar_url, university, bio, user_skills(skill_name) )
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (appsData) {
        setApplications(appsData);

        // Auto-clear notification badge by marking pending applications as read
        const hasUnread = appsData.some(app => app.status === 'Pending');
        if (hasUnread) {
          await supabase
            .from('applications')
            .update({ is_read: true })
            .eq('project_id', id)
            .eq('status', 'Pending');
        }
      }

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (milestonesData) {
        setMilestones(milestonesData);
      }

      setLoading(false);
    }

    loadData();
  }, [id, router]);

  const updateStatus = async (appId: string, newStatus: string, feedback: string | null = null) => {
    const payload: any = { status: newStatus };
    if (feedback !== null) payload.feedback = feedback;

    const { error } = await supabase
      .from('applications')
      .update(payload)
      .eq('id', appId);

    if (!error) {
      setApplications(applications.map(app => app.id === appId ? { ...app, status: newStatus, feedback } : app));
      if (newStatus === 'Declined') {
        setDecliningAppId(null);
        setDeclineFeedback("");
      }
    }
  };

  const handlePostMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingMilestone(true);

    const payload = JSON.stringify({
      desc: milestoneDesc,
      due: milestoneDue,
      assigned: milestoneAssigned
    });

    const { data, error } = await supabase
      .from('milestones')
      .insert({ project_id: id, title: milestoneTitle, description: payload })
      .select()
      .single();

    if (data) {
      setMilestones([data, ...milestones]);
      setMilestoneTitle("");
      setMilestoneDesc("");
      setMilestoneDue("");
      setMilestoneAssigned("");
    } else if (error) {
      alert(error.message);
    }
    setPostingMilestone(false);
  };

  const handleCompleteMilestone = async (milestoneId: string, currentDesc: string) => {
    let details = { desc: currentDesc, due: '', assigned: '', completed: false };
    try {
      const parsed = JSON.parse(currentDesc);
      if (parsed.desc !== undefined) details = { ...details, ...parsed };
    } catch (e) { }

    const newPayload = JSON.stringify({ ...details, completed: true, completed_at: new Date().toISOString() });

    const { error } = await supabase
      .from('milestones')
      .update({ description: newPayload })
      .eq('id', milestoneId);

    if (!error) {
      setMilestones(milestones.map(m => m.id === milestoneId ? { ...m, description: newPayload } : m));
    }
  };

  const handleSaveGithub = async () => {
    setSavingGithub(true);
    const { error } = await supabase
      .from('projects')
      .update({ github_url: githubUrl.trim() === "" ? null : githubUrl.trim() })
      .eq('id', id);

    if (!error) {
      setProject({ ...project, github_url: githubUrl.trim() });
    }
    setSavingGithub(false);
  };

  const handleDeleteProject = async () => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      setDeleting(true);
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (!error) {
        router.push('/dashboard');
      } else {
        alert(error.message);
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid var(--border-subtle)', borderTopColor: 'var(--semantic-primary)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
            Loading workspace...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <main className="main-content" style={{ maxWidth: 'min(1400px, 90vw)' }}>
      <BackButton href="/dashboard" text="Back to Dashboard" />

      <div style={{ marginBottom: '32px' }}>
        <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{project.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Manage your team and track your progress.</p>
        <p className="text-sm text-gray-400" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', opacity: 0.8 }}>
          {applications.filter(a => a.status === 'Accepted').length + 1} members • {milestones.length} milestones • Started {(() => {
            const d = new Date(project.created_at);
            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
          })()}
        </p>
      </div>

      <div className="manage-project-grid">

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {applications.filter(a => a.status === 'Accepted').length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--semantic-success)', marginBottom: '16px' }}>Active Roster</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {applications.filter(a => a.status === 'Accepted').map(app => {
                  const applicant = Array.isArray(app.users) ? app.users[0] : app.users;
                  return (
                    <div key={app.id} className="card" style={{ padding: '16px', borderLeft: '3px solid var(--semantic-success)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <Link href={`/profile/${app.applicant_id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <img
                              src={applicant?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant?.full_name || 'Anonymous')}&background=d0d7de&color=24292f`}
                              alt={applicant?.full_name || 'Anonymous'}
                              style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--semantic-primary-border)', objectFit: 'cover' }}
                            />
                            <div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{applicant?.full_name || 'Anonymous'}</h3>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{applicant?.university || 'University not specified'}</div>
                            </div>
                          </div>
                        </Link>
                        <button onClick={() => updateStatus(app.id, 'Removed')} className="btn-ghost" style={{ padding: '8px 16px', color: 'var(--semantic-error)', border: '1px solid var(--semantic-error-border)', fontSize: '0.85rem' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Pending Requests</h2>
            {applications.filter(a => a.status === 'Pending').length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No new applications.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applications.filter(a => a.status === 'Pending').map(app => {
                  const applicant = Array.isArray(app.users) ? app.users[0] : app.users;
                  return (
                    <div key={app.id} className="card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Link href={`/profile/${app.applicant_id}`}>
                            <img
                              src={applicant?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant?.full_name || 'Anonymous')}&background=d0d7de&color=24292f`}
                              alt={applicant?.full_name || 'Anonymous'}
                              style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--semantic-primary-border)', cursor: 'pointer', objectFit: 'cover' }}
                            />
                          </Link>
                          <div>
                            <Link href={`/profile/${app.applicant_id}`} style={{ textDecoration: 'none' }}>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0, cursor: 'pointer' }}>{applicant?.full_name || 'Anonymous'}</h3>
                            </Link>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{applicant?.university || 'University not specified'}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '4px 10px', background: 'var(--bg-surface-hover)', borderRadius: '8px' }}>
                          {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ background: 'var(--semantic-primary-bg)', border: '1px solid var(--semantic-primary-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--semantic-primary)', marginBottom: '8px', fontWeight: 500 }}>
                          <Clock size={14} /> Application Pitch
                        </div>
                        <p style={{ lineHeight: 1.6, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>"{app.pitch}"</p>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {applicant?.user_skills?.map((skill: any) => (
                            <span key={skill.skill_name} className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>{skill.skill_name}</span>
                          ))}
                        </div>
                      </div>

                      {decliningAppId === app.id ? (
                        <div style={{ width: '100%', padding: '16px', background: 'var(--semantic-error-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--semantic-error-border)', marginTop: '12px' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--semantic-error)', marginBottom: '8px', fontWeight: 600 }}>Reason for declining (optional)</p>
                          <textarea
                            className="search-field"
                            value={declineFeedback}
                            onChange={(e) => setDeclineFeedback(e.target.value)}
                            placeholder="e.g. Need more experience with React"
                            style={{ width: '100%', minHeight: '60px', padding: '12px', fontSize: '0.9rem', borderRadius: '8px', background: 'var(--bg-main)' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={() => updateStatus(app.id, 'Declined', declineFeedback)} className="btn-primary" style={{ background: 'var(--semantic-error-solid)', color: 'var(--semantic-error-fg)', padding: '8px 16px', fontSize: '0.85rem', border: 'none' }}>
                              Confirm Decline
                            </button>
                            <button onClick={() => setDecliningAppId(null)} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--semantic-primary-border)', paddingTop: '20px', flexWrap: 'wrap', width: '100%' }}>
                          <button onClick={() => updateStatus(app.id, 'Accepted')} className="btn-primary" style={{ background: 'var(--semantic-success-solid)', color: 'var(--semantic-success-fg)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '120px', border: 'none' }}>
                            <Check size={16} /> Accept
                          </button>
                          <button onClick={() => setDecliningAppId(app.id)} className="btn-ghost" style={{ flex: 1, color: 'var(--semantic-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--semantic-error-border)', minWidth: '120px' }}>
                            <X size={16} /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '24px', marginBottom: '24px', marginTop: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Post New Milestone</h3>
            <form onSubmit={handlePostMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                required
                className="search-field"
                placeholder="Milestone Title (e.g. Database Designed)"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="date"
                  className="search-field"
                  style={{ colorScheme: 'dark', width: '50%' }}
                  value={milestoneDue}
                  onChange={(e) => setMilestoneDue(e.target.value)}
                />
                <select
                  className="search-field"
                  style={{ appearance: 'none', width: '50%' }}
                  value={milestoneAssigned}
                  onChange={(e) => setMilestoneAssigned(e.target.value)}
                >
                  <option value="">Assign to (Optional)</option>
                  <option value={project.founder_id}>Myself (Founder)</option>
                  {applications.filter(a => a.status === 'Accepted').map(a => {
                    const applicant = Array.isArray(a.users) ? a.users[0] : a.users;
                    return (
                      <option key={a.applicant_id} value={a.applicant_id}>
                        {applicant?.full_name || 'Anonymous'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <textarea
                required
                className="search-field"
                placeholder="What is the goal of this milestone?"
                style={{ minHeight: '100px', resize: 'vertical' }}
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
              />
              <button type="submit" disabled={postingMilestone} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                <Plus size={16} /> {postingMilestone ? 'Posting...' : 'Add Milestone'}
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Past Milestones</h3>
            {milestones.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No milestones yet. Post your first milestone above ↑</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {milestones.map(m => {
                  let details: any = { desc: m.description, due: '', assigned: '', completed: false, completed_at: '' };
                  try {
                    const parsed = JSON.parse(m.description);
                    if (parsed.desc !== undefined) details = { ...details, ...parsed };
                  } catch (e) { }

                  const isOverdue = !details.completed && details.due && new Date(details.due) < new Date(new Date().setHours(0, 0, 0, 0));

                  let assignedName = '';
                  if (details.assigned) {
                    if (details.assigned === project.founder_id) assignedName = 'Founder';
                    else {
                      const assignedApp = applications.find(a => a.applicant_id === details.assigned);
                      const appUser = assignedApp ? (Array.isArray(assignedApp.users) ? assignedApp.users[0] : assignedApp.users) : null;
                      assignedName = appUser?.full_name || 'Team Member';
                    }
                  }

                  return (
                    <div key={m.id} className="card" style={{ padding: '20px', borderColor: details.completed ? 'var(--semantic-success-border)' : isOverdue ? 'var(--semantic-error-border)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{m.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Added {new Date(m.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            style={{ background: 'transparent', color: 'var(--semantic-error)', opacity: 0.7, border: 'none', padding: '4px', borderRadius: '6px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--semantic-error-bg)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}
                            title="Delete Milestone"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 16px 0' }}>{details.desc}</p>

                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--semantic-primary-border)', paddingTop: '16px' }}>
                        {details.due && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isOverdue ? 'var(--semantic-error)' : undefined }}>
                            <Clock size={14} color={isOverdue ? 'var(--semantic-error)' : 'var(--semantic-warning)'} /> Due: {new Date(details.due).toLocaleDateString()}
                          </div>
                        )}
                        {assignedName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="var(--semantic-success)" /> Assigned to: {assignedName}
                          </div>
                        )}
                        {isOverdue && <span style={{ color: 'var(--semantic-error)', fontWeight: 600 }}>⚠️ Overdue</span>}

                        <div style={{ marginLeft: 'auto' }}>
                          {details.completed ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: 'var(--semantic-success-bg)', color: 'var(--semantic-success)',
                              padding: '4px 10px', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--semantic-success-border)'
                            }}>
                              ✓ Completed {details.completed_at && `on ${new Date(details.completed_at).toLocaleDateString()}`}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCompleteMilestone(m.id, m.description)}
                              className="btn-ghost"
                              style={{ padding: '6px 14px', fontSize: '0.8rem', border: '1px solid var(--semantic-success-border)', color: 'var(--semantic-success)' }}
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Integrations</h2>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--semantic-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitBranch size={16} color="var(--text-white)" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>GitHub Repository</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>Link your repository to display a live commit feed on your project page.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  className="search-field"
                  style={{ flex: 1, minWidth: '200px' }}
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <button
                  className="btn-primary"
                  onClick={handleSaveGithub}
                  disabled={savingGithub || githubUrl === project.github_url}
                  style={{ padding: '10px 24px' }}
                >
                  {savingGithub ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              BuildTrack Roadmap
            </h2>

            {/* Roadmap generator */}
            <div className="card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--semantic-primary)', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ background: 'var(--semantic-primary-bg)', color: 'var(--semantic-primary)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Suggested plan
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Roadmap builder</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '16px' }}>
                Build a focused four-week timeline for this project and assign work to the right people.
              </p>

              {aiGenerating ? (
                <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                  <div style={{ border: '3px solid var(--semantic-primary-border)', borderTop: '3px solid var(--semantic-primary)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} className="animate-spin"></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Building the roadmap...
                  </div>
                </div>
              ) : aiRoadmap.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px', background: 'var(--bg-card)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', color: 'var(--semantic-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '8px' }}>
                    Proposed four-week roadmap
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {aiRoadmap.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--semantic-primary-bg)', color: 'var(--semantic-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 500, marginTop: '2px', flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <button
                      onClick={handlePublishRoadmap}
                      disabled={publishingRoadmap}
                      className="btn-primary"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--semantic-success-solid)', color: 'var(--semantic-success-fg)', border: 'none' }}
                    >
                      <Check size={14} /> {publishingRoadmap ? 'Publishing...' : 'Publish plan to timeline'}
                    </button>
                    <button
                      onClick={() => setAiRoadmap([])}
                      className="btn-ghost"
                      style={{ fontSize: '0.8rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', border: '1px solid var(--border-subtle)' }}
                    >
                      <Trash2 size={14} /> Discard
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {aiError && (
                    <div style={{ padding: '10px', background: 'var(--semantic-error-bg)', color: 'var(--semantic-error)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '12px', border: '1px solid var(--semantic-error-border)' }}>
                      {aiError}
                    </div>
                  )}
                  <button
                    onClick={handleGenerateRoadmap}
                    className="btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', padding: '12px', borderRadius: '8px', border: 'none' }}
                  >
                    Generate roadmap
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '48px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--semantic-error)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} /> Danger Zone
            </h2>
            <div className="card" style={{ padding: '24px', border: '1px solid var(--semantic-error-border)', background: 'var(--semantic-error-bg)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Delete Project</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Once you delete a project, there is no going back. This will remove all applications, milestones, and data associated with this project.
              </p>
              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                className="btn-primary"
                style={{
                  padding: '10px 24px',
                  color: 'var(--semantic-error-fg)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--semantic-error-solid)'
                }}
              >
                <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
