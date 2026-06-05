"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { PREDEFINED_SKILLS } from '../../lib/skills';

export default function Onboarding() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (profile) {
          if (profile.role === 'admin' || profile.role === 'faculty') {
            router.push('/');
            return;
          }
          setUniversity(profile.university || "");
          setDegree(profile.degree || "");
          setYear(profile.graduation_year || "");
          setBio(profile.bio || "");
          setGithub(profile.github_link || "");
          setLinkedin(profile.linkedin_link || "");
        }
        
        const { data: userSkills } = await supabase.from('user_skills').select('skill_name').eq('user_id', session.user.id);
        if (userSkills) {
          setSkills(userSkills.map((s: any) => s.skill_name));
        }
      }
    }
    loadSession();
  }, [router]);

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else if (skills.length < 15) {
      setSkills([...skills, skill]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (skills.length === 0) {
      alert("Please select at least one technical skill.");
      return;
    }
    
    setSaving(true);

    await supabase.from('users').update({
      university,
      degree,
      graduation_year: parseInt(year),
      bio,
      github_link: github,
      linkedin_link: linkedin
    }).eq('id', user.id);

    if (skills.length > 0) {
      const skillRows = skills.map(s => ({ user_id: user.id, skill_name: s }));
      await supabase.from('user_skills').delete().eq('user_id', user.id);
      await supabase.from('user_skills').insert(skillRows);
    } else {
      await supabase.from('user_skills').delete().eq('user_id', user.id);
    }

    router.push('/');
  };

  return (
    <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '800px', padding: '40px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Complete Your Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Tell us a bit about yourself so teams can find you.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>University</label>
              <input type="text" required className="search-input" value={university} onChange={e => setUniversity(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Degree / Major</label>
              <input type="text" required className="search-input" value={degree} onChange={e => setDegree(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Graduation Year</label>
              <input type="number" required min="2020" max="2030" className="search-input" value={year} onChange={e => setYear(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Short Bio</label>
            <textarea required maxLength={150} className="search-input" style={{ minHeight: '80px', resize: 'vertical' }} value={bio} onChange={e => setBio(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>GitHub Profile (Optional)</label>
              <input type="url" className="search-input" value={github} onChange={e => setGithub(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>LinkedIn Profile (Optional)</label>
              <input type="url" className="search-input" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 500 }}>
              <span>Technical Skills</span>
              <span style={{ color: skills.length === 15 ? 'var(--semantic-error)' : 'var(--text-secondary)' }}>{skills.length} / 15</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PREDEFINED_SKILLS.map(skill => {
                const isSelected = skills.includes(skill);
                const isDisabled = !isSelected && skills.length >= 15;
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    disabled={isDisabled}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      border: isSelected ? '1px solid var(--semantic-primary-border)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--semantic-primary-bg)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--semantic-primary)' : (isDisabled ? 'var(--text-secondary)' : 'var(--text-primary)'),
                      transition: 'all 0.2s'
                    }}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem', marginTop: '16px' }}>
            {saving ? 'Saving...' : 'Enter ProjectHub'}
          </button>
        </form>
      </div>
    </main>
  );
}
