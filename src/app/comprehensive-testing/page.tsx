"use client";
import "./prism-setup";
import Prism from "prismjs";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { FaChartBar, FaArrowUp } from "react-icons/fa";

// Utility to convert introspection schema to SDL (GraphQL Schema Definition Language)
function introspectionToSDL(schema: GraphQLSchema): string {
  // Only handle types, enums, queries, and mutations for now
  const lines: string[] = [];
  const types = schema.types.filter((t: any) => !t.name.startsWith("__"));
  // Helper to get type string
  function getTypeStr(type: any): string {
    if (type.kind === "NON_NULL" && type.ofType) return getTypeStr(type.ofType) + "!";
    if (type.kind === "LIST" && type.ofType) return `[${getTypeStr(type.ofType)}]`;
    return type.name || "";
  }
  // Enums
  types.filter(t => t.kind === "ENUM").forEach(enumType => {
    lines.push(`enum ${enumType.name} {`);
    (enumType.enumValues || []).forEach((v: any) => {
      lines.push(`  ${v.name}`);
    });
    lines.push("}\n");
  });
  // Input types
  types.filter(t => t.kind === "INPUT_OBJECT").forEach(inputType => {
    lines.push(`input ${inputType.name} {`);
    (inputType.inputFields || []).forEach((f: any) => {
      lines.push(`  ${f.name}: ${getTypeStr(f.type)}`);
    });
    lines.push("}\n");
  });
  // Object types (including Query/Mutation)
  types.filter(t => t.kind === "OBJECT").forEach(objType => {
    lines.push(`type ${objType.name} {`);
    (objType.fields || []).forEach((f: any) => {
      const args = (f.args || []).map((a: any) => `${a.name}: ${getTypeStr(a.type)}`).join(", ");
      lines.push(`  ${f.name}${args ? `(${args})` : ""}: ${getTypeStr(f.type)}`);
    });
    lines.push("}\n");
  });
  // Scalars
  types.filter(t => t.kind === "SCALAR").forEach(scalarType => {
    lines.push(`scalar ${scalarType.name}\n`);
  });
  return lines.join("\n");
}

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
  const fieldStrings: string[] = [];
  for (const field of type.fields) {
    const fieldTypeName = getTypeName(field.type);
    const fieldType = getTypeByName(fieldTypeName, types);
    if (fieldType && isObjectType(fieldType) && fieldType.name !== typeName) {
      // Recursively include all subfields
      const subFields = buildQueryFields(fieldType, types, new Set(visited));
      if (subFields.trim()) {
        fieldStrings.push(`${field.name} {\n${subFields}\n}`);
      }
    } else if (isScalarOrEnum(fieldType || field.type)) {
      // For scalars/enums, just include the field name
      fieldStrings.push(field.name);
    }
  }
  // If no fields were added, add __typename as a fallback
  if (fieldStrings.length === 0) {
    fieldStrings.push("__typename");
  }
  return fieldStrings.join("\n");
}

function getTypeByName(name: string, types: GraphQLType[]): GraphQLType | undefined {
  return types.find((t: GraphQLType) => t.name === name);
}

// Returns the full GraphQL type string, including non-null and list modifiers
function getTypeString(type: GraphQLFieldType): string {
  if (type.kind === "NON_NULL" && type.ofType) {
    return getTypeString(type.ofType) + "!";
  }
  if (type.kind === "LIST" && type.ofType) {
    return `[${getTypeString(type.ofType)}]`;
  }
  return type.name || "";
}

function buildQueryString(queryField: GraphQLField, types: GraphQLType[]): string {
  const args = (queryField.args || []).map((arg: GraphQLArgument) => `${arg.name}: $${arg.name}`).join(", ");
  const type = getTypeByName(getTypeName(queryField.type), types);
  const fields = type ? buildQueryFields(type, types) : "";
  // Use getTypeString for variable definitions
  const varDefs = (queryField.args || []).map((arg: GraphQLArgument) => `$${arg.name}: ${getTypeString(arg.type)}`).join(", ");
  return `query ${queryField.name}(${varDefs}) {\n  ${queryField.name}${args ? `(${args})` : ""} {\n    ${fields}\n  }\n}`;
}

