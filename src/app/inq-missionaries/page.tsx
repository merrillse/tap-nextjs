'use client';

import { useState, useEffect } from 'react';
import { PlayIcon, DocumentDuplicateIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Environment {
  name: string;
  baseUrl: string;
  clientId: string;
  scope: string;
  description: string;
  envVarSuffix: string;
}

// OAuth2 Configuration
const OAUTH_CONFIG = {
  tenantId: '61e6eeb3-5fd7-4aaa-ae3c-61e8deb09b79',
  grantType: 'client_credentials',
  tokenUrl: 'https://login.microsoftonline.com/61e6eeb3-5fd7-4aaa-ae3c-61e8deb09b79/oauth2/v2.0/token'
};

const INQ_ENVIRONMENTS: Environment[] = [
  {
    name: 'Dev',
    baseUrl: 'https://inq-dev.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-dev.crm.dynamics.com/.default',
    description: 'Development environment for testing and integration',
    envVarSuffix: 'DEV'
  },
  {
    name: 'Test',
    baseUrl: 'https://inq-test.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-test.crm.dynamics.com/.default',
    description: 'Test environment for validation and QA',
    envVarSuffix: 'TEST'
  },
  {
    name: 'Stage',
    baseUrl: 'https://inq-stage.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-stage.crm.dynamics.com/.default',
    description: 'Staging environment for pre-production testing',
    envVarSuffix: 'STAGE'
  },
  {
    name: 'Prod',
    baseUrl: 'https://inq.api.crm.dynamics.com/api/data/v9.2',
    clientId: '5e6b7d0b-7247-429b-b8c1-d911d8f13d40',
    scope: 'https://inq.crm.dynamics.com/.default',
    description: 'Production environment for live data',
    envVarSuffix: 'PROD'
  }
];

const SAMPLE_MISSIONARY = {
  "@odata.context": "https://inq-dev.api.crm.dynamics.com/api/data/v9.2/$metadata#inq_missionaries",
  "value": [
    {
      "@odata.etag": "W/\"775947911\"",
      "inq_missionaryid": "a106e921-ee4d-f011-8779-000d3a3113ca",
      "inq_name": "Gracia, William Robert (202139)",
      "inq_missionarynumber": "202139",
      "inq_calculatedstatus": "In-field",
      "inq_startdate": "2025-08-15",
      "inq_calculatedreleasedate": "2027-08-15",
      "inq_officiallastname": "Gracia",
      "inq_officialfirstname": "William",
      "inq_officialmiddlename": "Robert",
      "inq_personalemail": "williamgracia2106@gmail.com",
      "inq_mobilephone": "(310) 818-1732",
      "inq_homephone": "(310) 291-8404",
      "inq_birthdate": "2006-02-01T00:00:00Z",
      "inq_age": "19y, 4m",
      "inq_gender": 447160000,
      "inq_primarylanguage": 0,
      "inq_comp": "English SerMis Eld",
      "inq_calllength": 24,
      "inq_missionarytype": 1,
      "_inq_assignmentlocation_value": "a34c8f79-cfa0-ec11-b400-000d3a3597b5",
      "inq_homeunitname": "Redondo  2nd Ward (20877)",
      "inq_parentunitname": "Torrance California North Stake (502391)",
      "inq_membershipmission": "California Los Angeles Mission (2011107)",
      "inq_homeaddressstreet1": "20560 Anza Ave. apt 1",
      "inq_homeaddresscity": "Torrance",
      "inq_homeaddressstateprovence": "CA",
      "inq_homeaddresszippostalcode": "90503",
      "inq_totalfunding": 400.0000,
      "inq_familyfunding": 400.0000,
      "inq_equalizedyn": true,
      "inq_concatfundingunitfinanceinfo": "Equalized/MSF/400/USD",
      "inq_legacycmisid": "18589018551",
      "inq_ldsaccountid": "3788468155195441",
      "inq_medicallycleared": 121640002,
      "inq_immunizationstatus": 121640002,
      "statuscode": 447160013,
      "statecode": 0,
      "createdon": "2025-06-20T15:43:53Z",
      "modifiedon": "2025-06-20T15:58:12Z"
    }
  ]
};

export default function INQMissionariesPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(INQ_ENVIRONMENTS[0]);
  const [queryUrl, setQueryUrl] = useState('inq_missionaries?$top=10');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [showSample, setShowSample] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [secretStatus, setSecretStatus] = useState<{ [key: string]: boolean }>({});
  const [realData, setRealData] = useState<any>(null);
  const [showDataVisualization, setShowDataVisualization] = useState(false);

  // Check secret status via API endpoint (server-side only)
  const checkSecretStatus = async (environment: Environment) => {
    try {
      const response = await fetch(`/api/inq-secret-status?env=${environment.envVarSuffix}`);
      const data = await response.json();
      return data.hasSecret;
    } catch (error) {
      console.error('Error checking secret status:', error);
      return false;
    }
  };

  // Load secret status when environment changes
  const loadSecretStatus = async () => {
    const hasSecret = await checkSecretStatus(selectedEnvironment);
    setSecretStatus(prev => ({
      ...prev,
      [selectedEnvironment.envVarSuffix]: hasSecret
    }));
  };

  // Effect to load secret status when environment changes
  useEffect(() => {
    const loadStatus = async () => {
      const hasSecret = await checkSecretStatus(selectedEnvironment);
      setSecretStatus(prev => ({
        ...prev,
        [selectedEnvironment.envVarSuffix]: hasSecret
      }));
    };
    loadStatus();
  }, [selectedEnvironment]);

  // Check if client secret is available (without exposing the actual value)
  const getClientSecretStatus = () => {
    return secretStatus[selectedEnvironment.envVarSuffix] || false;
  };

  const buildFullUrl = () => {
    return `${selectedEnvironment.baseUrl}/${queryUrl}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateBasicAuthHeader = () => {
    const hasSecret = getClientSecretStatus();
    if (!hasSecret) return 'Basic <base64(clientId:clientSecret)>';
    // In production, this would be generated server-side to avoid exposing secrets
    return 'Basic <base64(clientId:clientSecret)>';
  };

  const executeQuery = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      // Check secret status in real-time
      const hasSecret = await checkSecretStatus(selectedEnvironment);
      
      if (!hasSecret) {
        setResponse(`❌ ERROR: Client Secret Not Found

Environment Variable Missing: INQ_CLIENT_SECRET_${selectedEnvironment.envVarSuffix}

🔧 SETUP INSTRUCTIONS:
To execute real queries, set the environment variable:

1. Stop the development server (Ctrl+C)
2. Set the environment variable:
   export INQ_CLIENT_SECRET_${selectedEnvironment.envVarSuffix}="your_actual_secret"
3. Restart the server:
   npm run dev

📋 ALTERNATIVE: Create .env.local (for testing only):
Add this line to .env.local:
INQ_CLIENT_SECRET_${selectedEnvironment.envVarSuffix}=your_actual_secret

⚠️  REMEMBER: Remove .env.local after testing for security!

🌐 CURRENT ENVIRONMENT: ${selectedEnvironment.name}
🔗 TARGET URL: ${buildFullUrl()}`);
        return;
      }

      // Update cached status
      setSecretStatus(prev => ({
        ...prev,
        [selectedEnvironment.envVarSuffix]: hasSecret
      }));

      // Execute real OData query
      setResponse('🔄 Authenticating and executing query...\n\nStep 1: Getting OAuth2 access token...');
      
      const queryResponse = await fetch('/api/inq/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: selectedEnvironment.envVarSuffix,
          query: queryUrl
        })
      });

      const result = await queryResponse.json();

      if (!queryResponse.ok) {
        setResponse(`❌ QUERY EXECUTION FAILED

Error: ${result.error}
Status: ${result.status || queryResponse.status}
Details: ${JSON.stringify(result.details, null, 2)}

🔧 Troubleshooting:
- Verify client secret is correct for ${selectedEnvironment.name} environment
- Check that the OData query syntax is valid
- Ensure the API endpoint is accessible
- Verify network connectivity

🌐 Environment: ${selectedEnvironment.name}
🔗 Query URL: ${result.query || buildFullUrl()}
📅 Timestamp: ${new Date().toLocaleString()}`);
        return;
      }

      // Format successful response
      const formattedResponse = `✅ REAL QUERY EXECUTION SUCCESSFUL

🌐 Environment: ${result.environment} (${selectedEnvironment.name})
📊 Records Retrieved: ${result.recordCount}
${result.totalCount ? `📈 Total Available: ${result.totalCount}` : ''}
${result.hasNextPage ? '📄 Has More Pages: Yes' : '📄 Has More Pages: No'}
🕐 Executed At: ${new Date(result.timestamp).toLocaleString()}
🔗 Query URL: ${result.queryUrl}

📋 RESPONSE METADATA:
${JSON.stringify({
  success: result.success,
  environment: result.environment,
  recordCount: result.recordCount,
  totalCount: result.totalCount,
  hasNextPage: result.hasNextPage,
  timestamp: result.timestamp
}, null, 2)}

📊 SAMPLE DATA (First Record):
${result.data.value && result.data.value.length > 0 ? 
  JSON.stringify(result.data.value[0], null, 2) : 
  'No records found'}

${result.data.value && result.data.value.length > 1 ? 
  `\n... and ${result.data.value.length - 1} more record(s)` : ''}

${result.hasNextPage ? 
  `\n� Next Page URL: ${result.nextLink}` : ''}

🎉 Query completed successfully! Real data retrieved from ${selectedEnvironment.name} environment.`;

      setResponse(formattedResponse);
      
      // Store real data for visualization
      setRealData(result);
      setShowDataVisualization(true);

    } catch (error) {
      setResponse(`❌ UNEXPECTED ERROR

Error Details: ${error}

🔧 Troubleshooting:
- Check that the API endpoints are accessible
- Verify environment variables are set correctly
- Ensure development server was restarted after setting variables
- Check browser console for additional error details
- Verify network connectivity

🌐 Current Environment: ${selectedEnvironment.name}
🔗 Target URL: ${buildFullUrl()}
📅 Timestamp: ${new Date().toLocaleString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📊</span>
        <h1 className="text-2xl font-bold">INQ Missionaries</h1>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">OData Web API</span>
      </div>

      {/* Environment Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {INQ_ENVIRONMENTS.map((env) => (
            <button
              key={env.name}
              onClick={() => setSelectedEnvironment(env)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                selectedEnvironment.name === env.name
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold text-lg">{env.name}</div>
              <div className="text-sm text-gray-600 mt-1">{env.description}</div>
            </button>
          ))}
        </div>

        {/* Selected Environment Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Environment Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-600 font-medium">Base URL:</label>
              <div className="font-mono bg-white p-2 rounded border">{selectedEnvironment.baseUrl}</div>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Client ID:</label>
              <div className="font-mono bg-white p-2 rounded border flex items-center justify-between">
                <span>{selectedEnvironment.clientId}</span>
                <button
                  onClick={() => copyToClipboard(selectedEnvironment.clientId)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Scope:</label>
              <div className="font-mono bg-white p-2 rounded border">{selectedEnvironment.scope}</div>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Environment Variable:</label>
              <div className="bg-blue-50 border border-blue-200 p-2 rounded text-blue-800 font-mono text-xs">
                INQ_CLIENT_SECRET_{selectedEnvironment.envVarSuffix}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Token Authorization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🔐 Access Token Authorization</h2>
          <button
            onClick={() => setShowTokenDetails(!showTokenDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showTokenDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OAuth2 Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">OAuth 2.0 Configuration</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Grant Type:</div>
                <div className="col-span-2 font-mono">{OAUTH_CONFIG.grantType}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Tenant ID:</div>
                <div className="col-span-2 font-mono text-xs">{OAUTH_CONFIG.tenantId}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Token URL:</div>
                <div className="col-span-2 font-mono text-xs break-all">{OAUTH_CONFIG.tokenUrl}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Client ID:</div>
                <div className="col-span-2 font-mono text-xs flex items-center justify-between">
                  <span>{selectedEnvironment.clientId}</span>
                  <button
                    onClick={() => copyToClipboard(selectedEnvironment.clientId)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title="Copy Client ID"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Scope:</div>
                <div className="col-span-2 font-mono text-xs">{selectedEnvironment.scope}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Client Secret:</div>
                <div className="col-span-2">
                  {getClientSecretStatus() ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-sm">✓ Configured in environment</span>
                      <code className="text-xs bg-gray-200 px-1 rounded">INQ_CLIENT_SECRET_{selectedEnvironment.envVarSuffix}</code>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 text-sm">❌ Not configured</span>
                      <code className="text-xs bg-red-100 px-1 rounded">INQ_CLIENT_SECRET_{selectedEnvironment.envVarSuffix}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Headers */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Authentication Headers</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div>
                <div className="font-medium text-gray-600 mb-1">Basic Auth Header:</div>
                <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                  Authorization: {generateBasicAuthHeader()}
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-600 mb-1">Content-Type:</div>
                <div className="font-mono text-xs bg-white p-2 rounded border">
                  application/x-www-form-urlencoded
                </div>
              </div>
            </div>

            {showTokenDetails && (
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <div className="mb-2 text-gray-400"># Get OAuth2 access token</div>
                <div className="mb-2">curl -X POST \</div>
                <div className="mb-2 ml-2">'{OAUTH_CONFIG.tokenUrl}' \</div>
                <div className="mb-2 ml-2">-H 'Content-Type: application/x-www-form-urlencoded' \</div>
                <div className="mb-2 ml-2">-H 'Authorization: {generateBasicAuthHeader()}' \</div>
                <div className="mb-2 ml-2">-d 'grant_type={OAUTH_CONFIG.grantType}' \</div>
                <div className="ml-2">-d 'scope={selectedEnvironment.scope}'</div>
                
                <div className="mt-4 mb-2 text-gray-400"># Expected response:</div>
                <div className="ml-2">{"{"}</div>
                <div className="ml-4">"access_token": "&lt;jwt-token&gt;",</div>
                <div className="ml-4">"token_type": "Bearer",</div>
                <div className="ml-4">"expires_in": 3599</div>
                <div className="ml-2">{"}"}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Environment Setup Guide */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-900 mb-3">🛠️ Environment Setup Guide</h2>
        <div className="space-y-4 text-yellow-800 text-sm">
          <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
            <div className="font-semibold text-red-900 mb-1">🚨 Security Notice</div>
            <div className="text-red-800 text-xs">
              Do NOT store client secrets in .env.local or any project files! 
              This prevents accidental commits and protects secrets from AI coding assistants.
            </div>
          </div>
          
          <p><strong>Required Environment Variables:</strong></p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INQ_ENVIRONMENTS.map((env) => (
              <div key={env.name} className="bg-yellow-100 rounded p-3">
                <div className="font-semibold mb-1">{env.name} Environment:</div>
                <code className="text-xs bg-yellow-200 px-2 py-1 rounded block">
                  INQ_CLIENT_SECRET_{env.envVarSuffix}=your_secret_here
                </code>
              </div>
            ))}
          </div>
          
          <div className="bg-yellow-100 rounded p-3">
            <div className="font-semibold mb-2">Setup Methods:</div>
            <div className="space-y-2 text-xs">
              <div><strong>Local Development (Terminal):</strong></div>
              <div className="ml-2">
                <code className="bg-yellow-200 px-1 rounded">export INQ_CLIENT_SECRET_DEV="your_actual_secret"</code>
              </div>
              <div className="ml-2">
                <code className="bg-yellow-200 px-1 rounded">npm run dev</code>
              </div>
              
              <div className="mt-3"><strong>Production Deployment:</strong></div>
              <div className="ml-2">• AWS: Use Systems Manager Parameter Store or Secrets Manager</div>
              <div className="ml-2">• Azure: Use Key Vault or App Configuration</div>
              <div className="ml-2">• Vercel: Set in Project Settings → Environment Variables</div>
              <div className="ml-2">• Docker: Use --env-file or -e flags</div>
              
              <div className="mt-3"><strong>CI/CD:</strong></div>
              <div className="ml-2">• Set as encrypted environment variables in your CI/CD system</div>
              <div className="ml-2">• GitHub Actions: Use repository secrets</div>
              <div className="ml-2">• Azure DevOps: Use variable groups with secret variables</div>
            </div>
          </div>
        </div>
      </div>

      {/* Query Builder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">OData Query</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OData Query Path:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={queryUrl}
                onChange={(e) => setQueryUrl(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="inq_missionaries?$top=10"
              />
              <button
                onClick={() => copyToClipboard(buildFullUrl())}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Copy full URL"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Query Examples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Examples:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { name: 'Top 10', query: 'inq_missionaries?$top=10' },
                { name: 'By Missionary Number', query: "inq_missionaries?$filter=inq_missionarynumber eq '202139'" },
                { name: 'Select Key Fields', query: 'inq_missionaries?$select=inq_name,inq_missionarynumber,inq_calculatedstatus&$top=5' },
                { name: 'In-field Status', query: "inq_missionaries?$filter=inq_calculatedstatus eq 'In-field'&$top=5" },
                { name: 'Order by Name', query: 'inq_missionaries?$orderby=inq_name&$top=5' },
                { name: 'Recent Start Dates', query: 'inq_missionaries?$filter=inq_startdate ge 2025-01-01&$orderby=inq_startdate desc&$top=5' }
              ].map((example) => (
                <button
                  key={example.name}
                  onClick={() => setQueryUrl(example.query)}
                  className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs"
                >
                  <div className="font-medium text-blue-600">{example.name}</div>
                  <div className="font-mono text-gray-600 truncate">{example.query}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Full URL:</div>
            <div className="font-mono text-sm bg-white p-2 rounded border break-all">{buildFullUrl()}</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={executeQuery}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4" />
              {isLoading ? 'Executing...' : 'Execute Query'}
            </button>
            
            <button
              onClick={() => setShowSample(!showSample)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <EyeIcon className="h-4 w-4" />
              {showSample ? 'Hide' : 'Show'} Sample Data
            </button>

            <button
              onClick={() => {
                const status = getClientSecretStatus() ? '✅ Configured' : '❌ Not Set';
                setResponse(`🔍 SECRET STATUS CHECK

Environment: ${selectedEnvironment.name}
Variable: INQ_CLIENT_SECRET_${selectedEnvironment.envVarSuffix}
Status: ${status}

Current Time: ${new Date().toLocaleString()}
Query URL: ${buildFullUrl()}

${status.includes('✅') ? 
  '✅ Ready to execute queries!' : 
  '⚠️  Set the environment variable and restart the server to enable query execution.'}`);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              🔍 Check Status
            </button>

            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch('/api/inq/test-query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      environment: selectedEnvironment.envVarSuffix,
                      query: queryUrl
                    })
                  });
                  
                  const result = await response.json();
                  setRealData(result);
                  setShowDataVisualization(true);
                  setResponse(`🎭 DEMO MODE - Mock Data Visualization

This demonstrates the beautiful data visualization with sample data.

🌐 Environment: ${result.environment} (${selectedEnvironment.name})
📊 Records: ${result.recordCount}
📈 Total Available: ${result.totalCount}
🕐 Generated: ${new Date(result.timestamp).toLocaleString()}

✨ The table below shows how real data would be displayed!
🔗 Query: ${result.queryUrl}

Note: This is sample data for demonstration. Use a real client secret for live data.`);
                } catch (error) {
                  setResponse(`❌ Demo mode error: ${error}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
            >
              🎭 Demo Mode
            </button>
          </div>
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Query Response</h2>
            <button
              onClick={() => copyToClipboard(response)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded px-2 py-1"
              title="Copy response to clipboard"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              Copy
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <pre className="text-sm overflow-auto whitespace-pre-wrap max-h-96 font-mono">
              {response}
            </pre>
          </div>
          {(response.includes('"status": "SUCCESS"') || response.includes('✅ REAL QUERY EXECUTION SUCCESSFUL')) && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-lg">✅</span>
                <span className="font-semibold">
                  {response.includes('✅ REAL QUERY EXECUTION SUCCESSFUL') ? 'Live Data Retrieved!' : 'Simulation Complete!'}
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                {response.includes('✅ REAL QUERY EXECUTION SUCCESSFUL') 
                  ? 'Successfully executed real query against the INQ Dataverse API and retrieved live data!'
                  : 'This demonstrates what a successful API response would look like. The actual implementation would make real OAuth2 calls to get live data.'
                }
              </p>
            </div>
          )}
          {response.includes('❌ ERROR') && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-lg">❌</span>
                <span className="font-semibold">Setup Required</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                Environment variable needs to be configured. Follow the instructions above to set up authentication.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Real Data Visualization */}
      {realData && showDataVisualization && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Data Results</h2>
              <p className="text-sm text-gray-600">
                {realData.recordCount} record(s) from {realData.environment} environment
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(realData.data, null, 2))}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded px-2 py-1"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
                Copy JSON
              </button>
              <button
                onClick={() => setShowDataVisualization(false)}
                className="text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded px-2 py-1"
              >
                Hide
              </button>
            </div>
          </div>

          {realData.data.value && realData.data.value.length > 0 ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-800 text-sm font-medium">Records Retrieved</div>
                  <div className="text-blue-900 text-2xl font-bold">{realData.recordCount}</div>
                </div>
                {realData.totalCount && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 text-sm font-medium">Total Available</div>
                    <div className="text-green-900 text-2xl font-bold">{realData.totalCount}</div>
                  </div>
                )}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-purple-800 text-sm font-medium">Environment</div>
                  <div className="text-purple-900 text-lg font-bold">{realData.environment}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-orange-800 text-sm font-medium">More Pages</div>
                  <div className="text-orange-900 text-lg font-bold">{realData.hasNextPage ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-gray-50 rounded-lg p-4 overflow-hidden">
                <h3 className="font-semibold text-gray-900 mb-3">Missionary Records</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {realData.data.value.map((missionary: any, index: number) => (
                        <tr key={missionary.inq_missionaryid || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">
                              {missionary.inq_name || `${missionary.inq_officialfirstname || ''} ${missionary.inq_officiallastname || ''}`.trim() || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                            {missionary.inq_missionarynumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              missionary.inq_calculatedstatus === 'In-field' 
                                ? 'bg-green-100 text-green-800'
                                : missionary.inq_calculatedstatus === 'Released'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {missionary.inq_calculatedstatus || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {missionary.inq_startdate ? new Date(missionary.inq_startdate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {missionary.inq_personalemail ? (
                              <a href={`mailto:${missionary.inq_personalemail}`} className="text-blue-600 hover:text-blue-800">
                                {missionary.inq_personalemail}
                              </a>
                            ) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {missionary.inq_mobilephone || missionary.inq_homephone || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Info */}
              {realData.hasNextPage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">More Data Available</h4>
                      <p className="text-blue-700 text-sm">This query has additional pages of data.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (realData.nextLink) {
                          const url = new URL(realData.nextLink);
                          const pathAndQuery = url.pathname.split('/api/data/v9.2/')[1] + url.search;
                          setQueryUrl(pathAndQuery);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Load Next Page
                    </button>
                  </div>
                </div>
              )}

              {/* Raw JSON Data (Collapsible) */}
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-900 hover:text-gray-700">
                  View Raw JSON Data
                </summary>
                <div className="mt-3 bg-white rounded border p-3">
                  <pre className="text-xs overflow-auto max-h-96 text-gray-700">
                    {JSON.stringify(realData.data, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <div className="text-lg font-medium">No Data Found</div>
              <div className="text-sm">The query returned no results. Try adjusting your query parameters.</div>
            </div>
          )}
        </div>
      )}

      {/* Sample Data */}
      {showSample && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Response Data</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(SAMPLE_MISSIONARY, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">📚 INQ Dataverse API Documentation</h2>
        
        <div className="space-y-4 text-blue-800 text-sm">
          <div>
            <h3 className="font-semibold mb-2">🔐 Authentication</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Uses OAuth 2.0 Client Credentials flow</li>
              <li>Authenticate with Microsoft Azure AD</li>
              <li>Include access token in Authorization header: <code className="bg-blue-100 px-1 rounded">Bearer &lt;token&gt;</code></li>
              <li>Different client IDs for each environment (Prod has unique client ID)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🌐 OData Web API</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Standard OData v4.0 query syntax</li>
              <li>Base endpoint: <code className="bg-blue-100 px-1 rounded">/api/data/v9.2/</code></li>
              <li>Entity set: <code className="bg-blue-100 px-1 rounded">inq_missionaries</code></li>
              <li>Supports $filter, $select, $expand, $top, $skip, $orderby</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📊 Key Fields</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>inq_missionaryid:</strong> Unique missionary identifier</li>
              <li><strong>inq_missionarynumber:</strong> Public missionary number</li>
              <li><strong>inq_name:</strong> Full name (Last, First Middle)</li>
              <li><strong>inq_legacycmisid:</strong> Legacy CMIS ID for integration</li>
              <li><strong>inq_calculatedstatus:</strong> Current missionary status</li>
              <li><strong>inq_startdate / inq_calculatedreleasedate:</strong> Service dates</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🔍 Example Queries</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$top=10</code> - Get first 10 missionaries</li>
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$filter=inq_missionarynumber eq '202139'</code> - Find by missionary number</li>
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$select=inq_name,inq_missionarynumber,inq_calculatedstatus</code> - Select specific fields</li>
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$filter=inq_calculatedstatus eq 'In-field'</code> - Filter by status</li>
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$orderby=inq_startdate desc</code> - Order by start date</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📡 HTTP Request Example</h3>
            <div className="bg-blue-100 rounded p-3 font-mono text-xs">
              <div className="mb-2"><strong>GET</strong> {selectedEnvironment.baseUrl}/inq_missionaries?$top=10</div>
              <div><strong>Headers:</strong></div>
              <div className="ml-4">Authorization: Bearer &lt;access_token&gt;</div>
              <div className="ml-4">Accept: application/json</div>
              <div className="ml-4">OData-MaxVersion: 4.0</div>
              <div className="ml-4">OData-Version: 4.0</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🏢 Environments</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Dev:</strong> Development and integration testing</li>
              <li><strong>Test:</strong> Quality assurance and validation</li>
              <li><strong>Stage:</strong> Pre-production staging environment</li>
              <li><strong>Prod:</strong> Production environment with live data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
