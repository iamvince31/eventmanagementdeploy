import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function AdminEvents() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [filterEventUser, setFilterEventUser] = useState('');
    const [filterEventType, setFilterEventType] = useState('');
    const [filterEventDepartment, setFilterEventDepartment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateQuickFilter, setDateQuickFilter] = useState(''); // 'today' | 'week' | 'month' | ''

    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState(new Set());

    const toggleRow = (id) => setExpandedRows(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const departments = [
        'College of Engineering and Information Technology',
        'Department of Information Technology',
        'Department of Industrial Engineering and Technology',
        'Department of Computer, Electronics, and Electrical Engineering',
        'Department of Civil Engineering',
        'Department of Agriculture and Food Engineering',
        'Other'
    ];

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([fetchUsers(), fetchEvents()]);
        setIsLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/all');
            setUsers(response.data.members || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events/all');
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            </div>
        );
    }

    // ─── Date range helpers ───────────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const matchesDateFilter = (dateStr) => {
        if (!dateQuickFilter) return true;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        if (dateQuickFilter === 'today') return d.getTime() === today.getTime();
        if (dateQuickFilter === 'week') return d >= startOfWeek && d <= new Date(startOfWeek.getTime() + 6 * 86400000);
        if (dateQuickFilter === 'month') return d >= startOfMonth && d <= endOfMonth;
        return true;
    };

    // ─── Event-specific stats ─────────────────────────────────────────────────
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) >= now).length;

    const thisMonthEvents = events.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Most active department: department with the most hosted events
    const deptCount = {};
    events.forEach(e => {
        const host = users.find(u => u.username === e.host?.username);
        const dept = host?.department;
        if (dept) deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
    const topDept = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0];
    // Abbreviate long department names
    const abbreviateDept = (name) => {
        if (!name) return 'N/A';
        const map = {
            'College of Engineering and Information Technology': 'CEIT',
            'Department of Information Technology': 'DIT',
            'Department of Industrial Engineering and Technology': 'DIET',
            'Department of Computer, Electronics, and Electrical Engineering': 'DCEEE',
            'Department of Civil Engineering': 'DCEA',
            'Department of Agriculture and Food Engineering': 'DAFE',
        };
        return map[name] || name.split(' ').map(w => w[0]).join('').toUpperCase();
    };

    // ─── Core filter function (shared by table + pagination) ─────────────────
    const applyFilters = (e) => {
        const isHostedByUser = e.host?.username === filterEventUser;
        const isInvitedUser = e.members?.some(m => m.username === filterEventUser);
        const matchesUser = filterEventUser === '' ? true : (isHostedByUser || isInvitedUser);

        let matchesDepartment = true;
        if (filterEventDepartment !== '') {
            const hostUser = users.find(u => u.username === e.host?.username);
            matchesDepartment = hostUser?.department === filterEventDepartment;
        }

        let matchesType = true;
        if (filterEventType === 'Academic Event') {
            matchesType = e.is_default_event === true;
        } else if (filterEventType === 'Personal Event') {
            matchesType = !!e.is_personal;
        } else if (filterEventType === 'Hosting Event') {
            matchesType = !e.is_personal && e.event_type !== 'meeting' && (filterEventUser === '' ? true : isHostedByUser);
        } else if (filterEventType === 'Invited Event') {
            matchesType = !e.is_personal && e.event_type !== 'meeting' && (filterEventUser === '' ? e.members?.length > 0 : isInvitedUser);
        } else if (filterEventType === 'Hosting Meeting') {
            matchesType = e.event_type === 'meeting' && (filterEventUser === '' ? true : isHostedByUser);
        } else if (filterEventType === 'Invited Meeting') {
            matchesType = e.event_type === 'meeting' && (filterEventUser === '' ? e.members?.length > 0 : isInvitedUser);
        }

        // Search: title, description, location
        const q = searchTerm.toLowerCase();
        const matchesSearch = q === '' ||
            e.title?.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q);

        const matchesDate = matchesDateFilter(e.date);

        return matchesUser && matchesDepartment && matchesType && matchesSearch && matchesDate;
    };

    // Quick-filter button style helper
    const qbClass = (key) =>
        `px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap ${dateQuickFilter === key
            ? 'bg-green-600 border-green-600 text-white shadow-sm'
            : 'bg-white border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-700'
        }`;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 w-full px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-8">

                    {/* ── Top Stats Cards (Event-Specific) ─────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                        {/* Upcoming Events */}
                        <div className="bg-white rounded-2xl shadow-md p-3 sm:p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="bg-green-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shrink-0">
                                    <svg className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Upcoming Events</p>
                                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{upcomingEvents}</p>
                                </div>
                            </div>
                        </div>

                        {/* Events This Month */}
                        <div className="bg-white rounded-2xl shadow-md p-3 sm:p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="bg-green-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shrink-0">
                                    <svg className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">This Month</p>
                                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{thisMonthEvents}</p>
                                </div>
                            </div>
                        </div>

                        {/* Most Active Department */}
                        <div className="bg-white rounded-2xl shadow-md p-3 sm:p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="bg-green-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shrink-0">
                                    <svg className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Most Active Dept</p>
                                    {topDept ? (
                                        <>
                                            <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{abbreviateDept(topDept[0])}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{topDept[1]} events</p>
                                        </>
                                    ) : (
                                        <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">N/A</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Events Management Section ─────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-md px-4 py-3 sm:p-6 hover:shadow-lg transition-shadow duration-300">
                        {/* Header */}
                        <div className="mb-3 sm:mb-5">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Events Management</h2>
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">View all events created across the system</p>
                        </div>

                        {/* ── Search Bar ───────────────────────────────────── */}
                        <div className="mb-3 sm:mb-4 relative">
                            <input
                                type="text"
                                placeholder="Search by title, description, or location…"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-xs sm:text-sm text-gray-700"
                            />
                            <svg className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchTerm && (
                                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-2.5 sm:top-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* ── Date Quick-Filters ───────────────────────────── */}
                        <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">Date:</span>
                            <button onClick={() => { setDateQuickFilter(''); setCurrentPage(1); }} className={qbClass('')}>All</button>
                            <button onClick={() => { setDateQuickFilter('today'); setCurrentPage(1); }} className={qbClass('today')}>Today</button>
                            <button onClick={() => { setDateQuickFilter('week'); setCurrentPage(1); }} className={qbClass('week')}>This Week</button>
                            <button onClick={() => { setDateQuickFilter('month'); setCurrentPage(1); }} className={qbClass('month')}>This Month</button>
                        </div>

                        {/* ── Dropdown Filters ─────────────────────────────── */}
                        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3 items-center">
                            {/* Department */}
                            <select
                                value={filterEventDepartment}
                                onChange={(e) => { setFilterEventDepartment(e.target.value); setFilterEventUser(''); setCurrentPage(1); }}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-xs sm:text-sm text-gray-700"
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                            </select>

                            {/* User */}
                            <select
                                value={filterEventUser}
                                onChange={(e) => { setFilterEventUser(e.target.value); setCurrentPage(1); }}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-xs sm:text-sm text-gray-700"
                            >
                                <option value="">All Users</option>
                                {users
                                    .filter(u => filterEventDepartment === '' || u.department === filterEventDepartment)
                                    .map(u => (
                                        <option key={u.id} value={u.username}>
                                            {u.username} {u.department ? `- ${u.department}` : ''}
                                        </option>
                                    ))}
                            </select>

                            {/* Type */}
                            <select
                                value={filterEventType}
                                onChange={(e) => { setFilterEventType(e.target.value); setCurrentPage(1); }}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-xs sm:text-sm text-gray-700"
                            >
                                <option value="">All Event Types</option>
                                <option value="Academic Event">Academic Event</option>
                                <option value="Hosting Event">Hosting Event</option>
                                <option value="Invited Event">Invited Event</option>
                                <option value="Hosting Meeting">Hosting Meeting</option>
                                <option value="Invited Meeting">Invited Meeting</option>
                                <option value="Personal Event">Personal Event</option>
                            </select>

                            {/* Clear all filters */}
                            {(searchTerm || dateQuickFilter || filterEventDepartment || filterEventUser || filterEventType) && (
                                <button
                                    onClick={() => { setSearchTerm(''); setDateQuickFilter(''); setFilterEventDepartment(''); setFilterEventUser(''); setFilterEventType(''); setCurrentPage(1); }}
                                    className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-semibold ml-auto whitespace-nowrap"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* ── Events Table ─────────────────────────────────── */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event Title</th>
                                        <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Host</th>
                                        <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date &amp; Time</th>
                                        <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                        const filteredEvents = events.filter(applyFilters);

                                        const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
                                        const safePage = Math.min(currentPage, totalPages || 1);
                                        const pagedEvents = filteredEvents.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

                                        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);

                                        if (filteredEvents.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center">
                                                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <p className="text-gray-500 font-medium">No events found</p>
                                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search term</p>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return pagedEvents.map((e) => {
                                            let typeLabel = '', typeColor = '';
                                            const isHostedByFilter = filterEventUser !== '' && e.host?.username === filterEventUser;
                                            const isInvitedFilter = filterEventUser !== '' && e.members?.some(m => m.username === filterEventUser);

                                            if (e.is_default_event) {
                                                typeLabel = 'Academic Event'; typeColor = 'bg-blue-100 text-blue-800';
                                            } else if (e.is_personal) {
                                                typeLabel = 'Personal Event'; typeColor = 'bg-purple-100 text-purple-800';
                                            } else if (e.event_type === 'meeting') {
                                                typeLabel = filterEventUser !== ''
                                                    ? (isHostedByFilter ? 'Hosting Meeting' : (isInvitedFilter ? 'Invited Meeting' : 'Meeting'))
                                                    : 'Meeting';
                                                typeColor = typeLabel === 'Hosting Meeting' ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800';
                                            } else {
                                                typeLabel = filterEventUser !== ''
                                                    ? (isHostedByFilter ? 'Hosting Event' : (isInvitedFilter ? 'Invited Event' : 'Event'))
                                                    : 'Event';
                                                typeColor = typeLabel === 'Hosting Event' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                                            }

                                            return (
                                                <>
                                                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                                                        {/* Event Title — always visible */}
                                                        <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                                                            <div className="flex items-start gap-1.5">
                                                                <button
                                                                    className="sm:hidden mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                                                    onClick={() => toggleRow(e.id)}
                                                                    aria-label="Expand row"
                                                                >
                                                                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedRows.has(e.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </button>
                                                                <div>
                                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">{e.title}</div>
                                                                    {e.description && <div className="text-xs text-gray-500 mt-0.5 sm:mt-1 truncate max-w-[160px] sm:max-w-xs">{e.description}</div>}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Host — hidden on mobile */}
                                                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white">
                                                                    {e.host?.username?.charAt(0).toUpperCase() || '?'}
                                                                </div>
                                                                <p className="ml-3 text-sm font-medium text-gray-900">{e.host?.username || 'Unknown'}</p>
                                                            </div>
                                                        </td>

                                                        {/* Date & Time — hidden on mobile */}
                                                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{new Date(e.date).toLocaleDateString()}</div>
                                                            <div className="text-xs text-gray-500">{e.time}</div>
                                                        </td>

                                                        {/* Location — hidden on mobile */}
                                                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-600">{e.location || 'N/A'}</div>
                                                        </td>

                                                        {/* Type — always visible */}
                                                        <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                                                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 inline-flex text-[10px] sm:text-xs font-semibold rounded-full ${typeColor}`}>
                                                                {typeLabel}
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    {/* Mobile expand panel */}
                                                    {expandedRows.has(e.id) && (
                                                        <tr key={`${e.id}-expand`} className="sm:hidden bg-gray-50">
                                                            <td colSpan="2" className="px-4 py-3">
                                                                <div className="space-y-2 text-sm">
                                                                    <div>
                                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Host</span>
                                                                        <p className="text-gray-800 mt-0.5">{e.host?.username || 'Unknown'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Time</span>
                                                                        <p className="text-gray-800 mt-0.5">{new Date(e.date).toLocaleDateString()} {e.time && `· ${e.time}`}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</span>
                                                                        <p className="text-gray-800 mt-0.5">{e.location || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ───────────────────────────────────── */}
                        {(() => {
                            const filteredCount = events.filter(applyFilters).length;
                            const totalPages = Math.ceil(filteredCount / ITEMS_PER_PAGE);
                            if (totalPages <= 1) return null;

                            const pageStart = (currentPage - 1) * ITEMS_PER_PAGE + 1;
                            const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredCount);

                            const delta = 2;
                            const rangeStart = Math.max(1, currentPage - delta);
                            const rangeEnd = Math.min(totalPages, currentPage + delta);
                            const pageNumbers = [];
                            for (let i = rangeStart; i <= rangeEnd; i++) pageNumbers.push(i);

                            return (
                                <div className="mt-3 sm:mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <p className="text-xs sm:text-sm text-gray-600 font-medium text-center sm:text-left">
                                        Showing <span className="font-semibold text-gray-900">{pageStart}–{pageEnd}</span> of{' '}
                                        <span className="font-semibold text-gray-900">{filteredCount}</span> events
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Prev</button>

                                        {rangeStart > 1 && (
                                            <>
                                                <button onClick={() => setCurrentPage(1)} className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">1</button>
                                                {rangeStart > 2 && <span className="px-2 text-gray-400 text-sm">…</span>}
                                            </>
                                        )}

                                        {pageNumbers.map(p => (
                                            <button key={p} onClick={() => setCurrentPage(p)} className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${p === currentPage ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>{p}</button>
                                        ))}

                                        {rangeEnd < totalPages && (
                                            <>
                                                {rangeEnd < totalPages - 1 && <span className="px-2 text-gray-400 text-sm">…</span>}
                                                <button onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">{totalPages}</button>
                                            </>
                                        )}

                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </main>
        </div>
    );
}
