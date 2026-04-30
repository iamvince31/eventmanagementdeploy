import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getCache, setCache, invalidateCache } from '../services/cache';
import logo from "../assets/CEIT-LOGO.png";
import Navbar from '../components/Navbar';
import CreateUserModal from '../components/CreateUserModal';
import CreateDeanModal from '../components/CreateDeanModal';

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateDeanModal, setShowCreateDeanModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [filterDesignation, setFilterDesignation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const tableRef = useRef(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => setExpandedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const designations = [
    'Admin',
    'Dean',
    'Chairperson',
    'Research Coordinator',
    'Extension Coordinator',
    'Department Research Coordinator',
    'Department Extension Coordinator',
    'Faculty Member',
    'CEIT Official'
  ];

  const CEIT_DESIGNATIONS = ['Dean', 'CEIT Official', 'Coordinator', 'Faculty Member'];
  const DEPT_DESIGNATIONS = ['Chairperson', 'Faculty Member', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator'];

  const deanExists = users.some(u => u.designation === 'Dean');

  const getDesignationsForDepartment = (dept, excludingUserId = null) => {
    const deanTaken = users.some(u => u.designation === 'Dean' && u.id !== excludingUserId);
    let base;
    if (!dept) base = designations;
    else if (dept === 'College of Engineering and Information Technology') base = CEIT_DESIGNATIONS;
    else base = DEPT_DESIGNATIONS;
    return deanTaken ? base.filter(r => r !== 'Dean') : base;
  };

  const departments = [
    'Department of Information Technology',
    'Department of Industrial Engineering and Technology',
    'Department of Computer, Electronics, and Electrical Engineering',
    'Department of Civil Engineering and Architecture',
    'Department of Agriculture and Food Engineering',
  ];

  useEffect(() => {
    if (user && (user.designation !== 'Admin' || !user.is_validated)) {
      navigate('/account');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.highlightPending) {
      setShowPendingOnly(true);
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown-container')) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountDropdownOpen]);

  const fetchUsers = async () => {
    const cacheKey = `admin-users`;
    const cached = getCache(cacheKey);

    if (cached) {
      setUsers(cached);
      setLoading(false);
      try {
        const response = await api.get('/users/all');
        setCache(cacheKey, response.data.members || []);
        setUsers(response.data.members || []);
      } catch { }
      return;
    }

    try {
      const response = await api.get('/users/all');
      setCache(cacheKey, response.data.members || []);
      setUsers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDesignationChange = async (userId, newDesignation) => {
    try {
      await api.put(`/users/${userId}/designation`, { designation: newDesignation });
      invalidateCache('admin-users');
      await fetchUsers();
      setEditingUserId(null);
    } catch (error) {
      console.error('Error updating designation:', error);
      alert('Failed to update designation');
    }
  };

  const handleValidateUser = async (userId) => {
    try {
      await api.post(`/users/${userId}/validate`);
      invalidateCache('admin-users');
      await fetchUsers();
    } catch (error) {
      console.error('Error validating user:', error);
      alert('Failed to validate user');
    }
  };

  const handleRevokeValidation = async (userId) => {
    try {
      await api.post(`/users/${userId}/revoke-validation`);
      invalidateCache('admin-users');
      await fetchUsers();
    } catch (error) {
      console.error('Error revoking validation:', error);
      alert('Failed to revoke validation');
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${u.username}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      invalidateCache('admin-users');
      setUsers(prev => prev.filter(usr => usr.id !== u.id));
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to delete user.';
      alert(msg);
    }
  };

  const startEditDesignation = (userId, currentDesignation) => {
    setEditingUserId(userId);
    setSelectedDesignation(currentDesignation);
  };

  const cancelEditDesignation = () => {
    setEditingUserId(null);
    setSelectedDesignation('');
  };

  const getDesignationColor = (designation) => {
    const colors = {
      'Admin': 'bg-purple-100 text-purple-800',
      'Dean': 'bg-blue-100 text-blue-800',
      'Chairperson': 'bg-indigo-100 text-indigo-800',
      'Research Coordinator': 'bg-sky-100 text-sky-800',
      'Extension Coordinator': 'bg-teal-100 text-teal-800',
      'Department Research Coordinator': 'bg-cyan-100 text-cyan-800',
      'Department Extension Coordinator': 'bg-emerald-100 text-emerald-800',
      'Faculty Member': 'bg-green-100 text-green-800',
      'CEIT Official': 'bg-orange-100 text-orange-800'
    };
    return colors[designation] || 'bg-gray-100 text-gray-800';
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      designation: user.designation || 'Faculty Member',
      department: user.department || ''
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      await api.put(`/users/${editingUser.id}/designation`, {
        designation: editingUser.designation,
        department: editingUser.department
      });
      invalidateCache('admin-users');
      await fetchUsers();
      setIsEditUserModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPendingFilter = !showPendingOnly || !u.is_validated;
    const matchesDesignation = filterDesignation === '' || u.designation === filterDesignation;

    return matchesSearch && matchesPendingFilter && matchesDesignation;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md sticky top-0 z-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 animate-pulse">
              <div className="h-10 w-48 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 w-80 bg-gray-200 rounded"></div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <th key={i} className="px-6 py-3">
                          <div className="h-4 bg-gray-300 rounded"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6].map((j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoading={loading} />

      <main className="flex-1 w-full px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-[1600px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 sm:mb-8">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-200 rounded-2xl w-16 h-16"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-md p-3 sm:p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-green-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shrink-0">
                      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Total Users</p>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{users.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-3 sm:p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-green-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shrink-0">
                      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Validated</p>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{users.filter(u => u.is_validated).length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-3 sm:p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-green-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shrink-0">
                      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Departments</p>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                        {new Set(users.map(u => u.department).filter(Boolean)).size}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-md px-3 py-3 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="mb-3 sm:mb-6 lg:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">User Management</h2>
                  <p className="text-sm lg:text-base text-gray-600 mt-0.5">Manage users, designations, and validations</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {!deanExists && (
                    <button
                      onClick={() => setShowCreateDeanModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>Create Dean</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md text-sm font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Create User</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 items-center">
              <div className="flex-1 min-w-[160px] relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or dept..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                />
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={filterDesignation}
                onChange={handleFilterChange(setFilterDesignation)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-sm text-gray-700"
              >
                <option value="">All Designations</option>
                {designations.map(designation => (
                  <option key={designation} value={designation}>{designation}</option>
                ))}
              </select>

              <button
                onClick={() => { setShowPendingOnly(!showPendingOnly); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shadow-sm hover:shadow-md ${showPendingOnly
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showPendingOnly ? 'Show All' : 'Pending Only'}
                {showPendingOnly && (
                  <span className="ml-1 px-2 py-0.5 bg-white text-green-600 rounded-full text-xs font-bold">
                    {filteredUsers.length}
                  </span>
                )}
              </button>
            </div>

            <div ref={tableRef} className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[45%] sm:w-auto whitespace-nowrap">User</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Email</th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Department</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Designation</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[25%] sm:w-auto whitespace-nowrap">Status</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[20%] sm:w-auto whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <>
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 w-[45%] sm:w-auto">
                            <div className="flex items-center">
                              <button
                                className="sm:hidden mr-1.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                                onClick={() => toggleRow(u.id)}
                                aria-label="Expand row"
                              >
                                <svg
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedRows.has(u.id) ? 'rotate-180' : ''}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-2 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 leading-tight truncate max-w-[90px] sm:max-w-none">{u.username}</div>
                              </div>
                            </div>
                          </td>

                          <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600 max-w-[180px] truncate">{u.email}</div>
                          </td>

                          <td className="hidden lg:table-cell px-4 py-3">
                            {u.department ? (
                              <span className="px-2 py-1 inline-block text-xs font-bold rounded-lg bg-green-100 text-green-800 leading-tight shadow-sm border border-green-200/50 max-w-[170px] break-words">
                                {u.department === 'College of Engineering and Information Technology' ? 'CEIT' : u.department}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not assigned</span>
                            )}
                          </td>

                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                            {editingUserId === u.id ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={selectedDesignation}
                                  onChange={(e) => setSelectedDesignation(e.target.value)}
                                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                  {getDesignationsForDepartment(u.department, u.id).map(designation => (
                                    <option key={designation} value={designation}>{designation}</option>
                                  ))}
                                </select>
                                <button onClick={() => handleDesignationChange(u.id, selectedDesignation)} className="text-green-600 hover:text-green-700 text-sm font-semibold">Save</button>
                                <button onClick={cancelEditDesignation} className="text-gray-600 hover:text-gray-700 text-sm font-semibold">Cancel</button>
                              </div>
                            ) : (
                              <span className={`px-2 py-1 inline-block text-xs font-bold rounded-lg ${getDesignationColor(u.designation)} text-center leading-tight shadow-sm`}>
                                {u.designation}
                              </span>
                            )}
                          </td>

                          <td className="px-3 sm:px-4 py-3 w-[25%] sm:w-auto whitespace-nowrap">
                            <div className="flex items-center gap-1 flex-nowrap pr-0">
                              <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${u.is_validated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {u.is_validated ? 'Validated' : 'Pending'}
                              </span>
                              {!u.is_validated && u.designation !== 'Admin' ? (
                                <button onClick={() => handleValidateUser(u.id)} className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Validate User">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              ) : u.is_validated && u.designation !== 'Admin' ? (
                                <button onClick={() => handleRevokeValidation(u.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revoke Validation">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-1 sm:px-4 py-3 w-[20%] sm:w-auto whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {user?.id !== u.id && (
                                <button onClick={() => handleEditUser(u)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit User">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              )}
                              {user?.id !== u.id && u.designation !== 'Admin' && (
                                <button onClick={() => handleDeleteUser(u)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {expandedRows.has(u.id) && (
                          <tr key={`${u.id}-expand`} className="sm:hidden bg-gray-50">
                            <td colSpan="3" className="px-4 py-3">
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</span>
                                  <p className="text-gray-800 mt-0.5 break-all">{u.email}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</span>
                                  <p className="mt-0.5">
                                    {u.department ? (
                                      <span className="px-2 py-1 inline-block text-[11px] font-bold rounded-lg bg-green-100 text-green-800 leading-tight max-w-[200px] break-words">
                                        {u.department === 'College of Engineering and Information Technology' ? 'CEIT' : u.department}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 italic">Not assigned</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</span>
                                  <p className="mt-0.5">
                                    <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getDesignationColor(u.designation)}`}>{u.designation}</span>
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 sm:mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 lg:gap-6">
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium text-center sm:text-left">
                Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}-{Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                {filteredUsers.length !== users.length && (
                  <span className="block sm:inline"> (filtered from {users.length} total)</span>
                )}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1 lg:gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs sm:text-sm lg:text-base font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs sm:text-sm lg:text-base font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &lsaquo;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, page, idx, arr) => {
                      if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...');
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 lg:px-3 text-gray-400">...</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs sm:text-sm lg:text-base font-medium border transition-colors ${currentPage === item
                            ? 'bg-green-600 text-white border-green-600'
                            : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {item}
                        </button>
                      )
                    )
                  }
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs sm:text-sm lg:text-base font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs sm:text-sm lg:text-base font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        deanExists={deanExists}
        onSuccess={() => {
          fetchUsers();
          setShowCreateUserModal(false);
        }}
      />

      <CreateDeanModal
        isOpen={showCreateDeanModal}
        onClose={() => setShowCreateDeanModal(false)}
        onSuccess={() => {
          fetchUsers();
          setShowCreateDeanModal(false);
        }}
      />

      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg overflow-hidden">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
                    {editingUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{editingUser.username}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{editingUser.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={editingUser.department}
                  onChange={(e) => setEditingUser(prev => {
                    const newDept = e.target.value;
                    const valid = getDesignationsForDepartment(newDept, prev.id);
                    return {
                      ...prev,
                      department: newDept,
                      designation: valid.includes(prev.designation) ? prev.designation : (valid[0] || prev.designation),
                    };
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                <select
                  value={editingUser.designation}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, designation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                >
                  <option value="">Select Designation</option>
                  {getDesignationsForDepartment(editingUser.department, editingUser.id).map(designation => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
