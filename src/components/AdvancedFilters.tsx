import React from 'react';

interface Filter {
  name: string;
  filter: string;
}
interface Select {
  name: string;
  select: string;
}

interface AdvancedFiltersProps {
  COMMON_FILTERS: Filter[];
  COMMON_SELECTS: Select[];
  filter: string;
  setFilter: (f: string) => void;
  customFilter: string;
  setCustomFilter: (f: string) => void;
  select: string;
  setSelect: (s: string) => void;
  customSelect: string;
  setCustomSelect: (s: string) => void;
  setCurrentPage: (n: number) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  COMMON_FILTERS,
  COMMON_SELECTS,
  filter,
  setFilter,
  customFilter,
  setCustomFilter,
  select,
  setSelect,
  customSelect,
  setCustomSelect,
  setCurrentPage,
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Query Options</h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter ($filter)</label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {COMMON_FILTERS.map(f => (
              <button
                key={f.name}
                onClick={() => {
                  setFilter(f.filter);
                  setCustomFilter('');
                  setCurrentPage(1);
                }}
                className={`text-left p-2 rounded border text-xs ${
                  filter === f.filter && !customFilter
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Custom filter (e.g., inq_name eq 'Smith')"
            value={customFilter}
            onChange={e => {
              setCustomFilter(e.target.value);
              setFilter('');
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>
      {/* Select Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fields ($select)</label>
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            {COMMON_SELECTS.map(s => (
              <button
                key={s.name}
                onClick={() => {
                  setSelect(s.select);
                  setCustomSelect('');
                }}
                className={`text-left p-2 rounded border text-xs ${
                  select === s.select && !customSelect
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Custom select (e.g., inq_name,inq_missionarynumber)"
            value={customSelect}
            onChange={e => {
              setCustomSelect(e.target.value);
              setSelect('');
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>
    </div>
  </div>
);

export default AdvancedFilters;
