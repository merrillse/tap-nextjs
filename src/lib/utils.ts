// Utility function to safely stringify unknown data for display
export function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

// Type guard to check if data is serializable
export function isSerializable(data: unknown): data is Record<string, unknown> | unknown[] | string | number | boolean | null {
  if (data === null || typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return true;
  }
  
  if (Array.isArray(data)) {
    return data.every(isSerializable);
  }
  
  if (typeof data === 'object') {
    return Object.values(data as Record<string, unknown>).every(isSerializable);
  }
  
  return false;
}
