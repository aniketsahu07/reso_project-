"use client";

import React from 'react';
import { ChevronRight, Users, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCard({ project }: { project: any }) {
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
            color: '#5b7cff'
          }}>
            {project.type}
          </span>
          <img
            src={project.founderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.founder || 'User')}&background=10182f&color=5b7cff`}
            alt={project.founder}
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              border: '1.5px solid rgba(120,140,255,0.22)',
              flexShrink: 0
            }}
          />
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
          {(project.skillsRequired || []).slice(0, 4).map((skill: string) => {
            const isMatch = project.matchedSkills?.includes(skill);
            return (
              <span
                key={skill}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  background: isMatch ? 'rgba(34,197,94,0.12)' : 'rgba(120,140,255,0.08)',
                  border: `1px solid ${isMatch ? 'rgba(34,197,94,0.25)' : 'rgba(120,140,255,0.15)'}`,
                  color: isMatch ? '#22c55e' : '#94a3b8',
                  whiteSpace: 'nowrap'
                }}
              >
                {skill}
              </span>
            );
          })}
          {(project.skillsRequired?.length || 0) > 4 && (
            <span style={{
              padding: '3px 8px', borderRadius: '6px',
              fontSize: '0.72rem', fontWeight: 400,
              background: 'transparent',
              border: '1px solid rgba(100,116,139,0.25)',
              color: '#64748b'
            }}>
              +{project.skillsRequired.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '11px 22px',
        borderTop: '1px solid rgba(120,140,255,0.1)',
        background: 'rgba(255,255,255,0.015)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          fontSize: '0.78rem', color: '#64748b'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} /> {project.teamSize}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {project.commitment}
          </span>
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
