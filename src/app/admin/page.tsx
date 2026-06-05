"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Shield, Activity, Users, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';

const projectStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Open':
      return 'badge badge-primary';
    case 'Active':
      return 'badge badge-success';
    case 'Completed':
      return 'badge badge-success';
    default:
      return 'badge badge-primary';
  }
};

const formatJoinedDate = (value: string) => new Date(value).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      if (!user) {
        if (!authLoading) router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }

      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: allProjects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (allUsers) setUsersList(allUsers);
      if (allProjects) setProjectsList(allProjects);

      setLoading(false);
    }

    if (!authLoading) {
      loadAdminData();
    }
  }, [user, authLoading, router]);

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert("Role update failed due to Supabase Security Rules (RLS). Run the SQL command provided below to fix this.");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (!error) {
      setUsersList(usersList.filter(u => u.id !== userId));
    } else {
      alert("Delete failed due to Supabase Security Rules (RLS). Run the SQL command provided below to fix this.");
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (!error) {
      setProjectsList(projectsList.filter(p => p.id !== projectId));
    } else {
      alert("Delete failed due to Supabase Security Rules (RLS). Run the SQL command provided below to fix this.");
    }
  };

  const studentCount = usersList.filter(user => user.role === 'student').length;
  const staffCount = usersList.filter(user => user.role !== 'student').length;

  if (loading || authLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid var(--border-subtle)', borderTopColor: 'var(--semantic-primary)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span className="body-text">
            Loading admin dashboard...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <main className="main-content" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={28} color="var(--semantic-primary)" />
        </div>
        <div>
          <h1 className="h1-page" style={{ marginBottom: '4px' }}>Admin Dashboard</h1>
          <p className="body-text" style={{ color: 'var(--text-secondary)', margin: 0 }}>User and project administration.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="var(--semantic-primary)" />
          </div>
          <div>
            <div className="label-text" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Users</div>
            <div className="h1-hero" style={{ lineHeight: 1 }}>{usersList.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} color="var(--semantic-primary)" />
          </div>
          <div>
            <div className="label-text" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Students</div>
            <div className="h1-hero" style={{ lineHeight: 1 }}>{studentCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="var(--semantic-warning)" />
          </div>
          <div>
            <div className="label-text" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Faculty/Admin</div>
            <div className="h1-hero" style={{ lineHeight: 1 }}>{staffCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-neutral-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} color="var(--text-secondary)" />
          </div>
          <div>
            <div className="label-text" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Projects</div>
            <div className="h1-hero" style={{ lineHeight: 1 }}>{projectsList.length}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 className="h2-section" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={22} color="var(--semantic-primary)" /> User Management
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--semantic-primary-border)' }}>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Name</th>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>University</th>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Joined</th>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Role</th>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No users available.
                  </td>
                </tr>
              ) : usersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=d0d7de&color=24292f`} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
                      <span className="body-text text-bold" style={{ color: 'var(--text-primary)' }}>{u.full_name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="body-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{u.university || 'N/A'}</td>
                  <td className="body-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{formatJoinedDate(u.created_at)}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <select
                      className="search-field body-text"
                      style={{ padding: '8px 12px', appearance: 'none', background: 'var(--semantic-primary-bg)', border: '1px solid var(--semantic-primary-border)', borderRadius: 'var(--radius-md)' }}
                      value={u.role || 'student'}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="body-text"
                      style={{ padding: '8px 16px', color: 'var(--semantic-error-fg)', border: 'none', background: 'var(--semantic-error-solid)', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-md)' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginTop: '8px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
        <h2 className="h2-section" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={22} color="var(--semantic-primary)" /> Project Management
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--semantic-primary-border)' }}>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Project Title</th>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Type</th>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Created</th>
                <th className="label-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectsList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No projects available.
                  </td>
                </tr>
              ) : projectsList.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td className="body-text text-bold" style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{p.title}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span className="badge badge-primary label-text" style={{ padding: '4px 10px' }}>{p.type}</span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span className={projectStatusBadgeClass(p.status)} style={{ padding: '4px 10px' }}>{p.status || 'Unknown'}</span>
                  </td>
                  <td className="body-text" style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="body-text"
                      style={{ padding: '8px 16px', color: 'var(--semantic-error-fg)', border: 'none', background: 'var(--semantic-error-solid)', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-md)' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
