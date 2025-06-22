'use client';

import { useState } from 'react';

export default function ArchitecturePage() {
  const [activeLayer, setActiveLayer] = useState('overview');

  const layers = [
    { id: 'overview', title: 'System Overview', icon: '🏗️' },
    { id: 'frontend', title: 'Frontend Layer', icon: '🖥️' },
    { id: 'middleware', title: 'Middle-tier APIs', icon: '⚙️' },
    { id: 'backend', title: 'Backend Data Sources', icon: '🗄️' },
    { id: 'data-flow', title: 'Data Flow', icon: '🔄' },
    { id: 'technologies', title: 'Technology Stack', icon: '🛠️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TAP Application Architecture</h1>
          <p className="mt-2 text-lg text-gray-600">
            Three-tiered architecture for testing and accessing missionary data systems
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Architecture Layers</h2>
              <nav className="space-y-2">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      activeLayer === layer.id
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>{layer.icon}</span>
                    <span>{layer.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              
              {/* System Overview */}
              {activeLayer === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">🏗️ Three-Tiered Architecture Overview</h2>
                    
                    {/* Architecture Diagram */}
                    <div className="bg-gradient-to-b from-blue-50 to-white border-2 border-blue-200 rounded-xl p-8 mb-8">
                      <div className="space-y-8">
                        
                        {/* Frontend Layer */}
                        <div className="bg-green-100 border-2 border-green-300 rounded-lg p-6">
                          <div className="text-center">
                            <h3 className="text-xl font-bold text-green-800 mb-2">🖥️ Frontend Layer</h3>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-lg font-semibold text-gray-800">TAP (Test Access Portal)</div>
                              <div className="text-sm text-gray-600 mt-1">Next.js • React • TypeScript • Apollo GraphQL • Material UI</div>
                              <div className="text-xs text-gray-500 mt-2">Testing and accessing missionary data systems</div>
                            </div>
                          </div>
                        </div>

                        {/* Arrow Down */}
                        <div className="flex justify-center">
                          <div className="text-3xl text-blue-500">⬇️</div>
                        </div>

                        {/* Middle-tier Layer */}
                        <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-6">
                          <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-blue-800">⚙️ Middle-tier GraphQL APIs</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-lg font-semibold text-gray-800">MOGS</div>
                              <div className="text-sm text-gray-600">Missionary Oracle Graph Service</div>
                              <div className="text-xs text-gray-500 mt-2">Spring Boot • Spring GraphQL • Cloud Foundry</div>
                              <div className="text-xs text-blue-600 mt-1">→ Oracle MSSW Schema</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-lg font-semibold text-gray-800">MGQL</div>
                              <div className="text-sm text-gray-600">Master GraphQL Service</div>
                              <div className="text-xs text-gray-500 mt-2">Netflix DGS • AWS ECS Fargate</div>
                              <div className="text-xs text-blue-600 mt-1">→ INQ • MOGS • SMMS</div>
                            </div>
                          </div>
                        </div>

                        {/* Arrow Down */}
                        <div className="flex justify-center">
                          <div className="text-3xl text-blue-500">⬇️</div>
                        </div>

                        {/* Backend Layer */}
                        <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-6">
                          <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-orange-800">🗄️ Backend Data Sources</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-lg font-semibold text-gray-800">Oracle Database</div>
                              <div className="text-sm text-gray-600">MSSW Schema</div>
                              <div className="text-xs text-gray-500 mt-2">Mission assignment preparation</div>
                              <div className="text-xs text-orange-600 mt-1">Spring JDBCTemplate • SQL</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-lg font-semibold text-gray-800">Microsoft Dataverse</div>
                              <div className="text-sm text-gray-600">INQ Project</div>
                              <div className="text-xs text-gray-500 mt-2">In-field missionary info & reassignments</div>
                              <div className="text-xs text-orange-600 mt-1">OData WebAPI</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-lg font-semibold text-gray-800">AWS DynamoDB</div>
                              <div className="text-sm text-gray-600">SMMS Project</div>
                              <div className="text-xs text-gray-500 mt-2">Service missionary opportunities</div>
                              <div className="text-xs text-orange-600 mt-1">GraphQL</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Key Architecture Benefits</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">✅</span>
                            <span className="text-sm">Separation of concerns across tiers</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">✅</span>
                            <span className="text-sm">GraphQL abstraction layer</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">✅</span>
                            <span className="text-sm">Multiple data source aggregation</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">✅</span>
                            <span className="text-sm">Scalable testing framework</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">✅</span>
                            <span className="text-sm">Modern web technologies</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">✅</span>
                            <span className="text-sm">Flexible deployment options</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Frontend Layer */}
              {activeLayer === 'frontend' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🖥️ Frontend Layer - TAP Application</h2>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                      <h3 className="text-xl font-semibold text-green-800 mb-3">TAP (Test Access Portal)</h3>
                      <p className="text-gray-700 mb-4">
                        A Next.js-based frontend application designed for testing and accessing missionary data systems. 
                        TAP serves as the primary interface for developers and administrators to interact with backend services.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">🛠️ Core Technologies</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">Next.js</span>
                            <span className="text-sm text-gray-600">React framework with SSR/SSG capabilities</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">React</span>
                            <span className="text-sm text-gray-600">Component-based UI library</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">TypeScript</span>
                            <span className="text-sm text-gray-600">Type-safe JavaScript</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">Apollo GraphQL</span>
                            <span className="text-sm text-gray-600">GraphQL client and state management</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">Material UI</span>
                            <span className="text-sm text-gray-600">React component library with Material Design</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 Key Features</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">GraphQL query testing interface</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Schema browser and explorer</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Multi-environment support</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Authentication management</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Data visualization tools</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Search and filtering capabilities</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Export and reporting features</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-blue-800 mb-3">🔗 Frontend Connections</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">MOGS Integration</h5>
                          <p className="text-sm text-gray-600">Direct GraphQL connections to MOGS for missionary and organizational data</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">MGQL Integration</h5>
                          <p className="text-sm text-gray-600">Unified access to all backend systems through the master GraphQL service</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Middle-tier Layer */}
              {activeLayer === 'middleware' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ Middle-tier GraphQL APIs</h2>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                      <p className="text-gray-700">
                        The middle-tier provides GraphQL abstraction layers that aggregate and normalize data from multiple backend sources,
                        offering a unified API interface for the frontend application.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {/* MOGS */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <span className="text-2xl">🏛️</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">MOGS (Missionary Oracle Graph Service)</h3>
                            <p className="text-sm text-gray-600">Spring Boot GraphQL service for Oracle data access</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Technology Stack</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Spring Boot</span>
                                <span className="text-sm text-gray-600">Application framework</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Spring for GraphQL</span>
                                <span className="text-sm text-gray-600">GraphQL integration</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Cloud Foundry</span>
                                <span className="text-sm text-gray-600">On-premise deployment platform</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Spring JDBCTemplate</span>
                                <span className="text-sm text-gray-600">Database access layer</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Data Access</h4>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-orange-600">🗄️</span>
                                <span className="font-medium text-gray-900">Oracle Database</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">MSSW Schema - Missionary and mission assignment preparation data</p>
                              <div className="text-xs text-gray-500">
                                <div>• Missionary profiles and assignments</div>
                                <div>• Mission and organizational data</div>
                                <div>• Leader information and hierarchies</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* MGQL */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <span className="text-2xl">🔗</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">MGQL (Master GraphQL Service)</h3>
                            <p className="text-sm text-gray-600">Unified GraphQL gateway aggregating all data sources</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Technology Stack</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Java</span>
                                <span className="text-sm text-gray-600">Backend development platform</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Netflix DGS</span>
                                <span className="text-sm text-gray-600">Domain Graph Service GraphQL framework</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">GraphQL</span>
                                <span className="text-sm text-gray-600">Query language and API standard</span>
                              </div>
                            </div>

                            <h4 className="font-semibold text-gray-900 mb-2 mt-4">Deployment Platform</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">AWS</span>
                                <span className="text-sm text-gray-600">Amazon Web Services cloud platform</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">ECS Fargate</span>
                                <span className="text-sm text-gray-600">Serverless container orchestration</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Purpose & Benefits</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span className="text-sm">Unified API for all data sources</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span className="text-sm">Single authentication point</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span className="text-sm">Cross-system data relationships</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span className="text-sm">Consistent query interface</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Connected Systems</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="font-medium text-blue-800">INQ Dataverse</div>
                              <div className="text-xs text-blue-600">In-field missionary information</div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="font-medium text-green-800">MOGS Oracle</div>
                              <div className="text-xs text-green-600">Mission assignment preparation</div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                              <div className="font-medium text-purple-800">SMMS DynamoDB</div>
                              <div className="text-xs text-purple-600">Service missionary opportunities</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Backend Layer */}
              {activeLayer === 'backend' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🗄️ Backend Data Sources</h2>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                      <p className="text-gray-700">
                        Three distinct data sources provide comprehensive missionary and organizational data,
                        each serving specific business functions and using different technologies.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {/* Oracle Database */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <span className="text-2xl">🏛️</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">Oracle Database - MSSW Schema</h3>
                            <p className="text-sm text-gray-600">Mission and missionary assignment preparation system</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Data Contents</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Missionary profiles and personal information</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Mission assignment preparation data</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Organizational hierarchies and units</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Leader assignments and roles</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Geographic and location data</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Access Method</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="space-y-3">
                                <div>
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Spring JDBCTemplate</span>
                                  <p className="text-sm text-gray-600 mt-1">Direct SQL queries for optimal performance</p>
                                </div>
                                <div>
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">SQL</span>
                                  <p className="text-sm text-gray-600 mt-1">Complex queries and joins for relational data</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Microsoft Dataverse */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <span className="text-2xl">☁️</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">Microsoft Dataverse - INQ Project</h3>
                            <p className="text-sm text-gray-600">In-field missionary information and reassignment system</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Data Contents</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Active missionary field assignments</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Reassignment requests and approvals</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Field performance and evaluation data</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Health and safety information</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Communication and contact logs</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Access Method</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="space-y-3">
                                <div>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">OData WebAPI</span>
                                  <p className="text-sm text-gray-600 mt-1">RESTful API with standard OData protocol</p>
                                </div>
                                <div>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Microsoft Cloud</span>
                                  <p className="text-sm text-gray-600 mt-1">Cloud-based data platform integration</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AWS DynamoDB */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-yellow-100 p-2 rounded-lg">
                            <span className="text-2xl">⚡</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">AWS DynamoDB - SMMS Project</h3>
                            <p className="text-sm text-gray-600">Service Missionary Management System</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Data Contents</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Service missionary opportunities</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Task assignments and tracking</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Volunteer availability and preferences</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Service project management data</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">•</span>
                                <span className="text-sm">Community outreach coordination</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Access Method</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="space-y-3">
                                <div>
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">GraphQL</span>
                                  <p className="text-sm text-gray-600 mt-1">Native GraphQL API for flexible queries</p>
                                </div>
                                <div>
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">AWS SDK</span>
                                  <p className="text-sm text-gray-600 mt-1">Direct DynamoDB integration and operations</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Flow */}
              {activeLayer === 'data-flow' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🔄 Data Flow Architecture</h2>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Request Flow Diagram</h3>
                      
                      <div className="space-y-6">
                        {/* Step 1 */}
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                          <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
                            <div className="font-semibold text-gray-900">User Request (Frontend)</div>
                            <div className="text-sm text-gray-600">TAP application sends GraphQL query via Apollo Client</div>
                          </div>
                        </div>

                        <div className="ml-4 text-2xl text-gray-400">⬇️</div>

                        {/* Step 2 */}
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                          <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
                            <div className="font-semibold text-gray-900">Authentication & Routing</div>
                            <div className="text-sm text-gray-600">OAuth token validation and route determination (MOGS vs MGQL)</div>
                          </div>
                        </div>

                        <div className="ml-4 text-2xl text-gray-400">⬇️</div>

                        {/* Step 3 */}
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                              <div className="font-semibold text-gray-900">Direct MOGS</div>
                              <div className="text-sm text-gray-600">Oracle MSSW data queries</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                              <div className="font-semibold text-gray-900">MGQL Gateway</div>
                              <div className="text-sm text-gray-600">Multi-source data aggregation</div>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 text-2xl text-gray-400">⬇️</div>

                        {/* Step 4 */}
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                              <div className="font-semibold text-gray-900">Oracle DB</div>
                              <div className="text-sm text-gray-600">SQL queries via JDBCTemplate</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                              <div className="font-semibold text-gray-900">Dataverse</div>
                              <div className="text-sm text-gray-600">OData WebAPI calls</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                              <div className="font-semibold text-gray-900">DynamoDB</div>
                              <div className="text-sm text-gray-600">GraphQL native queries</div>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 text-2xl text-gray-400">⬆️</div>

                        {/* Step 5 */}
                        <div className="flex items-center space-x-4">
                          <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">5</div>
                          <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
                            <div className="font-semibold text-gray-900">Response Aggregation</div>
                            <div className="text-sm text-gray-600">Data normalization, relationship mapping, and unified response formation</div>
                          </div>
                        </div>

                        <div className="ml-4 text-2xl text-gray-400">⬆️</div>

                        {/* Step 6 */}
                        <div className="flex items-center space-x-4">
                          <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">6</div>
                          <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
                            <div className="font-semibold text-gray-900">Frontend Rendering</div>
                            <div className="text-sm text-gray-600">TAP displays formatted data with interactive UI components</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">🚀 Performance Optimizations</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">GraphQL query optimization and field selection</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Caching at multiple levels (Apollo, service, database)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Connection pooling and resource management</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">•</span>
                            <span className="text-sm">Lazy loading and pagination support</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">🔒 Security Considerations</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-500">•</span>
                            <span className="text-sm">OAuth 2.0 authentication flow</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-500">•</span>
                            <span className="text-sm">Role-based access control (RBAC)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-500">•</span>
                            <span className="text-sm">Data encryption in transit and at rest</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-500">•</span>
                            <span className="text-sm">API rate limiting and throttling</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technologies */}
              {activeLayer === 'technologies' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🛠️ Technology Stack Overview</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Frontend Technologies */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center space-x-2">
                          <span>🖥️</span>
                          <span>Frontend</span>
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Next.js 15.3.3</div>
                            <div className="text-sm text-gray-600 mb-2">React framework with App Router</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">SSR</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">SSG</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">API Routes</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">React 18</div>
                            <div className="text-sm text-gray-600 mb-2">Component-based UI library</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Hooks</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Context</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Suspense</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">TypeScript</div>
                            <div className="text-sm text-gray-600 mb-2">Type-safe JavaScript development</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Interfaces</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Generics</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Strict Mode</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Apollo GraphQL</div>
                            <div className="text-sm text-gray-600 mb-2">GraphQL client and state management</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Caching</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Subscriptions</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">DevTools</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Material UI (MUI)</div>
                            <div className="text-sm text-gray-600 mb-2">React component library with Material Design</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Components</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Theming</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Icons</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Accessibility</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle-tier Technologies */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center space-x-2">
                          <span>⚙️</span>
                          <span>Middle-tier</span>
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Spring Boot</div>
                            <div className="text-sm text-gray-600 mb-2">Java application framework</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Auto-config</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Actuator</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Security</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Spring for GraphQL</div>
                            <div className="text-sm text-gray-600 mb-2">GraphQL integration for Spring (MOGS)</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Schema-first</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">DataFetchers</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">WebMVC</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Netflix DGS</div>
                            <div className="text-sm text-gray-600 mb-2">Domain Graph Service framework (MGQL)</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Code-gen</span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Federation</span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Testing</span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Subscriptions</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Spring JDBCTemplate</div>
                            <div className="text-sm text-gray-600 mb-2">Database access abstraction</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Connection Pool</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Transactions</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Error Handling</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Cloud Foundry</div>
                            <div className="text-sm text-gray-600 mb-2">On-premise deployment platform (MOGS)</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Buildpacks</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Services</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Scaling</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">AWS ECS Fargate</div>
                            <div className="text-sm text-gray-600 mb-2">Serverless container platform (MGQL)</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Containers</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Auto-scaling</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Load Balancing</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">High Availability</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Backend Technologies */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-orange-800 mb-4 flex items-center space-x-2">
                          <span>🗄️</span>
                          <span>Backend</span>
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Oracle Database</div>
                            <div className="text-sm text-gray-600 mb-2">Enterprise relational database</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">ACID</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">PL/SQL</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Partitioning</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">Microsoft Dataverse</div>
                            <div className="text-sm text-gray-600 mb-2">Cloud-based data platform</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">OData</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Power Platform</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Security</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">AWS DynamoDB</div>
                            <div className="text-sm text-gray-600 mb-2">NoSQL document database</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Serverless</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Auto-scaling</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Global Tables</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="font-semibold text-gray-900 mb-2">GraphQL APIs</div>
                            <div className="text-sm text-gray-600 mb-2">Query language and runtime</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Type System</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Introspection</span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Federation</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Integration Patterns</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">API Integration</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>• GraphQL over HTTP/HTTPS</div>
                            <div>• RESTful OData WebAPI</div>
                            <div>• OAuth 2.0 authentication</div>
                            <div>• JSON data exchange format</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Data Access Patterns</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>• Repository pattern for data access</div>
                            <div>• Connection pooling and management</div>
                            <div>• Caching strategies at multiple levels</div>
                            <div>• Error handling and retry mechanisms</div>
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
