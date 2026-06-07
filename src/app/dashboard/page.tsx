"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Clock as ClockIcon, Users as UsersIcon, ChevronRight, Compass } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'Open': return 'badge badge-success';
    case 'Active': return 'badge badge-success';
    case 'Completed': return 'badge badge-success';
    default: return 'badge badge-success';
  }
};

const applicationStatusStyles = (status: string) => {
  switch (status) {
    case 'Pending':
      return {
        background: 'var(--semantic-warning-bg)',
        color: 'var(--semantic-warning)',
        border: '1px solid var(--semantic-warning-border)'
      };
    case 'Declined':
      return {
        background: 'var(--semantic-error-bg)',
        color: 'var(--semantic-error)',
        border: '1px solid var(--semantic-error-border)'
      };
    case 'Removed':
      return {
        background: 'var(--semantic-neutral-bg)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--semantic-neutral-border)'
      };
    default:
      return {
        background: 'var(--semantic-primary-bg)',
        color: 'var(--semantic-primary)',
        border: '1px solid var(--semantic-primary-border)'
      };
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function loadDashboard() {
      if (!user) {
        if (!authLoading) router.push('/login');
        return;
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*, applications ( status )')
        .eq('founder_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsData) {
        const formattedProjects = projectsData.map(p => ({
          ...p,
          pendingCount: p.applications?.filter((a: any) => a.status === 'Pending').length || 0
        }));
        setMyProjects(formattedProjects);
      }

      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          id, status, created_at,
          projects ( id, title, type )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (appsData) setMyApplications(appsData);

      setLoading(false);
    }

    if (!authLoading) {
      loadDashboard();
    }
  }, [router, user, authLoading]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid var(--border-subtle)',
            borderTopColor: 'var(--semantic-primary)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span className="body-text">
            Loading Dashboard...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const activeTeams = myApplications.filter(app => app.status === 'Accepted');
  const otherApps = myApplications.filter(app => app.status !== 'Accepted');
  const pendingApplications = myApplications.filter(app => app.status === 'Pending');
  const applicationUpdates = [...otherApps].sort((left, right) => {
    const priority: Record<string, number> = { Pending: 0, Declined: 1, Removed: 2 };
    return (priority[left.status] ?? 99) - (priority[right.status] ?? 99);
  });

  return (
    <main className="main-content" style={{ maxWidth: 'min(1400px, 90vw)' }}>
      <div>
        <h1 className="section-title h1-page" style={{ marginBottom: '8px' }}>Dashboard</h1>
        <p className="body-text" style={{ color: 'var(--text-secondary)' }}>
          Manage the projects you lead and track your applications.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '14px',
        margin: '16px 0 20px'
      }}>
        <div className="card" style={{ 
          padding: '18px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderLeft: '4px solid #4F46E5' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#E2E8F0', fontWeight: 600 }}>Projects Led</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{myProjects.length}</div>
        </div>

        <div className="card" style={{ 
          padding: '18px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderLeft: '4px solid #22C55E' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#E2E8F0', fontWeight: 600 }}>Teams Joined</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{activeTeams.length}</div>
        </div>

        <div className="card" style={{ 
          padding: '18px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderLeft: '4px solid #EA580C' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#E2E8F0', fontWeight: 600 }}>Pending Reviews</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{pendingApplications.length}</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '65fr 35fr',
        gap: '16px',
        alignItems: 'start'
      }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 className="h2-section" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>My Projects</h2>

          {myProjects.length === 0 ? (
            <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <p className="body-text" style={{ margin: 0, fontSize: '0.88rem' }}>No projects managed yet.</p>
              <Link href="/post">
                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', color: '#FFFFFF', fontWeight: 'bold' }}>
                  Create project
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myProjects.map(project => (
                <div key={project.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className={`${statusBadgeClass(project.status)} status-text`} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                          {project.status}
                        </span>
                        {project.pendingCount > 0 && (
                          <span className="status-text" style={{
                            background: 'var(--semantic-primary-solid)',
                            color: 'var(--semantic-primary-fg)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.7rem'
                          }}>
                            {project.pendingCount} New
                          </span>
                        )}
                      </div>
                      <h3 className="h3-card" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        {project.title}
                      </h3>
                    </div>
                  </div>
                  <div className="meta-text" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UsersIcon size={12} /> {project.team_size} members
                    </span>
                    {project.commitment && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {project.commitment}
                      </span>
                    )}
                  </div>
                  <Link href={`/projects/${project.id}/manage`} style={{ width: '100%' }}>
                    <button className="btn-ghost body-text" style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      minHeight: '36px',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      Manage Project <ChevronRight size={14} />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* My Active Teams Section */}
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 className="h2-section" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>My Active Teams</h2>

            {activeTeams.length === 0 ? (
              <div className="card" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                <p className="body-text" style={{ margin: 0, fontSize: '0.88rem' }}>No active teams joined yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeTeams.map(app => (
                  <div key={app.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className="badge badge-success status-text" style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                            Active Team Member
                          </span>
                        </div>
                        <h3 className="h3-card" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                          {app.projects?.title}
                        </h3>
                      </div>
                    </div>
                    <div className="meta-text" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Type: {app.projects?.type}
                      </span>
                    </div>
                    <Link href={`/projects/${app.projects?.id}`} style={{ width: '100%' }}>
                      <button className="btn-ghost body-text" style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        minHeight: '36px',
                        fontSize: '0.85rem',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        View Project <ChevronRight size={14} />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '96px', alignSelf: 'start' }}>
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h2 className="h2-section" style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '1.1rem', fontWeight: 600 }}>Quick Actions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/post" style={{ width: '100%' }}>
                <button className="btn-primary" style={{ width: '100%', minHeight: '36px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', color: '#FFFFFF', fontWeight: 'bold' }}>
                  + Post project
                </button>
              </Link>
              <Link href="/" style={{ width: '100%' }}>
                <button className="btn-ghost" style={{ width: '100%', minHeight: '36px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', color: '#FFFFFF', fontWeight: 600, background: '#2a2a2a', border: '1px solid #333333' }}>
                  <Compass size={14} color="#FFFFFF" /> Explore ideaboard
                </button>
              </Link>
            </div>
          </div>

          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h2 className="h2-section" style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '1.1rem', fontWeight: 600 }}>Application Status</h2>
            </div>

            {applicationUpdates.length === 0 ? (
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <p className="body-text" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No applications sent.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {applicationUpdates.map(app => (
                  <div key={app.id} className="card" style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                    borderLeft: app.status === 'Pending' ? '3px solid var(--semantic-warning)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="h3-card" style={{ margin: 0, marginBottom: '2px', fontSize: '0.9rem', fontWeight: 600 }}>{app.projects?.title}</h3>
                      <p className="meta-text" style={{ fontSize: '0.75rem' }}>Applied {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="status-text" style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.72rem',
                      ...applicationStatusStyles(app.status),
                      whiteSpace: 'nowrap'
                    }}>
                      {app.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </main>
  );
}
