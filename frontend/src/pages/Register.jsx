import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import AuthBackground from '../components/AuthBackground';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_initial: '',
    email: '',
    password: '',
    password_confirmation: '',
    department: '',
    role: '',
  });

  const [DEPARTMENTS, setDEPARTMENTS] = useState([]);
  const [ALL_ROLES, setALL_ROLES] = useState([]);

  const getRolesForDepartment = () => ALL_ROLES;
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password strength checks
  const passwordChecks = {
    minLength: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;

  const getStrength = () => {
    if (formData.password.length === 0) return null;
    if (passedChecks <= 2) return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', width: 'w-1/4' };
    if (passedChecks === 3) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600', width: 'w-2/4' };
    if (passedChecks === 4) return { label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-600', width: 'w-3/4' };
    return { label: 'Very Strong', color: 'bg-green-500', textColor: 'text-green-600', width: 'w-full' };
  };

  const strength = getStrength();
  const isStrongEnough = passedChecks >= 4;

  const navigate = useNavigate();

  // Fetch departments and roles from settings API
  useEffect(() => {
    api.get('/settings').then(res => {
      setDEPARTMENTS(res.data.departments || []);
      const allRoles = [
        ...(res.data.ceit_roles || []),
        ...(res.data.department_roles || []),
      ];
      setALL_ROLES(allRoles);
    }).catch(() => {
      // fallback — leave arrays empty, user will see no options
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset role when department changes
      ...(name === 'department' ? { role: '' } : {}),
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Capitalize names when user finishes typing (onBlur)
  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    if (value.trim()) {
      const capitalizedValue = value.split(' ')
        .map(word => word.trim())
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      setFormData(prev => ({
        ...prev,
        [name]: capitalizedValue
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    setSuccess('');

    if (!isStrongEnough) {
      setErrors({ password: ['Password must be at least Strong. Add more character types.'] });
      setLoading(false);
      return;
    }

    try {
      await api.post('/register', {
        ...formData,
        email: formData.email.trim()
      });

      navigate('/verify-email', {
        state: { email: formData.email.trim(), mode: 'register' }
      });

    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general: err.response?.data?.message || 'Registration failed. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <AuthBackground />

      {/* Registration Form - Above background */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Card with backdrop blur */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create Your Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join the Event Management System
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    onBlur={handleNameBlur}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your first name"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    onBlur={handleNameBlur}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your last name"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="middle_initial" className="block text-sm font-medium text-gray-700">
                  Middle Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  id="middle_initial"
                  name="middle_initial"
                  type="text"
                  value={formData.middle_initial}
                  onChange={handleChange}
                  onBlur={handleNameBlur}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter your middle name (e.g., Santos, De La Cruz)"
                />
                {errors.middle_initial && (
                  <p className="mt-1 text-sm text-red-600">{errors.middle_initial[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  CVSU Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="yourname@cvsu.edu.ph"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select your department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department[0]}</p>
                )}
              </div>

              {/* Role / Position */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Position / Role
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  disabled={!formData.department}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.department ? 'Select your position' : 'Select a department first'}</option>
                  {formData.department && getRolesForDepartment().map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Strength bar — show once user starts typing */}
                {formData.password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength</span>
                      {strength && (
                        <span className={`text-xs font-semibold ${strength.textColor}`}>{strength.label}</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${strength?.color} ${strength?.width}`}></div>
                    </div>
                  </div>
                )}

                {/* Requirements checklist — show when focused or has content */}
                {(passwordFocused || formData.password.length > 0) && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Password requirements:</p>
                    {[
                      { key: 'minLength', label: 'At least 8 characters' },
                      { key: 'uppercase', label: 'One uppercase letter (A–Z)' },
                      { key: 'lowercase', label: 'One lowercase letter (a–z)' },
                      { key: 'number', label: 'One number (0–9)' },
                      { key: 'special', label: 'One special character (!@#$...)' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1.5">
                        {passwordChecks[key] ? (
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-7V7a1 1 0 112 0v4a1 1 0 11-2 0zm1 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={`text-xs ${passwordChecks[key] ? 'text-green-600' : 'text-gray-500'}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Confirm match indicator */}
                {formData.password_confirmation.length > 0 && (
                  <p className={`mt-1 text-xs ${formData.password === formData.password_confirmation ? 'text-green-600' : 'text-red-500'}`}>
                    {formData.password === formData.password_confirmation ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
                {errors.password_confirmation && (
                  <p className="mt-1 text-sm text-red-600">{errors.password_confirmation[0]}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}