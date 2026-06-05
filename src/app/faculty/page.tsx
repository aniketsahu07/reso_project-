"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Award, ChevronRight } from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';
import Link from 'next/link';

const truncateDescription = (description: string) => {
  if (!description) return 'No description provided.';
  return description.length > 120 ? `${description.slice(0, 120).trimEnd()}...` : description;
};

export default function FacultyDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [endorsements, setEndorsements] = useState<any[]>([]);

  useEffect(() => {
    async function loadFacultyData() {
      if (!user) {
        if (!authLoading) router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'faculty') {
        router.push('/');
        return;
      }

      const { data } = await supabase
        .from('endorsements')
        .select(`
          id, note, created_at,
          projects ( id, title, type, description )
        `)
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setEndorsements(data);
      }

      setLoading(false);
    }

    if (!authLoading) {
      loadFacultyData();
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return <div className="body-text" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading faculty dashboard...</div>;
  }

  const endorsementCount = endorsements.length;

  return (
    <main className="main-content" style={{ paddingTop: '100px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--semantic-primary-bg)', width: '48px', height: '48px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--semantic-primary)' }}>
          <Award size={24} />
        </div>
        <div>
          <h1 className="h1-page">Faculty Dashboard</h1>
          <p className="body-text" style={{ color: 'var(--text-secondary)' }}>Track the student projects you have publicly guided and supported.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '18px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--semantic-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--semantic-primary)' }}>
          <Award size={22} />
        </div>
        <div>
          <div className="label-text" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Projects Endorsed</div>
          <div className="h1-hero" style={{ lineHeight: 1 }}>{endorsementCount}</div>
          <p className="body-text" style={{ color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            You have publicly endorsed {endorsementCount} student {endorsementCount === 1 ? 'project' : 'projects'}.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {endorsements.length === 0 ? (
            <div className="panel body-text" style={{ padding: '40px 32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No endorsed projects yet.
            </div>
          ) : (
            endorsements.map(e => (
              <div key={e.id} className="panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="label-text" style={{ color: 'var(--semantic-primary)', marginBottom: '4px' }}>{e.projects?.type}</div>
                    <h2 className="h2-section" style={{ marginBottom: '8px' }}>{e.projects?.title}</h2>
                    <p className="body-text" style={{ color: 'var(--text-secondary)' }}>{truncateDescription(e.projects?.description || '')}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                    <div className="meta-text" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-hover)', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
                      Endorsed on {new Date(e.created_at).toLocaleDateString()}
                    </div>
                    <Link href={`/projects/${e.projects?.id}`}>
                      <button className="btn-secondary body-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
                        View project <ChevronRight size={16} />
                      </button>
                    </Link>
                  </div>
                </div>

                <div style={{ background: 'var(--semantic-primary-bg)', padding: '24px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--semantic-primary)' }}>
                  <div className="label-text" style={{ color: 'var(--semantic-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} /> Your Public Endorsement
                  </div>
                  <p className="body-text" style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>"{e.note}"</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ position: 'sticky', top: '96px', alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="panel" style={{ padding: '24px' }}>
            <h2 className="h2-section" style={{ marginBottom: '12px' }}>Discover Open Projects</h2>
            <Link href="/">
              <button className="btn-primary body-text" style={{ width: '100%', minHeight: '44px' }}>Open ideaboard</button>
            </Link>
          </div>

          <div className="panel" style={{ padding: '24px' }}>
            <h3 className="h3-card" style={{ marginBottom: '12px' }}>Strong endorsement tips</h3>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '10px', color: 'var(--text-secondary)' }}>
              <li>Call out feasibility.</li>
              <li>Highlight execution.</li>
              <li>Note the learning value.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