// Remove default value logic from getDefaultArgValue for input fields
function getDefaultArgValue(arg: GraphQLArgument): string | number | boolean {
  if (arg.defaultValue !== null && arg.defaultValue !== undefined) return arg.defaultValue;
  // Only use a default if the schema provides one; otherwise, leave blank for user input
  return "";
}

function getArgExample(arg: GraphQLArgument): string {
  if (arg.type.kind === "NON_NULL" && arg.type.ofType) {
    if (arg.type.ofType.name === "Int") return "e.g. 123";
    if (arg.type.ofType.name === "Float") return "e.g. 3.14";
    if (arg.type.ofType.name === "Boolean") return "e.g. true";
    if (arg.type.ofType.name === "ID") return "e.g. 1234-5678 or SAMPLE_ID";
    if (arg.type.ofType.name === "String") return "e.g. example";
  }
  if (arg.type.name === "Int") return "e.g. 123";
  if (arg.type.name === "Float") return "e.g. 3.14";
  if (arg.type.name === "Boolean") return "e.g. true";
  if (arg.type.name === "ID") return "e.g. 1234-5678 or SAMPLE_ID";
  if (arg.type.name === "String") return "e.g. example";
  return "";
}

interface QueryState {
  args: Record<string, any>;
  result?: unknown;
  error?: string;
  metrics?: { duration: number; size: number };
  loading?: boolean;
}

