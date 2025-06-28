import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface ResultsTableProps {
  paginationData: any;
  isDemoMode: boolean;
  copyToClipboard: (text: string) => void;
  goToFirstPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  goToLastPage: () => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  paginationData,
  isDemoMode,
  copyToClipboard,
  goToFirstPage,
  goToPreviousPage,
  goToNextPage,
  goToLastPage,
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    {/* Results Header */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Query Results
          {isDemoMode && <span className="ml-2 text-blue-600 text-sm">(Demo Data)</span>}
          {!isDemoMode && <span className="ml-2 text-green-600 text-sm">(Live Data)</span>}
        </h2>
        <p className="text-sm text-gray-600">
          Showing {((paginationData.currentPage - 1) * paginationData.pageSize) + 1} to{' '}
          {Math.min(paginationData.currentPage * paginationData.pageSize, paginationData.totalRecords || 0)}
          {paginationData.totalRecords ? ` of ${paginationData.totalRecords}` : ''} records
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => copyToClipboard(JSON.stringify(paginationData.data, null, 2))}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded px-2 py-1"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
          Copy JSON
        </button>
      </div>
    </div>
    {/* Pagination Controls */}
    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <button
          onClick={goToFirstPage}
          disabled={!paginationData.hasPreviousPage}
          className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronDoubleLeftIcon className="h-4 w-4" />
        </button>
        <button
          onClick={goToPreviousPage}
          disabled={!paginationData.hasPreviousPage}
          className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          Page {paginationData.currentPage}
          {paginationData.totalPages ? ` of ${paginationData.totalPages}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={goToNextPage}
          disabled={!paginationData.hasNextPage}
          className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        <button
          onClick={goToLastPage}
          disabled={!paginationData.hasNextPage || !paginationData.totalPages}
          className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Last page (not supported with skiptoken pagination)"
        >
          <ChevronDoubleRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
    {/* Data Table */}
    {paginationData.data.value && paginationData.data.value.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginationData.data.value.map((missionary: any, index: number) => (
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
                      : missionary.inq_calculatedstatus === 'Preparing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {missionary.inq_calculatedstatus || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {missionary.inq_startdate ? new Date(missionary.inq_startdate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {missionary.inq_personalemail ? (
                    <a href={`mailto:${missionary.inq_personalemail}`} className="text-purple-600 hover:text-purple-800">
                      {missionary.inq_personalemail}
                    </a>
                  ) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(missionary, null, 2))}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy record"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📭</div>
        <div className="text-lg font-medium">No Records Found</div>
        <div className="text-sm">Try adjusting your filters or search criteria.</div>
      </div>
    )}
    {/* Query Info */}
    <details className="mt-6 bg-gray-50 rounded-lg p-4">
      <summary className="cursor-pointer font-medium text-gray-900 hover:text-gray-700">
        View Query Details
      </summary>
      <div className="mt-3 space-y-2 text-sm">
        <div><strong>Query URL:</strong> <code className="bg-white px-1 rounded">{paginationData.queryUrl}</code></div>
        <div><strong>Environment:</strong> {paginationData.environment}</div>
        <div><strong>Timestamp:</strong> {new Date(paginationData.timestamp).toLocaleString()}</div>
      </div>
    </details>
  </div>
);

export default ResultsTable;
