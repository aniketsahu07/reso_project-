"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import Link from 'next/link';
import { MessageSquare, ChevronRight, Send } from 'lucide-react';

export default function ChatHub() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);

  // Preview Pane & Sidebar States
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [previewMessages, setPreviewMessages] = useState<any[]>([]);
  const [previewMembers, setPreviewMembers] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const selectedProjectIdRef = useRef(selectedProjectId);
  const activeProjectsRef = useRef(activeProjects);

  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId;
  }, [selectedProjectId]);

  useEffect(() => {
    activeProjectsRef.current = activeProjects;
  }, [activeProjects]);

  const handleSelectProject = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveProjects(prev => prev.map(p => p.id === projectId ? { ...p, unreadCount: 0 } : p));
    if (user) {
      await supabase.from('chat_read_receipts').upsert({
        user_id: user.id,
        project_id: projectId,
        last_read_at: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat_directory_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new;
          const currentSelectedId = selectedProjectIdRef.current;
          const currentProjects = activeProjectsRef.current;

          const projectBelongs = currentProjects.some(p => p.id === newMsg.project_id);
          if (!projectBelongs) return;

          if (newMsg.project_id === currentSelectedId) {
            await supabase.from('chat_read_receipts').upsert({
              user_id: user.id,
              project_id: newMsg.project_id,
              last_read_at: new Date().toISOString()
            });

            const { data: fullMsg } = await supabase
              .from('messages')
              .select(`
                id, content, created_at, user_id,
                users!messages_user_id_fkey ( full_name, avatar_url )
              `)
              .eq('id', newMsg.id)
              .single();

            if (fullMsg) {
              setPreviewMessages(prev => {
                if (prev.some(m => m.id === fullMsg.id)) return prev;
                return [...prev, fullMsg];
              });
            }
          } else {
            setActiveProjects(prev =>
              prev.map(p =>
                p.id === newMsg.project_id
                  ? { ...p, unreadCount: (p.unreadCount || 0) + 1 }
                  : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    async function loadChats() {
      if (!user) {
        if (!authLoading) router.push('/login');
        return;
      }

      const { data: myProjects } = await supabase
        .from('projects')
        .select('id, title')
        .eq('founder_id', user.id);

      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          projects!applications_project_id_fkey ( id, title )
        `)
        .eq('applicant_id', user.id)
        .eq('status', 'Accepted');

      let projectsMap = new Map();

      if (myProjects) {
        myProjects.forEach(p => projectsMap.set(p.id, p));
      }

      if (appsData) {
        appsData.forEach((a: any) => {
          if (a.projects) {
            projectsMap.set(a.projects.id, a.projects);
          }
        });
      }

      const allProjects = Array.from(projectsMap.values());

      if (allProjects.length > 0) {
        const allProjIds = allProjects.map((p: any) => p.id);
        const { data: receipts } = await supabase
          .from('chat_read_receipts')
          .select('project_id, last_read_at')
          .eq('user_id', user.id)
          .in('project_id', allProjIds);

        const receiptsMap = new Map();
        if (receipts) {
          receipts.forEach(r => receiptsMap.set(r.project_id, r.last_read_at));
        }

        for (const proj of allProjects as any[]) {
          const lastRead = receiptsMap.get(proj.id);
          let query = supabase.from('messages').select('*', { count: 'exact', head: true }).eq('project_id', proj.id);
          if (lastRead) {
            query = query.gt('created_at', lastRead);
          }
          const { count } = await query;
          proj.unreadCount = count || 0;
        }

        // Set first project as active
        const firstProjId = allProjects[0].id;
        setSelectedProjectId(firstProjId);
        allProjects[0].unreadCount = 0;
        await supabase.from('chat_read_receipts').upsert({
          user_id: user.id,
          project_id: firstProjId,
          last_read_at: new Date().toISOString()
        });
      }

      setActiveProjects(allProjects);
      setLoading(false);
    }

    if (!authLoading) {
      loadChats();
    }
  }, [user, authLoading, router]);

  // Load preview data (messages & team members) when selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId) return;

    async function loadPreviewData() {
      setPreviewLoading(true);
      try {
        // Fetch members
        const { data: members } = await supabase
          .from('applications')
          .select(`applicant_id, users!applications_applicant_id_fkey ( full_name, avatar_url )`)
          .eq('project_id', selectedProjectId)
          .eq('status', 'Accepted');

        const { data: proj } = await supabase
          .from('projects')
          .select(`users!projects_founder_id_fkey ( full_name, avatar_url )`)
          .eq('id', selectedProjectId)
          .single();

        let roster: any[] = [];
        if (proj?.users) {
          roster.push({ users: proj.users, role: 'Founder' });
        }
        if (members) {
          members.forEach((m: any) => {
            if (m.users) roster.push({ users: m.users, role: 'Member' });
          });
        }
        setPreviewMembers(roster);

        // Fetch messages
        const { data: msgs } = await supabase
          .from('messages')
          .select(`
            id, content, created_at, user_id,
            users!messages_user_id_fkey ( full_name, avatar_url )
          `)
          .eq('project_id', selectedProjectId)
          .order('created_at', { ascending: true })
          .limit(35);

        if (msgs) {
          setPreviewMessages(msgs);
        }
      } catch (error) {
        console.error("Error loading chat preview:", error);
      } finally {
        setPreviewLoading(false);
      }
    }

    loadPreviewData();
  }, [selectedProjectId]);

  if (loading) {
    return <div className="body-text" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading your chat directory...</div>;
  }

  const sortedProjects = [...activeProjects].sort((left, right) => (right.unreadCount > 0 ? 1 : 0) - (left.unreadCount > 0 ? 1 : 0));

  return (
    <main className="main-content" style={{ maxWidth: 'min(1400px, 90vw)', width: '100%', paddingLeft: '32px', paddingRight: '32px', paddingTop: '88px', paddingBottom: '24px', height: 'calc(100vh - 88px)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ marginBottom: '12px' }}>
        <h1 className="h1-page" style={{ marginBottom: '2px', fontSize: '1.5rem', fontWeight: 600 }}>Team Chats</h1>
        <p className="body-text" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Collaborate with your student teams in real-time.</p>
      </div>

      {activeProjects.length === 0 ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <MessageSquare size={32} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p className="body-text">Join or start a project to access team chats.</p>
          <Link href="/">
            <button className="btn-primary body-text" style={{ marginTop: '24px' }}>Browse projects</button>
          </Link>
        </div>
      ) : (
        <div className="chat-container-grid">

          {/* Team Members Status Sidebar */}
          <div className="panel" style={{ height: '100%', padding: '12px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h3 className="label-text" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
              Team Status
            </h3>
              {selectedProjectId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {previewMembers.map((member, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={member.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.users?.full_name || 'Member')}&background=d0d7de&color=24292f`}
                        alt={member.users?.full_name}
                        style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {member.users?.full_name}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{member.role}</div>
                      </div>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--semantic-success)', flexShrink: 0 }}></div>
                    </div>
                  ))}
                  {previewMembers.length === 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>No members.</div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', margin: 'auto 0' }}>Select a team to see members.</div>
              )}
            </div>

            {/* Chat directory list */}
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              {sortedProjects.map(project => {
                const isSelected = selectedProjectId === project.id;
                return (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className="panel"
                    style={{
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderColor: isSelected ? '#4F46E5' : 'var(--border-color)',
                      background: isSelected ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-surface)',
                      borderLeft: isSelected ? '2px solid #4F46E5' : (project.unreadCount > 0 ? '3px solid var(--semantic-primary)' : '1px solid var(--border-color)')
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: 'var(--radius-md)',
                        background: project.unreadCount > 0 ? 'var(--semantic-primary-bg)' : 'var(--bg-surface-hover)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: project.unreadCount > 0 ? 'var(--semantic-primary)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}>
                        {project.title?.trim().charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h2 className="h3-card" style={{ marginBottom: '1px', fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.title}
                          {project.unreadCount > 0 && (
                            <span className="label-text text-bold" style={{ background: 'var(--semantic-error-solid)', color: 'var(--semantic-error-fg)', padding: '0px 4px', borderRadius: 'var(--radius-md)', marginLeft: '4px', fontSize: '0.6rem' }}>
                              {project.unreadCount}
                            </span>
                          )}
                        </h2>
                        <p className="meta-text" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                          {project.unreadCount > 0
                            ? `${project.unreadCount} unread`
                            : 'No new messages'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>

          {/* Selected Chat Preview Pane */}
          <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            {previewLoading ? (
              <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--semantic-primary)', animation: 'spin 0.8s linear infinite' }} />
                <span className="body-text" style={{ fontSize: '0.85rem' }}>Loading messages...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : selectedProjectId ? (
              <>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-interactive-neutral)' }}>
                  <span className="body-text text-bold" style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    Previewing Chat Channel
                  </span>
                  <Link href={`/projects/${selectedProjectId}/chat`}>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)' }}>
                      Open full workspace
                    </button>
                  </Link>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', height: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {previewMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto', fontSize: '0.85rem' }}>
                      No messages in this chat yet. Open the workspace to say hello!
                    </div>
                  ) : (
                    previewMessages.map((msg, idx) => (
                      <div key={msg.id || idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <img
                          src={msg.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.users?.full_name || 'User')}&background=d0d7de&color=24292f`}
                          alt={msg.users?.full_name}
                          style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{msg.users?.full_name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-word', lineHeight: 1.4 }}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Disabled Input Bar at bottom of preview pane */}
                <div style={{ padding: '12px 16px', background: 'var(--bg-interactive-neutral)', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      disabled
                      placeholder="Open full workspace to reply..."
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-interactive-neutral-hover)', cursor: 'not-allowed', color: 'var(--text-dim)', fontSize: '0.85rem' }}
                    />
                    <button
                      disabled
                      style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-color)', color: 'var(--text-dim)', cursor: 'not-allowed' }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                Select a team chat to preview messages.
              </div>
            )}
          </div>

        </div>
      )}
    </main>
  );
}
