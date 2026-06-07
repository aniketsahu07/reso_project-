"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Zap, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('student');
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchPendingCount() {
      if (user && pathname !== '/onboarding') {
        const { data: profile } = await supabase
          .from('users')
          .select('university, role')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (!profile.university && profile.role !== 'admin' && profile.role !== 'faculty') {
            router.push('/onboarding');
          }
          setUserRole(profile.role || 'student');
        }

        // First get all project IDs the user leads
        const { data: userProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('founder_id', user.id);

        const projectIds = userProjects?.map(p => p.id) || [];
        const myProjIds = projectIds;

        if (typeof window !== 'undefined') {
          if (pathname === '/dashboard' || (pathname.includes('/projects/') && pathname.includes('/manage'))) {
            localStorage.setItem('lastSeenApplications', new Date().toISOString());
          }
        }

        const lastSeen = typeof window !== 'undefined' ? localStorage.getItem('lastSeenApplications') : null;

        // Then count only pending applications for those projects
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('status', 'Pending')
          .gt('created_at', lastSeen || '1970-01-01');

        setPendingCount(count || 0);

        const { data: appsData } = await supabase
          .from('applications')
          .select('project_id')
          .eq('applicant_id', user.id)
          .eq('status', 'Accepted');

        const allProjIds = [...myProjIds, ...(appsData ? appsData.map(a => a.project_id) : [])];

        if (allProjIds.length > 0) {
          const { data: receipts } = await supabase
            .from('chat_read_receipts')
            .select('project_id, last_read_at')
            .eq('user_id', user.id)
            .in('project_id', allProjIds);

          const receiptsMap = new Map();
          if (receipts) {
            receipts.forEach(r => receiptsMap.set(r.project_id, r.last_read_at));
          }

          let totalUnread = 0;
          for (const pid of allProjIds) {
            const lastRead = receiptsMap.get(pid);
            let query = supabase.from('messages').select('*', { count: 'exact', head: true }).eq('project_id', pid);
            if (lastRead) {
              query = query.gt('created_at', lastRead);
            }
            const { count } = await query;
            if (count) totalUnread += count;
          }
          setUnreadChatCount(totalUnread);
        }
      }
    }

    fetchPendingCount();
  }, [user, pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleDashboardClick = () => {
    setPendingCount(0);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastSeenApplications', new Date().toISOString());
    }
    closeMenu();
  };

  const isActive = (path: string) => pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <Link href="/" className="nav-brand" onClick={closeMenu}>
        <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' }}>
          <Zap size={18} />
        </div>
        <span style={{ color: '#f8fafc', fontWeight: 700, letterSpacing: '-0.3px' }}>ProjectHub</span>
      </Link>

      <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link href="/" className={isActive('/')} onClick={closeMenu}>IdeaBoard</Link>
        {user && (
          <>
            {userRole === 'admin' && (
              <Link href="/admin" className={isActive('/admin')} onClick={closeMenu}>
                Admin
              </Link>
            )}
            {userRole === 'faculty' && (
              <Link href="/faculty" className={isActive('/faculty')} onClick={closeMenu}>
                Faculty
              </Link>
            )}
            {(userRole !== 'admin' && userRole !== 'faculty') && (
              <>
                <Link href="/dashboard" className={isActive('/dashboard')} onClick={handleDashboardClick} style={{ position: 'relative' }}>
                  Dashboard
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
                <Link href="/match" className={isActive('/match')} onClick={closeMenu}>
                  SkillMatch
                </Link>
                <Link href="/chat" className={isActive('/chat')} onClick={closeMenu} style={{ position: 'relative' }}>
                  Chat
                  {unreadChatCount > 0 && (
                    <span className="badge-notification">
                      {unreadChatCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className={isActive('/profile')} onClick={closeMenu}>Profile</Link>
              </>
            )}
          </>
        )}
        {user ? (
          <div className="nav-actions">
            {(userRole !== 'admin' && userRole !== 'faculty') && (
              <Link href="/post" onClick={closeMenu} className="nav-btn-wrapper">
                <button className="btn-primary navbar-btn" style={{ whiteSpace: 'nowrap' }}>Post project</button>
              </Link>
            )}
            <button className="btn-ghost navbar-btn" onClick={handleLogout} style={{ whiteSpace: 'nowrap' }}>Log out</button>
          </div>
        ) : (
          <Link href="/login" onClick={closeMenu} className="nav-btn-wrapper">
            <button className="btn-primary navbar-btn" style={{ whiteSpace: 'nowrap' }}>Log in</button>
          </Link>
        )}
      </div>
    </nav>
  );
}
