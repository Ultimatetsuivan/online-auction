import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiX, FiImage, FiAlertCircle } from 'react-icons/fi';
import clsx from 'clsx';

/**
 * Modern Image Uploader Component
 *
 * Drag-and-drop image uploader with preview grid
 * Features: Multi-upload, preview, remove, validation
 */
export const ImageUploader = ({
  images = [],
  onChange,
  maxImages = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  label,
  required = false,
  error,
  helperText,
  className = '',
}) => {
  const [validationError, setValidationError] = useState('');

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setValidationError('');

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        if (error.code === 'file-too-large') {
          setValidationError(`File is too large. Max size is ${maxSize / 1024 / 1024}MB`);
        } else if (error.code === 'file-invalid-type') {
          setValidationError('Invalid file type. Only images are allowed');
        }
        return;
      }

      // Check if adding would exceed max images
      if (images.length + acceptedFiles.length > maxImages) {
        setValidationError(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Process accepted files
      const newImages = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
      }));

      onChange([...images, ...newImages]);
    },
    [images, maxImages, maxSize, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize,
    multiple: true,
  });

  const removeImage = (id) => {
    const filtered = images.filter((img) => img.id !== id);
    onChange(filtered);
  };

  const currentError = error || validationError;

  return (
    <div className={clsx('form-group-modern', className)}>
      {label && (
        <label className="label-modern">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : currentError
            ? 'border-red-500 bg-red-50'
            : 'border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50',
          'p-8 text-center'
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <FiUpload
            className={clsx(
              'mx-auto mb-3',
              isDragActive ? 'text-primary-500' : 'text-neutral-400'
            )}
            size={48}
          />

          {isDragActive ? (
            <p className="text-primary-600 font-medium">Drop images here...</p>
          ) : (
            <>
              <p className="text-neutral-700 font-medium mb-1">
                Drag & drop images here, or click to select
              </p>
              <p className="text-sm text-neutral-500">
                {maxImages} images max, up to {maxSize / 1024 / 1024}MB each
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Error Message */}
      {currentError && (
        <p className="error-text flex items-center gap-1 mt-1.5">
          <FiAlertCircle size={16} />
          {currentError}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !currentError && (
        <p className="helper-text mt-1.5">{helperText}</p>
      )}

      {/* Image Preview Grid */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4"
          >
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-neutral-200 bg-neutral-100"
              >
                {/* Image */}
                <img
                  src={image.preview || image.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {/* First Image Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                    Cover
                  </div>
                )}
              </motion.div>
            ))}

            {/* Add More Button */}
            {images.length < maxImages && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: images.length * 0.05 }}
                {...getRootProps()}
                className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <FiImage className="text-neutral-400" size={32} />
                <span className="text-xs text-neutral-600 font-medium">Add More</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Count */}
      {images.length > 0 && (
        <p className="text-sm text-neutral-600 mt-3">
          {images.length} of {maxImages} images uploaded
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
