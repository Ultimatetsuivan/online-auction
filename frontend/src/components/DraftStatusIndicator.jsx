import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiAlertCircle, FiSave } from 'react-icons/fi';
import { useDraft } from '../context/DraftContext';

/**
 * DraftStatusIndicator Component
 *
 * Shows visual feedback when drafts are being saved
 * Appears in top-right corner with smooth animations
 */
export const DraftStatusIndicator = () => {
  const { savingStatus, lastSaved } = useDraft();

  const statusConfig = {
    idle: { icon: null, text: '', color: '' },
    saving: { icon: FiSave, text: 'Saving...', color: 'text-neutral-600' },
    saved: { icon: FiCheck, text: 'Draft saved', color: 'text-green-600' },
    error: { icon: FiAlertCircle, text: 'Save failed', color: 'text-red-600' },
  };

  const config = statusConfig[savingStatus];
  const Icon = config.icon;

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const seconds = Math.floor((new Date() - lastSaved) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago';
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <AnimatePresence>
      {savingStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 right-4 z-50 bg-white shadow-soft-md rounded-lg px-4 py-2.5 flex items-center gap-2.5 border border-neutral-200"
        >
          {Icon && (
            <Icon
              className={`${config.color} ${savingStatus === 'saving' ? 'animate-pulse' : ''}`}
              size={16}
            />
          )}
          <span className={`text-sm font-medium ${config.color}`}>
            {config.text}
          </span>
          {savingStatus === 'saved' && lastSaved && (
            <span className="text-xs text-neutral-500 ml-1">
              ({formatLastSaved()})
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DraftStatusIndicator;
