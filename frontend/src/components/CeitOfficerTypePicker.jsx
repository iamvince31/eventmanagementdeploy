import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Multi-select checkbox picker for CEIT Officer types.
 * Props:
 *   selected: string[]  — currently selected types
 *   onChange: (types: string[]) => void
 *   error?: string
 */
export default function CeitOfficerTypePicker({ selected = [], onChange, error }) {
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState([]);

  useEffect(() => {
    api.get('/settings').then(res => setTypes(res.data.ceit_officer_types || [])).catch(console.error);
  }, []);

  const filtered = types.filter(t =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (type) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Officer Type(s) <span className="text-red-500">*</span>
          <span className="ml-1 text-xs text-gray-400 font-normal">(select one or more)</span>
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search officer types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Checkbox list */}
      <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-gray-50">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-400">No matches found</p>
        ) : (
          filtered.map(type => (
            <label
              key={type}
              className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-green-50 ${selected.includes(type) ? 'bg-green-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected.includes(type)}
                onChange={() => toggle(type)}
                className="mt-0.5 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 flex-shrink-0"
              />
              <span className={`text-sm leading-snug ${selected.includes(type) ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                {type}
              </span>
            </label>
          ))
        )}
      </div>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map(type => (
            <span
              key={type}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200"
            >
              {type}
              <button
                type="button"
                onClick={() => toggle(type)}
                className="text-orange-500 hover:text-red-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Display component — shows CEIT Official badge + officer type pills.
 * Used in tables, modals, profile views.
 */
export function CeitOfficerTypeTags({ types, className = '' }) {
  if (!types || types.length === 0) return null;
  const list = Array.isArray(types) ? types : [types];
  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${className}`}>
      {list.map(type => (
        <span
          key={type}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200 leading-tight"
          title={type}
        >
          {type}
        </span>
      ))}
    </div>
  );
}
