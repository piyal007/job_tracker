'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Calendar, Settings, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };



  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 min-h-screen ${isCollapsed ? 'p-2' : 'p-6'} transition-all duration-300 relative`}>
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50 shadow-sm z-10"
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {!isCollapsed && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800">Job Tracker</h2>
        </div>
      )}
      
      <nav className={`space-y-2 ${isCollapsed ? 'mt-16' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
