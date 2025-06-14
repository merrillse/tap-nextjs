'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Navigation structure with logical groupings
  const navItems: NavItem[] = [
    { name: 'Home', href: '/', icon: '🏠' },
  ];

  const navGroups: NavGroup[] = [
    {
      name: 'Search & Data',
      icon: '🔍',
      items: [
        { name: 'Missionary Search', href: '/missionary', icon: '👤', description: 'Search missionary records' },
        { name: 'Missionaries Search', href: '/missionaries', icon: '👥', description: 'Search multiple missionaries' },
      ]
    },
    {
      name: 'Testing Tools',
      icon: '🧪',
      items: [
        { name: 'API Testing', href: '/api-testing', icon: '🔧', description: 'Test GraphQL & REST APIs' },
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (groupName: string) => {
    setActiveDropdown(activeDropdown === groupName ? null : groupName);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TAP</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Testing & API Platform
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1" ref={dropdownRef}>
            {/* Single nav items */}
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Dropdown groups */}
            {navGroups.map((group) => (
              <div key={group.name} className="relative">
                <button
                  onClick={() => toggleDropdown(group.name)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  <span className="text-lg">{group.icon}</span>
                  <span>{group.name}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === group.name ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {activeDropdown === group.name && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {group.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <span className="text-lg mt-0.5">{item.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <EnvironmentIndicator />
          </div>

          {/* Mobile menu button and environment indicator */}
          <div className="md:hidden flex items-center space-x-3">
            <EnvironmentIndicator />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {/* Single nav items */}
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Mobile group sections */}
            {navGroups.map((group) => (
              <div key={group.name}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.icon} {group.name}
                </div>
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-6 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div>{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500">{item.description}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
