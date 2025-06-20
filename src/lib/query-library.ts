/**
 * GraphQL Query Library
 * Manages saved queries with localStorage persistence
 */

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  variables?: Record<string, unknown>;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  version?: number; // For migration tracking
}

// Legacy interface for migration
interface LegacySavedQuery extends SavedQuery {
  environment?: string;
  proxyClient?: string;
}

export class QueryLibrary {
  private static readonly STORAGE_KEY = 'graphql-query-library';
  private static readonly CURRENT_VERSION = 2;

  /**
   * Get all saved queries
   */
  static getQueries(): SavedQuery[] {
    if (typeof window === 'undefined') {
      return []; // Return empty array on server-side
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const rawQueries = JSON.parse(stored);
      const migratedQueries = this.migrateQueries(rawQueries);
      
      // If migration occurred, save back to localStorage
      if (JSON.stringify(rawQueries) !== JSON.stringify(migratedQueries)) {
        console.log('[Query Library] Migration completed, saving updated queries');
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedQueries));
      }
      
      return migratedQueries;
    } catch (error) {
      console.error('Error loading saved queries:', error);
      return [];
    }
  }

  /**
   * Save a new query or update existing one
   */
  static saveQuery(query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>): SavedQuery {
    if (typeof window === 'undefined') {
      throw new Error('Cannot save queries on server-side');
    }
    
    const queries = this.getQueries();
    const now = new Date().toISOString();
    
    // Check if query with same name exists
    const existingIndex = queries.findIndex(q => q.name === query.name);
    
    let savedQuery: SavedQuery;
    
    if (existingIndex >= 0) {
      // Update existing query
      savedQuery = {
        ...queries[existingIndex],
        ...query,
        updatedAt: now,
        version: this.CURRENT_VERSION
      };
      queries[existingIndex] = savedQuery;
    } else {
      // Create new query
      savedQuery = {
        ...query,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
        version: this.CURRENT_VERSION
      };
      queries.push(savedQuery);
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queries));
      return savedQuery;
    } catch (error) {
      console.error('Error saving query:', error);
      throw new Error('Failed to save query. Storage may be full.');
    }
  }

  /**
   * Delete a query by ID
   */
  static deleteQuery(id: string): boolean {
    try {
      const queries = this.getQueries();
      const filteredQueries = queries.filter(q => q.id !== id);
      
      if (filteredQueries.length === queries.length) {
        return false; // Query not found
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredQueries));
      return true;
    } catch (error) {
      console.error('Error deleting query:', error);
      return false;
    }
  }

  /**
   * Get a specific query by ID
   */
  static getQuery(id: string): SavedQuery | null {
    const queries = this.getQueries();
    return queries.find(q => q.id === id) || null;
  }

  /**
   * Get queries by tag
   */
  static getQueriesByTag(tag: string): SavedQuery[] {
    return this.getQueries().filter(q => q.tags?.includes(tag));
  }

  /**
   * Search queries by name or content
   */
  static searchQueries(searchTerm: string): SavedQuery[] {
    const term = searchTerm.toLowerCase();
    return this.getQueries().filter(q => 
      q.name.toLowerCase().includes(term) ||
      q.query.toLowerCase().includes(term) ||
      (q.description && q.description.toLowerCase().includes(term)) ||
      (q.tags && q.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }

  /**
   * Export queries as JSON
   */
  static exportQueries(queryIds?: string[]): string {
    const queries = this.getQueries();
    if (queryIds && queryIds.length > 0) {
      const filteredQueries = queries.filter(q => queryIds.includes(q.id));
      return JSON.stringify(filteredQueries, null, 2);
    }
    return JSON.stringify(queries, null, 2);
  }

  /**
   * Import queries from JSON
   */
  static importQueries(jsonData: string, merge = true): boolean {
    try {
      const importedQueries: SavedQuery[] = JSON.parse(jsonData);
      
      if (!Array.isArray(importedQueries)) {
        throw new Error('Invalid format: expected array of queries');
      }

      // Validate query structure
      for (const query of importedQueries) {
        if (!query.name || !query.query) {
          throw new Error('Invalid query format: missing required fields');
        }
      }

      let finalQueries: SavedQuery[];
      
      if (merge) {
        const existing = this.getQueries();
        const existingNames = new Set(existing.map(q => q.name));
        
        // Add imported queries, updating duplicates
        finalQueries = [...existing];
        for (const importedQuery of importedQueries) {
          if (existingNames.has(importedQuery.name)) {
            // Update existing
            const index = finalQueries.findIndex(q => q.name === importedQuery.name);
            finalQueries[index] = {
              ...importedQuery,
              updatedAt: new Date().toISOString()
            };
          } else {
            // Add new
            finalQueries.push({
              ...importedQuery,
              id: importedQuery.id || this.generateId(),
              createdAt: importedQuery.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      } else {
        // Replace all queries
        finalQueries = importedQueries.map(q => ({
          ...q,
          id: q.id || this.generateId(),
          createdAt: q.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(finalQueries));
      return true;
    } catch (error) {
      console.error('Error importing queries:', error);
      return false;
    }
  }

  /**
   * Get query statistics
   */
  static getStats() {
    const queries = this.getQueries();
    const allTags = new Set<string>();
    queries.forEach(q => {
      q.tags?.forEach(tag => allTags.add(tag));
    });
    
    const totalQueries = queries.length;
    
    return {
      totalQueries,
      tags: Array.from(allTags),
      oldestQuery: queries.length > 0 ? 
        queries.reduce((oldest, current) => 
          new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
        ) : null,
      newestQuery: queries.length > 0 ?
        queries.reduce((newest, current) => 
          new Date(current.createdAt) > new Date(newest.createdAt) ? current : newest
        ) : null
    };
  }

  /**
   * Generate a unique ID for queries
   */
  private static generateId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract variables from GraphQL query string
   */
  static extractVariables(queryString: string): Record<string, unknown> {
    const variables: Record<string, unknown> = {};
    
    // Simple regex to find variable definitions
    const variableRegex = /\$(\w+):\s*([^,\)]+)(?:\s*=\s*([^,\)]+))?/g;
    let match;
    
    while ((match = variableRegex.exec(queryString)) !== null) {
      const [, varName, varType, defaultValue] = match;
      
      if (defaultValue) {
        try {
          // Try to parse the default value
          variables[varName] = JSON.parse(defaultValue);
        } catch {
          // If JSON parsing fails, use as string
          variables[varName] = defaultValue.replace(/['"]/g, '');
        }
      } else {
        // Generate a placeholder based on type
        variables[varName] = this.generatePlaceholderValue(varType.trim());
      }
    }
    
    return variables;
  }

  /**
   * Generate placeholder values based on GraphQL type
   */
  private static generatePlaceholderValue(type: string): unknown {
    const baseType = type.replace(/[!\[\]]/g, ''); // Remove ! and []
    
    switch (baseType) {
      case 'String':
      case 'ID':
        return 'example';
      case 'Int':
        return 42;
      case 'Float':
        return 3.14;
      case 'Boolean':
        return true;
      default:
        return null;
    }
  }

  /**
   * Migrate legacy queries to new format
   */
  private static migrateQueries(queries: any[]): SavedQuery[] {
    return queries.map(query => {
      // Check if it's a legacy query with environment/proxyClient
      if (query.environment || query.proxyClient) {
        console.log(`[Query Library] Migrating legacy query: ${query.name}`);
        
        // Create tags from environment if it had one
        const tags = query.tags || [];
        if (query.environment && !tags.includes(query.environment)) {
          tags.push(`env:${query.environment}`);
        }
        
        // Remove environment and proxyClient, add version
        const { environment, proxyClient, ...cleanQuery } = query;
        return {
          ...cleanQuery,
          tags,
          version: this.CURRENT_VERSION
        };
      }
      
      // Already in new format, just ensure version is set
      return {
        ...query,
        version: query.version || this.CURRENT_VERSION
      };
    });
  }
}
