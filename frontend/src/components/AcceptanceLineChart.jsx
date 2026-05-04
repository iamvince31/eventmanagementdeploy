import { useState } from 'react';

export default function AcceptanceLineChart({ data }) {
  const [selectedDepartment, setSelectedDepartment] = useState(data[0]?.department || '');
  
  // Map department names for display
  const formatDepartmentName = (dept) => {
    if (dept === 'College of Engineering and Information Technology') {
      return 'College Department';
    }
    return dept;
  };
  
  // Get data for selected department
  const departmentData = data.find(d => d.department === selectedDepartment) || { 
    accepted: 0, 
    declined: 0,
    yearlyData: []
  };
  
  // Use real yearly data from backend
  const yearlyData = departmentData.yearlyData || [];
  const academicYears = yearlyData.map(d => d.year);
  const acceptedData = yearlyData.map(d => d.accepted);
  const declinedData = yearlyData.map(d => d.declined);
  
  // If no data, show empty chart
  if (academicYears.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Accepted vs Declined Meetings
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Academic year trend for {formatDepartmentName(selectedDepartment)}
            </p>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors cursor-pointer"
          >
            {data.map((dept) => (
              <option key={dept.department} value={dept.department}>
                {formatDepartmentName(dept.department)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No data available</p>
        </div>
      </div>
    );
  }
  
  const maxValue = Math.max(
    ...acceptedData,
    ...declinedData,
    10 // Minimum scale
  );
  
  // Round up to nearest 50 for cleaner scale
  const roundedMax = Math.ceil(maxValue / 50) * 50;
  
  // Calculate positions for line chart
  const chartHeight = 280;
  const chartWidth = 700;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 60;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  
  // Y-axis labels (5 levels)
  const yAxisSteps = 5;
  const yAxisLabels = Array.from({ length: yAxisSteps }, (_, i) => 
    Math.round((roundedMax / (yAxisSteps - 1)) * i)
  );
  
  // Calculate point positions
  const getX = (index) => paddingLeft + (plotWidth / (academicYears.length - 1)) * index;
  const getY = (value) => paddingTop + plotHeight - (value / roundedMax) * plotHeight;
  
  // Create path for lines
  const createLinePath = (dataPoints) => {
    return dataPoints.map((value, index) => {
      const x = getX(index);
      const y = getY(value);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header with Dropdown */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Accepted vs Declined Meetings
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Academic year trend for {formatDepartmentName(selectedDepartment)}
          </p>
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors cursor-pointer"
        >
          {data.map((dept) => (
            <option key={dept.department} value={dept.department}>
              {formatDepartmentName(dept.department)}
            </option>
          ))}
        </select>
      </div>
      
      {/* Chart */}
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          {/* Horizontal grid lines */}
          {yAxisLabels.map((label, index) => {
            const y = getY(label);
            return (
              <line
                key={`grid-${index}`}
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Y-axis labels */}
          {yAxisLabels.map((label, index) => {
            const y = getY(label);
            return (
              <text
                key={`y-label-${index}`}
                x={paddingLeft - 15}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {label}
              </text>
            );
          })}
          
          {/* X-axis labels */}
          {academicYears.map((year, index) => {
            const x = getX(index);
            return (
              <text
                key={`x-label-${index}`}
                x={x}
                y={chartHeight - paddingBottom + 25}
                textAnchor="middle"
                className="text-[10px] fill-gray-500"
                transform={`rotate(-45 ${x} ${chartHeight - paddingBottom + 25})`}
              >
                {year}
              </text>
            );
          })}
          
          {/* Accepted line */}
          <path
            d={createLinePath(acceptedData)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Declined line */}
          <path
            d={createLinePath(declinedData)}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Pending line (third line for visual variety) */}
          <path
            d={createLinePath(acceptedData.map((val, i) => Math.round((val + declinedData[i]) * 0.3)))}
            fill="none"
            stroke="#86efac"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Accepted data points */}
          {acceptedData.map((value, index) => {
            const x = getX(index);
            const y = getY(value);
            return (
              <g key={`accepted-point-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  className="hover:r-7 transition-all cursor-pointer"
                />
              </g>
            );
          })}
          
          {/* Declined data points */}
          {declinedData.map((value, index) => {
            const x = getX(index);
            const y = getY(value);
            return (
              <g key={`declined-point-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  className="hover:r-7 transition-all cursor-pointer"
                />
              </g>
            );
          })}
          
          {/* Pending data points */}
          {acceptedData.map((val, index) => {
            const value = Math.round((val + declinedData[index]) * 0.3);
            const x = getX(index);
            const y = getY(value);
            return (
              <g key={`pending-point-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke="#86efac"
                  strokeWidth="2.5"
                  className="hover:r-7 transition-all cursor-pointer"
                />
              </g>
            );
          })}
          
          {/* Chart title */}
          <text
            x={paddingLeft + plotWidth / 2}
            y={20}
            textAnchor="middle"
            className="text-sm fill-gray-400 font-medium"
          >
            Meetings Status
          </text>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-white" />
          <span className="text-xs sm:text-sm text-gray-700">Accepted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-white" />
          <span className="text-xs sm:text-sm text-gray-700">Declined</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-green-300 bg-white" />
          <span className="text-xs sm:text-sm text-gray-700">Pending</span>
        </div>
      </div>
    </div>
  );
}
