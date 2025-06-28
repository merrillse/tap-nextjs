import React from 'react';

interface ErrorDisplayProps {
  error: string;
  getClientSecretStatus: () => boolean;
  isDemoMode: boolean;
  selectedEnvironment: { envVarSuffix: string };
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  getClientSecretStatus,
  isDemoMode,
  selectedEnvironment,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <div className="flex items-center gap-2 text-red-800 mb-2">
      <span className="text-lg">❌</span>
      <span className="font-semibold">Query Error</span>
    </div>
    <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
    {!getClientSecretStatus() && !isDemoMode && (
      <div className="mt-3 p-4 bg-yellow-100 border border-yellow-300 rounded">
        <div className="text-yellow-800 text-sm">
          <strong>Real Mode Setup Required:</strong>
          <br />
          1. Set environment variable: <code className="bg-yellow-200 px-1 rounded">INQ_CLIENT_SECRET_{selectedEnvironment.envVarSuffix}</code>
          <br />
          2. Restart the development server: <code className="bg-yellow-200 px-1 rounded">npm run dev</code>
          <br />
          3. Or switch to <strong>Demo Mode</strong> to test pagination with mock data
          <br />
          <br />
          📖 <strong>Full setup instructions:</strong> See <code>INQ_INTEGRATION.md</code> in the project root
        </div>
      </div>
    )}
  </div>
);

export default ErrorDisplay;
