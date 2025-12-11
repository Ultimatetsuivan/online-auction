import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

const DraftContext = createContext();

/**
 * useDraft Hook
 *
 * Access draft functionality from any component
 */
export const useDraft = () => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraft must be used within DraftProvider');
  }
  return context;
};

/**
 * DraftProvider Component
 *
 * Manages draft state and provides auto-save functionality
 * Saves to localStorage immediately and optionally syncs to backend
 */
export const DraftProvider = ({ children }) => {
  const [drafts, setDrafts] = useState({});
  const [savingStatus, setSavingStatus] = useState('idle'); // idle, saving, saved, error
  const [lastSaved, setLastSaved] = useState(null);

  // Load drafts from localStorage on mount
  useEffect(() => {
    const loadDrafts = () => {
      try {
        const stored = localStorage.getItem('auctionDrafts');
        if (stored) {
          const parsed = JSON.parse(stored);
          setDrafts(parsed);
        }
      } catch (error) {
        console.error('Failed to load drafts:', error);
      }
    };
    loadDrafts();
  }, []);

  /**
   * Save draft to localStorage
   */
  const saveToLocalStorage = useCallback((draftKey, data) => {
    try {
      setSavingStatus('saving');
      const updatedDrafts = {
        ...drafts,
        [draftKey]: {
          data,
          timestamp: Date.now(),
          version: (drafts[draftKey]?.version || 0) + 1,
        },
      };
      setDrafts(updatedDrafts);
      localStorage.setItem('auctionDrafts', JSON.stringify(updatedDrafts));
      setSavingStatus('saved');
      setLastSaved(new Date());

      // Reset to idle after 2 seconds
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSavingStatus('error');
      setTimeout(() => setSavingStatus('idle'), 3000);
    }
  }, [drafts]);

  /**
   * Save draft to backend (optional - for cloud sync)
   */
  const saveToBackend = useCallback(async (draftKey, data) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.token) return; // Skip if not logged in

      await axios.post(
        buildApiUrl('/api/drafts/save'),
        { draftKey, data },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (error) {
      console.error('Failed to save draft to backend:', error);
      // Don't set error status for backend failures - localStorage is primary
    }
  }, []);

  /**
   * Get draft for specific page/key
   */
  const getDraft = useCallback((draftKey) => {
    return drafts[draftKey]?.data || null;
  }, [drafts]);

  /**
   * Delete draft
   */
  const deleteDraft = useCallback((draftKey) => {
    const updatedDrafts = { ...drafts };
    delete updatedDrafts[draftKey];
    setDrafts(updatedDrafts);
    localStorage.setItem('auctionDrafts', JSON.stringify(updatedDrafts));
  }, [drafts]);

  /**
   * List all drafts
   */
  const listDrafts = useCallback(() => {
    return Object.entries(drafts).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      version: value.version,
      preview: value.data?.title || 'Untitled Draft',
    }));
  }, [drafts]);

  /**
   * Clear all drafts
   */
  const clearAllDrafts = useCallback(() => {
    setDrafts({});
    localStorage.removeItem('auctionDrafts');
  }, []);

  const value = {
    saveToLocalStorage,
    saveToBackend,
    getDraft,
    deleteDraft,
    listDrafts,
    clearAllDrafts,
    savingStatus,
    lastSaved,
    drafts,
  };

  return (
    <DraftContext.Provider value={value}>
      {children}
    </DraftContext.Provider>
  );
};

export default DraftProvider;
