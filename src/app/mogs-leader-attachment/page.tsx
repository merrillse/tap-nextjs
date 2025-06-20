'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ExpandMore, 
  ExpandLess, 
  AttachFile, 
  CheckCircle, 
  Warning, 
  FileDownload, 
  AccessTime, 
  Description,
  Info,
  Security,
  Person
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentConfigSafe, getDefaultEnvironment } from '@/lib/environments';

// Types based on the GraphQL schema
interface DocumentType {
  id: string;
  description?: string;
  noteType?: boolean;
  attachmentType?: boolean;
  addPermissionId?: number;
  deletePermissionId?: number;
  editPermissionId?: number;
  viewPermissionId?: number;
  confidential?: boolean;
}

interface LeaderAttachment {
  id: string;
  cmisId?: number;
  documentType?: DocumentType;
  title?: string;
  sourceFileLocation?: string;
  fileType?: string;
  fileSize?: number;
  fileContent?: string;
  createDate?: string;
  createdBy?: string;
  updateDate?: string;
  updatedBy?: string;
}

interface SearchHistoryItem {
  id: string;
  timestamp: string;
  found: boolean;
}

const LEADER_ATTACHMENT_QUERY = `
  query LeaderAttachmentQuery($id: ID!) {
    leaderAttachment(id: $id) {
      id
      cmisId
      documentType {
        id
        description
        noteType
        attachmentType
        addPermissionId
        deletePermissionId
        editPermissionId
        viewPermissionId
        confidential
      }
      title
      sourceFileLocation
      fileType
      fileSize
      fileContent
      createDate
      createdBy
      updateDate
      updatedBy
    }
  }
`;

