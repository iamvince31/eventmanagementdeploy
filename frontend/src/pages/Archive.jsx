import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Archive() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [archiving, setArchiving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Filter states
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterAcademicYear, setFilterAcademicYear] = useState('');

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // Expandable rows (mobile)
    const [expandedRows, setExpandedRows] = useState(new Set());
    const toggleRow = (id) => setExpandedRows(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const location = useLocation();

    useEffect(() => {
        fetchArchivedEvents();
    }, [location]);

    const fetchArchivedEvents = async () => {
        const startTime = Date.now();
        try {
            setLoading(true);
            const response = await api.get('/archive');
            setEvents(response.data.events || []);
            setError('');
        } catch (err) {
            setError('Failed to load archived events');
            console.error(err);
        } finally {
            const elapsed = Date.now() - startTime;
            const minDelay = 300 + Math.random() * 300;
            const remainingDelay = Math.max(0, minDelay - elapsed);
            setTimeout(() => { setLoading(false); }, remainingDelay);
        }
    };

    const handleArchivePastEvents = async () => {
        if (!window.confirm("Are you sure you want to archive all past events? This will hide them from the regular calendar views.")) {
            return;
        }
        try {
            setArchiving(true);
            const response = await api.post('/archive/past-events');
            setSuccessMessage(response.data.message);
            fetchArchivedEvents();
            setTimeout(() => { setSuccessMessage(''); }, 5000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to archive events');
            setTimeout(() => setError(''), 5000);
        } finally {
            setArchiving(false);
        }
    };

    // Filtering logic
    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const eventYear = eventDate.getFullYear().toString();
        const eventMonth = (eventDate.getMonth() + 1).toString();

        const matchesYear = filterYear === '' || eventYear === filterYear;
        const matchesMonth = filterMonth === '' || eventMonth === filterMonth;
        const matchesCategory = filterCategory === '' || event.event_type === filterCategory;
        const matchesAcademicYear = filterAcademicYear === '' || event.school_year === filterAcademicYear;

        return matchesYear && matchesMonth && matchesCategory && matchesAcademicYear;
    });

    const years = [...new Set(events.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);
    const academicYears = [...new Set(events.map(e => e.school_year).filter(Boolean))].sort((a, b) => {
        const [aStart] = a.split('-').map(Number);
        const [bStart] = b.split('-').map(Number);
        return bStart - aStart;
    });
    const months = [
        { value: '1', label: 'January' }, { value: '2', label: 'February' },
        { value: '3', label: 'March' }, { value: '4', label: 'April' },
        { value: '5', label: 'May' }, { value: '6', label: 'June' },
        { value: '7', label: 'July' }, { value: '8', label: 'August' },
        { value: '9', label: 'September' }, { value: '10', label: 'October' },
        { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];

    // Only Administrator can access this page
    if (user && user.role !== 'Admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You must be an Administrator to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
                {/* Header Card */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between bg-white px-4 py-3 sm:p-6 rounded-2xl shadow-sm border border-gray-100 gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Archived Events</h1>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">View past academic events from different academic years.</p>
                        {events.length > 0 && (
                            <div className="mt-2 sm:mt-3 flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-green-600">{events.length}</span>
                                    <span className="text-gray-500">Total Events</span>
                                </div>
                                {academicYears.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-green-600">{academicYears.length}</span>
                                        <span className="text-gray-500">Academic Years</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleArchivePastEvents}
                        disabled={archiving}
                        className="self-start sm:self-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow flex items-center gap-2 whitespace-nowrap text-sm font-medium"
                    >
                        {archiving ? (
                            <>
                                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Archiving...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Archive Past Events
                            </>
                        )}
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="mb-4 sm:mb-6 bg-white px-4 py-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Filters:</span>
                    </div>

                    <select
                        value={filterAcademicYear}
                        onChange={(e) => { setFilterAcademicYear(e.target.value); setCurrentPage(1); }}
                        className="flex-1 sm:flex-none text-xs sm:text-sm border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 py-1.5 sm:py-2 px-2 sm:px-3"
                    >
                        <option value="">All Academic Years</option>
                        {academicYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <select
                        value={filterYear}
                        onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
                        className="flex-1 sm:flex-none text-xs sm:text-sm border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500 py-1.5 sm:py-2 px-2 sm:px-3"
                    >
                        <option value="">All Years</option>
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <select
                        value={filterMonth}
                        onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                        className="flex-1 sm:flex-none text-xs sm:text-sm border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 py-1.5 sm:py-2 px-2 sm:px-3"
                    >
                        <option value="">All Months</option>
                        {months.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                        className="flex-1 sm:flex-none text-xs sm:text-sm border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 py-1.5 sm:py-2 px-2 sm:px-3"
                    >
                        <option value="">All Categories</option>
                        <option value="event">Event</option>
                        <option value="meeting">Meeting</option>
                    </select>

                    {(filterYear || filterMonth || filterCategory || filterAcademicYear) && (
                        <button
                            onClick={() => {
                                setFilterYear('');
                                setFilterMonth('');
                                setFilterCategory('');
                                setFilterAcademicYear('');
                                setCurrentPage(1);
                            }}
                            className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium ml-auto whitespace-nowrap"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Error / Success banners */}
                {error && (
                    <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center justify-between text-sm">
                        <span className="flex items-center">
                            <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </span>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-500 ml-3 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between text-sm">
                        <span className="flex items-center">
                            <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            {successMessage}
                        </span>
                        <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-600 ml-3 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {events.length === 0 ? "No archived events" : "No results for these filters"}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {events.length === 0
                                ? "There are currently no events in the archive."
                                : "Try adjusting your filters to find what you're looking for."}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Details</th>
                                        {/* Hidden on mobile */}
                                        <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                                        <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
                                        <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(() => {
                                        const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
                                        const safePage = Math.min(currentPage, totalPages || 1);
                                        const pagedEvents = filteredEvents.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
                                        return pagedEvents.map((event) => (
                                            <>
                                                {/* Main row */}
                                                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                                    {/* Event Details — always visible */}
                                                    <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                                                        <div className="flex items-start gap-1.5">
                                                            {/* Mobile expand chevron */}
                                                            <button
                                                                className="sm:hidden mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                                                onClick={() => toggleRow(event.id)}
                                                                aria-label="Expand row"
                                                            >
                                                                <svg
                                                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedRows.has(event.id) ? 'rotate-180' : ''}`}
                                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                            <div>
                                                                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{event.title}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[160px] sm:max-w-xs">{event.description || 'No description'}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Academic Year — hidden on mobile */}
                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                        {event.school_year ? (
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                {event.school_year}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">N/A</span>
                                                        )}
                                                    </td>

                                                    {/* Type — always visible */}
                                                    <td className="px-3 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 sm:py-1 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${event.event_type === 'meeting' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                            {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                                                        </span>
                                                    </td>

                                                    {/* Date & Time — hidden on mobile */}
                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-700">
                                                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                            <span className="text-xs">{event.time}</span>
                                                        </div>
                                                    </td>

                                                    {/* Location — hidden on mobile */}
                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <svg className="w-3 h-3 mr-1 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            </svg>
                                                            <span className="truncate max-w-[150px]">{event.location}</span>
                                                        </div>
                                                    </td>

                                                    {/* Host — hidden on mobile */}
                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="text-sm text-gray-900">{event.host?.username}</div>
                                                        <div className="text-xs text-gray-400">{event.host?.email}</div>
                                                    </td>
                                                </tr>

                                                {/* Mobile expand panel */}
                                                {expandedRows.has(event.id) && (
                                                    <tr key={`${event.id}-expand`} className="sm:hidden bg-gray-50">
                                                        <td colSpan="2" className="px-4 py-3">
                                                            <div className="space-y-2 text-sm">
                                                                <div>
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Academic Year</span>
                                                                    <p className="mt-0.5">
                                                                        {event.school_year
                                                                            ? <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">{event.school_year}</span>
                                                                            : <span className="text-gray-400 italic">N/A</span>
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Time</span>
                                                                    <p className="text-gray-800 mt-0.5">
                                                                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        {event.time && ` · ${event.time}`}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</span>
                                                                    <p className="text-gray-800 mt-0.5">{event.location || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Host</span>
                                                                    <p className="text-gray-800 mt-0.5">{event.host?.username || 'Unknown'}</p>
                                                                    {event.host?.email && <p className="text-xs text-gray-400">{event.host.email}</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {(() => {
                            const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
                            if (totalPages <= 1) return null;
                            const pageStart = (currentPage - 1) * ITEMS_PER_PAGE + 1;
                            const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length);
                            const delta = 2;
                            const rangeStart = Math.max(1, currentPage - delta);
                            const rangeEnd = Math.min(totalPages, currentPage + delta);
                            const pageNumbers = [];
                            for (let i = rangeStart; i <= rangeEnd; i++) pageNumbers.push(i);

                            return (
                                <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200">
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Showing <span className="font-semibold text-gray-900">{pageStart}–{pageEnd}</span> of{' '}
                                        <span className="font-semibold text-gray-900">{filteredEvents.length}</span> events
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ← Prev
                                        </button>

                                        {rangeStart > 1 && (
                                            <>
                                                <button onClick={() => setCurrentPage(1)} className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">1</button>
                                                {rangeStart > 2 && <span className="px-2 text-gray-400 text-sm">…</span>}
                                            </>
                                        )}

                                        {pageNumbers.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${p === currentPage
                                                    ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}

                                        {rangeEnd < totalPages && (
                                            <>
                                                {rangeEnd < totalPages - 1 && <span className="px-2 text-gray-400 text-sm">…</span>}
                                                <button onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">{totalPages}</button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </main>
        </div>
    );
}