interface RunHistoryEntry {
  queryName: string;
  duration: number;
  timestamp: number;
  isBatch: boolean;
  environment: string;
  error?: boolean;
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
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("ctest-run-history");
      return persisted ? JSON.parse(persisted) : [];
    }
    return [];
  });
  const [dashboardFullscreen, setDashboardFullscreen] = useState(false);
  const [allLoading, setAllLoading] = useState(false);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [schemaSearch, setSchemaSearch] = useState("");
  const schemaModalRef = useRef<HTMLDivElement>(null);

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

  // Helper to add a run to history (max 10 per query/batch per environment)
  const addRunToHistory = (entry: RunHistoryEntry) => {
    setRunHistory(prev => {
      const filtered = [...prev, entry]
        .filter((e, i, arr) => {
          // Keep only last 10 per queryName+isBatch+environment
          const group = arr.filter(x => x.queryName === e.queryName && x.isBatch === e.isBatch && x.environment === e.environment);
          return group.length <= 10 || group.indexOf(e) >= group.length - 10;
        });
      localStorage.setItem("ctest-run-history", JSON.stringify(filtered));
      return filtered;
    });
  };

  // Execute a single query
  const executeQuery = (queryField: GraphQLField): void => {
    const queryName = queryField.name;
    // Start spinner immediately (synchronously)
    setQueryStates((prev) => ({
      ...prev,
      [queryName]: {
        ...prev[queryName],
        loading: true,
        result: undefined,
        error: undefined,
        metrics: undefined,
      },
    }));
    // Defer heavy work so React can paint the spinner
    setTimeout(async () => {
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
          loading: false,
        },
      }));
      // Persist result/metrics
      localStorage.setItem(
        `ctest-metrics-${queryName}`,
        JSON.stringify({ duration, size: result ? JSON.stringify(result).length : 0 })
      );
      // Add to run history
      addRunToHistory({ queryName, duration, timestamp: Date.now(), isBatch: false, environment: selectedEnvironment, error: !!errorMsg });
    }, 0);
  };

  // Execute all queries concurrently
  const executeAll = async (): Promise<void> => {
    setAllLoading(true);
    await Promise.all(topLevelQueries.map(executeQuery));
    setAllLoading(false);
  };

  // Save selected environment
  useEffect(() => {
    localStorage.setItem("selectedEnvironment", selectedEnvironment);
  }, [selectedEnvironment]);

  // Generate SDL and filter if searching
  let schemaSDL = schema ? introspectionToSDL(schema) : "";
  if (schemaSearch.trim()) {
    const search = schemaSearch.trim().toLowerCase();
    schemaSDL = schemaSDL
      .split(/\n(?=type |enum |input |scalar )/g)
      .filter(block => block.toLowerCase().includes(search))
      .join("\n");
  }
  // Prism highlight
  const highlightedSDL = Prism.highlight(schemaSDL, Prism.languages.graphql, "graphql");

  // UI
  if (loading) return <div className="p-8 text-center text-lg">Loading schema...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const environmentOptions = getEnvironmentNames();

  // Dashboard rendering
  const envRunHistory = runHistory.filter(e => e.environment === selectedEnvironment);
  const batchRuns = envRunHistory.filter(e => e.isBatch);
  const perQueryRuns: Record<string, RunHistoryEntry[]> = {};
  envRunHistory.forEach(e => {
    if (!e.isBatch) {
      if (!perQueryRuns[e.queryName]) perQueryRuns[e.queryName] = [];
      perQueryRuns[e.queryName].push(e);
    }
  });

  // Summary statistics helpers
  function getStats(entries: RunHistoryEntry[]) {
    if (!entries.length) return { avg: 0, min: 0, max: 0, median: 0, count: 0, success: 0, errors: 0 };
    const times = entries.map(e => e.duration).sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = times[0];
    const max = times[times.length - 1];
    const median = times.length % 2 === 0 ? (times[times.length/2-1] + times[times.length/2])/2 : times[Math.floor(times.length/2)];
    const errors = entries.filter(e => e.error).length;
    const success = entries.length - errors;
    return { avg, min, max, median, count: entries.length, success, errors };
  }

  // Reset analytics
  const resetAnalytics = () => {
    setRunHistory([]);
    localStorage.removeItem("ctest-run-history");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Comprehensive GraphQL Testing</h1>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
          onClick={() => setSchemaModalOpen(true)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2M7 17v-2a6 6 0 016-6h2a6 6 0 016 6v2" /></svg>
          View Schema
        </button>
      </div>
      {/* Schema Modal */}
      {schemaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div ref={schemaModalRef} className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
              onClick={() => setSchemaModalOpen(false)}
              title="Close"
            >
              &times;
            </button>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder="Search types, fields, enums..."
                value={schemaSearch}
                onChange={e => setSchemaSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="bg-gray-50 rounded p-4 text-sm font-mono overflow-x-auto border border-gray-200 max-h-[70vh]">
              <pre className="whitespace-pre-wrap" style={{margin:0}}>
                <code
                  className="language-graphql"
                  dangerouslySetInnerHTML={{ __html: highlightedSDL }}
                />
              </pre>
            </div>
          </div>
        </div>
      )}
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
          className={`ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 ${allLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={executeAll}
          disabled={allLoading}
        >
          {allLoading && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
          )}
          Run All Queries
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
          // --- Add scroll-to-dashboard icon ---
          const scrollToDashboard = () => {
            const el = document.getElementById(`dashboard-${query.name}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          };
          return (
            <div key={query.name} id={`card-${query.name}`} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold flex items-center gap-2">
                    {query.name}
                    <span className="ml-2 text-xs text-gray-400 font-normal">{`${idx + 1} of ${topLevelQueries.length}`}</span>
                  </div>
                  <div className="text-gray-500 text-sm">{query.description}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 ${state.loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => executeQuery(query)}
                    disabled={!!state.loading}
                  >
                    {state.loading && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    )}
                    Run
                  </button>
                  <button
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    title="Fullscreen view"
                    onClick={() => setFullscreenIdx(idx)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" /></svg>
                  </button>
                  <button
                    className="ml-1 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500"
                    style={{ fontSize: 16 }}
                    title="Scroll to analytics for this query"
                    onClick={scrollToDashboard}
                  >
                    <FaChartBar />
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
                      placeholder={getArgExample(arg)}
                      onChange={e => handleArgChange(query.name, arg.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded p-2 text-xs font-mono overflow-x-auto max-h-40 min-h-[60px] border border-gray-200">
                {queryError && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-300 text-red-700 rounded">
                    <b>Invalid query:</b> {queryError}
                  </div>
                )}
                <pre className="whitespace-pre-wrap" style={{margin:0}}>
                  <code
                    className="language-graphql"
                    dangerouslySetInnerHTML={{ __html: highlightedQuery }}
                  />
                </pre>
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
      {/* Dashboard moved below queries */}
      <div className="bg-white rounded-xl shadow p-4 mb-8 border border-gray-200 w-full max-w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold">Analytics Dashboard</div>
          <div className="flex gap-2">
            <select
              value={selectedEnvironment}
              onChange={e => setSelectedEnvironment(e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-white"
            >
              {getEnvironmentNames().map((env) => (
                <option key={env.key} value={env.key}>{env.name}</option>
              ))}
            </select>
            <button
              className="p-2 rounded hover:bg-red-100 text-red-600 border border-red-200 ml-2"
              title="Reset Analytics"
              onClick={resetAnalytics}
            >
              Reset
            </button>
          </div>
        </div>
        <div className="mb-6">
          <div className="font-semibold mb-2">All Queries (Batch Runs)</div>
          <div className="flex flex-wrap gap-6 items-end">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={batchRuns} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} tickFormatter={t => {
                  const d = new Date(t);
                  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
                }} />
                <YAxis dataKey="duration" unit="ms" tick={{ fontSize: 10 }} />
                <Tooltip labelFormatter={t => {
                  const d = new Date(t);
                  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
                }} />
                <Legend />
                <Line type="monotone" dataKey="duration" name="Batch Duration" stroke="#2563eb" dot />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs bg-gray-50 rounded p-3 border border-gray-200 min-w-[180px]">
              {(() => { const s = getStats(batchRuns); return (
                <>
                  <div><b>Runs:</b> {s.count}</div>
                  <div><b>Avg:</b> {s.avg.toFixed(1)}ms</div>
                  <div><b>Min:</b> {s.min.toFixed(1)}ms</div>
                  <div><b>Max:</b> {s.max.toFixed(1)}ms</div>
                  <div><b>Median:</b> {s.median.toFixed(1)}ms</div>
                  <div><b>Success:</b> {s.success}</div>
                  <div><b>Errors:</b> {s.errors}</div>
                </>
              ); })()}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topLevelQueries.map((query) => (
            <div key={query.name} id={`dashboard-${query.name}`} className="mb-4 relative">
              <div className="font-semibold mb-2 flex items-center gap-2">
                {query.name} (Last 10 Runs)
                <button
                  className="ml-1 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500"
                  style={{ fontSize: 14 }}
                  title="Scroll to query card"
                  onClick={() => {
                    const el = document.getElementById(`card-${query.name}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <FaArrowUp />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={perQueryRuns[query.name] || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} tickFormatter={t => {
                      const d = new Date(t);
                      return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
                    }} />
                    <YAxis dataKey="duration" unit="ms" tick={{ fontSize: 10 }} />
                    <Tooltip labelFormatter={t => {
                      const d = new Date(t);
                      return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
                    }} />
                    <Legend />
                    <Line type="monotone" dataKey="duration" name="Duration" stroke="#10b981" dot />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs bg-gray-50 rounded p-3 border border-gray-200 min-w-[140px]">
                  {(() => { const s = getStats(perQueryRuns[query.name] || []); return (
                    <>
                      <div><b>Runs:</b> {s.count}</div>
                      <div><b>Avg:</b> {s.avg.toFixed(1)}ms</div>
                      <div><b>Min:</b> {s.min.toFixed(1)}ms</div>
                      <div><b>Max:</b> {s.max.toFixed(1)}ms</div>
                      <div><b>Median:</b> {s.median.toFixed(1)}ms</div>
                      <div><b>Success:</b> {s.success}</div>
                      <div><b>Errors:</b> {s.errors}</div>
                    </>
                  ); })()}
                </div>
              </div>
            </div>
          ))}
        </div>
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
