import { create } from 'zustand';
import {
  fetchHistory,
  deleteHistoryEntry,
  clearAllHistory,
  exportHistory,
  downloadHistory,
  type HistoryEntry,
  type HistoryFilters,
} from '../services/historyService';
import toast from 'react-hot-toast';

interface HistoryState {
  // State
  history: HistoryEntry[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Filters
  filters: HistoryFilters;
  isFilterPanelOpen: boolean;
  
  // UI State
  isSidebarOpen: boolean;
  selectedHistoryId: string | null;
  
  // Actions
  loadHistory: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  exportToJson: () => Promise<void>;
  
  // Filter actions
  setFilter: (key: keyof HistoryFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilterPanel: () => void;
  
  // UI actions
  toggleSidebar: () => void;
  setSelectedHistoryId: (id: string | null) => void;
}

const DEFAULT_FILTERS: HistoryFilters = {
  limit: 50,
  offset: 0,
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  // Initial state
  history: [],
  total: 0,
  loading: false,
  error: null,
  hasMore: false,
  filters: DEFAULT_FILTERS,
  isFilterPanelOpen: false,
  isSidebarOpen: false,
  selectedHistoryId: null,

  // Load history with current filters
  loadHistory: async (reset = true) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const filters = reset ? { ...state.filters, offset: 0 } : state.filters;
      const response = await fetchHistory(filters);

      set({
        history: reset ? response.history : [...state.history, ...response.history],
        total: response.total,
        hasMore: response.hasMore,
        filters: filters,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load history',
        loading: false,
      });
      toast.error('Failed to load history');
    }
  },

  // Load more entries (pagination)
  loadMore: async () => {
    const state = get();
    if (state.loading || !state.hasMore) return;

    const newOffset = (state.filters.offset || 0) + (state.filters.limit || 50);
    set({
      filters: { ...state.filters, offset: newOffset },
    });

    await get().loadHistory(false);
  },

  // Delete a single entry
  deleteEntry: async (id: string) => {
    const state = get();
    set({ loading: true });

    try {
      await deleteHistoryEntry(id);
      
      // Remove from local state
      set({
        history: state.history.filter(h => h.id !== id),
        total: state.total - 1,
        loading: false,
      });
      
      toast.success('History entry deleted');
    } catch (error: any) {
      set({ loading: false });
      toast.error('Failed to delete history entry');
    }
  },

  // Clear all history
  clearAll: async () => {
    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return;
    }

    set({ loading: true });

    try {
      await clearAllHistory();
      
      set({
        history: [],
        total: 0,
        hasMore: false,
        loading: false,
      });
      
      toast.success('History cleared');
    } catch (error: any) {
      set({ loading: false });
      toast.error('Failed to clear history');
    }
  },

  // Export history as JSON
  exportToJson: async () => {
    const state = get();
    set({ loading: true });

    try {
      const blob = await exportHistory(state.filters);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadHistory(blob, `request-history-${timestamp}.json`);
      
      toast.success('History exported successfully');
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error('Failed to export history');
    }
  },

  // Set a specific filter
  setFilter: (key: keyof HistoryFilters, value: any) => {
    const state = get();
    set({
      filters: { ...state.filters, [key]: value, offset: 0 },
    });
    // Auto-reload with new filters
    get().loadHistory(true);
  },

  // Clear all filters
  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    get().loadHistory(true);
  },

  // Toggle filter panel
  toggleFilterPanel: () => {
    set({ isFilterPanelOpen: !get().isFilterPanelOpen });
  },

  // Toggle sidebar
  toggleSidebar: () => {
    set({ isSidebarOpen: !get().isSidebarOpen });
  },

  // Set selected history ID
  setSelectedHistoryId: (id: string | null) => {
    set({ selectedHistoryId: id });
  },
}));