export default function MOGSLeaderAttachmentPage() {
  const [attachmentId, setAttachmentId] = useState('');
  const [attachment, setAttachment] = useState<LeaderAttachment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'metadata', 'permissions']));

  const resultRef = useRef<HTMLDivElement>(null);

  // Initialize API client
  useEffect(() => {
    try {
      const { config, key } = getEnvironmentConfigSafe(selectedEnvironment, 'mogs');
      console.log(`Initializing API client for environment: ${key}`);
      setApiClient(new ApiClient(config, key));
      setError(null);
      
      // Update selected environment if it was corrected
      if (key !== selectedEnvironment) {
        setSelectedEnvironment(key);
      }
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize API client');
      setApiClient(null);
    }
  }, [selectedEnvironment]);

  // Load search history on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('mogs-leader-attachment-search-history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history);
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (id: string, found: boolean) => {
    const newEntry: SearchHistoryItem = {
      id: id,
      timestamp: new Date().toLocaleString(),
      found: found
    };
    
    const updatedHistory = [newEntry, ...searchHistory.filter(item => item.id !== id).slice(0, 9)]; // Keep last 10 unique searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-leader-attachment-search-history', JSON.stringify(updatedHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-leader-attachment-search-history');
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSearch = async () => {
    if (!attachmentId.trim()) {
      setError('Please enter a Leader Attachment ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please wait a moment or try refreshing the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setAttachment(null);

    try {
      const variables = { id: attachmentId.trim() };
      const response = await apiClient.executeGraphQLQuery(LEADER_ATTACHMENT_QUERY, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const result = response.data as { leaderAttachment: LeaderAttachment };
      
      if (result.leaderAttachment) {
        setAttachment(result.leaderAttachment);
        saveSearchHistory(attachmentId.trim(), true);
        
        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError('Leader Attachment not found');
        saveSearchHistory(attachmentId.trim(), false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      saveSearchHistory(attachmentId.trim(), false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const exportToJson = () => {
    if (!attachment) return;

    const dataStr = JSON.stringify(attachment, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `leader-attachment-${attachment.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatBoolean = (val?: boolean) => {
    if (val === undefined || val === null) return 'N/A';
    return val ? 'Yes' : 'No';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderSection = (title: string, sectionKey: string, icon: React.ReactNode, content: React.ReactNode) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left font-medium text-gray-900"
        >
          <div className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </div>
          {isExpanded ? (
            <ExpandLess className="h-5 w-5 text-gray-500" />
          ) : (
            <ExpandMore className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 py-3 bg-white">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MOGS Leader Attachment Search</h1>
        <p className="text-gray-600">Search for leader attachment information by ID in the Missionary Oracle Graph Service.</p>
      </div>

      {/* Environment Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <label htmlFor="environment" className="text-sm font-medium text-gray-700">Environment:</label>
          <select
            id="environment"
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mogs-gql-dev">MOGS Development</option>
            <option value="mogs-gql-local">MOGS Local</option>
            <option value="mogs-gql-prod">MOGS Production</option>
          </select>
          {apiClient ? (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Connected
            </span>
          ) : (
            <span className="text-sm text-yellow-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Initializing...
            </span>
          )}
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="attachmentId" className="block text-sm font-medium text-gray-700 mb-2">
              Leader Attachment ID
            </label>
            <input
              type="text"
              id="attachmentId"
              value={attachmentId}
              onChange={(e) => setAttachmentId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter leader attachment ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <AttachFile className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <AccessTime className="h-5 w-5" />
              <span>Search History</span>
            </h3>
            {showHistory ? (
              <ExpandLess className="h-5 w-5 text-gray-500" />
            ) : (
              <ExpandMore className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {showHistory && (
            <div className="mt-4">
              <div className="flex justify-end mb-2">
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Clear History
                </button>
              </div>
              <div className="space-y-2">
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                    onClick={() => setAttachmentId(item.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {item.found ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Warning className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono text-sm">{item.id}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Warning className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {attachment && (
        <div ref={resultRef} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <AttachFile className="h-6 w-6" />
                <span>Leader Attachment: {attachment.title || attachment.id}</span>
              </h2>
              <button
                onClick={exportToJson}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
              >
                <FileDownload className="h-4 w-4" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Basic Information */}
            {renderSection(
              'Basic Information',
              'basic',
              <AttachFile className="h-5 w-5 text-blue-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">ID</span>
                  <p className="font-mono text-sm">{attachment.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">CMIS ID</span>
                  <p className="text-sm">{attachment.cmisId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Title</span>
                  <p className="text-sm font-medium">{attachment.title || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">File Type</span>
                  <p className="text-sm font-mono">{attachment.fileType || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">File Size</span>
                  <p className="text-sm">{formatFileSize(attachment.fileSize)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Source File Location</span>
                  <p className="text-sm break-all">{attachment.sourceFileLocation || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* File Content */}
            {attachment.fileContent && renderSection(
              'File Content',
              'content',
              <Description className="h-5 w-5 text-green-500" />,
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Content Type</span>
                  <p className="text-sm">
                    {attachment.fileContent.startsWith('data:') ? 'Base64 Encoded File' : 'Text Content'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Content Preview</span>
                  {attachment.fileContent.startsWith('data:') ? (
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <p className="text-sm text-gray-600">
                        Base64 encoded file data ({attachment.fileContent.length} characters)
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {attachment.fileContent.substring(0, 100)}...
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-gray-50 rounded border max-h-64 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">{attachment.fileContent}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Type & Metadata */}
            {attachment.documentType && renderSection(
              'Document Type & Metadata',
              'metadata',
              <Info className="h-5 w-5 text-purple-500" />,
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Document Type ID</span>
                    <p className="font-mono text-sm">{attachment.documentType.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description</span>
                    <p className="text-sm">{attachment.documentType.description || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Note Type</span>
                    <p className="text-sm">{formatBoolean(attachment.documentType.noteType)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Attachment Type</span>
                    <p className="text-sm">{formatBoolean(attachment.documentType.attachmentType)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Confidential</span>
                    <p className="text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        attachment.documentType.confidential 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {formatBoolean(attachment.documentType.confidential)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Permissions */}
            {attachment.documentType && (
              attachment.documentType.addPermissionId || 
              attachment.documentType.deletePermissionId || 
              attachment.documentType.editPermissionId || 
              attachment.documentType.viewPermissionId
            ) && renderSection(
              'Permissions',
              'permissions',
              <Security className="h-5 w-5 text-orange-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Add Permission ID</span>
                  <p className="text-sm">{attachment.documentType.addPermissionId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Delete Permission ID</span>
                  <p className="text-sm">{attachment.documentType.deletePermissionId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Edit Permission ID</span>
                  <p className="text-sm">{attachment.documentType.editPermissionId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">View Permission ID</span>
                  <p className="text-sm">{attachment.documentType.viewPermissionId || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Audit Information */}
            {renderSection(
              'Audit Information',
              'audit',
              <Person className="h-5 w-5 text-gray-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Created By</span>
                  <p className="text-sm">{attachment.createdBy || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Create Date</span>
                  <p className="text-sm">{formatDate(attachment.createDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Updated By</span>
                  <p className="text-sm">{attachment.updatedBy || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Update Date</span>
                  <p className="text-sm">{formatDate(attachment.updateDate)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
