import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function OrganizationalChart() {
  const { user } = useAuth();
  const [hierarchy, setHierarchy] = useState({ dean: null, ceitStaff: [], facultyMembers: [], chairpersons: [], departments: [] });
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const canEdit = user?.role === 'Admin' || user?.role === 'Dean';
  
  useEffect(() => {
    fetchDepartments();
  }, []);
  
  useEffect(() => {
    if (selectedDepartment) {
      fetchOrganizationalChart();
    }
  }, [selectedDepartment]);
  
  const fetchDepartments = async () => {
    try {
      const response = await api.get('/organizational-chart/departments');
      const depts = response.data.departments || [];
      setDepartments(depts);
      // Auto-select first department if available
      if (depts.length > 0 && !selectedDepartment) {
        setSelectedDepartment(depts[0]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setLoading(false);
    }
  };
  
  const fetchOrganizationalChart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizational-chart', { 
        params: { department: selectedDepartment } 
      });
      setHierarchy(response.data);
    } catch (error) {
      console.error('Error fetching organizational chart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (member) => {
    setEditingUser(member);
    setIsEditModalOpen(true);
  };
  
  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    
    try {
      await api.delete(`/organizational-chart/${memberId}`);
      fetchOrganizationalChart();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member');
    }
  };
  
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/organizational-chart/${editingUser.id}`, editingUser);
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchOrganizationalChart();
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member');
    }
  };
  
  const MemberCard = ({ member, showActions = true, size = 'medium' }) => {
    // Define sizes based on hierarchy level - fully responsive
    const sizes = {
      large: {
        card: 'w-full',
        photo: 'w-20 h-20 md:w-24 md:h-24',
        photoTop: '-top-10 md:-top-12',
        cardPt: 'pt-12 md:pt-14',
        icon: 'w-10 h-10 md:w-12 md:h-12',
        name: 'text-base md:text-lg',
        nameHeight: 'min-h-[48px] md:min-h-[56px]',
        role: 'text-xs md:text-sm',
        roleHeight: 'min-h-[20px] md:min-h-[24px]',
        dept: 'text-xs',
        deptHeight: 'min-h-[52px] md:min-h-[60px]',
        px: 'px-4 md:px-5',
        pb: 'pb-4 md:pb-5'
      },
      medium: {
        card: 'w-full',
        photo: 'w-16 h-16 md:w-20 md:h-20',
        photoTop: '-top-8 md:-top-10',
        cardPt: 'pt-10 md:pt-12',
        icon: 'w-8 h-8 md:w-10 md:h-10',
        name: 'text-sm md:text-base',
        nameHeight: 'min-h-[40px] md:min-h-[48px]',
        role: 'text-xs',
        roleHeight: 'min-h-[18px] md:min-h-[20px]',
        dept: 'text-xs',
        deptHeight: 'min-h-[48px] md:min-h-[56px]',
        px: 'px-3 md:px-4',
        pb: 'pb-3 md:pb-4'
      },
      small: {
        card: 'w-full',
        photo: 'w-14 h-14 md:w-16 md:h-16',
        photoTop: '-top-7 md:-top-8',
        cardPt: 'pt-9 md:pt-10',
        icon: 'w-7 h-7 md:w-8 md:h-8',
        name: 'text-xs md:text-sm',
        nameHeight: 'min-h-[36px] md:min-h-[44px]',
        role: 'text-xs',
        roleHeight: 'min-h-[16px] md:min-h-[18px]',
        dept: 'text-xs',
        deptHeight: 'min-h-[44px] md:min-h-[52px]',
        px: 'px-3',
        pb: 'pb-3'
      },
      xsmall: {
        card: 'w-full',
        photo: 'w-12 h-12 md:w-14 md:h-14',
        photoTop: '-top-6 md:-top-7',
        cardPt: 'pt-8 md:pt-9',
        icon: 'w-6 h-6 md:w-7 md:h-7',
        name: 'text-xs',
        nameHeight: 'min-h-[32px] md:min-h-[40px]',
        role: 'text-[10px] md:text-xs',
        roleHeight: 'min-h-[14px] md:min-h-[16px]',
        dept: 'text-[10px] md:text-xs',
        deptHeight: 'min-h-[40px] md:min-h-[48px]',
        px: 'px-2 md:px-3',
        pb: 'pb-2 md:pb-3'
      }
    };
    
    const s = sizes[size];
    
    return (
      <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-t-4 border-green-600 relative ${s.cardPt}`}>
        {/* Profile Photo */}
        <div className={`absolute ${s.photoTop} left-1/2 transform -translate-x-1/2`}>
          {member.profile_picture ? (
            <img
              src={member.profile_picture}
              alt={member.name}
              className={`${s.photo} rounded-full object-cover border-4 border-white shadow-lg`}
            />
          ) : (
            <div className={`${s.photo} rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-lg`}>
              <svg className={`${s.icon} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Card Content */}
        <div className={`${s.px} ${s.pb} pt-1 md:pt-2`}>
          <div className="text-center">
            {/* Name - Flexible height */}
            <div className={`${s.nameHeight} flex items-center justify-center mb-1`}>
              <h3 className={`font-bold ${s.name} leading-tight text-gray-800 line-clamp-2`}>{member.name}</h3>
            </div>
            
            {/* Role - Flexible height */}
            <div className={`${s.roleHeight} flex items-center justify-center mb-1 md:mb-2`}>
              <p className={`${s.role} text-green-600 font-medium line-clamp-1`}>{member.role}</p>
            </div>
            
            {/* Department - Flexible height */}
            <div className={`${s.deptHeight} flex items-center justify-center`}>
              {member.department && (
                <p className={`${s.dept} text-gray-500 leading-tight line-clamp-3`}>{member.department}</p>
              )}
            </div>
          </div>
          
          {canEdit && showActions && (
            <div className="flex justify-center gap-1.5 md:gap-2 mt-2">
              <button
                onClick={() => handleEdit(member)}
                className="p-1 md:p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(member.id)}
                className="p-1 md:p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-50">
      <Navbar pageTitle="Organizational Chart" />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Header with Department Filter */}
        <div className="mb-6 md:mb-8 flex flex-col gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">Organizational Chart</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">View the hierarchical structure of all members</p>
          </div>
          
          {/* Department Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
            <label className="font-medium text-gray-700 text-xs sm:text-sm md:text-base whitespace-nowrap">Select Department:</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full sm:flex-1 md:w-auto px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="py-6 md:py-8 lg:py-12">
            {/* Dean Level - Largest */}
            {hierarchy.dean && (
              <div className="flex flex-col items-center mb-10 md:mb-14">
                <div className="w-full max-w-[280px] sm:max-w-xs md:max-w-sm lg:w-72 px-4">
                  <MemberCard member={hierarchy.dean} size="large" />
                </div>
              </div>
            )}
            
            {/* CEIT Official Level (Below Dean) - Large - 1 on mobile, 2 on tablet+ */}
            {hierarchy.ceitStaff && hierarchy.ceitStaff.length > 0 && (
              <div className="flex flex-col items-center mb-10 md:mb-14">
                <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-12 w-full max-w-[700px] px-4">
                  {hierarchy.ceitStaff.map((staff) => (
                    <div key={staff.id} className="w-full max-w-[280px] sm:max-w-xs md:w-64">
                      <MemberCard member={staff} size="large" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Faculty Members Level (Below CEIT Official) - Medium - 1 on mobile, 2 on tablet, 3 on desktop */}
            {hierarchy.facultyMembers && hierarchy.facultyMembers.length > 0 && (
              <div className="flex flex-col items-center mb-10 md:mb-14">
                <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-5 gap-y-10 md:gap-y-12 w-full max-w-[840px] px-4">
                  {hierarchy.facultyMembers.map((faculty) => (
                    <div key={faculty.id} className="w-full max-w-[280px] sm:w-[calc(50%-0.5rem)] sm:max-w-xs md:w-56">
                      <MemberCard member={faculty} size="medium" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Department Branches */}
            {hierarchy.departments.length > 0 && (
              <div className="flex justify-center gap-6 md:gap-8 lg:gap-12 px-3 md:px-4 flex-wrap">
                {hierarchy.departments.map((dept, deptIndex) => (
                  <div key={deptIndex} className="flex flex-col items-center w-full md:w-auto max-w-[700px]">
                    {/* Chairperson - Medium */}
                    {dept.chairperson && (
                      <div className="w-full max-w-[280px] sm:max-w-xs md:w-56 mb-10 md:mb-12 px-4 md:px-0">
                        <MemberCard member={dept.chairperson} size="medium" />
                      </div>
                    )}
                    
                    {/* Program Coordinators - Small - 1 on mobile, 2 on tablet, 3 on desktop */}
                    {dept.programCoordinators && dept.programCoordinators.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-x-3 md:gap-x-4 gap-y-8 md:gap-y-10 mb-10 md:mb-12 w-full max-w-[660px] px-4 md:px-0">
                        {dept.programCoordinators.map((coordinator) => (
                          <div key={coordinator.id} className="w-full max-w-[280px] sm:w-[calc(50%-0.375rem)] sm:max-w-[200px] md:w-48">
                            <MemberCard member={coordinator} size="small" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Other Coordinators (Research/Extension/GAD) - Small - 1 on mobile, 2 on tablet, 3 on desktop */}
                    {dept.coordinators.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-x-3 md:gap-x-4 gap-y-8 md:gap-y-10 mb-10 md:mb-12 w-full max-w-[660px] px-4 md:px-0">
                        {dept.coordinators.map((coordinator) => (
                          <div key={coordinator.id} className="w-full max-w-[280px] sm:w-[calc(50%-0.375rem)] sm:max-w-[200px] md:w-48">
                            <MemberCard member={coordinator} size="small" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Faculty Members - Extra Small - 2 per row on mobile, 3 on tablet, 4 on desktop */}
                    {dept.faculty.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-3 gap-y-7 md:gap-y-9 mt-2 md:mt-4 w-full max-w-[700px] px-4 md:px-0">
                        {dept.faculty.map((faculty) => (
                          <div key={faculty.id} className="w-[calc(50%-0.25rem)] max-w-[140px] sm:w-[calc(33.333%-0.5rem)] sm:max-w-[160px] md:w-40">
                            <MemberCard member={faculty} size="xsmall" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Empty State */}
            {!hierarchy.dean && hierarchy.departments.length === 0 && (
              <div className="text-center py-12 md:py-20 px-4">
                <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-500 text-base md:text-lg">No members found in this department</p>
                <p className="text-gray-400 text-xs md:text-sm mt-1 md:mt-2">Try selecting a different department</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Edit Member</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editingUser.first_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editingUser.last_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                {editingUser.role === 'Dean' ? (
                  <input
                    type="text"
                    value="College of Engineering and Information Technology"
                    disabled
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                ) : (
                  <select
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.filter(d => d !== 'College of Engineering and Information Technology').map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="Dean">Dean</option>
                  <option value="CEIT Official">CEIT Official</option>
                  <option value="Chairperson">Chairperson</option>
                  <option value="Program Coordinator">Program Coordinator</option>
                  <option value="Research Coordinator">Research Coordinator</option>
                  <option value="Extension Coordinator">Extension Coordinator</option>
                  <option value="GAD Coordinator">GAD Coordinator</option>
                  <option value="Faculty Member">Faculty Member</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm md:text-base"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm md:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
