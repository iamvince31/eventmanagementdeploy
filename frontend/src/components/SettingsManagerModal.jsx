import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SettingsManagerModal({ isOpen, onClose, onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    departments: [],
    ceit_roles: [],
    department_roles: [],
    ceit_officer_types: []
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [activeTab, setActiveTab] = useState('departments');
  const [newItem, setNewItem] = useState('');

  const tabs = [
    { id: 'departments', label: 'Departments' },
    { id: 'ceit_roles', label: 'CEIT Roles' },
    { id: 'department_roles', label: 'Department Roles' },
    { id: 'ceit_officer_types', label: 'CEIT Officer Types' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings');
      setSettings({
        departments: response.data.departments || [],
        ceit_roles: response.data.ceit_roles || [],
        department_roles: response.data.department_roles || [],
        ceit_officer_types: response.data.ceit_officer_types || []
      });
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    setSettings(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newItem.trim()]
    }));
    setNewItem('');
  };

  const handleRemoveItem = (index) => {
    setSettings(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (key) => {
    setSavingKey(key);
    try {
      // Send the complete array (including defaults that are already merged in the backend)
      await api.put(`/settings/${key}`, { value: settings[key] });
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (error) {
      console.error(`Failed to save ${key}`, error);
      alert('Failed to save settings');
    } finally {
      setSavingKey(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">System Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Manage dynamic dropdown options for users and roles</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 flex-1">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
            {/* Tabs Sidebar */}
            <div className="w-full md:w-48 flex flex-col gap-2 shrink-0 overflow-y-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setNewItem(''); }}
                  className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h4>
                <button
                  onClick={() => handleSave(activeTab)}
                  disabled={savingKey === activeTab}
                  className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {savingKey === activeTab ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>

              {/* Add New Item */}
              <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Enter new item name..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  disabled={!newItem.trim()}
                  className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </form>

              {/* List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {settings[activeTab].length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No items found.</p>
                ) : (
                  settings[activeTab].map((item, index) => {
                    // Define default values for each tab
                    const defaultItems = {
                      departments: [
                        'College of Engineering and Information Technology',
                        'Department of Information Technology',
                        'Department of Industrial Engineering and Technology',
                        'Department of Computer, Electronics, and Electrical Engineering',
                        'Department of Civil Engineering and Architecture',
                        'Department of Agriculture and Food Engineering',
                      ],
                      ceit_roles: ['Dean', 'CEIT Official', 'Faculty Member'],
                      department_roles: ['Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator', 'Faculty Member'],
                      ceit_officer_types: [] // No defaults
                    };
                    
                    const isDefault = defaultItems[activeTab]?.includes(item) || false;
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-800 break-words">{item}</span>
                          {isDefault && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0 ml-2"
                          title="Remove item"
                          disabled={isDefault}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-gray-500 mt-4 italic">* Remember to click "Save Changes" after adding or removing items before switching tabs.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
