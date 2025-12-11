import { useEffect, useRef } from 'react';
import { useDraft } from '../context/DraftContext';
import { useDebounce } from './useDebounce';

/**
 * useAutosave Hook
 *
 * Automatically saves form data to drafts with debouncing
 *
 * @param {string} draftKey - Unique identifier for this draft
 * @param {object} formData - The form data to save
 * @param {number} delay - Debounce delay in milliseconds (default: 2000ms)
 * @returns {string} - Saving status: 'idle' | 'saving' | 'saved' | 'error'
 *
 * @example
 * const [formData, setFormData] = useState({ title: '', description: '' });
 * const savingStatus = useAutosave('addProduct', formData, 2000);
 *
 * // Display status
 * {savingStatus === 'saving' && <p>Saving...</p>}
 * {savingStatus === 'saved' && <p>Draft saved!</p>}
 */
export const useAutosave = (draftKey, formData, delay = 2000) => {
  const { saveToLocalStorage, savingStatus } = useDraft();
  const debouncedData = useDebounce(formData, delay);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip saving on initial mount to avoid saving empty forms
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only save if there's meaningful data
    const hasContent =
      (debouncedData?.title && debouncedData.title.trim()) ||
      (debouncedData?.description && debouncedData.description.trim()) ||
      (debouncedData?.images && debouncedData.images.length > 0);

    if (hasContent) {
      saveToLocalStorage(draftKey, debouncedData);
    }
  }, [debouncedData, draftKey, saveToLocalStorage]);

  return savingStatus;
};

export default useAutosave;
