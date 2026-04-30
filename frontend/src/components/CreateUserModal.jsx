import { useState } from 'react';
import api from '../services/api';

const CEIT_OFFICER_TYPES = [
  'College Secretary',
  'College Inspector',
  'College Budget Officer',
  'College Registrar',
  'Assistant College Registrar',
  'Records Custodian',
  'College MIS',
  'ILCLO',
  'Coordinator, Research Services',
  'Coordinator, Graduate Programs',
  'Coordinator, Research Monitoring and Evaluation Unit',
  'Coordinator, Extension Services',
  'Coordinator, Extension Monitoring and Evaluation Unit',
  'College OJT Coordinator',
  'Coordinator, College Quality Assurance and Accreditation',
  'Asst. Coordinator, College Quality Assurance and Accreditation',
  'Coordinator, Knowledge Management Unit',
  'Coordinator, Gender and Development Program',
  'Coordinator, Gender and Development Program (alternate)',
  'Coordinator, Sports Development',
  'Coordinator, Socio-cultural Development',
  'Coordinator, Continuous Quality Improvement (CQI)',
  'College Public Information Officer',
  'Coordinator, Pollution Control',
  'College Review Coordinator for BSABE and BSCE',
  'College Review Coordinator for BSECE and BSEE',
  'College Guidance Facilitator for BSABE, BSIT, BSCS, and Architecture Programs',
  'College Guidance Facilitator for BSCE, BSECE, BSEE, BSCpE, BSIE and BIT programs',
  'College Job Placement Officer',
  'College Property Custodian',
  'College Canvasser',
  'In-charge, College Reading Room',
  'In-charge, Material Testing Laboratory',
  'College Civil Security Officer',
  'College Safety Officer',
  'In-charge, Simulation and Math Laboratory',
  'Head, CCL and Technical Support Services Unit',
  'University Web Master',
  'In-charge, e-Learning Team',
];

export default function CreateUserModal({ isOpen, onClose, onSuccess, deanExists = false }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    password: '',
    department: 'College of Engineering and Information Technology',
    designation: 'Faculty Member',
    ceit_officer_type: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [officerSearch, setOfficerSearch] = useState('');

  const departments = [
    'College of Engineering and Information Technology',
    'Department of Information Technology',
    'Department of Industrial Engineering and Technology',
    'Department of Computer, Electronics, and Electrical Engineering',
    'Department of Civil Engineering and Architecture',
    'Department of Agriculture and Food Engineering',
  ];

  const CEIT_ROLES = ['Dean', 'CEIT Official', 'Faculty Member'];
  const DEPT_ROLES = ['Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator', 'Faculty Member'];

  const getDesignationsForDepartment = (dept) => {
    if (!dept) return [...CEIT_ROLES, ...DEPT_ROLES];
    if (dept === 'College of Engineering and Information Technology') return CEIT_ROLES;
    return DEPT_ROLES;
  };

  const availableDesignations = getDesignationsForDepartment(formData.department)
    .filter(r => !(r === 'Dean' && deanExists));

  const filteredOfficerTypes = CEIT_OFFICER_TYPES.filter(t =>
    t.toLowerCase().includes(officerSearch.toLowerCase())
  );

  const generateFullName = () => {
    const cap = (text) => text.split(' ').map(w => w.trim()).filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const firstName = cap(formData.first_name);
    const middleName = formData.middle_name ? ' ' + cap(formData.middle_name) : '';
    const lastName = cap(formData.last_name);
    return (firstName + middleName + ' ' + lastName).trim();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'department') {
        const valid = getDesignationsForDepartment(value);
        if (!valid.includes(updated.designation)) updated.designation = valid[0] || '';
        updated.ceit_officer_type = '';
      }
      if (name === 'designation') updated.ceit_officer_type = '';
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    if (value.trim()) {
      const cap = value.split(' ').map(w => w.trim()).filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      setFormData(prev => ({ ...prev, [name]: cap }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!formData.email.endsWith('@cvsu.edu.ph')) {
      setErrors({ email: ['Email must be a @cvsu.edu.ph address'] });
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setErrors({ password: ['Password must be at least 8 characters'] });
      setLoading(false);
      return;
    }
    if (formData.designation === 'CEIT Official' && !formData.ceit_officer_type) {
      setErrors({ ceit_officer_type: ['Please select an officer type'] });
      setLoading(false);
      return;
    }

    try {
      await api.post('/users', {
        ...formData,
        name: generateFullName(),
        email: formData.email.trim(),
      });
      setFormData({ first_name: '', last_name: '', middle_name: '', email: '', password: '', department: 'College of Engineering and Information Technology', designation: 'Faculty Member', ceit_officer_type: '' });
      setOfficerSearch('');
      onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
      else setErrors({ general: err.response?.data?.error || err.response?.data?.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Create New User</h3>
            <p className="text-sm text-gray-600 mt-1">Add a new user to the system</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} onBlur={handleNameBlur} required placeholder="Enter first name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} onBlur={handleNameBlur} required placeholder="Enter last name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name[0]}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name <span className="text-gray-400">(Optional)</span></label>
            <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} onBlur={handleNameBlur} placeholder="Enter middle name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {(formData.first_name || formData.last_name) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-medium text-green-800 mb-1">Full Name Preview:</p>
              <p className="text-sm font-semibold text-green-900">{generateFullName()}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVSU Email Address <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="user@cvsu.edu.ph" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Minimum 8 characters" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
            <select name="department" value={formData.department} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
            {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation <span className="text-red-500">*</span></label>
            <select name="designation" value={formData.designation} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              {availableDesignations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.designation && <p className="mt-1 text-sm text-red-600">{errors.designation[0]}</p>}
          </div>

          {/* CEIT Officer Type — only shown when designation is CEIT Official */}
          {formData.designation === 'CEIT Official' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Officer Type <span className="text-red-500">*</span>
                <span className="ml-1 text-xs text-gray-400 font-normal">(specific CEIT role)</span>
              </label>
              <input
                type="text"
                placeholder="Search officer type..."
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-gray-50">
                {filteredOfficerTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setFormData(prev => ({ ...prev, ceit_officer_type: type })); setOfficerSearch(''); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-green-50 ${formData.ceit_officer_type === type ? 'bg-green-100 text-green-800 font-semibold' : 'text-gray-700'}`}
                  >
                    {type}
                  </button>
                ))}
                {filteredOfficerTypes.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">No matches found</p>
                )}
              </div>
              {formData.ceit_officer_type && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {formData.ceit_officer_type}
                  </span>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, ceit_officer_type: '' }))} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
                </div>
              )}
              {errors.ceit_officer_type && <p className="mt-1 text-sm text-red-600">{errors.ceit_officer_type[0]}</p>}
            </div>
          )}

          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
