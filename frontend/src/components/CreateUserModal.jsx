import { useState, useEffect } from 'react';
import api from '../services/api';
import CeitOfficerTypePicker from './CeitOfficerTypePicker';

export default function CreateUserModal({ isOpen, onClose, onSuccess, deanExists = false, users = [] }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    ceit_officer_type: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Dynamic lists from settings
  const [departments, setDepartments] = useState([]);
  const [allRoles, setAllRoles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      api.get('/settings').then(res => {
        const depts = res.data.departments || [];
        const designations = res.data.designations || [];
        // Merge all roles, deduplicate, keep Admin out of self-service
        const merged = [...new Set(designations)];

        setDepartments(depts);
        setAllRoles(merged);

        // Set defaults once loaded
        setFormData(prev => ({
          ...prev,
          department: prev.department || (depts.length > 0 ? depts[0] : '') || '',
          designation: prev.designation || (merged.length > 0 ? merged[0] : '') || '',
        }));
      }).catch(err => {
        console.error('Error fetching settings:', err);
        // If API fails, use empty arrays
        setDepartments([]);
        setAllRoles([]);

        setFormData(prev => ({
          ...prev,
          department: prev.department || '',
          designation: prev.designation || '',
        }));
      });
    }
  }, [isOpen]);

  // Check if chairperson exists for selected department
  const isChairpersonTaken = formData.department ? users.some(u =>
    u.department === formData.department &&
    (u.designation === 'Chairperson' || (u.designations || []).includes('Chairperson'))
  ) : false;

  const availableRoles = allRoles.filter(r =>
    r !== 'Admin' &&
    (!deanExists || r !== 'Dean') &&
    (!isChairpersonTaken || r !== 'Chairperson')
  );

  useEffect(() => {
    if (formData.designation && availableRoles.length > 0 && !availableRoles.includes(formData.designation)) {
      setFormData(prev => ({ ...prev, designation: availableRoles[0] }));
    }
  }, [availableRoles, formData.designation]);

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
      if (name === 'designation') updated.ceit_officer_type = [];
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
    if (formData.designation === 'CEIT Official' && formData.ceit_officer_type.length === 0) {
      setErrors({ ceit_officer_type: ['Please select at least one officer type'] });
      setLoading(false);
      return;
    }

    try {
      await api.post('/users', {
        ...formData,
        name: generateFullName(),
        email: formData.email.trim(),
        ceit_officer_type: formData.designation === 'CEIT Official' ? formData.ceit_officer_type : [],
      });
      setFormData({
        first_name: '', last_name: '', middle_name: '', email: '', password: '',
        department: departments[0] || '',
        designation: availableRoles[0] || '',
        ceit_officer_type: [],
      });
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
              <option value="">Select department...</option>
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
            {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation <span className="text-red-500">*</span></label>
            <select name="designation" value={formData.designation} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select designation...</option>
              {availableRoles.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.designation && <p className="mt-1 text-sm text-red-600">{errors.designation[0]}</p>}
          </div>

          {/* CEIT Officer Type multi-select — only when CEIT Official */}
          {formData.designation === 'CEIT Official' && (
            <CeitOfficerTypePicker
              selected={formData.ceit_officer_type}
              onChange={(types) => setFormData(prev => ({ ...prev, ceit_officer_type: types }))}
              error={errors.ceit_officer_type?.[0] || errors.ceit_officer_type}
            />
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
