"use client";

import React, { useState } from 'react';
import { ChevronRight, Users, Clock as ClockIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from './Avatar';

export default function ProjectCard({ project }: { project: any }) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  function toggleSkills(projectId: string) {
    setExpandedCards(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  }
  return (
    <div
      className="card project-card"
      style={{ padding: 0, height: '100%' }}
    >
      {/* Card body */}
      <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Type + Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: project.type === 'AI/ML' ? '#22C55E' : (project.type === 'Web App' || project.type === 'WEB APP' ? '#EA580C' : '#4F46E5')
          }}>
            {project.type}
          </span>
          <div style={{ border: '1.5px solid #2a2a2a', borderRadius: '50%', flexShrink: 0, display: 'inline-flex' }}>
            <Avatar src={project.founderAvatar} name={project.founder} size={7.5} />
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: '#f8fafc',
          lineHeight: 1.35,
          margin: 0
        }}>
          {project.title}
        </h3>

        {/* Match badge */}
        {project.matchScore > 0 && (
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '6px',
              padding: '3px 9px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#22c55e'
            }}>
              ✦ {project.matchedSkills?.length}/{project.skillsRequired?.length} skills match
            </span>
          </div>
        )}

        {/* Description */}
        <p style={{
          fontSize: '0.875rem',
          color: '#94a3b8',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
          flex: 1
        }}>
          {project.description}
        </p>

        {/* Skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: 'auto', paddingTop: '8px' }}>
          {!expandedCards[project.id] ? (
            <>
              {(project.skillsRequired || []).slice(0, 4).map((skill: string) => {
                const isMatch = project.matchedSkills?.includes(skill);
                return (
                  <span
                    key={skill}
                    className={isMatch ? "skill-badge match" : "skill-badge"}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {skill}
                  </span>
                );
              })}
              {(project.skillsRequired?.length || 0) > 4 && (
                <span
                  className="skill-badge cursor-pointer"
                  style={{
                    padding: '3px 8px', borderRadius: '6px',
                    fontSize: '0.72rem', fontWeight: 400,
                    background: 'transparent',
                    border: '1px solid rgba(100,116,139,0.25)',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => { e.stopPropagation(); toggleSkills(project.id); }}
                >
                  +{project.skillsRequired.length - 4} more
                </span>
              )}
            </>
          ) : (
            <>
              {(project.skillsRequired || []).map((skill: string) => {
                const isMatch = project.matchedSkills?.includes(skill);
                return (
                  <span
                    key={skill}
                    className={isMatch ? "skill-badge match" : "skill-badge"}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {skill}
                  </span>
                );
              })}
              <span
                className="skill-badge cursor-pointer"
                style={{
                  padding: '3px 8px', borderRadius: '6px',
                  fontSize: '0.72rem', fontWeight: 400,
                  background: 'transparent',
                  border: '1px solid rgba(100,116,139,0.25)',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
                onClick={(e) => { e.stopPropagation(); toggleSkills(project.id); }}
              >
                show less
              </span>
            </>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '11px 22px',
        borderTop: '1px solid #2a2a2a',
        background: 'rgba(255,255,255,0.015)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          fontSize: '0.78rem', color: '#64748b'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} /> {project.teamSize}
          </span>
          {project.commitment && (
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              {project.commitment}
            </span>
          )}
        </div>
        <Link href={`/projects/${project.id}`}>
          <button
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '8px', gap: '4px' }}
          >
            View <ChevronRight size={12} />
          </button>
        </Link>
      </div>
    </div>
  );
}
