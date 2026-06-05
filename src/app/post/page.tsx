"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { PREDEFINED_SKILLS } from '../../lib/skills';
import { useAuth } from '../../components/AuthProvider';

export default function PostProject() {
  const [loading, setLoading] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [skills, setSkills] = useState<Record<string, 'required' | 'nice'>>({});
  const [formData, setFormData] = useState({
    title: '',
    type: 'Web App',
    description: '',
    commitment: '',
    teamSize: '',
    stage: 'Idea Stage'
  });

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const toggleSkill = (skill: string) => {
    setSkills(prev => {
      const current = prev[skill];
      const newSkills = { ...prev };
      
      if (!current) {
        if (Object.keys(newSkills).length < 15) {
          newSkills[skill] = 'required';
        }
      } else if (current === 'required') {
        newSkills[skill] = 'nice';
      } else {
        delete newSkills[skill];
      }
      return newSkills;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        founder_id: user.id,
        title: formData.title,
        type: formData.type,
        description: formData.description,
        commitment: formData.commitment,
        team_size: formData.teamSize,
        stage: formData.stage,
        github_url: githubUrl.trim() === "" ? null : githubUrl.trim(),
        status: 'Open'
      })
      .select()
      .single();

    if (projectError) {
      alert(projectError.message);
      setLoading(false);
      return;
    }

    const skillKeys = Object.keys(skills);
    if (skillKeys.length > 0) {
      const projectSkills = skillKeys.map(skill => ({
        project_id: project.id,
        skill_name: skill,
        is_required: skills[skill] === 'required'
      }));

      await supabase.from('project_skills').insert(projectSkills);
    }

    setLoading(false);
    window.location.href = '/';
  };

  return (
    <main className="main-content" style={{ maxWidth: '800px', paddingTop: '88px' }}>
      
      <form onSubmit={handleSubmit} className="panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ marginBottom: '8px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Post a Project</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>Fill out the details below to find teammates for your idea.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500 }}>Project Title</label>
          <input 
            type="text" 
            required 
            className="search-input" 
            style={{ padding: '12px 16px' }}
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Project Type</label>
            <select 
              className="search-input" 
              style={{ padding: '12px 16px', appearance: 'none' }}
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option>Web App</option>
              <option>Mobile App</option>
              <option>AI/ML</option>
              <option>Hardware/IoT</option>
              <option>Data Science</option>
              <option>Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Project Stage</label>
            <select 
              className="search-input" 
              style={{ padding: '12px 16px', appearance: 'none' }}
              value={formData.stage}
              onChange={(e) => setFormData({...formData, stage: e.target.value})}
            >
              <option>Idea Stage</option>
              <option>Prototyping</option>
              <option>Building</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>GitHub Repository URL (Optional)</label>
          <input 
            type="url" 
            placeholder="e.g. https://github.com/username/repo" 
            className="search-input" 
            style={{ padding: '12px 16px' }}
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500 }}>Description</label>
          <textarea 
            required 
            rows={4}
            className="search-input" 
            style={{ padding: '12px 16px', resize: 'vertical' }}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 500 }}>
            <span>Project Skills (Click to toggle: Required <span style={{color:'var(--text-secondary)'}}>→</span> Nice-to-Have <span style={{color:'var(--text-secondary)'}}>→</span> Remove)</span>
            <span style={{ color: Object.keys(skills).length === 15 ? 'var(--semantic-error)' : 'var(--text-secondary)' }}>{Object.keys(skills).length} / 15</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {PREDEFINED_SKILLS.map(skill => {
              const state = skills[skill];
              const isDisabled = !state && Object.keys(skills).length >= 15;
              
              let border = '1px solid var(--border-color)';
              let bg = 'var(--bg-surface)';
              let color = isDisabled ? 'var(--text-secondary)' : 'var(--text-primary)';
              
              if (state === 'required') {
                border = '1px solid var(--semantic-primary-border)';
                bg = 'var(--semantic-primary-bg)';
                color = 'var(--semantic-primary)';
              } else if (state === 'nice') {
                border = '1px dashed var(--semantic-neutral-border)';
                bg = 'var(--semantic-neutral-bg)';
                color = 'var(--semantic-neutral)';
              }

              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  disabled={isDisabled}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    border,
                    background: bg,
                    color,
                    transition: 'all 0.2s'
                  }}
                >
                  {skill} {state === 'required' ? '(Required)' : state === 'nice' ? '(Nice)' : ''}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Commitment Level</label>
            <input 
              type="text" 
              placeholder="e.g. 10 hrs/wk"
              className="search-input" 
              style={{ padding: '12px 16px' }}
              value={formData.commitment}
              onChange={(e) => setFormData({...formData, commitment: e.target.value})}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Team Size Needed</label>
            <input 
              type="text" 
              placeholder="e.g. 2/4"
              className="search-input" 
              style={{ padding: '12px 16px' }}
              value={formData.teamSize}
              onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem', width: 'auto' }}>
            {loading ? 'Posting...' : 'Post Project'}
          </button>
        </div>
      </form>
    </main>
  );
}
