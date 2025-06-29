"use client";
import "./prism-setup";
import Prism from "prismjs";

import React, { useEffect, useState, useCallback } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import type {
  GraphQLType,
  GraphQLField,
  GraphQLFieldType,
  GraphQLArgument,
  GraphQLSchema,
} from "@/lib/random-query-generator";
import type { GraphQLResponse } from "@/lib/api-client";
import { getEnvironmentNames } from "@/lib/environments";
import { formatGraphQLQuery, isValidGraphQL, getGraphQLError } from "@/lib/graphql-formatter";

// Utility: GraphQL Introspection Query
const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      types {
        ...FullType
      }
      directives {
        name
        locations
        args { ...InputValue }
      }
    }
  }
  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args { ...InputValue }
      type { ...TypeRef }
      isDeprecated
      deprecationReason
    }
    inputFields { ...InputValue }
    interfaces { ...TypeRef }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes { ...TypeRef }
  }
  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }
  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
`;

function getTypeName(type: GraphQLFieldType): string {
  // Unwraps nested ofType to get the base type name
  while (type.ofType) type = type.ofType;
  return type.name || "";
}

function isObjectType(type: GraphQLType): boolean {
  return type.kind === "OBJECT" && !!type.fields;
}

function isScalarOrEnum(type: GraphQLType): boolean {
  return type.kind === "SCALAR" || type.kind === "ENUM";
}

function buildQueryFields(type: GraphQLType, types: GraphQLType[], visited: Set<string> = new Set()): string {
  if (!type || !type.fields) return "";
  const typeName = type.name || "";
  if (visited.has(typeName)) return ""; // Avoid cycles
  visited.add(typeName);
  return type.fields
    .map((field: GraphQLField) => {
      const fieldTypeName = getTypeName(field.type);
      const fieldType = getTypeByName(fieldTypeName, types);
      if (fieldType && isObjectType(fieldType) && fieldType.name !== typeName) {
        // Recursively include all subfields
        const subFields = buildQueryFields(fieldType, types, new Set(visited));
        return `${field.name} {\n${subFields}\n}`;
      }
      // For scalars/enums, just include the field name
      return field.name;
    })
    .join("\n");
}

function getTypeByName(name: string, types: GraphQLType[]): GraphQLType | undefined {
  return types.find((t: GraphQLType) => t.name === name);
}

function buildQueryString(queryField: GraphQLField, types: GraphQLType[]): string {
  const args = (queryField.args || []).map((arg: GraphQLArgument) => `${arg.name}: $${arg.name}`).join(", ");
  const type = getTypeByName(getTypeName(queryField.type), types);
  const fields = type ? buildQueryFields(type, types) : "";
  return `query ${queryField.name}(${(queryField.args || []).map((arg: GraphQLArgument) => `$${arg.name}: ${getTypeName(arg.type)}`).join(", ")}) {\n  ${queryField.name}${args ? `(${args})` : ""} {\n    ${fields}\n  }\n}`;
}

function getDefaultArgValue(arg: GraphQLArgument): string | number | boolean {
  if (arg.defaultValue !== null && arg.defaultValue !== undefined) return arg.defaultValue;
  if (arg.type.kind === "NON_NULL") {
    if (arg.type.ofType?.name === "Int") return 0;
    if (arg.type.ofType?.name === "Float") return 0.0;
    if (arg.type.ofType?.name === "Boolean") return false;
    if (arg.type.ofType?.name === "ID" || arg.type.ofType?.name === "String") return "";
  }
  return "";
}

interface QueryState {
  args: Record<string, any>;
  result?: unknown;
  error?: string;
  metrics?: { duration: number; size: number };
}

export default function ComprehensiveTestingPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedEnvironment") || "mis-gql-dev";
    }
    return "mis-gql-dev";
  });
  const apiClient = useApiClient(selectedEnvironment);
  const [schema, setSchema] = useState<GraphQLSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [queryStates, setQueryStates] = useState<Record<string, QueryState>>({});
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);

  // Fetch schema on mount or environment change
  useEffect(() => {
    async function fetchSchema() {
      setLoading(true);
      try {
        const result: GraphQLResponse = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {});
        // The schema is at result.data.__schema
        setSchema((result.data as any)?.__schema || null);
        setLoading(false);
      } catch (e: any) {
        setError(e.message || "Failed to fetch schema");
        setLoading(false);
      }
    }
    fetchSchema();
  }, [apiClient]);

  // Get all top-level queries
  const topLevelQueries: GraphQLField[] = schema?.types.find((t: GraphQLType) => t.name === schema.queryType?.name)?.fields || [];

  // Handle argument input change and persist to localStorage
  const handleArgChange = (queryName: string, argName: string, value: any) => {
    setQueryStates((prev) => {
      const newState = {
        ...prev,
        [queryName]: {
          ...prev[queryName],
          args: { ...prev[queryName]?.args, [argName]: value },
        },
      };
      localStorage.setItem(
        `ctest-args-${queryName}`,
        JSON.stringify(newState[queryName].args)
      );
      return newState;
    });
  };

  // Load persisted args on schema load
  useEffect(() => {
    if (!topLevelQueries.length) return;
    setQueryStates((prev) => {
      const newState = { ...prev };
      topLevelQueries.forEach((q: GraphQLField) => {
        const persisted = localStorage.getItem(`ctest-args-${q.name}`);
        newState[q.name] = {
          ...newState[q.name],
          args: persisted ? JSON.parse(persisted) : Object.fromEntries((q.args || []).map((arg: GraphQLArgument) => [arg.name, getDefaultArgValue(arg)])),
        };
      });
      return newState;
    });
  }, [topLevelQueries.length]);

  // Execute a single query
  const executeQuery = async (queryField: GraphQLField): Promise<void> => {
    const queryName = queryField.name;
    const args = queryStates[queryName]?.args || {};
    const query = buildQueryString(queryField, schema!.types);
    const variables = { ...args };
    const start = performance.now();
    let result: unknown = undefined;
    let errorMsg: string | undefined = undefined;
    try {
      result = await apiClient.executeGraphQLQuery(query, variables);
    } catch (e: any) {
      errorMsg = e.message || "Error executing query";
    }
    const duration = performance.now() - start;
    setQueryStates((prev) => ({
      ...prev,
      [queryName]: {
        ...prev[queryName],
        result,
        error: errorMsg,
        metrics: { duration, size: result ? JSON.stringify(result).length : 0 },
      },
    }));
    // Persist result/metrics
    localStorage.setItem(
      `ctest-metrics-${queryName}`,
      JSON.stringify({ duration, size: result ? JSON.stringify(result).length : 0 })
    );
  };

  // Execute all queries concurrently
  const executeAll = async (): Promise<void> => {
    await Promise.all(topLevelQueries.map(executeQuery));
  };

  // Save selected environment
  useEffect(() => {
    localStorage.setItem("selectedEnvironment", selectedEnvironment);
  }, [selectedEnvironment]);

  // UI
  if (loading) return <div className="p-8 text-center text-lg">Loading schema...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const environmentOptions = getEnvironmentNames();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Comprehensive GraphQL Testing</h1>
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Environment:</label>
        <select
          value={selectedEnvironment}
          onChange={(e) => setSelectedEnvironment(e.target.value)}
          className="border rounded px-2 py-1 text-sm bg-white"
        >
          {environmentOptions.map((env) => (
            <option key={env.key} value={env.key}>
              {env.name}
            </option>
          ))}
        </select>
        <button
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={executeAll}
        >
          Run All Queries
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topLevelQueries.map((query: GraphQLField, idx: number) => {
          const state = queryStates[query.name] || {};
          let queryStr = buildQueryString(query, schema!.types);
          let formattedQuery = "";
          let queryError = null;
          try {
            formattedQuery = formatGraphQLQuery(queryStr);
          } catch (err) {
            queryError = getGraphQLError(queryStr) || (err instanceof Error ? err.message : String(err));
          }
          // PrismJS syntax highlighting for GraphQL
          let highlightedQuery = formattedQuery;
          if (!queryError && Prism) {
            highlightedQuery = Prism.highlight(formattedQuery, Prism.languages.graphql, "graphql");
          }
          // PrismJS syntax highlighting for JSON result
          let highlightedResult = null;
          if (state.result !== undefined && typeof state.result !== "string" && Prism) {
            const jsonStr = JSON.stringify(state.result, null, 2);
            highlightedResult = Prism.highlight(jsonStr, Prism.languages.json, "json");
          }
          return (
            <div key={query.name} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold flex items-center gap-2">
                    {query.name}
                    <span className="ml-2 text-xs text-gray-400 font-normal">{`${idx + 1} of ${topLevelQueries.length}`}</span>
                  </div>
                  <div className="text-gray-500 text-sm">{query.description}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => executeQuery(query)}
                  >
                    Run
                  </button>
                  <button
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    title="Fullscreen view"
                    onClick={() => setFullscreenIdx(idx)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" /></svg>
                  </button>
                </div>
              </div>
              <div className="mt-2">
                {(query.args || []).map((arg: GraphQLArgument) => (
                  <div key={arg.name} className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {arg.name} <span className="text-gray-400">({getTypeName(arg.type)})</span>
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      type="text"
                      value={state.args?.[arg.name] ?? ""}
                      onChange={e => handleArgChange(query.name, arg.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded p-2 text-xs font-mono overflow-x-auto max-h-40 min-h-[60px] border border-gray-200">
                {queryError ? (
                  <span className="text-red-600">Invalid query: {queryError}</span>
                ) : (
                  <pre className="whitespace-pre-wrap" style={{margin:0}}>
                    <code
                      className="language-graphql"
                      dangerouslySetInnerHTML={{ __html: highlightedQuery }}
                    />
                  </pre>
                )}
              </div>
              {state.metrics && (
                <div className="text-xs text-gray-600 mt-1">
                  <span>Time: {state.metrics.duration.toFixed(1)}ms</span> | <span>Size: {state.metrics.size} bytes</span>
                </div>
              )}
              {state.error && (
                <div className="text-xs text-red-600 mt-1">Error: {state.error}</div>
              )}
              {state.result !== undefined && (
                typeof state.result === "string" ? (
                  <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto mt-2 max-h-48">
                    {state.result}
                  </pre>
                ) : (
                  <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto mt-2 max-h-48">
                    <code
                      className="language-json"
                      dangerouslySetInnerHTML={{ __html: highlightedResult || "" }}
                    />
                  </pre>
                )
              )}
            </div>
          );
        })}
      </div>
      {/* Fullscreen Modal */}
      {fullscreenIdx !== null && fullscreenIdx >= 0 && fullscreenIdx < topLevelQueries.length && (() => {
        const query = topLevelQueries[fullscreenIdx];
        const state = queryStates[query.name] || {};
        let queryStr = buildQueryString(query, schema!.types);
        let formattedQuery = "";
        let queryError = null;
        try {
          formattedQuery = formatGraphQLQuery(queryStr);
        } catch (err) {
          queryError = getGraphQLError(queryStr) || (err instanceof Error ? err.message : String(err));
        }
        let highlightedQuery = formattedQuery;
        if (!queryError && Prism) {
          highlightedQuery = Prism.highlight(formattedQuery, Prism.languages.graphql, "graphql");
        }
        let highlightedResult = null;
        if (state.result !== undefined && typeof state.result !== "string" && Prism) {
          const jsonStr = JSON.stringify(state.result, null, 2);
          highlightedResult = Prism.highlight(jsonStr, Prism.languages.json, "json");
        }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto p-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
                onClick={() => setFullscreenIdx(null)}
                title="Close"
              >
                &times;
              </button>
              <div className="mb-4">
                <div className="text-2xl font-bold flex items-center gap-2">
                  {query.name}
                  <span className="ml-2 text-sm text-gray-400 font-normal">{`${fullscreenIdx + 1} of ${topLevelQueries.length}`}</span>
                </div>
                <div className="text-gray-500 text-base">{query.description}</div>
              </div>
              <div className="mb-4">
                <div className="font-semibold mb-1">Query</div>
                <div className="bg-gray-50 rounded p-2 text-sm font-mono overflow-x-auto border border-gray-200">
                  {queryError ? (
                    <span className="text-red-600">Invalid query: {queryError}</span>
                  ) : (
                    <pre className="whitespace-pre-wrap" style={{margin:0}}>
                      <code
                        className="language-graphql"
                        dangerouslySetInnerHTML={{ __html: highlightedQuery }}
                      />
                    </pre>
                  )}
                </div>
              </div>
              {state.metrics && (
                <div className="text-xs text-gray-600 mb-2">
                  <span>Time: {state.metrics.duration.toFixed(1)}ms</span> | <span>Size: {state.metrics.size} bytes</span>
                </div>
              )}
              {state.error && (
                <div className="text-xs text-red-600 mb-2">Error: {state.error}</div>
              )}
              {state.result !== undefined && (
                <div className="mb-2">
                  <div className="font-semibold mb-1">Result</div>
                  {typeof state.result === "string" ? (
                    <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-96">
                      {state.result}
                    </pre>
                  ) : (
                    <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-96">
                      <code
                        className="language-json"
                        dangerouslySetInnerHTML={{ __html: highlightedResult || "" }}
                      />
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
