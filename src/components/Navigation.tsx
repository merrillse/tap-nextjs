'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EnvironmentIndicator from './EnvironmentIndicator';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  description?: string;
}

interface NavGroup {
  name: string;
  icon: string;
  items: NavItem[];
}

export default function Navigation({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', href: '/' }];
    
    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const name = path.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      breadcrumbs.push({ name, href: currentPath });
    });
    
    return breadcrumbs;
  };

  // Navigation structure with logical groupings
  const navGroups: NavGroup[] = [
    {
      name: 'Search & Data',
      icon: '🔍',
      items: [
        { name: 'Missionary Search', href: '/missionary', icon: '👤', description: 'Search missionary records' },
        { name: 'Missionaries Search', href: '/missionaries', icon: '👥', description: 'Search multiple missionaries' },
        { name: 'Missionaries Connection', href: '/missionaries-connection', icon: '🔗', description: 'Paginated missionary retrieval with GraphQL Relay' },
      ]
    },
    {
      name: 'Testing Tools',
      icon: '🧪',
      items: [
        { name: 'API Testing', href: '/api-testing', icon: '🔧', description: 'Test GraphQL & REST APIs' },
        { name: 'MGQL Schema Browser', href: '/schema-browser', icon: '🔍', description: 'Explore MGQL schema structure' },
        { name: 'Load Testing', href: '/load-testing', icon: '⚡', description: 'Performance testing' },
        { name: 'Debug Tools', href: '/debug', icon: '🐛', description: 'OAuth & API debugging' },
      ]
    },
    {
      name: 'Administration',
      icon: '⚙️',
      items: [
        { name: 'Settings', href: '/settings', icon: '⚙️', description: 'Environment & app settings' },
        { name: 'Documentation', href: '/documentation', icon: '📖', description: 'MIS GraphQL integration guide' },
      ]
    }
  ];

  const toggleGroup = (groupName: string) => {
    setActiveGroup(activeGroup === groupName ? null : groupName);
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-3">
              {/* Interconnected Nodes Icon - Smaller Version */}
              <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" viewBox="0 0 28 28" fill="none">
                  {/* Connection Lines */}
                  <g stroke="currentColor" strokeWidth="1" opacity="0.8">
                    <line x1="8" y1="8" x2="14" y2="14" />
                    <line x1="20" y1="8" x2="14" y2="14" />
                    <line x1="8" y1="8" x2="20" y2="8" />
                    <line x1="8" y1="20" x2="14" y2="14" />
                    <line x1="20" y1="20" x2="14" y2="14" />
                    <line x1="8" y1="20" x2="20" y2="20" />
                    <line x1="8" y1="8" x2="8" y2="20" />
                    <line x1="20" y1="8" x2="20" y2="20" />
                  </g>
                  {/* Network Nodes */}
                  <g fill="currentColor">
                    <circle cx="8" cy="8" r="2" />
                    <circle cx="20" cy="8" r="2" />
                    <circle cx="8" cy="20" r="2" />
                    <circle cx="20" cy="20" r="2" />
                    <circle cx="14" cy="14" r="2.5" />
                  </g>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-lg blur-sm opacity-30 -z-10"></div>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">tap</h1>
                <p className="text-xs text-gray-500">MGQL Service Team</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <svg className={`w-5 h-5 transform transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Home Link */}
          <div className="px-3 mb-6">
            <Link
              href="/"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive('/') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">🏠</span>
              {!isSidebarCollapsed && <span>Home</span>}
            </Link>
          </div>

          {/* Navigation Groups */}
          {navGroups.map((group) => (
            <div key={group.name} className="mb-6">
              {!isSidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <span>{group.icon}</span>
                    <span>{group.name}</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${activeGroup === group.name ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              <div className={`space-y-1 px-3 ${!isSidebarCollapsed && activeGroup !== group.name ? 'hidden' : ''}`}>
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 group ${
                      isActive(item.href) 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={isSidebarCollapsed ? item.name : ''}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {!isSidebarCollapsed && (
                      <div className="flex-1">
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 group-hover:text-gray-600">{item.description}</div>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <EnvironmentIndicator />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Beautiful Breadcrumbs */}
            <nav className="flex items-center space-x-2">
              {generateBreadcrumbs().map((crumb, index, array) => (
                <div key={crumb.href} className="flex items-center space-x-2">
                  <Link
                    href={crumb.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      index === array.length - 1
                        ? 'bg-blue-50 text-blue-700 cursor-default'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {index === 0 && <span className="mr-1">🏠</span>}
                    {crumb.name}
                  </Link>
                  {index < array.length - 1 && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </nav>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Missionary Graph Service Team (0oak0jqakvevwjWrp357)
              </div>
              {/* Sexy Interconnected Nodes Team Logo */}
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                {/* Interconnected Network Pattern */}
                <svg className="w-7 h-7 text-white" viewBox="0 0 28 28" fill="none">
                  {/* Connection Lines */}
                  <g stroke="currentColor" strokeWidth="1" opacity="0.8">
                    <line x1="8" y1="8" x2="14" y2="14" />
                    <line x1="20" y1="8" x2="14" y2="14" />
                    <line x1="8" y1="8" x2="20" y2="8" />
                    <line x1="8" y1="20" x2="14" y2="14" />
                    <line x1="20" y1="20" x2="14" y2="14" />
                    <line x1="8" y1="20" x2="20" y2="20" />
                    <line x1="8" y1="8" x2="8" y2="20" />
                    <line x1="20" y1="8" x2="20" y2="20" />
                  </g>
                  {/* Network Nodes */}
                  <g fill="currentColor">
                    {/* Corner nodes */}
                    <circle cx="8" cy="8" r="2.5" />
                    <circle cx="20" cy="8" r="2.5" />
                    <circle cx="8" cy="20" r="2.5" />
                    <circle cx="20" cy="20" r="2.5" />
                    {/* Central hub node */}
                    <circle cx="14" cy="14" r="3" />
                  </g>
                  {/* Subtle pulse effect on central node */}
                  <circle cx="14" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4">
                    <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                </svg>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-lg blur-sm opacity-50 -z-10"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
