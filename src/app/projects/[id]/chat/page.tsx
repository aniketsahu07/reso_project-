"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import BackButton from '../../../../components/BackButton';
import { Avatar } from '../../../../components/Avatar';

export default function TeamChat({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data: projectData } = await supabase
        .from('projects')
        .select(`
          founder_id, title,
          users!projects_founder_id_fkey ( full_name, avatar_url )
        `)
        .eq('id', id)
        .single();

      if (!projectData) {
        router.push('/');
        return;
      }
      setProject(projectData);

      let hasAccess = projectData.founder_id === session.user.id;

      if (!hasAccess) {
        const { data: app } = await supabase
          .from('applications')
          .select('status')
          .eq('project_id', id)
          .eq('applicant_id', session.user.id)
          .single();

        if (app?.status === 'Accepted') {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        router.push(`/projects/${id}`);
        return;
      }

      // Fetch team members
      const { data: membersData } = await supabase
        .from('applications')
        .select(`applicant_id, users!applications_applicant_id_fkey ( full_name, avatar_url, university )`)
        .eq('project_id', id)
        .eq('status', 'Accepted');

      if (membersData) {
        setTeamMembers(membersData);
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, user_id,
          users!messages_user_id_fkey ( full_name, avatar_url )
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (msgs) {
        setMessages(msgs);
        await supabase.from('chat_read_receipts').upsert({
          user_id: session.user.id,
          project_id: id,
          last_read_at: new Date().toISOString()
        });
      }

      setLoading(false);
    }

    loadData();
  }, [id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat_${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${id}` },
        async (payload) => {
          const { data: fullMsg } = await supabase
            .from('messages')
            .select(`
              id, content, created_at, user_id,
              users!messages_user_id_fkey ( full_name, avatar_url )
            `)
            .eq('id', payload.new.id)
            .single();

          if (fullMsg) {
            setMessages((prev) => [...prev, fullMsg]);
            await supabase.from('chat_read_receipts').upsert({
              user_id: user.id,
              project_id: id,
              last_read_at: new Date().toISOString()
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    const msg = newMessage;
    setNewMessage("");

    const { error } = await supabase
      .from('messages')
      .insert({
        project_id: id,
        user_id: user.id,
        content: msg.trim()
      });

    if (error) {
      setNewMessage(msg);
      alert("Failed to send message: " + error.message);
    }
    setSending(false);
  };

  if (loading) {
    return <div className="body-text" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading team chat workspace...</div>;
  }

  return (
    <main className="main-content" style={{ maxWidth: '1200px', paddingTop: '80px', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <BackButton href="/chat" text="Back to Chat Directory" />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>{project?.title} Chat Workspace</h1>
        <p className="body-text" style={{ color: 'var(--text-secondary)' }}>Real-time workspace communication channel.</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Main Chat Pane */}
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto' }}>
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.user_id === user.id;

                return (
                  <div key={msg.id || idx} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '12px', alignItems: 'flex-end' }}>
                    {!isMe && (
                      <Avatar src={msg.users?.avatar_url} name={msg.users?.full_name} size={8} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      {!isMe && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', marginLeft: '4px' }}>{msg.users?.full_name}</span>}
                      <div style={{
                        background: isMe ? 'var(--semantic-primary)' : 'var(--bg-surface-hover)',
                        color: isMe ? 'var(--text-white)' : 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        fontSize: '0.92rem',
                        lineHeight: 1.4
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--bg-input)', borderTop: '1px solid var(--border-color)' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Type your message..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)' }}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="btn-primary"
                style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4F46E5' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#4338CA'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#4F46E5'; }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Team Roster Sidebar */}
        <div className="panel" style={{ width: '240px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', alignSelf: 'stretch', overflowY: 'auto' }}>
          <div>
            <h3 className="label-text" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>Team Roster</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Founder */}
              {project && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar src={project.users?.avatar_url} name={project.users?.full_name || 'Founder'} size={7} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {project.users?.full_name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--semantic-primary)' }}>Founder</div>
                  </div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--semantic-success)' }}></div>
                </div>
              )}

              {/* Members */}
              {teamMembers.map((member, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar src={member.users?.avatar_url} name={member.users?.full_name || 'Member'} size={7} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {member.users?.full_name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Member</div>
                  </div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--semantic-success)' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
