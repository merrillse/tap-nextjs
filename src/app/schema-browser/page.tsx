'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Code, Hash, FileText, GitBranch, Zap, Edit, Radio, ChevronRight, Copy, Check } from 'lucide-react';

interface SchemaType {
  name: string;
  lineNumber: number;
  definition: string;
  category: 'type' | 'enum' | 'input' | 'interface' | 'union' | 'query' | 'mutation' | 'subscription';
}

interface SchemaData {
  content: string;
  types: SchemaType[];
}

export default function SchemaBrowserPage() {
  const [mogsSchema, setMogsSchema] = useState<SchemaData>({ content: '', types: [] });
  const [misSchema, setMisSchema] = useState<SchemaData>({ content: '', types: [] });
  const [selectedSchema, setSelectedSchema] = useState<'mogs' | 'mis'>('mogs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<Set<number>>(new Set());
  
  const schemaViewRef = useRef<HTMLDivElement>(null);
  const typeListRef = useRef<HTMLDivElement>(null);

  // Load schema files
  useEffect(() => {
    const loadSchemas = async () => {
      try {
        const [mogsResponse, misResponse] = await Promise.all([
          fetch('/docs/schemas/mogs-schema.txt'),
          fetch('/docs/schemas/mis-schema.txt')
        ]);

        const mogsContent = await mogsResponse.text();
        const misContent = await misResponse.text();

        setMogsSchema({
          content: mogsContent,
          types: parseSchema(mogsContent)
        });

        setMisSchema({
          content: misContent,
          types: parseSchema(misContent)
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading schemas:', error);
        setLoading(false);
      }
    };

    loadSchemas();
  }, []);

  // Parse GraphQL schema to extract types
  const parseSchema = useCallback((content: string): SchemaType[] => {
    const lines = content.split('\n');
    const types: SchemaType[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Match type definitions
      const typeMatch = trimmedLine.match(/^(type|enum|input|interface|union)\s+(\w+)/);
      if (typeMatch) {
        types.push({
          name: typeMatch[2],
          lineNumber: index + 1,
          definition: trimmedLine,
          category: typeMatch[1] as SchemaType['category']
        });
      }
      
      // Match Query, Mutation, Subscription
      const rootMatch = trimmedLine.match(/^(Query|Mutation|Subscription)\s*\{?$/);
      if (rootMatch) {
        types.push({
          name: rootMatch[1],
          lineNumber: index + 1,
          definition: trimmedLine,
          category: rootMatch[1].toLowerCase() as SchemaType['category']
        });
      }
    });
    
    return types.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Get current schema data
  const currentSchema = selectedSchema === 'mogs' ? mogsSchema : misSchema;

  // Filter types based on search
  const filteredTypes = useMemo(() => {
    if (!searchTerm) return currentSchema.types;
    return currentSchema.types.filter(type => 
      type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentSchema.types, searchTerm]);

  // Enhanced jump to type definition with smooth scrolling
  const jumpToType = useCallback((typeName: string) => {
    const type = currentSchema.types.find(t => t.name === typeName);
    if (type && schemaViewRef.current) {
      const lines = currentSchema.content.split('\n');
      const targetLine = type.lineNumber;
      
      // More accurate calculation for line height
      const lineElement = schemaViewRef.current.querySelector('[data-line="1"]') as HTMLElement;
      const lineHeight = lineElement ? lineElement.offsetHeight : 24;
      const scrollPosition = Math.max(0, (targetLine - 3) * lineHeight);
      
      // Smooth scroll to position
      schemaViewRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      
      setSelectedType(typeName);
      
      // Highlight the target line and surrounding lines
      const highlightLines = new Set([
        targetLine - 1,
        targetLine,
        targetLine + 1
      ].filter(line => line > 0 && line <= lines.length));
      
      setHighlightedLines(highlightLines);
      
      // Clear highlights after animation
      setTimeout(() => {
        setHighlightedLines(new Set());
      }, 2000);
    }
  }, [currentSchema]);

  // Copy type name to clipboard
  const copyTypeName = useCallback(async (typeName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(typeName);
      setCopiedType(typeName);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('type-search')?.focus();
      }
      
      // Escape to clear search
      if (e.key === 'Escape') {
        setSearchTerm('');
        setSelectedType(null);
      }

      // J/K for navigation through filtered types
      if (!document.getElementById('type-search')?.matches(':focus')) {
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          navigateTypes(1);
        } else if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          navigateTypes(-1);
        } else if (e.key === 'Enter' && selectedType) {
          jumpToType(selectedType);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedType, filteredTypes, jumpToType]);

  // Navigate through types with keyboard
  const navigateTypes = useCallback((direction: number) => {
    if (filteredTypes.length === 0) return;
    
    const currentIndex = selectedType 
      ? filteredTypes.findIndex(t => t.name === selectedType)
      : -1;
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = filteredTypes.length - 1;
    if (newIndex >= filteredTypes.length) newIndex = 0;
    
    setSelectedType(filteredTypes[newIndex].name);
  }, [filteredTypes, selectedType]);

  // Enhanced schema content highlighting with better type detection
  const highlightSchemaContent = useCallback((content: string) => {
    const lines = content.split('\n');
    const typeNames = currentSchema.types.map(t => t.name);
    
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isSelectedLine = selectedType && 
        currentSchema.types.find(t => t.name === selectedType)?.lineNumber === lineNumber;
      const isHighlighted = highlightedLines.has(lineNumber);
      
      // Highlight type references in the line
      let highlightedLine = line;
      typeNames.forEach(typeName => {
        // More precise regex to avoid matching partial words
        const regex = new RegExp(`\\b${typeName}\\b(?!\\s*\\{)`, 'g');
        highlightedLine = highlightedLine.replace(regex, (match) => 
          `<span class="text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-1 hover:decoration-2 transition-colors font-medium" data-type="${match}">${match}</span>`
        );
      });
      
      return (
        <div
          key={index}
          data-line={lineNumber}
          className={`flex hover:bg-slate-50 transition-colors ${
            isSelectedLine 
              ? 'bg-blue-50 border-l-4 border-blue-500 pl-2 shadow-sm' 
              : isHighlighted 
                ? 'bg-yellow-50 border-l-4 border-yellow-400 pl-2 animate-pulse' 
                : ''
          }`}
        >
          <span className="text-slate-400 text-xs w-12 flex-shrink-0 text-right pr-3 select-none font-mono leading-6">
            {lineNumber}
          </span>
          <span 
            className="flex-1 font-mono text-sm leading-6 text-slate-700"
            dangerouslySetInnerHTML={{ __html: highlightedLine }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.dataset.type) {
                jumpToType(target.dataset.type);
              }
            }}
          />
        </div>
      );
    });
  }, [currentSchema, selectedType, highlightedLines, jumpToType]);

  // Get category icon and color
  const getCategoryData = useCallback((category: SchemaType['category']) => {
    switch (category) {
      case 'type': return { icon: Code, color: 'text-blue-600 bg-blue-50', label: 'Type' };
      case 'enum': return { icon: Hash, color: 'text-purple-600 bg-purple-50', label: 'Enum' };
      case 'input': return { icon: FileText, color: 'text-green-600 bg-green-50', label: 'Input' };
      case 'interface': return { icon: GitBranch, color: 'text-orange-600 bg-orange-50', label: 'Interface' };
      case 'union': return { icon: Zap, color: 'text-yellow-600 bg-yellow-50', label: 'Union' };
      case 'query': return { icon: Search, color: 'text-indigo-600 bg-indigo-50', label: 'Query' };
      case 'mutation': return { icon: Edit, color: 'text-red-600 bg-red-50', label: 'Mutation' };
      case 'subscription': return { icon: Radio, color: 'text-teal-600 bg-teal-50', label: 'Subscription' };
      default: return { icon: Code, color: 'text-gray-600 bg-gray-50', label: 'Unknown' };
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-blue-400 animate-pulse mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading GraphQL Schemas</h2>
          <p className="text-slate-500">Parsing type definitions and preparing the browser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header with Glass Effect */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">GraphQL Schema Browser</h1>
                  <p className="text-slate-600">
                    Interactive explorer for MOGS and MIS GraphQL APIs
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-slate-100 rounded border text-xs font-mono">⌘ F</kbd>
                  <span>Search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-slate-100 rounded border text-xs font-mono">J K</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-slate-100 rounded border text-xs font-mono">Enter</kbd>
                  <span>Jump</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6">
            {/* Schema Selector with Modern Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setSelectedSchema('mogs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedSchema === 'mogs'
                    ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                MOGS Schema
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  {mogsSchema.types.length}
                </span>
              </button>
              <button
                onClick={() => setSelectedSchema('mis')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedSchema === 'mis'
                    ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                MIS Schema
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  {misSchema.types.length}
                </span>
              </button>
            </div>

            {/* Enhanced Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="type-search"
                type="text"
                placeholder="Search types, enums, interfaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
              />
              {searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                  {filteredTypes.length} found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Enhanced Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
          {/* Enhanced Type List Sidebar */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900 flex items-center">
                  <Hash className="w-4 h-4 mr-2 text-slate-500" />
                  Types
                  <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                    {filteredTypes.length}
                  </span>
                </h2>
              </div>
              <div 
                ref={typeListRef}
                className="flex-1 overflow-y-auto p-2"
              >
                <div className="space-y-1">
                  {filteredTypes.map((type) => {
                    const categoryData = getCategoryData(type.category);
                    const IconComponent = categoryData.icon;
                    
                    return (
                      <div
                        key={type.name}
                        className={`w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-all duration-200 group relative ${
                          selectedType === type.name 
                            ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                            : 'border border-transparent hover:border-slate-200'
                        }`}
                      >
                        {/* Main clickable area */}
                        <div 
                          className="cursor-pointer"
                          onClick={() => jumpToType(type.name)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${categoryData.color} group-hover:scale-110 transition-transform`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm font-medium text-slate-900 truncate">
                                  {type.name}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {/* Spacer for copy button */}
                                  <div className="w-6 h-6"></div>
                                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </div>
                              </div>
                              <div className="flex items-center mt-1 text-xs text-slate-500">
                                <span className="capitalize">{categoryData.label}</span>
                                <span className="mx-1">•</span>
                                <span>Line {type.lineNumber}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Copy button positioned absolutely */}
                        <button
                          onClick={(e) => copyTypeName(type.name, e)}
                          className="absolute top-3 right-8 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all z-10"
                          title="Copy type name"
                        >
                          {copiedType === type.name ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Schema Content */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-slate-500" />
                    {selectedSchema.toUpperCase()} Schema
                    {selectedType && (
                      <span className="ml-3 text-sm text-slate-500">
                        → <span className="font-mono text-blue-600">{selectedType}</span>
                      </span>
                    )}
                  </h2>
                  <div className="text-xs text-slate-500">
                    Click type names to navigate
                  </div>
                </div>
              </div>
              <div 
                ref={schemaViewRef}
                className="flex-1 overflow-y-auto bg-slate-50/30"
                style={{ fontFamily: 'Menlo, Monaco, "Courier New", monospace' }}
              >
                <div className="p-4">
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {highlightSchemaContent(currentSchema.content)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
