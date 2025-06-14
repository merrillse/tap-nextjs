/**
 * GraphQL Query Formatter
 * Formats GraphQL queries for better readability
 */

import { parse, print, DocumentNode } from 'graphql';

/**
 * Format a GraphQL query string
 */
export function formatGraphQLQuery(query: string): string {
  try {
    // Remove any leading/trailing whitespace
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      return '';
    }

    // Parse the GraphQL query to validate and get AST
    const ast: DocumentNode = parse(trimmedQuery);
    
    // Print the AST back to a formatted string
    const formatted = print(ast);
    
    return formatted;
  } catch (error) {
    // If parsing fails, return original query
    console.warn('GraphQL formatting failed:', error);
    throw new Error('Invalid GraphQL syntax - cannot format');
  }
}

/**
 * Check if a GraphQL query string is valid
 */
export function isValidGraphQL(query: string): boolean {
  try {
    if (!query.trim()) {
      return false;
    }
    parse(query);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get GraphQL syntax error details
 */
export function getGraphQLError(query: string): string | null {
  try {
    if (!query.trim()) {
      return 'Query is empty';
    }
    parse(query);
    return null;
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown GraphQL syntax error';
  }
}
