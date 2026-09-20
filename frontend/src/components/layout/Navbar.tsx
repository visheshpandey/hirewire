'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Briefcase, 
  Users, 
  Search, 
  FileText,
  Activity,
  ChevronDown
} from 'lucide-react';
import { scrollToTarget } from '@/components/layout/SmoothScroll';
import { usePageTransition } from '@/components/layout/PageTransition';
import { UserProfileModal } from '@/components/modals/UserProfileModal';

interface NavbarProps {
  hideLogo?: boolean;
  forceDashboardActive?: boolean;
}

export function Navbar({ 
  hideLogo = false, 
  forceDashboardActive = false
}: NavbarProps) {
  const pathname = usePathname();
  const { navigate } = usePageTransition();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Briefcase },
    { label: 'Roles', href: '/roles', icon: FileText },
    { label: 'Candidates', href: '/candidates', icon: Users },
    { label: 'NL Search', href: '/search', icon: Search },
    { label: 'Audit Trail', href: '/audit', icon: Activity }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-300/80 bg-[#f3f2f2]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand or Spacer when fixed logo is active */}
        <div className="flex items-center gap-6 sm:gap-8">
          {hideLogo ? (
            <div className="w-36 sm:w-48 shrink-0" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 group cursor-pointer bg-transparent border-none"
              title="Return to 3D Landing Page"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-base tracking-[0.18em] uppercase text-[#0F0F0F] group-hover:opacity-75 transition-opacity">
                  HIREFLOW
                </span>
              </div>
            </button>
          )}

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isDashboard = item.href === '/dashboard' || item.href === '/#dashboard';
              const isActive = isDashboard 
                ? forceDashboardActive || pathname === '/dashboard'
                : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer border-none ${
                    isActive 
                      ? 'bg-[#0F0F0F] text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-200/80 hover:text-black'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Recruiter Profile - Fully Interactive */}
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2.5 border-l border-neutral-300 pl-4 py-1 shrink-0 group cursor-pointer hover:opacity-85 transition-opacity bg-transparent border-t-0 border-r-0 border-b-0"
          title="View Operator Profile & Clearance"
        >
          <div className="h-8 w-8 rounded-full bg-[#0F0F0F] text-white flex items-center justify-center text-[11px] font-mono font-bold shadow-xs group-hover:bg-[#FF3B30] transition-colors">
            AT
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-bold text-[#0F0F0F] leading-tight">Alex Thorne</span>
            <span className="block text-[10px] text-neutral-500 font-mono leading-tight">LEAD RECRUITER</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors hidden sm:inline" />
        </button>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </header>
  );
}
