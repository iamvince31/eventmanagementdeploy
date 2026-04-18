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
  const [selectedRole, setSelectedRole] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateDeanModal, setShowCreateDeanModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const tableRef = useRef(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => setExpandedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const roles = [
    'Admin',
    'Dean',
    'Chairperson',
    'Coordinator',
    'Research Coordinator',
    'Extension Coordinator',
    'GAD Coordinator',
    'Faculty Member',
    'CEIT Official'
  ];

  const CEIT_ROLES = ['Dean', 'CEIT Official', 'Coordinator', 'Faculty Member'];
  const DEPT_ROLES = ['Chairperson', 'Faculty Member', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator'];

  const deanExists = users.some(u => u.role === 'Dean');

  const getRolesForDepartment = (dept, excludingUserId = null) => {
    // Check if dean exists, optionally ignoring the user being edited
    const deanTaken = users.some(u => u.role === 'Dean' && u.id !== excludingUserId);
    let base;
    if (!dept) base = roles;
    else if (dept === 'College of Engineering and Information Technology') base = CEIT_ROLES;
    else base = DEPT_ROLES;
    return deanTaken ? base.filter(r => r !== 'Dean') : base;
  };

  const departments = [
    'Department of Agricultural and Food Engineering',
    'Department of Civil and Environmental Engineering and Energy',
    'Department of Computer Engineering and Architecture',
    'Department of Industrial and Electrical Technology',
    'Department of Information Technology',
    'College of Engineering and Information Technology'
  ];

  useEffect(() => {
    // Check if user is admin and validated
    if (user && (user.role !== 'Admin' || !user.is_validated)) {
      navigate('/account');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  // Handle navigation state to show pending users
  useEffect(() => {
    if (location.state?.highlightPending) {
      setShowPendingOnly(true);
      // Scroll to table after a short delay to ensure it's rendered
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Close account dropdown when clicking outside
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
      // Background refresh
      try {
        const response = await api.get('/users/all');
        setCache(cacheKey, response.data.members || []);
        setUsers(response.data.members || []);
      } catch { /* silently fail */ }
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

  const handleViewEvent = (event) => {
    // Navigate to dashboard to view the event
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      invalidateCache('admin-users');
      await fetchUsers();
      setEditingUserId(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
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

  const startEditRole = (userId, currentRole) => {
    setEditingUserId(userId);
    setSelectedRole(currentRole);
  };

  const cancelEditRole = () => {
    setEditingUserId(null);
    setSelectedRole('');
  };

  const getRoleColor = (role) => {
    const colors = {
      'Admin': 'bg-purple-100 text-purple-800',
      'Dean': 'bg-blue-100 text-blue-800',
      'Chairperson': 'bg-indigo-100 text-indigo-800',
      'Coordinator': 'bg-cyan-100 text-cyan-800',
      'Research Coordinator': 'bg-sky-100 text-sky-800',
      'Extension Coordinator': 'bg-teal-100 text-teal-800',
      'GAD Coordinator': 'bg-violet-100 text-violet-800',
      'Faculty Member': 'bg-green-100 text-green-800',
      'CEIT Official': 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      role: user.role || 'Faculty Member',
      department: user.department || ''
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      await api.put(`/users/${editingUser.id}/role`, {
        role: editingUser.role,
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

  // Filter users based on search term, role filter, and pending status
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPendingFilter = !showPendingOnly || !u.is_validated;
    const matchesRole = filterRole === '' || u.role === filterRole;

    return matchesSearch && matchesPendingFilter && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar Skeleton */}
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

        {/* Main Content Skeleton */}
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

      {/* Main Content */}
      <main className="flex-1 w-full px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
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
                {/* Total Users Card */}
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

                {/* Validated Card */}
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

                {/* Departments Card */}
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

          {/* User Management Section */}
          <div className="bg-white rounded-2xl shadow-md px-4 py-3 sm:p-6 hover:shadow-lg transition-shadow duration-300">
            {/* Header */}
            <div className="mb-3 sm:mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage users, roles, and validations</p>
                </div>
                <div className="flex items-center gap-3">
                  {!deanExists && (
                    <button
                      onClick={() => setShowCreateDeanModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span className="font-semibold">Create Dean</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="font-semibold">Create User</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                />
                <svg className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={handleFilterChange(setFilterRole)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-xs sm:text-sm text-gray-700"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              {/* Pending Filter Button */}
              <button
                onClick={() => { setShowPendingOnly(!showPendingOnly); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md ${showPendingOnly
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showPendingOnly ? 'Show All' : 'Pending Only'}
                {showPendingOnly && (
                  <span className="ml-1 px-2.5 py-0.5 bg-white text-green-600 rounded-full text-xs font-bold">
                    {filteredUsers.length}
                  </span>
                )}
              </button>
            </div>

            {/* Users Table */}
            <div ref={tableRef}>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    {/* Hidden on mobile */}
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-0 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="pl-0 pr-16 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
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
                        {/* Main row */}
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          {/* User — always visible */}
                          <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {/* Mobile expand chevron */}
                              <button
                                className="sm:hidden mr-1.5 text-gray-400 hover:text-gray-600 transition-colors"
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
                              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-2 sm:ml-4">
                                <div className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">{u.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Email — hidden on mobile */}
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{u.email}</div>
                          </td>

                          {/* Department — hidden on mobile */}
                          <td className="hidden sm:table-cell px-6 py-4">
                            {u.department ? (
                              <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {u.department}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not assigned</span>
                            )}
                          </td>

                          {/* Role — hidden on mobile */}
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                            {editingUserId === u.id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={selectedRole}
                                  onChange={(e) => setSelectedRole(e.target.value)}
                                  className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                  {getRolesForDepartment(u.department, u.id).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                  ))}
                                </select>
                                <button onClick={() => handleRoleChange(u.id, selectedRole)} className="text-green-600 hover:text-green-700 text-xs font-semibold">Save</button>
                                <button onClick={cancelEditRole} className="text-gray-600 hover:text-gray-700 text-xs font-semibold">Cancel</button>
                              </div>
                            ) : (
                              <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getRoleColor(u.role)}`}>
                                {u.role}
                              </span>
                            )}
                          </td>

                          {/* Status — always visible */}
                          <td className="px-0 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-0.5 inline-flex text-[10px] sm:text-xs font-semibold rounded-full ${u.is_validated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {u.is_validated ? 'Validated' : 'Pending'}
                              </span>
                              {u.role === 'Admin' && (
                                <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Auto</span>
                              )}
                              {!u.is_validated && u.role !== 'Admin' ? (
                                <button onClick={() => handleValidateUser(u.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Validate User">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              ) : u.is_validated && u.role !== 'Admin' ? (
                                <button onClick={() => handleRevokeValidation(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revoke Validation">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              ) : null}
                            </div>
                          </td>

                          {/* Actions — always visible */}
                          <td className="pl-0 pr-16 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {user?.id !== u.id && (
                                <button onClick={() => handleEditUser(u)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit User">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Mobile expand panel1 — Email / Department / Role */}
                        {expandedRows.has(u.id) && (
                          <tr key={`${u.id}-expand`} className="sm:hidden bg-gray-50">
                            <td colSpan="3" className="px-4 py-3">
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</span>
                                  <p className="text-gray-800 mt-0.5">{u.email}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</span>
                                  <p className="mt-0.5">
                                    {u.department ? (
                                      <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">{u.department}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">Not assigned</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</span>
                                  <p className="mt-0.5">
                                    {editingUserId === u.id ? (
                                      <span className="text-gray-500 italic text-xs">Editing in desktop view</span>
                                    ) : (
                                      <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getRoleColor(u.role)}`}>{u.role}</span>
                                    )}
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

            <div className="mt-3 sm:mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-600 font-medium text-center sm:text-left">
                Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}-{Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                {filteredUsers.length !== users.length && (
                  <span className="block sm:inline"> (filtered from {users.length} total)</span>
                )}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${currentPage === item
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
                    className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        deanExists={deanExists}
        onSuccess={() => {
          fetchUsers();
          setShowCreateUserModal(false);
        }}
      />

      {/* Create Dean Modal */}
      <CreateDeanModal
        isOpen={showCreateDeanModal}
        onClose={() => setShowCreateDeanModal(false)}
        onSuccess={() => {
          fetchUsers();
          setShowCreateDeanModal(false);
        }}
      />

      {/* Edit User Modal */}
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
                    const valid = getRolesForDepartment(newDept, prev.id);
                    return {
                      ...prev,
                      department: newDept,
                      role: valid.includes(prev.role) ? prev.role : (valid[0] || prev.role),
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                >
                  <option value="">Select Role</option>
                  {getRolesForDepartment(editingUser.department, editingUser.id).map(role => (
                    <option key={role} value={role}>{role}</option>
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
