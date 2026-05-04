import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MetricCard from '../components/MetricCard';
import DepartmentPieChart from '../components/DepartmentPieChart';
import AcceptanceLineChart from '../components/AcceptanceLineChart';
import api from '../services/api';

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only admins can access analytics
    if (user?.designation !== 'Admin') {
      navigate('/dashboard');
      return;
    }

    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/analytics');
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar pageTitle="Analytics Dashboard" isLoading={true} />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-50 pt-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar pageTitle="Analytics Dashboard" />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-50 pt-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const { metrics, charts, semester } = analyticsData;

  return (
    <>
      <Navbar pageTitle="Analytics Dashboard" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-50 pt-6 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Current Semester: <span className="font-semibold capitalize">{semester}</span>
              </p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Registered Accounts"
              count={metrics.registeredAccounts.count}
              change={metrics.registeredAccounts.change}
            />
            <MetricCard
              label="Number of Events"
              count={metrics.numberOfEvents.count}
              change={metrics.numberOfEvents.change}
            />
            <MetricCard
              label="Number of Meetings"
              count={metrics.numberOfMeetings.count}
              change={metrics.numberOfMeetings.change}
            />
            <MetricCard
              label="Users with Personal Events"
              count={metrics.usersWithPersonalEvents.count}
              change={metrics.usersWithPersonalEvents.change}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Pie Chart */}
            <DepartmentPieChart
              eventsData={charts.eventsByDepartment}
              meetingsData={charts.meetingsByDepartment}
            />

            {/* Acceptance Line Chart */}
            {charts.acceptedRejectedByDepartment.length > 0 && (
              <AcceptanceLineChart data={charts.acceptedRejectedByDepartment} />
            )}
          </div>

          {/* Info Footer */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">About Analytics</p>
                <p>
                  This dashboard provides insights into system usage and engagement. 
                  Metrics compare the current semester with the previous semester. 
                  Data excludes Administration and System Administration departments for clearer departmental analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
