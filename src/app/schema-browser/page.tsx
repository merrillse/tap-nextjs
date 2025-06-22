'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

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
  const parseSchema = (content: string): SchemaType[] => {
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
  };

  // Get current schema data
  const currentSchema = selectedSchema === 'mogs' ? mogsSchema : misSchema;

  // Filter types based on search
  const filteredTypes = useMemo(() => {
    if (!searchTerm) return currentSchema.types;
    return currentSchema.types.filter(type => 
      type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentSchema.types, searchTerm]);

  // Jump to type definition
  const jumpToType = (typeName: string) => {
    const type = currentSchema.types.find(t => t.name === typeName);
    if (type && schemaViewRef.current) {
      const lines = currentSchema.content.split('\n');
      const targetLine = type.lineNumber;
      
      // Calculate approximate scroll position (assuming ~20px per line)
      const scrollPosition = (targetLine - 1) * 20;
      schemaViewRef.current.scrollTop = scrollPosition;
      
      setSelectedType(typeName);
      
      // Clear selection after 3 seconds for visual feedback
      setTimeout(() => setSelectedType(null), 3000);
    }
  };

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
  }, [selectedType, filteredTypes]);

  // Navigate through types with keyboard
  const navigateTypes = (direction: number) => {
    if (filteredTypes.length === 0) return;
    
    const currentIndex = selectedType 
      ? filteredTypes.findIndex(t => t.name === selectedType)
      : -1;
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = filteredTypes.length - 1;
    if (newIndex >= filteredTypes.length) newIndex = 0;
    
    setSelectedType(filteredTypes[newIndex].name);
  };

  // Highlight schema content with clickable type references
  const highlightSchemaContent = (content: string) => {
    const lines = content.split('\n');
    const typeNames = currentSchema.types.map(t => t.name);
    
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isSelectedLine = selectedType && 
        currentSchema.types.find(t => t.name === selectedType)?.lineNumber === lineNumber;
      
      // Highlight type references in the line
      let highlightedLine = line;
      typeNames.forEach(typeName => {
        // More precise regex to avoid matching partial words
        const regex = new RegExp(`\\b${typeName}\\b(?!\\s*\\{)`, 'g');
        highlightedLine = highlightedLine.replace(regex, (match) => 
          `<span class="text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-1 hover:decoration-2" data-type="${match}">${match}</span>`
        );
      });
      
      return (
        <div
          key={index}
          className={`flex hover:bg-gray-50 ${isSelectedLine ? 'bg-yellow-100 border-l-4 border-yellow-400 pl-2' : ''}`}
        >
          <span className="text-gray-400 text-xs w-12 flex-shrink-0 text-right pr-2 select-none">
            {lineNumber}
          </span>
          <span 
            className="flex-1 font-mono text-sm leading-relaxed"
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
  };

  const getCategoryIcon = (category: SchemaType['category']) => {
    switch (category) {
      case 'type': return '📋';
      case 'enum': return '🔢';
      case 'input': return '📥';
      case 'interface': return '🔗';
      case 'union': return '🔀';
      case 'query': return '❓';
      case 'mutation': return '✏️';
      case 'subscription': return '📡';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GraphQL schemas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📊 GraphQL Schema Browser</h1>
                <p className="mt-2 text-gray-600">
                  Interactive schema explorer for MOGS and MIS GraphQL APIs
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+F</kbd> Search
                  <span className="mx-2">•</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">J/K</kbd> Navigate
                  <span className="mx-2">•</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> Jump
                  <span className="mx-2">•</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> Clear
                </div>
              </div>
            </div>
          </div>

          {/* Schema Selector */}
          <div className="flex items-center gap-6 pb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedSchema('mogs')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSchema === 'mogs'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                MOGS Schema ({mogsSchema.types.length} types)
              </button>
              <button
                onClick={() => setSelectedSchema('mis')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSchema === 'mis'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                MIS Schema ({misSchema.types.length} types)
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                id="type-search"
                type="text"
                placeholder="Search types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Type List Sidebar */}
          <div className="col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  Types ({filteredTypes.length})
                </h2>
              </div>
              <div 
                ref={typeListRef}
                className="flex-1 overflow-y-auto p-2"
              >
                {filteredTypes.map((type) => (
                  <button
                    key={type.name}
                    onClick={() => jumpToType(type.name)}
                    className={`w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors mb-1 ${
                      selectedType === type.name ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(type.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm font-medium text-gray-900 truncate">
                          {type.name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {type.category} • Line {type.lineNumber}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Schema Content */}
          <div className="col-span-9">
            <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  {selectedSchema.toUpperCase()} Schema Content
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on type names to jump to their definitions
                </p>
              </div>
              <div 
                ref={schemaViewRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-50"
              >
                <div className="space-y-0">
                  {highlightSchemaContent(currentSchema.content)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
