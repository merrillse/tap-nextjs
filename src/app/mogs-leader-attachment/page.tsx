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
                  <span className="text-sm font-medium text-gray-500">File Preview</span>
                  {attachment.fileContent.startsWith('data:') ? (
                    <div className="mt-2">
                      {(() => {
                        const fileType = attachment.fileType?.toLowerCase() || '';
                        const isBase64DataUrl = attachment.fileContent.includes(',');
                        const base64Data = isBase64DataUrl ? attachment.fileContent : `data:${fileType};base64,${attachment.fileContent}`;
                        
                        // Function to detect file type from Base64 magic numbers
                        const detectFileTypeFromBase64 = (base64String: string): string => {
                          try {
                            const base64Content = isBase64DataUrl ? base64String.split(',')[1] : base64String;
                            const binaryString = atob(base64Content.substring(0, 50)); // Just check first few bytes
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                              bytes[i] = binaryString.charCodeAt(i);
                            }
                            
                            // PDF magic number: %PDF
                            if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
                              return 'pdf';
                            }
                            
                            // JPEG magic numbers: FF D8 FF
                            if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
                              return 'jpeg';
                            }
                            
                            // PNG magic number: 89 50 4E 47
                            if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
                              return 'png';
                            }
                            
                            // GIF magic numbers: GIF87a or GIF89a
                            if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
                              return 'gif';
                            }
                            
                            // BMP magic number: BM
                            if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
                              return 'bmp';
                            }
                            
                            // ZIP/Office documents: PK
                            if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
                              return 'zip';
                            }
                            
                            // Check if it's likely text (printable ASCII)
                            let textCount = 0;
                            for (let i = 0; i < Math.min(bytes.length, 100); i++) {
                              if ((bytes[i] >= 32 && bytes[i] <= 126) || bytes[i] === 9 || bytes[i] === 10 || bytes[i] === 13) {
                                textCount++;
                              }
                            }
                            if (textCount / Math.min(bytes.length, 100) > 0.8) {
                              return 'text';
                            }
                            
                            return 'binary';
                          } catch (e) {
                            console.error('Failed to detect file type:', e);
                            return 'unknown';
                          }
                        };
                        
                        const detectedType = detectFileTypeFromBase64(attachment.fileContent);
                        const combinedType = fileType || detectedType;
                        
                        // PDF files
                        if (combinedType.includes('pdf') || base64Data.includes('data:application/pdf') || detectedType === 'pdf') {
                          const pdfData = base64Data.includes('data:') ? base64Data : `data:application/pdf;base64,${attachment.fileContent}`;
                          return (
                            <div className="space-y-3">
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                                <span className="text-xs text-blue-700 font-medium">📄 PDF Document Detected</span>
                              </div>
                              <iframe
                                src={pdfData}
                                className="w-full h-96 border border-gray-300 rounded"
                                title="PDF Preview"
                              />
                              <div className="flex space-x-2">
                                <a
                                  href={pdfData}
                                  download={`${attachment.title || 'document'}.pdf`}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <FileDownload className="h-4 w-4 mr-1" />
                                  Download PDF
                                </a>
                                <button
                                  onClick={() => window.open(pdfData, '_blank')}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Open in New Tab
                                </button>
                              </div>
                            </div>
                          );
                        }
                        
                        // Image files
                        if (combinedType.includes('image') || combinedType.includes('jpg') || combinedType.includes('jpeg') || 
                            combinedType.includes('png') || combinedType.includes('gif') || combinedType.includes('bmp') ||
                            base64Data.includes('data:image/') || ['jpeg', 'png', 'gif', 'bmp'].includes(detectedType)) {
                          const imageType = detectedType === 'jpeg' ? 'jpeg' : detectedType === 'png' ? 'png' : detectedType === 'gif' ? 'gif' : detectedType === 'bmp' ? 'bmp' : 'jpeg';
                          const imageData = base64Data.includes('data:') ? base64Data : `data:image/${imageType};base64,${attachment.fileContent}`;
                          return (
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                                <span className="text-xs text-green-700 font-medium">🖼️ {detectedType.toUpperCase()} Image Detected</span>
                              </div>
                              <div className="flex justify-center">
                                <img
                                  src={imageData}
                                  alt={attachment.title || 'Image'}
                                  className="max-w-full max-h-96 rounded border shadow-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3';
                                    errorDiv.textContent = 'Unable to display image. The file data may be corrupted.';
                                    target.parentElement?.appendChild(errorDiv);
                                  }}
                                />
                              </div>
                              <div className="flex space-x-2 justify-center">
                                <a
                                  href={imageData}
                                  download={`${attachment.title || 'image'}.${imageType}`}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <FileDownload className="h-4 w-4 mr-1" />
                                  Download Image
                                </a>
                              </div>
                            </div>
                          );
                        }
                        
                        // Text-based files (JSON, XML, CSV, TXT, etc.)
                        if (combinedType.includes('text') || combinedType.includes('json') || combinedType.includes('xml') || 
                            combinedType.includes('csv') || combinedType.includes('txt') || combinedType.includes('html') || detectedType === 'text') {
                          try {
                            const textContent = isBase64DataUrl ? 
                              atob(base64Data.split(',')[1]) : 
                              atob(attachment.fileContent);
                            return (
                              <div className="space-y-3">
                                <div className="bg-purple-50 border border-purple-200 rounded p-2 mb-2">
                                  <span className="text-xs text-purple-700 font-medium">📝 Text Content Detected</span>
                                </div>
                                <div className="mt-2 p-3 bg-gray-50 rounded border max-h-96 overflow-y-auto">
                                  <pre className="text-sm whitespace-pre-wrap">{textContent}</pre>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      const blob = new Blob([textContent], { type: combinedType || 'text/plain' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `${attachment.title || 'document'}.${combinedType?.split('/')[1] || 'txt'}`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    <FileDownload className="h-4 w-4 mr-1" />
                                    Download File
                                  </button>
                                </div>
                              </div>
                            );
                          } catch (e) {
                            console.error('Failed to decode text content:', e);
                          }
                        }
                        
                        // ZIP/Office documents
                        if (detectedType === 'zip' || combinedType.includes('zip') || combinedType.includes('office') || 
                            combinedType.includes('document') || combinedType.includes('spreadsheet') || combinedType.includes('presentation')) {
                          return (
                            <div className="space-y-3">
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                                <span className="text-xs text-yellow-700 font-medium">📦 Archive/Office Document Detected</span>
                              </div>
                              <div className="mt-2 p-3 bg-gray-50 rounded border">
                                <div className="flex items-center space-x-2 mb-2">
                                  <AttachFile className="h-5 w-5 text-gray-500" />
                                  <span className="text-sm font-medium">Office Document or Archive</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  File Type: {attachment.fileType || 'Archive/Office Document'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Size: {formatFileSize(attachment.fileSize)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  This appears to be a compressed archive or Microsoft Office document.
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={base64Data.includes('data:') ? base64Data : `data:application/octet-stream;base64,${attachment.fileContent}`}
                                  download={`${attachment.title || 'document'}.${combinedType?.split('/')[1] || (detectedType === 'zip' ? 'zip' : 'bin')}`}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  <FileDownload className="h-4 w-4 mr-1" />
                                  Download File
                                </a>
                              </div>
                            </div>
                          );
                        }
                        
                        // Generic binary file
                        return (
                          <div className="space-y-3">
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-2">
                              <span className="text-xs text-gray-700 font-medium">
                                🔍 {detectedType === 'unknown' ? 'Unknown File Type' : `${detectedType.toUpperCase()} File Detected`}
                              </span>
                            </div>
                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                              <div className="flex items-center space-x-2 mb-2">
                                <AttachFile className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium">Binary File</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                File Type: {attachment.fileType || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Detected Type: {detectedType}
                              </p>
                              <p className="text-sm text-gray-600">
                                Size: {formatFileSize(attachment.fileSize)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Base64 Data Length: {attachment.fileContent.length} characters
                              </p>
                              <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                                {attachment.fileContent.substring(0, 100)}...
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <a
                                href={base64Data.includes('data:') ? base64Data : `data:application/octet-stream;base64,${attachment.fileContent}`}
                                download={`${attachment.title || 'file'}.${combinedType?.split('/')[1] || 'bin'}`}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                              >
                                <FileDownload className="h-4 w-4 mr-1" />
                                Download File
                              </a>
                            </div>
                          </div>
                        );
                      })()}
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
