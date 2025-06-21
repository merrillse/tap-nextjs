'use client';

import { useState } from 'react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: '📖' },
    { id: 'system-introduction', title: 'System Introduction', icon: '🌟' },
    { id: 'environments', title: 'Environments', icon: '🌐' },
    { id: 'authentication', title: 'Authentication', icon: '🔐' },
    { id: 'api-testing', title: 'API Testing Tools', icon: '🧪' },
    { id: 'schema-browser', title: 'MGQL Schema Browser', icon: '🔍' },
    { id: 'mogs-queries', title: 'MOGS Query Pages', icon: '🏛️' },
    { id: 'organizational-search', title: 'Organizational Search Tools', icon: '🏢' },
    { id: 'local-storage', title: 'Local Storage Manager', icon: '💾' },
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
                    and MOGS (Missionary Oracle Graph Service) across multiple environments using secure OAuth 2.0 authentication.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Multi-environment support (Development, Staging, Production)</li>
                    <li>Secure OAuth 2.0 client credentials flow</li>
                    <li>Server-side authentication and API proxying</li>
                    <li>Real-time environment switching</li>
                    <li>Built-in testing and debugging tools</li>
                    <li>Comprehensive missionary data search</li>
                    <li>Direct MOGS schema query interfaces</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Architecture</h3>
                  <p className="text-gray-600">
                    The application uses Next.js 13+ App Router with server-side API routes to handle 
                    authentication and proxy requests to MIS GraphQL and MOGS endpoints. This ensures that 
                    client secrets remain secure and CORS issues are avoided. The MOGS integration provides 
                    direct access to missionary assignment data, training curricula, and organizational structures.
                  </p>
                </div>
              )}

              {activeSection === 'system-introduction' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Understanding the TAP System: MGQL and MOGS</h2>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">🌟 Welcome to the Technical Access Portal (TAP)</h3>
                    <p className="text-blue-800 leading-relaxed">
                      This system serves as your gateway to The Church of Jesus Christ of Latter-day Saints' missionary 
                      management infrastructure. Whether you're a developer, system administrator, or data analyst, this guide 
                      will help you understand how TAP integrates with two critical backend systems: <strong>MGQL</strong> (Missionary 
                      GraphQL) and <strong>MOGS</strong> (Missionary Oracle Graph Service).
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🏗️ System Architecture Overview</h3>
                  <p className="text-gray-700 mb-6">
                    The missionary management ecosystem consists of multiple interconnected systems that handle everything from 
                    missionary applications and training to field assignments and reporting. TAP acts as a unified interface 
                    that allows authorized users to access and interact with this data through modern web technologies.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-emerald-900 mb-3">📊 MGQL: Missionary GraphQL Service</h4>
                      <p className="text-emerald-800 mb-4">
                        MGQL is the primary GraphQL interface for missionary information system data. Think of it as the 
                        "front door" to missionary-related information across the Church's systems.
                      </p>
                      <div className="text-sm text-emerald-700">
                        <strong>What MGQL Provides:</strong>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Missionary assignment and location data</li>
                          <li>Leadership and organizational hierarchy</li>
                          <li>Mission boundary and geographic information</li>
                          <li>Real-time missionary status and movements</li>
                          <li>Training and curriculum assignment data</li>
                          <li>Unit and ecclesiastical organization details</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-purple-900 mb-3">🏛️ MOGS: Missionary Oracle Graph Service</h4>
                      <p className="text-purple-800 mb-4">
                        MOGS provides deep access to the core missionary management database, offering detailed historical 
                        data and complex relationship queries that power mission administration.
                      </p>
                      <div className="text-sm text-purple-700">
                        <strong>What MOGS Provides:</strong>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Individual missionary profiles and histories</li>
                          <li>Assignment components and requirements</li>
                          <li>Training curricula and MyPlan integration</li>
                          <li>Enabled member processing workflows</li>
                          <li>Leader assignments and attachments</li>
                          <li>Complex data relationships and analytics</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🔄 Data Flow and Integration</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                    <p className="text-gray-700 mb-4">
                      Understanding how data flows through these systems is crucial for effective development and troubleshooting:
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                        <div>
                          <h5 className="font-semibold text-gray-900">User Authentication</h5>
                          <p className="text-gray-600 text-sm">TAP authenticates users via OAuth 2.0, obtaining access tokens for API calls</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                        <div>
                          <h5 className="font-semibold text-gray-900">Query Processing</h5>
                          <p className="text-gray-600 text-sm">GraphQL queries are validated, optimized, and routed to appropriate backend services</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                        <div>
                          <h5 className="font-semibold text-gray-900">Data Retrieval</h5>
                          <p className="text-gray-600 text-sm">Backend services query databases, apply business logic, and return structured data</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                        <div>
                          <h5 className="font-semibold text-gray-900">Response Formatting</h5>
                          <p className="text-gray-600 text-sm">TAP formats and presents data in user-friendly interfaces with export capabilities</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Key Concepts for Developers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                      <h4 className="font-semibold text-blue-900 mb-3">🔗 GraphQL Schemas</h4>
                      <p className="text-blue-800 text-sm mb-3">
                        Both MGQL and MOGS expose their data through GraphQL schemas - strongly-typed contracts that define 
                        available queries, mutations, and data structures.
                      </p>
                      <div className="text-xs text-blue-700">
                        <strong>Why GraphQL?</strong>
                        <ul className="mt-1 space-y-1">
                          <li>• Precise data fetching (request only what you need)</li>
                          <li>• Strong typing and validation</li>
                          <li>• Single endpoint for multiple data sources</li>
                          <li>• Built-in documentation and introspection</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                      <h4 className="font-semibold text-green-900 mb-3">🔐 Security & Access Control</h4>
                      <p className="text-green-800 text-sm mb-3">
                        Access to missionary data is strictly controlled through multiple layers of authentication and 
                        authorization to protect sensitive personal information.
                      </p>
                      <div className="text-xs text-green-700">
                        <strong>Security Features:</strong>
                        <ul className="mt-1 space-y-1">
                          <li>• OAuth 2.0 client credentials flow</li>
                          <li>• Environment-specific access tokens</li>
                          <li>• Server-side API proxying</li>
                          <li>• Audit logging and monitoring</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Common Data Entities</h3>
                  <p className="text-gray-700 mb-4">
                    Understanding the core data entities will help you navigate the system more effectively:
                  </p>
                  <div className="overflow-x-auto mb-8">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Identifiers</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary System</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Missionary</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Individual serving a mission</td>
                          <td className="px-4 py-3 text-sm text-gray-600">legacy_miss_id, cmis_id, lds_account_id</td>
                          <td className="px-4 py-3 text-sm text-gray-600">MOGS</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Assignment</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Missionary's current or historical assignment</td>
                          <td className="px-4 py-3 text-sm text-gray-600">assignment_id, component_id</td>
                          <td className="px-4 py-3 text-sm text-gray-600">MOGS</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Mission</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Geographic and administrative mission unit</td>
                          <td className="px-4 py-3 text-sm text-gray-600">mission_id, unit_number</td>
                          <td className="px-4 py-3 text-sm text-gray-600">MGQL</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Leader</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Mission leadership (presidents, assistants, etc.)</td>
                          <td className="px-4 py-3 text-sm text-gray-600">leader_id, cmis_id</td>
                          <td className="px-4 py-3 text-sm text-gray-600">MOGS</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Curriculum</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Training programs and courses</td>
                          <td className="px-4 py-3 text-sm text-gray-600">curriculum_id, course_code</td>
                          <td className="px-4 py-3 text-sm text-gray-600">MOGS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🚀 Getting Started as a Developer</h3>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
                    <p className="text-indigo-800 mb-4">
                      Ready to start working with the TAP system? Here's your roadmap:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                        <span className="text-indigo-700"><strong>Explore the Schema Browser:</strong> Understand available queries and data structures</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                        <span className="text-indigo-700"><strong>Try the MOGS Pages:</strong> See real queries in action with sample data</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                        <span className="text-indigo-700"><strong>Use API Testing Tools:</strong> Experiment with custom queries and mutations</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                        <span className="text-indigo-700"><strong>Review Authentication:</strong> Understand security patterns and token management</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">5</div>
                        <span className="text-indigo-700"><strong>Study the Code:</strong> Examine page implementations to understand patterns</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">💡 Best Practices & Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">🎯 Query Optimization</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• Only request fields you actually need</li>
                        <li>• Use fragments for reusable query parts</li>
                        <li>• Understand pagination for large datasets</li>
                        <li>• Test queries in different environments</li>
                        <li>• Monitor query performance and complexity</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">🔒 Data Security</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• Never expose sensitive data in logs</li>
                        <li>• Always validate input parameters</li>
                        <li>• Use appropriate environment for testing</li>
                        <li>• Follow principle of least privilege</li>
                        <li>• Keep authentication tokens secure</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <h4 className="font-semibold text-amber-800 mb-3">⚠️ Important Considerations</h4>
                    <ul className="text-sm text-amber-700 space-y-2">
                      <li>• <strong>Data Sensitivity:</strong> All missionary data is confidential and should be handled with appropriate care</li>
                      <li>• <strong>Environment Awareness:</strong> Always verify you're working in the correct environment (dev/staging/prod)</li>
                      <li>• <strong>Rate Limiting:</strong> Be mindful of API rate limits and implement appropriate retry logic</li>
                      <li>• <strong>Error Handling:</strong> Always implement comprehensive error handling for production systems</li>
                      <li>• <strong>Documentation:</strong> Keep your custom queries and integrations well-documented for team collaboration</li>
                    </ul>
                  </div>
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

              {activeSection === 'api-testing' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 API Testing Tools</h2>
                  
                  <p className="text-gray-600 mb-6">
                    The TAP platform provides a comprehensive suite of tools for testing and working with GraphQL APIs. 
                    These tools help developers explore, test, and debug GraphQL queries with professional-grade features.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🎲 Random Query Generator</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      Automatically generates valid GraphQL queries using schema introspection. Perfect for API exploration and testing.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      <li><strong>Smart Generation:</strong> Creates realistic queries with proper variables and arguments</li>
                      <li><strong>Schema-Aware:</strong> Uses introspected schema to ensure validity</li>
                      <li><strong>Configurable Depth:</strong> Controls query complexity to prevent overwhelming results</li>
                      <li><strong>Variable Creation:</strong> Automatically generates variables with appropriate default values</li>
                    </ul>
                    <div className="mt-4 p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-gray-900">Example Generated Query:</p>
                      <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
{`query GetMissionary($missionary_id: ID = "916793") {
  missionary(missionaryId: $missionary_id) {
    latinFirstName
    latinLastName
    assignments {
      mission {
        name
      }
    }
  }
}`}
                      </pre>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ GraphQL Query Formatter</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      Professional-grade GraphQL query formatting using the official GraphQL library. 
                      Transform messy, hand-written queries into clean, readable code with a single click.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      <li><strong>One-Click Formatting:</strong> Instant query beautification with the ⚡ format button</li>
                      <li><strong>Standard Compliant:</strong> Uses GraphQL's official AST-based formatting</li>
                      <li><strong>Syntax Validation:</strong> Validates query structure before formatting</li>
                      <li><strong>Error Safe:</strong> Preserves original query if syntax errors are found</li>
                      <li><strong>Professional Output:</strong> Consistent indentation, spacing, and line breaks</li>
                    </ul>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-900 mb-2">Before Formatting:</p>
                        <pre className="text-xs text-red-700 overflow-x-auto">
{`query{missionary(missionaryId:"123"){
latinFirstName,latinLastName,
assignments{mission{name}}}}`}
                        </pre>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-sm font-medium text-green-900 mb-2">After Formatting:</p>
                        <pre className="text-xs text-green-700 overflow-x-auto">
{`query {
  missionary(missionaryId: "123") {
    latinFirstName
    latinLastName
    assignments {
      mission {
        name
      }
    }
  }
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white rounded border">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">🎯 Perfect for:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>Copy-Paste Cleanup:</strong> Fix messy queries from external sources</li>
                        <li>• <strong>Demo Preparation:</strong> Create professional-looking queries for presentations</li>
                        <li>• <strong>Code Reviews:</strong> Ensure consistent formatting standards</li>
                        <li>• <strong>Development:</strong> Quick cleanup during testing and debugging</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">📚 Query Library</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      Save, organize, and reuse GraphQL queries with a comprehensive library system. 
                      Build a collection of queries for testing, demos, and development workflows.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      <li><strong>Smart Storage:</strong> Automatically extracts variables and metadata</li>
                      <li><strong>Environment Tracking:</strong> Associates queries with specific environments</li>
                      <li><strong>Search & Filter:</strong> Find queries by name, description, or content</li>
                      <li><strong>Instant Execution:</strong> Load and run queries with one click</li>
                      <li><strong>Export/Import:</strong> Share query collections with team members</li>
                      <li><strong>Tags & Organization:</strong> Categorize queries for easy management</li>
                    </ul>
                    
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">🎪 Key Features:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="font-medium text-gray-900">💾 Save Queries</p>
                          <p className="text-gray-600">Name, description, tags</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="font-medium text-gray-900">📚 Browse Library</p>
                          <p className="text-gray-600">Search and filter queries</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="font-medium text-gray-900">▶️ Instant Run</p>
                          <p className="text-gray-600">Execute with one click</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🎯 Schema-Aware Autocomplete</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      Intelligent code completion powered by live schema introspection. Get real-time suggestions for types, 
                      fields, enums, and arguments as you write GraphQL queries.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      <li><strong>Live Schema Integration:</strong> Automatically loads schema for intelligent completions</li>
                      <li><strong>Type-Aware Suggestions:</strong> Context-sensitive completions based on GraphQL types</li>
                      <li><strong>Field Discovery:</strong> Explore available fields without leaving the editor</li>
                      <li><strong>Enum Values:</strong> See all possible values for enumeration fields</li>
                      <li><strong>Argument Hints:</strong> Required and optional arguments with proper typing</li>
                      <li><strong>Syntax Validation:</strong> Real-time error highlighting and validation</li>
                    </ul>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded border">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">⌨️ Keyboard Shortcuts</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trigger autocomplete:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+Space</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Navigate down:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-green-700">Ctrl+N</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Navigate up:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-green-700">Ctrl+P</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accept suggestion:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Tab</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Close autocomplete:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Esc</code>
                          </div>
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <p className="text-green-800 font-medium mb-1">✅ Authentic Emacs Experience:</p>
                            <p className="text-green-700">
                              <code className="bg-green-100 px-1 rounded">Ctrl+N</code> (next) and <code className="bg-green-100 px-1 rounded">Ctrl+P</code> (previous) 
                              provide the true Emacs-style navigation experience you expect!
                            </p>
                          </div>
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <p className="text-blue-800 font-medium mb-1">🎯 Alternative Options:</p>
                            <p className="text-blue-700">
                              <code className="bg-blue-100 px-1 rounded">Ctrl+J/K</code> (vim-style), 
                              <code className="bg-blue-100 px-1 rounded">Alt+N/P</code>, and 
                              <code className="bg-blue-100 px-1 rounded">Ctrl+↓/↑</code> also work perfectly.
                            </p>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Mac users: Use Cmd instead of Ctrl</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded border">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">🚦 Status Indicators</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600">Schema Loaded - Full autocomplete</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-gray-600">Schema loading - Syntax only</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-gray-600">Schema error - Limited features</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white rounded border">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">� What You Can Autocomplete:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="p-2 bg-gray-50 rounded text-center">
                          <p className="font-medium text-gray-900">Types</p>
                          <p className="text-xs text-gray-600">Missionary, Mission</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded text-center">
                          <p className="font-medium text-gray-900">Fields</p>
                          <p className="text-xs text-gray-600">firstName, assignments</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded text-center">
                          <p className="font-medium text-gray-900">Enums</p>
                          <p className="text-xs text-gray-600">MALE, FEMALE</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded text-center">
                          <p className="font-medium text-gray-900">Arguments</p>
                          <p className="text-xs text-gray-600">missionaryId: ID</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🔍 Emacs-Style Incremental Search</h3>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      Navigate through your GraphQL queries with powerful Emacs-style incremental search. 
                      Search as you type with real-time highlighting and instant cursor positioning.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      <li><strong>Real-time Highlighting:</strong> All matches are highlighted as you type</li>
                      <li><strong>Current Match Emphasis:</strong> The current match is highlighted differently</li>
                      <li><strong>Instant Cursor Movement:</strong> Cursor jumps to the first match immediately</li>
                      <li><strong>Bidirectional Search:</strong> Use Ctrl+S for forward, Ctrl+R for reverse search</li>
                      <li><strong>Match Navigation:</strong> Use Ctrl+S/Ctrl+R repeatedly to cycle through matches</li>
                      <li><strong>Match Counter:</strong> See your position with "I-search: query (2/5)" display</li>
                      <li><strong>Wraparound Search:</strong> Automatically loops from last match back to first</li>
                      <li><strong>Search Widget:</strong> Shows current query and match position</li>
                      <li><strong>Case-insensitive:</strong> Search works regardless of case</li>
                      <li><strong>Backspace Support:</strong> Refine your search by removing characters</li>
                    </ul>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded border">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">⌨️ Exact Keybindings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Start incremental search:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+S</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Start reverse search:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+R</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Next match (while searching):</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+S</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Previous match (while searching):</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+R</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cancel (return to start):</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+G</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Exit (stay at match):</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+N / Ctrl+P</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Alternative exit:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Escape</code>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded border">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">🎨 Visual Experience</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-2 bg-yellow-300 border border-yellow-500 rounded"></div>
                            <span>All matches highlighted in yellow</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-2 bg-orange-400 border-2 border-orange-600 rounded"></div>
                            <span>Current match emphasized in orange</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-2 bg-gray-300 border border-gray-500 rounded"></div>
                            <span>Search widget shows query + match counter (e.g., "2/5")</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-500">→</span>
                            <span>Smooth cursor movement to matches</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-white rounded border">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">🚀 How to Use</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li><strong>Start Search:</strong> Press <code className="bg-gray-100 px-1 rounded text-xs">Ctrl+S</code> (forward) or <code className="bg-gray-100 px-1 rounded text-xs">Ctrl+R</code> (reverse) in the GraphQL editor</li>
                        <li><strong>Type Query:</strong> Start typing - matches appear instantly with highlighting and counter</li>
                        <li><strong>Navigate Matches:</strong> Use <code className="bg-gray-100 px-1 rounded text-xs">Ctrl+S</code> (next) or <code className="bg-gray-100 px-1 rounded text-xs">Ctrl+R</code> (previous) to move between matches</li>
                        <li><strong>Refine Search:</strong> Use <code className="bg-gray-100 px-1 rounded text-xs">Backspace</code> to modify your search query</li>
                        <li><strong>Exit Options:</strong>
                          <ul className="ml-4 mt-1 list-disc list-inside">
                            <li><code className="bg-gray-100 px-1 rounded text-xs">Ctrl+G</code>: Return to original cursor position</li>
                            <li><code className="bg-gray-100 px-1 rounded text-xs">Ctrl+N</code>/<code className="bg-gray-100 px-1 rounded text-xs">Ctrl+P</code>: Stay at current match and continue editing</li>
                            <li><code className="bg-gray-100 px-1 rounded text-xs">Escape</code>: Exit search</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Pro Tip:</strong> This provides the full Emacs-style incremental search experience with bidirectional navigation! 
                        The search is blazingly fast, shows real-time match counts (e.g., "2/5"), and behaves exactly like Emacs users expect. 
                        Use <code className="bg-blue-100 px-1 rounded text-xs">Ctrl+S</code>/<code className="bg-blue-100 px-1 rounded text-xs">Ctrl+R</code> to move forward/backward through matches.
                        Perfect for efficiently navigating through large GraphQL queries.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ Multiple Navigation Options</h3>
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      The platform supports multiple navigation styles for autocomplete, giving you the flexibility to use 
                      your preferred keybindings. We've solved the keymap precedence challenges to provide authentic experiences 
                      for both Emacs and vim users.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-white rounded border border-green-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">🎯 Emacs-Style (Primary)</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Navigate down:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-green-700">Ctrl+N</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Navigate up:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-green-700">Ctrl+P</code>
                          </div>
                          <div className="mt-2 text-xs text-green-700">
                            ✨ <strong>Authentic Experience:</strong> True Emacs navigation with highest keymap precedence
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded border border-blue-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">🔄 Alternative Options</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vim-style:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+J / Ctrl+K</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Alternative:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Alt+N / Alt+P</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Arrow keys:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+↓ / Ctrl+↑</code>
                          </div>
                          <div className="mt-2 text-xs text-blue-700">
                            Choose what feels most natural to you!
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded border mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">🔬 The Technical Discovery</h4>
                      <div className="text-sm text-gray-700 space-y-2">
                        <p>
                          <strong>The Challenge:</strong> Initially, we discovered that <code className="bg-gray-100 px-1 rounded">Ctrl+N</code> and <code className="bg-gray-100 px-1 rounded">Ctrl+P</code> 
                          worked perfectly in the main editor but not for autocomplete navigation.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                          <p className="text-blue-800 font-medium mb-1">� Root Cause Found:</p>
                          <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                            <li><strong>Not browser limitations:</strong> Browsers weren't intercepting the keys</li>
                            <li><strong>Keymap precedence issue:</strong> CodeMirror's default keymaps had higher priority</li>
                            <li><strong>Solution discovered:</strong> <code className="bg-blue-100 px-1 rounded">Prec.highest()</code> gives our keymap absolute precedence</li>
                            <li><strong>Perfect result:</strong> All navigation styles now work flawlessly</li>
                          </ul>
                        </div>
                        <p className="text-green-700 mt-2">
                          <strong>Breakthrough:</strong> By using <code className="bg-green-100 px-1 rounded">Prec.highest()</code>, 
                          we ensure our custom keybindings take precedence over CodeMirror's defaults while preserving 
                          normal editor functionality when autocomplete isn't active.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded border">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">🎪 Complete Autocomplete Experience</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div className="p-3 bg-gray-50 rounded text-center">
                          <code className="block bg-white px-2 py-1 rounded text-xs mb-1">Ctrl+Space</code>
                          <p className="text-gray-600">Trigger autocomplete</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded text-center">
                          <code className="block bg-white px-2 py-1 rounded text-xs mb-1">Ctrl+N / Ctrl+P</code>
                          <p className="text-gray-600">Navigate (Emacs)</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded text-center">
                          <code className="block bg-white px-2 py-1 rounded text-xs mb-1">Ctrl+J / Ctrl+K</code>
                          <p className="text-gray-600">Navigate (vim)</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded text-center">
                          <code className="block bg-white px-2 py-1 rounded text-xs mb-1">Tab</code>
                          <p className="text-gray-600">Accept suggestion</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
                      <p className="text-sm text-green-800">
                        � <strong>Mission Accomplished:</strong> You now have the authentic Emacs experience you wanted! 
                        <code className="bg-green-200 px-1 rounded">Ctrl+N</code> and <code className="bg-green-200 px-1 rounded">Ctrl+P</code> 
                        work perfectly for autocomplete navigation, with vim-style and other alternatives available for maximum flexibility.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🔧 Getting Started</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <ol className="list-decimal list-inside space-y-3 text-gray-700">
                      <li>
                        <strong>Navigate to API Testing:</strong> Go to <code className="bg-white px-2 py-1 rounded text-sm">/api-testing</code>
                      </li>
                      <li>
                        <strong>Select Environment:</strong> Choose your target environment (e.g., mis-gql-stage)
                      </li>
                      <li>
                        <strong>Wait for Schema:</strong> Look for the green "Schema Loaded" indicator
                      </li>
                      <li>
                        <strong>Start Typing:</strong> Begin writing your query and press <code className="bg-white px-1 rounded text-xs">Ctrl+Space</code> for suggestions
                      </li>
                      <li>
                        <strong>Explore with Autocomplete:</strong> Use suggestions to discover available fields and types
                      </li>
                      <li>
                        <strong>Generate or Write Query:</strong> Use 🎲 Random Query or write your own with autocomplete assistance
                      </li>
                      <li>
                        <strong>Format Query:</strong> Click ⚡ format button for clean formatting
                      </li>
                      <li>
                        <strong>Save for Later:</strong> Use 💾 Save to add to your query library
                      </li>
                      <li>
                        <strong>Execute:</strong> Click "Test API" to run the query
                      </li>
                    </ol>
                    
                    <div className="mt-4 p-3 bg-blue-100 rounded">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Pro Tip:</strong> Use autocomplete to explore the schema! Start typing field names you're curious about, 
                        and the editor will show you what's available. This is perfect for API discovery and learning the schema structure.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'schema-browser' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">MGQL Schema Browser</h2>
                  
                  <p className="text-gray-600 mb-6">
                    The MGQL Schema Browser is a powerful tool for exploring and understanding the Missionary GraphQL schema structure. 
                    It provides an interactive interface to browse types, fields, enums, and their relationships.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
                    <li>Real-time schema introspection from any environment</li>
                    <li>Interactive search and filtering of types</li>
                    <li>Clickable type navigation between related types</li>
                    <li>Detailed field information including arguments and descriptions</li>
                    <li>Enum values and interface implementations</li>
                    <li>Deprecated field highlighting and warnings</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Use</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <ol className="list-decimal list-inside space-y-3 text-gray-700">
                      <li><strong>Select Environment:</strong> Choose your target environment (Development, Staging, or Production)</li>
                      <li><strong>Browse Types:</strong> Use the left panel to see all available GraphQL types</li>
                      <li><strong>Search & Filter:</strong> Use the search bar to find specific types or filter by type kind</li>
                      <li><strong>Explore Details:</strong> Click on any type to see its fields, arguments, and relationships</li>
                      <li><strong>Navigate:</strong> Click on type names within field definitions to jump to related types</li>
                    </ol>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Type Categories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">🏗️ Object Types</h4>
                      <p className="text-sm text-gray-600">Complex types with fields (e.g., Missionary, Assignment)</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">📊 Scalar Types</h4>
                      <p className="text-sm text-gray-600">Basic data types (String, Int, Boolean, etc.)</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">🔢 Enum Types</h4>
                      <p className="text-sm text-gray-600">Predefined sets of values (Status, Gender, etc.)</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">📝 Input Types</h4>
                      <p className="text-sm text-gray-600">Input objects for mutations and queries</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Navigation Tips</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <ul className="list-disc list-inside space-y-2 text-green-700">
                      <li>Use the search field&apos;s clear (X) button to quickly reset filters</li>
                      <li>Selected types are automatically scrolled into view in both panels</li>
                      <li>Type names are highlighted and clickable throughout the interface</li>
                      <li>Deprecated fields are clearly marked with warning indicators</li>
                      <li>The schema browser remembers your environment selection</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">💡 Pro Tip</h4>
                    <p className="text-sm text-amber-700">
                      Use the Schema Browser alongside the API Testing tool to understand the available 
                      fields and their types before building your GraphQL queries.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'local-storage' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">💾 Local Storage Manager</h2>
                  
                  <p className="text-gray-600 mb-6">
                    The Local Storage Manager is a comprehensive utility for browsing, managing, and maintaining 
                    your browser's local storage data. This tool is essential for debugging, data cleanup, 
                    and understanding how the application stores persistent information.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
                    <li><strong>Real-time Statistics:</strong> View total items, storage size, and breakdown by category</li>
                    <li><strong>Advanced Filtering:</strong> Filter by data type (string, object, array, etc.) or search history items</li>
                    <li><strong>Search Functionality:</strong> Search across both keys and values for quick discovery</li>
                    <li><strong>Data Inspection:</strong> View formatted JSON data with proper syntax highlighting</li>
                    <li><strong>In-place Editing:</strong> Modify localStorage values directly from the interface</li>
                    <li><strong>Bulk Operations:</strong> Clear search history or all data with safety confirmations</li>
                    <li><strong>Export/Backup:</strong> Download all localStorage data as JSON for backup purposes</li>
                    <li><strong>Type Detection:</strong> Automatically identifies and displays data types with visual icons</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Access</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-3">
                      Navigate to the Local Storage Manager through the sidebar:
                    </p>
                    <p className="font-mono text-sm bg-white p-2 rounded border">
                      Utilities → Local Storage Manager
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Or visit directly: <code>/local-storage</code>
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Storage Statistics Dashboard</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      The dashboard provides an at-a-glance view of your storage usage:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                      <div className="bg-white rounded p-3 border">
                        <div className="text-2xl font-bold text-blue-600">42</div>
                        <div className="text-gray-600">Total Items</div>
                      </div>
                      <div className="bg-white rounded p-3 border">
                        <div className="text-2xl font-bold text-purple-600">156 KB</div>
                        <div className="text-gray-600">Total Size</div>
                      </div>
                      <div className="bg-white rounded p-3 border">
                        <div className="text-2xl font-bold text-green-600">8</div>
                        <div className="text-gray-600">Search History</div>
                      </div>
                      <div className="bg-white rounded p-3 border">
                        <div className="text-2xl font-bold text-orange-600">34</div>
                        <div className="text-gray-600">Other Items</div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Types & Icons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">📦</span> Object Types
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">JSON objects like search history, user preferences</p>
                      <code className="text-xs bg-white p-1 rounded">{"{ \"key\": \"value\" }"}</code>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">📋</span> Array Types
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">Lists of items like search suggestions</p>
                      <code className="text-xs bg-white p-1 rounded">["item1", "item2"]</code>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">📝</span> String Types
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">Simple text values like settings</p>
                      <code className="text-xs bg-white p-1 rounded">"simple text"</code>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🔢</span> Number & Boolean
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">Numeric values and true/false flags</p>
                      <code className="text-xs bg-white p-1 rounded">42, true, false</code>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Common Operations</h3>
                  <div className="space-y-4 mb-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">🔍 Finding Data</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Use the search box to find items by key name or content</li>
                        <li>• Filter by type using the dropdown (Objects, Arrays, etc.)</li>
                        <li>• Use "search-history" filter to view only search-related data</li>
                      </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">👁️ Viewing Data</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Click the "View" button (eye icon) to see formatted content</li>
                        <li>• JSON data is automatically formatted with syntax highlighting</li>
                        <li>• Large values are truncated in the table for readability</li>
                      </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">✏️ Editing Data</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Click the "Edit" button (pencil icon) to modify values</li>
                        <li>• Edit raw JSON or plain text directly in the dialog</li>
                        <li>• Changes are saved immediately to localStorage</li>
                      </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">🗑️ Removing Data</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Delete individual items with the trash icon</li>
                        <li>• Clear all search history with "Clear Search History"</li>
                        <li>• Clear all localStorage with "Clear All" (use with caution!)</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Search History Management</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      The application automatically stores search history for various forms to help you reuse previous searches:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      <li><strong>missionaries-search-history:</strong> Saved missionary search parameters</li>
                      <li><strong>member-search-history:</strong> Member UUID search history</li>
                      <li><strong>leader-search-history:</strong> Leader CMIS ID searches</li>
                      <li><strong>options-search-history:</strong> Entity/attribute option queries</li>
                      <li><strong>ecclesiastical-unit-search-history:</strong> Unit ID searches</li>
                    </ul>
                    <div className="mt-4 p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-gray-900">💡 Pro Tip:</p>
                      <p className="text-sm text-gray-600">
                        Search history items are automatically limited to the 10 most recent entries 
                        to prevent excessive storage usage while maintaining useful history.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Export & Backup</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      Use the "Export All" feature to create backups of your localStorage data:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                      <li>Click the "Export All" button in the controls section</li>
                      <li>A JSON file will be automatically downloaded with format: <code>localStorage-backup-YYYY-MM-DD.json</code></li>
                      <li>The file contains all localStorage items in a structured JSON format</li>
                      <li>You can later import this data manually if needed for migration or recovery</li>
                    </ol>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Best Practices</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">RECOMMENDED</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Regular Cleanup</p>
                        <p className="text-sm text-gray-600">Periodically clear old search history to keep storage lean</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">BACKUP</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Export Before Major Changes</p>
                        <p className="text-sm text-gray-600">Create backups before clearing all data or making bulk edits</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">CAUTION</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Careful with Bulk Operations</p>
                        <p className="text-sm text-gray-600">Double-check before using "Clear All" as this cannot be undone</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">⚠️ Important Notes</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• localStorage is domain-specific and only visible to this application</li>
                      <li>• Data persists across browser sessions but may be cleared by browser cleanup</li>
                      <li>• Storage limits vary by browser (typically 5-10MB for localStorage)</li>
                      <li>• Private/incognito browsing may not persist localStorage data</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'mogs-queries' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">MOGS Query Pages</h2>
                  
                  <p className="text-gray-600 mb-6">
                    The MOGS (Missionary Oracle Graph Service) section provides direct access to individual GraphQL queries from the MOGS schema. 
                    Each page is designed to query a specific top-level query with comprehensive result display and data export capabilities.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">🏛️ About MOGS</h3>
                    <p className="text-blue-700 mb-3">
                      MOGS is the core GraphQL service that provides access to missionary assignment data, organizational structures, 
                      and training information. These pages offer direct access to MOGS queries with user-friendly interfaces.
                    </p>
                    <div className="text-sm text-blue-600">
                      <strong>Common Features Across All MOGS Pages:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>• Environment selection (Development, Local, Production)</li>
                        <li>• Real-time connection status indicator</li>
                        <li>• Search history with localStorage persistence</li>
                        <li>• Collapsible result sections for organized data display</li>
                        <li>• JSON export functionality</li>
                        <li>• Comprehensive error handling and validation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">🙏 Missionary Query</h3>
                      <p className="text-green-700 mb-3">Access detailed missionary information using legacy_miss_id.</p>
                      <div className="text-sm text-green-600">
                        <strong>Query:</strong> <code>missionary(id: ID!): Missionary</code><br/>
                        <strong>Data Includes:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Personal information and identifiers</li>
                          <li>• Enabled member details and processing status</li>
                          <li>• Assignment history and locations</li>
                          <li>• Identity documents and contact information</li>
                          <li>• MyPlan integration and training data</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3">📚 Curriculum Query</h3>
                      <p className="text-purple-700 mb-3">Search curriculum details and training requirements by ID.</p>
                      <div className="text-sm text-purple-600">
                        <strong>Query:</strong> <code>curriculum(id: ID!): Curriculum</code><br/>
                        <strong>Data Includes:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Curriculum description and type</li>
                          <li>• Effective and decommission dates</li>
                          <li>• Language requirements and translations</li>
                          <li>• Assignment capabilities and phases</li>
                          <li>• Associated facilities and overlap information</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-indigo-900 mb-3">📖 MyPlan Missionary Query</h3>
                      <p className="text-indigo-700 mb-3">Access MyPlan training data and course progress by legacy_miss_id.</p>
                      <div className="text-sm text-indigo-600">
                        <strong>Query:</strong> <code>myPlanMissionary(id: ID!): MyPlanMissionary</code><br/>
                        <strong>Data Includes:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Basic missionary information and identifiers</li>
                          <li>• Mission assignment and organizational details</li>
                          <li>• Course enrollment and completion status</li>
                          <li>• MyPlan URL and sharing preferences</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-emerald-900 mb-3">🌐 WS Missionary Query</h3>
                      <p className="text-emerald-700 mb-3">Access comprehensive Web Service missionary information by legacy_miss_id.</p>
                      <div className="text-sm text-emerald-600">
                        <strong>Query:</strong> <code>wsMissionary(id: ID!): WSMissionary</code><br/>
                        <strong>Data Includes:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Complete personal information (preferred and official names)</li>
                          <li>• Mission assignment details and timeline</li>
                          <li>• Contact information (email addresses)</li>
                          <li>• Driving status and license information</li>
                          <li>• MyPlan completion and sharing settings</li>
                          <li>• Current assignment location and position</li>
                          <li>• Missionary identity records</li>
                          <li>• Historical assignment information</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-cyan-900 mb-3">🎨 Missionary Hobbies & Skills Query</h3>
                      <p className="text-cyan-700 mb-3">Access missionary hobbies and skills overview by legacy_miss_id.</p>
                      <div className="text-sm text-cyan-600">
                        <strong>Query:</strong> <code>missionaryHobbiesSkills(id: ID!): MissionaryHobbiesSkills</code><br/>
                        <strong>Data Includes:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Missionary number identification</li>
                          <li>• Skills and hobbies overview text</li>
                          <li>• Personal interests and talents</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-teal-900 mb-3">⚙️ Missionary Component Query</h3>
                      <p className="text-teal-700 mb-3">Access individual components of missionary assignments by comp_id.</p>
                      <div className="text-sm text-teal-600">
                        <strong>Query:</strong> <code>missionaryComponent(id: ID): MissionaryComponent</code><br/>
                        <strong>Data Includes:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Component identification and status</li>
                          <li>• Missionary type requirements</li>
                          <li>• Assignment location and unit numbers</li>
                          <li>• Language requirements and codes</li>
                          <li>• Position details and abbreviations</li>
                          <li>• Responsible organization information</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-orange-900 mb-3">📋 Additional MOGS Queries</h3>
                      <p className="text-orange-700 mb-3">Several other MOGS queries are available for specialized data access.</p>
                      <div className="text-sm text-orange-600">
                        <strong>Available Queries:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• <code>assignment(id: ID!)</code> - Assignment details</li>
                          <li>• <code>assignmentLocation(id: ID!)</code> - Location information</li>
                          <li>• <code>component(id: ID!)</code> - Component data with filters</li>
                          <li>• <code>enabledMember(id: ID!)</code> - Member enabling details</li>
                          <li>• <code>leader(id: ID!)</code> - Leadership information</li>
                          <li>• <code>leaderAttachment(id: ID!)</code> - Leader documents</li>
                          <li>• <code>missionaryComponent(id: ID)</code> - Missionary assignment components</li>
                          <li>• <code>missionaryHobbiesSkills(id: ID!)</code> - Missionary hobbies and skills</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🔧 Technical Implementation</h3>
                    <p className="text-gray-700 mb-4">
                      All MOGS pages are built using a consistent architecture that ensures reliability and user experience:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Frontend Features</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• TypeScript interfaces matching GraphQL schema</li>
                          <li>• React hooks for state management</li>
                          <li>• Tailwind CSS for responsive design</li>
                          <li>• Local storage for search history</li>
                          <li>• Error boundaries and loading states</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Backend Integration</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• ApiClient for authenticated requests</li>
                          <li>• Environment-specific configuration</li>
                          <li>• OAuth 2.0 token management</li>
                          <li>• GraphQL query validation</li>
                          <li>• Comprehensive error handling</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">💡 Usage Tips</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Use the search history to quickly re-run previous queries</li>
                      <li>• Export data as JSON for further analysis or documentation</li>
                      <li>• Check connection status before running queries</li>
                      <li>• Expand/collapse sections to focus on relevant data</li>
                      <li>• Switch environments to test against different data sets</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'organizational-search' && (
                <div className="prose prose-blue max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizational Search Tools</h2>
                  
                  <p className="text-gray-600 mb-6">
                    The application provides specialized search tools for various organizational entities within the missionary system. 
                    Each search tool is designed to query specific types of organizational data with relevant filters and display options.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-teal-900 mb-3">📋 Active Assignment Search</h3>
                      <p className="text-teal-700 mb-3">Find detailed information about a missionary's current active assignment.</p>
                      <div className="text-sm text-teal-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by missionary number/legacy ID</li>
                          <li>• View comprehensive assignment details</li>
                          <li>• Access mission and location information</li>
                          <li>• View training and curriculum data</li>
                          <li>• Track assignment history and status</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-indigo-900 mb-3">📍 Assignment Location Search</h3>
                      <p className="text-indigo-700 mb-3">Search detailed information about assignment locations and missionary histories.</p>
                      <div className="text-sm text-indigo-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by assignment location ID</li>
                          <li>• View location type and details</li>
                          <li>• Access comprehensive missionary histories</li>
                          <li>• View companion relationships and dates</li>
                          <li>• Track assignment statistics and metrics</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-amber-900 mb-3">🗂️ Missionaries by Assignment Location</h3>
                      <p className="text-amber-700 mb-3">Find all missionaries currently or previously assigned to a specific location.</p>
                      <div className="text-sm text-amber-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by assignment location ID</li>
                          <li>• View comprehensive missionary profiles</li>
                          <li>• Filter by missionary status and type</li>
                          <li>• Sort by name or missionary number</li>
                          <li>• Export results to CSV format</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-cyan-900 mb-3">🏢 Missionaries by Assigned Unit</h3>
                      <p className="text-cyan-700 mb-3">Find all missionaries assigned to a specific unit by Unit ID.</p>
                      <div className="text-sm text-cyan-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by unit ID for comprehensive results</li>
                          <li>• View detailed missionary profiles and contact info</li>
                          <li>• Filter by status, type, gender, and active assignments</li>
                          <li>• Sort by name, number, or service dates</li>
                          <li>• Assignment history and status tracking</li>
                          <li>• Export filtered results to CSV</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-violet-900 mb-3">🎯 Candidates by Membership Unit</h3>
                      <p className="text-violet-700 mb-3">Find candidates who have started recommends in a specific membership unit.</p>
                      <div className="text-sm text-violet-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by membership unit ID for comprehensive candidate listing</li>
                          <li>• View detailed candidate profiles with personal information</li>
                          <li>• Filter by missionary type, source system, or recent recommends</li>
                          <li>• Sort by name, number, or recommend start dates</li>
                          <li>• Track recommend progress and availability dates</li>
                          <li>• View unit relationships (membership, home, submitting)</li>
                          <li>• Export filtered candidate data to CSV</li>
                          <li>• Comprehensive search history and summary statistics</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-3">🔧 SMMS Options</h3>
                      <p className="text-yellow-700 mb-3">Retrieve all available option values for the Service Missionary Management System (SMMS).</p>
                      <div className="text-sm text-yellow-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Fetch all SMMS option categories in a single query</li>
                          <li>• View assignment approval states and statuses</li>
                          <li>• Access assignment types and opportunity statuses</li>
                          <li>• Browse service types and opportunity type statuses</li>
                          <li>• Filter options by category or search text</li>
                          <li>• Sort options alphabetically in any order</li>
                          <li>• Export option data to CSV for documentation</li>
                          <li>• Track fetch history with timestamps and counts</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">📍 Proselyting Area Search</h3>
                      <p className="text-blue-700 mb-3">Search and manage proselyting areas within missions.</p>
                      <div className="text-sm text-blue-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by area name and description</li>
                          <li>• Filter by mission and zone</li>
                          <li>• View area boundaries and assignments</li>
                          <li>• Track area statistics and metrics</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-cyan-900 mb-3">📤 Proselyting Area for Referral</h3>
                      <p className="text-cyan-700 mb-3">Find proselyting areas configured to receive referrals for a specific unit.</p>
                      <div className="text-sm text-cyan-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by unit ID to find referral-configured areas</li>
                          <li>• View comprehensive area details and contact information</li>
                          <li>• See active missionary assignments and ecclesiastical units</li>
                          <li>• Filter by country, state, or active assignments</li>
                          <li>• Sort by area name, city, or geographic location</li>
                          <li>• View vehicle information and transportation details</li>
                          <li>• Export referral area data to CSV for documentation</li>
                          <li>• Track search history for repeat queries</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-indigo-900 mb-3">🌍 Countries</h3>
                      <p className="text-indigo-700 mb-3">Search and browse countries and territories with comprehensive geographic data.</p>
                      <div className="text-sm text-indigo-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by country IDs, ISO2 codes, or ISO3 codes</li>
                          <li>• Filter by country name or territory type</li>
                          <li>• View ISO 3166-1 alpha-2 and alpha-3 codes</li>
                          <li>• Identify countries vs territories/subunits</li>
                          <li>• See effective ISO codes for territories</li>
                          <li>• Sort by name, ID, or ISO codes</li>
                          <li>• Export country data to CSV</li>
                          <li>• Track search history for geographic queries</li>
                          <li>• Summary statistics on countries vs subunits</li>
                          <li>• Support for bulk search with multiple criteria</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">🌍 Mission Search</h3>
                      <p className="text-green-700 mb-3">Search and explore mission information and boundaries.</p>
                      <div className="text-sm text-green-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by mission name and code</li>
                          <li>• Filter by geographic regions</li>
                          <li>• View mission leadership and contact info</li>
                          <li>• Access mission statistics and reports</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3">🗺️ Zone Search</h3>
                      <p className="text-purple-700 mb-3">Search and manage zones within missions.</p>
                      <div className="text-sm text-purple-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by zone name and identifier</li>
                          <li>• Filter by parent mission</li>
                          <li>• View zone leadership assignments</li>
                          <li>• Access zone performance metrics</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-pink-900 mb-3">🗺️ Mission Boundary Changes</h3>
                      <p className="text-pink-700 mb-3">Search and track mission boundary adjustments from the IMOS system.</p>
                      <div className="text-sm text-pink-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by mission unit numbers or adjustment IDs</li>
                          <li>• Filter by boundary change status</li>
                          <li>• View effective dates and IMOS status</li>
                          <li>• Track sending and receiving missions</li>
                          <li>• Export boundary change data</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-orange-900 mb-3">🏘️ District Search</h3>
                      <p className="text-orange-700 mb-3">Search and manage districts within zones.</p>
                      <div className="text-sm text-orange-600">
                        <strong>Key Features:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Search by district name and code</li>
                          <li>• Filter by parent zone and mission</li>
                          <li>• View district leadership structure</li>
                          <li>• Track district activities and progress</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Common Search Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Search Capabilities</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Real-time search with live filtering</li>
                          <li>• Multiple search criteria support</li>
                          <li>• Advanced filtering options</li>
                          <li>• Sortable result columns</li>
                          <li>• Export search results</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">User Experience</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Search history with localStorage persistence</li>
                          <li>• Quick access to recent searches</li>
                          <li>• Responsive design for all devices</li>
                          <li>• Loading states and error handling</li>
                          <li>• Intuitive navigation and breadcrumbs</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">🔗 GraphQL Integration</h3>
                    <p className="text-blue-700 mb-3">
                      All organizational search tools are built on the MGQL (Missionary GraphQL) schema, ensuring consistent data access and type safety.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">Schema Compliance</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Follows MGQL field definitions</li>
                          <li>• Proper enum and array handling</li>
                          <li>• Type-safe GraphQL queries</li>
                          <li>• Consistent error handling</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">Performance</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Optimized query structures</li>
                          <li>• Efficient data fetching</li>
                          <li>• Pagination support</li>
                          <li>• Caching strategies</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">📊 Data Relationships</h3>
                    <p className="text-green-700 mb-3">
                      Understanding the hierarchical structure of organizational entities:
                    </p>
                    <div className="bg-white border border-green-200 rounded p-4">
                      <div className="text-sm text-green-800 font-mono">
                        <div className="mb-2">📋 <strong>Mission</strong></div>
                        <div className="ml-4 mb-2">├── 🗺️ <strong>Zone</strong></div>
                        <div className="ml-8 mb-2">├── 🏘️ <strong>District</strong></div>
                        <div className="ml-12 mb-2">└── 📍 <strong>Proselyting Area</strong></div>
                        <div className="ml-16">└── 👥 <strong>Missionaries</strong></div>
                      </div>
                    </div>
                    <p className="text-sm text-green-600 mt-3">
                      Each level can be searched independently, and results can be filtered by parent entities.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-4">💡 Usage Tips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-yellow-800 mb-2">Search Strategy</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Start with broader searches (Mission → Zone → District)</li>
                          <li>• Use partial matches for names and descriptions</li>
                          <li>• Combine multiple filters for precise results</li>
                          <li>• Save frequently used searches for quick access</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-800 mb-2">Data Management</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Search history is stored locally in your browser</li>
                          <li>• Export results for external analysis</li>
                          <li>• Use the Local Storage Manager to clean up old searches</li>
                          <li>• Bookmark frequently accessed organizational pages</li>
                        </ul>
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
