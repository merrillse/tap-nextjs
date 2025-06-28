import React from 'react';
import { Environment } from '../types/inq';

interface EnvironmentSelectorProps {
  environments: Environment[];
  selectedEnvironment: Environment;
  setSelectedEnvironment: (env: Environment) => void;
  setCurrentPage: (page: number) => void;
  isDemoMode: boolean;
  getClientSecretStatus: () => boolean;
}

const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  environments,
  selectedEnvironment,
  setSelectedEnvironment,
  setCurrentPage,
  isDemoMode,
  getClientSecretStatus,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
    {environments.map((env) => (
      <button
        key={env.name}
        onClick={() => {
          setSelectedEnvironment(env);
          setCurrentPage(1);
        }}
        className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
          selectedEnvironment.name === env.name
            ? 'border-purple-500 bg-purple-50 text-purple-900'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="font-semibold text-lg">{env.name}</div>
        <div className="text-sm text-gray-600 mt-1">{env.description}</div>
        <div className="mt-2">
          {isDemoMode ? (
            <span className="text-blue-600 text-xs">🎭 Demo Mode Active</span>
          ) : getClientSecretStatus() ? (
            <span className="text-green-600 text-xs">✓ Secret configured</span>
          ) : (
            <span className="text-red-600 text-xs">❌ Secret missing</span>
          )}
        </div>
      </button>
    ))}
  </div>
);

export default EnvironmentSelector;
