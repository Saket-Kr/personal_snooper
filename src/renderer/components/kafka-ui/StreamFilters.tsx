import { useState } from 'react';
import { useKafkaUI } from '../../contexts/KafkaContext';
import './StreamFilters.css';

export function StreamFilters() {
    const { filters, setFilters } = useKafkaUI();
    const [isExpanded, setIsExpanded] = useState(false);

    const eventTypes = [
        { value: 'APP_ACTIVE', label: 'App Events', icon: '💻' },
        { value: 'BROWSER_TAB_ACTIVE', label: 'Browser Events', icon: '🌐' },
        { value: 'FILE_CHANGED', label: 'File Events', icon: '📁' }
    ];

    const timeRanges = [
        { value: '1h', label: 'Last Hour' },
        { value: '6h', label: 'Last 6 Hours' },
        { value: '24h', label: 'Last 24 Hours' },
        { value: '7d', label: 'Last 7 Days' },
        { value: 'all', label: 'All Time' }
    ];

    const handleEventTypeToggle = (eventType: string) => {
        const currentTypes = filters.eventTypes;
        const newTypes = currentTypes.includes(eventType)
            ? currentTypes.filter(type => type !== eventType)
            : [...currentTypes, eventType];

        setFilters({ eventTypes: newTypes });
    };

    const handleTimeRangeChange = (timeRange: string) => {
        setFilters({ timeRange: timeRange as any });
    };

    const handleSearchChange = (searchTerm: string) => {
        setFilters({ searchTerm });
    };

    const clearFilters = () => {
        setFilters({
            eventTypes: [],
            timeRange: '1h',
            apps: [],
            searchTerm: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.eventTypes.length > 0 ||
            filters.timeRange !== '1h' ||
            filters.searchTerm !== '' ||
            filters.apps.length > 0;
    };

    return (
        <div className="stream-filters">
            <div className="filters-header">
                <h4>Filters</h4>
                <button
                    className="expand-button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? 'Collapse filters' : 'Expand filters'}
                >
                    {isExpanded ? '−' : '+'}
                </button>
            </div>

            {isExpanded && (
                <div className="filters-content">
                    {/* Search Filter */}
                    <div className="filter-section">
                        <label className="filter-label">Search</label>
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={filters.searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* Event Type Filter */}
                    <div className="filter-section">
                        <label className="filter-label">Event Types</label>
                        <div className="event-type-filters">
                            {eventTypes.map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    className={`event-type-button ${filters.eventTypes.includes(value) ? 'active' : ''}`}
                                    onClick={() => handleEventTypeToggle(value)}
                                    title={label}
                                >
                                    <span className="event-type-icon">{icon}</span>
                                    <span className="event-type-label">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Range Filter */}
                    <div className="filter-section">
                        <label className="filter-label">Time Range</label>
                        <select
                            value={filters.timeRange}
                            onChange={(e) => handleTimeRangeChange(e.target.value)}
                            className="time-range-select"
                        >
                            {timeRanges.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters() && (
                        <div className="filter-section">
                            <button
                                className="clear-filters-button"
                                onClick={clearFilters}
                            >
                                🗑️ Clear All Filters
                            </button>
                        </div>
                    )}

                    {/* Active Filters Summary */}
                    {hasActiveFilters() && (
                        <div className="active-filters">
                            <h5>Active Filters:</h5>
                            <div className="filter-tags">
                                {filters.eventTypes.length > 0 && (
                                    <span className="filter-tag">
                                        Types: {filters.eventTypes.join(', ')}
                                    </span>
                                )}
                                {filters.timeRange !== '1h' && (
                                    <span className="filter-tag">
                                        Time: {timeRanges.find(t => t.value === filters.timeRange)?.label}
                                    </span>
                                )}
                                {filters.searchTerm && (
                                    <span className="filter-tag">
                                        Search: "{filters.searchTerm}"
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filter Summary (always visible) */}
            <div className="filter-summary">
                {hasActiveFilters() ? (
                    <div className="summary-active">
                        <span className="summary-icon">🔍</span>
                        <span className="summary-text">Filters Active</span>
                    </div>
                ) : (
                    <div className="summary-inactive">
                        <span className="summary-icon">📋</span>
                        <span className="summary-text">No Filters</span>
                    </div>
                )}
            </div>
        </div>
    );
}
