'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EnvironmentIndicator from './EnvironmentIndicator';
import TokenCacheManager from './TokenCacheManager';

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
        { name: 'Active Assignment', href: '/active-assignment', icon: '📋', description: 'Search missionary active assignment by missionary number' },
        { name: 'Assignment Location', href: '/assignment-location', icon: '📍', description: 'Search assignment location details by ID' },
        { name: 'District Search', href: '/district', icon: '🏘️', description: 'Search district details with zone and proselyting areas' },
        { name: 'Ecclesiastical Unit', href: '/ecclesiastical-unit', icon: '🏛️', description: 'Search ecclesiastical unit hierarchy and assignments' },
        { name: 'Mission Search', href: '/mission', icon: '🌍', description: 'Search mission details by organization number' },
        { name: 'Mission Boundary Changes', href: '/mission-boundary-changes', icon: '🗺️', description: 'Search mission boundary adjustments and changes from IMOS' },
        { name: 'Options Search', href: '/options', icon: '⚙️', description: 'Get all possible options for entities and attributes' },
        { name: 'SMMS Options', href: '/smms-options', icon: '🔧', description: 'List of option values for Service Missionary Management System' },
        { name: 'Proselyting Area', href: '/proselyting-area', icon: '🗺️', description: 'Search proselyting area details by ID' },
        { name: 'Proselyting Area for Referral', href: '/proselyting-area-for-referral', icon: '📤', description: 'Find proselyting areas configured to receive referrals for a unit' },
        { name: 'Zone Search', href: '/zone', icon: '🏢', description: 'Search zone details with mission and districts' },
        { name: 'Leader Search', href: '/leader', icon: '👔', description: 'Search leader profile by CMIS ID' },
        { name: 'Member Search', href: '/member', icon: '🆔', description: 'Search member missionary experiences by CMIS UUID' },
        { name: 'Missionary Search', href: '/missionary', icon: '👤', description: 'Search missionary records' },
        { name: 'Missionaries Search', href: '/missionaries', icon: '👥', description: 'Search multiple missionaries' },
        { name: 'Missionaries by Assignment Location', href: '/missionaries-by-assignment-location', icon: '📍', description: 'Find missionaries by assignment location ID' },
        { name: 'Missionaries by Assignment Locations', href: '/missionaries-by-assignment-locations', icon: '📍', description: 'Find missionaries by multiple assignment location IDs (bulk search)' },
        { name: 'Missionaries by Assigned Unit', href: '/missionaries-by-assigned-unit', icon: '🏢', description: 'Find missionaries assigned to a specific unit by Unit ID' },
        { name: 'Missionaries Connection', href: '/missionaries-connection', icon: '🔗', description: 'Paginated missionary retrieval with GraphQL Relay' },
        { name: 'Candidates by Membership Unit', href: '/candidates-by-membership-unit', icon: '🎯', description: 'Find candidates who started recommends in a specific membership unit' },
        { name: 'Countries', href: '/countries', icon: '🌍', description: 'Search countries and territories by ID, ISO codes, or name' },
      ]
    },
    {
      name: 'MOGS',
      icon: '🏛️',
      items: [
        { name: 'Assignment', href: '/mogs-assignment', icon: '📋', description: 'Search MOGS assignment details by ID' },
        { name: 'Assignment Location', href: '/mogs-assignment-location', icon: '📍', description: 'Search MOGS assignment location details by ID' },
        { name: 'Assignment Locations Search', href: '/mogs-assignment-locations-search', icon: '🔍', description: 'Type-ahead search for assignment locations with components' },
        { name: 'Component', href: '/mogs-component', icon: '🧩', description: 'Search MOGS component details by ID with optional filters' },
        { name: 'Enabled Member', href: '/mogs-enabled-member', icon: '👤', description: 'Search MOGS enabled member details by ID' },
      ]
    },
    {
      name: 'Testing Tools',
      icon: '🧪',
      items: [
        { name: 'Missionary Test Data', href: '/missionary-test-data', icon: '📊', description: 'Generate random missionary IDs and test data for API testing' },
        { name: 'GraphQL Testing', href: '/api-testing', icon: '🔧', description: 'Execute GraphQL queries with authentication and schema browser' },
        { name: 'Schema Visualizer', href: '/schema-visualizer', icon: '🕸️', description: 'Interactive GraphQL schema graph visualization' },
        { name: 'Load Testing', href: '/load-testing', icon: '⚡', description: 'Performance testing' },
        { name: 'Debug Tools', href: '/debug', icon: '🐛', description: 'OAuth & API debugging' },
      ]
    },
    {
      name: 'Utilities',
      icon: '🔧',
      items: [
        { name: 'Local Storage Manager', href: '/local-storage', icon: '💾', description: 'Browse and manage local storage data' },
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
      {/* Token Cache Manager - Handles automatic cleanup of expired tokens */}
      <TokenCacheManager />
      
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
                <h1 className="text-lg font-semibold text-gray-900">MQGL/MOGS</h1>
                <p className="text-xs text-gray-500">Test Application</p>
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
              <div className="relative">
                {/* Modern Professional Home Icon */}
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 ${
                  isActive('/') 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700'
                }`}>
                  <svg 
                    className="w-3 h-3" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {/* Modern geometric home design */}
                    <path d="M12 2.5l-8.5 7.5v11.5c0 0.55 0.45 1 1 1h4.5v-6.5c0-0.55 0.45-1 1-1h4c0.55 0 1 0.45 1 1v6.5h4.5c0.55 0 1-0.45 1-1v-11.5l-8.5-7.5z"/>
                    {/* Subtle accent line */}
                    <path d="M12 6l-6 5.25v0.75h12v-0.75l-6-5.25z" opacity="0.3"/>
                  </svg>
                </div>
                {isActive('/') && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-20 -z-10"></div>
                )}
              </div>
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
              {/* Professional Team Icon */}
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.47 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58A2.01 2.01 0 0 0 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0 0 20 14c-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
                </svg>
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
