import { useState } from 'react';

export default function DepartmentPieChart({ eventsData, meetingsData }) {
  const [selectedType, setSelectedType] = useState('events');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const data = selectedType === 'events' ? eventsData : meetingsData;
  
  // Map department names for display
  const formatDepartmentName = (dept) => {
    if (dept === 'College of Engineering and Information Technology') {
      return 'College Department';
    }
    return dept;
  };
  
  // Extended color palette for departments
  const colorPalette = [
    '#10b981', // green-500
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#ef4444', // red-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#a855f7', // purple-500
    '#84cc16', // lime-500
    '#6366f1', // indigo-500
    '#f43f5e', // rose-500
    '#22d3ee', // cyan-400
    '#fb923c', // orange-400
    '#c084fc', // purple-400
  ];
  
  // Assign unique color to each department
  const getColorForDepartment = (index) => {
    return colorPalette[index % colorPalette.length];
  };
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate percentages and angles with unique colors
  let currentAngle = 0;
  const segments = data.map((item, index) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...item,
      percentage: percentage.toFixed(1),
      startAngle,
      endAngle: currentAngle,
      color: getColorForDepartment(index),
    };
  });
  
  // Create SVG path for 3D pie slice with visible side depth
  const createPieSlice = (startAngle, endAngle) => {
    const radius = 80;
    const centerX = 110;
    const centerY = 100;
    
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };
  
  // Create 3D side face for depth effect
  const create3DSide = (startAngle, endAngle, depth = 15) => {
    const radius = 80;
    const centerX = 110;
    const centerY = 100;
    
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    // Top edge points
    const x1Top = centerX + radius * Math.cos(startRad);
    const y1Top = centerY + radius * Math.sin(startRad);
    const x2Top = centerX + radius * Math.cos(endRad);
    const y2Top = centerY + radius * Math.sin(endRad);
    
    // Bottom edge points (with depth offset)
    const x1Bottom = x1Top;
    const y1Bottom = y1Top + depth;
    const x2Bottom = x2Top;
    const y2Bottom = y2Top + depth;
    const centerBottom = centerY + depth;
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    // Create the side face path
    return `M ${x1Top} ${y1Top} 
            L ${x1Bottom} ${y1Bottom} 
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2Bottom} ${y2Bottom} 
            L ${x2Top} ${y2Top} 
            A ${radius} ${radius} 0 ${largeArc} 0 ${x1Top} ${y1Top} Z`;
  };
  
  // Create darker shade for 3D effect
  const darkenColor = (color, amount = 0.3) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header with Dropdown */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Distribution by Department
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {selectedType === 'events' ? 'Events' : 'Meetings'} breakdown across departments
          </p>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors cursor-pointer"
        >
          <option value="events">Events</option>
          <option value="meetings">Meetings</option>
        </select>
      </div>
      
      {/* Chart Container */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          {total > 0 ? (
            <svg width="240" height="240" viewBox="0 0 240 240" className="transition-transform duration-200" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }}>
              <defs>
                {/* Gradient definitions for top surface */}
                {segments.map((segment, index) => (
                  <linearGradient key={`gradient-top-${index}`} id={`gradient-top-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={segment.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={darkenColor(segment.color, 0.1)} stopOpacity="1" />
                  </linearGradient>
                ))}
              </defs>
              
              {/* 3D side faces (darker, visible depth) */}
              {segments.map((segment, index) => (
                <g 
                  key={`side-${index}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={create3DSide(segment.startAngle, segment.endAngle, 15)}
                    fill={darkenColor(segment.color, hoveredIndex === index ? 0.3 : 0.4)}
                    stroke={darkenColor(segment.color, 0.5)}
                    strokeWidth="0.5"
                    style={{
                      transition: 'fill 0.2s ease-in-out',
                    }}
                  />
                </g>
              ))}
              
              {/* Top surface with gradient */}
              {segments.map((segment, index) => (
                <g 
                  key={`top-${index}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={createPieSlice(segment.startAngle, segment.endAngle)}
                    fill={`url(#gradient-top-${index})`}
                    style={{
                      filter: hoveredIndex === index ? 'brightness(1.15)' : 'brightness(1)',
                      transition: 'filter 0.2s ease-in-out',
                    }}
                  />
                </g>
              ))}
              
              {/* Subtle highlight on top edge */}
              {segments.map((segment, index) => {
                const radius = 80;
                const centerX = 110;
                const centerY = 100;
                const startRad = (segment.startAngle - 90) * (Math.PI / 180);
                const endRad = (segment.endAngle - 90) * (Math.PI / 180);
                const x1 = centerX + radius * Math.cos(startRad);
                const y1 = centerY + radius * Math.sin(startRad);
                const x2 = centerX + radius * Math.cos(endRad);
                const y2 = centerY + radius * Math.sin(endRad);
                const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
                
                return (
                  <path
                    key={`highlight-${index}`}
                    d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill="none"
                    stroke={hoveredIndex === index ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.2)"}
                    strokeWidth={hoveredIndex === index ? "1.5" : "1"}
                    style={{
                      transition: 'stroke 0.2s ease-in-out, stroke-width 0.2s ease-in-out',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 rounded-full">
              <p className="text-sm text-gray-500">No data</p>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex-1 w-full">
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer border border-transparent"
                style={{
                  backgroundColor: hoveredIndex === index ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                  borderColor: hoveredIndex === index ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Color indicator */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 transition-transform duration-200"
                  style={{ 
                    backgroundColor: segment.color,
                    transform: hoveredIndex === index ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: hoveredIndex === index ? `0 0 0 3px ${segment.color}20` : 'none',
                  }}
                />
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Department name */}
                  <div className="text-sm font-medium text-gray-900 leading-tight mb-1">
                    {formatDepartmentName(segment.department)}
                  </div>
                  
                  {/* Count only */}
                  <div className="text-xs">
                    <span className="font-semibold text-gray-700">
                      {segment.count} {selectedType === 'events' ? (segment.count === 1 ? 'event' : 'events') : (segment.count === 1 ? 'meeting' : 'meetings')}
                    </span>
                  </div>
                </div>
                
                {/* Percentage badge */}
                <div 
                  className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-bold transition-colors duration-200"
                  style={{
                    backgroundColor: hoveredIndex === index ? `${segment.color}20` : `${segment.color}10`,
                    color: segment.color,
                  }}
                >
                  {segment.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
