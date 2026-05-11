import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('meetings'); // 'meetings', 'events', 'academic-year'
    const [academicCalendarEvents, setAcademicCalendarEvents] = useState([]);

    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState(new Set());

    const toggleRow = (id) => setExpandedRows(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    useEffect(() => { 
        fetchData(); 
        fetchAcademicCalendarEvents();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/events/all');
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAcademicCalendarEvents = async () => {
        try {
            // Get current school year
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1; // 1-12
            const schoolYear = currentMonth >= 9 
                ? `${currentYear}-${currentYear + 1}` 
                : `${currentYear - 1}-${currentYear}`;
            
            // Use /default-events with only_edited=true to only show events with dates set
            const response = await api.get(`/default-events?school_year=${schoolYear}&only_edited=true`);
            setAcademicCalendarEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching academic calendar events:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            </div>
        );
    }

    // Filter events based on active view
    const getFilteredEvents = () => {
        switch (activeView) {
            case 'meetings':
                return events.filter(event => 
                    event.event_type === 'meeting' && 
                    !event.is_personal && 
                    !event.is_archived
                );
            case 'events':
                return events.filter(event => 
                    event.event_type === 'event' && 
                    !event.is_personal && 
                    !event.is_archived
                );
            case 'academic-year':
                return academicCalendarEvents;
            default:
                return [];
        }
    };

    const filteredEvents = getFilteredEvents();
    
    // Calculate statistics
    const now = new Date();
    const totalMeetings = events.filter(e => e.event_type === 'meeting' && !e.is_personal && !e.is_archived).length;
    const totalEvents = events.filter(e => e.event_type === 'event' && !e.is_personal && !e.is_archived).length;
    const totalAcademicEvents = academicCalendarEvents.length;
    
    const upcomingMeetings = events.filter(e => 
        e.event_type === 'meeting' && 
        !e.is_personal && 
        !e.is_archived && 
        new Date(e.date) >= now
    ).length;
    
    const upcomingRegularEvents = events.filter(e => 
        e.event_type === 'event' && 
        !e.is_personal && 
        !e.is_archived && 
        new Date(e.date) >= now
    ).length;

    // Format date for display
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    };

    // Format time for display
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5); // HH:MM format
    };

    // Pagination
    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
    const safePage = Math.min(currentPage, totalPages || 1);
    const pagedEvents = filteredEvents.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 w-full px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-8">

                    {/* ── Header ────────────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Event Manager</h1>
                                <p className="text-sm text-gray-600 mt-1">Manage all system events, meetings, and academic calendar</p>
                            </div>
                            <button
                                onClick={fetchData}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg self-start sm:self-auto"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh Data
                            </button>
                        </div>
                    </div>

                    {/* ── View Selector Tabs ──────────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-md p-2 sm:p-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => { setActiveView('meetings'); setCurrentPage(1); }}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all flex-1 min-w-[120px] ${activeView === 'meetings' 
                                    ? 'bg-green-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <div className="flex flex-col items-center">
                                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-sm">Meetings</span>
                                    <span className="text-xs mt-1 opacity-80">{totalMeetings} total</span>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { setActiveView('events'); setCurrentPage(1); }}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all flex-1 min-w-[120px] ${activeView === 'events' 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <div className="flex flex-col items-center">
                                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm">Events</span>
                                    <span className="text-xs mt-1 opacity-80">{totalEvents} total</span>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { setActiveView('academic-year'); setCurrentPage(1); }}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all flex-1 min-w-[120px] ${activeView === 'academic-year' 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <div className="flex flex-col items-center">
                                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span className="text-sm">Academic Year</span>
                                    <span className="text-xs mt-1 opacity-80">{totalAcademicEvents} total</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* ── Stats Summary ───────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
                            <div className="flex items-center space-x-4">
                                <div className="bg-green-100 rounded-2xl p-3 shrink-0">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Upcoming Meetings</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{upcomingMeetings}</p>
                                    <p className="text-xs text-gray-500 mt-1">of {totalMeetings} total meetings</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
                            <div className="flex items-center space-x-4">
                                <div className="bg-blue-100 rounded-2xl p-3 shrink-0">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Upcoming Events</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{upcomingRegularEvents}</p>
                                    <p className="text-xs text-gray-500 mt-1">of {totalEvents} total events</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
                            <div className="flex items-center space-x-4">
                                <div className="bg-purple-100 rounded-2xl p-3 shrink-0">
                                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Academic Events</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{totalAcademicEvents}</p>
                                    <p className="text-xs text-gray-500 mt-1">from academic calendar</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Events Table ────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                        {activeView === 'meetings' && 'All Meetings Conducted'}
                                        {activeView === 'events' && 'All Events Conducted'}
                                        {activeView === 'academic-year' && 'Academic Calendar Events'}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {activeView === 'meetings' && 'View all meetings conducted in the system'}
                                        {activeView === 'events' && 'View all events conducted in the system'}
                                        {activeView === 'academic-year' && 'View academic calendar events based on academic year dates'}
                                    </p>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Showing {filteredEvents.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(safePage * ITEMS_PER_PAGE, filteredEvents.length)} of {filteredEvents.length} items
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                                        {activeView !== 'academic-year' && (
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Host</th>
                                        )}
                                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            {activeView === 'academic-year' ? 'Date' : 'Date & Time'}
                                        </th>
                                        {activeView !== 'academic-year' && (
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                        )}
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pagedEvents.length === 0 ? (
                                        <tr>
                                            <td colSpan={activeView === 'academic-year' ? 3 : 5} className="px-6 py-12 text-center">
                                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-gray-500 font-medium">
                                                    {activeView === 'meetings' && 'No meetings found'}
                                                    {activeView === 'events' && 'No events found'}
                                                    {activeView === 'academic-year' && 'No academic calendar events found'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        pagedEvents.map((event) => (
                                            <>
                                                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 sm:px-6 py-4">
                                                        <div className="flex items-center">
                                                            <button
                                                                className="sm:hidden mr-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                                                                onClick={() => toggleRow(event.id)}
                                                                aria-label="Expand row"
                                                            >
                                                                <svg
                                                                    className={`w-4 h-4 transition-transform duration-200 ${expandedRows.has(event.id) ? 'rotate-180' : ''}`}
                                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-gray-900 truncate">{event.title}</div>
                                                                <div className="text-xs text-gray-500 truncate mt-1">{event.description?.substring(0, 60)}...</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {activeView !== 'academic-year' && (
                                                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{event.host?.username || 'Unknown'}</div>
                                                            <div className="text-xs text-gray-500">{event.host?.email || ''}</div>
                                                        </td>
                                                    )}

                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                                                        {activeView !== 'academic-year' && event.time && (
                                                            <div className="text-xs text-gray-500">
                                                                {formatTime(event.time)} {event.end_time ? `- ${formatTime(event.end_time)}` : ''}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {activeView !== 'academic-year' && (
                                                        <td className="hidden sm:table-cell px-6 py-4">
                                                            <div className="text-sm text-gray-900 max-w-[200px] truncate">{event.location || 'Not specified'}</div>
                                                        </td>
                                                    )}

                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                                                            activeView === 'academic-year' ? 'bg-purple-100 text-purple-800' :
                                                            event.event_type === 'meeting' ? 'bg-green-100 text-green-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {activeView === 'academic-year' ? 'Academic' : 
                                                             event.event_type === 'meeting' ? 'Meeting' : 'Event'}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {expandedRows.has(event.id) && (
                                                    <tr key={`${event.id}-expand`} className="sm:hidden bg-gray-50">
                                                        <td colSpan={activeView === 'academic-year' ? 3 : 5} className="px-4 py-4">
                                                            <div className="space-y-3 text-sm">
                                                                {activeView !== 'academic-year' && (
                                                                    <div>
                                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Host</span>
                                                                        <p className="text-gray-800 mt-1">{event.host?.username || 'Unknown'}</p>
                                                                        <p className="text-gray-600 text-xs">{event.host?.email || ''}</p>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                                        {activeView === 'academic-year' ? 'Date' : 'Date & Time'}
                                                                    </span>
                                                                    <p className="text-gray-800 mt-1">{formatDate(event.date)}</p>
                                                                    {activeView !== 'academic-year' && event.time && (
                                                                        <p className="text-gray-600 text-xs">
                                                                            {formatTime(event.time)} {event.end_time ? `- ${formatTime(event.end_time)}` : ''}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {activeView !== 'academic-year' && (
                                                                    <div>
                                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</span>
                                                                        <p className="text-gray-800 mt-1">{event.location || 'Not specified'}</p>
                                                                    </div>
                                                                )}
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

                        {/* ── Pagination ───────────────────────────────────── */}
                        {totalPages > 1 && (
                            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Page {safePage} of {totalPages}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={safePage === 1}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        &laquo;
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        &lsaquo;
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
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
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${safePage === item
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
                                        disabled={safePage === totalPages}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        &rsaquo;
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={safePage === totalPages}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        &raquo;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}