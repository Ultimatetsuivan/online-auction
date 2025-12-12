import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_PREFIX = '@auction_draft_';

export type SavingStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DraftData {
  data: any;
  _timestamp: number;
  _version: string;
}

/**
 * Mobile Draft Auto-Save Hook
 *
 * Automatically saves form data to AsyncStorage with debouncing
 *
 * @param draftKey - Unique key for this draft (e.g., 'addProduct')
 * @param data - Form data to save
 * @param delay - Debounce delay in milliseconds (default: 2000)
 * @returns Current saving status
 */
export const useAutosaveMobile = (
  draftKey: string,
  data: any,
  delay: number = 2000
): SavingStatus => {
  const [savingStatus, setSavingStatus] = useState<SavingStatus>('idle');
  const [debouncedData, setDebouncedData] = useState(data);
  const isFirstRender = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the data
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedData(data);
    }, delay);

    return () => clearTimeout(handler);
  }, [data, delay]);

  // Save to AsyncStorage when debounced data changes
  useEffect(() => {
    // Skip on first render to avoid saving empty form
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if data is null/undefined
    if (!debouncedData) {
      return;
    }

    // Check if there's meaningful content
    const hasContent = debouncedData.title || debouncedData.description;
    if (!hasContent) {
      return;
    }

    const saveDraft = async () => {
      try {
        setSavingStatus('saving');

        const draftData: DraftData = {
          data: debouncedData,
          _timestamp: Date.now(),
          _version: '1.0',
        };

        await AsyncStorage.setItem(
          `${DRAFT_PREFIX}${draftKey}`,
          JSON.stringify(draftData)
        );

        setSavingStatus('saved');

        // Reset to idle after 2 seconds
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          setSavingStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Failed to save draft:', error);
        setSavingStatus('error');

        // Reset to idle after 3 seconds on error
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          setSavingStatus('idle');
        }, 3000);
      }
    };

    saveDraft();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedData, draftKey]);

  return savingStatus;
};

/**
 * Get a saved draft from AsyncStorage
 */
export const getDraft = async (draftKey: string): Promise<any | null> => {
  try {
    const draftJson = await AsyncStorage.getItem(`${DRAFT_PREFIX}${draftKey}`);
    if (!draftJson) return null;

    const draft: DraftData = JSON.parse(draftJson);
    return draft.data;
  } catch (error) {
    console.error('Failed to get draft:', error);
    return null;
  }
};

/**
 * Delete a draft from AsyncStorage
 */
export const deleteDraft = async (draftKey: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${DRAFT_PREFIX}${draftKey}`);
  } catch (error) {
    console.error('Failed to delete draft:', error);
  }
};

/**
 * Get all draft keys
 */
export const listDrafts = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter((key) => key.startsWith(DRAFT_PREFIX))
      .map((key) => key.replace(DRAFT_PREFIX, ''));
  } catch (error) {
    console.error('Failed to list drafts:', error);
    return [];
  }
};

/**
 * Get draft metadata (timestamp, version)
 */
export const getDraftMetadata = async (
  draftKey: string
): Promise<{ timestamp: number; version: string } | null> => {
  try {
    const draftJson = await AsyncStorage.getItem(`${DRAFT_PREFIX}${draftKey}`);
    if (!draftJson) return null;

    const draft: DraftData = JSON.parse(draftJson);
    return {
      timestamp: draft._timestamp,
      version: draft._version,
    };
  } catch (error) {
    console.error('Failed to get draft metadata:', error);
    return null;
  }
};
