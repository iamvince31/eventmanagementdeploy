export default function MetricCard({ label, count, change }) {
  const isPositive = change >= 0;
  const isZero = change === 0;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col">
        {/* Label */}
        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">{label}</p>
        
        {/* Count */}
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{count.toLocaleString()}</h3>
        
        {/* Change Indicator */}
        <div className="flex items-center gap-2">
          {!isZero && (
            <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {/* Zigzag Arrow */}
              <svg 
                className="w-5 h-5 sm:w-6 sm:h-6" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                {isPositive ? (
                  // Zigzag Up Arrow
                  <path d="M3 17L9 11L12 14L21 5M21 5H15M21 5V11" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  // Zigzag Down Arrow
                  <path d="M3 7L9 13L12 10L21 19M21 19H15M21 19V13" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
              <span className="text-sm sm:text-base font-semibold ml-1">
                {Math.abs(change)}%
              </span>
            </div>
          )}
          {isZero && (
            <div className="flex items-center text-gray-500">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12H19" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm sm:text-base font-semibold ml-1">0%</span>
            </div>
          )}
          <span className="text-xs text-gray-500">vs last semester</span>
        </div>
      </div>
    </div>
  );
}
