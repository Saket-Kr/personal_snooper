import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import { ActivityEvent } from '../../shared/types';

// Kafka UI State Types
interface KafkaUIState {
  // Real-time streams
  liveEvents: ActivityEvent[];
  streamStats: StreamStatistics;
  
  // Cached historical data
  cachedEvents: ActivityEvent[];
  eventCounts: Record<string, number>;
  
  // UI state
  filters: EventFilters;
  viewMode: 'live' | 'historical' | 'analytics';
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  isLoading: boolean;
  error: string | null;
}

interface StreamStatistics {
  eventsPerSecond: number;
  totalEvents: number;
  lastEventTime: string | null;
  appUsage: Record<string, number>;
  eventTypeDistribution: Record<string, number>;
}

interface EventFilters {
  eventTypes: string[];
  timeRange: '1h' | '6h' | '24h' | '7d' | 'all';
  apps: string[];
  searchTerm: string;
}

// Action Types
type KafkaAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: KafkaUIState['connectionStatus'] }
  | { type: 'ADD_LIVE_EVENTS'; payload: ActivityEvent[] }
  | { type: 'SET_STREAM_STATS'; payload: StreamStatistics }
  | { type: 'SET_FILTERS'; payload: Partial<EventFilters> }
  | { type: 'SET_VIEW_MODE'; payload: KafkaUIState['viewMode'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_EVENTS' }
  | { type: 'UPDATE_EVENT_COUNTS'; payload: Record<string, number> };

// Initial State
const initialState: KafkaUIState = {
  liveEvents: [],
  streamStats: {
    eventsPerSecond: 0,
    totalEvents: 0,
    lastEventTime: null,
    appUsage: {},
    eventTypeDistribution: {}
  },
  cachedEvents: [],
  eventCounts: {},
  filters: {
    eventTypes: [],
    timeRange: '1h',
    apps: [],
    searchTerm: ''
  },
  viewMode: 'live',
  connectionStatus: 'disconnected',
  isLoading: false,
  error: null
};

// Reducer
function kafkaReducer(state: KafkaUIState, action: KafkaAction): KafkaUIState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    
    case 'ADD_LIVE_EVENTS':
      const newEvents = [...action.payload, ...state.liveEvents];
      // Keep only last 1000 events to prevent memory issues
      const limitedEvents = newEvents.slice(0, 1000);
      return { ...state, liveEvents: limitedEvents };
    
    case 'SET_STREAM_STATS':
      return { ...state, streamStats: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_EVENTS':
      return { ...state, liveEvents: [], cachedEvents: [] };
    
    case 'UPDATE_EVENT_COUNTS':
      return { ...state, eventCounts: action.payload };
    
    default:
      return state;
  }
}

// Context
const KafkaContext = createContext<{
  state: KafkaUIState;
  dispatch: React.Dispatch<KafkaAction>;
} | null>(null);

// Provider Component
interface KafkaProviderProps {
  children: ReactNode;
}

export function KafkaProvider({ children }: KafkaProviderProps) {
  const [state, dispatch] = useReducer(kafkaReducer, initialState);

  return (
    <KafkaContext.Provider value={{ state, dispatch }}>
      {children}
    </KafkaContext.Provider>
  );
}

// Custom Hook
export function useKafka() {
  const context = useContext(KafkaContext);
  if (!context) {
    throw new Error('useKafka must be used within a KafkaProvider');
  }
  return context;
}

// Specialized Hooks
export function useKafkaStreams() {
  const { state, dispatch } = useKafka();
  
  const addEvents = (events: ActivityEvent[]) => {
    dispatch({ type: 'ADD_LIVE_EVENTS', payload: events });
  };
  
  const updateStats = (stats: StreamStatistics) => {
    dispatch({ type: 'SET_STREAM_STATS', payload: stats });
  };
  
  const setConnectionStatus = (status: KafkaUIState['connectionStatus']) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
  };
  
  return {
    liveEvents: state.liveEvents,
    streamStats: state.streamStats,
    connectionStatus: state.connectionStatus,
    addEvents,
    updateStats,
    setConnectionStatus
  };
}

export function useKafkaAnalytics() {
  const { state, dispatch } = useKafka();
  
  const updateEventCounts = (counts: Record<string, number>) => {
    dispatch({ type: 'UPDATE_EVENT_COUNTS', payload: counts });
  };
  
  const clearEvents = () => {
    dispatch({ type: 'CLEAR_EVENTS' });
  };
  
  return {
    eventCounts: state.eventCounts,
    cachedEvents: state.cachedEvents,
    updateEventCounts,
    clearEvents
  };
}

export function useKafkaUI() {
  const { state, dispatch } = useKafka();
  
  const setFilters = (filters: Partial<EventFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };
  
  const setViewMode = (mode: KafkaUIState['viewMode']) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };
  
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };
  
  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };
  
  return {
    filters: state.filters,
    viewMode: state.viewMode,
    isLoading: state.isLoading,
    error: state.error,
    setFilters,
    setViewMode,
    setLoading,
    setError
  };
}
