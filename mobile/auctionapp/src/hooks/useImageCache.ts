import { useState, useEffect } from 'react';
import { Image } from 'react-native';

/**
 * Custom hook for preloading and caching images
 * @param imageUris - Array of image URIs to preload
 */
export function useImageCache(imageUris: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImages = async () => {
      const promises = imageUris.map((uri) => {
        return new Promise<void>((resolve) => {
          Image.prefetch(uri)
            .then(() => {
              setLoadedImages((prev) => new Set(prev).add(uri));
              resolve();
            })
            .catch(() => {
              setFailedImages((prev) => new Set(prev).add(uri));
              resolve();
            });
        });
      });

      await Promise.all(promises);
    };

    if (imageUris.length > 0) {
      preloadImages();
    }
  }, [imageUris]);

  return {
    loadedImages,
    failedImages,
    isImageLoaded: (uri: string) => loadedImages.has(uri),
    isImageFailed: (uri: string) => failedImages.has(uri),
  };
}


