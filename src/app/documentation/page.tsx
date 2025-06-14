'use client';

import { useState } from 'react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: '📖' },
    { id: 'environments', title: 'Environments', icon: '🌐' },
    { id: 'authentication', title: 'Authentication', icon: '🔐' },
    { id: 'schemas', title: 'Schema Containers', icon: '📋' },
    { id: 'clients', title: 'Authorized Clients', icon: '👥' },
    { id: 'development', title: 'Development', icon: '🛠️' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-2 text-lg text-gray-600">
            MIS GraphQL Integration Guide
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contents</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>{section.icon}</span>
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {activeSection === 'overview' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                  <p className="text-gray-600 mb-6">
                    This application integrates with MIS (Missionary Information System) GraphQL APIs 
                    across multiple environments using secure OAuth 2.0 authentication.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Multi-environment support (Development, Staging, Production)</li>
                    <li>Secure OAuth 2.0 client credentials flow</li>
                    <li>Server-side authentication and API proxying</li>
                    <li>Real-time environment switching</li>
                    <li>Built-in testing and debugging tools</li>
                    <li>Comprehensive missionary data search</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Architecture</h3>
                  <p className="text-gray-600">
                    The application uses Next.js 13+ App Router with server-side API routes to handle 
                    authentication and proxy requests to MIS GraphQL endpoints. This ensures that 
                    client secrets remain secure and CORS issues are avoided.
                  </p>
                </div>
              )}

              {activeSection === 'environments' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Environment Configuration</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">🟢 Development</h3>
                      <p className="text-sm text-green-600 mb-2">mis-gql-dev.churchofjesuschrist.org</p>
                      <p className="text-xs text-green-600">Full access for testing and development</p>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">🟡 Staging</h3>
                      <p className="text-sm text-yellow-600 mb-2">mis-gql-stage.churchofjesuschrist.org</p>
                      <p className="text-xs text-yellow-600">Pre-production testing environment</p>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">🔴 Production</h3>
                      <p className="text-sm text-red-600 mb-2">mis-gql.churchofjesuschrist.org</p>
                      <p className="text-xs text-red-600">Live production environment</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Environment Variables</h3>
                  <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                    <div className="text-gray-600">
                      MIS_GQL_DEV_CLIENT_SECRET=your_dev_secret<br/>
                      MIS_GQL_STAGE_CLIENT_SECRET=your_stage_secret<br/>
                      MIS_GQL_PROD_CLIENT_SECRET=your_prod_secret
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'authentication' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">OAuth 2.0 Authentication</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Client Credentials Flow</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <ol className="list-decimal list-inside space-y-3 text-gray-700">
                      <li>Application requests OAuth token from Okta</li>
                      <li>Okta validates client credentials and returns JWT token</li>
                      <li>Application uses token in Authorization header for GraphQL requests</li>
                      <li>MIS GraphQL validates token and processes request</li>
                    </ol>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Required Scopes</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">BASIC</span>
                      <div>
                        <code className="text-sm font-mono text-gray-700">mis:missionary:read</code>
                        <p className="text-sm text-gray-600">Read missionary basic information</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">BASIC</span>
                      <div>
                        <code className="text-sm font-mono text-gray-700">mis:area:read</code>
                        <p className="text-sm text-gray-600">Read area and geographic data</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">OPTIONAL</span>
                      <div>
                        <code className="text-sm font-mono text-gray-700">mis:leadership:read</code>
                        <p className="text-sm text-gray-600">Leadership hierarchy access</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">RESTRICTED</span>
                      <div>
                        <code className="text-sm font-mono text-gray-700">mis:health:read</code>
                        <p className="text-sm text-gray-600">Health and medical data (requires approval)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'schemas' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Schema Containers</h2>
                  
                  <p className="text-gray-600 mb-6">
                    Each clientId allowed by the system should have its own containing folder, named for the client. 
                    The folder should contain the schema files with the appropriate types and fields. 
                    The startup folder must have a type defined for each type that appears as a parent to any other type.
                  </p>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-amber-800 mb-2">📁 Schema Organization</h4>
                    <p className="text-sm text-amber-700">
                      For example, 'Missionary' is a parent type for Assignment, so it must exist in the schema setup.
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Container Types</h3>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">📋 Core Container</h4>
                      <p className="text-sm text-gray-600">Basic missionary data, areas, missions</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">👔 Leadership Container</h4>
                      <p className="text-sm text-gray-600">Hierarchical leadership structures</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">📍 Assignment Container</h4>
                      <p className="text-sm text-gray-600">Mission assignments, transfers, calls</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">🏥 Health Container</h4>
                      <p className="text-sm text-gray-600">Medical records, health tracking</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">🎓 Training Container</h4>
                      <p className="text-sm text-gray-600">MTC and field training data</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-blue-800 mb-2">🔧 Special Schemas</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li><strong>PRIMARY:</strong> Complete set of all schema elements (reference only)</li>
                      <li><strong>STARTUP:</strong> Minimal schema used only by GraphQL service on startup</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'clients' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Authorized Clients</h2>
                  
                  <p className="text-gray-600 mb-6">
                    For a customer/team/service to access the Missionary Graph Service, their associated 
                    Okta Client must be authorized to call us. We work closely with the Identity Team 
                    to secure access to those teams requiring access to Missionary Data.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Development Environment</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-700 mb-3">
                      <strong>Okta Dev Tenant URL:</strong> https://dev-73389086-admin.okta.com/
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-green-200">
                            <th className="text-left py-2 font-medium text-green-800">Client Name</th>
                            <th className="text-left py-2 font-medium text-green-800">Client ID</th>
                          </tr>
                        </thead>
                        <tbody className="text-green-700">
                          <tr className="border-b border-green-100">
                            <td className="py-2">DevTenant_1</td>
                            <td className="py-2 font-mono">0oa5uce4xpm2l7K8G5d7</td>
                          </tr>
                          <tr className="border-b border-green-100">
                            <td className="py-2">DevTenant_2</td>
                            <td className="py-2 font-mono">0oa66op0c0CAfpAkx5d7</td>
                          </tr>
                          <tr className="border-b border-green-100">
                            <td className="py-2">DevTenant_3</td>
                            <td className="py-2 font-mono">0oa66y9qcyq3WE1NY5d7</td>
                          </tr>
                          <tr>
                            <td className="py-2">Automated Testing</td>
                            <td className="py-2 font-mono">0oa82h6j45rN8G1he5d7</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Production Environment</h3>
                  <p className="text-gray-600 mb-4">
                    STAGE and PROD both use the Production Okta environment within the ICS organization. 
                    All configurations are maintained by the Identity Team through our Missionary Auth Server.
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-red-200">
                            <th className="text-left py-2 font-medium text-red-800">Service</th>
                            <th className="text-left py-2 font-medium text-red-800">Client ID</th>
                          </tr>
                        </thead>
                        <tbody className="text-red-700">
                          <tr className="border-b border-red-100">
                            <td className="py-1">Missionary Graph Service Team</td>
                            <td className="py-1 font-mono">0oak0jqakvevwjWrp357</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="py-1">Member Tools</td>
                            <td className="py-1 font-mono">0oakhtcbhyLVVeYFj357</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="py-1">Ward Directory & Map</td>
                            <td className="py-1 font-mono">0oamyits9uliqoOn7357</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="py-1">CMIS Services Team</td>
                            <td className="py-1 font-mono">0oan0z1efagK9cXWu357</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="py-1">MTC Tech [PROD]</td>
                            <td className="py-1 font-mono">0oan0z9i7ax38R7Tx357</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="py-1">Missionary Portal [PROD]</td>
                            <td className="py-1 font-mono">0oa1gg90u4erOhnH2358</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="py-1">Missionary Connect [PROD]</td>
                            <td className="py-1 font-mono">0oap88ozbhEr8UKIQ357</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-xs text-red-600" colSpan={2}>
                              <em>...and many more production clients</em>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">🔒 Access Control</h4>
                    <p className="text-sm text-blue-700">
                      All new clients must be added to our default access policy under a specific scope. 
                      Additional filtering and masking of data will be applied based on the client's DSA (Data Sharing Agreement).
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'development' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Development Guide</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Setup</h3>
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <pre className="text-sm text-gray-700">
{`# Clone and setup
git clone <repository>
cd tap-nextjs

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your secrets

# Start development server
npm run dev`}
                    </pre>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Project Structure</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <pre className="text-sm text-gray-700">
{`src/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # Server-side API routes
│   │   ├── oauth/         # OAuth token management
│   │   ├── graphql/       # GraphQL proxy
│   │   └── health/        # Health checks
│   ├── missionaries/      # Search pages
│   ├── api-testing/       # Testing interface
│   ├── debug/            # Debug tools
│   └── settings/         # Configuration
├── components/           # React components
│   ├── Navigation.tsx    # Main navigation
│   └── EnvironmentIndicator.tsx
└── lib/                  # Utilities
    ├── environments.ts   # Environment configs
    └── api-client.ts     # API client`}
                    </pre>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">API Routes</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">GET</span>
                      <code className="text-sm font-mono">/api/oauth/token</code>
                      <span className="text-sm text-gray-600">OAuth token acquisition</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">POST</span>
                      <code className="text-sm font-mono">/api/graphql/proxy</code>
                      <span className="text-sm text-gray-600">GraphQL query proxy</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">GET</span>
                      <code className="text-sm font-mono">/api/health/check</code>
                      <span className="text-sm text-gray-600">Environment health</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'troubleshooting' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
                  
                  <div className="space-y-6">
                    <div className="border border-red-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">🚫 OAuth Authentication Failures</h3>
                      <div className="text-sm text-red-700 space-y-2">
                        <p><strong>Check:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Client secrets in <code>.env.local</code></li>
                          <li>Okta client configuration</li>
                          <li>Token expiration (use Debug page)</li>
                          <li>Network connectivity to Okta</li>
                        </ul>
                        <p><strong>Tools:</strong> Visit <code>/debug</code> to inspect tokens</p>
                      </div>
                    </div>

                    <div className="border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ GraphQL Query Errors</h3>
                      <div className="text-sm text-yellow-700 space-y-2">
                        <p><strong>Check:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Client has required scopes</li>
                          <li>Schema container access permissions</li>
                          <li>Query syntax and field availability</li>
                          <li>Rate limiting (429 errors)</li>
                        </ul>
                        <p><strong>Tools:</strong> Use <code>/api-testing</code> to test queries</p>
                      </div>
                    </div>

                    <div className="border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">🌐 Environment Connection Issues</h3>
                      <div className="text-sm text-blue-700 space-y-2">
                        <p><strong>Check:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Network connectivity to MIS endpoints</li>
                          <li>Environment URLs in <code>environments.ts</code></li>
                          <li>DNS resolution</li>
                          <li>Corporate firewall/proxy settings</li>
                        </ul>
                        <p><strong>Tools:</strong> Environment indicator shows health status</p>
                      </div>
                    </div>

                    <div className="border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">🛠️ Debug Tools</h3>
                      <div className="text-sm text-green-700 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><strong>OAuth Debug:</strong> <code>/debug</code></p>
                            <p className="text-xs">Inspect tokens, test authentication</p>
                          </div>
                          <div>
                            <p><strong>API Testing:</strong> <code>/api-testing</code></p>
                            <p className="text-xs">Test GraphQL queries, view responses</p>
                          </div>
                          <div>
                            <p><strong>Health Check:</strong> Navigation indicator</p>
                            <p className="text-xs">Monitor environment status</p>
                          </div>
                          <div>
                            <p><strong>Browser DevTools:</strong> Network tab</p>
                            <p className="text-xs">Inspect API calls and responses</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
