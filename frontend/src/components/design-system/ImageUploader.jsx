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
  thumbnailSize = 120,
  label,
  required = false,
  error,
  helperText,
  className = '',
}) => {
  const [validationError, setValidationError] = useState('');

  const buildPreview = (image) => {
    if (!image) return null;
    if (image.preview) return image.preview;
    if (image.url) return image.url;
    if (image.path) return image.path;
    if (image.secure_url) return image.secure_url;
    if (image.file) return URL.createObjectURL(image.file);
    return null;
  };

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
    maxSize,
    multiple: true,
  });

  const removeImage = (idOrIndex) => {
    const filtered = images.filter((img, idx) => (img.id ?? idx) !== idOrIndex);
    onChange(filtered);
  };

  const currentError = error || validationError;
  const rootProps = getRootProps();
  const inputProps = getInputProps();

  return (
    <div className={clsx('form-group-modern', className)}>
      <input {...inputProps} style={{ display: 'none' }} />
      {label && (
        <label className="label-modern">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropzone (only when empty) */}
      {images.length === 0 && (
        <div
          {...rootProps}
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
              <p className="text-primary-600 font-medium">Зургуудыг энд оруулна уу...</p>
            ) : (
              <>
                <p className="text-neutral-700 font-medium mb-1">
                  Зурагыг чирж оруулах, эсвэл дарж сонгоно уу
                </p>
                <p className="text-sm text-neutral-500">
                  Хамгийн ихдээ {maxImages} зураг, тус бүр {maxSize / 1024 / 1024}МБ
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}

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

      {/* Image Preview Grid + Hero */}
      {images.length > 0 && (
        <div className="mt-4">
          <div className="w-100 mb-3 rounded border border-neutral-200 overflow-hidden" style={{ minHeight: 260 }}>
            <div className="position-relative w-100" style={{ paddingBottom: '56.25%' }}>
              <img
                src={buildPreview(images[0])}
                alt="Cover"
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
              <div className="position-absolute top-2 end-2 d-flex gap-2">
                <span className="badge bg-primary">Нүүр зураг</span>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => removeImage(images[0].id ?? 0)}
                >
                  <FiX />
                </button>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3">
            {images.slice(1).map((image, idx) => {
              const src = buildPreview(image);
              const key = image.id ?? idx + 1;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="position-relative rounded border border-neutral-200 bg-neutral-100 overflow-hidden"
                  style={{ width: thumbnailSize, height: thumbnailSize }}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={`Upload ${idx + 2}`}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                      <FiImage size={32} />
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-light position-absolute top-50 start-50 translate-middle"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id ?? idx + 1);
                    }}
                    style={{ opacity: 0.9 }}
                  >
                    <FiX />
                  </button>
                </motion.div>
              );
            })}

            {images.length < maxImages && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="d-flex flex-column align-items-center justify-content-center border border-dashed border-secondary rounded"
                style={{ width: thumbnailSize, height: thumbnailSize, cursor: 'pointer', background: '#f8fafc' }}
                {...rootProps}
              >
                <FiImage className="text-secondary mb-1" size={28} />
                <span className="text-xs text-secondary text-center">Нэмэх</span>
              </motion.div>
            )}
          </div>

          <p className="text-sm text-neutral-600 mt-3 mb-0">
            {maxImages}-аас {images.length} зураг оруулсан
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Эхний зураг нүүр зураг болно.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
